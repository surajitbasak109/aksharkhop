import { type Grid, type Slot, type SuggestResult } from '@aksharkhop/core';
import { useEffect, useState } from 'react';
import type { FillClient, WorkerStatus } from './fillClient.ts';
import { fmt, plain, ui } from './i18n.ts';
import type { FillSettings } from './storage.ts';
import { T } from './T.tsx';

interface Props {
    grid: Grid;
    slot: Slot | null;
    client: FillClient;
    status: WorkerStatus;
    settings: FillSettings;
    /** Put this word in the slot. */
    onPick: (cells: string[]) => void;
    onBlock: (word: string) => void;
}

export function SuggestPanel({ grid, slot, client, status, settings, onPick, onBlock }: Props) {
    const [result, setResult] = useState<SuggestResult | null>(null);
    const [loading, setLoading] = useState(false);
    const ready = status.status === 'ready';
    const slotKey = slot ? `${slot.dir}:${slot.r}:${slot.c}:${slot.len}` : '';

    // Ask the worker, a moment after the last change, and ignore an answer that is already out of date.
    useEffect(() => {
        if (!ready || !slot) {
            setResult(null);
            return;
        }
        let live = true;
        setLoading(true);
        const timer = setTimeout(() => {
            void client
                .suggest(grid, slot, { minFreq: settings.minFreq, blocked: settings.blocked, limit: 40 })
                .then((r) => {
                    if (!live) return;
                    setResult(r);
                    setLoading(false);
                });
        }, 150);
        return () => {
            live = false;
            clearTimeout(timer);
        };
        // `slot` is covered by slotKey; the grid and the filter are what change the answer.
    }, [client, ready, grid, slotKey, settings.minFreq, settings.blocked]);

    return (
        <section className="panel suggest" aria-label={plain(ui.suggest)}>
            <h2>
                <T t={ui.suggest} />
            </h2>
            {status.status === 'missing' ? (
                <p className="muted">
                    <T t={ui.suggestNoWordList} />
                </p>
            ) : !slot ? (
                <p className="muted">
                    <T t={ui.suggestSelect} />
                </p>
            ) : (
                <>
                    <p className="muted small">
                        <T t={ui.suggestHelp} />
                    </p>
                    {status.status === 'loading' || (loading && !result) ? (
                        <p className="muted">
                            <T t={ui.suggestLoading} />
                        </p>
                    ) : result && result.words.length === 0 ? (
                        <p className="warn">
                            <T t={ui.suggestNone} />
                        </p>
                    ) : result ? (
                        <>
                            <p className="small" aria-live="polite">
                                <T t={fmt.suggestCount(result.words.length, result.fitting)} />
                            </p>
                            <ul className="suggest-list" lang="bn">
                                {result.words.map((w) => (
                                    <li key={w.word}>
                                        <button
                                            type="button"
                                            className="suggest-word"
                                            title={plain(ui.suggestPick)}
                                            onClick={() => onPick(w.cells)}
                                        >
                                            {w.word}
                                        </button>
                                        <button
                                            type="button"
                                            className="suggest-block"
                                            title={plain(ui.suggestBlock)}
                                            aria-label={`${plain(ui.suggestBlock)}: ${w.word}`}
                                            onClick={() => onBlock(w.word)}
                                        >
                                            ×
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </>
                    ) : null}
                </>
            )}
        </section>
    );
}
