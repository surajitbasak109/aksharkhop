// Loads public/words.txt once, for the "in the word list" hint. The file is optional: if it is missing
// (or is not a word file) the hint just says the list was not found.
import { readWordFile } from '@aksharkhop/core';
import { useEffect, useState } from 'react';
import { WORDS_URL } from './wordsUrl.ts';

export type WordListState =
    { status: 'loading' } | { status: 'missing' } | { status: 'ready'; words: Set<string> };

let cache: Promise<WordListState> | null = null;

function load(): Promise<WordListState> {
    cache ??= fetch(WORDS_URL)
        .then(async (res) => {
            if (!res.ok) return { status: 'missing' } as const;
            const rows = readWordFile(await res.text());
            return { status: 'ready', words: new Set(rows.map((r) => r.w)) } as const;
        })
        .catch(() => ({ status: 'missing' }) as const);
    return cache;
}

export function useWordList(): WordListState {
    const [state, setState] = useState<WordListState>({ status: 'loading' });
    useEffect(() => {
        let live = true;
        void load().then((s) => live && setState(s));
        return () => {
            live = false;
        };
    }, []);
    return state;
}
