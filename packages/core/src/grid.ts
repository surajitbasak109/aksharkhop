// Grid model for the editor. Pure data, no DOM. Every function returns a new grid and never mutates.
//
// Each white cell keeps two letters: the one typed in an across answer (`a`) and the one typed in a
// down answer (`d`). The cell shows `a`, or `d` when `a` is empty. When both are set and differ, the
// crossing words disagree: that is a conflict. Keeping the two apart means retyping your own across
// word never flags a cell that no down word was typed through.

import { findTextIssues, normalize } from './normalize.ts';
import { numberGrid, type Entry, type Numbering } from './numbering.ts';
import { segment } from './segment.ts';

export const MIN_SIZE = 5;
export const MAX_SIZE = 15;
/** The largest grid the editor offers for a new puzzle. Bigger grids (up to MAX_SIZE, Pataparbon's limit) still open. */
export const MAX_NEW_SIZE = 10;
export const DEFAULT_SIZE = 6;
export const SIZE_PRESETS = [6, 8, 10] as const;

export type Direction = 'across' | 'down';

export interface Cell {
    /** Letter typed in the across answer through this cell, or ''. */
    a: string;
    /** Letter typed in the down answer through this cell, or ''. */
    d: string;
}

export interface Grid {
    rows: number;
    cols: number;
    /** Row-major; null is a black square. */
    cells: (Cell | null)[][];
}

export interface Slot extends Entry {
    dir: Direction;
}

export interface Message {
    code: string;
    en: string;
    bn: string;
}

const EMPTY: Cell = Object.freeze({ a: '', d: '' });

export function isValidSize(n: number): boolean {
    return Number.isInteger(n) && n >= MIN_SIZE && n <= MAX_SIZE;
}

/** A size the New dialog accepts. */
export function isValidNewSize(n: number): boolean {
    return Number.isInteger(n) && n >= MIN_SIZE && n <= MAX_NEW_SIZE;
}

export function createGrid(rows: number = DEFAULT_SIZE, cols: number = rows): Grid {
    if (!isValidSize(rows) || !isValidSize(cols)) {
        throw new RangeError(`Grid size must be ${MIN_SIZE} to ${MAX_SIZE} (got ${rows}×${cols}).`);
    }
    const cells = Array.from({ length: rows }, () => Array.from({ length: cols }, () => EMPTY));
    return { rows, cols, cells };
}

export function inBounds(grid: Grid, r: number, c: number): boolean {
    return r >= 0 && r < grid.rows && c >= 0 && c < grid.cols;
}

export function getCell(grid: Grid, r: number, c: number): Cell | null {
    return grid.cells[r]?.[c] ?? null;
}

export function isBlock(grid: Grid, r: number, c: number): boolean {
    return inBounds(grid, r, c) && grid.cells[r]![c] === null;
}

/** The letter a cell shows: the across letter, else the down letter, else ''. */
export function cellLetter(cell: Cell | null): string {
    return cell === null ? '' : cell.a || cell.d;
}

/** True when the across and down letters are both set and differ. */
export function isConflict(cell: Cell | null): boolean {
    return cell !== null && cell.a !== '' && cell.d !== '' && cell.a !== cell.d;
}

export function blockMap(grid: Grid): boolean[][] {
    return grid.cells.map((row) => row.map((cell) => cell === null));
}

export function numbering(grid: Grid): Numbering {
    return numberGrid(blockMap(grid));
}

export function slots(grid: Grid): { across: Slot[]; down: Slot[] } {
    const { across, down } = numbering(grid);
    return {
        across: across.map((e) => ({ ...e, dir: 'across' as const })),
        down: down.map((e) => ({ ...e, dir: 'down' as const })),
    };
}

export function slotCells(slot: Entry & { dir: Direction }): [number, number][] {
    const [dr, dc] = slot.dir === 'across' ? [0, 1] : [1, 0];
    return Array.from({ length: slot.len }, (_, i) => [slot.r + i * dr, slot.c + i * dc] as [number, number]);
}

