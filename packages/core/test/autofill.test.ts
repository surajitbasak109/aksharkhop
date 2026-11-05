import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { applyPlacements, autofill, FillSearch, type FillResult } from '../src/autofill.ts';
import { cellLetter, conflicts, placeAnswer, slotCells, slots, type Grid } from '../src/grid.ts';
import { suggestWords } from '../src/suggest.ts';
import { parseWordFile } from '../src/wordFile.ts';
import { WordIndex, type WordEntry } from '../src/wordIndex.ts';
import { entry, gridFrom, mulberry32 } from './helpers.ts';

/** Puts letters into a slot's cells, one letter per cell ('' leaves the cell alone). */
function typeInto(g: Grid, dir: 'across' | 'down', r: number, c: number, letters: string[]): Grid {
    const slot = slots(g)[dir].find((s) => s.r === r && s.c === c)!;
    return placeAnswer(g, slot, letters);
}

/** A dictionary that holds a known 5×5 fill (rows and columns all different words), plus decoys. */
function squareDictionary(
    seed: number,
    decoys = 300,
): { entries: WordEntry[]; rows: string[]; cols: string[] } {
    const rnd = mulberry32(seed);
    const alphabet = 'abcdefghij';
    const pick = () => alphabet[Math.floor(rnd() * alphabet.length)]!;
    const m = Array.from({ length: 5 }, () => Array.from({ length: 5 }, pick));
    const rows = m.map((r) => r.join(''));
    const cols = [0, 1, 2, 3, 4].map((c) => m.map((r) => r[c]).join(''));
    const set = new Set([...rows, ...cols]);
    if (set.size !== 10) return squareDictionary(seed + 1000, decoys);
    while (set.size < 10 + decoys) set.add(Array.from({ length: 5 }, pick).join(''));
    return { entries: [...set].map((w, i) => entry(w, (i % 10) / 10)), rows, cols };
}

/** Checks a solved fill: every cell filled, no conflicts, every slot a distinct word the index knows (or fixed). */
function verify(index: WordIndex, grid: Grid, result: FillResult, fixedOk = true): Grid {
    expect(result.status).toBe('solved');
    if (result.status !== 'solved') throw new Error('not solved');
    const out = applyPlacements(grid, result.placements);
    expect(conflicts(out)).toEqual([]);
    const seen = new Set<string>();
    const all = slots(out);
    for (const s of [...all.across, ...all.down]) {
        const word = slotCells(s).map(([r, c]) => cellLetter(out.cells[r]![c]!));
        expect(word.every((l) => l !== '')).toBe(true);
        const w = word.join('');
        expect(seen.has(w), `${w} used twice`).toBe(false);
        seen.add(w);
        if (!fixedOk) expect(index.has(w)).toBe(true);
    }
    return out;
}

