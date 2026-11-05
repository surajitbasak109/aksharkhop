#!/usr/bin/env python3
"""Builds the shipped word list from the raw sources in data/raw/.

    python3 scripts/build_wordlist.py

Writes:
    public/words.bn.json                    the full list (words from "ship" sources only); NOT committed
    public/words.txt                        the small list the browser loads (word + frequency only); committed
    data/processed/words.enriched.jsonl     part of speech + English glosses (build-only text, NOT shipped)
    data/processed/wordlist_report.md       the same stats that are printed
    data/processed/spelling_variant_candidates.tsv   ি/ী and ু/ূ pairs for the human to decide

Rules (see data/SOURCES.md):
  * Only words found in a "ship" source (kawshik, MIT) can enter the shipped list.
  * Build-only sources (Hunspell, MinhasKamal, IndoWordNet, OpenSubtitles, Kaikki) may tag a word with
    where else it was found, rank it, or enrich it. They never add words and never put their text in the list.
  * Cells come from the Node CLI (packages/core), so there is a single segmenter implementation.
"""

from __future__ import annotations

import csv
import hashlib
import json
import math
import re
import subprocess
import sys
import tempfile
import unicodedata
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / 'data' / 'raw'
OUT_LIST = ROOT / 'public' / 'words.bn.json'
OUT_TXT = ROOT / 'public' / 'words.txt'
OUT_ENRICHED = ROOT / 'data' / 'processed' / 'words.enriched.jsonl'
OUT_REPORT = ROOT / 'data' / 'processed' / 'wordlist_report.md'
BLOCKLIST = ROOT / 'data' / 'blocklist.txt'
VARIANTS = ROOT / 'data' / 'spelling_variants.tsv'

MIN_CELLS = 2
MAX_CELLS = 15  # Pataparbon's grid limit

ZW = re.compile('[‌‍]')
HASANTA = '্'
CONSONANT = re.compile('[ক-হড়ঢ়য়ৰৱ]')
INDEP_VOWEL = re.compile('[অ-ঌএঐওঔৠৡ]')

# source name -> (raw folder, role)
SHIP_SOURCE = 'kawshik'
BUILD_ONLY = ['hunspell', 'minhas', 'iwn', 'opensubtitles', 'kaikki']


def key(word: str) -> str:
    """The form used to compare words: NFC, no ZWJ/ZWNJ, no surrounding space or BOM."""
    return ZW.sub('', unicodedata.normalize('NFC', word.replace('﻿', '').strip()))


def reject_reason(word: str) -> str | None:
    """Why a raw entry cannot be a crossword answer, or None if it can."""
    if word == '':
        return 'empty'
    for ch in word:
        if re.match('[A-Za-z]', ch):
            return 'latin'
        if ch.isdigit() or '০' <= ch <= '৯':
            return 'digit'
        if ch.isspace() or ch == '_':
            return 'whitespace'
        if ord(ch) < 0x80 or ch in '।॥‐–—‘’“”':
            return 'punctuation'
        if not ('ঀ' <= ch <= '৿'):
            return 'non_bengali'
    return None


def cell_problem(cells: list[str]) -> str | None:
    """Why a segmented word is broken, or None. Every cell must be one real akshara."""
    for cell in cells:
        if cell in ('ৎ', 'ং', 'ঃ'):  # ৎ ং ঃ stand alone, as in Pataparbon
            continue
        if not (CONSONANT.match(cell[0]) or INDEP_VOWEL.match(cell[0])):
            return 'broken_cell'
        if cell.endswith(HASANTA):
            return 'trailing_hasanta'
    return None


# ---------------------------------------------------------------- loaders


def read_lines(path: Path) -> list[str]:
    return path.read_text(encoding='utf-8').split('\n')


def load_kawshik() -> list[str]:
    return [w.strip() for w in read_lines(RAW / 'kawshikbuet17-bengali-words' / 'train.csv')[1:]]


def load_hunspell() -> set[str]:
    words = set()
    for line in read_lines(RAW / 'hunspell-bn_BD' / 'bn_BD.dic')[1:]:
        stem = line.split('/')[0].lstrip('*')
        if stem and reject_reason(key(stem)) is None:
            words.add(key(stem))
    return words


