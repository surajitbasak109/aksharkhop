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
