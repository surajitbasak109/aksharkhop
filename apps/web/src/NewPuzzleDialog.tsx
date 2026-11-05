import { DEFAULT_SIZE, MAX_SIZE, MIN_SIZE, SIZE_PRESETS, isValidSize } from '@aksharkhop/core';
import { useEffect, useRef, useState } from 'react';
import { fmt, plain, ui } from './i18n.ts';
import { T } from './T.tsx';

interface Props {
    rows: number;
    cols: number;
    onCreate: (rows: number, cols: number) => void;
    onCancel: () => void;
}

export function NewPuzzleDialog({
    rows: r0 = DEFAULT_SIZE,
    cols: c0 = DEFAULT_SIZE,
    onCreate,
    onCancel,
}: Props) {
    const [rows, setRows] = useState(String(r0));
    const [cols, setCols] = useState(String(c0));
    const ref = useRef<HTMLDialogElement>(null);

    useEffect(() => {
        const d = ref.current;
        if (d && !d.open) d.showModal();
    }, []);

    const nr = Number(rows);
    const nc = Number(cols);
    const ok = isValidSize(nr) && isValidSize(nc);

    return (
        <dialog
            ref={ref}
            className="dialog"
            aria-label={plain(ui.newTitle)}
            onCancel={(e) => {
                e.preventDefault();
                onCancel();
            }}
        >
            <form
                method="dialog"
                onSubmit={(e) => {
                    e.preventDefault();
                    if (ok) onCreate(nr, nc);
                }}
            >
                <h2>
                    <T t={ui.newTitle} />
                </h2>
                <div className="presets">
                    {SIZE_PRESETS.map((n) => (
                        <button type="button" key={n} onClick={() => onCreate(n, n)}>
                            <T t={fmt.size(n, n)} />
                        </button>
                    ))}
                </div>
                <fieldset>
                    <legend>
                        <T t={ui.custom} /> <span className="muted small">({plain(ui.sizeHint)})</span>
                    </legend>
                    <label>
                        <T t={ui.rows} />
                        <input
                            type="number"
                            min={MIN_SIZE}
                            max={MAX_SIZE}
                            value={rows}
                            onChange={(e) => setRows(e.target.value)}
                        />
                    </label>
                    <label>
                        <T t={ui.cols} />
                        <input
                            type="number"
                            min={MIN_SIZE}
                            max={MAX_SIZE}
                            value={cols}
                            onChange={(e) => setCols(e.target.value)}
                        />
                    </label>
                </fieldset>
                <div className="dialog-actions">
                    <button type="button" onClick={onCancel}>
                        <T t={ui.cancel} />
                    </button>
                    <button type="submit" className="primary" disabled={!ok}>
                        <T t={ui.create} />
                    </button>
                </div>
            </form>
        </dialog>
    );
}
