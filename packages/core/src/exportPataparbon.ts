// Export to, and import from, the Pataparbon crossword JSON (see docs/pataparbon-export-format.md).
//
// `validatePataparbon` mirrors pataparbon app/Services/Crossword/CrosswordValidator.php, rule for rule
// and with the same codes and wording (Bengali digits in the Bengali text). Pataparbon is the source of
// truth: if the two disagree, change this file to match it.

import { clueRows } from './clues.ts';
import {
    conflicts,
    createGrid,
    cellLetter,
    isSymmetric,
    isValidSize,
    toBengaliDigits,
    MAX_SIZE,
    MIN_SIZE,
    slots,
    type Direction,
    type Message,
} from './grid.ts';
import { formatJson } from './json.ts';
import { normalize } from './normalize.ts';
import { numberGrid } from './numbering.ts';
import { clueKey, parsePuzzle, type ParseResult, type Puzzle } from './puzzle.ts';
import { aksharaLength, segment } from './segment.ts';

export type PataparbonCell = { s: string } | { b: 1 };

export interface PataparbonClue {
    n: number;
    r: number;
    c: number;
    len: number;
    clue: string;
}

export interface PataparbonExport {
    grid: { cells: PataparbonCell[][] };
    clues: { across: PataparbonClue[]; down: PataparbonClue[] };
}

const err = (code: string, en: string, bn: string): Message => ({ code, en, bn });
const bn = toBengaliDigits;
const isObject = (v: unknown): v is Record<string, unknown> =>
    typeof v === 'object' && v !== null && !Array.isArray(v);

const DIRS: Record<Direction, { en: string; bn: string; step: [number, number] }> = {
    across: { en: 'Across', bn: 'পাশাপাশি', step: [0, 1] },
    down: { en: 'Down', bn: 'উপর-নিচ', step: [1, 0] },
};

/** Pataparbon's black-block test: a truthy `b`. */
const isBlockCell = (cell: unknown): boolean => isObject(cell) && Boolean(cell.b);

/** All of Pataparbon's rules. An empty list means Pataparbon accepts the puzzle. `data` is the parsed JSON. */
export function validatePataparbon(data: unknown, rows?: number, cols?: number): Message[] {
    const errors: Message[] = [];
    const cells = isObject(data) && isObject(data.grid) ? data.grid.cells : undefined;

    if (!Array.isArray(cells) || cells.length === 0) {
        return [err('grid_missing', 'The grid has no cells.', 'গ্রিডে কোনো ঘর নেই।')];
    }

    const rowCount = cells.length;
    const colCount = Array.isArray(cells[0]) ? (cells[0] as unknown[]).length : 0;

    for (const [what, label, size] of [
        ['rows', 'সারি', rowCount],
        ['columns', 'কলাম', colCount],
    ] as const) {
        if (size < MIN_SIZE || size > MAX_SIZE) {
            errors.push(
                err(
                    'size',
                    `The grid must have ${MIN_SIZE} to ${MAX_SIZE} ${what} (found ${size}).`,
                    `গ্রিডে ${bn(MIN_SIZE)} থেকে ${bn(MAX_SIZE)}টি ${label} থাকতে হবে।`,
                ),
            );
        }
    }

    if ((rows !== undefined && rows !== rowCount) || (cols !== undefined && cols !== colCount)) {
        errors.push(
            err(
                'size_mismatch',
                'The rows and columns do not match the grid.',
                'সারি ও কলামের সংখ্যা গ্রিডের সঙ্গে মেলে না।',
            ),
        );
    }

    for (let r = 0; r < rowCount; r++) {
        const row: unknown = cells[r];
        if (!Array.isArray(row) || row.length !== colCount) {
            errors.push(
                err('ragged', `Row ${r + 1} has a different length.`, `সারি ${bn(r + 1)}-এর দৈর্ঘ্য আলাদা।`),
            );
            return errors; // the checks below assume a rectangle
        }
    }

    const grid = cells as unknown[][];

    grid.forEach((row, r) =>
        row.forEach((cell, c) => {
            if (isBlockCell(cell)) return;
            const s = isObject(cell) ? cell.s : undefined;
            if (typeof s !== 'string' || aksharaLength(s) !== 1) {
                errors.push(
                    err(
                        'cell_letter',
                        `Cell (row ${r + 1}, column ${c + 1}) must hold exactly one akshara.`,
                        `ঘর (সারি ${bn(r + 1)}, কলাম ${bn(c + 1)})-এ ঠিক একটি অক্ষর থাকতে হবে।`,
                    ),
                );
            }
        }),
    );

    const numbered = numberGrid(grid.map((row) => row.map(isBlockCell)));

    // Every white cell must belong to at least one entry.
    const covered = new Set<string>();
    for (const dir of ['across', 'down'] as const) {
        const [dr, dc] = DIRS[dir].step;
        for (const entry of numbered[dir]) {
            for (let i = 0; i < entry.len; i++) covered.add(`${entry.r + i * dr}:${entry.c + i * dc}`);
        }
    }
    grid.forEach((row, r) =>
        row.forEach((cell, c) => {
            if (!isBlockCell(cell) && !covered.has(`${r}:${c}`)) {
                errors.push(
                    err(
                        'orphan_cell',
                        `Cell (row ${r + 1}, column ${c + 1}) is not part of any entry.`,
                        `ঘর (সারি ${bn(r + 1)}, কলাম ${bn(c + 1)}) কোনো শব্দের অংশ নয়।`,
                    ),
                );
            }
        }),
    );

    const clues = isObject(data) && isObject(data.clues) ? data.clues : {};
    for (const dir of ['across', 'down'] as const) {
        const { en, bn: bnDir } = DIRS[dir];
        const list = clues[dir];
        const given = new Map<number, Record<string, unknown>>();
        for (const clue of Array.isArray(list) ? list : []) {
            if (isObject(clue)) given.set(Number(clue.n ?? 0), clue);
        }

        for (const entry of numbered[dir]) {
            const clue = given.get(entry.n);
            if (clue === undefined) {
                errors.push(
                    err(
                        `clue_missing_${dir}`,
                        `${en} ${entry.n} has no clue.`,
                        `${bnDir} ${bn(entry.n)}-এর সূত্র নেই।`,
                    ),
                );
                continue;
            }

            if (typeof clue.clue !== 'string' || clue.clue.trim() === '') {
                errors.push(
                    err(
                        `clue_empty_${dir}`,
                        `${en} ${entry.n} has an empty clue.`,
                        `${bnDir} ${bn(entry.n)}-এর সূত্র খালি।`,
                    ),
                );
            }

            if (clue.r !== entry.r || clue.c !== entry.c || clue.len !== entry.len) {
                errors.push(
                    err(
                        `clue_position_${dir}`,
                        `${en} ${entry.n}: the clue's position or length does not match the grid.`,
                        `${bnDir} ${bn(entry.n)}: সূত্রের অবস্থান বা দৈর্ঘ্য গ্রিডের সঙ্গে মেলে না।`,
                    ),
                );
            }
        }

        const valid = new Set(numbered[dir].map((e) => e.n));
        for (const n of given.keys()) {
            if (!valid.has(n)) {
                errors.push(
                    err(
                        `clue_extra_${dir}`,
                        `${en} ${n} has a clue but no entry in the grid.`,
                        `${bnDir} ${bn(n)}-এর সূত্র আছে, কিন্তু গ্রিডে সেই শব্দ নেই।`,
                    ),
                );
            }
        }
    }

    return errors;
}

