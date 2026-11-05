import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { segment } from '../src/segment.ts';
import { parseWordFile, readWordFile, WORD_FILE_HEADER } from '../src/wordFile.ts';
import { WordIndex } from '../src/wordIndex.ts';

const file = (...lines: string[]) => [WORD_FILE_HEADER, ...lines].join('\n') + '\n';

describe('readWordFile', () => {
    it('reads words with and without a score', () => {
        expect(readWordFile(file('অংশ\t0.56', 'অংশক', 'ক্ষমা\t1'))).toEqual([
            { w: 'অংশ', freq: 0.56 },
            { w: 'অংশক', freq: 0 },
            { w: 'ক্ষমা', freq: 1 },
        ]);
    });

    it('skips blank lines and comments, and accepts Windows line ends', () => {
        const text = [WORD_FILE_HEADER, '', '# a comment', 'কথা\t0.5', '', 'মাথা'].join('\r\n') + '\r\n';
        expect(readWordFile(text)).toEqual([
            { w: 'কথা', freq: 0.5 },
            { w: 'মাথা', freq: 0 },
        ]);
    });

    it('treats a bad score as unknown and keeps a score inside 0 to 1', () => {
        expect(readWordFile(file('কখ\tabc', 'গঘ\t', 'ঙচ\t7', 'ছজ\t-2'))).toEqual([
            { w: 'কখ', freq: 0 },
            { w: 'গঘ', freq: 0 },
            { w: 'ঙচ', freq: 1 },
            { w: 'ছজ', freq: 0 },
        ]);
    });

    it('is not fooled by a page that is not a word file (a missing file on a single-page host)', () => {
        for (const text of ['<!doctype html><html></html>', '', '# something else\nকথা', 'কথা\nমাথা']) {
            expect(() => readWordFile(text)).toThrow();
        }
    });

    it('reads a list with only the header as empty', () => {
        expect(readWordFile(WORD_FILE_HEADER + '\n')).toEqual([]);
    });
});

describe('parseWordFile', () => {
    it('adds the aksharkhop split of every word', () => {
        const [a, b] = parseWordFile(file('ক্ষমা\t0.8', 'উৎসব'));
        expect(a).toEqual({ w: 'ক্ষমা', cells: ['ক্ষ', 'মা'], freq: 0.8 });
        expect(b).toEqual({ w: 'উৎসব', cells: ['উ', 'ৎ', 'স', 'ব'], freq: 0 });
    });

    it('feeds the word index', () => {
        const index = new WordIndex(parseWordFile(file('ক্ষমা\t0.8', 'কথা', 'মাথা\t0.3')));
        expect(index.count).toBe(3);
        expect(index.lengths()).toEqual([2]);
        expect(index.match(['ক্ষ', '']).length).toBe(1);
    });
});

// The real list, public/words.txt, is committed; the big public/words.bn.json is only built locally.
const TXT = new URL('../../../public/words.txt', import.meta.url);
const JSON_FILE = new URL('../../../public/words.bn.json', import.meta.url);

describe.skipIf(!existsSync(TXT))('public/words.txt', () => {
    const text = readFileSync(TXT, 'utf8');
    const rows = readWordFile(text);

    it('is a valid list of about 77,000 distinct, normalized words of 2 or more cells', () => {
        expect(rows.length).toBeGreaterThan(70_000);
        expect(new Set(rows.map((r) => r.w)).size).toBe(rows.length);
        for (const { w, freq } of rows) {
            if (w.normalize('NFC') !== w || segment(w).length < 2 || freq < 0 || freq > 1) {
                throw new Error(`bad row: ${w} ${freq}`);
            }
        }
    });

    it('is small enough to ship (under 3 MB)', () => {
        expect(Buffer.byteLength(text)).toBeLessThan(3_000_000);
    });

    it.skipIf(!existsSync(JSON_FILE))(
        'matches the full list built by the script: same words, scores and aksharkhop splits',
        () => {
            const full = (
                JSON.parse(readFileSync(JSON_FILE, 'utf8')) as {
                    words: { w: string; cells: string[]; freq: number }[];
                }
            ).words;
            expect(rows.length).toBe(full.length);
            full.forEach((e, i) => {
                const r = rows[i]!;
                if (
                    r.w !== e.w ||
                    Math.abs(r.freq - e.freq) > 1e-9 ||
                    segment(r.w).join('|') !== e.cells.join('|')
                ) {
                    throw new Error(`row ${i} differs: ${r.w} ${r.freq} vs ${e.w} ${e.freq}`);
                }
            });
        },
    );
});
