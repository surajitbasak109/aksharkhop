// A small sample crossword for the landing page and the solver's "try a sample" button.
// Twelve everyday words on a 5×5 grid. Every word is in the word list, and no clue contains its answer
// (checked by packages/core/test/share.test.ts).
import type { SolvePuzzle } from './share.ts';

export const SAMPLE_PUZZLE: SolvePuzzle = {
    title: 'নমুনা শব্দছক',
    author: 'অক্ষরখোপ',
    rows: 5,
    cols: 5,
    solution: [
        ['ছ', null, 'ম', 'য়', 'না'],
        ['বি', 'মা', 'ন', null, 'ক'],
        [null, 'ঠ', null, 'রা', null],
        ['বা', null, 'বা', 'জা', 'র'],
        ['বা', 'তা', 'স', null, 'ঙ'],
    ],
    clues: {
        across: [
            'কথা শেখানো যায় এমন পাখি',
            'যাত্রী নিয়ে আকাশে ওড়ে যে যান',
            'যেখানে জিনিসপত্র কেনাবেচা হয়',
            'যা ছাড়া নিশ্বাস নেওয়া যায় না; হাওয়া',
        ],
        down: [
            'আঁকা বা ক্যামেরায় তোলা চিত্র',
            'চিন্তা ও অনুভূতির আধার',
            'যা দিয়ে আমরা গন্ধ পাই',
            'খেলাধুলা বা চাষের খোলা জমি',
            'রাজ্যের শাসক',
            'পিতা',
            'অনেক যাত্রী নেওয়ার বড় গাড়ি',
            'লাল, নীল, সবুজ ইত্যাদি',
        ],
    },
};
