// Autosave of the current draft. Storage can be missing or full; every access is guarded.
import {
    parsePuzzle,
    restoreState,
    serializePuzzle,
    type Puzzle,
    type SolvePuzzle,
    type SolveState,
} from '@aksharkhop/core';

const KEY = 'aksharkhop.draft.v1';

export function loadDraft(): Puzzle | null {
    try {
        const text = window.localStorage.getItem(KEY);
        if (!text) return null;
        const parsed = parsePuzzle(text);
        return parsed.ok ? parsed.puzzle : null;
    } catch {
        return null;
    }
}

export function saveDraft(p: Puzzle): void {
    try {
        window.localStorage.setItem(KEY, serializePuzzle(p));
    } catch {
        // Not fatal: the user can still save to a file.
    }
}

const PHONETIC_KEY = 'aksharkhop.phonetic';

/** Phonetic typing is on unless this viewer turned it off. */
export function loadPhonetic(): boolean {
    try {
        return window.localStorage.getItem(PHONETIC_KEY) !== 'off';
    } catch {
        return true;
    }
}

export function savePhonetic(on: boolean): void {
    try {
        window.localStorage.setItem(PHONETIC_KEY, on ? 'on' : 'off');
    } catch {
        // Not fatal.
    }
}

const FILL_KEY = 'aksharkhop.fill.v1';

export interface FillSettings {
    /** Only words with at least this frequency score; 0 allows every word. */
    minFreq: number;
    /** Words that are never suggested or used by auto-fill. */
    blocked: string[];
}

export const DEFAULT_FILL_SETTINGS: FillSettings = { minFreq: 0, blocked: [] };

export function loadFillSettings(): FillSettings {
    try {
        const data = JSON.parse(
            window.localStorage.getItem(FILL_KEY) ?? 'null',
        ) as Partial<FillSettings> | null;
        const minFreq = typeof data?.minFreq === 'number' ? Math.min(1, Math.max(0, data.minFreq)) : 0;
        const blocked = Array.isArray(data?.blocked) ? data.blocked.filter((w) => typeof w === 'string') : [];
        return { minFreq, blocked };
    } catch {
        return DEFAULT_FILL_SETTINGS;
    }
}

export function saveFillSettings(s: FillSettings): void {
    try {
        window.localStorage.setItem(FILL_KEY, JSON.stringify(s));
    } catch {
        // Not fatal.
    }
}

/** A short stable key for a share code, so a puzzle's progress is not stored under the whole long link. */
function codeKey(code: string): string {
    let h = 0x811c9dc5;
    for (let i = 0; i < code.length; i++) {
        h ^= code.charCodeAt(i);
        h = Math.imul(h, 0x01000193) >>> 0;
    }
    return `aksharkhop.solve.${code.length}.${h.toString(36)}`;
}

export interface SavedProgress {
    state: SolveState;
    seconds: number;
}

/** Progress saved for this puzzle in this browser, or null (none, or it does not fit the puzzle). */
export function loadProgress(code: string, solve: SolvePuzzle): SavedProgress | null {
    try {
        const data = JSON.parse(window.localStorage.getItem(codeKey(code)) ?? 'null') as {
            state?: unknown;
            seconds?: unknown;
        } | null;
        const state = restoreState(solve, data?.state);
        if (!state) return null;
        return { state, seconds: typeof data?.seconds === 'number' && data.seconds >= 0 ? data.seconds : 0 };
    } catch {
        return null;
    }
}

export function saveProgress(code: string, progress: SavedProgress): void {
    try {
        window.localStorage.setItem(codeKey(code), JSON.stringify(progress));
    } catch {
        // Not fatal: the puzzle can still be solved, just not resumed.
    }
}
