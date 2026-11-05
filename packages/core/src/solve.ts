// Solving a puzzle: what the solver has typed, and checking, revealing and finishing. Pure data, no DOM.
// Every function returns a new state and never changes the one it is given.

import type { Direction } from './grid.ts';
import { solveEntries, type SolvePuzzle } from './share.ts';
import { isSingleAkshara } from './segment.ts';

/** How a cell shows after a check or a reveal. '' is a cell nobody has checked. */
export type Mark = '' | 'wrong' | 'right' | 'revealed';

export interface SolveState {
    /** What the solver typed in each cell, one akshara or ''. Blocks hold ''. */
    letters: string[][];
    marks: Mark[][];
    /** True once any answer was revealed: the puzzle was finished with help. */
    helped: boolean;
}

export interface SolveSlot {
    dir: Direction;
    n: number;
    r: number;
    c: number;
    len: number;
    cells: [number, number][];
    clue: string;
}

export function createSolveState(solve: SolvePuzzle): SolveState {
    const blank = <T>(v: T) => solve.solution.map((row) => row.map(() => v));
    return { letters: blank(''), marks: blank<Mark>(''), helped: false };
}

/** Every slot of the puzzle with its clue: across first, then down, each in numbering order. */
export function solveSlots(solve: SolvePuzzle): SolveSlot[] {
    const { across, down } = solveEntries(solve);
    const make = (dir: Direction, list: typeof across, clues: string[]): SolveSlot[] =>
        list.map((e, i) => ({
            dir,
            n: e.n,
            r: e.r,
            c: e.c,
            len: e.len,
            cells: Array.from(
                { length: e.len },
                (_, k) => (dir === 'across' ? [e.r, e.c + k] : [e.r + k, e.c]) as [number, number],
            ),
            clue: clues[i] ?? '',
        }));
    return [...make('across', across, solve.clues.across), ...make('down', down, solve.clues.down)];
}

/** The slot in `dir` that contains (r, c), or null. */
export function solveSlotAt(
    slots: readonly SolveSlot[],
    r: number,
    c: number,
    dir: Direction,
): SolveSlot | null {
    return slots.find((s) => s.dir === dir && s.cells.some(([sr, sc]) => sr === r && sc === c)) ?? null;
}

export const isWhite = (solve: SolvePuzzle, r: number, c: number): boolean =>
    solve.solution[r]?.[c] !== undefined && solve.solution[r]![c] !== null;

function edit(state: SolveState, change: (s: { letters: string[][]; marks: Mark[][] }) => void): SolveState {
    const letters = state.letters.map((row) => row.slice());
    const marks = state.marks.map((row) => row.slice());
    change({ letters, marks });
    return { ...state, letters, marks };
}

/**
 * Types `cells` into consecutive cells from (r, c) in `dir`, stopping at the end of the run of white
 * cells. A typed cell loses its mark. Returns the new state and how many cells were filled.
 */
export function typeCells(
    solve: SolvePuzzle,
    state: SolveState,
    r: number,
    c: number,
    dir: Direction,
    cells: readonly string[],
): { state: SolveState; placed: number } {
    const [dr, dc] = dir === 'across' ? [0, 1] : [1, 0];
    let placed = 0;
    const next = edit(state, ({ letters, marks }) => {
        while (placed < cells.length && isWhite(solve, r + placed * dr, c + placed * dc)) {
            letters[r + placed * dr]![c + placed * dc] = cells[placed]!;
            marks[r + placed * dr]![c + placed * dc] = '';
            placed++;
        }
    });
    return { state: placed === 0 ? state : next, placed };
}

export function clearSolveCell(solve: SolvePuzzle, state: SolveState, r: number, c: number): SolveState {
    if (!isWhite(solve, r, c) || (state.letters[r]![c] === '' && state.marks[r]![c] === '')) return state;
    return edit(state, ({ letters, marks }) => {
        letters[r]![c] = '';
        marks[r]![c] = '';
    });
}

