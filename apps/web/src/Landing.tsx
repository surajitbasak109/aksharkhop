import { codeFromHash, numberGrid, SAMPLE_PUZZLE, segment, toBengaliDigits } from '@aksharkhop/core';
import { useEffect, type CSSProperties } from 'react';
import { Link, Navigate, useLocation } from 'react-router';
import { show } from './Board.tsx';
import { landing, plain, site, ui } from './i18n.ts';
import './landing.css';
import { T } from './T.tsx';

/** Words shown cut into cells. The split comes from the real splitter, so it is always the app's own. */
const DEMO_WORDS = ['ক্ষমা', 'সূর্য', 'বাংলা', 'উৎসব', 'চাঁদ', 'শ্রাবণ'];

function AksharaDemo() {
    return (
        <ul className="lp-demo" aria-label={plain(landing.whyCaption)}>
            {DEMO_WORDS.map((w) => (
                <li key={w}>
                    <span className="lp-demo-word" lang="bn">
                        {w}
                    </span>
                    <span className="lp-demo-arrow" aria-hidden="true">
                        →
                    </span>
                    <span className="lp-demo-cells" lang="bn">
                        {segment(w).map((cell, i) => (
                            <span className="lp-demo-cell" key={i}>
                                {show(cell)}
                            </span>
                        ))}
                    </span>
                </li>
            ))}
        </ul>
    );
}

/** The sample puzzle, solved, as a picture. It is decoration: the real solver is one click away. */
function MiniBoard() {
    const { solution, rows, cols } = SAMPLE_PUZZLE;
    const { numbers } = numberGrid(solution.map((row) => row.map((c) => c === null)));
    return (
        <div
            className="lp-board"
            style={{ '--rows': rows, '--cols': cols } as CSSProperties}
            role="img"
            aria-label={plain(landing.sampleCaption)}
        >
            {solution.map((row, r) =>
                row.map((cell, c) => (
                    <div key={`${r}:${c}`} className={cell === null ? 'lp-cell lp-block' : 'lp-cell'}>
                        {numbers[r]?.[c] != null && (
                            <span className="lp-num">{toBengaliDigits(numbers[r]![c]!)}</span>
                        )}
                        {cell !== null && <span lang="bn">{show(cell)}</span>}
                    </div>
                )),
            )}
        </div>
    );
}

function Section({
    id,
    title,
    children,
    tone,
}: {
    id: string;
    title: typeof landing.whatTitle;
    children: React.ReactNode;
    tone?: 'soft';
}) {
    return (
        <section
            id={id}
            className={tone === 'soft' ? 'lp-section lp-soft' : 'lp-section'}
            aria-labelledby={`${id}-h`}
        >
            <div className="lp-wrap">
                <h2 id={`${id}-h`}>
                    <T t={title} />
                </h2>
                {children}
            </div>
        </section>
    );
}

