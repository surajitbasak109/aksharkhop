// "Suggest words for this slot": the words that fit the slot's letters and leave every crossing slot
// with at least one word. Pure data, no DOM.

import { cellLetter, slotCells, slots, type Grid, type Slot } from './grid.ts';
import type { WordFilter, WordIndex } from './wordIndex.ts';

export interface SuggestOptions extends WordFilter {
    /** How many words to return. Default 40. */
    limit?: number;
    /** Most words to test against the crossing slots. Default 4000. */
    checkLimit?: number;
}

export interface Suggestion {
    word: string;
    cells: string[];
    freq: number;
}

export interface SuggestResult {
    /** How many allowed words fit the slot's own letters. */
    fitting: number;
    /** The best of them (most common first) that leave each crossing slot a word. */
    words: Suggestion[];
    /** True when `checkLimit` stopped the search before the list was full. */
    truncated: boolean;
}

export function suggestWords(
    index: WordIndex,
    grid: Grid,
    slot: Slot,
    options: SuggestOptions = {},
): SuggestResult {
    const limit = options.limit ?? 40;
    const checkLimit = options.checkLimit ?? 4000;
    const allowed = index.allowed(options);

    const cells = slotCells(slot);
    const letters = cells.map(([r, c]) => cellLetter(grid.cells[r]![c]!));
    const fitting = index.match(letters, allowed);

    // Words already complete elsewhere in the grid may not be used again.
    const all = slots(grid);
    const taken = new Set<string>();
    for (const s of [...all.across, ...all.down]) {
        if (s.dir === slot.dir && s.r === slot.r && s.c === slot.c) continue;
        const word = slotCells(s).map(([r, c]) => cellLetter(grid.cells[r]![c]!));
        if (word.every((l) => l !== '')) taken.add(word.join(''));
    }

    // The slot across each of this slot's cells, with the letters it shows now.
    const crossing = cells.map(([r, c]) => {
        const other = (slot.dir === 'across' ? all.down : all.across).find((s) => {
            const cs = slotCells(s);
            return cs.some(([cr, cc]) => cr === r && cc === c);
        });
        if (!other) return null;
        const oc = slotCells(other);
        return {
            at: oc.findIndex(([cr, cc]) => cr === r && cc === c),
            letters: oc.map(([cr, cc]) => cellLetter(grid.cells[cr]![cc]!)),
        };
    });

    const order = Array.from(fitting).sort(
        (a, b) => index.freq(b) - index.freq(a) || (index.word(a) < index.word(b) ? -1 : 1),
    );

    const words: Suggestion[] = [];
    let checked = 0;
    let truncated = false;
    for (const id of order) {
        if (words.length >= limit) break;
        if (checked >= checkLimit) {
            truncated = true;
            break;
        }
        checked++;
        const word = index.word(id);
        if (taken.has(word)) continue;

        let fits = true;
        for (let k = 0; k < cells.length && fits; k++) {
            const x = crossing[k];
            if (!x) continue;
            const pattern = x.letters.slice();
            pattern[x.at] = index.textOf(index.symAt(id, k));
            fits = index.match(pattern, allowed).length > 0;
        }
        if (fits) words.push({ word, cells: index.cellsOf(id), freq: index.freq(id) });
    }

    return { fitting: fitting.length, words, truncated };
}