/** The export data for a puzzle, exactly as written. Empty cells and clues are kept (validate before using). */
export function buildPataparbon(p: Puzzle): PataparbonExport {
    const { grid } = p;
    const entries = slots(grid);
    const clues = (dir: Direction): PataparbonClue[] =>
        entries[dir].map((s) => ({
            n: s.n,
            r: s.r,
            c: s.c,
            len: s.len,
            clue: normalize(p.clues[clueKey(dir, s.r, s.c)] ?? ''),
        }));

    return {
        grid: {
            cells: grid.cells.map((row) =>
                row.map((cell): PataparbonCell => (cell === null ? { b: 1 } : { s: cellLetter(cell) })),
            ),
        },
        clues: { across: clues('across'), down: clues('down') },
    };
}

export type ExportResult =
    | { ok: true; data: PataparbonExport; json: string; warnings: Message[] }
    | { ok: false; errors: Message[]; warnings: Message[] };

const at = (r: number, c: number) => ({
    en: `row ${r + 1}, column ${c + 1}`,
    bn: `সারি ${bn(r + 1)}, কলাম ${bn(c + 1)}`,
});

/**
 * Checks the puzzle against every Pataparbon rule and, if it passes, writes the JSON. Errors block the
 * export; warnings (a clue that contains its answer) do not.
 */