export function Landing() {
    const { hash } = useLocation();
    useEffect(() => {
        document.title = plain(site.pageTitleHome);
    }, []);

    // Links made before the solver had its own address ("/#solve=…") still work.
    if (codeFromHash(hash) !== null) return <Navigate to={`/solve${hash}`} replace />;

    return (
        <div className="landing">
            <section className="lp-hero">
                <div className="lp-wrap lp-hero-grid">
                    <div>
                        <p className="lp-eyebrow">
                            <T t={landing.eyebrow} />
                        </p>
                        <h1>
                            <T t={landing.heroTitle} block />
                        </h1>
                        <p className="lp-lead">
                            <T t={landing.heroLead} block />
                        </p>
                        <p className="lp-cta">
                            <Link className="button-link primary lp-btn" to="/editor">
                                <T t={landing.ctaBuild} />
                            </Link>
                            <Link className="button-link lp-btn" to="/solve/sample">
                                <T t={landing.ctaSample} />
                            </Link>
                        </p>
                        <p className="muted small">
                            <T t={landing.heroNote} />
                        </p>
                    </div>
                    <figure className="lp-figure">
                        <MiniBoard />
                        <figcaption className="muted small">
                            <T t={landing.sampleCaption} />
                        </figcaption>
                    </figure>
                </div>
            </section>

            <Section id="what" title={landing.whatTitle}>
                <p className="lp-text">
                    <T t={landing.whatText} block />
                </p>
            </Section>

            <Section id="why" title={landing.whyTitle} tone="soft">
                <div className="lp-two">
                    <p className="lp-text">
                        <T t={landing.whyText} block />
                    </p>
                    <div>
                        <AksharaDemo />
                        <p className="muted small">
                            <T t={landing.whyNote} />
                        </p>
                    </div>
                </div>
            </Section>

            <Section id="features" title={landing.featuresTitle}>
                <ul className="lp-cards">
                    {landing.features.map((f) => (
                        <li key={f.title.en} className="lp-card">
                            <h3>
                                <T t={f.title} />
                            </h3>
                            <p>
                                <T t={f.text} block />
                            </p>
                        </li>
                    ))}
                </ul>
            </Section>

            <Section id="how" title={landing.stepsTitle} tone="soft">
                <ol className="lp-steps">
                    {landing.steps.map((s, i) => (
                        <li key={s.title.en}>
                            <span className="lp-step-n" aria-hidden="true">
                                {toBengaliDigits(i + 1)}
                            </span>
                            <div>
                                <h3>
                                    <T t={s.title} />
                                </h3>
                                <p>
                                    <T t={s.text} block />
                                </p>
                            </div>
                        </li>
                    ))}
                </ol>
            </Section>

            <Section id="who" title={landing.audienceTitle}>
                <ul className="lp-cards lp-cards-wide">
                    {landing.audience.map((a) => (
                        <li key={a.title.en} className="lp-card">
                            <h3>
                                <T t={a.title} />
                            </h3>
                            <p>
                                <T t={a.text} block />
                            </p>
                        </li>
                    ))}
                </ul>
            </Section>

            <Section id="try" title={landing.sampleTitle} tone="soft">
                <div className="lp-two">
                    <div>
                        <p className="lp-text">
                            <T t={landing.sampleText} block />
                        </p>
                        <p className="lp-cta">
                            <Link className="button-link primary lp-btn" to="/solve/sample">
                                <T t={landing.ctaSample} />
                            </Link>
                            <Link className="button-link lp-btn" to="/solve">
                                <T t={site.navSolve} />
                            </Link>
                        </p>
                    </div>
                    <MiniBoard />
                </div>
            </Section>

            <Section id="faq" title={landing.faqTitle}>
                <div className="lp-faq">
                    {landing.faq.map((item) => (
                        <details key={item.q.en}>
                            <summary>
                                <T t={item.q} />
                            </summary>
                            <p>
                                <T t={item.a} block />
                            </p>
                        </details>
                    ))}
                </div>
            </Section>

            <section className="lp-final">
                <div className="lp-wrap">
                    <h2>
                        <T t={landing.finalTitle} />
                    </h2>
                    <p>
                        <T t={landing.finalText} />
                    </p>
                    <p className="lp-cta">
                        <Link className="button-link primary lp-btn" to="/editor">
                            <T t={landing.ctaBuild} />
                        </Link>
                    </p>
                </div>
            </section>

            <footer className="lp-footer">
                <div className="lp-wrap">
                    <nav aria-label="Footer">
                        <Link to="/editor">
                            <T t={site.navBuild} />
                        </Link>
                        <Link to="/solve">
                            <T t={site.navSolve} />
                        </Link>
                        <a href="#faq">
                            <T t={landing.faqTitle} />
                        </a>
                    </nav>
                    <p className="muted small">
                        <T t={landing.footerCredit} />
                    </p>
                    <p className="muted small">
                        {ui.appName.bn} · {ui.appName.en}
                    </p>
                </div>
            </footer>
        </div>
    );
}
