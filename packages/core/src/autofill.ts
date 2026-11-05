// Auto-fill: fills the empty cells of a grid with words from a WordIndex. Pure data, no DOM.
//
// A constraint search over the grid's slots (words of 2+ cells):
//   - Letters already in the grid are kept. A slot that is already complete is fixed (its word counts as
//     used); a partly filled slot must match its letters.
//   - Each slot starts with every allowed word of its length that fits its letters (its "domain").
//   - Next slot: the one with the smallest domain relative to how often it has run dry (dom/wdeg).
//   - After a word is placed, each crossing slot's domain is cut to the words with that letter there.
//     Then arc consistency runs over the whole grid: a word is dropped from a slot's domain when a
//     crossing slot has no word left that could give it the letter it needs. A domain that becomes empty
//     means this word is wrong: the next one is tried.
//   - Words are tried in a weighted random order: common words first more often, from a seeded generator,
//     so a result can be reproduced from its seed.
//   - A run that takes too many steps is restarted with a new random order (the learned weights stay).
//   - No word is used twice.
//
// The search is iterative, not recursive, and `step(n)` runs at most n placements. That lets a Web Worker
// run it in slices and stop between them.

import { cellLetter, conflicts, placeAnswer, slots, type Direction, type Grid, type Slot } from './grid.ts';
import type { Allowed, WordFilter, WordIndex } from './wordIndex.ts';

export interface FillOptions extends WordFilter {
    /** Seed for the random word order. Default 1. */
    seed?: number;
    /** Stop after this long. Default 5000. */
    timeLimitMs?: number;
    /** Placements before the first restart. Default 300; each restart allows 1.5 times as many. */
    restartNodes?: number;
}

export interface Placement {
    dir: Direction;
    n: number;
    r: number;
    c: number;
    word: string;
    cells: string[];
}

export interface BlockedSlot {
    dir: Direction;
    n: number;
    r: number;
    c: number;
    len: number;
    /** What the grid shows in each cell of the slot before the fill: '' where it is empty. */
    letters: string[];
    /** How many allowed words fit the slot's letters before the fill began. */
    candidates: number;
}

export type FillFailure =
    /** A slot has no word at all that fits its letters. */
    | 'no_candidates'
    /** Every slot has words, but a slot has none that fit together with the slots it crosses. */
    | 'crossings'
    /** The whole search finished: no fill exists with these words. */
    | 'exhausted'
    | 'timeout'
    | 'cancelled'
    /** Two crossing words disagree in the grid; fix those first. */
    | 'conflicts';

export interface FillStats {
    /** Words tried. */
    nodes: number;
    restarts: number;
    ms: number;
    seed: number;
}

export type FillResult =
    | ({ status: 'solved'; placements: Placement[] } & FillStats)
    | ({ status: 'failed'; reason: FillFailure; blocked: BlockedSlot[]; conflicts: number } & FillStats);

/** Words with an unknown (0) frequency still get a small chance, so a fill is not limited to ranked words. */
const WEIGHT_FLOOR = 0.05;
const EPS = 1e-9;

