import { cellLetter, isConflict, toBengaliDigits, type Grid, type PreviewState } from '@aksharkhop/core';
import { forwardRef, type CSSProperties, type KeyboardEvent } from 'react';
import { fmt, plain, ui } from './i18n.ts';

// A cell that is only a mark (ং ঃ, or a stray sign) has no letter to sit on, and the font then draws
// a dotted circle (◌ং). A no-break space in front gives it a base. Display only: the data is unchanged.
const MARK_FIRST = /^[\u0981-\u0983\u09BC\u09BE-\u09CD\u09D7\u09E2\u09E3]/u;
export const show = (s: string): string => (MARK_FIRST.test(s) ? `\u00A0${s}` : s);

export interface BoardProps {
    grid: Grid;
    numbers: (number | null)[][];
    selected: { r: number; c: number };
    /** "r:c" of the cells in the current slot. */
    slotCells: Set<string>;
    /** Preview of the typed answer, by "r:c". */
    preview: Map<string, { letter: string; state: PreviewState }>;
    blockMode: boolean;
    onCellClick: (r: number, c: number) => void;
    onKeyDown: (e: KeyboardEvent<HTMLDivElement>) => void;
}

export const Board = forwardRef<HTMLDivElement, BoardProps>(function Board(
    { grid, numbers, selected, slotCells, preview, blockMode, onCellClick, onKeyDown },
    ref,
) {
    return (
        <div
            ref={ref}
            className={blockMode ? 'board block-mode' : 'board'}
            style={{ '--rows': grid.rows, '--cols': grid.cols } as CSSProperties}
            role="grid"
            aria-label={plain(ui.board)}
            tabIndex={0}
            onKeyDown={onKeyDown}
        >
            {grid.cells.map((row, r) => (
                <div className="board-row" role="row" key={r}>
                    {row.map((cell, c) => {
                        const key = `${r}:${c}`;
                        const n = numbers[r]?.[c] ?? null;
                        const isSel = selected.r === r && selected.c === c;
                        const where = fmt.cellAt(r, c);

                        if (cell === null) {
                            return (
                                <div
                                    key={c}
                                    role="gridcell"
                                    aria-label={`${where.bn}: ${ui.modeBlocks.bn} / ${where.en}: block`}
                                    aria-selected={isSel}
                                    className={isSel ? 'cell block selected' : 'cell block'}
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        onCellClick(r, c);
                                    }}
                                />
                            );
                        }

                        const p = preview.get(key);
                        const conflict = isConflict(cell);
                        const letter = cellLetter(cell);
                        const classes = ['cell'];
                        if (isSel) classes.push('selected');
                        if (slotCells.has(key)) classes.push('in-slot');
                        if (conflict) classes.push('conflict');
                        if (p && p.state !== 'empty' && p.state !== 'same')
                            classes.push(`preview-${p.state}`);

                        let content;
                        if (p && (p.state === 'new' || p.state === 'conflict')) {
                            content = <span className="letter ghost">{show(p.letter)}</span>;
                        } else if (conflict) {
                            content = (
                                <span
                                    className="letter split"
                                    title={`${ui.across.bn} ${cell.a} · ${ui.down.bn} ${cell.d}`}
                                >
                                    <span>{show(cell.a)}</span>
                                    <span>{show(cell.d)}</span>
                                </span>
                            );
                        } else {
                            content = <span className="letter">{show(letter)}</span>;
                        }

                        return (
                            <div
                                key={c}
                                role="gridcell"
                                aria-label={`${where.bn} / ${where.en}${letter ? `: ${letter}` : ''}`}
                                aria-selected={isSel}
                                className={classes.join(' ')}
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    onCellClick(r, c);
                                }}
                            >
                                {n !== null && <span className="num">{toBengaliDigits(n)}</span>}
                                {content}
                            </div>
                        );
                    })}
                </div>
            ))}
        </div>
    );
});
