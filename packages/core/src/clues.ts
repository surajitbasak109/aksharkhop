// Clue status for the clue panel and the export check: for every slot, its answer, its clue text and
// what is wrong with it. Pure data, no DOM.

import { normalize } from './normalize.ts';
import { slotWord, slots, type Direction, type Slot } from './grid.ts';
import { clueKey, type Puzzle } from './puzzle.ts';

export type ClueIssue =
    /** Some cell of the slot is still empty. */
    | 'no_answer'
    /** The clue text is empty. */
    | 'no_clue'
    /** The clue text contains the slot's own answer (a warning: Pataparbon accepts it). */
    | 'clue_has_answer';

export interface ClueRow {
    dir: Direction;
    slot: Slot;
    /** Key of the clue text in `Puzzle.clues`. */
    key: string;
    /** The slot's own word, or '' while any cell is empty. */
    answer: string;
    /** The clue text as stored ('' when none). */
    clue: string;
    issues: ClueIssue[];
}

export interface ClueSummary {
    total: number;
    answered: number;
    clued: number;
    /** Slots whose clue contains the answer. */
    giveaways: number;
}

export function clueRows(p: Puzzle): { across: ClueRow[]; down: ClueRow[] } {
    const all = slots(p.grid);
    const rows = (dir: Direction): ClueRow[] =>
        all[dir].map((slot) => {
            const letters = slotWord(p.grid, slot);
            const answer = letters.every((l) => l !== '') ? letters.join('') : '';
            const key = clueKey(dir, slot.r, slot.c);
            const clue = p.clues[key] ?? '';
            const text = normalize(clue);
            const issues: ClueIssue[] = [];
            if (answer === '') issues.push('no_answer');
            if (text === '') issues.push('no_clue');
            else if (answer !== '' && text.includes(answer)) issues.push('clue_has_answer');
            return { dir, slot, key, answer, clue, issues };
        });
    return { across: rows('across'), down: rows('down') };
}

export function clueSummary(rows: { across: ClueRow[]; down: ClueRow[] }): ClueSummary {
    const list = [...rows.across, ...rows.down];
    return {
        total: list.length,
        answered: list.filter((r) => !r.issues.includes('no_answer')).length,
        clued: list.filter((r) => !r.issues.includes('no_clue')).length,
        giveaways: list.filter((r) => r.issues.includes('clue_has_answer')).length,
    };
}
