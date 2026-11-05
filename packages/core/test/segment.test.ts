import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { normalize } from '../src/normalize.ts';
import { aksharaLength, isSingleAkshara, segment } from '../src/segment.ts';

const dataDir = new URL('../../../data/', import.meta.url);
const stripZw = (s: string) => s.replace(/[‌‍]/g, '');

describe("Pataparbon's own test cases (data/test/akshara.json)", () => {
    const cases: { input: string; expected: string[] }[] = JSON.parse(
        readFileSync(new URL('test/akshara.json', dataDir), 'utf8'),
    );

    it.each(cases.map((c) => [c.input, c.expected] as const))('splits %j', (input, expected) => {
        expect(segment(input)).toEqual(expected);
    });
});

describe('data/test/segmentation.tsv', () => {
    const rows = readFileSync(new URL('test/segmentation.tsv', dataDir), 'utf8')
        .split('\n')
        .filter((l) => l.trim() !== '' && !l.startsWith('#'))
        .map((l) => l.split('\t') as [string, string]);

    it('has between 300 and 500 words', () => {
        expect(rows.length).toBeGreaterThanOrEqual(300);
        expect(rows.length).toBeLessThanOrEqual(500);
    });

    it('has no duplicate words', () => {
        const words = rows.map(([w]) => w);
        expect(new Set(words).size).toBe(words.length);
    });

    it.each(rows.map(([w, e]) => [w, e] as const))('splits %s as %s', (word, expected) => {
        expect(segment(word).join('|')).toBe(expected.normalize('NFC'));
    });
});

describe('segment', () => {
    it('returns no cells for empty input', () => {
        expect(segment('')).toEqual([]);
    });

    it('does not throw on odd input and keeps every non-ZW character', () => {
        for (const text of ['্', 'ক্', '্ক', 'ঁ', 'ab 12', '😀', '‍', 'ক়়']) {
            expect(() => segment(text)).not.toThrow();
            expect(segment(text).join('')).toBe(stripZw(text.normalize('NFC')));
        }
    });

    it('removes ZWJ and ZWNJ from cells', () => {
        expect(segment('ক্‍ষ').join('')).not.toMatch(/[‌‍]/);
        expect(segment('বাক্‌')).toEqual(['বা', 'ক্']);
    });

    it('splits the same text the same way when given decomposed or precomposed nukta letters', () => {
        expect(segment('নয়ন')).toEqual(segment('নয়ন'));
    });

    it('counts and checks single aksharas', () => {
        expect(aksharaLength('ক্ষমা')).toBe(2);
        expect(isSingleAkshara('ক্ষ')).toBe(true);
        expect(isSingleAkshara('শ্রী')).toBe(true);
        expect(isSingleAkshara('চাঁ')).toBe(true);
        expect(isSingleAkshara('সং')).toBe(false); // স + ং are two cells now
        expect(isSingleAkshara('ক্ষমা')).toBe(false);
        expect(isSingleAkshara('')).toBe(false);
    });

    it('puts ং and ঃ in cells of their own, but keeps ঁ with its letter', () => {
        expect(segment('অংশ')).toEqual(['অ', 'ং', 'শ']);
        expect(segment('দুঃখ')).toEqual(['দু', 'ঃ', 'খ']);
        expect(segment('চাঁদ')).toEqual(['চাঁ', 'দ']);
        expect(segment('ইঁদুর')).toEqual(['ইঁ', 'দু', 'র']);
        expect(segment('ং')).toEqual(['ং']);
        expect(isSingleAkshara('ং')).toBe(true);
        expect(isSingleAkshara('সং')).toBe(false);
    });

    it('treats ৎ as its own cell, as Pataparbon does', () => {
        expect(segment('উৎসব')).toEqual(['উ', 'ৎ', 'স', 'ব']);
    });
});

// Needs the raw data, which is not committed. Skipped when data/raw/ is absent.
const wordFile = new URL('raw/kawshikbuet17-bengali-words/train.csv', dataDir);
describe.skipIf(!existsSync(wordFile))('property: every word in the shipped list', () => {
    const words = existsSync(wordFile)
        ? readFileSync(wordFile, 'utf8')
              .split('\n')
              .slice(1)
              .filter((w) => w.trim() !== '')
        : [];

    it('joins back to the normalised word (ZWJ/ZWNJ excluded)', () => {
        expect(words.length).toBeGreaterThan(70000);
        const bad = words.filter((w) => segment(w).join('') !== stripZw(normalize(w)));
        expect(bad.slice(0, 10)).toEqual([]);
    });

    it('never produces an empty cell', () => {
        const bad = words.filter((w) => segment(w).some((c) => c === ''));
        expect(bad.slice(0, 10)).toEqual([]);
    });
});
