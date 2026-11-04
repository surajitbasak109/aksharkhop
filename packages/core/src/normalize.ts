// Text normalisation for Bengali. Matches Pataparbon's Bangla::normalize (NFC).
//
// NFC decomposes the nukta letters ড় ঢ় য় into base + nukta (U+09BC). They are Unicode composition
// exclusions, so NFC can never join them. Do not try to precompose them: Pataparbon stores them decomposed.
//
// ZWJ/ZWNJ (U+200D/U+200C) are kept here, as in Pataparbon. The segmenter strips them from its cells.

export type TextIssueCode = 'latin' | 'ascii_digit' | 'bengali_digit' | 'whitespace';

export interface TextIssue {
    code: TextIssueCode;
    en: string;
    bn: string;
}

/** NFC and trim. Never throws and never drops letters. */
export function normalize(text: string): string {
    return text.normalize('NFC').trim();
}

/**
 * Flags text that does not belong in a crossword answer. It only reports; it never changes the text,
 * so nothing is silently dropped.
 */
export function findTextIssues(text: string): TextIssue[] {
    const issues: TextIssue[] = [];
    const t = text.normalize('NFC');

    if (/[A-Za-z]/.test(t)) {
        issues.push({ code: 'latin', en: 'Contains Latin letters.', bn: 'ইংরেজি অক্ষর আছে।' });
    }
    if (/[0-9]/.test(t)) {
        issues.push({ code: 'ascii_digit', en: 'Contains digits.', bn: 'সংখ্যা আছে।' });
    }
    if (/[০-৯]/.test(t)) {
        issues.push({ code: 'bengali_digit', en: 'Contains Bengali digits.', bn: 'বাংলা সংখ্যা আছে।' });
    }
    if (/\s/.test(t)) {
        issues.push({ code: 'whitespace', en: 'Contains spaces.', bn: 'ফাঁকা জায়গা আছে।' });
    }

    return issues;
}
