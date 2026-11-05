// Bengali akshara splitter. Keep identical to pataparbon resources/js/lib/akshara.js
// (which must stay identical to app/Support/Akshara.php).
// Do not rely on Intl.Segmenter: older ICU versions split conjuncts differently.
// ং ঃ (and ৎ) are not part of the letter before them: each one is a cell of its own. ঁ stays with its letter.
// Do not "improve" the regex here. A fix has to be made in Pataparbon first, then ported.

const C = '[\\u0995-\\u09A8\\u09AA-\\u09B0\\u09B2\\u09B6-\\u09B9\\u09DC\\u09DD\\u09DF\\u09F0\\u09F1]';
const N = '\\u09BC';
const H = '\\u09CD';
const J = '[\\u200C\\u200D]';
const V = '[\\u09BE-\\u09C4\\u09C7\\u09C8\\u09CB\\u09CC\\u09D7\\u09E2\\u09E3]';
const M = '\\u0981';
const IV = '[\\u0985-\\u098C\\u098F\\u0990\\u0993\\u0994\\u09E0\\u09E1]';

const source =
    `${C}${N}?(?:${H}${J}?${C}${N}?)*(?:${V}|${H}(?!${J}?${C})${J}?)?${M}*` + `|${IV}${M}*|[\\s\\S]`;

/** Splits text into aksharas (one crossword cell each). Never throws. ZWJ/ZWNJ are removed from the cells. */
export function segment(text: string): string[] {
    const s = String(text ?? '').normalize('NFC');
    if (s === '') return [];

    const parts = s.match(new RegExp(source, 'gu')) ?? [];

    return parts.map((p) => p.replace(/[‌‍]/g, '')).filter((p) => p !== '');
}

export function aksharaLength(text: string): number {
    return segment(text).length;
}

/** True when the text is exactly one akshara: what a white cell must hold. */
export function isSingleAkshara(text: string): boolean {
    return aksharaLength(text) === 1;
}
