// Loads public/words.bn.json once, for the "in the word list" hint. The file is optional
// (it is built locally by scripts/build_wordlist.py and not committed).
import { useEffect, useState } from 'react';
import { WORDS_URL } from './wordsUrl.ts';

export type WordListState =
    { status: 'loading' } | { status: 'missing' } | { status: 'ready'; words: Set<string> };

let cache: Promise<WordListState> | null = null;

function load(): Promise<WordListState> {
    cache ??= fetch(WORDS_URL)
        .then(async (res) => {
            if (!res.ok) return { status: 'missing' } as const;
            const data = (await res.json()) as { words: { w: string }[] };
            return { status: 'ready', words: new Set(data.words.map((x) => x.w)) } as const;
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
