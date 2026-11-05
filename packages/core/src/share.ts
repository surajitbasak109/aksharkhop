// The puzzle as a solver sees it, and its share link. Pure data, no DOM.
//
// A solve puzzle is the finished puzzle: the solution letters, the clues, a title and an author. It is
// built only from a puzzle that passes every Pataparbon rule (exportPataparbon), so the cells, the
// numbering and the clues are known to agree. The share code is that data as compact JSON, deflated and
// written in URL-safe base64. It is meant to go after "#solve=" in a link.
//
// The solution is in the link, because checking answers happens in the browser. Anyone who decodes the
// link can read the answers; this is a convenience for sharing a puzzle, not a secret.

import {
    exportPataparbon,
    parseAnyPuzzle,
    validatePataparbon,
    type PataparbonExport,
} from './exportPataparbon.ts';
import type { Message } from './grid.ts';
import { numberGrid, type Entry } from './numbering.ts';
import type { Puzzle } from './puzzle.ts';
import { isSingleAkshara } from './segment.ts';

export interface SolvePuzzle {
    title: string;
    author: string;
    rows: number;
    cols: number;
    /** The solution: one akshara per white cell, null for a block. */
    solution: (string | null)[][];
    /** The clue texts in numbering order (the order of the entries from `numberGrid`). */
    clues: { across: string[]; down: string[] };
}

export type SolveResult = { ok: true; solve: SolvePuzzle } | { ok: false; errors: Message[] };

const err = (code: string, en: string, bn: string): Message => ({ code, en, bn });

/** Builds the solve puzzle from validated Pataparbon data. */
export function solveFromPataparbon(data: PataparbonExport, title = '', author = ''): SolvePuzzle {
    const cells = data.grid.cells;
    return {
        title,
        author,
        rows: cells.length,
        cols: cells[0]?.length ?? 0,
        solution: cells.map((row) => row.map((cell) => ('s' in cell ? cell.s : null))),
        clues: { across: data.clues.across.map((c) => c.clue), down: data.clues.down.map((c) => c.clue) },
    };
}

/** The solve puzzle for an editor puzzle, or the reasons it cannot be shared yet. */
export function toSolvePuzzle(p: Puzzle): SolveResult {
    const out = exportPataparbon(p);
    if (!out.ok) return { ok: false, errors: out.errors };
    return { ok: true, solve: solveFromPataparbon(out.data, p.title.trim(), p.author.trim()) };
}

/** Opens either file type (an Aksharkhop save file or a Pataparbon JSON) as a solve puzzle. */
export function solveFromText(text: string): SolveResult {
    const parsed = parseAnyPuzzle(text);
    if (!parsed.ok) return { ok: false, errors: parsed.errors };
    return toSolvePuzzle(parsed.puzzle);
}

/** The entries (number, position, length) of a solve puzzle, in numbering order. */
export function solveEntries(solve: SolvePuzzle): { across: Entry[]; down: Entry[] } {
    const { across, down } = numberGrid(solve.solution.map((row) => row.map((cell) => cell === null)));
    return { across, down };
}

// ---- The share code ---------------------------------------------------------------------------

const CODE_VERSION = '1';
const UNCOMPRESSED_VERSION = '0';
/** The most JSON a code may expand to. A 15×15 puzzle with long clues is far smaller. */
const MAX_JSON_BYTES = 200_000;

interface Packed {
    v: 1;
    t: string;
    a: string;
    /** The solution rows; "" is a block. */
    g: string[][];
    /** Clue texts in numbering order. */
    ac: string[];
    dc: string[];
}

export function packSolve(s: SolvePuzzle): Packed {
    return {
        v: 1,
        t: s.title,
        a: s.author,
        g: s.solution.map((row) => row.map((c) => c ?? '')),
        ac: s.clues.across,
        dc: s.clues.down,
    };
}

function bytesToBase64Url(bytes: Uint8Array): string {
    let bin = '';
    for (let i = 0; i < bytes.length; i += 0x8000)
        bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToBytes(text: string): Uint8Array | null {
    if (!/^[A-Za-z0-9_-]*$/.test(text)) return null;
    try {
        const bin = atob(text.replace(/-/g, '+').replace(/_/g, '/'));
        return Uint8Array.from(bin, (c) => c.charCodeAt(0));
    } catch {
        return null;
    }
}

async function pipeBytes(
    bytes: Uint8Array,
    stream: CompressionStream | DecompressionStream,
    max: number,
): Promise<Uint8Array | null> {
    const writer = stream.writable.getWriter();
    void writer.write(bytes as Uint8Array<ArrayBuffer>).catch(() => undefined);
    void writer.close().catch(() => undefined);
    const reader = stream.readable.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    try {
        for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            total += value.length;
            if (total > max) {
                await reader.cancel();
                return null;
            }
            chunks.push(value);
        }
    } catch {
        return null; // not valid compressed data
    }
    const out = new Uint8Array(total);
    let at = 0;
    for (const c of chunks) {
        out.set(c, at);
        at += c.length;
    }
    return out;
}

