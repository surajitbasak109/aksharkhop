import { describe, expect, it } from 'vitest';
import { checkTyped } from '../src/grid.ts';
import type { SolvePuzzle } from '../src/share.ts';
import {
    allWhiteCells,
    checkCells,
    clearSolveCell,
    createSolveState,
    filledCount,
    isSolved,
    restoreState,
    revealCells,
    solveSlotAt,
    solveSlots,
    typeCells,
} from '../src/solve.ts';

// The Pataparbon example grid:  ক খ গ ঘ ঙ / চ # ছ # জ / ঝ ক্ষ ট ঠ ড / ঢ # ণ # ত / থ দ ধ ন প
const solve: SolvePuzzle = {
    title: 'নমুনা',
    author: '',
    rows: 5,
    cols: 5,
    solution: [
        ['ক', 'খ', 'গ', 'ঘ', 'ঙ'],
        ['চ', null, 'ছ', null, 'জ'],
        ['ঝ', 'ক্ষ', 'ট', 'ঠ', 'ড'],
        ['ঢ', null, 'ণ', null, 'ত'],
        ['থ', 'দ', 'ধ', 'ন', 'প'],
    ],
    clues: { across: ['a1', 'a4', 'a5'], down: ['d1', 'd2', 'd3'] },
};

describe('solveSlots', () => {
    const slots = solveSlots(solve);

    it('lists across then down, each with its clue and cells', () => {
        expect(slots.map((s) => `${s.dir}${s.n}`)).toEqual([
            'across1',
            'across4',
            'across5',
            'down1',
            'down2',
            'down3',
        ]);
        expect(slots.map((s) => s.clue)).toEqual(['a1', 'a4', 'a5', 'd1', 'd2', 'd3']);
        expect(slots[1]!.cells).toEqual([
            [2, 0],
            [2, 1],
            [2, 2],
            [2, 3],
            [2, 4],
        ]);
        expect(slots[4]!.cells[4]).toEqual([4, 2]);
    });

    it('finds the slot through a cell, per direction', () => {
        expect(solveSlotAt(slots, 2, 1, 'across')?.n).toBe(4);
        expect(solveSlotAt(slots, 2, 2, 'down')?.n).toBe(2);
        expect(solveSlotAt(slots, 1, 0, 'across')).toBeNull(); // a single cell between blocks
        expect(solveSlotAt(slots, 1, 1, 'down')).toBeNull(); // a block
    });
});

describe('typeCells', () => {
    it('fills along the direction from a cell, one akshara per cell', () => {
        const { state, placed } = typeCells(solve, createSolveState(solve), 0, 0, 'across', ['ক', 'খ', 'গ']);
        expect(placed).toBe(3);
        expect(state.letters[0]).toEqual(['ক', 'খ', 'গ', '', '']);
    });

    it('can start in the middle of a word, and goes down too', () => {
        const a = typeCells(solve, createSolveState(solve), 2, 2, 'across', ['ট', 'ঠ']);
        expect(a.state.letters[2]).toEqual(['', '', 'ট', 'ঠ', '']);
        const d = typeCells(solve, createSolveState(solve), 0, 2, 'down', ['গ', 'ছ', 'ট']);
        expect(d.state.letters.map((r) => r[2])).toEqual(['গ', 'ছ', 'ট', '', '']);
    });

    it('stops at a block or the edge instead of spilling over', () => {
        const a = typeCells(solve, createSolveState(solve), 1, 0, 'across', ['চ', 'x', 'y']);
        expect(a.placed).toBe(1); // (1,1) is a block
        expect(a.state.letters[1]).toEqual(['চ', '', '', '', '']);
        const b = typeCells(solve, createSolveState(solve), 0, 3, 'across', ['ঘ', 'ঙ', 'বাড়তি']);
        expect(b.placed).toBe(2);
    });

    it('changes nothing when nothing fits, and never edits the old state', () => {
        const start = createSolveState(solve);
        const same = typeCells(solve, start, 1, 1, 'across', ['ক']);
        expect(same.placed).toBe(0);
        expect(same.state).toBe(start);
        typeCells(solve, start, 0, 0, 'across', ['ক']);
        expect(start.letters[0]![0]).toBe('');
    });

    it('takes the mark off a cell that was typed in again', () => {
        let s = typeCells(solve, createSolveState(solve), 0, 0, 'across', ['x']).state;
        s = checkCells(solve, s, [[0, 0]]).state;
        expect(s.marks[0]![0]).toBe('wrong');
        s = typeCells(solve, s, 0, 0, 'across', ['ক']).state;
        expect(s.marks[0]![0]).toBe('');
    });
});

describe('clearSolveCell', () => {
    it('empties a cell and its mark', () => {
        let s = typeCells(solve, createSolveState(solve), 0, 0, 'across', ['x']).state;
        s = checkCells(solve, s, [[0, 0]]).state;
        s = clearSolveCell(solve, s, 0, 0);
        expect(s.letters[0]![0]).toBe('');
        expect(s.marks[0]![0]).toBe('');
    });

    it('ignores a block and an already empty cell', () => {
        const s = createSolveState(solve);
        expect(clearSolveCell(solve, s, 1, 1)).toBe(s);
        expect(clearSolveCell(solve, s, 0, 0)).toBe(s);
    });
});

