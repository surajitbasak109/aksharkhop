import { readClueFile } from '@aksharkhop/core';

/** Where the approved clues are fetched from (built by `node scripts/clues.ts approve`). */
const CLUES_URL = `${import.meta.env.BASE_URL}clues.txt`;

let loaded: Promise<Map<string, string[]>> | null = null;

/** The approved clues for a word. Loaded once; a missing or bad file just means no clues. */
export async function approvedCluesFor(word: string): Promise<string[]> {
    loaded ??= fetch(CLUES_URL)
        .then((r) => (r.ok ? r.text() : ''))
        .then((t) => readClueFile(t))
        .catch(() => new Map<string, string[]>());
    return (await loaded).get(word.normalize('NFC')) ?? [];
}
