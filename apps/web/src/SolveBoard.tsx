import { toBengaliDigits, type SolvePuzzle, type SolveState } from '@aksharkhop/core';
import { forwardRef, type CSSProperties, type KeyboardEvent } from 'react';
import { show } from './Board.tsx';
import { fmt, plain, ui } from './i18n.ts';

export interface SolveBoardProps {
    solve: SolvePuzzle;
    state: SolveState;
    numbers: (number | null)[][];
    selected: { r: number; c: number };
    /** "r:c" of the cells in the current word. */
    slotCells: Set<string>;
    onCellClick: (r: number, c: number) => void;
    onKeyDown: (e: KeyboardEvent<HTMLDivElement>) => void;
}

export const SolveBoard = forwardRef<HTMLDivElement, SolveBoardProps>(function SolveBoard(
    { solve, state, numbers, selected, slotCells, onCellClick, onKeyDown },
    ref,
) {
    return (
        <div
            ref={ref}
            className="board"
            style={{ '--rows': solve.rows, '--cols': solve.cols } as CSSProperties}
            role="grid"
            aria-label={plain(ui.board)}
            tabIndex={0}
            onKeyDown={onKeyDown}
        >
            {solve.solution.map((row, r) => (
                <div className="board-row" role="row" key={r}>
                    {row.map((answer, c) => {
                        if (answer === null) {
                            return <div key={c} role="gridcell" aria-hidden="true" className="cell block" />;
                        }
                        const n = numbers[r]?.[c] ?? null;
                        const letter = state.letters[r]![c]!;
                        const mark = state.marks[r]![c]!;
                        const where = fmt.cellAt(r, c);
                        const classes = ['cell'];
                        if (selected.r === r && selected.c === c) classes.push('selected');
                        else if (slotCells.has(`${r}:${c}`)) classes.push('in-slot');
                        if (mark !== '') classes.push(`mark-${mark}`);
                        return (
                            <div
                                key={c}
                                role="gridcell"
                                aria-label={`${where.bn} / ${where.en}${letter ? `: ${letter}` : ''}${mark ? ` (${mark})` : ''}`}
                                aria-selected={selected.r === r && selected.c === c}
                                className={classes.join(' ')}
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    onCellClick(r, c);
                                }}
                            >
                                {n !== null && <span className="num">{toBengaliDigits(n)}</span>}
                                <span className="letter">{show(letter)}</span>
                            </div>
                        );
                    })}
                </div>
            ))}
        </div>
    );
});
