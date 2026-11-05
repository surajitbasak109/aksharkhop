// The page's side of the fill worker: one worker for the whole page, started on first use.
import type { FillResult, FillStats, Grid, Slot, SuggestResult } from '@aksharkhop/core';
import { useEffect, useState } from 'react';
import type { FilterOptions, FromWorker, ToWorker } from './fillProtocol.ts';

export type WorkerStatus = { status: 'loading' } | { status: 'missing' } | { status: 'ready'; words: number };

type Listener = () => void;

class FillClient {
    status: WorkerStatus = { status: 'loading' };
    private readonly worker: Worker;
    private nextId = 1;
    private readonly listeners = new Set<Listener>();
    private readonly waiting = new Map<number, (m: FromWorker) => void>();
    private readonly progress = new Map<number, (s: FillStats) => void>();

    constructor() {
        this.worker = new Worker(new URL('./fill.worker.ts', import.meta.url), { type: 'module' });
        this.worker.onmessage = (e: MessageEvent<FromWorker>) => {
            const m = e.data;
            if (m.type === 'ready') this.set({ status: 'ready', words: m.words });
            else if (m.type === 'missing') this.set({ status: 'missing' });
            else if (m.type === 'progress') this.progress.get(m.id)?.(m.stats);
            else this.waiting.get(m.id)?.(m);
        };
        this.worker.onerror = () => this.set({ status: 'missing' });
    }

    private set(s: WorkerStatus) {
        this.status = s;
        this.listeners.forEach((l) => l());
    }

    subscribe(l: Listener): () => void {
        this.listeners.add(l);
        return () => this.listeners.delete(l);
    }

    private send(m: ToWorker) {
        this.worker.postMessage(m);
    }

    private ask<T extends FromWorker['type']>(
        build: (id: number) => ToWorker,
        reply: T,
    ): { id: number; promise: Promise<Extract<FromWorker, { type: T }>> } {
        const id = this.nextId++;
        const promise = new Promise<Extract<FromWorker, { type: T }>>((resolve) => {
            this.waiting.set(id, (m) => {
                if (m.type !== reply) return;
                this.waiting.delete(id);
                this.progress.delete(id);
                resolve(m as Extract<FromWorker, { type: T }>);
            });
        });
        this.send(build(id));
        return { id, promise };
    }

    /** Starts a fill. `cancel()` makes the result a 'cancelled' failure. */
    fill(
        grid: Grid,
        options: FilterOptions & { seed: number; timeLimitMs: number },
        onProgress: (s: FillStats) => void,
    ): { result: Promise<FillResult>; cancel: () => void } {
        const { id, promise } = this.ask((i) => ({ type: 'fill', id: i, grid, options }), 'fillDone');
        this.progress.set(id, onProgress);
        return {
            result: promise.then((m) => m.result),
            cancel: () => this.send({ type: 'cancel', id }),
        };
    }

    suggest(grid: Grid, slot: Slot, options: FilterOptions & { limit: number }): Promise<SuggestResult> {
        return this.ask((id) => ({ type: 'suggest', id, grid, slot, options }), 'suggestions').promise.then(
            (m) => m.result,
        );
    }

    count(options: FilterOptions): Promise<{ total: number; byLength: [number, number][] }> {
        return this.ask((id) => ({ type: 'count', id, options }), 'counts').promise;
    }
}

let client: FillClient | null = null;

/** The shared worker client, started the first time it is asked for. */
export function useFillClient(): { client: FillClient; status: WorkerStatus } {
    client ??= new FillClient();
    const c = client;
    const [status, setStatus] = useState(c.status);
    useEffect(() => {
        setStatus(c.status);
        return c.subscribe(() => setStatus(c.status));
    }, [c]);
    return { client: c, status };
}

export type { FillClient };