def load_minhas() -> set[str]:
    words = set()
    for line in read_lines(RAW / 'minhaskamal-bengalidictionary' / 'BengaliWordList_439.txt'):
        w = key(line)
        if reject_reason(w) is None:
            words.add(w)
    return words


def load_iwn() -> set[str]:
    data = json.loads((RAW / 'cfilt-iwn-wordlists' / 'bengali.json').read_text(encoding='utf-8'))
    words = set()
    for item in data['data']:
        w = key(item['word'])
        if reject_reason(w) is None:
            words.add(w)
    return words


def load_opensubtitles() -> dict[str, int]:
    counts: dict[str, int] = {}
    with open(RAW / 'orgtre-opensubtitles-bn' / 'bn_top_words.csv', encoding='utf-8', newline='') as f:
        for row in csv.DictReader(f):
            w = key(row['word'])
            if reject_reason(w) is None:
                counts[w] = counts.get(w, 0) + int(row['count'])
    return counts


def load_kaikki() -> dict[str, list[dict]]:
    """headword -> [{"pos": ..., "glosses": [...]}]. English Wiktionary text: build-only."""
    entries: dict[str, list[dict]] = {}
    path = RAW / 'kaikki-bengali' / 'kaikki.org-dictionary-Bengali.jsonl'
    for line in read_lines(path):
        if not line.strip():
            continue
        d = json.loads(line)
        w = key(d.get('word', ''))
        if reject_reason(w) is not None:
            continue
        glosses = []
        for sense in d.get('senses', []):
            glosses.extend(g for g in sense.get('glosses', []) if g)
        entries.setdefault(w, []).append({'pos': d.get('pos', ''), 'glosses': glosses[:4]})
    return entries


def load_word_file(path: Path) -> set[str]:
    """data/blocklist.txt style: one word per line, # comments."""
    if not path.exists():
        return set()
    return {key(l) for l in read_lines(path) if l.strip() and not l.startswith('#')}


def load_variants(path: Path) -> dict[str, str]:
    """data/spelling_variants.tsv: bd<TAB>wb. Returns {bd_spelling: wb_spelling}."""
    out: dict[str, str] = {}
    if not path.exists():
        return out
    for line in read_lines(path):
        if line.strip() and not line.startswith('#'):
            parts = line.split('\t')
            if len(parts) >= 2:
                out[key(parts[0])] = key(parts[1])
    return out


# ---------------------------------------------------------------- segmentation


def segment_all(words: list[str]) -> dict[str, list[str]]:
    """Cells for each word, from the Node CLI (the only segmenter)."""
    if not words:
        return {}
    with tempfile.TemporaryDirectory() as tmp:
        src = Path(tmp) / 'words.txt'
        src.write_text('\n'.join(words) + '\n', encoding='utf-8')
        res = subprocess.run(
            ['node', 'packages/core/src/cli.ts', '--json', str(src)],
            cwd=ROOT, capture_output=True, text=True, encoding='utf-8', check=True,
        )
    rows = [json.loads(l) for l in res.stdout.split('\n') if l]
    if len(rows) != len(words):
        raise RuntimeError(f'segmenter returned {len(rows)} rows for {len(words)} words')
    return {w: r['cells'] for w, r in zip(words, rows)}


# ---------------------------------------------------------------- build


def scale_frequency(counts: dict[str, int]) -> dict[str, float]:
    """Log scale to (0, 1]: the most common word is 1.0. Words without a count are left out."""
    if not counts:
        return {}
    top = math.log1p(max(counts.values()))
    return {w: round(math.log1p(c) / top, 4) for w, c in counts.items()}


def clean_shipped(raw_words: list[str], blocklist: set[str], variants: dict[str, str], segmenter=segment_all):
    """Returns (kept {word: cells}, dropped Counter by reason, examples {reason: first words})."""
    dropped: Counter = Counter()
    examples: dict[str, list[str]] = {}

    def drop(reason: str, word: str) -> None:
        dropped[reason] += 1
        if len(examples.setdefault(reason, [])) < 8:
            examples[reason].append(word)

    candidates: list[str] = []
    for raw in raw_words:
        w = key(raw)
        reason = reject_reason(w)
        if reason:
            drop(reason, w)
        else:
            candidates.append(w)

    cells_of = segmenter(sorted(set(candidates)))
    kept: dict[str, list[str]] = {}
    for w in candidates:
        cells = cells_of[w]
        joined = ''.join(cells)  # ZWJ/ZWNJ are removed by the segmenter
        reason = cell_problem(cells)
        if reason:
            drop(reason, w)
        elif len(cells) < MIN_CELLS:
            drop('single_cell', w)
        elif len(cells) > MAX_CELLS:
            drop('too_long', w)
        elif joined in blocklist:
            drop('blocklist', w)
        elif joined in variants:
            drop('bd_variant', w)
        elif joined in kept:
            drop('duplicate', w)
        else:
            kept[joined] = cells
    return kept, dropped, examples


