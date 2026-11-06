import { describe, expect, it } from 'vitest';
import {
    approveReview,
    buildBatchPrompt,
    CLUE_FILE_HEADER,
    formatClueFile,
    formatReviewTsv,
    parseBatchReply,
    parseReviewTsv,
    readClueFile,
} from '../src/clueBatch.ts';

describe('batch prompt and reply', () => {
    it('lists every word with its meanings', () => {
        const p = buildBatchPrompt([
            { w: 'মাথা', glosses: ['head', 'top'] },
            { w: 'কথা', glosses: ['word'] },
        ]);
        expect(p).toContain('মাথা\thead; top');
        expect(p).toContain('কথা\tword');
    });
    it('reads a reply object, also inside a code block', () => {
        const r = parseBatchReply('```json\n{"মাথা": ["ক", "খ"], "কথা": "no", "x": []}\n```');
        expect(r).toEqual({ মাথা: ['ক', 'খ'], x: [] });
    });
    it('gives {} for bad input', () => {
        expect(parseBatchReply('nothing')).toEqual({});
        expect(parseBatchReply('{oops')).toEqual({});
        expect(parseBatchReply('[1]')).toEqual({});
    });
});

describe('review sheet', () => {
    it('round-trips and ignores the comment and header lines', () => {
        const rows = [
            { word: 'মাথা', clue: 'দেহের উপরিভাগ', decision: 'ok', edited: '' },
            { word: 'কথা', clue: 'বাক্য\tসহ', decision: '', edited: 'বলা শব্দ' },
        ];
        const back = parseReviewTsv(formatReviewTsv(rows));
        expect(back).toEqual([rows[0], { ...rows[1], clue: 'বাক্য সহ' }]);
    });
});

describe('approveReview', () => {
    const row = (clue: string, decision: string, edited = '') => ({ word: 'মাথা', clue, decision, edited });
    it('accepts ok rows and edited rows; edited text wins', () => {
        const { approved } = approveReview([
            row('ক ____', 'ok'),
            row('খ', '', 'গ ঘ'),
            row('ঙ', 'ok', 'চ ছ'),
            row('জ', ''),
        ]);
        expect(approved).toEqual([
            { word: 'মাথা', clue: 'ক ____', how: 'draft' },
            { word: 'মাথা', clue: 'গ ঘ', how: 'edited' },
            { word: 'মাথা', clue: 'চ ছ', how: 'edited' },
        ]);
    });
    it('refuses a clue that gives the word away, and repeats', () => {
        const { approved, refused } = approveReview([
            row('মাথা ঘামানো', 'ok'),
            row('ক', 'ok'),
            row('ক', 'ok'),
        ]);
        expect(refused).toHaveLength(1);
        expect(approved).toHaveLength(1);
    });
});

describe('clue file', () => {
    it('round-trips', () => {
        const text = formatClueFile([
            { word: 'মাথা', clue: 'ক' },
            { word: 'মাথা', clue: 'খ' },
        ]);
        expect(text.startsWith(CLUE_FILE_HEADER)).toBe(true);
        expect(readClueFile(text).get('মাথা')).toEqual(['ক', 'খ']);
    });
    it('refuses a file without the header', () => {
        expect(() => readClueFile('মাথা\tক\n')).toThrow();
    });
});
