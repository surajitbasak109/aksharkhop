// Word index for auto-fill and word suggestions. Pure data, no DOM.
//
// Every distinct akshara is interned to a small integer ("symbol") and every word becomes a row of
// symbols, so comparing two cells is one integer comparison. For each (length, position, symbol) the
// index keeps the sorted ids of the words with that akshara there: the plan's
// Map<len, Map<pos:akshara, Set<wordId>>>, held as sorted Int32Arrays because the solver walks them
// far more often than it looks one up.

export interface WordEntry {
    /** The word as text. */
    w: string;
    /** Its aksharas, one per cell. */
    cells: readonly string[];
    /** Frequency score in [0, 1]; 0 means unknown. */
    freq: number;
}

export interface WordFilter {
    /** Words with a lower frequency score are left out. 0 keeps every word, including unranked ones. */
    minFreq?: number;
    /** Words that must never be used. */
    blocked?: ReadonlySet<string>;
}

/** One entry per word id: 1 when the word may be used. Built by `WordIndex.allowed`. */
export type Allowed = Uint8Array;

export class WordIndex {
    readonly count: number;
    private readonly words: string[] = [];
    private readonly freqs: Float64Array;
    private readonly starts: Int32Array;
    private readonly lens: Int32Array;
    private readonly syms: Int32Array;
    private readonly symbolIds = new Map<string, number>();
    private readonly symbolText: string[] = [];
    private readonly wordIds = new Map<string, number>();
    private readonly byLength = new Map<number, Int32Array>();
    // postings[len][pos] : symbol -> sorted word ids
    private readonly postings = new Map<number, Map<number, Int32Array>[]>();

    constructor(entries: readonly WordEntry[]) {
        this.count = entries.length;
        this.freqs = new Float64Array(entries.length);
        this.starts = new Int32Array(entries.length + 1);
        this.lens = new Int32Array(entries.length);

        let total = 0;
        for (const e of entries) total += e.cells.length;
        this.syms = new Int32Array(total);

        let at = 0;
        entries.forEach((e, id) => {
            this.words.push(e.w);
            this.wordIds.set(e.w, id);
            this.freqs[id] = e.freq;
            this.starts[id] = at;
            this.lens[id] = e.cells.length;
            for (const cell of e.cells) this.syms[at++] = this.intern(cell);
        });
        this.starts[entries.length] = at;

        // Group ids by length, then by (position, symbol). Ids go in ascending order, so every list is sorted.
        const groups = new Map<number, number[]>();
        for (let id = 0; id < this.count; id++) {
            const len = this.lens[id]!;
            let g = groups.get(len);
            if (!g) groups.set(len, (g = []));
            g.push(id);
        }
        for (const [len, ids] of groups) {
            this.byLength.set(len, Int32Array.from(ids));
            const perPos: Map<number, number[]>[] = Array.from({ length: len }, () => new Map());
            for (const id of ids) {
                for (let p = 0; p < len; p++) {
                    const sym = this.syms[this.starts[id]! + p]!;
                    let list = perPos[p]!.get(sym);
                    if (!list) perPos[p]!.set(sym, (list = []));
                    list.push(id);
                }
            }
            this.postings.set(
                len,
                perPos.map((m) => new Map([...m].map(([sym, list]) => [sym, Int32Array.from(list)]))),
            );
        }
    }

    /** The symbol for an akshara, adding it if it is new (a grid letter no word has matches nothing). */
    intern(cell: string): number {
        let id = this.symbolIds.get(cell);
        if (id === undefined) {
            id = this.symbolText.length;
            this.symbolIds.set(cell, id);
            this.symbolText.push(cell);
        }
        return id;
    }

    /** How many symbols there are so far. */
    symbolCount(): number {
        return this.symbolText.length;
    }

    /** The akshara a symbol stands for. */
    textOf(sym: number): string {
        return this.symbolText[sym] ?? '';
    }

    word(id: number): string {
        return this.words[id] ?? '';
    }

    freq(id: number): number {
        return this.freqs[id] ?? 0;
    }

    length(id: number): number {
        return this.lens[id] ?? 0;
    }

    /** The symbol at cell `pos` of word `id`. */
    symAt(id: number, pos: number): number {
        return this.syms[this.starts[id]! + pos]!;
    }

    /** The aksharas of a word. */
    cellsOf(id: number): string[] {
        const out: string[] = [];
        for (let p = 0; p < this.length(id); p++) out.push(this.symbolText[this.symAt(id, p)]!);
        return out;
    }

    idOf(word: string): number {
        return this.wordIds.get(word) ?? -1;
    }

    has(word: string): boolean {
        return this.wordIds.has(word);
    }

    /** The lengths that have words, ascending. */
    lengths(): number[] {
        return [...this.byLength.keys()].sort((a, b) => a - b);
    }

    /** Every word id of one length, ascending. */
    idsOfLength(len: number): Int32Array {
        return this.byLength.get(len) ?? new Int32Array(0);
    }

    /** The ids of the words of length `len` with symbol `sym` at `pos`, ascending. */
    posting(len: number, pos: number, sym: number): Int32Array {
        return this.postings.get(len)?.[pos]?.get(sym) ?? new Int32Array(0);
    }

    /** Which words a filter allows. */
    allowed(filter: WordFilter = {}): Allowed {
        const out = new Uint8Array(this.count).fill(1);
        const min = filter.minFreq ?? 0;
        if (min > 0) {
            for (let id = 0; id < this.count; id++) if (this.freqs[id]! < min) out[id] = 0;
        }
        for (const w of filter.blocked ?? []) {
            const id = this.wordIds.get(w);
            if (id !== undefined) out[id] = 0;
        }
        return out;
    }

    /** How many words a filter allows, and how many of those have each length. */
    countAllowed(allowed: Allowed): { total: number; byLength: Map<number, number> } {
        const byLength = new Map<number, number>();
        let total = 0;
        for (let id = 0; id < this.count; id++) {
            if (allowed[id] === 0) continue;
            total++;
            byLength.set(this.lens[id]!, (byLength.get(this.lens[id]!) ?? 0) + 1);
        }
        return { total, byLength };
    }

    /**
     * The ids of the words that fit `fixed`: one symbol per cell, -1 where the cell is open. Ascending.
     * The length of `fixed` is the word length.
     */
    matchSymbols(fixed: ArrayLike<number>, allowed?: Allowed): Int32Array {
        const len = fixed.length;
        let best: Int32Array | null = null;
        for (let p = 0; p < len; p++) {
            if (fixed[p]! < 0) continue;
            const list = this.posting(len, p, fixed[p]!);
            if (best === null || list.length < best.length) best = list;
            if (list.length === 0) return list;
        }
        const pool = best ?? this.idsOfLength(len);

        const out = new Int32Array(pool.length);
        let n = 0;
        outer: for (let i = 0; i < pool.length; i++) {
            const id = pool[i]!;
            if (allowed && allowed[id] === 0) continue;
            for (let p = 0; p < len; p++) {
                const want = fixed[p]!;
                if (want >= 0 && this.syms[this.starts[id]! + p] !== want) continue outer;
            }
            out[n++] = id;
        }
        return out.slice(0, n);
    }

    /** The same with aksharas as text: '' (or null) leaves a cell open. */
    match(pattern: readonly (string | null)[], allowed?: Allowed): Int32Array {
        const fixed = pattern.map((cell) => (cell ? this.intern(cell) : -1));
        return this.matchSymbols(fixed, allowed);
    }
}