def build(raw_words, hunspell, minhas, iwn, subtitles, kaikki, blocklist, variants, segmenter=segment_all):
    kept, dropped, examples = clean_shipped(raw_words, blocklist, variants, segmenter)
    freq = scale_frequency(subtitles)
    sets = {'hunspell': hunspell, 'minhas': minhas, 'iwn': iwn, 'opensubtitles': subtitles, 'kaikki': kaikki}

    entries = []
    for w in sorted(kept):
        cells = kept[w]
        src = [SHIP_SOURCE] + [name for name in BUILD_ONLY if w in sets[name]]
        entries.append({'w': w, 'cells': cells, 'len': len(cells), 'freq': freq.get(w, 0.0), 'src': src, 'tags': []})
    return entries, dropped, examples


SWAPS = {'\u09bf': '\u09c0', '\u09c0': '\u09bf', '\u09c1': '\u09c2', '\u09c2': '\u09c1'}  # ি ী ু ূ


def variant_candidates(entries: list[dict]) -> list[tuple[dict, dict]]:
    """Pairs of listed words that differ only by ি/ী or ু/ূ in one place. For the human to decide
    which spelling is West Bengal; add the other one to data/spelling_variants.tsv."""
    by_word = {e['w']: e for e in entries}
    pairs = []
    for w, e in by_word.items():
        for i, ch in enumerate(w):
            if ch in SWAPS:
                other = by_word.get(w[:i] + SWAPS[ch] + w[i + 1:])
                if other and w < other['w']:
                    pairs.append((e, other))
    return sorted(pairs, key=lambda p: p[0]['w'])


def render_candidates(pairs: list[tuple[dict, dict]]) -> str:
    head = 'word_a\tword_b\tfreq_a\tfreq_b\tsrc_a\tsrc_b\n'
    rows = [f"{a['w']}\t{b['w']}\t{a['freq']}\t{b['freq']}\t{','.join(a['src'])}\t{','.join(b['src'])}" for a, b in pairs]
    return head + '\n'.join(rows) + '\n'


def render_list(entries: list[dict]) -> str:
    """One entry per line, so diffs stay readable. Same input always gives the same text."""
    lines = [json.dumps(e, ensure_ascii=False, separators=(',', ':')) for e in entries]
    return '{"version":1,"count":%d,"words":[\n%s\n]}\n' % (len(entries), ',\n'.join(lines))


WORD_FILE_HEADER = '# aksharkhop words v1'


def render_words_txt(entries: list[dict]) -> str:
    """The small list the browser loads: one word per line, then a tab and the frequency score when it is
    known (above 0). Cells are left out: the app splits each word with the same splitter as everywhere else.
    Must stay readable by packages/core/src/wordFile.ts. Same input always gives the same text."""
    lines = [WORD_FILE_HEADER]
    for e in entries:
        lines.append(f"{e['w']}\t{e['freq']}" if e['freq'] > 0 else e['w'])
    return '\n'.join(lines) + '\n'


def render_enriched(entries: list[dict], kaikki: dict[str, list[dict]]) -> str:
    out = []
    for e in entries:
        if e['w'] in kaikki:
            out.append(json.dumps({'w': e['w'], 'senses': kaikki[e['w']]}, ensure_ascii=False, separators=(',', ':')))
    return '\n'.join(out) + '\n'


