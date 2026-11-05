// The word list as shipped to the browser: `public/words.txt`, written by scripts/build_wordlist.py.
//
//     # aksharkhop words v1
//     অংশ<TAB>0.56
//     অংশক
//
// One word per line. A tab and a frequency score in (0, 1] follow when the score is known; a word with
// no score (unknown, 0) is just the word. The aksharas are not stored: they are worked out here with the
// same splitter as everywhere else, so the list and the app can never disagree about a split.
//
// The first line must be the header. A missing file on a single-page host comes back as the app's own
// HTML page with a success status, and this check stops that from being read as words.

import { segment } from './segment.ts';
import type { WordEntry } from './wordIndex.ts';

export const WORD_FILE_HEADER = '# aksharkhop words v1';

export interface WordRow {
    w: string;
    /** Frequency score in [0, 1]; 0 when unknown. */
    freq: number;
}

/** Reads the words and scores without splitting them (fast). Throws if the text is not a word file. */
export function readWordFile(text: string): WordRow[] {
    const lines = text.split('\n');
    if ((lines[0] ?? '').replace(/\r$/, '').trim() !== WORD_FILE_HEADER) {
        throw new Error('Not an Aksharkhop word file.');
    }
    const rows: WordRow[] = [];
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i]!.replace(/\r$/, '');
        if (line === '' || line.startsWith('#')) continue;
        const tab = line.indexOf('\t');
        const w = tab < 0 ? line : line.slice(0, tab);
        const score = tab < 0 ? 0 : Number(line.slice(tab + 1));
        rows.push({ w, freq: Number.isFinite(score) ? Math.min(1, Math.max(0, score)) : 0 });
    }
    return rows;
}

/** The word entries for the index: each word with its aksharas. */
export function parseWordFile(text: string): WordEntry[] {
    return readWordFile(text).map(({ w, freq }) => ({ w, cells: segment(w), freq }));
}
