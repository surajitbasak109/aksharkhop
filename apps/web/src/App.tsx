import {
    checkAnswer,
    clearCell,
    conflicts as findConflicts,
    createPuzzle,
    exportPataparbon,
    getCell,
    gridStats,
    isBlock,
    isSymmetric,
    normalize,
    numbering,
    parseAnyPuzzle,
    phoneticToBengali,
    placeAnswer,
    previewAnswer,
    serializePuzzle,
    slotAt,
    slotCells,
    slotLetters,
    slots as allSlots,
    toggleBlock,
    type Direction,
    type ExportResult,
    type Grid,
    type Message,
    type PreviewState,
    type Puzzle,
} from '@aksharkhop/core';
import { useCallback, useEffect, useMemo, useReducer, useRef, useState, type KeyboardEvent } from 'react';
import { Board, show } from './Board.tsx';
import { CluePanel } from './CluePanel.tsx';
import { ExportDialog } from './ExportDialog.tsx';
import { useFillClient } from './fillClient.ts';
import { FillPanel } from './FillPanel.tsx';
import { historyReducer } from './history.ts';
import { fmt, plain, ui, type Text } from './i18n.ts';
import { NewPuzzleDialog } from './NewPuzzleDialog.tsx';
import { PhoneticHelp } from './PhoneticHelp.tsx';
import { PrintDialog } from './PrintDialog.tsx';
import { PrintSheet, type PrintLayout } from './PrintSheet.tsx';
import { SuggestPanel } from './SuggestPanel.tsx';
import {
    loadDraft,
    loadFillSettings,
    loadPhonetic,
    saveDraft,
    saveFillSettings,
    savePhonetic,
    type FillSettings,
} from './storage.ts';
import { T } from './T.tsx';
import { useWordList } from './wordList.ts';

interface Selection {
    r: number;
    c: number;
    dir: Direction;
}

type Notice = { kind: 'ok' | 'error'; title: Text; lines: Message[] };

const other = (d: Direction): Direction => (d === 'across' ? 'down' : 'across');

function hasContent(p: Puzzle): boolean {
    const s = gridStats(p.grid);
    return s.filled > 0 || s.blocks > 0 || p.title !== '';
}

/** The direction to use at (r, c): keep `dir` if a word runs that way, else the other way if one does. */
function pickDir(grid: Grid, r: number, c: number, dir: Direction): Direction {
    if (slotAt(grid, r, c, dir) || !slotAt(grid, r, c, other(dir))) return dir;
    return other(dir);
}

