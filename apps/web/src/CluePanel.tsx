import {
    clueRows,
    clueSummary,
    normalize,
    phoneticToBengali,
    toBengaliDigits,
    type ClueRow,
    type Direction,
    type Puzzle,
} from '@aksharkhop/core';
import { useEffect, useMemo, useRef, useState } from 'react';
import { DraftDialog } from './DraftDialog.tsx';
import { fmt, plain, ui } from './i18n.ts';
import { T } from './T.tsx';

interface Props {
    puzzle: Puzzle;
    /** The selected slot, or null. */
    selected: { dir: Direction; r: number; c: number } | null;
    phonetic: boolean;
    onPhonetic: (on: boolean) => void;
    /** Select a slot on the board. `focusBoard` is true when the number was clicked, not the text box. */
    onSelect: (dir: Direction, r: number, c: number, focusBoard: boolean) => void;
    onClue: (key: string, text: string) => void;
}

export function CluePanel({ puzzle, selected, phonetic, onPhonetic, onSelect, onClue }: Props) {
    const rows = useMemo(() => clueRows(puzzle), [puzzle]);
    const summary = clueSummary(rows);

    return (
        <section className="panel clue-panel" aria-label={plain(ui.clues)}>
            <div className="clue-head">
                <h2>
                    <T t={ui.clues} />
                </h2>
                <label className="check small">
                    <input
                        type="checkbox"
                        checked={phonetic}
                        onChange={(e) => onPhonetic(e.target.checked)}
                    />
                    <T t={ui.cluesPhonetic} />
                </label>
            </div>
            {summary.total === 0 ? (
                <p className="muted">
                    <T t={ui.noSlotsYet} />
                </p>
            ) : (
                <>
                    <p className="clue-summary">
                        <T t={fmt.clueSummary(summary.answered, summary.clued, summary.total)} />
                        {summary.giveaways > 0 && (
                            <span className="warn">
                                {' · '}
                                <T t={fmt.giveaways(summary.giveaways)} />
                            </span>
                        )}
                    </p>
                    {phonetic && (
                        <p className="muted small">
                            <T t={ui.cluesPhoneticHint} />
                        </p>
                    )}
                    <div className="clue-columns">
                        {(['across', 'down'] as const).map((dir) => (
                            <ClueList
                                key={dir}
                                dir={dir}
                                rows={rows[dir]}
                                selected={selected}
                                phonetic={phonetic}
                                onSelect={onSelect}
                                onClue={onClue}
                            />
                        ))}
                    </div>
                </>
            )}
        </section>
    );
}

function ClueList({
    dir,
    rows,
    selected,
    phonetic,
    onSelect,
    onClue,
}: {
    dir: Direction;
    rows: ClueRow[];
    selected: Props['selected'];
    phonetic: boolean;
    onSelect: Props['onSelect'];
    onClue: Props['onClue'];
}) {
    const listRef = useRef<HTMLOListElement>(null);
    const [drafting, setDrafting] = useState<ClueRow | null>(null);
    const activeKey = selected && selected.dir === dir ? `${selected.r}:${selected.c}` : '';

    // Keep the selected clue in view inside its own list. (scrollIntoView would also move the page
    // away from the board.)
    useEffect(() => {
        const list = listRef.current;
        const item = list?.querySelector<HTMLElement>('li.active');
        if (!list || !item) return;
        const top = item.offsetTop - list.offsetTop;
        if (top < list.scrollTop) list.scrollTop = top;
        else if (top + item.offsetHeight > list.scrollTop + list.clientHeight)
            list.scrollTop = top + item.offsetHeight - list.clientHeight;
    }, [activeKey]);

    return (
        <div className="clue-list">
            <h3>
                <T t={dir === 'across' ? ui.across : ui.down} />
            </h3>
            {rows.length === 0 ? (
                <p className="muted small">–</p>
            ) : (
                <ol ref={listRef}>
                    {rows.map((row) => {
                        const k = `${row.slot.r}:${row.slot.c}`;
                        const classes = ['clue-row'];
                        if (k === activeKey) classes.push('active');
                        if (row.issues.includes('no_clue')) classes.push('needs-clue');
                        return (
                            <li key={row.key} className={classes.join(' ')}>
                                <button
                                    type="button"
                                    className="clue-num"
                                    onClick={() => onSelect(dir, row.slot.r, row.slot.c, true)}
                                    aria-label={plain(fmt.slotLabel(dir, row.slot.n, row.slot.len))}
                                >
                                    {toBengaliDigits(row.slot.n)}
                                </button>
                                <div className="clue-body">
                                    <div className="clue-answer" lang="bn">
                                        {row.answer !== '' ? (
                                            row.answer
                                        ) : (
                                            <span className="muted small">
                                                <T t={ui.noAnswer} /> · {toBengaliDigits(row.slot.len)} ঘর
                                            </span>
                                        )}
                                    </div>
                                    <ClueInput
                                        value={row.clue}
                                        phonetic={phonetic}
                                        label={plain(fmt.clueLabel(dir, row.slot.n))}
                                        onFocus={() => onSelect(dir, row.slot.r, row.slot.c, false)}
                                        onCommit={(text) => onClue(row.key, text)}
                                    />
                                    {row.answer !== '' && (
                                        <button
                                            type="button"
                                            className="small draft-button"
                                            onClick={() => setDrafting(row)}
                                        >
                                            <T t={ui.draftButton} />
                                        </button>
                                    )}
                                    {row.issues.includes('clue_has_answer') && (
                                        <p className="warn small">
                                            <T t={ui.clueGivesAway} />
                                        </p>
                                    )}
                                </div>
                            </li>
                        );
                    })}
                </ol>
            )}
            {drafting && (
                <DraftDialog
                    answer={drafting.answer}
                    onClose={() => setDrafting(null)}
                    onPick={(clue) => {
                        onClue(drafting.key, clue);
                        setDrafting(null);
                    }}
                />
            )}
        </div>
    );
}

/**
 * One clue's text box. The text is kept here while it is typed and saved on Enter or when the box
 * loses focus, so that phonetic typing (ka → ক) works on the whole text, as in the answer box.
 */
function ClueInput({
    value,
    phonetic,
    label,
    onFocus,
    onCommit,
}: {
    value: string;
    phonetic: boolean;
    label: string;
    onFocus: () => void;
    onCommit: (text: string) => void;
}) {
    const [draft, setDraft] = useState(value);
    const focused = useRef(false);

    // Follow the stored text (open, new, undo) unless the box is being typed in.
    useEffect(() => {
        if (!focused.current) setDraft(value);
    }, [value]);

    const converted = phonetic ? phoneticToBengali(draft) : draft;
    const showConverted = phonetic && normalize(converted) !== normalize(draft);

    const commit = () => {
        if (converted !== value) onCommit(converted);
        setDraft(converted);
    };

    return (
        <>
            <input
                className="clue-input"
                lang="bn"
                value={draft}
                placeholder={plain(ui.cluePlaceholder)}
                aria-label={label}
                onFocus={() => {
                    focused.current = true;
                    onFocus();
                }}
                onBlur={() => {
                    focused.current = false;
                    commit();
                }}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                    if (e.nativeEvent.isComposing) return;
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        commit();
                    } else if (e.key === 'Escape') {
                        setDraft(value);
                    }
                }}
            />
            {showConverted && (
                <p className="converted small" lang="bn" aria-live="polite">
                    {converted}
                </p>
            )}
        </>
    );
}