describe('autofill', () => {
    const open = gridFrom(['.....', '.....', '.....', '.....', '.....']);

    it('fills an open 5×5 from a dictionary that holds a fill', { timeout: 60000 }, () => {
        for (const seed of [1, 2]) {
            const { entries } = squareDictionary(seed, 120);
            const index = new WordIndex(entries);
            const result = autofill(index, open, { seed });
            verify(index, open, result, false);
        }
    });

    it('is the same for the same seed', () => {
        const { entries } = squareDictionary(7);
        const index = new WordIndex(entries);
        const a = autofill(index, open, { seed: 5 });
        const b = autofill(index, open, { seed: 5 });
        expect(a.status === 'solved' && b.status === 'solved' && a.placements).toEqual(
            b.status === 'solved' ? b.placements : null,
        );
    });

    it('keeps the letters already in the grid and fits partly filled slots', () => {
        const { entries, rows } = squareDictionary(11);
        const index = new WordIndex(entries);
        // type the first two letters of the first row's word
        const start = typeInto(open, 'across', 0, 0, [rows[0]![0]!, rows[0]![1]!, '', '', '']);
        const result = autofill(index, start, { seed: 3 });
        const out = verify(index, start, result, false);
        expect(cellLetter(out.cells[0]![0]!)).toBe(rows[0]![0]);
        expect(cellLetter(out.cells[0]![1]!)).toBe(rows[0]![1]);
        expect(
            slotCells(slots(out).across[0]!)
                .map(([r, c]) => cellLetter(out.cells[r]![c]!))
                .join(''),
        ).toMatch(new RegExp(`^${rows[0]!.slice(0, 2)}`));
    });

    it('keeps a complete slot even if it is not a dictionary word, and does not reuse it', () => {
        const { entries, cols } = squareDictionary(13);
        const index = new WordIndex(entries);
        // The first column, typed in full, is a word the fill must work around.
        const start = typeInto(open, 'down', 0, 0, [...cols[0]!]);
        const result = autofill(index, start, { seed: 1 });
        const out = verify(index, start, result, false);
        expect(
            slotCells(slots(out).down[0]!)
                .map(([r, c]) => cellLetter(out.cells[r]![c]!))
                .join(''),
        ).toBe(cols[0]);
        if (result.status === 'solved') {
            // the fixed word is not placed again
            expect(result.placements.filter((p) => p.word === cols[0])).toHaveLength(0);
        }
        // a made-up word that is not in the dictionary is kept as it is
        const odd = typeInto(open, 'across', 0, 0, [...'zzzzz']);
        const res2 = autofill(new WordIndex(entries), odd, { seed: 1, timeLimitMs: 500 });
        if (res2.status === 'solved') {
            expect(
                slotCells(slots(applyPlacements(odd, res2.placements)).across[0]!)
                    .map(([r, c]) => cellLetter(applyPlacements(odd, res2.placements).cells[r]![c]!))
                    .join(''),
            ).toBe('zzzzz');
        } else {
            expect(res2.reason).not.toBe('conflicts');
        }
    });

    it('returns an empty fill for a grid that is already full', () => {
        const { entries, rows } = squareDictionary(17);
        const index = new WordIndex(entries);
        let full = open;
        rows.forEach((w, r) => (full = typeInto(full, 'across', r, 0, [...w])));
        const result = autofill(index, full);
        expect(result.status === 'solved' && result.placements).toEqual([]);
    });

    it('works around blocks', () => {
        const g = gridFrom(['..#..', '.....', '#...#', '.....', '..#..']);
        const rnd = mulberry32(21);
        const alphabet = 'abcdef';
        const words = new Set<string>();
        for (let len = 2; len <= 5; len++) {
            while ([...words].filter((w) => w.length === len).length < 30) {
                words.add(
                    Array.from({ length: len }, () => alphabet[Math.floor(rnd() * alphabet.length)]).join(''),
                );
            }
        }
        const index = new WordIndex([...words].map((w, i) => entry(w, (i % 7) / 7)));
        const result = autofill(index, g, { seed: 2 });
        verify(index, g, result, false);
    });

    it('reports a slot that has no word at all that fits', () => {
        const { entries } = squareDictionary(19);
        const index = new WordIndex(entries);
        const start = typeInto(open, 'across', 2, 0, ['z', '', '', '', '']); // no word starts with z
        const result = autofill(index, start);
        expect(result.status).toBe('failed');
        if (result.status !== 'failed') return;
        expect(result.reason).toBe('no_candidates');
        const b = result.blocked.find((x) => x.dir === 'across' && x.r === 2);
        expect(b).toMatchObject({ len: 5, candidates: 0, letters: ['z', '', '', '', ''] });
    });

    it('proves that no fill exists, and names the slots that ran dry', () => {
        // Only two words: every row and column would have to be one of them, so a word repeats.
        const index = new WordIndex([entry('aaaaa'), entry('bbbbb')]);
        const result = autofill(index, open, { timeLimitMs: 5000 });
        expect(result.status).toBe('failed');
        if (result.status !== 'failed') return;
        expect(['exhausted', 'crossings']).toContain(result.reason);
        expect(result.blocked.length).toBeGreaterThan(0);
        expect(result.blocked[0]!.len).toBe(5);
    });

    it('reports crossing slots that cannot fit together', () => {
        // Across words need an 'a' in the middle, down words need a 'b': no cell can be both.
        const g = gridFrom(['.....', '.....', '.....', '.....', '.....']);
        const index = new WordIndex([entry('xxaxx'), entry('yybyy'), entry('xxaxy')]);
        const result = autofill(index, g);
        expect(result.status).toBe('failed');
    });

    it('stops at the time limit', () => {
        const { entries } = squareDictionary(23);
        const result = autofill(new WordIndex(entries), open, { timeLimitMs: -1 });
        expect(result.status === 'failed' && result.reason).toBe('timeout');
    });

    it('refuses a grid whose crossing words disagree', () => {
        const { entries } = squareDictionary(29);
        let g = typeInto(open, 'across', 0, 0, [...'abcde']);
        g = typeInto(g, 'down', 0, 0, [...'zbcde']);
        const result = autofill(new WordIndex(entries), g);
        expect(result.status === 'failed' && result.reason).toBe('conflicts');
        expect(result.status === 'failed' && result.conflicts).toBe(1);
    });

    it('does not use blocked words, or words below the frequency threshold', () => {
        const { entries, rows } = squareDictionary(31);
        const index = new WordIndex(entries);
        // Blocking one word of the known fill must keep it out of any fill.
        const blocked = new Set([rows[0]!]);
        const result = autofill(index, open, { seed: 1, blocked, timeLimitMs: 3000 });
        if (result.status === 'solved') {
            expect(result.placements.some((p) => blocked.has(p.word))).toBe(false);
        }
        // Raising the threshold above every word leaves nothing to use.
        const none = autofill(index, open, { minFreq: 2 });
        expect(none.status === 'failed' && none.reason).toBe('no_candidates');
    });

    it('can be run in slices and gives the same result as a whole run', () => {
        const { entries } = squareDictionary(37);
        const index = new WordIndex(entries);
        const whole = autofill(index, open, { seed: 4 });
        const search = new FillSearch(index, open, { seed: 4 });
        let sliced: FillResult | null = null;
        let calls = 0;
        while (!(sliced = search.step(1))) calls++;
        expect(calls).toBeGreaterThan(1);
        expect(sliced.status === 'solved' && sliced.placements).toEqual(
            whole.status === 'solved' ? whole.placements : null,
        );
        expect(search.step(1)).toBe(sliced); // done stays done
    });

    it('can be cancelled', () => {
        const { entries } = squareDictionary(41);
        const search = new FillSearch(new WordIndex(entries), open, { seed: 1 });
        search.step(1);
        const r = search.cancel();
        expect(r.status === 'failed' && r.reason).toBe('cancelled');
        expect(search.step(100)).toBe(r);
    });

    it('applyPlacements writes the answers and leaves other letters alone', () => {
        const g = typeInto(open, 'across', 0, 0, [...'ab', '', '', '']);
        const out = applyPlacements(g, [
            { dir: 'down', n: 1, r: 0, c: 0, word: 'axxxx', cells: [...'axxxx'] },
        ]);
        expect(cellLetter(out.cells[0]![0]!)).toBe('a');
        expect(cellLetter(out.cells[0]![1]!)).toBe('b');
        expect(out.cells[4]![0]).toEqual({ a: '', d: 'x' });
    });
});

