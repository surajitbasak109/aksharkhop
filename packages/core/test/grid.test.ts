import { describe, expect, it } from 'vitest';
import {
    cellLetter,
    checkAnswer,
    clearCell,
    conflicts,
    createGrid,
    getCell,
    gridStats,
    isBlock,
    isSymmetric,
    numbering,
    placeAnswer,
    previewAnswer,
    setBlock,
    slotAt,
    slotLetters,
    slots,
    toBengaliDigits,
    toggleBlock,
    type Grid,
} from '../src/grid.ts';

/** Builds a grid from strings: '#' block, '.' empty. */
function fromPattern(rows: string[]): Grid {
    let g = createGrid(rows.length, rows[0]!.length);
    rows.forEach((row, r) =>
        row.split('').forEach((ch, c) => {
            if (ch === '#') g = setBlock(g, r, c, true, false);
        }),
    );
    return g;
}

function place(g: Grid, r: number, c: number, dir: 'across' | 'down', word: string): Grid {
    const slot = slotAt(g, r, c, dir);
    if (!slot) throw new Error('no slot');
    const check = checkAnswer(word, slot.len);
    if (!check.ok) throw new Error(check.errors.map((e) => e.en).join(' '));
    return placeAnswer(g, slot, check.cells);
}

describe('createGrid', () => {
    it('defaults to 6×6, all white and empty', () => {
        const g = createGrid();
        expect([g.rows, g.cols]).toEqual([6, 6]);
        expect(gridStats(g)).toEqual({ white: 36, filled: 0, blocks: 0, conflicts: 0 });
    });

    it('allows different rows and columns within 5–15', () => {
        expect(createGrid(5, 15).cells[0]!.length).toBe(15);
        expect(createGrid(15, 5).cells.length).toBe(15);
    });

    it.each([
        [4, 9],
        [9, 16],
        [0, 0],
        [9.5, 9],
    ])('rejects %i×%i', (r, c) => {
        expect(() => createGrid(r, c)).toThrow(RangeError);
    });
});

describe('blocks and symmetry', () => {
    it('toggles one cell without symmetry', () => {
        const g = toggleBlock(createGrid(5, 5), 0, 1, false);
        expect(isBlock(g, 0, 1)).toBe(true);
        expect(isBlock(g, 4, 3)).toBe(false);
        expect(isSymmetric(g)).toBe(false);
        expect(isBlock(toggleBlock(g, 0, 1, false), 0, 1)).toBe(false);
    });

    it('mirrors the toggle under 180° rotation', () => {
        let g = toggleBlock(createGrid(5, 7), 0, 1, true);
        expect(isBlock(g, 0, 1)).toBe(true);
        expect(isBlock(g, 4, 5)).toBe(true);
        expect(isSymmetric(g)).toBe(true);
        g = toggleBlock(g, 4, 5, true);
        expect(isBlock(g, 0, 1) || isBlock(g, 4, 5)).toBe(false);
    });

    it('toggles the centre cell once on an odd grid', () => {
        const g = toggleBlock(createGrid(5, 5), 2, 2, true);
        expect(isBlock(g, 2, 2)).toBe(true);
        expect(gridStats(g).blocks).toBe(1);
    });

    it('sets the mirror to the same state, not the opposite', () => {
        let g = setBlock(createGrid(5, 5), 4, 4, true, false);
        g = toggleBlock(g, 0, 0, true);
        expect(isBlock(g, 0, 0)).toBe(true);
        expect(isBlock(g, 4, 4)).toBe(true);
    });

    it('a new block loses its letters; a cell that turns white is empty', () => {
        let g = place(createGrid(5, 5), 0, 0, 'across', 'কমলালেবু');
        g = toggleBlock(g, 0, 2, false);
        expect(getCell(g, 0, 2)).toBeNull();
        g = toggleBlock(g, 0, 2, false);
        expect(getCell(g, 0, 2)).toEqual({ a: '', d: '' });
        expect(cellLetter(getCell(g, 0, 1))).toBe('ম');
    });

    it('ignores out-of-range cells', () => {
        const g = createGrid(5, 5);
        expect(toggleBlock(g, 5, 0, true)).toBe(g);
    });

    it('does not mutate the input', () => {
        const g = createGrid(5, 5);
        const before = JSON.stringify(g);
        toggleBlock(g, 1, 1, true);
        place(g, 0, 0, 'across', 'কমলালেবু');
        expect(JSON.stringify(g)).toBe(before);
    });
});

describe('slots', () => {
    const g = fromPattern(['...##', '.....', '..#..', '.....', '##...']);

    it('matches the numbering', () => {
        expect(slots(g).across.map((s) => s.n)).toEqual(numbering(g).across.map((e) => e.n));
        expect(slots(g).down.every((s) => s.dir === 'down')).toBe(true);
    });

    it('finds the slot through any of its cells', () => {
        expect(slotAt(g, 1, 3, 'across')).toMatchObject({ n: 4, r: 1, c: 0, len: 5 });
        expect(slotAt(g, 3, 1, 'down')).toMatchObject({ n: 2, r: 0, c: 1, len: 4 });
    });

    it('returns null for blocks and one-cell runs', () => {
        expect(slotAt(g, 0, 3, 'across')).toBeNull();
        expect(slotAt(createGrid(5, 5), 0, 0, 'across')).not.toBeNull();
        const single = fromPattern(['.#...', '.....', '.....', '.....', '.....']);
        expect(slotAt(single, 0, 0, 'across')).toBeNull();
    });
});