function downloadName(title: string, fallback = 'aksharkhop'): string {
    const base =
        title
            .trim()
            .replace(/[\\/:*?"<>|]+/g, '')
            .replace(/\s+/g, '-') || fallback;
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${base}-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}.json`;
}

export function App() {
    const [history, dispatch] = useReducer(historyReducer, undefined, () => ({
        past: [],
        present: loadDraft() ?? createPuzzle(),
        future: [],
    }));
    const puzzle = history.present;
    const { grid } = puzzle;

    const [sel, setSel] = useState<Selection>({ r: 0, c: 0, dir: 'across' });
    const [blockMode, setBlockMode] = useState(false);
    const [draft, setDraft] = useState('');
    const [phonetic, setPhonetic] = useState(loadPhonetic);
    const [notice, setNotice] = useState<Notice | null>(null);
    const [showNew, setShowNew] = useState(false);
    const [exported, setExported] = useState<ExportResult | null>(null);
    const [showPrint, setShowPrint] = useState(false);
    const [printLayout, setPrintLayout] = useState<PrintLayout>('puzzle');
    const boardRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const fileRef = useRef<HTMLInputElement>(null);
    const words = useWordList();
    const { client: fillClient, status: fillStatus } = useFillClient();
    const [fillSettings, setFillSettings] = useState(loadFillSettings);

    useEffect(() => saveDraft(puzzle), [puzzle]);

    // The selection always stays inside the grid (it can shrink when a smaller puzzle is opened).
    const r = Math.min(sel.r, grid.rows - 1);
    const c = Math.min(sel.c, grid.cols - 1);
    const dir = sel.dir;

    const num = useMemo(() => numbering(grid), [grid]);
    const slot = useMemo(() => slotAt(grid, r, c, dir), [grid, r, c, dir]);
    const slotKey = slot ? `${slot.dir}:${slot.r}:${slot.c}:${slot.len}` : '';
    const currentLetters = useMemo(() => (slot ? slotLetters(grid, slot) : []), [grid, slot]);
    const currentWord = currentLetters.every((l) => l !== '') ? currentLetters.join('') : '';
    // The word typed in this slot's own direction (differs from the shown word where there are conflicts).
    const ownWord = useMemo(() => {
        if (!slot) return '';
        const own = slotCells(slot).map(
            ([a, b]) => getCell(grid, a, b)?.[slot.dir === 'across' ? 'a' : 'd'] ?? '',
        );
        return own.every((l) => l !== '') ? own.join('') : '';
    }, [grid, slot]);
    const startWord = ownWord || currentWord;

    // A new slot starts with its current word in the answer box.
    useEffect(() => {
        setDraft(startWord);
        // Only when the slot changes, not on every edit of its letters.
    }, [slotKey]);

    // What the answer box means in Bengali: the phonetic conversion, or the text as typed.
    const word = phonetic ? phoneticToBengali(draft) : draft;
    const check = slot ? checkAnswer(word, slot.len) : null;
    const typed = normalize(word);
    const typing = slot !== null && typed !== '' && typed !== ownWord && typed !== currentWord;
    const states: PreviewState[] = typing && check ? previewAnswer(grid, slot, check.cells) : [];
    const preview = useMemo(() => {
        const m = new Map<string, { letter: string; state: PreviewState }>();
        if (!slot || !check) return m;
        slotCells(slot).forEach(([pr, pc], i) => {
            const state = states[i];
            if (state) m.set(`${pr}:${pc}`, { letter: check.cells[i] ?? '', state });
        });
        return m;
    }, [slot, check, states]);
    const willConflict = states.includes('conflict');

    const inSlot = useMemo(() => new Set(slot ? slotCells(slot).map(([a, b]) => `${a}:${b}`) : []), [slot]);
    const stats = gridStats(grid);
    const conflictList = findConflicts(grid);
    const slotList = allSlots(grid);
    const slotCount = slotList.across.length + slotList.down.length;
    const symmetricOk = !puzzle.symmetry || isSymmetric(grid);

    const coverage = useMemo(() => {
        if (words.status !== 'ready') return null;
        let complete = 0;
        let inList = 0;
        for (const s of [...slotList.across, ...slotList.down]) {
            const letters = slotLetters(grid, s);
            if (letters.some((l) => l === '')) continue;
            complete++;
            if (words.words.has(letters.join(''))) inList++;
        }
        return { complete, inList };
    }, [words, grid, slotList]);

    const apply = useCallback(
        (g: Grid) => {
            if (g !== history.present.grid)
                dispatch({ type: 'apply', puzzle: { ...history.present, grid: g } });
        },
        [history.present],
    );

    const select = useCallback(
        (nr: number, nc: number, d: Direction = dir) =>
            setSel({ r: nr, c: nc, dir: pickDir(grid, nr, nc, d) }),
        [grid, dir],
    );

    const focusBoard = () => boardRef.current?.focus();

    const commit = () => {
        if (!slot || !check || !check.ok) return;
        apply(placeAnswer(grid, slot, check.cells));
        setDraft(check.cells.join(''));
        focusBoard();
    };

    const clearSlot = () => {
        if (!slot) return;
        apply(placeAnswer(grid, slot, []));
        setDraft('');
    };

    const toggleAt = (tr: number, tc: number) => {
        const next = toggleBlock(grid, tr, tc, puzzle.symmetry);
        apply(next);
        setSel({ r: tr, c: tc, dir: pickDir(next, tr, tc, dir) });
    };

    const onCellClick = (cr: number, cc: number) => {
        focusBoard();
        if (blockMode) {
            toggleAt(cr, cc);
        } else if (cr === r && cc === c && slotAt(grid, cr, cc, other(dir))) {
            setSel({ r: cr, c: cc, dir: other(dir) });
        } else {
            select(cr, cc);
        }
    };

    const onBoardKey = (e: KeyboardEvent<HTMLDivElement>) => {
        if (e.nativeEvent.isComposing) return;
        const mod = e.ctrlKey || e.metaKey;
        const move = (dr: number, dc: number) => {
            e.preventDefault();
            const nr = Math.max(0, Math.min(grid.rows - 1, r + dr));
            const nc = Math.max(0, Math.min(grid.cols - 1, c + dc));
            select(nr, nc);
        };
        switch (e.key) {
            case 'ArrowUp':
                return move(-1, 0);
            case 'ArrowDown':
                return move(1, 0);
            case 'ArrowLeft':
                return move(0, -1);
            case 'ArrowRight':
                return move(0, 1);
            case 'Tab':
                e.preventDefault();
                setSel({ r, c, dir: other(dir) });
                return;
            case ' ':
            case '.':
                e.preventDefault();
                toggleAt(r, c);
                return;
            case 'Backspace':
            case 'Delete':
                e.preventDefault();
                apply(clearCell(grid, r, c));
                return;
            case 'Enter':
                e.preventDefault();
                if (slot) inputRef.current?.focus();
                return;
        }
        // Any other letter starts a new answer in the answer box. Keyboard layouts can give one key
        // several code points (ক্ষ), so any key value with a Bengali character counts too.
        if (mod || e.altKey || !slot) return;
        const input = inputRef.current;
        if (!input) return;
        const isChar = e.key.length === 1 || /[ঀ-৿]/u.test(e.key);
        if (isChar) {
            e.preventDefault();
            setDraft(e.key);
            input.focus();
        } else if (e.key === 'Process' || e.key === 'Unidentified') {
            // An input method is composing: hand it the answer box and let it type there.
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
            setDraft(startWord);
            focusBoard();
        }
    };

    // Undo/redo anywhere except inside a text field (which has its own undo).
    useEffect(() => {
        const onKey = (e: globalThis.KeyboardEvent) => {
            const t = e.target as HTMLElement | null;
            if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
            if (!(e.ctrlKey || e.metaKey)) return;
            const k = e.key.toLowerCase();
            if (k === 'z' && !e.shiftKey) {
                e.preventDefault();
                dispatch({ type: 'undo' });
            } else if (k === 'y' || (k === 'z' && e.shiftKey)) {
                e.preventDefault();
                dispatch({ type: 'redo' });
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    const load = (p: Puzzle) => {
        dispatch({ type: 'load', puzzle: p });
        setSel({ r: 0, c: 0, dir: pickDir(p.grid, 0, 0, 'across') });
    };

    const onNew = (rows: number, cols: number) => {
        if (hasContent(puzzle) && !window.confirm(plain(ui.replaceConfirm))) return;
        setShowNew(false);
        load({ ...createPuzzle(rows, cols), symmetry: puzzle.symmetry });
        setNotice(null);
        setTimeout(focusBoard);
    };

    const onExport = () => {
        const blob = new Blob([serializePuzzle(puzzle)], { type: 'application/json;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = downloadName(puzzle.title);
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    };

    const onImport = async (file: File | undefined) => {
        if (!file) return;
        const parsed = parseAnyPuzzle(await file.text());
        if (fileRef.current) fileRef.current.value = '';
        if (!parsed.ok) {
            setNotice({ kind: 'error', title: ui.importFailed, lines: parsed.errors });
            return;
        }
        if (hasContent(puzzle) && !window.confirm(plain(ui.replaceConfirm))) return;
        load(parsed.puzzle);
        setNotice({
            kind: 'ok',
            title: parsed.format === 'pataparbon' ? ui.importedPataparbon : ui.imported,
            lines: [],
        });
    };

    const onExportPataparbon = () => setExported(exportPataparbon(puzzle));

    const onPrint = () => {
        setShowPrint(false);
        // Let the dialog close and the sheet render before the browser takes its snapshot.
        setTimeout(() => window.print(), 100);
    };

    const onClue = (key: string, text: string) => {
        const clues = { ...puzzle.clues };
        if (text.trim() === '') delete clues[key];
        else clues[key] = text;
        meta({ clues });
    };

    const onSelectClue = (d: Direction, sr: number, sc: number, focus: boolean) => {
        setSel({ r: sr, c: sc, dir: d });
        if (focus) focusBoard();
    };

    const changeFillSettings = (next: FillSettings) => {
        setFillSettings(next);
        saveFillSettings(next);
    };

    const pickSuggestion = (cells: string[]) => {
        if (!slot) return;
        apply(placeAnswer(grid, slot, cells));
        setDraft(cells.join(''));
    };

    const meta = (change: Partial<Puzzle>) => dispatch({ type: 'meta', puzzle: { ...puzzle, ...change } });

    const listHint =
        !slot || typed === '' || !check?.ok
            ? null
            : words.status === 'loading'
              ? ui.listLoading
              : words.status === 'missing'
                ? ui.listMissing
                : words.words.has(check.cells.join(''))
                  ? ui.inList
                  : ui.notInList;

    return (
        <>
            <div className="app">
                <header className="top">
                    <div className="brand">
                        <h1>
                            <T t={ui.appName} />
                        </h1>
                        <p className="tagline">
                            <T t={ui.tagline} />
                        </p>
                    </div>
                    <div className="meta">
                        <label>
                            <T t={ui.title} />
                            <input value={puzzle.title} onChange={(e) => meta({ title: e.target.value })} />
                        </label>
                        <label>
                            <T t={ui.author} />
                            <input value={puzzle.author} onChange={(e) => meta({ author: e.target.value })} />
                        </label>
                    </div>
                </header>

                <nav className="toolbar" aria-label="Toolbar">
                    <button onClick={() => setShowNew(true)}>
                        <T t={ui.newPuzzle} />
                    </button>
                    <button onClick={() => fileRef.current?.click()}>
                        <T t={ui.importFile} />
                    </button>
                    <input
                        ref={fileRef}
                        type="file"
                        accept=".json,application/json"
                        hidden
                        onChange={(e) => void onImport(e.target.files?.[0])}
                    />
                    <button onClick={onExport}>
                        <T t={ui.exportFile} />
                    </button>
                    <button onClick={onExportPataparbon}>
                        <T t={ui.exportPataparbon} />
                    </button>
                    <button onClick={() => setShowPrint(true)}>
                        <T t={ui.print} />
                    </button>
                    <span className="sep" />
                    <button onClick={() => dispatch({ type: 'undo' })} disabled={history.past.length === 0}>
                        <T t={ui.undo} />
                    </button>
                    <button onClick={() => dispatch({ type: 'redo' })} disabled={history.future.length === 0}>
                        <T t={ui.redo} />
                    </button>
                    <span className="sep" />
                    <span className="mode" role="group" aria-label={plain(ui.modeLabel)}>
                        <span className="mode-label">
                            <T t={ui.modeLabel} />
                        </span>
                        <button aria-pressed={!blockMode} onClick={() => setBlockMode(false)}>
                            <T t={ui.modeLetters} />
                        </button>
                        <button aria-pressed={blockMode} onClick={() => setBlockMode(true)}>
                            <T t={ui.modeBlocks} />
                        </button>
                    </span>
                    <label className="check">
                        <input
                            type="checkbox"
                            checked={puzzle.symmetry}
                            onChange={(e) => meta({ symmetry: e.target.checked })}
                        />
                        <T t={ui.symmetry} />
                    </label>
                    <span className="size-tag">
                        <T t={fmt.size(grid.rows, grid.cols)} />
                    </span>
                </nav>

                {notice && (
                    <div
                        className={`notice ${notice.kind}`}
                        role={notice.kind === 'error' ? 'alert' : 'status'}
                    >
                        <strong>
                            <T t={notice.title} />
                        </strong>
                        {notice.lines.length > 0 && (
                            <ul>
                                {notice.lines.map((m, i) => (
                                    <li key={i}>
                                        <T t={m} />
                                    </li>
                                ))}
                            </ul>
                        )}
                        <button className="link" onClick={() => setNotice(null)} aria-label="Close">
                            ×
                        </button>
                    </div>
                )}

                <main className="workspace">
                    <section className="board-wrap">
                        <Board
                            ref={boardRef}
                            grid={grid}
                            numbers={num.numbers}
                            selected={{ r, c }}
                            slotCells={inSlot}
                            preview={preview}
                            blockMode={blockMode}
                            onCellClick={onCellClick}
                            onKeyDown={onBoardKey}
                        />
                    </section>

                    <aside className="side">
                        <section className="panel answer">
                            <h2>
                                {slot ? (
                                    <T t={fmt.slotLabel(slot.dir, slot.n, slot.len)} />
                                ) : isBlock(grid, r, c) ? (
                                    <T t={ui.blockSelected} />
                                ) : (
                                    <T t={ui.noSlot} />
                                )}
                            </h2>
                            <div className="answer-row">
                                <input
                                    ref={inputRef}
                                    className="answer-input"
                                    lang="bn"
                                    value={draft}
                                    disabled={!slot}
                                    placeholder={plain(ui.answerPlaceholder)}
                                    aria-label={plain(ui.answerPlaceholder)}
                                    aria-invalid={typing && check ? !check.ok : undefined}
                                    onChange={(e) => setDraft(e.target.value)}
                                    onKeyDown={onAnswerKey}
                                />
                                <button onClick={commit} disabled={!slot || !check?.ok || typed === ''}>
                                    <T t={ui.place} />
                                </button>
                                <button
                                    onClick={clearSlot}
                                    disabled={!slot || currentLetters.every((l) => l === '')}
                                >
                                    <T t={ui.clearSlot} />
                                </button>
                            </div>
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
                            {phonetic && typed !== '' && typed !== normalize(draft) && (
                                <p className="converted" lang="bn" aria-live="polite">
                                    {typed}
                                </p>
                            )}
                            {slot && check && typed !== '' && (
                                <div className="cells-preview" aria-live="polite">
                                    {check.cells.map((cell, i) => (
                                        <span key={i} className={i >= slot.len ? 'chip over' : 'chip'}>
                                            {show(cell)}
                                        </span>
                                    ))}
                                </div>
                            )}
                            {typing && check && !check.ok && (
                                <ul className="errors">
                                    {check.errors.map((m) => (
                                        <li key={m.code}>
                                            <T t={m} />
                                        </li>
                                    ))}
                                </ul>
                            )}
                            {!phonetic &&
                                typing &&
                                check &&
                                !check.ok &&
                                check.errors.some((m) => m.code === 'latin') && (
                                    <p className="hint">
                                        <T t={ui.tryPhonetic} />
                                    </p>
                                )}
                            {typing && check?.ok && willConflict && (
                                <p className="warn">
                                    <T t={ui.willConflict} />
                                </p>
                            )}
                            {listHint && (
                                <p className={listHint === ui.inList ? 'hint good' : 'hint'}>
                                    <T t={listHint} />
                                </p>
                            )}
                            {phonetic && <PhoneticHelp />}
                        </section>

                        <SuggestPanel
                            grid={grid}
                            slot={slot}
                            client={fillClient}
                            status={fillStatus}
                            settings={fillSettings}
                            onPick={pickSuggestion}
                            onBlock={(w) =>
                                changeFillSettings({
                                    ...fillSettings,
                                    blocked: [...new Set([...fillSettings.blocked, w])],
                                })
                            }
                        />

                        <FillPanel
                            grid={grid}
                            client={fillClient}
                            status={fillStatus}
                            settings={fillSettings}
                            onSettings={changeFillSettings}
                            onApply={apply}
                            onSelectSlot={(d, sr, sc) => onSelectClue(d, sr, sc, true)}
                        />

                        <section className="panel">
                            <h2>
                                <T t={ui.conflicts} />
                            </h2>
                            {conflictList.length === 0 ? (
                                <p className="muted">
                                    <T t={ui.noConflicts} />
                                </p>
                            ) : (
                                <ul className="conflict-list">
                                    {conflictList.map((x) => (
                                        <li key={`${x.r}:${x.c}`}>
                                            <button
                                                className="link"
                                                onClick={() => {
                                                    select(x.r, x.c);
                                                    focusBoard();
                                                }}
                                            >
                                                <T t={fmt.cellAt(x.r, x.c)} />
                                            </button>{' '}
                                            <span className="pair">
                                                {ui.across.bn} <b>{x.across}</b> · {ui.down.bn}{' '}
                                                <b>{x.down}</b>
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            {!symmetricOk && (
                                <p className="warn">
                                    <T t={ui.notSymmetric} />
                                </p>
                            )}
                        </section>

                        <section className="panel">
                            <h2>
                                <T t={ui.stats} />
                            </h2>
                            <p>
                                <T t={fmt.stats(stats.white, stats.filled, stats.blocks, slotCount)} />
                            </p>
                            {coverage && coverage.complete > 0 && (
                                <p>
                                    <T t={fmt.listCoverage(coverage.inList, coverage.complete)} />
                                </p>
                            )}
                            <p className="muted small">
                                <T t={ui.savedLocally} />
                            </p>
                        </section>

                        <section className="panel keys">
                            <h2>
                                <T t={ui.keys} />
                            </h2>
                            <ul>
                                {[
                                    ui.keyArrows,
                                    ui.keyTab,
                                    ui.keySpace,
                                    ui.keyEnter,
                                    ui.keyDelete,
                                    ui.keyEsc,
                                    ui.keyUndo,
                                ].map((k) => (
                                    <li key={k.en}>
                                        <T t={k} />
                                    </li>
                                ))}
                            </ul>
                        </section>
                    </aside>
                </main>

                <CluePanel
                    puzzle={puzzle}
                    selected={slot ? { dir: slot.dir, r: slot.r, c: slot.c } : null}
                    phonetic={phonetic}
                    onPhonetic={(on) => {
                        setPhonetic(on);
                        savePhonetic(on);
                    }}
                    onSelect={onSelectClue}
                    onClue={onClue}
                />

                {showNew && (
                    <NewPuzzleDialog
                        rows={grid.rows}
                        cols={grid.cols}
                        onCreate={onNew}
                        onCancel={() => setShowNew(false)}
                    />
                )}
                {exported && (
                    <ExportDialog
                        result={exported}
                        rows={grid.rows}
                        cols={grid.cols}
                        fileName={downloadName(puzzle.title, 'shobdochhok')}
                        onClose={() => setExported(null)}
                    />
                )}
                {showPrint && (
                    <PrintDialog
                        layout={printLayout}
                        onLayout={setPrintLayout}
                        onPrint={onPrint}
                        onClose={() => setShowPrint(false)}
                    />
                )}
            </div>
            <PrintSheet puzzle={puzzle} layout={printLayout} />
        </>
    );
}
