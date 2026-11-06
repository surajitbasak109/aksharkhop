import {
    buildCopyPrompt,
    draftClues,
    DraftError,
    readPastedReply,
    type DraftErrorCode,
} from '@aksharkhop/core';
import { useEffect, useRef, useState } from 'react';
import { copyText } from './clipboard.ts';
import { clearApiKey, getApiKey, setApiKey } from './apiKey.ts';
import { plain, ui, type Text } from './i18n.ts';
import { T } from './T.tsx';

const errorText: Record<DraftErrorCode, Text> = {
    no_key: ui.draftErrNoKey,
    bad_key: ui.draftErrBadKey,
    rate_limit: ui.draftErrRate,
    network: ui.draftErrNetwork,
    server: ui.draftErrServer,
    no_usable_clue: ui.draftErrNone,
};

type State =
    | { kind: 'idle' }
    | { kind: 'working' }
    | { kind: 'done'; drafts: string[] }
    | { kind: 'error'; code: DraftErrorCode };

/** Drafts clues for one answer with the user's own Claude key. The human picks one, or none. */
export function DraftDialog({
    answer,
    onPick,
    onClose,
}: {
    answer: string;
    onPick: (clue: string) => void;
    onClose: () => void;
}) {
    const ref = useRef<HTMLDialogElement>(null);
    const [hasKey, setHasKey] = useState(getApiKey() !== '');
    const [keyText, setKeyText] = useState('');
    const [state, setState] = useState<State>({ kind: 'idle' });
    // Copy-and-paste mode is the default: no key, any chatbot. The key mode is the optional extra.
    const [mode, setMode] = useState<'paste' | 'key'>('paste');
    const [copied, setCopied] = useState<'idle' | 'done' | 'failed'>('idle');
    const [reply, setReply] = useState('');
    const [pasteDrafts, setPasteDrafts] = useState<string[] | null>(null);
    const prompt = buildCopyPrompt(answer);

    useEffect(() => {
        const d = ref.current;
        if (d && !d.open) d.showModal();
    }, []);

    const run = async () => {
        setState({ kind: 'working' });
        try {
            setState({ kind: 'done', drafts: await draftClues(getApiKey(), answer) });
        } catch (e) {
            setState({ kind: 'error', code: e instanceof DraftError ? e.code : 'server' });
        }
    };

    const saveKey = () => {
        setApiKey(keyText);
        setKeyText('');
        if (getApiKey() !== '') {
            setHasKey(true);
            void run();
        }
    };

    useEffect(() => {
        if (mode === 'key' && hasKey && state.kind === 'idle') void run();
    }, [mode]);

    return (
        <dialog
            ref={ref}
            className="dialog export-dialog"
            aria-label={plain(ui.draftTitle)}
            onCancel={(e) => {
                e.preventDefault();
                onClose();
            }}
        >
            <h2>
                <T t={ui.draftTitle} />
            </h2>
            <p lang="bn" className="clue-answer">
                {answer}
            </p>

            <div className="mode-switch" role="group" aria-label={plain(ui.draftMode)}>
                <button type="button" aria-pressed={mode === 'paste'} onClick={() => setMode('paste')}>
                    <T t={ui.draftModePaste} />
                </button>
                <button type="button" aria-pressed={mode === 'key'} onClick={() => setMode('key')}>
                    <T t={ui.draftModeKey} />
                </button>
            </div>

            {mode === 'paste' && (
                <>
                    <ol className="small">
                        <li>
                            <T t={ui.draftPaste1} />
                        </li>
                        <li>
                            <T t={ui.draftPaste2} />
                        </li>
                        <li>
                            <T t={ui.draftPaste3} />
                        </li>
                    </ol>
                    <label className="field">
                        <span>
                            <T t={ui.draftPromptLabel} />
                        </span>
                        <textarea
                            className="link-box"
                            readOnly
                            rows={5}
                            value={prompt}
                            onFocus={(e) => e.currentTarget.select()}
                        />
                    </label>
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
                        <button
                            type="button"
                            className="primary"
                            onClick={async () => setCopied((await copyText(prompt)) ? 'done' : 'failed')}
                        >
                            <T t={ui.draftCopyPrompt} />
                        </button>
                    </div>
                    <label className="field">
                        <span>
                            <T t={ui.draftReplyLabel} />
                        </span>
                        <textarea
                            rows={5}
                            lang="bn"
                            value={reply}
                            onChange={(e) => {
                                setReply(e.target.value);
                                setPasteDrafts(null);
                            }}
                        />
                    </label>
                    <div className="dialog-actions">
                        <button
                            type="button"
                            disabled={reply.trim() === ''}
                            onClick={() => setPasteDrafts(readPastedReply(reply, answer))}
                        >
                            <T t={ui.draftReadReply} />
                        </button>
                    </div>
                    {pasteDrafts !== null && pasteDrafts.length === 0 && (
                        <p className="warn" role="alert">
                            <T t={ui.draftErrNone} />
                        </p>
                    )}
                    {pasteDrafts !== null && pasteDrafts.length > 0 && (
                        <>
                            <p className="small muted">
                                <T t={ui.draftReview} />
                            </p>
                            <ul className="draft-list">
                                {pasteDrafts.map((d) => (
                                    <li key={d}>
                                        <button type="button" lang="bn" onClick={() => onPick(d)}>
                                            {d}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </>
                    )}
                    <p className="small muted">
                        <T t={ui.draftPasteSends} />
                    </p>
                </>
            )}

            {mode === 'key' && !hasKey && (
                <>
                    <p>
                        <T t={ui.draftKeyHelp} />
                    </p>
                    <ul className="small muted">
                        <li>
                            <T t={ui.draftKeyMemory} />
                        </li>
                        <li>
                            <T t={ui.draftKeyLimit} />
                        </li>
                        <li>
                            <T t={ui.draftKeySends} />
                        </li>
                    </ul>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            saveKey();
                        }}
                    >
                        <label className="field">
                            <span>
                                <T t={ui.draftKeyLabel} />
                            </span>
                            <input
                                type="password"
                                autoComplete="off"
                                spellCheck={false}
                                value={keyText}
                                onChange={(e) => setKeyText(e.target.value)}
                                placeholder="sk-ant-…"
                            />
                        </label>
                    </form>
                </>
            )}

            {mode === 'key' && state.kind === 'working' && (
                <p className="muted" role="status">
                    <T t={ui.draftWorking} />
                </p>
            )}
            {mode === 'key' && state.kind === 'error' && (
                <p className="warn" role="alert">
                    <T t={errorText[state.code]} />
                </p>
            )}
            {mode === 'key' && state.kind === 'done' && (
                <>
                    <p className="small muted">
                        <T t={ui.draftReview} />
                    </p>
                    <ul className="draft-list">
                        {state.drafts.map((d) => (
                            <li key={d}>
                                <button type="button" lang="bn" onClick={() => onPick(d)}>
                                    {d}
                                </button>
                            </li>
                        ))}
                    </ul>
                </>
            )}

            <div className="dialog-actions">
                {!hasKey && (
                    <button
                        type="button"
                        className="primary"
                        disabled={keyText.trim() === ''}
                        onClick={saveKey}
                    >
                        <T t={ui.draftUseKey} />
                    </button>
                )}
                {mode === 'key' && hasKey && state.kind !== 'working' && (
                    <button type="button" onClick={() => void run()}>
                        <T t={ui.draftAgain} />
                    </button>
                )}
                {mode === 'key' && hasKey && (
                    <button
                        type="button"
                        onClick={() => {
                            clearApiKey();
                            setHasKey(false);
                            setState({ kind: 'idle' });
                        }}
                    >
                        <T t={ui.draftForgetKey} />
                    </button>
                )}
                <button type="button" onClick={onClose}>
                    <T t={ui.close} />
                </button>
            </div>
        </dialog>
    );
}
