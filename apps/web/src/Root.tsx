// Chooses the page from the address: "#solve=<code>" opens the solver, anything else the editor.
import { codeFromHash, decodeSolve, type Message, type SolvePuzzle } from '@aksharkhop/core';
import { useEffect, useState } from 'react';
import { App } from './App.tsx';
import { ui } from './i18n.ts';
import { SolveView } from './SolveView.tsx';
import { T } from './T.tsx';

function useHash(): string {
    const [hash, setHash] = useState(window.location.hash);
    useEffect(() => {
        const on = () => setHash(window.location.hash);
        window.addEventListener('hashchange', on);
        return () => window.removeEventListener('hashchange', on);
    }, []);
    return hash;
}

type Loaded = { code: string; result: { ok: true; solve: SolvePuzzle } | { ok: false; errors: Message[] } };

function SolveRoute({ code }: { code: string }) {
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
            <div className="app">
                <p className="muted" role="status">
                    <T t={ui.solveLoading} />
                </p>
            </div>
        );
    }
    if (!loaded.result.ok) {
        return (
            <div className="app">
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
                    <a className="button-link" href="#">
                        <T t={ui.solveMake} />
                    </a>
                </p>
            </div>
        );
    }
    return (
        <SolveView
            key={code}
            solve={loaded.result.solve}
            code={code}
            onOpenCode={(next) => {
                window.location.hash = `solve=${next}`;
            }}
        />
    );
}

export function Root() {
    const hash = useHash();
    const code = codeFromHash(hash);
    return code === null ? <App /> : <SolveRoute code={code} />;
}