describe('checkCells', () => {
    it('marks right and wrong letters and counts the empty ones', () => {
        let s = typeCells(solve, createSolveState(solve), 0, 0, 'across', ['ক', 'ক', '']).state;
        const r = checkCells(solve, s, [
            [0, 0],
            [0, 1],
            [0, 2],
        ]);
        s = r.state;
        expect(r.summary).toEqual({ right: 1, wrong: 1, empty: 1 });
        expect(s.marks[0]).toEqual(['right', 'wrong', '', '', '']);
    });

    it('is strict: a different akshara is wrong even if it looks close', () => {
        const s = typeCells(solve, createSolveState(solve), 2, 1, 'across', ['ক']).state; // ক, not ক্ষ
        expect(checkCells(solve, s, [[2, 1]]).summary.wrong).toBe(1);
    });

    it('ignores blocks and leaves a revealed cell revealed', () => {
        let s = revealCells(solve, createSolveState(solve), [[0, 0]]);
        const r = checkCells(solve, s, [
            [0, 0],
            [1, 1],
        ]);
        s = r.state;
        expect(r.summary).toEqual({ right: 1, wrong: 0, empty: 0 });
        expect(s.marks[0]![0]).toBe('revealed');
    });
});

describe('revealCells and isSolved', () => {
    it('fills the cells with their answers and records that help was used', () => {
        const s = revealCells(solve, createSolveState(solve), [
            [2, 0],
            [2, 1],
            [1, 1],
        ]);
        expect(s.letters[2]).toEqual(['ঝ', 'ক্ষ', '', '', '']);
        expect(s.marks[2]![0]).toBe('revealed');
        expect(s.helped).toBe(true);
        expect(createSolveState(solve).helped).toBe(false);
    });

    it('is solved only when every white cell is right', () => {
        const whole = revealCells(solve, createSolveState(solve), allWhiteCells(solve));
        expect(isSolved(solve, whole)).toBe(true);
        expect(isSolved(solve, createSolveState(solve))).toBe(false);
        const one = typeCells(solve, whole, 4, 4, 'across', ['x']).state;
        expect(isSolved(solve, one)).toBe(false);
    });

    it('is solved by typing the answers, without help', () => {
        let s = createSolveState(solve);
        solve.solution.forEach((row, r) =>
            row.forEach(
                (cell, c) => (s = cell === null ? s : typeCells(solve, s, r, c, 'across', [cell]).state),
            ),
        );
        expect(isSolved(solve, s)).toBe(true);
        expect(s.helped).toBe(false);
    });

    it('lists the white cells and counts the filled ones', () => {
        expect(allWhiteCells(solve)).toHaveLength(21);
        const s = typeCells(solve, createSolveState(solve), 0, 0, 'across', ['ক', 'খ']).state;
        expect(filledCount(solve, s)).toEqual({ filled: 2, total: 21 });
    });
});

describe('restoreState', () => {
    it('reads back saved progress', () => {
        const s = checkCells(
            solve,
            typeCells(solve, createSolveState(solve), 0, 0, 'across', ['ক', 'x']).state,
            [
                [0, 0],
                [0, 1],
            ],
        ).state;
        expect(restoreState(solve, JSON.parse(JSON.stringify(s)))).toEqual(s);
    });

    it('refuses progress that does not fit the puzzle', () => {
        const good = JSON.parse(JSON.stringify(createSolveState(solve)));
        expect(restoreState(solve, good)).not.toBeNull();
        expect(restoreState(solve, null)).toBeNull();
        expect(restoreState(solve, {})).toBeNull();
        expect(restoreState(solve, { ...good, letters: good.letters.slice(1) })).toBeNull();
        const letter = structuredClone(good);
        letter.letters[0][0] = 'কখ'; // two aksharas
        expect(restoreState(solve, letter)).toBeNull();
        const block = structuredClone(good);
        block.letters[1][1] = 'ক'; // a letter in a block
        expect(restoreState(solve, block)).toBeNull();
        const mark = structuredClone(good);
        mark.marks[0][0] = 'shiny';
        expect(restoreState(solve, mark)).toBeNull();
    });
});

describe('checkTyped', () => {
    it('splits typed text into cells without a length rule', () => {
        expect(checkTyped('ক্ষমা')).toEqual({ cells: ['ক্ষ', 'মা'], errors: [] });
        expect(checkTyped('')).toEqual({ cells: [], errors: [] });
    });

    it('reports Latin letters and stray marks', () => {
        expect(checkTyped('ab').errors.length).toBeGreaterThan(0);
        expect(checkTyped('া').errors.map((e) => e.code)).toContain('stray_mark');
    });
});
