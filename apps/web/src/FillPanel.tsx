import {
    applyPlacements,
    slots as allSlots,
    type Direction,
    type FillResult,
    type FillStats,
    type Grid,
} from '@aksharkhop/core';
import { useEffect, useRef, useState } from 'react';
import type { FillClient, WorkerStatus } from './fillClient.ts';
import { fmt, plain, ui } from './i18n.ts';
import type { FillSettings } from './storage.ts';
import { T } from './T.tsx';

const TIME_LIMITS = [5, 15, 60];

interface Props {
    grid: Grid;
    client: FillClient;
    status: WorkerStatus;
    settings: FillSettings;
    onSettings: (s: FillSettings) => void;
    /** Writes a filled grid in as one undo step. */
    onApply: (grid: Grid) => void;
    /** Selects a slot on the board. */
    onSelectSlot: (dir: Direction, r: number, c: number) => void;
}

type Outcome =
    | { kind: 'solved'; filled: number; ms: number; seed: number }
    | { kind: 'failed'; result: Extract<FillResult, { status: 'failed' }> }
    | { kind: 'stale' };

const randomSeed = () => Math.floor(Math.random() * 1_000_000);

export function FillPanel({ grid, client, status, settings, onSettings, onApply, onSelectSlot }: Props) {
    const [seed, setSeed] = useState(randomSeed);
    const [seconds, setSeconds] = useState(TIME_LIMITS[0]!);
    const [running, setRunning] = useState<FillStats | null>(null);
    const [outcome, setOutcome] = useState<Outcome | null>(null);
    const [usable, setUsable] = useState<number | null>(null);
    const [blockText, setBlockText] = useState(settings.blocked.join('\n'));
    const job = useRef<{ cancel: () => void } | null>(null);

    // The async result needs the latest grid and callback, not the ones from when the fill started.
    const latest = useRef({ grid, onApply });
    latest.current = { grid, onApply };

    const ready = status.status === 'ready';
    const slotCount = allSlots(grid);
    const hasSlots = slotCount.across.length + slotCount.down.length > 0;

    useEffect(() => {
        if (!ready) return;
        let live = true;
        void client.count({ minFreq: settings.minFreq, blocked: settings.blocked }).then((c) => {
            if (live) setUsable(c.total);
        });
        return () => {
            live = false;
        };
    }, [client, ready, settings.minFreq, settings.blocked]);

    // Leaving the page (or this panel) stops a fill that is still running.
    useEffect(() => {
        return () => {
            job.current?.cancel();
        };
    }, []);

    const run = () => {
        const start = grid;
        setOutcome(null);
        setRunning({ nodes: 0, restarts: 0, ms: 0, seed });
        const usedSeed = seed;
        const started = client.fill(
            start,
            {
                seed: usedSeed,
                timeLimitMs: seconds * 1000,
                minFreq: settings.minFreq,
                blocked: settings.blocked,
            },
            setRunning,
        );
        job.current = started;
        void started.result.then((result) => {
            job.current = null;
            setRunning(null);
            setSeed(randomSeed());
            if (result.status === 'failed') {
                setOutcome({ kind: 'failed', result });
                return;
            }
            if (latest.current.grid !== start) {
                setOutcome({ kind: 'stale' });
                return;
            }
            if (result.placements.length > 0)
                latest.current.onApply(applyPlacements(start, result.placements));
            setOutcome({ kind: 'solved', filled: result.placements.length, ms: result.ms, seed: usedSeed });
        });
    };

    const commitBlocked = () => {
        const words = [...new Set(blockText.split(/\s+/).filter((w) => w !== ''))];
        if (words.join('\n') !== settings.blocked.join('\n')) onSettings({ ...settings, blocked: words });
    };

    // A word blocked from the suggestion list shows up here too.
    useEffect(() => {
        setBlockText(settings.blocked.join('\n'));
    }, [settings.blocked]);

    return (
        <section className="panel fill" aria-label={plain(ui.autofill)}>
            <h2>
                <T t={ui.autofill} />
            </h2>
            <p className="muted small">
                <T t={ui.fillHelp} />
            </p>

            {status.status === 'missing' ? (
                <p className="warn">
                    <T t={ui.fillNoWordList} />
                </p>
            ) : status.status === 'loading' ? (
                <p className="muted">
                    <T t={ui.fillLoading} />
                </p>
            ) : null}

            <div className="fill-actions">
                {running ? (
                    <button type="button" onClick={() => job.current?.cancel()}>
                        <T t={ui.fillStop} />
                    </button>
                ) : (
                    <button type="button" className="primary" onClick={run} disabled={!ready || !hasSlots}>
                        <T t={ui.fillRun} />
                    </button>
                )}
            </div>

            {running && (
                <p className="small" role="status" aria-live="polite">
                    <T t={ui.fillWorking} />{' '}
                    <T t={fmt.fillProgress(running.nodes, running.restarts, running.ms)} />
                </p>
            )}

            {outcome?.kind === 'solved' && (
                <p className="good" role="status">
                    <T
                        t={
                            outcome.filled === 0
                                ? ui.fillSolvedNothing
                                : fmt.fillSolved(outcome.filled, outcome.ms, outcome.seed)
                        }
                    />
                </p>
            )}
            {outcome?.kind === 'stale' && (
                <p className="warn" role="status">
                    <T t={ui.fillStale} />
                </p>
            )}
            {outcome?.kind === 'failed' && (
                <div role="alert">
                    <p className="warn">
                        <T t={fmt.fillFailed(outcome.result.reason, outcome.result.ms)} />
                    </p>
                    {outcome.result.reason !== 'cancelled' && outcome.result.blocked.length > 0 && (
                        <>
                            <p className="small">
                                <T t={ui.fillBlockedTitle} />
                            </p>
                            <ul className="blocked-slots">
                                {outcome.result.blocked.map((b) => (
                                    <li key={`${b.dir}:${b.r}:${b.c}`}>
                                        <button
                                            type="button"
                                            className="link"
                                            onClick={() => onSelectSlot(b.dir, b.r, b.c)}
                                        >
                                            <T t={fmt.slotPattern(b.dir, b.n, b.len, b.candidates)} />
                                        </button>
                                        <span className="pattern" lang="bn">
                                            {b.letters.map((l) => l || '_').join(' ')}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </>
                    )}
                    {outcome.result.reason === 'timeout' && (
                        <p className="muted small">
                            <T t={ui.fillTried} />
                        </p>
                    )}
                </div>
            )}

            <div className="fill-options">
                <label className="field">
                    <span>
                        <T t={ui.fillCommon} />: <b>{settings.minFreq.toFixed(2)}</b>
                    </span>
                    <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={settings.minFreq}
                        onChange={(e) => onSettings({ ...settings, minFreq: Number(e.target.value) })}
                    />
                </label>
                <p className="muted small">
                    {usable !== null && (
                        <>
                            <T t={fmt.usable(usable)} />.{' '}
                        </>
                    )}
                    <T t={ui.fillCommonHelp} />
                </p>
                <div className="fill-row">
                    <label className="field">
                        <span>
                            <T t={ui.fillTime} />
                        </span>
                        <select value={seconds} onChange={(e) => setSeconds(Number(e.target.value))}>
                            {TIME_LIMITS.map((s) => (
                                <option key={s} value={s}>
                                    {s} s
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="field">
                        <span>
                            <T t={ui.fillSeed} />
                        </span>
                        <input
                            type="number"
                            min={0}
                            step={1}
                            value={seed}
                            onChange={(e) => setSeed(Math.max(0, Math.floor(Number(e.target.value)) || 0))}
                        />
                    </label>
                </div>
                <details className="blocklist">
                    <summary>
                        <T t={ui.fillBlock} /> ({settings.blocked.length})
                    </summary>
                    <p className="muted small">
                        <T t={ui.fillBlockHelp} />
                    </p>
                    <textarea
                        lang="bn"
                        rows={4}
                        value={blockText}
                        onChange={(e) => setBlockText(e.target.value)}
                        onBlur={commitBlocked}
                        aria-label={plain(ui.fillBlock)}
                    />
                </details>
            </div>
        </section>
    );
}
