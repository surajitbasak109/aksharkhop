// Batch clue drafting without an API: build a prompt for a batch of words, read the chatbot's reply,
// make a review sheet (TSV) for the human, and turn the human's decisions into approved clues.
// Pure text in, text out; the scripts in scripts/clues.ts do the file work.

import { leaksAnswer } from './clueDraft.ts';
import { normalize } from './normalize.ts';

export interface BatchEntry {
    w: string;
    /** English meanings (Kaikki); build-only input, never shipped. */
    glosses: string[];
}

export function buildBatchPrompt(entries: BatchEntry[]): string {
    const lines = entries.map((e) => `${e.w}\t${e.glosses.slice(0, 4).join('; ')}`);
    return [
        'You write clues for Bengali crosswords (West Bengal usage).',
        'Below are Bengali words, each followed by its English meanings (a tab separates them).',
        'For every word give exactly 3 short Bengali clues, in Bengali script, one per style:',
        'a definition (সংজ্ঞা), a synonym (সমার্থক), and a fill-in-the-blank (শূন্যস্থান, ____ for the missing word).',
        'A clue must not contain the word, or any two or more consecutive letters-with-vowel-signs of it.',
        'If you are unsure what a word means, give an empty array for it.',
        'Reply with only one JSON object: each key is the word exactly as given, each value an array of clue strings.',
        'No explanation, no text outside the object.',
        '',
        ...lines,
    ].join('\n');
}

/** Reads the chatbot's reply: the first JSON object of word -> array of strings. Bad input gives {}. */
export function parseBatchReply(text: string): Record<string, string[]> {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start < 0 || end <= start) return {};
    let value: unknown;
    try {
        value = JSON.parse(text.slice(start, end + 1));
    } catch {
        return {};
    }
    const out: Record<string, string[]> = {};
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return out;
    for (const [k, v] of Object.entries(value)) {
        if (!Array.isArray(v)) continue;
        out[normalize(k)] = v
            .filter((x): x is string => typeof x === 'string')
            .map((x) => normalize(x).trim());
    }
    return out;
}

export interface ReviewRow {
    word: string;
    clue: string;
    /** 'ok' accepts the clue as written; anything else (or empty) does not. */
    decision: string;
    /** If filled in, this text is approved instead of the clue. */
    edited: string;
}

export const REVIEW_HEADER = ['word', 'clue', 'decision', 'edited'];

const cell = (s: string) => s.replace(/[\t\r\n]+/g, ' ').trim();

export function formatReviewTsv(rows: ReviewRow[]): string {
    const head =
        '# Set decision to ok to accept a clue as written. Or type a better clue in edited. Leave both empty to skip.';
    const lines = rows.map((r) => [r.word, r.clue, r.decision, r.edited].map(cell).join('\t'));
    return [head, REVIEW_HEADER.join('\t'), ...lines].join('\n') + '\n';
}

export function parseReviewTsv(text: string): ReviewRow[] {
    const rows: ReviewRow[] = [];
    for (const line of text.replace(/^﻿/, '').split(/\r?\n/)) {
        if (line.trim() === '' || line.startsWith('#')) continue;
        const [word = '', clue = '', decision = '', edited = ''] = line.split('\t');
        if (normalize(word) === 'word' && clue.trim() === 'clue') continue;
        rows.push({
            word: normalize(word.trim()),
            clue: normalize(clue.trim()),
            decision: decision.trim(),
            edited: normalize(edited.trim()),
        });
    }
    return rows;
}

export interface ApprovedClue {
    word: string;
    clue: string;
    /** 'draft' = accepted as drafted; 'edited' = the human's own wording. */
    how: 'draft' | 'edited';
}

/** Turns the human's decisions into approved clues. Edited text wins. Clues that give the word away are refused. */
export function approveReview(rows: ReviewRow[]): { approved: ApprovedClue[]; refused: ReviewRow[] } {
    const approved: ApprovedClue[] = [];
    const refused: ReviewRow[] = [];
    const seen = new Set<string>();
    for (const r of rows) {
        const edited = r.edited !== '';
        const accept = edited || r.decision.toLowerCase() === 'ok';
        if (!accept || r.word === '') continue;
        const clue = edited ? r.edited : r.clue;
        if (clue === '') continue;
        if (leaksAnswer(clue, r.word)) {
            refused.push(r);
            continue;
        }
        const id = `${r.word}\t${clue}`;
        if (seen.has(id)) continue;
        seen.add(id);
        approved.push({ word: r.word, clue, how: edited ? 'edited' : 'draft' });
    }
    return { approved, refused };
}

export const CLUE_FILE_HEADER = '# aksharkhop clues v1';

export function formatClueFile(clues: { word: string; clue: string }[]): string {
    const lines = [...clues]
        .sort((a, b) => a.word.localeCompare(b.word, 'bn'))
        .map((c) => `${cell(c.word)}\t${cell(c.clue)}`);
    return [CLUE_FILE_HEADER, ...lines].join('\n') + '\n';
}

/** Reads a clue file into word -> clues. Refuses a file without the header. */
export function readClueFile(text: string): Map<string, string[]> {
    const lines = text.replace(/^﻿/, '').split(/\r?\n/);
    if (lines[0]?.trim() !== CLUE_FILE_HEADER) throw new Error('not a clue file');
    const map = new Map<string, string[]>();
    for (const line of lines.slice(1)) {
        if (line.trim() === '' || line.startsWith('#')) continue;
        const [w = '', c = ''] = line.split('\t');
        const word = normalize(w.trim());
        const clue = normalize(c.trim());
        if (word === '' || clue === '') continue;
        map.set(word, [...(map.get(word) ?? []), clue]);
    }
    return map;
}
