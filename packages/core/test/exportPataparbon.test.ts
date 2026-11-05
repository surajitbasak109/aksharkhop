import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { clueRows, clueSummary } from '../src/clues.ts';
import {
    buildPataparbon,
    exportPataparbon,
    importPataparbon,
    parseAnyPuzzle,
    validatePataparbon,
    type PataparbonExport,
} from '../src/exportPataparbon.ts';
import { clueKey, serializePuzzle, type Puzzle } from '../src/puzzle.ts';

const exampleText = readFileSync(
    new URL('../../../.claude/examples/pataparbon-export.json', import.meta.url),
    'utf8',
);
const example = JSON.parse(exampleText) as PataparbonExport;

function examplePuzzle(): Puzzle {
    const r = importPataparbon(exampleText);
    if (!r.ok) throw new Error(r.errors.map((e) => e.en).join('; '));
    return r.puzzle;
}

const codes = (data: unknown, rows?: number, cols?: number) =>
    validatePataparbon(data, rows, cols).map((e) => e.code);

/** A deep copy of the example that a test can break. */
const copy = () => structuredClone(example) as PataparbonExport;

describe('Pataparbon rules (validatePataparbon)', () => {
    it('accepts the example', () => {
        expect(validatePataparbon(example, 5, 5)).toEqual([]);
    });

    it('grid_missing', () => {
        expect(codes({})).toEqual(['grid_missing']);
        expect(codes({ grid: { cells: [] }, clues: {} })).toEqual(['grid_missing']);
    });

    it('size: fewer than 5 or more than 15 rows or columns', () => {
        const small = { grid: { cells: [[{ s: 'ক' }, { s: 'খ' }]] }, clues: {} };
        expect(codes(small)).toContain('size');
        const wide = {
            grid: { cells: Array.from({ length: 5 }, () => Array(16).fill({ s: 'ক' })) },
            clues: {},
        };
        expect(codes(wide).filter((c) => c === 'size')).toHaveLength(1);
    });

    it('size_mismatch: rows and columns given by the form differ from the grid', () => {
        expect(codes(example, 6, 5)).toEqual(['size_mismatch']);
        expect(codes(example, 5, 6)).toEqual(['size_mismatch']);
    });

    it('ragged: a row of another length stops the other checks', () => {
        const d = copy();
        d.grid.cells[2]!.pop();
        expect(codes(d)).toEqual(['ragged']);
    });

    it('cell_letter: empty, two aksharas, or not a string', () => {
        for (const s of ['', 'কখ', 5 as unknown as string]) {
            const d = copy();
            d.grid.cells[0]![0] = { s };
            expect(codes(d)).toEqual(['cell_letter']);
        }
    });

    it('cell_letter: ং ঃ ৎ do not share a cell with the letter before them', () => {
        const d = copy();
        d.grid.cells[0]![0] = { s: 'সং' };
        expect(codes(d)).toEqual(['cell_letter']);
        d.grid.cells[0]![0] = { s: 'ং' };
        expect(codes(d)).toEqual([]);
    });

    it('orphan_cell: a white cell in no entry', () => {
        const d = copy();
        // (1,1) is a block with white cells on every side only along row/column, make (1,1) white and
        // isolate it by blocking its neighbours.
        d.grid.cells[1]![1] = { s: 'ক' };
        d.grid.cells[0]![1] = { b: 1 };
        d.grid.cells[2]![1] = { b: 1 };
        d.grid.cells[1]![0] = { b: 1 };
        d.grid.cells[1]![2] = { b: 1 };
        expect(codes(d)).toContain('orphan_cell');
    });

    it('clue_missing_across / clue_missing_down', () => {
        const d = copy();
        d.clues.across.pop();
        d.clues.down.shift();
        expect(codes(d)).toEqual(['clue_missing_across', 'clue_missing_down']);
    });

    it('clue_empty: empty or blank text', () => {
        const d = copy();
        d.clues.across[0]!.clue = '';
        d.clues.down[0]!.clue = '   ';
        expect(codes(d)).toEqual(['clue_empty_across', 'clue_empty_down']);
    });

    it('clue_position: r, c or len differs from the grid, or is left out', () => {
        for (const key of ['r', 'c', 'len'] as const) {
            const d = copy();
            d.clues.across[1]![key] += 1;
            expect(codes(d)).toEqual(['clue_position_across']);
            delete (d.clues.across[1] as Partial<PataparbonExport['clues']['across'][0]>)[key];
            expect(codes(d)).toEqual(['clue_position_across']);
        }
        const d = copy();
        d.clues.down[2]!.len = 4;
        expect(codes(d)).toEqual(['clue_position_down']);
    });

    it('clue_extra: a clue with no entry', () => {
        const d = copy();
        d.clues.across.push({ n: 9, r: 0, c: 0, len: 5, clue: 'বাড়তি' });
        expect(codes(d)).toEqual(['clue_extra_across']);
        d.clues.down.push({ n: 7, r: 4, c: 4, len: 2, clue: 'বাড়তি' });
        expect(codes(d)).toEqual(['clue_extra_across', 'clue_extra_down']);
    });

    it('writes each message in Bengali and English with 1-based positions', () => {
        const d = copy();
        d.grid.cells[1]![0] = { s: '' };
        const [e] = validatePataparbon(d);
        expect(e!.en).toBe('Cell (row 2, column 1) must hold exactly one akshara.');
        expect(e!.bn).toBe('ঘর (সারি ২, কলাম ১)-এ ঠিক একটি অক্ষর থাকতে হবে।');
    });
});

