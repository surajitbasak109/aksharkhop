// Drafting clues with Claude, from a key the user supplies. Pure logic plus one `fetch` call (injectable
// for tests); no DOM and no storage. The key is only ever used for one request header: it is never
// returned, logged or put in an error message.

import { normalize } from './normalize.ts';
import { segment } from './segment.ts';

export const CLAUDE_MODEL = 'claude-sonnet-5-5';
export const CLAUDE_URL = 'https://api.anthropic.com/v1/messages';
/** How many drafts to ask for, and to show. */
export const MAX_DRAFTS = 3;

/**
 * True when the clue gives the answer away: it contains the whole answer, or any run of 2 or more
 * consecutive aksharas (cells) of it.
 */
export function leaksAnswer(clue: string, answer: string): boolean {
    const text = normalize(clue);
    const cells = segment(normalize(answer));
    if (cells.length === 0) return false;
    if (cells.length === 1) return text.includes(cells[0]!);
    for (let i = 0; i + 1 < cells.length; i++) {
        for (let j = i + 2; j <= cells.length; j++) {
            if (text.includes(cells.slice(i, j).join(''))) return true;
        }
    }
    return false;
}

export function buildDraftPrompt(answer: string): { system: string; user: string } {
    const cells = segment(normalize(answer));
    const system =
        'You write clues for Bengali crosswords (West Bengal usage). Reply with only a JSON array of ' +
        `${MAX_DRAFTS} short Bengali clue strings, in Bengali script, one per style: a definition (সংজ্ঞা), ` +
        'a synonym (সমার্থক), and a fill-in-the-blank (শূন্যস্থান, with ____ for the missing word). ' +
        'A clue must not contain the answer or any two or more consecutive letters-with-vowel-signs of it. ' +
        'No numbering, no explanation, no text outside the array.';
    const user = `Answer: ${cells.join('')} (${cells.length} cells: ${cells.join(' | ')})`;
    return { system, user };
}

/** Reads the model's reply: the first JSON array of strings in it. Anything else gives []. */
export function parseDrafts(text: string): string[] {
    const start = text.indexOf('[');
    const end = text.lastIndexOf(']');
    if (start < 0 || end <= start) return [];
    try {
        const value: unknown = JSON.parse(text.slice(start, end + 1));
        if (!Array.isArray(value)) return [];
        return value.filter((v): v is string => typeof v === 'string').map((v) => normalize(v).trim());
    } catch {
        return [];
    }
}

/** One piece of text to paste into any chatbot: the instructions and the answer together. */
export function buildCopyPrompt(answer: string): string {
    const { system, user } = buildDraftPrompt(answer);
    return `${system}\n\n${user}`;
}

/**
 * Reads a reply pasted from a chatbot. Prefers a JSON array; if there is none, takes the lines of a
 * plain list ("1. …", "- …", quotes allowed). Then filters like draftClues does.
 */
export function readPastedReply(text: string, answer: string): string[] {
    let drafts = parseDrafts(text);
    if (drafts.length === 0) {
        drafts = text
            .split(/\r?\n/)
            .map((l) =>
                normalize(l)
                    .replace(/^\s*(?:[-*•]|[0-9০-৯]+[.)])\s*/, '')
                    .replace(/^["“”']+|["“”',]+$/g, '')
                    .trim(),
            )
            .filter((l) => l !== '' && !l.startsWith('```'));
    }
    return filterDrafts(drafts, answer);
}

/** Drops empty, repeated and answer-leaking drafts, and keeps at most MAX_DRAFTS. */
export function filterDrafts(drafts: string[], answer: string): string[] {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const d of drafts) {
        if (d === '' || seen.has(d) || leaksAnswer(d, answer)) continue;
        seen.add(d);
        out.push(d);
        if (out.length === MAX_DRAFTS) break;
    }
    return out;
}

export type DraftErrorCode = 'no_key' | 'bad_key' | 'rate_limit' | 'network' | 'server' | 'no_usable_clue';

export class DraftError extends Error {
    readonly code: DraftErrorCode;
    constructor(code: DraftErrorCode) {
        super(code);
        this.code = code;
    }
}

type Fetch = (
    url: string,
    init: { method: string; headers: Record<string, string>; body: string },
) => Promise<{
    ok: boolean;
    status: number;
    json: () => Promise<unknown>;
}>;

/** Asks Claude for clue drafts for one answer. Throws DraftError (never with the key in it). */
export async function draftClues(
    apiKey: string,
    answer: string,
    fetchImpl: Fetch = (url, init) => fetch(url, init),
): Promise<string[]> {
    const key = apiKey.trim();
    if (key === '') throw new DraftError('no_key');
    const { system, user } = buildDraftPrompt(answer);
    let res;
    try {
        res = await fetchImpl(CLAUDE_URL, {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'x-api-key': key,
                'anthropic-version': '2023-06-01',
                'anthropic-dangerous-direct-browser-access': 'true',
            },
            body: JSON.stringify({
                model: CLAUDE_MODEL,
                max_tokens: 400,
                system,
                messages: [{ role: 'user', content: user }],
            }),
        });
    } catch {
        throw new DraftError('network');
    }
    if (res.status === 401 || res.status === 403) throw new DraftError('bad_key');
    if (res.status === 429) throw new DraftError('rate_limit');
    if (!res.ok) throw new DraftError('server');
    let text = '';
    try {
        const body = (await res.json()) as { content?: { type?: string; text?: string }[] };
        text = (body.content ?? []).map((b) => (b.type === 'text' ? (b.text ?? '') : '')).join('');
    } catch {
        throw new DraftError('server');
    }
    const drafts = filterDrafts(parseDrafts(text), answer);
    if (drafts.length === 0) throw new DraftError('no_usable_clue');
    return drafts;
}
