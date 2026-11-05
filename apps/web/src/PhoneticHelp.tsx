import { PHONETIC_TABLE } from '@aksharkhop/core';
import { ui, type Text } from './i18n.ts';
import { T } from './T.tsx';

const groups: { title: Text; kind: string[] }[] = [
    { title: ui.phoneticVowels, kind: ['vowel'] },
    { title: ui.phoneticConsonants, kind: ['consonant'] },
    { title: ui.phoneticMarks, kind: ['mark', 'hasanta', 'separator'] },
];

/** The phonetic table, built from the converter's own rules so the two never disagree. */
export function PhoneticHelp() {
    const entries = Object.entries(PHONETIC_TABLE);
    return (
        <details className="phonetic-help">
            <summary>
                <T t={ui.phoneticHelp} />
            </summary>
            <ul className="rules">
                {ui.phoneticRules.map((rule) => (
                    <li key={rule.en}>
                        <T t={rule} />
                    </li>
                ))}
            </ul>
            {groups.map((g) => (
                <div key={g.title.en}>
                    <h3>
                        <T t={g.title} />
                    </h3>
                    <dl className="keymap">
                        {entries
                            .filter(([, rule]) => g.kind.includes(rule.kind))
                            .map(([key, rule]) => (
                                <div key={key}>
                                    <dt>
                                        <code>{key}</code>
                                    </dt>
                                    <dd lang="bn">
                                        {rule.kind === 'separator'
                                            ? '—'
                                            : rule.kind === 'vowel' && rule.sign
                                              ? `${rule.text} \u00A0${rule.sign}`
                                              : rule.text}
                                    </dd>
                                </div>
                            ))}
                    </dl>
                </div>
            ))}
        </details>
    );
}
