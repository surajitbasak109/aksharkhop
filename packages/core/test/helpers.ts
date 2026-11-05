import { createGrid, setBlock, type Grid } from '../src/grid.ts';
import type { WordEntry } from '../src/wordIndex.ts';

/** Words as entries with one Latin letter per cell, so tests stay readable. */
export const entry = (w: string, freq = 0): WordEntry => ({ w, cells: [...w], freq });

export function mulberry32(seed: number): () => number {
    let a = seed >>> 0;
    return () => {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/** A grid from rows of '#' (block) and '.' (white). */
export function gridFrom(pattern: string[]): Grid {
    let g = createGrid(pattern.length, pattern[0]!.length);
    pattern.forEach((row, r) =>
        [...row].forEach((ch, c) => {
            if (ch === '#') g = setBlock(g, r, c, true, false);
        }),
    );
    return g;
}