describe('checkAnswer', () => {
    it('splits into aksharas and checks the length', () => {
        expect(checkAnswer('ক্ষমা', 2)).toEqual({ ok: true, cells: ['ক্ষ', 'মা'] });
        expect(checkAnswer(' দুঃখ ', 3)).toEqual({ ok: true, cells: ['দু', 'ঃ', 'খ'] });
        const short = checkAnswer('ক্ষমা', 3);
        expect(short.ok).toBe(false);
        expect(!short.ok && short.errors.map((e) => e.code)).toEqual(['length']);
    });

    it('accepts an empty answer (clears the slot)', () => {
        expect(checkAnswer('  ', 5)).toEqual({ ok: true, cells: [] });
    });

    it('keeps nukta letters decomposed', () => {
        const check = checkAnswer('বাড়ি', 2);
        expect(check.ok).toBe(true);
        expect(check.cells[1]).toBe('ড়ি');
    });

    it.each([
        ['abc', 'latin'],
        ['ক১', 'bengali_digit'],
        ['ক খ', 'whitespace'],
        ['ক!', 'not_bengali'],
        ['িক', 'stray_mark'],
    ])('rejects %j (%s)', (text, code) => {
        const check = checkAnswer(text, 2);
        expect(check.ok).toBe(false);
        expect(!check.ok && check.errors.map((e) => e.code)).toContain(code);
    });

    it('gives every error in both languages', () => {
        const check = checkAnswer('ab', 5);
        expect(!check.ok && check.errors.every((e) => e.en !== '' && e.bn !== '')).toBe(true);
    });
});

describe('placeAnswer and conflicts', () => {
    // 5x5 open grid; across 1 at row 0 and down 1 at column 0 cross at (0,0).
    const open = createGrid(5, 5);

    it('fills the slot cells with the segmented answer', () => {
        const g = place(open, 0, 3, 'across', 'কমলালেবু');
        expect(slotLetters(g, slotAt(g, 0, 0, 'across')!)).toEqual(['ক', 'ম', 'লা', 'লে', 'বু']);
        expect(gridStats(g).filled).toBe(5);
    });

    it('crossing words that agree are not a conflict', () => {
        let g = place(open, 0, 0, 'across', 'কমলালেবু');
        g = place(g, 0, 0, 'down', 'কলকাতার');
        expect(conflicts(g)).toEqual([]);
    });

    it('crossing words that disagree are a conflict, with both letters kept', () => {
        let g = place(open, 0, 0, 'across', 'কমলালেবু');
        g = place(g, 0, 0, 'down', 'পরিবারের');
        expect(conflicts(g)).toEqual([{ r: 0, c: 0, across: 'ক', down: 'প' }]);
        expect(cellLetter(getCell(g, 0, 0))).toBe('ক');
        expect(gridStats(g).conflicts).toBe(1);
    });

    it('retyping your own word replaces it without a conflict', () => {
        let g = place(open, 0, 0, 'across', 'কমলালেবু');
        g = place(g, 0, 0, 'across', 'পরিবারের');
        expect(conflicts(g)).toEqual([]);
        expect(cellLetter(getCell(g, 0, 0))).toBe('প');
    });

    it('fixing one side resolves the conflict', () => {
        let g = place(open, 0, 0, 'across', 'কমলালেবু');
        g = place(g, 0, 0, 'down', 'পরিবারের');
        g = place(g, 0, 0, 'down', 'কলকাতার');
        expect(conflicts(g)).toEqual([]);
    });

    it('clearing a slot removes only its own letters', () => {
        let g = place(open, 0, 0, 'across', 'কমলালেবু');
        g = place(g, 0, 0, 'down', 'কলকাতার');
        g = placeAnswer(g, slotAt(g, 0, 0, 'across')!, []);
        expect(cellLetter(getCell(g, 0, 0))).toBe('ক');
        expect(cellLetter(getCell(g, 0, 1))).toBe('');
    });

    it('clearCell clears both letters', () => {
        let g = place(open, 0, 0, 'across', 'কমলালেবু');
        g = place(g, 0, 0, 'down', 'পরিবারের');
        g = clearCell(g, 0, 0);
        expect(getCell(g, 0, 0)).toEqual({ a: '', d: '' });
        expect(clearCell(g, 0, 0)).toBe(g);
    });

    it('rejects an answer of the wrong length', () => {
        expect(() => placeAnswer(open, slotAt(open, 0, 0, 'across')!, ['ক'])).toThrow(RangeError);
    });

    it('previews what typing would change', () => {
        let g = place(open, 0, 0, 'down', 'কলকাতার');
        g = place(g, 0, 1, 'down', 'মহাভারত');
        const slot = slotAt(g, 0, 0, 'across')!;
        expect(previewAnswer(g, slot, ['ক', 'খ', 'লা', 'লে', ''])).toEqual([
            'same',
            'conflict',
            'new',
            'new',
            'empty',
        ]);
    });
});

describe('toBengaliDigits', () => {
    it('converts digits', () => {
        expect(toBengaliDigits(1234567890)).toBe('১২৩৪৫৬৭৮৯০');
    });
});

describe('new puzzle sizes', () => {
    it('offers 5 to 10 for a new puzzle but still opens up to 15', async () => {
        const { isValidNewSize, isValidSize, MAX_NEW_SIZE } = await import('../src/grid.ts');
        expect(MAX_NEW_SIZE).toBe(10);
        expect(isValidNewSize(10)).toBe(true);
        expect(isValidNewSize(11)).toBe(false);
        expect(isValidNewSize(4)).toBe(false);
        expect(isValidSize(15)).toBe(true);
    });
});
