// Messages between the page and the fill worker (fill.worker.ts).
import type { FillResult, FillStats, Grid, Slot, SuggestResult } from '@aksharkhop/core';

/** What the worker needs to know about the word filter. `blocked` is a list because a Set cannot be sent. */
export interface FilterOptions {
    minFreq: number;
    blocked: string[];
}

export type ToWorker =
    | { type: 'fill'; id: number; grid: Grid; options: FilterOptions & { seed: number; timeLimitMs: number } }
    | { type: 'cancel'; id: number }
    | { type: 'suggest'; id: number; grid: Grid; slot: Slot; options: FilterOptions & { limit: number } }
    | { type: 'count'; id: number; options: FilterOptions };

export type FromWorker =
    | { type: 'ready'; words: number }
    | { type: 'missing' }
    | { type: 'progress'; id: number; stats: FillStats }
    | { type: 'fillDone'; id: number; result: FillResult }
    | { type: 'suggestions'; id: number; result: SuggestResult }
    | { type: 'counts'; id: number; total: number; byLength: [number, number][] };
