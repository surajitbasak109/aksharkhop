import {
    allWhiteCells,
    checkCells,
    checkTyped,
    clearSolveCell,
    createSolveState,
    encodeSolve,
    filledCount,
    isSolved,
    isWhite,
    normalize,
    numberGrid,
    phoneticToBengali,
    revealCells,
    solveFromText,
    solveSlotAt,
    solveSlots,
    toBengaliDigits,
    typeCells,
    type Direction,
    type Message,
    type SolvePuzzle,
} from '@aksharkhop/core';
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { show } from './Board.tsx';
import { copyText } from './clipboard.ts';
import { fmt, plain, ui, type Text } from './i18n.ts';
import { PhoneticHelp } from './PhoneticHelp.tsx';
import { SolveBoard } from './SolveBoard.tsx';
import { loadPhonetic, loadProgress, saveProgress, savePhonetic } from './storage.ts';
import { T } from './T.tsx';

interface Props {
    solve: SolvePuzzle;
    /** The share code of this puzzle: its progress is saved under it. */
    code: string;
    /** Go to another puzzle (a new share code). */
    onOpenCode: (code: string) => void;
}

type Note = { kind: 'ok' | 'warn'; text: Text } | null;

const other = (d: Direction): Direction => (d === 'across' ? 'down' : 'across');

/** mm:ss (h:mm:ss from an hour) in Bengali digits. */
export const formatTime = (seconds: number): string => {
    const pad = (n: number) => String(n).padStart(2, '0');
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const text = h > 0 ? `${h}:${pad(m)}:${pad(seconds % 60)}` : `${pad(m)}:${pad(seconds % 60)}`;
    return text.replace(/[0-9]/g, (d) => '০১২৩৪৫৬৭৮৯'[Number(d)]!);
};