function mulberry32(seed: number): () => number {
    let a = seed >>> 0;
    return () => {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

interface Cross {
    /** Position in this slot. */
    pos: number;
    /** The crossing slot, and the position in it. */
    other: number;
    otherPos: number;
}

interface Var {
    slot: Slot;
    cells: Int32Array;
    letters: string[];
    domain: Int32Array;
    rootCandidates: number;
    /** -1 open, -2 fixed (already complete), else the word id placed. */
    assigned: number;
    weight: number;
    cross: Cross[];
    /**
     * Per position, how many different aksharas the domain had there when this slot last passed its
     * support on to the crossing slots; -1 before the first time. If a position's count has not changed,
     * the set has not (it only shrinks), so the crossing slot needs no new check.
     */
    sup: Int32Array;
}

/** What to put back when a word is taken back: a slot's domain, or its support counts, or both. */
interface Trail {
    v: number;
    old?: Int32Array;
    sup?: Int32Array;
}

interface Frame {
    v: number;
    /** Min-heap of candidates by random key (a weighted random order). */
    ids: Int32Array;
    keys: Float64Array;
    size: number;
    wordId: number;
    trail: Trail[];
    set: number[];
}

export class FillSearch {
    private readonly vars: Var[] = [];
    private readonly cellSym: Int32Array;
    private readonly used = new Set<number>();
    private readonly stamps: Int32Array[];
    private maxLen = 0;
    private readonly queued: Uint8Array;
    private token = 0;
    private scratch = new Int32Array(0);
    private wordKey: Float64Array;
    private readonly frames: Frame[] = [];
    private readonly seed: number;
    private readonly timeLimit: number;
    private readonly t0 = Date.now();
    private rng: () => number;
    private needPick = true;
    private nodes = 0;
    private runNodes = 0;
    private cutoff: number;
    private restarts = 0;
    private conflictCount = 0;
    private outcome: FillResult | null = null;

    private readonly index: WordIndex;

    constructor(index: WordIndex, grid: Grid, options: FillOptions = {}) {
        this.index = index;
        this.seed = options.seed ?? 1;
        this.timeLimit = options.timeLimitMs ?? 5000;
        this.cutoff = options.restartNodes ?? 300;
        this.rng = mulberry32(this.seed);
        const allowed: Allowed = index.allowed(options);

        this.cellSym = new Int32Array(grid.rows * grid.cols);
        grid.cells.forEach((row, r) =>
            row.forEach((cell, c) => {
                const letter = cellLetter(cell);
                this.cellSym[r * grid.cols + c] =
                    cell === null ? -2 : letter === '' ? -1 : index.intern(letter);
            }),
        );

        const all = slots(grid);
        this.maxLen = Math.max(0, ...[...all.across, ...all.down].map((x) => x.len));
        this.stamps = Array.from({ length: this.maxLen }, () => new Int32Array(index.symbolCount()));
        this.queued = new Uint8Array(all.across.length + all.down.length);
        this.wordKey = new Float64Array(0);
        const owners: { v: number; pos: number }[][] = Array.from(
            { length: grid.rows * grid.cols },
            () => [],
        );
        for (const s of [...all.across, ...all.down]) {
            const dr = s.dir === 'across' ? 0 : 1;
            const dc = 1 - dr;
            const cells = new Int32Array(s.len);
            const letters: string[] = [];
            for (let i = 0; i < s.len; i++) {
                cells[i] = (s.r + i * dr) * grid.cols + (s.c + i * dc);
                letters.push(cellLetter(grid.cells[s.r + i * dr]![s.c + i * dc]!));
                owners[cells[i]!]!.push({ v: this.vars.length, pos: i });
            }
            this.vars.push({
                slot: s,
                cells,
                letters,
                domain: new Int32Array(0),
                rootCandidates: 0,
                assigned: -1,
                weight: 1,
                cross: [],
                sup: new Int32Array(s.len).fill(-1),
            });
        }
        for (const list of owners) {
            for (const a of list) {
                for (const b of list) {
                    if (a.v !== b.v) this.vars[a.v]!.cross.push({ pos: a.pos, other: b.v, otherPos: b.pos });
                }
            }
        }

        this.conflictCount = conflicts(grid).length;
        if (this.conflictCount > 0) {
            this.outcome = this.fail('conflicts', []);
            return;
        }

        const empty: number[] = [];
        this.vars.forEach((v, i) => {
            const fixed = Array.from(v.cells, (c) => this.cellSym[c]!);
            if (fixed.every((s) => s >= 0)) {
                v.assigned = -2;
                const id = index.idOf(v.letters.join(''));
                if (id >= 0) this.used.add(id);
                return;
            }
            v.domain = index.matchSymbols(fixed, allowed);
            v.rootCandidates = v.domain.length;
            if (v.domain.length === 0) empty.push(i);
        });
        if (empty.length > 0) {
            this.outcome = this.fail('no_candidates', empty);
            return;
        }
        this.scratch = new Int32Array(Math.max(0, ...this.vars.map((x) => x.domain.length)));
        this.drawKeys();

        // Arc consistency over the empty-as-given grid, once. It is never taken back: every restart starts here.
        const open = this.vars.flatMap((x, i) => (x.assigned === -1 ? [i] : []));
        open.forEach((i) => (this.queued[i] = 1));
        if (
            !this.propagate(
                {
                    v: -1,
                    ids: new Int32Array(0),
                    keys: new Float64Array(0),
                    size: 0,
                    wordId: -1,
                    trail: [],
                    set: [],
                },
                open,
            )
        ) {
            const dry = this.vars.flatMap((x, i) => (x.assigned === -1 && x.domain.length === 0 ? [i] : []));
            this.outcome = this.fail('crossings', dry);
        }
    }

    /** Words tried so far, restarts and time. */
    stats(): FillStats {
        return { nodes: this.nodes, restarts: this.restarts, ms: Date.now() - this.t0, seed: this.seed };
    }

    /** Stops the search. */
    cancel(): FillResult {
        this.outcome ??= this.fail('cancelled');
        return this.outcome;
    }

    /**
     * Tries at most `maxNodes` words, or runs for `sliceMs`, whichever comes first. Returns the result
     * once the search is over, else null (call again to go on).
     */
    step(maxNodes: number, sliceMs = Infinity): FillResult | null {
        if (this.outcome) return this.outcome;
        let budget = maxNodes;
        const sliceEnd = Date.now() + sliceMs;

        for (;;) {
            if (this.needPick) {
                const v = this.pick();
                if (v === -2) return (this.outcome = this.solved());
                if (v >= 0 && this.vars[v]!.domain.length > 0) {
                    this.frames.push(this.openFrame(v));
                    this.needPick = false;
                } else {
                    // A slot with nothing left: go back and try the previous slot's next word.
                    if (v >= 0) this.vars[v]!.weight++;
                    this.needPick = false;
                    if (this.frames.length === 0) return (this.outcome = this.fail('exhausted'));
                }
            }

            if (budget <= 0) return null;

            const f = this.frames[this.frames.length - 1]!;
            this.undo(f);
            const id = this.nextCandidate(f);
            if (id < 0) {
                this.frames.pop();
                if (this.frames.length === 0) return (this.outcome = this.fail('exhausted'));
                continue;
            }

            this.nodes++;
            this.runNodes++;
            budget--;

            // A word can take milliseconds on a hard grid, so the clock is read every time.
            const now = Date.now();
            if (now - this.t0 > this.timeLimit) return (this.outcome = this.fail('timeout'));
            if (now >= sliceEnd) budget = 0;
            if (this.runNodes >= this.cutoff) {
                this.restart();
                continue;
            }
            if (this.used.has(id)) continue;
            if (this.assign(f, id)) this.needPick = true;
        }
    }

    /** A fresh random priority for every word: small keys are tried first, common words more often. */
    private drawKeys(): void {
        const n = this.index.count;
        if (this.wordKey.length !== n) this.wordKey = new Float64Array(n);
        for (let id = 0; id < n; id++) {
            this.wordKey[id] = -Math.log(1 - this.rng()) / (WEIGHT_FLOOR + this.index.freq(id));
        }
    }

    private restart(): void {
        for (let i = this.frames.length - 1; i >= 0; i--) this.undo(this.frames[i]!);
        this.frames.length = 0;
        this.needPick = true;
        this.restarts++;
        this.runNodes = 0;
        this.cutoff = Math.ceil(this.cutoff * 1.5);
        this.rng = mulberry32(this.seed + Math.imul(this.restarts, 0x9e3779b1));
        this.drawKeys();
    }

    /** The open slot with the smallest domain per weight; a slot that is dry is returned at once; -2 when none is open. */
    private pick(): number {
        let best = -2;
        let bestScore = Infinity;
        let ties = 0;
        for (let i = 0; i < this.vars.length; i++) {
            const v = this.vars[i]!;
            if (v.assigned !== -1) continue;
            const score = v.domain.length / v.weight;
            if (v.domain.length === 0) return i;
            if (score < bestScore - EPS) {
                best = i;
                bestScore = score;
                ties = 1;
            } else if (score <= bestScore + EPS) {
                ties++;
                if (this.rng() * ties < 1) best = i;
            }
        }
        return best;
    }

    private openFrame(v: number): Frame {
        const domain = this.vars[v]!.domain;
        const n = domain.length;
        const keys = new Float64Array(n);
        for (let i = 0; i < n; i++) keys[i] = this.wordKey[domain[i]!]!;
        const ids = domain.slice();
        for (let i = (n >> 1) - 1; i >= 0; i--) siftDown(ids, keys, n, i);
        return { v, ids, keys, size: n, wordId: -1, trail: [], set: [] };
    }

    private nextCandidate(f: Frame): number {
        if (f.size === 0) return -1;
        const id = f.ids[0]!;
        const last = --f.size;
        f.ids[0] = f.ids[last]!;
        f.keys[0] = f.keys[last]!;
        siftDown(f.ids, f.keys, f.size, 0);
        return id;
    }

    /**
     * Places word `id` in the frame's slot, cuts the crossing slots to the letters it sets, and runs arc
     * consistency. False if a slot runs dry.
     */
    private assign(f: Frame, id: number): boolean {
        const v = this.vars[f.v]!;
        f.wordId = id;
        v.assigned = id;
        this.used.add(id);

        // Cells the slot's word fills in (the others were set already, and their crossing slots cut then).
        for (let k = 0; k < v.cells.length; k++) {
            const cell = v.cells[k]!;
            if (this.cellSym[cell]! < 0) {
                this.cellSym[cell] = this.index.symAt(id, k);
                f.set.push(cell);
            }
        }

        const queue: number[] = [];
        for (const x of v.cross) {
            const cell = v.cells[x.pos]!;
            if (!f.set.includes(cell)) continue;
            const t = this.vars[x.other]!;
            if (t.assigned !== -1) continue;
            const sym = this.cellSym[cell]!;
            const old = t.domain;
            let n = 0;
            for (let i = 0; i < old.length; i++) {
                if (this.index.symAt(old[i]!, x.otherPos) === sym) this.scratch[n++] = old[i]!;
            }
            if (n === old.length) continue;
            f.trail.push({ v: x.other, old });
            t.domain = this.scratch.slice(0, n);
            if (n === 0) {
                t.weight++;
                return false;
            }
            queue.push(x.other);
            this.queued[x.other] = 1;
        }
        return this.propagate(f, queue);
    }

    /**
     * Arc consistency: for each slot whose domain changed, drop from every open crossing slot the words
     * whose letter at the crossing no word of the changed slot can supply. Repeats until nothing changes.
     */
    private propagate(f: Frame, queue: number[]): boolean {
        const index = this.index;
        while (queue.length > 0) {
            const ui = queue.pop()!;
            this.queued[ui] = 0;
            const u = this.vars[ui]!;
            const len = u.cells.length;

            // One pass over the domain: which aksharas each position can still give, and how many.
            const token = ++this.token;
            const count = new Int32Array(len);
            const ud = u.domain;
            for (let i = 0; i < ud.length; i++) {
                const id = ud[i]!;
                for (let p = 0; p < len; p++) {
                    const stamp = this.stamps[p]!;
                    const sym = index.symAt(id, p);
                    if (stamp[sym] !== token) {
                        stamp[sym] = token;
                        count[p]!++;
                    }
                }
            }
            const before = u.sup;
            u.sup = count;
            f.trail.push({ v: ui, sup: before });

            for (const x of u.cross) {
                if (count[x.pos] === before[x.pos]) continue;
                const w = this.vars[x.other]!;
                if (w.assigned !== -1) continue;

                const stamp = this.stamps[x.pos]!;
                const old = w.domain;
                let n = 0;
                for (let i = 0; i < old.length; i++) {
                    if (stamp[index.symAt(old[i]!, x.otherPos)] === token) this.scratch[n++] = old[i]!;
                }
                if (n === old.length) continue;

                f.trail.push({ v: x.other, old });
                w.domain = this.scratch.slice(0, n);
                if (n === 0) {
                    w.weight++;
                    for (const q of queue) this.queued[q] = 0;
                    return false;
                }
                if (this.queued[x.other] === 0) {
                    this.queued[x.other] = 1;
                    queue.push(x.other);
                }
            }
        }
        return true;
    }

    private rollBack(f: Frame): void {
        for (let i = f.trail.length - 1; i >= 0; i--) {
            const t = f.trail[i]!;
            const v = this.vars[t.v]!;
            if (t.old) v.domain = t.old;
            if (t.sup) v.sup = t.sup;
        }
    }

    /** Takes back the frame's current word. */
    private undo(f: Frame): void {
        if (f.wordId < 0) return;
        this.rollBack(f);
        for (const cell of f.set) this.cellSym[cell] = -1;
        this.vars[f.v]!.assigned = -1;
        this.used.delete(f.wordId);
        f.wordId = -1;
        f.trail = [];
        f.set = [];
    }

    private blockedSlot(v: Var): BlockedSlot {
        const { dir, n, r, c, len } = v.slot;
        return { dir, n, r, c, len, letters: v.letters, candidates: v.rootCandidates };
    }

    private fail(reason: FillFailure, dry?: number[]): FillResult {
        let blocked: BlockedSlot[];
        if (dry) {
            blocked = dry.slice(0, 10).map((i) => this.blockedSlot(this.vars[i]!));
        } else {
            // The slots that ran dry most often are the likely culprits; failing that, the ones with the
            // fewest words to choose from.
            blocked = this.vars
                .filter((v) => v.assigned !== -2)
                .sort((a, b) => b.weight - a.weight || a.rootCandidates - b.rootCandidates)
                .slice(0, 3)
                .map((v) => this.blockedSlot(v));
        }
        return { status: 'failed', reason, blocked, conflicts: this.conflictCount, ...this.stats() };
    }

    private solved(): FillResult {
        const placements: Placement[] = [];
        for (const v of this.vars) {
            if (v.assigned < 0) continue;
            const { dir, n, r, c } = v.slot;
            placements.push({
                dir,
                n,
                r,
                c,
                word: this.index.word(v.assigned),
                cells: this.index.cellsOf(v.assigned),
            });
        }
        return { status: 'solved', placements, ...this.stats() };
    }
}

function siftDown(ids: Int32Array, keys: Float64Array, size: number, from: number): void {
    let i = from;
    for (;;) {
        const l = 2 * i + 1;
        const r = l + 1;
        let m = i;
        if (l < size && keys[l]! < keys[m]!) m = l;
        if (r < size && keys[r]! < keys[m]!) m = r;
        if (m === i) return;
        const ti = ids[i]!;
        const tk = keys[i]!;
        ids[i] = ids[m]!;
        keys[i] = keys[m]!;
        ids[m] = ti;
        keys[m] = tk;
        i = m;
    }
}

/** Runs a whole fill and returns when it is solved or has failed. */
export function autofill(index: WordIndex, grid: Grid, options: FillOptions = {}): FillResult {
    const search = new FillSearch(index, grid, options);
    for (;;) {
        const result = search.step(2000);
        if (result) return result;
    }
}

/** Writes a solved fill into the grid. Letters that were there stay. */
export function applyPlacements(grid: Grid, placements: readonly Placement[]): Grid {
    let out = grid;
    for (const p of placements) {
        out = placeAnswer(out, { dir: p.dir, n: p.n, r: p.r, c: p.c, len: p.cells.length }, p.cells);
    }
    return out;
}
