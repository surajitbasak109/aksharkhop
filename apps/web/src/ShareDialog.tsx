import { encodeSolve, solveLink, toSolvePuzzle, type Message, type Puzzle } from '@aksharkhop/core';
import { useEffect, useRef, useState } from 'react';
import { copyText } from './clipboard.ts';
import { fmt, plain, ui } from './i18n.ts';
import { T } from './T.tsx';

type Made = { kind: 'making' } | { kind: 'bad'; errors: Message[] } | { kind: 'ok'; link: string };

/** The link that opens this puzzle in the solver. Everything is in the link: no server. */
export function ShareDialog({ puzzle, onClose }: { puzzle: Puzzle; onClose: () => void }) {
    const ref = useRef<HTMLDialogElement>(null);
    const [made, setMade] = useState<Made>({ kind: 'making' });
    const [copied, setCopied] = useState<'idle' | 'done' | 'failed'>('idle');

    useEffect(() => {
        const d = ref.current;
        if (d && !d.open) d.showModal();
    }, []);

    useEffect(() => {
        let live = true;
        const result = toSolvePuzzle(puzzle);
        if (!result.ok) {
            setMade({ kind: 'bad', errors: result.errors });
            return;
        }
        void encodeSolve(result.solve).then((code) => {
            if (live) setMade({ kind: 'ok', link: solveLink(window.location.href, code) });
        });
        return () => {
            live = false;
        };
    }, [puzzle]);

    const title = made.kind === 'bad' ? ui.shareBad : ui.shareTitle;

    return (
        <dialog
            ref={ref}
            className="dialog export-dialog"
            aria-label={plain(title)}
            onCancel={(e) => {
                e.preventDefault();
                onClose();
            }}
        >
            <h2>
                <T t={title} />
            </h2>

            {made.kind === 'making' && (
                <p className="muted">
                    <T t={ui.shareMaking} />
                </p>
            )}

            {made.kind === 'bad' && (
                <>
                    <p>
                        <T t={ui.shareBadHelp} />
                    </p>
                    <ul className="errors problem-list" role="alert">
                        {made.errors.map((m, i) => (
                            <li key={i}>
                                <T t={m} />
                            </li>
                        ))}
                    </ul>
                </>
            )}

            {made.kind === 'ok' && (
                <>
                    <p>
                        <T t={ui.shareHelp} />
                    </p>
                    <label className="field">
                        <span>
                            <T t={ui.shareLinkLabel} />
                        </span>
                        <input
                            className="link-box"
                            readOnly
                            value={made.link}
                            onFocus={(e) => e.currentTarget.select()}
                        />
                    </label>
                    {made.link.length > 8000 && (
                        <p className="warn">
                            <T t={fmt.linkLong(made.link.length)} />
                        </p>
                    )}
                    <p className="muted small">
                        <T t={ui.shareAnswers} />
                    </p>
                </>
            )}

            <div className="dialog-actions">
                {copied === 'done' && (
                    <span className="good" role="status">
                        <T t={ui.copied} />
                    </span>
                )}
                {copied === 'failed' && (
                    <span className="warn" role="status">
                        <T t={ui.copyFailed} />
                    </span>
                )}
                {made.kind === 'ok' && (
                    <>
                        <a className="button-link" href={made.link} target="_blank" rel="noopener">
                            <T t={ui.shareOpen} />
                        </a>
                        <button
                            type="button"
                            className="primary"
                            onClick={async () => setCopied((await copyText(made.link)) ? 'done' : 'failed')}
                        >
                            <T t={ui.solveCopyLink} />
                        </button>
                    </>
                )}
                <button type="button" onClick={onClose}>
                    <T t={ui.close} />
                </button>
            </div>
        </dialog>
    );
}