export function SolveView({ solve, code, onOpenCode }: Props) {
    const slots = useMemo(() => solveSlots(solve), [solve]);
    const numbers = useMemo(
        () => numberGrid(solve.solution.map((row) => row.map((cell) => cell === null))).numbers,
        [solve],
    );

    const saved = useMemo(() => loadProgress(code, solve), [code, solve]);
    const [state, setState] = useState(() => saved?.state ?? createSolveState(solve));
    const [seconds, setSeconds] = useState(saved?.seconds ?? 0);
    const [started, setStarted] = useState(() => (saved?.seconds ?? 0) > 0);

    const first = slots[0];
    const [sel, setSel] = useState<{ r: number; c: number; dir: Direction }>({
        r: first?.r ?? 0,
        c: first?.c ?? 0,
        dir: first?.dir ?? 'across',
    });
    const [draft, setDraft] = useState('');
    const [phonetic, setPhonetic] = useState(loadPhonetic);
    const [note, setNote] = useState<Note>(null);
    const [problems, setProblems] = useState<Message[] | null>(null);
    const [copied, setCopied] = useState(false);
    const boardRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    const { r, c, dir } = sel;
    const slot = solveSlotAt(slots, r, c, dir);
    const solved = isSolved(solve, state);
    const { filled, total } = filledCount(solve, state);

    // The timer starts with the first answer and stops when the puzzle is solved.
    const running = started && !solved;
    useEffect(() => {
        if (!running) return;
        const timer = setInterval(() => {
            if (!document.hidden) setSeconds((s) => s + 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [running]);

    // Save progress when something changes, and every 5 s while the timer runs.
    useEffect(() => {
        saveProgress(code, { state, seconds });
    }, [code, state, seconds - (seconds % 5)]);

    useEffect(() => {
        document.title = `${solve.title || plain(ui.untitled)} · ${ui.appName.bn}`;
    }, [solve.title]);

    const inSlot = useMemo(() => new Set(slot ? slot.cells.map(([a, b]) => `${a}:${b}`) : []), [slot]);
    const index = slot ? slot.cells.findIndex(([a, b]) => a === r && b === c) : -1;
    const remaining = slot ? slot.len - index : 0;

    // What the answer box means: Bengali, converted from Latin if phonetic typing is on.
    const word = phonetic ? phoneticToBengali(draft) : draft;
    const typed = checkTyped(word);
    const wholeWord = slot !== null && typed.cells.length === slot.len;
    const tooLong = slot !== null && typed.cells.length > remaining && !wholeWord;
    const canPlace = slot !== null && typed.cells.length > 0 && typed.errors.length === 0 && !tooLong;

    const focusBoard = () => boardRef.current?.focus();

    const pickDir = (nr: number, nc: number, d: Direction): Direction =>
        solveSlotAt(slots, nr, nc, d) || !solveSlotAt(slots, nr, nc, other(d)) ? d : other(d);

    const select = (nr: number, nc: number, d: Direction = dir) =>
        setSel({ r: nr, c: nc, dir: pickDir(nr, nc, d) });

    const touch = () => {
        setStarted(true);
        setNote(null);
    };

    const commit = () => {
        if (!slot || !canPlace) return;
        const [sr, sc] = wholeWord ? [slot.r, slot.c] : [r, c];
        const res = typeCells(solve, state, sr, sc, slot.dir, typed.cells);
        touch();
        setState(res.state);
        setDraft('');
        const start = wholeWord ? 0 : index;
        const next = slot.cells[start + res.placed] ?? slot.cells[start + res.placed - 1];
        if (next) setSel({ r: next[0], c: next[1], dir: slot.dir });
        focusBoard();
    };

    const doCheck = (cells: readonly (readonly [number, number])[]) => {
        const res = checkCells(solve, state, cells);
        touch();
        setState(res.state);
        const { wrong, empty } = res.summary;
        setNote(
            wrong === 0 && empty === 0
                ? { kind: 'ok', text: ui.allCorrect }
                : { kind: wrong > 0 ? 'warn' : 'ok', text: fmt.checkResult(wrong, empty) },
        );
    };

    const doReveal = (cells: readonly (readonly [number, number])[], everything = false) => {
        if (everything && !window.confirm(plain(ui.revealAllConfirm))) return;
        touch();
        setState(revealCells(solve, state, cells));
    };

    const startOver = () => {
        if (!window.confirm(plain(ui.startOverConfirm))) return;
        setState(createSolveState(solve));
        setSeconds(0);
        setStarted(false);
        setNote(null);
        setDraft('');
    };

    const moveBy = (dr: number, dc: number) => {
        let nr = r + dr;
        let nc = c + dc;
        while (nr >= 0 && nr < solve.rows && nc >= 0 && nc < solve.cols) {
            if (isWhite(solve, nr, nc)) return select(nr, nc);
            nr += dr;
            nc += dc;
        }
    };

    const onCellClick = (cr: number, cc: number) => {
        focusBoard();
        if (cr === r && cc === c && solveSlotAt(slots, cr, cc, other(dir)))
            setSel({ r: cr, c: cc, dir: other(dir) });
        else select(cr, cc);
    };

    const onBoardKey = (e: KeyboardEvent<HTMLDivElement>) => {
        if (e.nativeEvent.isComposing) return;
        const mod = e.ctrlKey || e.metaKey;
        switch (e.key) {
            case 'ArrowUp':
                e.preventDefault();
                return moveBy(-1, 0);
            case 'ArrowDown':
                e.preventDefault();
                return moveBy(1, 0);
            case 'ArrowLeft':
                e.preventDefault();
                return moveBy(0, -1);
            case 'ArrowRight':
                e.preventDefault();
                return moveBy(0, 1);
            case 'Tab':
                e.preventDefault();
                if (solveSlotAt(slots, r, c, other(dir))) setSel({ r, c, dir: other(dir) });
                return;
            case 'Backspace':
            case 'Delete': {
                e.preventDefault();
                if (e.key === 'Backspace' && state.letters[r]![c] === '' && slot && index > 0) {
                    const prev = slot.cells[index - 1]!;
                    setState(clearSolveCell(solve, state, prev[0], prev[1]));
                    setSel({ r: prev[0], c: prev[1], dir });
                } else {
                    setState(clearSolveCell(solve, state, r, c));
                }
                setNote(null);
                return;
            }
            case 'Enter':
                e.preventDefault();
                inputRef.current?.focus();
                return;
        }
        if (mod || e.altKey || !slot) return;
        const input = inputRef.current;
        if (!input) return;
        if (e.key.length === 1 || /[ঀ-৿]/u.test(e.key)) {
            e.preventDefault();
            setDraft(e.key);
            input.focus();
        } else if (e.key === 'Process' || e.key === 'Unidentified') {
            setDraft('');
            input.focus();
        }
    };

    const onAnswerKey = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.nativeEvent.isComposing) return;
        if (e.key === 'Enter') {
            e.preventDefault();
            commit();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            setDraft('');
            focusBoard();
        }
    };

    const onFile = async (file: File | undefined) => {
        if (!file) return;
        const result = solveFromText(await file.text());
        if (fileRef.current) fileRef.current.value = '';
        if (!result.ok) return setProblems(result.errors);
        setProblems(null);
        onOpenCode(await encodeSolve(result.solve));
    };

    const copyLink = async () => {
        setCopied(await copyText(window.location.href));
        setTimeout(() => setCopied(false), 2500);
    };

    const slotOf = (s: (typeof slots)[number]) =>
        s.cells.every(([a, b]) => state.letters[a]![b] !== '') ? 'clue-done' : '';

    return (
        <div className="app solve">
            <header className="top">
                <div className="brand">
                    <h1>{solve.title || <T t={ui.untitled} />}</h1>
                    <p className="tagline">
                        {solve.author ? <span lang="bn">{solve.author} · </span> : null}
                        <T t={ui.appName} />
                    </p>
                </div>
                <div className="timer" role="timer" aria-label={plain(ui.timer)}>
                    <span className="muted small">
                        <T t={ui.timer} />
                    </span>
                    <strong lang="bn">{formatTime(seconds)}</strong>
                </div>
            </header>

            <nav className="toolbar" aria-label="Toolbar">
                <button onClick={() => fileRef.current?.click()}>
                    <T t={ui.solveOpenFile} />
                </button>
                <input
                    ref={fileRef}
                    type="file"
                    accept=".json,application/json"
                    hidden
                    onChange={(e) => void onFile(e.target.files?.[0])}
                />
                <button onClick={() => void copyLink()}>
                    <T t={copied ? ui.copied : ui.solveCopyLink} />
                </button>
                <button onClick={startOver}>
                    <T t={ui.startOver} />
                </button>
                <a className="button-link" href="#">
                    <T t={ui.solveMake} />
                </a>
                <span className="size-tag">
                    <T t={fmt.size(solve.rows, solve.cols)} /> · <T t={fmt.solveProgress(filled, total)} />
                </span>
            </nav>

            {problems && (
                <div className="notice error" role="alert">
                    <strong>
                        <T t={ui.solveFileFailed} />
                    </strong>
                    <ul>
                        {problems.map((m, i) => (
                            <li key={i}>
                                <T t={m} />
                            </li>
                        ))}
                    </ul>
                    <button className="link" onClick={() => setProblems(null)} aria-label="Close">
                        ×
                    </button>
                </div>
            )}

            {solved && (
                <div className="notice ok solved" role="status">
                    <strong>
                        <T t={ui.solvedTitle} />
                    </strong>{' '}
                    <T t={ui.timer} />: <strong lang="bn">{formatTime(seconds)}</strong>
                    {state.helped && (
                        <>
                            {' '}
                            <T t={ui.solvedHelped} />
                        </>
                    )}
                </div>
            )}

            <main className="workspace">
                <section className="board-wrap">
                    <SolveBoard
                        ref={boardRef}
                        solve={solve}
                        state={state}
                        numbers={numbers}
                        selected={{ r, c }}
                        slotCells={inSlot}
                        onCellClick={onCellClick}
                        onKeyDown={onBoardKey}
                    />
                </section>

                <aside className="side">
                    <section className="panel answer">
                        <h2>
                            {slot ? (
                                <T t={fmt.slotLabel(slot.dir, slot.n, slot.len)} />
                            ) : (
                                <T t={ui.solveNoClue} />
                            )}
                        </h2>
                        {slot && (
                            <p className="current-clue" lang="bn">
                                {slot.clue}
                            </p>
                        )}
                        <div className="answer-row">
                            <input
                                ref={inputRef}
                                className="answer-input"
                                lang="bn"
                                value={draft}
                                disabled={!slot}
                                placeholder={plain(ui.answerPlaceholder)}
                                aria-label={plain(ui.answerPlaceholder)}
                                aria-invalid={draft !== '' && (!canPlace || undefined)}
                                onChange={(e) => setDraft(e.target.value)}
                                onKeyDown={onAnswerKey}
                            />
                            <button onClick={commit} disabled={!canPlace}>
                                <T t={ui.place} />
                            </button>
                        </div>
                        <p className="muted small">
                            <T t={ui.solveAnswerHint} />
                        </p>
                        <label className="check phonetic-toggle">
                            <input
                                type="checkbox"
                                checked={phonetic}
                                onChange={(e) => {
                                    setPhonetic(e.target.checked);
                                    savePhonetic(e.target.checked);
                                    inputRef.current?.focus();
                                }}
                            />
                            <T t={ui.phonetic} />
                        </label>
                        {phonetic && draft !== '' && normalize(word) !== normalize(draft) && (
                            <p className="converted" lang="bn" aria-live="polite">
                                {normalize(word)}
                            </p>
                        )}
                        {typed.cells.length > 0 && (
                            <div className="cells-preview" aria-live="polite">
                                {typed.cells.map((cell, i) => (
                                    <span
                                        key={i}
                                        className={tooLong && i >= remaining ? 'chip over' : 'chip'}
                                        lang="bn"
                                    >
                                        {show(cell)}
                                    </span>
                                ))}
                            </div>
                        )}
                        {typed.errors.length > 0 && (
                            <ul className="errors">
                                {typed.errors.map((m) => (
                                    <li key={m.code}>
                                        <T t={m} />
                                    </li>
                                ))}
                            </ul>
                        )}
                        {tooLong && (
                            <p className="warn">
                                <T t={fmt.tooLong(remaining)} />
                            </p>
                        )}
                        {phonetic && <PhoneticHelp />}
                    </section>

                    <section className="panel">
                        <h2>
                            <T t={ui.check} />
                        </h2>
                        <div className="btn-row">
                            <button disabled={!slot} onClick={() => doCheck([[r, c]])}>
                                <T t={ui.scopeCell} />
                            </button>
                            <button disabled={!slot} onClick={() => slot && doCheck(slot.cells)}>
                                <T t={ui.scopeWord} />
                            </button>
                            <button onClick={() => doCheck(allWhiteCells(solve))}>
                                <T t={ui.scopePuzzle} />
                            </button>
                        </div>
                        {note && (
                            <p className={note.kind === 'ok' ? 'good' : 'warn'} role="status">
                                <T t={note.text} />
                            </p>
                        )}
                        <h2 className="spaced">
                            <T t={ui.reveal} />
                        </h2>
                        <div className="btn-row">
                            <button disabled={!slot} onClick={() => doReveal([[r, c]])}>
                                <T t={ui.scopeCell} />
                            </button>
                            <button disabled={!slot} onClick={() => slot && doReveal(slot.cells)}>
                                <T t={ui.scopeWord} />
                            </button>
                            <button onClick={() => doReveal(allWhiteCells(solve), true)}>
                                <T t={ui.scopePuzzle} />
                            </button>
                        </div>
                    </section>

                    <section className="panel keys">
                        <h2>
                            <T t={ui.solveKeys} />
                        </h2>
                        <ul>
                            {[ui.keyArrows, ui.keyTab, ui.keyEnter, ui.keyDelete, ui.keyEsc].map((k) => (
                                <li key={k.en}>
                                    <T t={k} />
                                </li>
                            ))}
                        </ul>
                    </section>
                </aside>
            </main>

            <section className="panel clue-panel" aria-label={plain(ui.solveClues)}>
                <h2>
                    <T t={ui.solveClues} />
                </h2>
                <div className="clue-columns">
                    {(['across', 'down'] as const).map((d) => (
                        <div key={d} className="clue-list">
                            <h3>
                                <T t={d === 'across' ? ui.across : ui.down} />
                            </h3>
                            <ol>
                                {slots
                                    .filter((s) => s.dir === d)
                                    .map((s) => {
                                        const active =
                                            slot?.dir === s.dir && slot.r === s.r && slot.c === s.c;
                                        return (
                                            <li
                                                key={`${s.dir}${s.n}`}
                                                className={`solve-clue ${active ? 'active' : ''} ${slotOf(s)}`}
                                            >
                                                <button
                                                    type="button"
                                                    className="clue-num"
                                                    aria-label={plain(fmt.slotLabel(s.dir, s.n, s.len))}
                                                    onClick={() => {
                                                        setSel({ r: s.r, c: s.c, dir: s.dir });
                                                        focusBoard();
                                                    }}
                                                >
                                                    {toBengaliDigits(s.n)}
                                                </button>
                                                <span lang="bn">
                                                    {s.clue}{' '}
                                                    <span className="muted small">
                                                        ({toBengaliDigits(s.len)})
                                                    </span>
                                                </span>
                                            </li>
                                        );
                                    })}
                            </ol>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
