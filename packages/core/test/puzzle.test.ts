import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
    checkAnswer,
    conflicts,
    gridStats,
    isSymmetric,
    placeAnswer,
    slotAt,
    toggleBlock,
    type Grid,
} from '../src/grid.ts';
import { formatJson } from '../src/json.ts';
import {
    clueKey,
    createPuzzle,
    parsePuzzle,
    serializePuzzle,
    toSaveFile,
    type Puzzle,
} from '../src/puzzle.ts';

function place(g: Grid, r: number, c: number, dir: 'across' | 'down', word: string): Grid {
    const slot = slotAt(g, r, c, dir)!;
    const check = checkAnswer(word, slot.len);
    if (!check.ok) throw new Error(check.errors.map((e) => e.en).join(' '));
    return placeAnswer(g, slot, check.cells);
}

/** An 11×11 puzzle with symmetric blocks, some answers, a conflict and a clue. */
function sample(): Puzzle {
    const p = createPuzzle(11, 11);
    let g = p.grid;
    for (const [r, c] of [
        [0, 5],
        [1, 5],
        [2, 2],
        [3, 7],
        [4, 0],
        [4, 1],
        [5, 4],
        [5, 5],
    ]) {
        g = toggleBlock(g, r!, c!, true);
    }
    g = place(g, 0, 0, 'across', 'কমলালেবু');
    g = place(g, 0, 0, 'down', 'কলকাতা');
    g = place(g, 0, 1, 'down', 'পরিবার'); // conflicts with ম at (0,1)
    g = place(g, 10, 6, 'across', 'পরিবারের');
    return {
        ...p,
        title: 'শব্দছক ১',
        author: 'পরীক্ষা',
        grid: g,
        clues: { [clueKey('across', 0, 0)]: 'ফল' },
    };
}

describe('save file', () => {
    it('round-trips: serialize → parse → serialize is byte-identical', () => {
        const text = serializePuzzle(sample());
        const parsed = parsePuzzle(text);
        expect(parsed.ok).toBe(true);
        if (!parsed.ok) return;
        expect(serializePuzzle(parsed.puzzle)).toBe(text);
        expect(parsed.puzzle).toEqual({ ...sample(), clues: { [clueKey('across', 0, 0)]: 'ফল' } });
    });

    it('round-trips an empty puzzle of every size', () => {
        for (const [r, c] of [
            [5, 5],
            [9, 9],
            [15, 5],
            [15, 15],
        ]) {
            const text = serializePuzzle(createPuzzle(r, c));
            const parsed = parsePuzzle(text);
            expect(parsed.ok && serializePuzzle(parsed.puzzle)).toBe(text);
        }
    });

    it('writes the planned fields, Bengali unescaped, one grid row per line', () => {
        const p = sample();
        const file = toSaveFile(p);
        expect(Object.keys(file)).toEqual([
            'version',
            'title',
            'author',
            'size',
            'symmetry',
            'grid',
            'typed',
            'clues',
        ]);
        expect(file.grid[0]!.slice(0, 6)).toEqual(['ক', 'ম', 'লা', 'লে', 'বু', null]);
        expect(file.typed.down[0]![1]).toBe('প');
        expect(file.clues.across[0]).toEqual({
            num: 1,
            row: 0,
            col: 0,
            len: 5,
            answer: 'কমলালেবু',
            clue: 'ফল',
        });
        const text = serializePuzzle(p);
        expect(text).toContain('"title": "শব্দছক ১"');
        expect(text).toContain('        ["ক", "ম", "লা", "লে", "বু", null,');
        expect(text.endsWith('\n')).toBe(true);
    });

    it('gives a conflicting slot its own word as the answer', () => {
        const file = toSaveFile(sample());
        expect(file.clues.down.find((c) => c.num === 2)?.answer).toBe('পরিবার');
        expect(file.clues.across[0]?.answer).toBe('কমলালেবু');
    });

    it('leaves the answer empty while a slot has empty cells', () => {
        const file = toSaveFile(sample());
        const down6 = file.clues.down.find((c) => c.row === 0 && c.col === 6);
        expect(down6?.answer).toBe('');
    });

    it('keeps the decomposed nukta letters', () => {
        let g = createPuzzle(5, 5).grid;
        g = place(g, 0, 0, 'across', 'বাড়িওয়ালা');
        const text = serializePuzzle({ ...createPuzzle(5, 5), grid: g });
        expect(text).toContain('ড়ি');
        expect(text).not.toContain('ড়');
    });
});

