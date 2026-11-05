import type { Text } from './i18n.ts';

/** A UI string in both languages: Bengali first, English after it in smaller type. */
export function T({ t, block = false }: { t: Text; block?: boolean }) {
    return (
        <span className={block ? 't t-block' : 't'}>
            <span className="bn" lang="bn">
                {t.bn}
            </span>{' '}
            <span className="en" lang="en">
                {t.en}
            </span>
        </span>
    );
}
