import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { importPataparbon } from '../src/exportPataparbon.ts';
import { createPuzzle, serializePuzzle, type Puzzle } from '../src/puzzle.ts';
import { SAMPLE_PUZZLE } from '../src/samplePuzzle.ts';
import {
    codeFromHash,
    decodeSolve,
    encodeSolve,
    packSolve,
    solveEntries,
    solveFromText,
    solveLink,
    toSolvePuzzle,
    unpackSolve,
    type SolvePuzzle,
} from '../src/share.ts';

const exampleText = readFileSync(
    new URL('../../../.claude/examples/pataparbon-export.json', import.meta.url),
    'utf8',
);

function examplePuzzle(): Puzzle {
    const r = importPataparbon(exampleText);
    if (!r.ok) throw new Error('example failed to import');
    return { ...r.puzzle, title: 'নমুনা', author: 'পরীক্ষক' };
}

function exampleSolve(): SolvePuzzle {
    const r = toSolvePuzzle(examplePuzzle());
    if (!r.ok) throw new Error(r.errors.map((e) => e.en).join('; '));
    return r.solve;
}

const b64url = (bytes: Uint8Array) => {
    let bin = '';
    for (const b of bytes) bin += String.fromCharCode(b);
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

describe('toSolvePuzzle', () => {
    it('builds the solution, the clues in numbering order and the title', () => {
        const s = exampleSolve();
        expect(s).toMatchObject({ title: 'নমুনা', author: 'পরীক্ষক', rows: 5, cols: 5 });
        expect(s.solution[0]).toEqual(['ক', 'খ', 'গ', 'ঘ', 'ঙ']);
        expect(s.solution[1]).toEqual(['চ', null, 'ছ', null, 'জ']);
        expect(s.solution[2]![1]).toBe('ক্ষ');
        expect(s.clues.across).toEqual(['across সূত্র 1', 'across সূত্র 4', 'across সূত্র 5']);
        expect(s.clues.down).toEqual(['down সূত্র 1', 'down সূত্র 2', 'down সূত্র 3']);
        expect(solveEntries(s).across.map((e) => e.n)).toEqual([1, 4, 5]);
    });

    it('refuses a puzzle that is not finished, with the export errors', () => {
        const r = toSolvePuzzle(createPuzzle(9, 9));
        expect(r.ok).toBe(false);
        if (!r.ok) expect(r.errors.length).toBeGreaterThan(0);
    });

    it('refuses a puzzle with an empty clue', () => {
        const p = examplePuzzle();
        p.clues = {};
        const r = toSolvePuzzle(p);
        expect(r.ok === false && r.errors.some((e) => e.code.startsWith('clue_empty'))).toBe(true);
    });
});

describe('solveFromText', () => {
    it('opens a Pataparbon JSON', () => {
        const r = solveFromText(exampleText);
        expect(r.ok && r.solve.solution[2]![1]).toBe('ক্ষ');
    });

    it('opens an Aksharkhop save file', () => {
        const r = solveFromText(serializePuzzle(examplePuzzle()));
        expect(r.ok && r.solve.title).toBe('নমুনা');
    });

    it('reports a file that is not a puzzle', () => {
        expect(solveFromText('nope').ok).toBe(false);
    });
});

describe('share code', () => {
    it('round-trips a puzzle exactly', async () => {
        const solve = exampleSolve();
        const code = await encodeSolve(solve);
        const back = await decodeSolve(code);
        expect(back).toEqual({ ok: true, solve });
    });

    it('is URL-safe and starts with the version', async () => {
        const code = await encodeSolve(exampleSolve());
        expect(code).toMatch(/^1\.[A-Za-z0-9_-]+$/);
    });

    it('is smaller than the plain JSON for a puzzle of real size', async () => {
        // a 15×15 puzzle: every other row is a word
        const cols = 15;
        const rows: (string | null)[][] = Array.from({ length: 15 }, (_, r) =>
            Array.from({ length: cols }, (_, c) => (r % 2 === 0 || c === 0 || c === 14 ? 'ক' : null)),
        );
        const solve: SolvePuzzle = {
            title: 'বড় ছক',
            author: 'x',
            rows: 15,
            cols,
            solution: rows,
            clues: { across: [], down: [] },
        };
        const plain = JSON.stringify(packSolve(solve)).length;
        const code = await encodeSolve(solve);
        expect(code.length).toBeLessThan(plain);
    });

    it('opens an uncompressed code (version 0), as written when compression is not available', async () => {
        const solve = exampleSolve();
        const code = `0.${b64url(new TextEncoder().encode(JSON.stringify(packSolve(solve))))}`;
        expect(await decodeSolve(code)).toEqual({ ok: true, solve });
    });

    it('refuses text that is not a code', async () => {
        for (const code of [
            '',
            'x',
            '1',
            '1.',
            '0.',
            '2.abc',
            '1.!!!',
            '1.@@',
            'abc.def',
            '1.AAAA',
            '1.' + 'A'.repeat(40),
        ]) {
            const r = await decodeSolve(code);
            expect(r.ok, code).toBe(false);
            if (!r.ok) expect(r.errors[0]!.bn).toMatch(/[ঀ-৿]/u);
        }
    });

    it('refuses a code that was cut short', async () => {
        const code = await encodeSolve(exampleSolve());
        expect((await decodeSolve(code.slice(0, code.length - 10))).ok).toBe(false);
    });

    it('refuses data that expands to too much (a decompression bomb)', async () => {
        const cs = new CompressionStream('deflate-raw');
        const w = cs.writable.getWriter();
        void w.write(new Uint8Array(5_000_000));
        void w.close();
        const bytes = new Uint8Array(await new Response(cs.readable).arrayBuffer());
        expect(bytes.length).toBeLessThan(10_000);
        const r = await decodeSolve(`1.${b64url(bytes)}`);
        expect(r.ok).toBe(false);
    });

    it('refuses an uncompressed code that is too big', async () => {
        expect((await decodeSolve(`0.${b64url(new Uint8Array(250_000).fill(65))}`)).ok).toBe(false);
    });
});

describe('unpackSolve checks everything in the code', () => {
    const packed = () => structuredClone(packSolve(exampleSolve())) as unknown as Record<string, unknown>;

    it('accepts good data', () => {
        expect(unpackSolve(packed()).ok).toBe(true);
    });

    it('refuses the wrong shape', () => {
        for (const bad of [
            null,
            5,
            'x',
            [],
            {},
            { ...packed(), v: 2 },
            { ...packed(), t: 5 },
            { ...packed(), g: 'x' },
            { ...packed(), ac: [1] },
        ]) {
            expect(unpackSolve(bad).ok).toBe(false);
        }
    });

    it('refuses a cell with two aksharas, or a cell with a lone mark glued wrongly', () => {
        const p = packed() as { g: string[][] };
        p.g[0]![0] = 'কখ';
        const r = unpackSolve(p);
        expect(r.ok === false && r.errors.some((e) => e.code === 'cell_letter')).toBe(true);
    });

    it('refuses the wrong number of clues, in either direction', () => {
        const a = packed() as { ac: string[] };
        a.ac.pop();
        const ra = unpackSolve(a);
        expect(ra.ok === false && ra.errors.length).toBeGreaterThan(0);
        const d = packed() as { dc: string[] };
        d.dc.push('বাড়তি');
        const rd = unpackSolve(d);
        expect(rd.ok === false && rd.errors.some((e) => e.code === 'clue_count')).toBe(true);
    });

    it('refuses an empty clue, an orphan cell and a bad size', () => {
        const e = packed() as { ac: string[] };
        e.ac[0] = '';
        expect(unpackSolve(e).ok).toBe(false);

        const o = packed() as { g: string[][] };
        o.g[1]![1] = 'ক';
        o.g[0]![1] = '';
        o.g[2]![1] = '';
        o.g[1]![0] = '';
        o.g[1]![2] = '';
        expect(unpackSolve(o).ok).toBe(false);

        const s = packed() as { g: string[][] };
        s.g = s.g.slice(0, 3);
        expect(unpackSolve(s).ok).toBe(false);
    });
});

describe('links', () => {
    it('puts the code after #solve= and replaces any hash that was there', () => {
        expect(solveLink('https://x.test/app/', 'abc')).toBe('https://x.test/app/#solve=abc');
        expect(solveLink('https://x.test/app/#solve=old', 'abc')).toBe('https://x.test/app/#solve=abc');
    });

    it('reads the code back from a hash', () => {
        expect(codeFromHash('#solve=1.abc_-')).toBe('1.abc_-');
        expect(codeFromHash('')).toBeNull();
        expect(codeFromHash('#other=1')).toBeNull();
        expect(codeFromHash('#solve=')).toBe('');
    });
});

describe('SAMPLE_PUZZLE', () => {
    it('is a valid puzzle that can be shared and opened', async () => {
        const back = await decodeSolve(await encodeSolve(SAMPLE_PUZZLE));
        expect(back).toEqual({ ok: true, solve: SAMPLE_PUZZLE });
    });

    it('has a clue for every word, and no clue contains its answer', () => {
        const { across, down } = solveEntries(SAMPLE_PUZZLE);
        expect(SAMPLE_PUZZLE.clues.across).toHaveLength(across.length);
        expect(SAMPLE_PUZZLE.clues.down).toHaveLength(down.length);
        for (const [entries, clues, dr, dc] of [
            [across, SAMPLE_PUZZLE.clues.across, 0, 1],
            [down, SAMPLE_PUZZLE.clues.down, 1, 0],
        ] as const) {
            entries.forEach((e, i) => {
                const word = Array.from(
                    { length: e.len },
                    (_, k) => SAMPLE_PUZZLE.solution[e.r + k * dr]![e.c + k * dc],
                ).join('');
                expect(clues[i]!.trim()).not.toBe('');
                expect(clues[i]!.includes(word), `clue for ${word} contains the answer`).toBe(false);
            });
        }
    });
});
