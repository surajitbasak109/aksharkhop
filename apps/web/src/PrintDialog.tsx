import { useEffect, useRef } from 'react';
import { plain, ui } from './i18n.ts';
import type { PrintLayout } from './PrintSheet.tsx';
import { T } from './T.tsx';

const LAYOUTS: { id: PrintLayout; label: typeof ui.layoutPuzzle }[] = [
    { id: 'puzzle', label: ui.layoutPuzzle },
    { id: 'key', label: ui.layoutKey },
    { id: 'both', label: ui.layoutBoth },
];

interface Props {
    layout: PrintLayout;
    onLayout: (layout: PrintLayout) => void;
    onPrint: () => void;
    onClose: () => void;
}

export function PrintDialog({ layout, onLayout, onPrint, onClose }: Props) {
    const ref = useRef<HTMLDialogElement>(null);

    useEffect(() => {
        const d = ref.current;
        if (d && !d.open) d.showModal();
    }, []);

    return (
        <dialog
            ref={ref}
            className="dialog"
            aria-label={plain(ui.printTitle)}
            onCancel={(e) => {
                e.preventDefault();
                onClose();
            }}
        >
            <form
                method="dialog"
                onSubmit={(e) => {
                    e.preventDefault();
                    onPrint();
                }}
            >
                <h2>
                    <T t={ui.printTitle} />
                </h2>
                <fieldset className="layouts">
                    {LAYOUTS.map((l) => (
                        <label key={l.id} className="check">
                            <input
                                type="radio"
                                name="layout"
                                checked={layout === l.id}
                                onChange={() => onLayout(l.id)}
                            />
                            <T t={l.label} />
                        </label>
                    ))}
                </fieldset>
                <p className="muted small">
                    <T t={ui.printHelp} />
                </p>
                <div className="dialog-actions">
                    <button type="button" onClick={onClose}>
                        <T t={ui.cancel} />
                    </button>
                    <button type="submit" className="primary">
                        <T t={ui.printNow} />
                    </button>
                </div>
            </form>
        </dialog>
    );
}
