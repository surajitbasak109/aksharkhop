import { describe, expect, it } from 'vitest';
import { WordIndex } from '../src/wordIndex.ts';
import { entry } from './helpers.ts';

const words = [
    entry('cat', 0.9),
    entry('car', 0.5),
    entry('cab', 0),
    entry('dog', 0.8),
    entry('door', 0.7),
    entry('doll', 0),
    entry('at', 0.4),
];
const index = new WordIndex(words);
const found = (ids: Int32Array) => Array.from(ids, (id) => index.word(id));

describe('WordIndex', () => {
    it('knows its words, lengths and ids', () => {
        expect(index.count).toBe(7);
        expect(index.lengths()).toEqual([2, 3, 4]);
        expect(index.has('cat')).toBe(true);
        expect(index.has('cow')).toBe(false);
        expect(index.word(index.idOf('dog'))).toBe('dog');
        expect(index.idOf('cow')).toBe(-1);
        expect(index.cellsOf(index.idOf('door'))).toEqual(['d', 'o', 'o', 'r']);
        expect(index.length(index.idOf('door'))).toBe(4);
        expect(index.freq(index.idOf('cat'))).toBe(0.9);
    });

    it('lists the words of one length in ascending id order', () => {
        expect(found(index.idsOfLength(3))).toEqual(['cat', 'car', 'cab', 'dog']);
        expect(index.idsOfLength(9)).toHaveLength(0);
    });

    it('answers a pattern by position and akshara', () => {
        expect(found(index.match(['c', '', '']))).toEqual(['cat', 'car', 'cab']);
        expect(found(index.match(['', 'a', 'r']))).toEqual(['car']);
        expect(found(index.match(['', '', '']))).toEqual(['cat', 'car', 'cab', 'dog']);
        expect(found(index.match(['c', null, 't']))).toEqual(['cat']);
        expect(found(index.match(['d', 'o', '', '']))).toEqual(['door', 'doll']);
        expect(found(index.match(['d', 'o', 'g']))).toEqual(['dog']);
    });

    it('matches nothing for an akshara no word has, or a length no word has', () => {
        expect(index.match(['z', '', ''])).toHaveLength(0);
        expect(index.match(['', '', '', '', ''])).toHaveLength(0);
        // a new akshara is remembered but still matches nothing
        const n = index.symbolCount();
        expect(index.match(['ক্ষ', '', ''])).toHaveLength(0);
        expect(index.symbolCount()).toBe(n + 1);
    });

    it('keeps the postings sorted so patterns come back sorted', () => {
        const ids = Array.from(index.match(['', 'o', '']));
        expect(ids).toEqual([...ids].sort((a, b) => a - b));
    });

    it('filters by frequency and by blocklist', () => {
        expect(found(index.match(['c', '', ''], index.allowed({ minFreq: 0.5 })))).toEqual(['cat', 'car']);
        expect(found(index.match(['c', '', ''], index.allowed({ minFreq: 0.95 })))).toEqual([]);
        expect(found(index.match(['c', '', ''], index.allowed({ blocked: new Set(['car']) })))).toEqual([
            'cat',
            'cab',
        ]);
        // 0 keeps unranked words too
        expect(found(index.match(['c', '', ''], index.allowed({ minFreq: 0 })))).toContain('cab');
    });

    it('counts the allowed words by length', () => {
        const all = index.countAllowed(index.allowed());
        expect(all.total).toBe(7);
        expect(Array.from(all.byLength)).toEqual([
            [3, 4],
            [4, 2],
            [2, 1],
        ]);
        expect(index.countAllowed(index.allowed({ minFreq: 0.5 })).total).toBe(4);
    });

    it('ignores a blocked word that is not in the list', () => {
        expect(index.countAllowed(index.allowed({ blocked: new Set(['zzz']) })).total).toBe(7);
    });
});