export interface CheckSummary {
    /** Cells that hold a wrong letter. */
    wrong: number;
    /** Cells with no letter yet. */
    empty: number;
    /** Cells that hold the right letter. */
    right: number;
}

/**
 * Marks each filled cell right or wrong. Empty cells are counted but not marked. A revealed cell stays
 * revealed.
 */
export function checkCells(
    solve: SolvePuzzle,
    state: SolveState,
    cells: readonly (readonly [number, number])[],
): { state: SolveState; summary: CheckSummary } {
    const summary: CheckSummary = { wrong: 0, empty: 0, right: 0 };
    const next = edit(state, ({ letters, marks }) => {
        for (const [r, c] of cells) {
            if (!isWhite(solve, r, c)) continue;
            const letter = letters[r]![c]!;
            if (letter === '') {
                summary.empty++;
            } else if (letter === solve.solution[r]![c]) {
                summary.right++;
                if (marks[r]![c] !== 'revealed') marks[r]![c] = 'right';
            } else {
                summary.wrong++;
                marks[r]![c] = 'wrong';
            }
        }
    });
    return { state: next, summary };
}

/** Fills the cells with their answers and marks them revealed. The puzzle then counts as solved with help. */
export function revealCells(
    solve: SolvePuzzle,
    state: SolveState,
    cells: readonly (readonly [number, number])[],
): SolveState {
    const white = cells.filter(([r, c]) => isWhite(solve, r, c));
    if (white.length === 0) return state;
    const next = edit(state, ({ letters, marks }) => {
        for (const [r, c] of white) {
            letters[r]![c] = solve.solution[r]![c]!;
            marks[r]![c] = 'revealed';
        }
    });
    return { ...next, helped: true };
}

export function allWhiteCells(solve: SolvePuzzle): [number, number][] {
    const out: [number, number][] = [];
    solve.solution.forEach((row, r) =>
        row.forEach((cell, c) => {
            if (cell !== null) out.push([r, c]);
        }),
    );
    return out;
}

export function isSolved(solve: SolvePuzzle, state: SolveState): boolean {
    return solve.solution.every((row, r) =>
        row.every((cell, c) => cell === null || state.letters[r]![c] === cell),
    );
}

export function filledCount(solve: SolvePuzzle, state: SolveState): { filled: number; total: number } {
    let filled = 0;
    let total = 0;
    solve.solution.forEach((row, r) =>
        row.forEach((cell, c) => {
            if (cell === null) return;
            total++;
            if (state.letters[r]![c] !== '') filled++;
        }),
    );
    return { filled, total };
}

/** Clears every letter and mark. */
export function resetState(solve: SolvePuzzle): SolveState {
    return createSolveState(solve);
}

const MARKS: readonly string[] = ['', 'wrong', 'right', 'revealed'];

/** Reads saved progress for this puzzle, or null if it does not fit (other size, bad letters, ...). */
export function restoreState(solve: SolvePuzzle, saved: unknown): SolveState | null {
    const s = saved as { letters?: unknown; marks?: unknown; helped?: unknown } | null;
    if (typeof s !== 'object' || s === null || !Array.isArray(s.letters) || !Array.isArray(s.marks))
        return null;
    const { rows, cols } = solve;
    const fits = (g: unknown[]) =>
        g.length === rows && g.every((row) => Array.isArray(row) && row.length === cols);
    if (!fits(s.letters) || !fits(s.marks)) return null;
    const letters = s.letters as unknown[][];
    const marks = s.marks as unknown[][];
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const l = letters[r]![c];
            const m = marks[r]![c];
            if (typeof l !== 'string' || typeof m !== 'string' || !MARKS.includes(m)) return null;
            if (solve.solution[r]![c] === null ? l !== '' || m !== '' : l !== '' && !isSingleAkshara(l))
                return null;
        }
    }
    return { letters: letters as string[][], marks: marks as Mark[][], helped: s.helped === true };
}
