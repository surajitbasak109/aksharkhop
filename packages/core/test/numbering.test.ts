import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { numberGrid } from '../src/numbering.ts';

const example = JSON.parse(
    readFileSync(new URL('fixtures/pataparbon-export.json', import.meta.url), 'utf8'),
) as {
    grid: { cells: { b?: number; s?: string }[][] };
    clues: Record<'across' | 'down', { n: number; r: number; c: number; len: number }[]>;
};

const strip = (list: { n: number; r: number; c: number; len: number }[]) =>
    list.map(({ n, r, c, len }) => ({ n, r, c, len })).sort((x, y) => x.n - y.n);

describe('numberGrid (port of CrosswordNumberer)', () => {
    it('numbers the Pataparbon example: across 1/4/5, down 1/2/3', () => {
        const blocks = example.grid.cells.map((row) => row.map((cell) => Boolean(cell.b)));
        const result = numberGrid(blocks);

        expect(result.across.map((e) => e.n)).toEqual([1, 4, 5]);
        expect(result.down.map((e) => e.n)).toEqual([1, 2, 3]);
        expect(result.across).toEqual(strip(example.clues.across));
        expect(result.down).toEqual(strip(example.clues.down));
        expect(result.numbers[0]).toEqual([1, null, 2, null, 3]);
        expect(result.numbers[2]).toEqual([4, null, null, null, null]);
    });

    it('gives one number to a cell that starts both directions', () => {
        const result = numberGrid([
            [false, false],
            [false, true],
        ]);
        expect(result.numbers).toEqual([
            [1, null],
            [null, null],
        ]);
        expect(result.across).toEqual([{ n: 1, r: 0, c: 0, len: 2 }]);
        expect(result.down).toEqual([{ n: 1, r: 0, c: 0, len: 2 }]);
    });

    it('skips runs of one cell', () => {
        const result = numberGrid([[false, true, false]]);
        expect(result.across).toEqual([]);
        expect(result.down).toEqual([]);
        expect(result.numbers).toEqual([[null, null, null]]);
    });

    it('handles an all-block grid and an empty grid', () => {
        expect(numberGrid([[true, true]])).toEqual({ numbers: [[null, null]], across: [], down: [] });
        expect(numberGrid([])).toEqual({ numbers: [], across: [], down: [] });
    });

    it('numbers in reading order across a larger grid', () => {
        // 5x5 with blocks at the centre and the two opposite corners.
        const b = (s: string) => s.split('').map((ch) => ch === '#');
        const result = numberGrid(['...##', '.....', '..#..', '.....', '##...'].map(b));
        expect(result.numbers).toEqual([
            [1, 2, 3, null, null],
            [4, null, null, 5, 6],
            [7, null, null, 8, null],
            [9, null, 10, null, null],
            [null, null, 11, null, null],
        ]);
        expect(result.across.map((e) => [e.n, e.len])).toEqual([
            [1, 3],
            [4, 5],
            [7, 2],
            [8, 2],
            [9, 5],
            [11, 3],
        ]);
        expect(result.down.map((e) => [e.n, e.len])).toEqual([
            [1, 4],
            [2, 4],
            [3, 2],
            [5, 4],
            [6, 4],
            [10, 2],
        ]);
    });
});