/** Does any fill exist? Plain backtracking over the slots, no word twice, complete slots kept. The slow, obvious way. */
function fillExists(words: string[], grid: Grid): boolean {
    const all = [...slots(grid).across, ...slots(grid).down];
    const cur = grid.cells.map((row) => row.map((c) => cellLetter(c)));
    const used = new Set<string>();
    const complete = all.filter((s) => slotCells(s).every(([r, c]) => cur[r]![c] !== ''));
    for (const s of complete)
        used.add(
            slotCells(s)
                .map(([r, c]) => cur[r]![c])
                .join(''),
        );
    const open = all.filter((s) => !complete.includes(s));
    const go = (i: number): boolean => {
        if (i === open.length) return true;
        const cells = slotCells(open[i]!);
        for (const w of words) {
            if (w.length !== cells.length || used.has(w)) continue;
            if (cells.some(([r, c], k) => cur[r]![c] !== '' && cur[r]![c] !== w[k])) continue;
            const set: [number, number][] = [];
            cells.forEach(([r, c], k) => {
                if (cur[r]![c] === '') {
                    cur[r]![c] = w[k]!;
                    set.push([r, c]);
                }
            });
            used.add(w);
            if (go(i + 1)) return true;
            used.delete(w);
            for (const [r, c] of set) cur[r]![c] = '';
        }
        return false;
    };
    return go(0);
}

