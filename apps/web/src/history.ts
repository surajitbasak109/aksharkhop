// Undo/redo over whole-puzzle snapshots. Puzzles are immutable, so a snapshot is just a reference.
import type { Puzzle } from '@aksharkhop/core';

const LIMIT = 300;

export interface History {
    past: Puzzle[];
    present: Puzzle;
    future: Puzzle[];
}

export type HistoryAction =
    | { type: 'apply'; puzzle: Puzzle }
    | { type: 'meta'; puzzle: Puzzle } // title, author, clues, symmetry: changes the present, no undo step
    | { type: 'load'; puzzle: Puzzle } // new or opened puzzle: starts a fresh history
    | { type: 'undo' }
    | { type: 'redo' };

export function historyReducer(h: History, action: HistoryAction): History {
    switch (action.type) {
        case 'apply':
            if (action.puzzle === h.present) return h;
            return { past: [...h.past, h.present].slice(-LIMIT), present: action.puzzle, future: [] };
        case 'load':
            return { past: [], present: action.puzzle, future: [] };
        case 'meta':
            return { ...h, present: action.puzzle };
        case 'undo': {
            const prev = h.past.at(-1);
            if (!prev) return h;
            const present = keepMeta(prev, h.present);
            return { past: h.past.slice(0, -1), present, future: [h.present, ...h.future] };
        }
        case 'redo': {
            const next = h.future[0];
            if (!next) return h;
            const present = keepMeta(next, h.present);
            return { past: [...h.past, h.present], present, future: h.future.slice(1) };
        }
    }
}

/** Undo and redo step through grid edits only: title, author, clues and the symmetry setting stay as they are. */
function keepMeta(snapshot: Puzzle, current: Puzzle): Puzzle {
    return {
        ...snapshot,
        title: current.title,
        author: current.author,
        symmetry: current.symmetry,
        clues: current.clues,
    };
}