/** The slot in `dir` that contains (r, c), or null (block, or a run of one cell). */
export function slotAt(grid: Grid, r: number, c: number, dir: Direction): Slot | null {
    if (!inBounds(grid, r, c) || isBlock(grid, r, c)) return null;
    const [dr, dc] = dir === 'across' ? [0, 1] : [1, 0];
    let sr = r;
    let sc = c;
    while (inBounds(grid, sr - dr, sc - dc) && !isBlock(grid, sr - dr, sc - dc)) {
        sr -= dr;
        sc -= dc;
    }
    const list = slots(grid)[dir];
    return list.find((s) => s.r === sr && s.c === sc) ?? null;
}

/** The letters a slot shows, '' for empty cells. */
export function slotLetters(grid: Grid, slot: Slot): string[] {
    return slotCells(slot).map(([r, c]) => cellLetter(getCell(grid, r, c)));
}

/**
 * The slot's own word, cell by cell: the letter typed in the slot's direction, else the crossing
 * letter. Where there is a conflict this gives the slot's own letter, not the one the cell shows.
 */
export function slotWord(grid: Grid, slot: Slot): string[] {
    const key = slot.dir === 'across' ? 'a' : 'd';
    return slotCells(slot).map(([r, c]) => {
        const cell = getCell(grid, r, c);
        return cell === null ? '' : cell[key] || cellLetter(cell);
    });
}

function withCells(grid: Grid, change: (cells: (Cell | null)[][]) => void): Grid {
    const cells = grid.cells.map((row) => row.slice());
    change(cells);
    return { ...grid, cells };
}

/** The cell opposite (r, c) under 180° rotation. */
export function mirrorOf(grid: Grid, r: number, c: number): [number, number] {
    return [grid.rows - 1 - r, grid.cols - 1 - c];
}

/**
 * Makes (r, c) a block (`block` true) or an empty white cell. With `symmetric`, the mirror cell gets
 * the same state. A cell that turns into a block loses its letters.
 */
export function setBlock(grid: Grid, r: number, c: number, block: boolean, symmetric: boolean): Grid {
    if (!inBounds(grid, r, c)) return grid;
    const targets: [number, number][] = [[r, c]];
    if (symmetric) targets.push(mirrorOf(grid, r, c));

    return withCells(grid, (cells) => {
        for (const [tr, tc] of targets) {
            const isNowBlock = cells[tr]![tc] === null;
            if (isNowBlock === block) continue;
            cells[tr]![tc] = block ? null : EMPTY;
        }
    });
}

export function toggleBlock(grid: Grid, r: number, c: number, symmetric: boolean): Grid {
    return setBlock(grid, r, c, !isBlock(grid, r, c), symmetric);
}

/** True when the blocks are the same under 180° rotation. */
export function isSymmetric(grid: Grid): boolean {
    for (let r = 0; r < grid.rows; r++) {
        for (let c = 0; c < grid.cols; c++) {
            const [mr, mc] = mirrorOf(grid, r, c);
            if (isBlock(grid, r, c) !== isBlock(grid, mr, mc)) return false;
        }
    }
    return true;
}

/** Clears both letters of a white cell. */
export function clearCell(grid: Grid, r: number, c: number): Grid {
    const cell = getCell(grid, r, c);
    if (cell === null || (cell.a === '' && cell.d === '')) return grid;
    return withCells(grid, (cells) => {
        cells[r]![c] = EMPTY;
    });
}

// Characters that cannot start a cell: vowel signs, hasanta, nukta, chandrabindu.
const STRAY_MARK = /^[ঁ়া-ৄেৈো-্ৗৢৣ]/u;
const BENGALI_ONLY = /^[ঀ-৿]+$/u;

export type AnswerCheck = { ok: true; cells: string[] } | { ok: false; cells: string[]; errors: Message[] };

export interface TypedCheck {
    cells: string[];
    /** Problems with the text itself (not Latin, stray vowel sign, ...). Empty when the text is fine. */
    errors: Message[];
}

