import { cellLetter, clueRows, numbering, toBengaliDigits, type Puzzle } from '@aksharkhop/core';
import type { CSSProperties } from 'react';
import { show } from './Board.tsx';
import { ui } from './i18n.ts';
import { T } from './T.tsx';

export type PrintLayout = 'puzzle' | 'key' | 'both';

/**
 * The A4 print version. Hidden on screen; the print styles show it and hide the editor. It uses fixed
 * black-on-white colors (not the theme) so a dark-mode screen still prints dark on light paper.
 */
export function PrintSheet({ puzzle, layout }: { puzzle: Puzzle; layout: PrintLayout }) {
    const date = new Date().toLocaleDateString('bn-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    const title = puzzle.title.trim();

    return (
        <div className="print-sheet" data-layout={layout}>
            {layout !== 'key' && (
                <section className="print-page">
                    <PrintHeader title={title} author={puzzle.author.trim()} date={date} />
                    <PrintGrid puzzle={puzzle} filled={false} />
                    <PrintClues puzzle={puzzle} />
                    <PrintCredit />
                </section>
            )}
            {layout !== 'puzzle' && (
                <section className="print-page">
                    <PrintHeader title={title} author={puzzle.author.trim()} date={date} isKey />
                    <PrintGrid puzzle={puzzle} filled />
                    <PrintAnswers puzzle={puzzle} />
                    <PrintCredit />
                </section>
            )}
        </div>
    );
}

function PrintHeader({
    title,
    author,
    date,
    isKey = false,
}: {
    title: string;
    author: string;
    date: string;
    isKey?: boolean;
}) {
    return (
        <header className="print-head">
            <h1 lang="bn">
                {title || ui.untitled.bn}
                {isKey && (
                    <>
                        {' · '}
                        {ui.answerKey.bn}
                    </>
                )}
            </h1>
            <p lang="bn">
                {author && <span>{author} · </span>}
                {date}
            </p>
        </header>
    );
}

function PrintGrid({ puzzle, filled }: { puzzle: Puzzle; filled: boolean }) {
    const { grid } = puzzle;
    const { numbers } = numbering(grid);
    return (
        <div
            className="print-grid"
            style={{ '--rows': grid.rows, '--cols': grid.cols } as CSSProperties}
            role="img"
            aria-label={ui.board.bn}
        >
            {grid.cells.map((row, r) =>
                row.map((cell, c) => {
                    const n = numbers[r]?.[c] ?? null;
                    if (cell === null) return <div key={`${r}:${c}`} className="pcell pblock" />;
                    const letter = filled ? cellLetter(cell) : '';
                    // A conjunct such as ন্ত্র is wider than a plain letter: set it smaller so it is not clipped.
                    const wide = [...letter].length >= 5;
                    return (
                        <div key={`${r}:${c}`} className="pcell">
                            {n !== null && <span className="pnum">{toBengaliDigits(n)}</span>}
                            {letter !== '' && (
                                <span className={wide ? 'pletter wide' : 'pletter'} lang="bn">
                                    {show(letter)}
                                </span>
                            )}
                        </div>
                    );
                }),
            )}
        </div>
    );
}

function PrintClues({ puzzle }: { puzzle: Puzzle }) {
    const rows = clueRows(puzzle);
    return (
        <div className="print-clues">
            {(['across', 'down'] as const).map((dir) => (
                <div key={dir} className="print-clue-col">
                    <h2 lang="bn">
                        <T t={dir === 'across' ? ui.across : ui.down} />
                    </h2>
                    <ol>
                        {rows[dir].map((row) => (
                            <li key={row.key} lang="bn">
                                <b>{toBengaliDigits(row.slot.n)}.</b> {row.clue.trim()}{' '}
                                <span className="plen">({toBengaliDigits(row.slot.len)})</span>
                            </li>
                        ))}
                    </ol>
                </div>
            ))}
        </div>
    );
}

function PrintAnswers({ puzzle }: { puzzle: Puzzle }) {
    const rows = clueRows(puzzle);
    return (
        <div className="print-clues">
            {(['across', 'down'] as const).map((dir) => (
                <div key={dir} className="print-clue-col">
                    <h2 lang="bn">
                        <T t={dir === 'across' ? ui.across : ui.down} />
                    </h2>
                    <ol>
                        {rows[dir].map((row) => (
                            <li key={row.key} lang="bn">
                                <b>{toBengaliDigits(row.slot.n)}.</b> {row.answer || '–'}
                            </li>
                        ))}
                    </ol>
                </div>
            ))}
        </div>
    );
}

function PrintCredit() {
    return (
        <footer className="print-credit" lang="bn">
            {ui.printCredit.bn}
            <span className="en"> / {ui.printCredit.en}</span>
        </footer>
    );
}
