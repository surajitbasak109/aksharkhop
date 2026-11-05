// Aksharkhop save file (version 1): the editor's own format, with everything needed to carry on
// editing. Not the Pataparbon export (that is exportPataparbon.ts, Phase 4).
//
//   grid          what each cell shows: null = block, "" = empty, else one akshara
//   typed.across  the letter typed in each cell's across answer ("" = none, null = block)
//   typed.down    the same for down answers; a cell is a conflict when both are set and differ
//   clues         one entry per slot, numbered as Pataparbon numbers it. `answer` is the slot's own
//                 word (see slotWord), or "" while any cell is empty. Derived, so it is not read back.
//                 Phase 3 keeps the clue text as it is.
//
// Writing the same puzzle always gives the same bytes, so export → import → export is identical.

import {
    cellLetter,
    createGrid,
    isValidSize,
    MAX_SIZE,
    MIN_SIZE,
    slotWord,
    slots,
    toBengaliDigits,
    type Cell,
    type Direction,
    type Grid,
    type Message,
} from './grid.ts';
import { formatJson } from './json.ts';
import { isSingleAkshara } from './segment.ts';

export const SAVE_VERSION = 1;

export interface Puzzle {
    title: string;
    author: string;
    symmetry: boolean;
    grid: Grid;
    /** Clue text by slot key (see clueKey). Kept for slots that are gone, in case they come back. */
    clues: Record<string, string>;
}

export interface SavedClue {
    num: number;
    row: number;
    col: number;
    len: number;
    answer: string;
    clue: string;
}

export interface SaveFile {
    version: 1;
    title: string;
    author: string;
    size: { rows: number; cols: number };
    symmetry: boolean;
    grid: (string | null)[][];
    typed: { across: (string | null)[][]; down: (string | null)[][] };
    clues: { across: SavedClue[]; down: SavedClue[] };
}

export function clueKey(dir: Direction, r: number, c: number): string {
    return `${dir}:${r}:${c}`;
}

export function createPuzzle(rows?: number, cols?: number): Puzzle {
    return { title: '', author: '', symmetry: true, grid: createGrid(rows, cols), clues: {} };
}

export function toSaveFile(p: Puzzle): SaveFile {
    const { grid } = p;
    const layer = (key: 'a' | 'd') =>
        grid.cells.map((row) => row.map((cell) => (cell === null ? null : cell[key])));
    const all = slots(grid);
    const saved = (dir: Direction): SavedClue[] =>
        all[dir].map((s) => {
            const letters = slotWord(grid, s);
            return {
                num: s.n,
                row: s.r,
                col: s.c,
                len: s.len,
                answer: letters.every((l) => l !== '') ? letters.join('') : '',
                clue: p.clues[clueKey(dir, s.r, s.c)] ?? '',
            };
        });

    return {
        version: SAVE_VERSION,
        title: p.title,
        author: p.author,
        size: { rows: grid.rows, cols: grid.cols },
        symmetry: p.symmetry,
        grid: grid.cells.map((row) => row.map((cell) => (cell === null ? null : cellLetter(cell)))),
        typed: { across: layer('a'), down: layer('d') },
        clues: { across: saved('across'), down: saved('down') },
    };
}

export function serializePuzzle(p: Puzzle): string {
    return formatJson(toSaveFile(p));
}

export type ParseResult = { ok: true; puzzle: Puzzle } | { ok: false; errors: Message[] };

const err = (code: string, en: string, bn: string): Message => ({ code, en, bn });
const at = (r: number, c: number) => ({
    en: `row ${r + 1}, column ${c + 1}`,
    bn: `সারি ${toBengaliDigits(r + 1)}, কলাম ${toBengaliDigits(c + 1)}`,
});

const isObject = (v: unknown): v is Record<string, unknown> =>
    typeof v === 'object' && v !== null && !Array.isArray(v);

/** Parses and checks a save file. Returns bilingual errors (1-based rows and columns) on failure. */
export function parsePuzzle(text: string): ParseResult {
    let data: unknown;
    try {
        data = JSON.parse(text.replace(/^﻿/, ''));
    } catch {
        return { ok: false, errors: [err('json', 'The file is not valid JSON.', 'ফাইলটি সঠিক JSON নয়।')] };
    }
    return readSaveFile(data);
}