/** Splits typed text into cells and checks it is made of Bengali aksharas. No length rule. '' is fine. */
export function checkTyped(text: string): TypedCheck {
    const word = normalize(text);
    const cells = segment(word);
    if (word === '') return { cells: [], errors: [] };

    const errors: Message[] = findTextIssues(word).map((i) => ({ code: i.code, en: i.en, bn: i.bn }));

    if (errors.length === 0 && cells.some((cell) => !BENGALI_ONLY.test(cell))) {
        errors.push({
            code: 'not_bengali',
            en: 'Use Bengali letters only.',
            bn: 'শুধু বাংলা অক্ষর লিখুন।',
        });
    }
    if (cells.some((cell) => STRAY_MARK.test(cell))) {
        errors.push({
            code: 'stray_mark',
            en: 'A vowel sign or mark has no letter before it.',
            bn: 'একটি কার-চিহ্ন বা চিহ্নের আগে কোনো বর্ণ নেই।',
        });
    }
    return { cells, errors };
}

/** Splits a typed answer into cells and checks it fits a slot of `len` cells. '' is allowed (clears). */
export function checkAnswer(text: string, len: number): AnswerCheck {
    if (normalize(text) === '') return { ok: true, cells: [] };

    const { cells, errors } = checkTyped(text);
    if (cells.length !== len) {
        errors.push({
            code: 'length',
            en: `The answer has ${cells.length} cells; the slot has ${len}.`,
            bn: `উত্তরে ${toBengaliDigits(cells.length)}টি ঘর, কিন্তু জায়গা ${toBengaliDigits(len)}টি ঘরের।`,
        });
    }

    return errors.length === 0 ? { ok: true, cells } : { ok: false, cells, errors };
}

export type PreviewState = 'empty' | 'same' | 'new' | 'conflict';

/**
 * What typing `cells` into `slot` would do to each cell: 'same' (already shows it), 'new' (fills an
 * empty cell or replaces this direction's own letter) or 'conflict' (the crossing word has another letter).
 */
export function previewAnswer(grid: Grid, slot: Slot, cells: readonly string[]): PreviewState[] {
    return slotCells(slot).map(([r, c], i) => {
        const next = cells[i] ?? '';
        const cell = getCell(grid, r, c);
        if (next === '' || cell === null) return 'empty';
        const crossing = slot.dir === 'across' ? cell.d : cell.a;
        if (crossing !== '' && crossing !== next) return 'conflict';
        return cellLetter(cell) === next ? 'same' : 'new';
    });
}

/**
 * Writes `cells` into the slot's direction. An empty list clears the slot's own letters (the crossing
 * letters stay). Throws if the length does not match; call checkAnswer first.
 */
export function placeAnswer(grid: Grid, slot: Slot, cells: readonly string[]): Grid {
    if (cells.length !== 0 && cells.length !== slot.len) {
        throw new RangeError(`Answer has ${cells.length} cells; slot has ${slot.len}.`);
    }
    const key = slot.dir === 'across' ? 'a' : 'd';
    return withCells(grid, (out) => {
        slotCells(slot).forEach(([r, c], i) => {
            const cell = out[r]![c];
            if (cell === null || cell === undefined) return;
            out[r]![c] = { ...cell, [key]: cells[i] ?? '' };
        });
    });
}

export interface Conflict {
    r: number;
    c: number;
    across: string;
    down: string;
}

export function conflicts(grid: Grid): Conflict[] {
    const out: Conflict[] = [];
    grid.cells.forEach((row, r) =>
        row.forEach((cell, c) => {
            if (isConflict(cell)) out.push({ r, c, across: cell!.a, down: cell!.d });
        }),
    );
    return out;
}

export interface GridStats {
    white: number;
    filled: number;
    blocks: number;
    conflicts: number;
}

export function gridStats(grid: Grid): GridStats {
    const stats: GridStats = { white: 0, filled: 0, blocks: 0, conflicts: 0 };
    for (const row of grid.cells) {
        for (const cell of row) {
            if (cell === null) {
                stats.blocks++;
                continue;
            }
            stats.white++;
            if (cellLetter(cell) !== '') stats.filled++;
            if (isConflict(cell)) stats.conflicts++;
        }
    }
    return stats;
}

const BN_DIGITS = '০১২৩৪৫৬৭৮৯';

export function toBengaliDigits(n: number): string {
    return String(n).replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)]!);
}
