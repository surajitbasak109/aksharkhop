import { describe, expect, it } from 'vitest';
import { findTextIssues, normalize } from '../src/normalize.ts';

describe('normalize', () => {
    it('applies NFC and trims', () => {
        expect(normalize('  ক্ষমা ')).toBe('ক্ষমা');
    });

    it('keeps the nukta letters decomposed (base + U+09BC), as Pataparbon does', () => {
        // precomposed য় U+09DF, ড় U+09DC, ঢ় U+09DD come out as base + nukta
        expect(normalize('য়')).toBe('য়');
        expect(normalize('ড়')).toBe('ড়');
        expect(normalize('ঢ়')).toBe('ঢ়');
        expect(normalize('য়')).toBe('য়');
    });

    it('keeps ZWJ and ZWNJ (the segmenter strips them from cells)', () => {
        expect(normalize('বাক্‌')).toBe('বাক্‌');
        expect(normalize('ক্‍ষ')).toBe('ক্‍ষ');
    });

    it('does not change the same text twice', () => {
        const once = normalize('নয়ন য়');
        expect(normalize(once)).toBe(once);
    });

    it('returns an empty string for empty input', () => {
        expect(normalize('')).toBe('');
        expect(normalize('   ')).toBe('');
    });
});

describe('findTextIssues', () => {
    it('reports nothing for a clean word', () => {
        expect(findTextIssues('ক্ষমা')).toEqual([]);
    });

    it.each([
        ['kমা', 'latin'],
        ['ক1', 'ascii_digit'],
        ['ক১', 'bengali_digit'],
        ['ক মা', 'whitespace'],
    ])('flags %s as %s', (text, code) => {
        expect(findTextIssues(text).map((i) => i.code)).toEqual([code]);
    });

    it('gives each issue in Bengali and English', () => {
        const [issue] = findTextIssues('abc');
        expect(issue?.en).not.toBe('');
        expect(issue?.bn).not.toBe('');
    });

    it('never changes the text it checks', () => {
        const text = 'ক1';
        findTextIssues(text);
        expect(text).toBe('ক1');
    });
});