export function exportPataparbon(p: Puzzle): ExportResult {
    const data = buildPataparbon(p);
    const errors: Message[] = [];
    const warnings: Message[] = [];

    for (const x of conflicts(p.grid)) {
        const w = at(x.r, x.c);
        errors.push(
            err(
                'conflict',
                `Cell (${w.en}): the across word has "${x.across}" and the down word has "${x.down}".`,
                `ঘর (${w.bn}): পাশাপাশি শব্দে "${x.across}", উপর-নিচ শব্দে "${x.down}"।`,
            ),
        );
    }

    let empty = 0;
    let firstEmpty: [number, number] | null = null;
    for (let r = 0; r < data.grid.cells.length; r++) {
        const row = data.grid.cells[r]!;
        for (let c = 0; c < row.length; c++) {
            const cell = row[c]!;
            if ('s' in cell && cell.s === '') {
                empty++;
                firstEmpty ??= [r, c];
            }
        }
    }
    if (firstEmpty) {
        const w = at(firstEmpty[0], firstEmpty[1]);
        errors.push(
            err(
                'empty_cells',
                `${empty} white cell${empty === 1 ? ' is' : 's are'} empty; the first is at ${w.en}. Every white cell needs a letter.`,
                `${bn(empty)}টি সাদা ঘর খালি; প্রথমটি ${w.bn}। প্রতিটি সাদা ঘরে একটি অক্ষর থাকতে হবে।`,
            ),
        );
    }

    // An empty cell would also fail Pataparbon's per-cell rule once for each cell; the line above covers
    // them. Every other cell holds one akshara already (the editor guarantees it).
    for (const e of validatePataparbon(data, p.grid.rows, p.grid.cols)) {
        if (e.code === 'cell_letter' && firstEmpty) continue;
        errors.push(e);
    }

    const rows = clueRows(p);
    for (const dir of ['across', 'down'] as const) {
        for (const row of rows[dir]) {
            if (!row.issues.includes('clue_has_answer')) continue;
            const { en, bn: bnDir } = DIRS[dir];
            warnings.push(
                err(
                    'clue_has_answer',
                    `${en} ${row.slot.n}: the clue contains its own answer.`,
                    `${bnDir} ${bn(row.slot.n)}: সূত্রে উত্তরটিই লেখা আছে।`,
                ),
            );
        }
    }

    if (errors.length > 0) return { ok: false, errors, warnings };
    return { ok: true, data, json: formatJson(data), warnings };
}

/**
 * Reads a Pataparbon JSON into an editable puzzle (title and author are empty: the format has none).
 * Mirrors CrosswordJson::parse: the text is NFC-normalized first, and a clue's r, c and len may be left out.
 */
export function importPataparbon(text: string): ParseResult {
    let data: unknown;
    try {
        data = JSON.parse(normalize(text.replace(/^﻿/, '')));
    } catch {
        data = null;
    }
    if (!isObject(data) || !isObject(data.grid) || !isObject(data.clues)) {
        return {
            ok: false,
            errors: [
                err(
                    'json',
                    'The JSON is not valid. It needs a "grid" and a "clues" key.',
                    'JSON ঠিক নেই। "grid" ও "clues" দুটি কী-ই থাকতে হবে।',
                ),
            ],
        };
    }

    const rawCells = data.grid.cells;
    const numbered = Array.isArray(rawCells)
        ? numberGrid(
              rawCells.map((row: unknown) => (Array.isArray(row) ? (row as unknown[]).map(isBlockCell) : [])),
          )
        : null;

    // Fill in a clue's position from the numbering when it is left out, as Pataparbon does.
    const filled: Record<Direction, Record<string, unknown>[]> = { across: [], down: [] };
    for (const dir of ['across', 'down'] as const) {
        const list = (data.clues as Record<string, unknown>)[dir];
        for (const clue of Array.isArray(list) ? list : []) {
            if (!isObject(clue)) continue;
            const entry = numbered?.[dir].find((e) => e.n === clue.n);
            filled[dir].push({ ...entry, ...clue });
        }
    }

    const normalized = { grid: data.grid, clues: filled };
    const errors = validatePataparbon(normalized);
    if (errors.length > 0) return { ok: false, errors };

    const rows = (rawCells as unknown[][]).length;
    const cols = (rawCells as unknown[][])[0]!.length;
    if (!isValidSize(rows) || !isValidSize(cols)) return { ok: false, errors: [] };

    const grid = createGrid(rows, cols);
    (rawCells as unknown[][]).forEach((row, r) =>
        row.forEach((cell, c) => {
            if (isBlockCell(cell)) {
                grid.cells[r]![c] = null;
            } else {
                const s = segment(String((cell as { s: unknown }).s)).join('');
                grid.cells[r]![c] = { a: s, d: s };
            }
        }),
    );

    const clues: Record<string, string> = {};
    for (const dir of ['across', 'down'] as const) {
        for (const clue of filled[dir]) {
            const text = normalize(String(clue.clue ?? ''));
            if (text !== '') clues[clueKey(dir, clue.r as number, clue.c as number)] = text;
        }
    }

    return {
        ok: true,
        puzzle: { title: '', author: '', symmetry: isSymmetric(grid), grid, clues },
    };
}

export type OpenResult =
    (ParseResult & { ok: true; format: 'aksharkhop' | 'pataparbon' }) | (ParseResult & { ok: false });

/** Opens either file type: an Aksharkhop save file, or a Pataparbon crossword JSON. */
export function parseAnyPuzzle(text: string): OpenResult {
    let data: unknown = null;
    try {
        data = JSON.parse(text.replace(/^﻿/, ''));
    } catch {
        // parsePuzzle reports the JSON error
    }
    const pataparbon = isObject(data) && !('version' in data) && isObject(data.grid) && 'cells' in data.grid;
    if (pataparbon) {
        const r = importPataparbon(text);
        return r.ok ? { ...r, format: 'pataparbon' } : r;
    }
    const r = parsePuzzle(text);
    return r.ok ? { ...r, format: 'aksharkhop' } : r;
}