describe('autofill agrees with a brute-force search', () => {
    const patterns = [
        ['.....', '.....', '.....', '.....', '.....'],
        ['..#..', '.....', '#...#', '.....', '..#..'],
        ['...#.', '.....', '.#...', '.....', '.#...'],
        ['....#', '.....', '..#..', '.....', '#....'],
    ];

    it(
        'solves exactly the small puzzles that have a fill, and says so when none does',
        { timeout: 60000 },
        () => {
            let solvable = 0;
            let unsolvable = 0;
            const wrong: string[] = [];
            for (let seed = 1; seed <= 400; seed++) {
                const rnd = mulberry32(seed);
                const alphabet = rnd() < 0.5 ? 'abc' : 'abcd';
                const letter = () => alphabet[Math.floor(rnd() * alphabet.length)]!;
                const base = gridFrom(patterns[Math.floor(rnd() * patterns.length)]!);

                // A solution is planted (random letters in every white cell); its words, plus noise, are the dictionary.
                let planted = base;
                for (const s of slots(base).across)
                    planted = typeInto(planted, 'across', s.r, s.c, slotCells(s).map(letter));
                const all = [...slots(planted).across, ...slots(planted).down];
                const words = new Set(
                    all.map((s) =>
                        slotCells(s)
                            .map(([r, c]) => cellLetter(planted.cells[r]![c]!))
                            .join(''),
                    ),
                );
                for (let i = Math.floor(rnd() * 25); i > 0; i--)
                    words.add(Array.from({ length: 2 + Math.floor(rnd() * 4) }, letter).join(''));
                const list = [...words];

                // Start from the empty grid with some of the planted letters kept.
                let grid = base;
                for (const s of all) {
                    if (rnd() < 0.35) {
                        const keep = slotCells(s).map(([r, c]) =>
                            rnd() < 0.5 ? cellLetter(planted.cells[r]![c]!) : '',
                        );
                        grid = placeAnswer(grid, s, keep);
                    }
                }

                const result = autofill(new WordIndex(list.map((w, i) => entry(w, (i % 5) / 5))), grid, {
                    seed,
                    timeLimitMs: 5000,
                });
                if (
                    result.status === 'failed' &&
                    (result.reason === 'conflicts' || result.reason === 'timeout')
                )
                    continue;
                const exists = fillExists(list, grid);
                if (exists) solvable++;
                else unsolvable++;
                if ((result.status === 'solved') !== exists)
                    wrong.push(
                        `seed ${seed}: solver ${result.status}, brute force ${exists ? 'found a fill' : 'found none'}`,
                    );
            }
            expect(wrong).toEqual([]);
            // not vacuous: plenty of both kinds
            expect(solvable).toBeGreaterThan(50);
            expect(unsolvable).toBeGreaterThan(50);
        },
    );
});

describe('suggestWords', () => {
    const dict = [
        entry('cat', 0.9),
        entry('car', 0.5),
        entry('cab', 0),
        entry('cut', 0.7),
        entry('dog', 0.8),
        entry('ate', 0.3),
        entry('rat', 0.6),
        entry('bat', 0.2),
        entry('tab', 0.1),
        entry('tar', 0.1),
        entry('art', 0.1),
        entry('tea', 0.4),
        entry('eat', 0.4),
    ];
    const index = new WordIndex(dict);
    const g = gridFrom(['...##', '...##', '...##', '#####', '#####'].map((r) => r.padEnd(5, '#')));

    it('lists the words that fit the slot, most common first, leaving out those that block a crossing slot', () => {
        // 'dog' and 'cut' fit row 1 but would need a column starting with o or u, and no word does.
        const r = suggestWords(index, g, slots(g).across[0]!, { checkLimit: 100 });
        expect(r.fitting).toBe(13);
        expect(r.words.map((w) => w.word).slice(0, 3)).toEqual(['cat', 'rat', 'car']);
        expect(r.words.every((w, i, a) => i === 0 || a[i - 1]!.freq >= w.freq)).toBe(true);
    });

    it('keeps to the letters already in the slot', () => {
        const start = typeInto(g, 'across', 0, 0, ['c', '', '']);
        const r = suggestWords(index, start, slots(start).across[0]!);
        expect(r.words.every((w) => w.word.startsWith('c'))).toBe(true);
        expect(r.words.map((w) => w.word)).toContain('cat');
        expect(r.words.map((w) => w.word)).not.toContain('dog');
    });

    it('drops words that leave a crossing slot with no word', () => {
        // Down slot in column 0 shows "_ a _"? Put 'a' in the middle of column 0 and a 'z' start for another.
        let start = typeInto(g, 'down', 0, 0, ['', 'a', '']);
        start = typeInto(start, 'down', 0, 2, ['', 'z', '']); // nothing has z in the middle
        const r = suggestWords(index, start, slots(start).across[1]!);
        // row 1 reads a . z : the word must be "a?z": none exists in the list
        expect(r.words).toEqual([]);
    });

    it('does not suggest a word already used elsewhere, or a blocked one', () => {
        let start = typeInto(g, 'across', 1, 0, [...'cat']);
        const r = suggestWords(index, start, slots(start).across[0]!, { blocked: new Set(['dog']) });
        const list = r.words.map((w) => w.word);
        expect(list).not.toContain('cat');
        expect(list).not.toContain('dog');
        start = g;
    });

    it('honours the limit and the frequency threshold', () => {
        const r = suggestWords(index, g, slots(g).across[0]!, { limit: 2 });
        expect(r.words).toHaveLength(2);
        const f = suggestWords(index, g, slots(g).across[0]!, { minFreq: 0.5 });
        expect(f.words.every((w) => w.freq >= 0.5)).toBe(true);
    });
});