describe('fixture built by hand in the browser (test/fixtures/built-11x11.json)', () => {
    const text = readFileSync(new URL('fixtures/built-11x11.json', import.meta.url), 'utf8');

    it('opens and saves back byte-identical', () => {
        const parsed = parsePuzzle(text);
        expect(parsed.ok).toBe(true);
        expect(parsed.ok && serializePuzzle(parsed.puzzle)).toBe(text);
    });

    it('is a full symmetric 11×11 with the three conflicts made on purpose', () => {
        const parsed = parsePuzzle(text);
        if (!parsed.ok) throw new Error('fixture does not parse');
        const g = parsed.puzzle.grid;
        expect([g.rows, g.cols]).toEqual([11, 11]);
        expect(isSymmetric(g)).toBe(true);
        expect(gridStats(g)).toEqual({ white: 103, filled: 103, blocks: 18, conflicts: 3 });
        expect(conflicts(g).map((x) => `${x.across}/${x.down}`)).toEqual(['স/আ', 'প/মা', 'স/র']);
    });
});

describe('parsePuzzle errors', () => {
    const good = () => JSON.parse(serializePuzzle(sample()));
    const codes = (data: unknown) => {
        const r = parsePuzzle(typeof data === 'string' ? data : JSON.stringify(data));
        return r.ok ? [] : r.errors.map((e) => e.code);
    };

    it('accepts a BOM', () => {
        expect(parsePuzzle('﻿' + serializePuzzle(sample())).ok).toBe(true);
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- the tests poke at loose JSON
    it.each<[string, (d: Record<string, any>) => unknown, string]>([
        ['bad JSON', () => '{', 'json'],
        ['not an object', () => [], 'shape'],
        ['wrong version', (d) => ({ ...d, version: 2 }), 'version'],
        ['title not text', (d) => ({ ...d, title: 3 }), 'title'],
        ['author missing', (d) => ({ ...d, author: undefined }), 'author'],
        ['symmetry not boolean', (d) => ({ ...d, symmetry: 'yes' }), 'symmetry'],
        ['size too small', (d) => ({ ...d, size: { rows: 4, cols: 11 } }), 'size'],
        ['size too big', (d) => ({ ...d, size: { rows: 11, cols: 16 } }), 'size'],
        ['ragged grid', (d) => ({ ...d, grid: [...d.grid.slice(0, 10), d.grid[10].slice(1)] }), 'grid_shape'],
        ['typed missing', (d) => ({ ...d, typed: {} }), 'grid_shape'],
        [
            'block in one layer only',
            (d) => {
                d.typed.down[0][5] = '';
                return d;
            },
            'block_mismatch',
        ],
        [
            'two aksharas in a cell',
            (d) => {
                d.grid[0][0] = 'কম';
                d.typed.across[0][0] = 'কম';
                return d;
            },
            'cell_letter',
        ],
        [
            'shown letter differs from typed',
            (d) => {
                d.grid[0][0] = 'খ';
                return d;
            },
            'cell_mismatch',
        ],
        [
            'clues not a list',
            (d) => {
                d.clues.down = 'x';
                return d;
            },
            'clues',
        ],
        [
            'malformed clue',
            (d) => {
                d.clues.across.push({ num: 1 });
                return d;
            },
            'clue_item',
        ],
    ])('%s', (_name, change, code) => {
        expect(codes(change(good()))).toContain(code);
    });

    it('reports rows and columns 1-based, in both languages', () => {
        const d = good();
        d.grid[2][3] = 'কম';
        d.typed.across[2][3] = 'কম';
        const r = parsePuzzle(JSON.stringify(d));
        expect(r.ok).toBe(false);
        if (r.ok) return;
        expect(r.errors[0]!.en).toContain('row 3, column 4');
        expect(r.errors[0]!.bn).toContain('সারি ৩, কলাম ৪');
    });
});

describe('formatJson', () => {
    it('keeps flat arrays and objects inline and nests the rest', () => {
        expect(formatJson({ a: [1, null, 'ক'], b: [{ x: 1 }, { y: [2] }], c: {}, d: [] })).toBe(
            '{\n    "a": [1, null, "ক"],\n    "b": [\n        {"x": 1},\n        {\n            "y": [2]\n        }\n    ],\n    "c": {},\n    "d": []\n}\n',
        );
    });
});
