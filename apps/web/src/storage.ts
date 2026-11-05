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