def report(entries, dropped, examples, raw_count, subtitles, kawshik_keys, n_candidates) -> str:
    lines = ['# Word list build report', '']
    lines += [f'- Raw rows in the ship source: {raw_count}', f'- **Words in `public/words.bn.json`: {len(entries)}**', '']
    lines += ['## Dropped, by reason', '', '| Reason | Count | Examples |', '|---|---|---|']
    lines += [f'| {r} | {n} | {" ".join(examples.get(r, []))} |' for r, n in sorted(dropped.items(), key=lambda x: (-x[1], x[0]))]
    lines += ['', '## Words by cell length', '', '| Cells | Words |', '|---|---|']
    by_len = Counter(e['len'] for e in entries)
    lines += [f'| {n} | {by_len[n]} |' for n in sorted(by_len)]

    lines += ['', '## Where else each word was found (build-only sources)', '', '| Source | Words found |', '|---|---|']
    for name in BUILD_ONLY:
        lines.append(f'| {name} | {sum(1 for e in entries if name in e["src"])} |')
    support = Counter(len(e['src']) - 1 for e in entries)
    lines += ['', '| Other sources that have the word | Words |', '|---|---|']
    lines += [f'| {n} | {support[n]} |' for n in sorted(support)]

    ranked = [e for e in entries if e['freq'] > 0]
    lines += ['', f'## Frequency (OpenSubtitles)', '', f'- Words with a frequency: {len(ranked)}; without: {len(entries) - len(ranked)} (freq 0.0)']
    ranked.sort(key=lambda e: (-e['freq'], e['w']))
    lines += ['', '**Top 20:** ' + ', '.join(f'{e["w"]} ({e["freq"]})' for e in ranked[:20])]
    lines += ['', '**Bottom 20 with a frequency:** ' + ', '.join(f'{e["w"]} ({e["freq"]})' for e in ranked[-20:])]

    lines += ['', '## Spelling variants', '',
              f'{n_candidates} pairs of listed words differ only by ি/ী or ু/ূ. See data/processed/spelling_variant_candidates.tsv; '
              'decide which spelling is West Bengal and add the other to data/spelling_variants.tsv.']

    useful = [w for w in subtitles if len(w) > 1]
    top = sorted(useful, key=lambda w: -subtitles[w])[:5000]
    missing = [w for w in top if w not in kawshik_keys]
    lines += ['', '## Coverage check', '',
              f'Of the {len(top)} most common OpenSubtitles words, {len(top) - len(missing)} are in the ship source '
              f'and {len(missing)} are not (they cannot be added; see data/SOURCES.md). First 40 missing: '
              + ', '.join(missing[:40])]
    return '\n'.join(lines) + '\n'


def main() -> int:
    raw_words = load_kawshik()
    blocklist = load_word_file(BLOCKLIST)
    variants = load_variants(VARIANTS)
    kaikki = load_kaikki()
    subtitles = load_opensubtitles()

    entries, dropped, examples = build(
        raw_words, load_hunspell(), load_minhas(), load_iwn(), subtitles, kaikki, blocklist, variants
    )

    OUT_LIST.parent.mkdir(parents=True, exist_ok=True)
    OUT_ENRICHED.parent.mkdir(parents=True, exist_ok=True)
    text = render_list(entries)
    OUT_LIST.write_text(text, encoding='utf-8', newline='\n')
    txt = render_words_txt(entries)
    OUT_TXT.write_text(txt, encoding='utf-8', newline='\n')
    OUT_ENRICHED.write_text(render_enriched(entries, kaikki), encoding='utf-8', newline='\n')

    kawshik_keys = {key(w) for w in raw_words}
    pairs = variant_candidates(entries)
    (OUT_REPORT.parent / 'spelling_variant_candidates.tsv').write_text(render_candidates(pairs), encoding='utf-8', newline='\n')
    rep = report(entries, dropped, examples, len(raw_words), subtitles, kawshik_keys, len(pairs))
    OUT_REPORT.write_text(rep, encoding='utf-8', newline='\n')
    print(rep)
    print(f'sha256 of {OUT_LIST.relative_to(ROOT)}: {hashlib.sha256(text.encode("utf-8")).hexdigest()}')
    print(f'size: {len(text.encode("utf-8")) / 1e6:.1f} MB')
    print(f'sha256 of {OUT_TXT.relative_to(ROOT)}: {hashlib.sha256(txt.encode("utf-8")).hexdigest()}')
    print(f'size: {len(txt.encode("utf-8")) / 1e6:.2f} MB')
    return 0


if __name__ == '__main__':
    sys.exit(main())
