// The solver pages: /solve (open a puzzle), /solve#solve=<code> (a shared puzzle), /solve/sample.
import {
    codeFromHash,
    decodeSolve,
    encodeSolve,
    SAMPLE_PUZZLE,
    solveFromText,
    type Message,
    type SolvePuzzle,
} from '@aksharkhop/core';
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { solveHome, ui } from './i18n.ts';
import { SolveView } from './SolveView.tsx';
import { T } from './T.tsx';

/** The share code in whatever was pasted: a whole link, a "#solve=…" fragment, or the bare code. */
export function codeFromPasted(text: string): string | null {
    const t = text.trim();
    const hash = t.includes('#') ? t.slice(t.indexOf('#')) : `#solve=${t}`;
    const code = codeFromHash(hash);
    return code !== null && code !== '' && /^[01]\.[A-Za-z0-9_-]+$/.test(code) ? code : null;
}

function SolveHome() {
    const navigate = useNavigate();
    const fileRef = useRef<HTMLInputElement>(null);
    const [pasted, setPasted] = useState('');
    const [problems, setProblems] = useState<Message[] | null>(null);
    const [pasteBad, setPasteBad] = useState(false);

    const go = (code: string) => navigate(`/solve#solve=${code}`);

    const onFile = async (file: File | undefined) => {
        if (!file) return;
        const result = solveFromText(await file.text());
        if (fileRef.current) fileRef.current.value = '';
        if (!result.ok) return setProblems(result.errors);
        setProblems(null);
        go(await encodeSolve(result.solve));
    };

    return (
        <main className="page-narrow solve-home">
            <h1>
                <T t={solveHome.title} />
            </h1>
            <p className="lead">
                <T t={solveHome.lead} />
            </p>

            <section className="panel">
                <p>
                    <Link className="button-link primary" to="/solve/sample">
                        <T t={solveHome.sample} />
                    </Link>
                </p>
                <p className="muted">
                    <T t={solveHome.or} />
                </p>
                <form
                    className="paste-form"
                    onSubmit={(e) => {
                        e.preventDefault();
                        const code = codeFromPasted(pasted);
                        setPasteBad(code === null);
                        if (code !== null) go(code);
                    }}
                >
                    <label className="field">
                        <span>
                            <T t={solveHome.pasteLabel} />
                        </span>
                        <div className="answer-row">
                            <input
                                className="answer-input"
                                value={pasted}
                                placeholder={solveHome.pastePlaceholder.en}
                                onChange={(e) => setPasted(e.target.value)}
                            />
                            <button type="submit" disabled={pasted.trim() === ''}>
                                <T t={solveHome.pasteGo} />
                            </button>
                        </div>
                    </label>
                    {pasteBad && (
                        <p className="warn" role="alert">
                            <T t={solveHome.pasteBad} />
                        </p>
                    )}
                </form>
                <p className="muted">
                    <T t={solveHome.or} />
                </p>
                <p>
                    <button onClick={() => fileRef.current?.click()}>
                        <T t={ui.solveOpenFile} />
                    </button>{' '}
                    <span className="muted small">
                        <T t={solveHome.fileHelp} />
                    </span>
                </p>
                <input
                    ref={fileRef}
                    type="file"
                    accept=".json,application/json"
                    hidden
                    onChange={(e) => void onFile(e.target.files?.[0])}
                />
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
                    </div>
                )}
            </section>
        </main>
    );
}

type Loaded = { code: string; result: { ok: true; solve: SolvePuzzle } | { ok: false; errors: Message[] } };

function SharedPuzzle({ code }: { code: string }) {
    const navigate = useNavigate();
    const [loaded, setLoaded] = useState<Loaded | null>(null);

    useEffect(() => {
        let live = true;
        setLoaded(null);
        void decodeSolve(code).then((result) => live && setLoaded({ code, result }));
        return () => {
            live = false;
        };
    }, [code]);

    if (!loaded || loaded.code !== code) {
        return (
            <main className="page-narrow">
                <p className="muted" role="status">
                    <T t={ui.solveLoading} />
                </p>
            </main>
        );
    }
    if (!loaded.result.ok) {
        return (
            <main className="page-narrow">
                <div className="notice error" role="alert">
                    <strong>
                        <T t={ui.solveFailed} />
                    </strong>
                    <p>
                        <T t={ui.solveFailedHelp} />
                    </p>
                    <ul>
                        {loaded.result.errors.map((m, i) => (
                            <li key={i}>
                                <T t={m} />
                            </li>
                        ))}
                    </ul>
                </div>
                <p>
                    <Link className="button-link" to="/solve">
                        <T t={solveHome.title} />
                    </Link>
                </p>
            </main>
        );
    }
    return (
        <SolveView
            key={code}
            solve={loaded.result.solve}
            code={code}
            onOpenCode={(next) => navigate(`/solve#solve=${next}`)}
        />
    );
}

/** /solve: a shared puzzle when the address has a code, else the page to open one. */
export function SolvePage() {
    const { hash } = useLocation();
    const code = codeFromHash(hash);
    useEffect(() => {
        document.title = `${ui.solverTitle.bn} · ${ui.appName.bn}`;
    }, []);
    return code === null ? <SolveHome /> : <SharedPuzzle code={code} />;
}

/** /solve/sample: the built-in sample puzzle. */
export function SamplePage() {
    const navigate = useNavigate();
    return (
        <SolveView
            solve={SAMPLE_PUZZLE}
            code="sample"
            onOpenCode={(next) => navigate(`/solve#solve=${next}`)}
        />
    );
}