export function readSaveFile(data: unknown): ParseResult {
    if (!isObject(data)) {
        return {
            ok: false,
            errors: [
                err('shape', 'The file is not an Aksharkhop puzzle.', 'এটি অক্ষরখোপের ধাঁধার ফাইল নয়।'),
            ],
        };
    }
    if (data.version !== SAVE_VERSION) {
        return {
            ok: false,
            errors: [
                err(
                    'version',
                    `Unsupported file version (${String(data.version)}); expected ${SAVE_VERSION}.`,
                    `ফাইলের সংস্করণ (${String(data.version)}) চেনা নয়; ${toBengaliDigits(SAVE_VERSION)} হওয়ার কথা।`,
                ),
            ],
        };
    }

    const errors: Message[] = [];
    const title = typeof data.title === 'string' ? data.title : null;
    const author = typeof data.author === 'string' ? data.author : null;
    if (title === null) errors.push(err('title', 'The title must be text.', 'শিরোনাম লেখা হতে হবে।'));
    if (author === null) errors.push(err('author', 'The author must be text.', 'লেখকের নাম লেখা হতে হবে।'));
    if (typeof data.symmetry !== 'boolean') {
        errors.push(
            err('symmetry', '"symmetry" must be true or false.', '"symmetry" true বা false হতে হবে।'),
        );
    }

    const size = isObject(data.size) ? data.size : {};
    const rows = size.rows;
    const cols = size.cols;
    if (typeof rows !== 'number' || typeof cols !== 'number' || !isValidSize(rows) || !isValidSize(cols)) {
        errors.push(
            err(
                'size',
                `The grid must have ${MIN_SIZE} to ${MAX_SIZE} rows and columns.`,
                `গ্রিডে ${toBengaliDigits(MIN_SIZE)} থেকে ${toBengaliDigits(MAX_SIZE)}টি সারি ও কলাম থাকতে হবে।`,
            ),
        );
        return { ok: false, errors };
    }

    const typed = isObject(data.typed) ? data.typed : {};
    const shapeOk = (g: unknown): g is unknown[][] =>
        Array.isArray(g) && g.length === rows && g.every((row) => Array.isArray(row) && row.length === cols);
    for (const [name, g] of [
        ['grid', data.grid],
        ['typed.across', typed.across],
        ['typed.down', typed.down],
    ] as const) {
        if (!shapeOk(g)) {
            errors.push(
                err(
                    'grid_shape',
                    `"${name}" must have ${rows} rows of ${cols} cells.`,
                    `"${name}"-এ ${toBengaliDigits(rows)}টি সারি, প্রতিটিতে ${toBengaliDigits(cols)}টি ঘর থাকতে হবে।`,
                ),
            );
        }
    }
    if (errors.length > 0) return { ok: false, errors };

    const shown = data.grid as unknown[][];
    const across = typed.across as unknown[][];
    const down = typed.down as unknown[][];
    const grid = createGrid(rows, cols);
    const isLetter = (v: unknown): v is string =>
        typeof v === 'string' && (v === '' || (v.normalize('NFC') === v && isSingleAkshara(v)));

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const s = shown[r]![c];
            const a = across[r]![c];
            const d = down[r]![c];
            const where = at(r, c);

            if (s === null || a === null || d === null) {
                if (s !== null || a !== null || d !== null) {
                    errors.push(
                        err(
                            'block_mismatch',
                            `Cell (${where.en}) is a block in one layer but not in another.`,
                            `ঘর (${where.bn}) এক জায়গায় কালো, অন্য জায়গায় নয়।`,
                        ),
                    );
                }
                grid.cells[r]![c] = null;
                continue;
            }
            if (!isLetter(s) || !isLetter(a) || !isLetter(d)) {
                errors.push(
                    err(
                        'cell_letter',
                        `Cell (${where.en}) must be empty or hold exactly one akshara.`,
                        `ঘর (${where.bn}) খালি থাকবে, নয়তো ঠিক একটি অক্ষর থাকবে।`,
                    ),
                );
                continue;
            }
            const cell: Cell = { a, d };
            if (cellLetter(cell) !== s) {
                errors.push(
                    err(
                        'cell_mismatch',
                        `Cell (${where.en}) does not match its typed letters.`,
                        `ঘর (${where.bn})-এর অক্ষর লেখা উত্তরের সঙ্গে মেলে না।`,
                    ),
                );
                continue;
            }
            grid.cells[r]![c] = cell;
        }
    }

    const clues: Record<string, string> = {};
    const savedClues = isObject(data.clues) ? data.clues : {};
    for (const dir of ['across', 'down'] as const) {
        const list = savedClues[dir] ?? [];
        if (!Array.isArray(list)) {
            errors.push(
                err('clues', `"clues.${dir}" must be a list.`, `"clues.${dir}" একটি তালিকা হতে হবে।`),
            );
            continue;
        }
        for (const item of list) {
            if (
                !isObject(item) ||
                typeof item.row !== 'number' ||
                typeof item.col !== 'number' ||
                typeof item.clue !== 'string'
            ) {
                errors.push(
                    err(
                        'clue_item',
                        `A ${dir} clue is malformed.`,
                        `একটি ${dir === 'across' ? 'পাশাপাশি' : 'উপর-নিচ'} সূত্র ঠিকমতো লেখা নয়।`,
                    ),
                );
                continue;
            }
            if (item.clue !== '') clues[clueKey(dir, item.row, item.col)] = item.clue;
        }
    }

    if (errors.length > 0) return { ok: false, errors };
    return {
        ok: true,
        puzzle: { title: title!, author: author!, symmetry: data.symmetry as boolean, grid, clues },
    };
}
