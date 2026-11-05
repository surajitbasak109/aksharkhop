import { type ExportResult } from '@aksharkhop/core';
import { useEffect, useRef, useState } from 'react';
import { copyText } from './clipboard.ts';
import { fmt, plain, ui } from './i18n.ts';
import { T } from './T.tsx';

interface Props {
    result: ExportResult;
    rows: number;
    cols: number;
    fileName: string;
    onClose: () => void;
}

export function ExportDialog({ result, rows, cols, fileName, onClose }: Props) {
    const ref = useRef<HTMLDialogElement>(null);
    const [copy, setCopy] = useState<'idle' | 'done' | 'failed'>('idle');

    useEffect(() => {
        const d = ref.current;
        if (d && !d.open) d.showModal();
    }, []);

    const download = () => {
        if (!result.ok) return;
        const blob = new Blob([result.json], { type: 'application/json;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    };

    const copyJson = async () => {
        if (!result.ok) return;
        setCopy((await copyText(result.json)) ? 'done' : 'failed');
    };

    return (
        <dialog
            ref={ref}
            className="dialog export-dialog"
            aria-label={plain(result.ok ? ui.exportTitleOk : ui.exportTitleBad)}
            onCancel={(e) => {
                e.preventDefault();
                onClose();
            }}
        >
            <h2>
                <T t={result.ok ? ui.exportTitleOk : ui.exportTitleBad} />
            </h2>

            {result.ok ? (
                <>
                    <p>
                        <T t={ui.exportOkHelp} />
                    </p>
                    <p>
                        <T t={ui.exportFormHelp} /> <strong>{fmt.adminSize(rows, cols).bn}</strong>{' '}
                        <span className="muted">/ {fmt.adminSize(rows, cols).en}</span>
                    </p>
                </>
            ) : (
                <p>
                    <T t={ui.exportBadHelp} />
                </p>
            )}

            {!result.ok && (
                <ul className="errors problem-list" role="alert">
                    {result.errors.map((m, i) => (
                        <li key={i}>
                            <T t={m} />
                        </li>
                    ))}
                </ul>
            )}

            {result.warnings.length > 0 && (
                <>
                    <h3>
                        <T t={ui.exportWarnings} />
                    </h3>
                    <ul className="problem-list">
                        {result.warnings.map((m, i) => (
                            <li key={i}>
                                <T t={m} />
                            </li>
                        ))}
                    </ul>
                </>
            )}

            {result.ok && (
                <details className="json-preview">
                    <summary>
                        <T t={ui.showJson} />
                    </summary>
                    <pre lang="bn">{result.json}</pre>
                </details>
            )}

            <div className="dialog-actions">
                {copy === 'done' && (
                    <span className="good" role="status">
                        <T t={ui.copied} />
                    </span>
                )}
                {copy === 'failed' && (
                    <span className="warn" role="status">
                        <T t={ui.copyFailed} />
                    </span>
                )}
                {result.ok && (
                    <>
                        <button type="button" onClick={() => void copyJson()}>
                            <T t={ui.copyJson} />
                        </button>
                        <button type="button" className="primary" onClick={download}>
                            <T t={ui.download} />
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
