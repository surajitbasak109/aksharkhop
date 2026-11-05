# Data sources

Raw files live in `data/raw/<source>/` and are **never edited or committed** (`data/raw/` is gitignored). The word-list pipeline (Phase 2) reads them and writes processed files elsewhere.

Project is **non-commercial** (decision P0.1.1), so non-commercial licenses are allowed. If that ever changes, re-check every row marked "NC".

Downloaded 2026-11-04. Licenses below come from each source's own README/LICENSE file, copied into its folder where one exists. Check them again before publishing anything.

| Folder | Source | What we use it for | License | Notes |
|---|---|---|---|---|
| `kawshikbuet17-bengali-words/` | [Hugging Face: kawshikbuet17/bengali-words](https://huggingface.co/datasets/kawshikbuet17/bengali-words) `train.csv` | Headwords (main seed list) | MIT (per dataset card) | 78,672 words, one `word` column, alphabetical. 2 MB. |
| `cfilt-iwn-wordlists/` | [Hugging Face: cfilt/iwn_wordlists](https://huggingface.co/datasets/cfilt/iwn_wordlists) `bengali.json` | Headwords (IndoWordNet) | **CC BY-NC-SA 4.0 (NC)** | JSON `{"data":[{"word":…}]}`. Some entries have trailing spaces and underscores for multi-word terms (`বিরোধিতা_করা`): clean in Phase 2. 1.8 MB. Credit: IIT Bombay CFILT. |
| `hunspell-bn_BD/` | [LibreOffice/dictionaries `bn_BD`](https://github.com/LibreOffice/dictionaries/tree/master/bn_BD) `bn_BD.dic`, `bn_BD.aff`, `COPYING` | Headwords + spelling check | GPL v2 (`COPYING`) | `.dic` has about 87.6k stems with affix flags (`/p`): the flags are not words. Stems only, or expand with the `.aff` file. Includes abbreviations (`আ./`) and `*`-marked entries. **Bangladesh-oriented spelling**, so check against P0.1.5 (West Bengal). 2.4 MB. |
| `minhaskamal-bengalidictionary/` | [MinhasKamal/BengaliDictionary](https://github.com/MinhasKamal/BengaliDictionary) `BengaliWordList_439.txt`, `BengaliDictionary_93.csv`, `README.md`, `LICENSE` | Headwords; English↔Bengali glosses for clue drafting | GPL v3 (`LICENSE`) | `BengaliWordList_439.txt` has about 439k lines with a leading BOM; likely noisy, with misspellings and inflected forms. `BengaliDictionary_93.csv` is English→Bengali (`english,bengali,,`), about 93k lines. Not downloaded: the 25 MB XML, 15 MB JSON and the smaller word lists. The romanized phonetic frequency file was removed (it is Latin-script, so unusable). |
| `orgtre-opensubtitles-bn/` | [orgtre/top-open-subtitles-sentences](https://github.com/orgtre/top-open-subtitles-sentences) `bld/top_words/bn_top_words.csv` | Frequency (common vs. obscure) | Code CC BY 3.0; the lists carry the license of the underlying OpenSubtitles2018 corpus (see the repo README). I did not find a clear statement of that license, so treat it as **unverified** | 26,739 words, columns `word,count`. Everyday spoken Bengali, so literary words rank low. 0.6 MB. |
| `kaikki-bengali/` | [Kaikki.org Bengali](https://kaikki.org/dictionary/Bengali/) `kaikki.org-dictionary-Bengali.jsonl` | Meanings, part of speech, pronunciation (for clue drafting) | CC BY-SA (English Wiktionary content). Cite wiktextract (Tatu Ylonen). | 11,376 entries, 39 MB. JSONL keys include `word`, `pos`, `senses`, `sounds`, `etymology_text`. English glosses. |

## Ship or build-only (decided 2026-11-04, P0.3.2)

- **Ship:** data, or text copied from it, ends up in released files (the shipped word list, or clues exported to Pataparbon). The source's license then applies to those files.
- **Build-only:** used on the developer's machine to build, filter, check or rank. Nothing from it is copied into a released file.

Why: share-alike licenses (CC BY-SA, CC BY-NC-SA, GPL) would put the same license on the whole shipped word list, and mixing them gets messy. This is a practical choice, not legal advice.

| Folder | Decision | Rule |
|---|---|---|
| `kawshikbuet17-bengali-words/` | **Ship** (MIT) | Base of the shipped word list. Keep the MIT notice. |
| `hunspell-bn_BD/` | Build-only | Spelling check and dropping bad words. Not copied into the shipped list. |
| `minhaskamal-bengalidictionary/` | Build-only | Check words and English glosses. Not copied into the shipped list. |
| `cfilt-iwn-wordlists/` | Build-only | Allowed for a non-commercial project, but shipping it would put CC BY-NC-SA on the whole list. |
| `orgtre-opensubtitles-bn/` | Build-only | Ranking only. Ship the numeric frequency scores, not the list itself. License unclear. |
| `kaikki-bengali/` | Build-only | Meanings are input for drafting clues. Final clues are human-reviewed wording; if Wiktionary text is copied, add credit and CC BY-SA. |

Consequence: a word found only in a build-only source cannot go into the shipped list unless the human accepts that source's license. The pipeline (Phase 2) must record each word's `src` and **ship only words that appear in a "ship" source**.

Derived files: `public/words.bn.json` holds only kawshik's words plus numeric scores and source names. Kaikki's part of speech and English glosses are written to `data/processed/words.enriched.jsonl`, which is untracked and **must not be shipped**.

## Not downloaded (yet)

| Source | Why not |
|---|---|
| [ai4bharat/IndicCorpV2](https://huggingface.co/datasets/ai4bharat/IndicCorpV2) `data/bn.txt` (CC0) | **15,992,871,652 bytes (about 16 GB).** Only needed for frequency ranking. Start with the OpenSubtitles list; fetch part of it later if the ranking is poor. |
| Bengali Wikipedia, Bengali Wiktionary dump | Not needed yet |
| `shobdo`, `bangla-synonyms` (PyPI) | Not needed yet |

## Known issues to handle in Phase 2

1. Hunspell stems carry `/flags` that must be stripped or expanded.
2. Multi-word entries (underscores, spaces) and abbreviations must be dropped (crossword answers are single words).
3. Leading BOM in the MinhasKamal files; trailing spaces in the cfilt file.
4. The Hunspell and MinhasKamal lists lean toward Bangladesh spelling. West Bengal is the chosen policy (P0.1.5).
5. Different sources may write ড় ঢ় য় precomposed or decomposed. Normalize with NFC, which decomposes them (the same as Pataparbon).
6. Proper nouns appear (e.g. `কলকাতা` in Kaikki, `মালদা` in cfilt). Decide whether to keep them (crosswords usually allow place names).