describe('export', () => {
    it('re-exports the example unchanged (import → export)', () => {
        const out = exportPataparbon(examplePuzzle());
        expect(out.ok).toBe(true);
        if (!out.ok) return;
        expect(out.data).toEqual(example);
        expect(out.warnings).toEqual([]);
    });

    it('export → parse → re-export is identical, byte for byte', () => {
        const first = exportPataparbon(examplePuzzle());
        if (!first.ok) throw new Error('first export failed');
        const again = importPataparbon(first.json);
        if (!again.ok) throw new Error('import failed');
        const second = exportPataparbon(again.puzzle);
        expect(second.ok && second.json).toBe(first.json);
    });

    it('writes UTF-8 Bengali as-is, 4-space indent, across before down, sorted by n', () => {
        const out = exportPataparbon(examplePuzzle());
        if (!out.ok) throw new Error('export failed');
        expect(out.json).toContain('"s": "ক্ষ"');
        expect(out.json).not.toMatch(/\\u[0-9a-f]{4}/i);
        expect(out.json).toMatch(/\n {4}"grid": \{/);
        expect(out.json.indexOf('"across"')).toBeLessThan(out.json.indexOf('"down"'));
        expect(Object.keys(JSON.parse(out.json))).toEqual(['grid', 'clues']);
        for (const dir of ['across', 'down'] as const) {
            const ns = out.data.clues[dir].map((c) => c.n);
            expect(ns).toEqual([...ns].sort((a, b) => a - b));
        }
        expect(out.json.endsWith('\n')).toBe(true);
    });

    it('always writes n, r, c, len and clue, and nothing else', () => {
        const out = exportPataparbon(examplePuzzle());
        if (!out.ok) throw new Error('export failed');
        for (const c of [...out.data.clues.across, ...out.data.clues.down]) {
            expect(Object.keys(c).sort()).toEqual(['c', 'clue', 'len', 'n', 'r']);
        }
    });

    it('trims and NFC-normalizes clue text', () => {
        const p = examplePuzzle();
        p.clues[clueKey('across', 0, 0)] = '  ড়়  ';
        const data = buildPataparbon(p);
        expect(data.clues.across[0]!.clue).toBe('ড়়'.normalize('NFC'));
    });

    it('blocks the export, naming each problem in both languages', () => {
        const p = examplePuzzle();
        delete p.clues[clueKey('down', 0, 2)];
        p.grid.cells[2] = p.grid.cells[2]!.map((c, i) => (i === 1 ? { a: '', d: '' } : c));
        const out = exportPataparbon(p);
        expect(out.ok).toBe(false);
        if (out.ok) return;
        expect(out.errors.map((e) => e.code)).toEqual(['empty_cells', 'clue_empty_down']);
        for (const e of out.errors) {
            expect(e.en).not.toBe('');
            expect(e.bn).toMatch(/[ঀ-৿]/u);
        }
        expect(out.errors[0]!.en).toContain('row 3, column 2');
        expect(out.errors[0]!.bn).toContain('সারি ৩, কলাম ২');
    });

    it('reports many empty cells as one error', () => {
        const p = examplePuzzle();
        p.grid.cells = p.grid.cells.map((row) => row.map((c) => (c === null ? null : { a: '', d: '' })));
        const out = exportPataparbon(p);
        if (out.ok) throw new Error('should fail');
        expect(out.errors.filter((e) => e.code === 'empty_cells')).toHaveLength(1);
        expect(out.errors.some((e) => e.code === 'cell_letter')).toBe(false);
    });

    it('blocks a conflict between a crossing across and down letter', () => {
        const p = examplePuzzle();
        p.grid.cells[0] = p.grid.cells[0]!.map((c, i) => (i === 0 ? { a: 'ক', d: 'খ' } : c));
        const out = exportPataparbon(p);
        if (out.ok) throw new Error('should fail');
        expect(out.errors.map((e) => e.code)).toContain('conflict');
        expect(out.errors[0]!.en).toContain('row 1, column 1');
    });

    it('blocks an orphan cell', () => {
        const p = examplePuzzle();
        const cells = p.grid.cells.map((row) => row.slice());
        cells[1]![1] = { a: 'ক', d: 'ক' };
        cells[0]![1] = null;
        cells[2]![1] = null;
        cells[1]![0] = null;
        cells[1]![2] = null;
        const out = exportPataparbon({ ...p, grid: { ...p.grid, cells } });
        if (out.ok) throw new Error('should fail');
        expect(out.errors.map((e) => e.code)).toContain('orphan_cell');
    });

    it('warns, without blocking, when a clue contains its answer', () => {
        const p = examplePuzzle();
        p.clues[clueKey('across', 0, 0)] = 'কখগঘঙ নিয়ে ধাঁধা';
        const out = exportPataparbon(p);
        expect(out.ok).toBe(true);
        expect(out.warnings.map((w) => w.code)).toEqual(['clue_has_answer']);
        expect(out.warnings[0]!.en).toBe('Across 1: the clue contains its own answer.');
    });
});

describe('import', () => {
    it('reads the example into a puzzle with its clues and no conflicts', () => {
        const p = examplePuzzle();
        expect(p.grid.rows).toBe(5);
        expect(p.clues[clueKey('across', 2, 0)]).toBe('across সূত্র 4');
        expect(p.clues[clueKey('down', 0, 4)]).toBe('down সূত্র 3');
        expect(p.symmetry).toBe(true);
    });

    it('fills a clue position that is left out, as Pataparbon does', () => {
        const d = copy();
        for (const c of [...d.clues.across, ...d.clues.down]) {
            delete (c as Partial<typeof c>).r;
            delete (c as Partial<typeof c>).c;
            delete (c as Partial<typeof c>).len;
        }
        expect(importPataparbon(JSON.stringify(d)).ok).toBe(true);
    });

    it('refuses a file that breaks a rule, with the same errors as the validator', () => {
        const d = copy();
        d.clues.across.pop();
        const r = importPataparbon(JSON.stringify(d));
        expect(r.ok).toBe(false);
        if (!r.ok) expect(r.errors.map((e) => e.code)).toEqual(['clue_missing_across']);
    });

    it('refuses text that is not JSON, or has no grid and clues', () => {
        for (const text of ['nope', '{}', '{"grid": {}}', '[]']) {
            const r = importPataparbon(text);
            expect(!r.ok && r.errors[0]!.code).toBe('json');
        }
    });

    it('NFC-normalizes the text first (precomposed য় becomes য + nukta)', () => {
        const d = copy();
        d.grid.cells[0]![0] = { s: 'য়' }; // precomposed য়
        const r = importPataparbon(JSON.stringify(d));
        expect(r.ok).toBe(true);
        if (r.ok) expect(r.puzzle.grid.cells[0]![0]!.a).toBe('য়');
    });
});

describe('parseAnyPuzzle', () => {
    it('opens a Pataparbon JSON', () => {
        const r = parseAnyPuzzle(exampleText);
        expect(r.ok && r.format).toBe('pataparbon');
    });

    it('opens an Aksharkhop save file', () => {
        const r = parseAnyPuzzle(serializePuzzle(examplePuzzle()));
        expect(r.ok && r.format).toBe('aksharkhop');
    });

    it('reports the error of the right format', () => {
        const r = parseAnyPuzzle('not json');
        expect(!r.ok && r.errors[0]!.code).toBe('json');
        const bad = parseAnyPuzzle('{"version": 1}');
        expect(bad.ok).toBe(false);
    });
});

describe('clue rows', () => {
    it('lists every slot with its answer, clue and issues', () => {
        const rows = clueRows(examplePuzzle());
        expect(rows.across.map((r) => r.slot.n)).toEqual([1, 4, 5]);
        expect(rows.across[0]!.answer).toBe('কখগঘঙ');
        expect(rows.across.every((r) => r.issues.length === 0)).toBe(true);
    });

    it('flags a missing answer, a missing clue and a clue that gives the answer away', () => {
        const p = examplePuzzle();
        p.grid.cells[0] = p.grid.cells[0]!.map((c, i) => (i === 2 ? { a: '', d: '' } : c));
        delete p.clues[clueKey('across', 2, 0)];
        p.clues[clueKey('across', 4, 0)] = 'থদধনপ';
        const rows = clueRows(p);
        expect(rows.across[0]!.issues).toEqual(['no_answer']);
        expect(rows.across[1]!.issues).toEqual(['no_clue']);
        expect(rows.across[2]!.issues).toEqual(['clue_has_answer']);
        const s = clueSummary(rows);
        expect(s).toEqual({ total: 6, answered: 4, clued: 5, giveaways: 1 });
    });
});
