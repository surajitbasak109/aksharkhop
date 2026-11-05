// Autosave of the current draft. Storage can be missing or full; every access is guarded.
import { parsePuzzle, serializePuzzle, type Puzzle } from '@aksharkhop/core';

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
