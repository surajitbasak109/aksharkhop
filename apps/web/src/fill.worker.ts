// Loads the word list, builds the index, and runs fills and suggestions off the page's thread.
// A fill runs in slices of 50 ms with a pause between, so a "cancel" message can get through.
import { FillSearch, suggestWords, WordIndex, type WordEntry } from '@aksharkhop/core';
import type { FromWorker, ToWorker } from './fillProtocol.ts';
import { WORDS_URL } from './wordsUrl.ts';

const ctx = self as unknown as {
    postMessage(message: FromWorker): void;
    onmessage: ((e: MessageEvent<ToWorker>) => void) | null;
};

let index: WordIndex | null = null;
const cancelled = new Set<number>();

const ready: Promise<WordIndex | null> = fetch(WORDS_URL)
    .then(async (res) => {
        if (!res.ok) return null;
        const data = (await res.json()) as { words: WordEntry[] };
        index = new WordIndex(data.words);
        ctx.postMessage({ type: 'ready', words: index.count });
        return index;
    })
    .catch(() => null)
    .then((i) => {
        if (!i) ctx.postMessage({ type: 'missing' });
        return i;
    });

const pause = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

ctx.onmessage = async (e) => {
    const msg = e.data;
    if (msg.type === 'cancel') {
        cancelled.add(msg.id);
        return;
    }
    const idx = await ready;
    if (!idx) return;

    switch (msg.type) {
        case 'count': {
            const { total, byLength } = idx.countAllowed(
                idx.allowed({ minFreq: msg.options.minFreq, blocked: new Set(msg.options.blocked) }),
            );
            ctx.postMessage({ type: 'counts', id: msg.id, total, byLength: [...byLength] });
            return;
        }
        case 'suggest': {
            const result = suggestWords(idx, msg.grid, msg.slot, {
                minFreq: msg.options.minFreq,
                blocked: new Set(msg.options.blocked),
                limit: msg.options.limit,
            });
            ctx.postMessage({ type: 'suggestions', id: msg.id, result });
            return;
        }
        case 'fill': {
            const search = new FillSearch(idx, msg.grid, {
                seed: msg.options.seed,
                timeLimitMs: msg.options.timeLimitMs,
                minFreq: msg.options.minFreq,
                blocked: new Set(msg.options.blocked),
            });
            let lastReport = 0;
            for (;;) {
                if (cancelled.delete(msg.id)) {
                    ctx.postMessage({ type: 'fillDone', id: msg.id, result: search.cancel() });
                    return;
                }
                const result = search.step(Infinity, 50);
                if (result) {
                    ctx.postMessage({ type: 'fillDone', id: msg.id, result });
                    return;
                }
                const now = Date.now();
                if (now - lastReport >= 200) {
                    lastReport = now;
                    ctx.postMessage({ type: 'progress', id: msg.id, stats: search.stats() });
                }
                await pause();
            }
        }
    }
};