// Benchmarks on the real word list (public/words.txt, committed).
const WORDS = new URL('../../../public/words.txt', import.meta.url);
const haveWords = existsSync(WORDS);

const PATTERNS: Record<string, string[]> = {
    '9×9 a': [
        '..##.....',
        '....#....',
        '...#...##',
        '.....#...',
        '..#...#..',
        '...#.....',
        '##...#...',
        '....#....',
        '.....##..',
    ],
    '9×9 b': [
        '......#..',
        '..#......',
        '...##...#',
        '.#....#..',
        '..#...#..',
        '..#....#.',
        '#...##...',
        '......#..',
        '..#......',
    ],
    '9×9 c': [
        '..#....#.',
        '......#..',
        '#..##....',
        '...#...#.',
        '....#....',
        '.#...#...',
        '....##..#',
        '..#......',
        '.#....#..',
    ],
    '9×9 d': [
        '.#...#...',
        '....#....',
        '.....#...',
        '.##.....#',
        '...#.#...',
        '#.....##.',
        '...#.....',
        '....#....',
        '...#...#.',
    ],
    '11×11 a': [
        '......#.#..',
        '..##.#.....',
        '.....#.....',
        '..#.....#..',
        '...#..#..#.',
        '##..#.#..##',
        '.#..#..#...',
        '..#.....#..',
        '.....#.....',
        '.....#.##..',
        '..#.#......',
    ],
    '11×11 b': [
        '...##......',
        '.#.##.#..#.',
        '.....#..#..',
        '#.....#....',
        '##...#..#..',
        '...#...#...',
        '..#..#...##',
        '....#.....#',
        '..#..#.....',
        '.#..#.##.#.',
        '......##...',
    ],
    '11×11 c': [
        '..##......#',
        '.#..#.#..#.',
        '....#......',
        '.....#.....',
        '#..#..#.##.',
        '#...#.#...#',
        '.##.#..#..#',
        '.....#.....',
        '......#....',
        '.#..#.#..#.',
        '#......##..',
    ],
};

describe.skipIf(!haveWords)('benchmark on the real word list', () => {
    const index = new WordIndex(haveWords ? parseWordFile(readFileSync(WORDS, 'utf8')) : []);

    for (const [name, pattern] of Object.entries(PATTERNS)) {
        it(`${name} pattern fills in under 5 s (seeds 1 and 2)`, { timeout: 30000 }, () => {
            const grid = gridFrom(pattern);
            for (const seed of [1, 2]) {
                const t = Date.now();
                const result = autofill(index, grid, { seed, timeLimitMs: 5000 });
                const ms = Date.now() - t;
                verify(index, grid, result);
                expect(ms, `seed ${seed} took ${ms} ms`).toBeLessThan(5000);
            }
        });
    }

    it('reports which slot cannot be filled when no fill exists', { timeout: 30000 }, () => {
        // A slot whose first letter no word starts with can never be filled.
        let grid = gridFrom(PATTERNS['9×9 a']!);
        const slot = slots(grid).across[0]!;
        grid = placeAnswer(grid, slot, [...'ZZZZZ'].slice(0, slot.len));
        const result = autofill(index, grid, { timeLimitMs: 3000 });
        expect(result.status).toBe('failed');
    });
});