/** The share code for a solve puzzle (deflated when this environment can, else plain). */
export async function encodeSolve(solve: SolvePuzzle): Promise<string> {
    const json = new TextEncoder().encode(JSON.stringify(packSolve(solve)));
    if (typeof CompressionStream !== 'undefined') {
        const packed = await pipeBytes(json, new CompressionStream('deflate-raw'), Infinity);
        if (packed) return `${CODE_VERSION}.${bytesToBase64Url(packed)}`;
    }
    return `${UNCOMPRESSED_VERSION}.${bytesToBase64Url(json)}`;
}

const badCode = (): SolveResult => ({
    ok: false,
    errors: [err('code', 'The link is not a valid puzzle.', 'এই লিঙ্কটি কোনো সঠিক শব্দছক নয়।')],
});

/** Reads a share code. Everything in it is checked: a bad or tampered link gives errors, never a half puzzle. */
export async function decodeSolve(code: string): Promise<SolveResult> {
    const dot = code.indexOf('.');
    const version = dot < 0 ? '' : code.slice(0, dot);
    const bytes = base64UrlToBytes(dot < 0 ? '' : code.slice(dot + 1));
    if (!bytes || (version !== CODE_VERSION && version !== UNCOMPRESSED_VERSION)) return badCode();

    let json: Uint8Array | null = bytes;
    if (version === CODE_VERSION) {
        if (typeof DecompressionStream === 'undefined') {
            return {
                ok: false,
                errors: [
                    err(
                        'unsupported',
                        'This browser cannot open compressed links. Use a newer browser.',
                        'এই ব্রাউজার সংকুচিত লিঙ্ক খুলতে পারে না। নতুন ব্রাউজার ব্যবহার করুন।',
                    ),
                ],
            };
        }
        json = await pipeBytes(bytes, new DecompressionStream('deflate-raw'), MAX_JSON_BYTES);
    } else if (bytes.length > MAX_JSON_BYTES) {
        json = null;
    }
    if (!json) return badCode();

    let data: unknown;
    try {
        data = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(json));
    } catch {
        return badCode();
    }
    return unpackSolve(data);
}

/** Checks packed data and builds the solve puzzle. The grid, numbering and clues must pass Pataparbon's rules. */
export function unpackSolve(data: unknown): SolveResult {
    const d = data as Partial<Packed> | null;
    const strings = (v: unknown): v is string[] => Array.isArray(v) && v.every((x) => typeof x === 'string');
    if (
        typeof d !== 'object' ||
        d === null ||
        d.v !== 1 ||
        typeof d.t !== 'string' ||
        typeof d.a !== 'string' ||
        !Array.isArray(d.g) ||
        !d.g.every(strings) ||
        !strings(d.ac) ||
        !strings(d.dc)
    ) {
        return badCode();
    }

    const cells = d.g.map((row) => row.map((c) => (c === '' ? { b: 1 as const } : { s: c })));
    const numbered = numberGrid(cells.map((row) => row.map((c) => 'b' in c)));
    const across = numbered.across.map((e, i) => ({ ...e, clue: d.ac![i] ?? '' }));
    const down = numbered.down.map((e, i) => ({ ...e, clue: d.dc![i] ?? '' }));
    const data2: PataparbonExport = { grid: { cells }, clues: { across, down } };

    const errors = validatePataparbon(data2);
    // The clue counts must match the entries exactly (a missing clue is already an error above).
    if (d.ac.length !== numbered.across.length || d.dc.length !== numbered.down.length) {
        errors.push(err('clue_count', 'The clues do not match the grid.', 'সূত্রগুলো ছকের সঙ্গে মেলে না।'));
    }
    if (errors.length > 0) return { ok: false, errors };
    if (!d.g.every((row) => row.every((c) => c === '' || isSingleAkshara(c)))) return badCode();

    return { ok: true, solve: solveFromPataparbon(data2, d.t, d.a) };
}

/** Where a link goes: the page's address plus "#solve=" and the code. */
export function solveLink(baseUrl: string, code: string): string {
    return `${baseUrl.replace(/#.*$/, '')}#solve=${code}`;
}

/** The share code in a link's hash, or null if it has none. */
export function codeFromHash(hash: string): string | null {
    const m = /^#solve=(.*)$/.exec(hash);
    return m ? m[1]! : null;
}
