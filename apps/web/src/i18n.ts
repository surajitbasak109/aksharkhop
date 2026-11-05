// Every UI string, Bengali first and English second. Add new strings here only.
import { toBengaliDigits } from '@aksharkhop/core';

export interface Text {
    bn: string;
    en: string;
}

const bnN = toBengaliDigits;

export const ui = {
    appName: { bn: 'অক্ষরখোপ', en: 'Aksharkhop' },
    tagline: { bn: 'বাংলা শব্দছক তৈরি', en: 'Bengali crossword builder' },

    newPuzzle: { bn: 'নতুন', en: 'New' },
    newTitle: { bn: 'নতুন শব্দছক', en: 'New crossword' },
    rows: { bn: 'সারি', en: 'Rows' },
    cols: { bn: 'কলাম', en: 'Columns' },
    custom: { bn: 'নিজের মাপ', en: 'Custom' },
    create: { bn: 'তৈরি করুন', en: 'Create' },
    cancel: { bn: 'বাতিল', en: 'Cancel' },
    sizeHint: { bn: '৫ থেকে ১৫', en: '5 to 15' },
    replaceConfirm: {
        bn: 'এখনকার শব্দছকটি মুছে যাবে, ফেরানো যাবে না। আগে সংরক্ষণ করে নিন। চালিয়ে যাবেন?',
        en: 'This replaces the current crossword and cannot be undone. Save it first. Continue?',
    },

    importFile: { bn: 'খুলুন', en: 'Open' },
    exportFile: { bn: 'সংরক্ষণ', en: 'Save' },
    importFailed: { bn: 'ফাইলটি খোলা গেল না', en: 'Could not open the file' },
    imported: { bn: 'ফাইল খোলা হয়েছে', en: 'File opened' },
    undo: { bn: 'পূর্বাবস্থা', en: 'Undo' },
    redo: { bn: 'পুনরায়', en: 'Redo' },
    symmetry: { bn: '১৮০° প্রতিসাম্য', en: '180° symmetry' },
    notSymmetric: { bn: 'কালো ঘরগুলো প্রতিসম নয়', en: 'Blocks are not symmetric' },

    title: { bn: 'শিরোনাম', en: 'Title' },
    author: { bn: 'নির্মাতা', en: 'Author' },

    modeLetters: { bn: 'অক্ষর', en: 'Letters' },
    modeBlocks: { bn: 'কালো ঘর', en: 'Blocks' },
    modeLabel: { bn: 'ক্লিক করলে', en: 'Click to' },

    across: { bn: 'পাশাপাশি', en: 'Across' },
    down: { bn: 'উপর-নিচ', en: 'Down' },
    noSlot: { bn: 'এই ঘরে এই দিকে কোনো শব্দ নেই', en: 'No word runs through this cell in this direction' },
    blockSelected: { bn: 'কালো ঘর বাছা হয়েছে', en: 'A block is selected' },
    answerPlaceholder: { bn: 'পুরো শব্দ লিখে Enter চাপুন', en: 'Type the whole word, press Enter' },
    place: { bn: 'বসান', en: 'Place' },
    clearSlot: { bn: 'মুছুন', en: 'Clear' },
    inList: { bn: 'শব্দতালিকায় আছে', en: 'In the word list' },
    notInList: { bn: 'শব্দতালিকায় নেই', en: 'Not in the word list' },
    listLoading: { bn: 'শব্দতালিকা আসছে…', en: 'Loading word list…' },
    listMissing: { bn: 'শব্দতালিকা পাওয়া যায়নি', en: 'Word list not found' },
    willConflict: { bn: 'আড়াআড়ি শব্দের সঙ্গে মিলবে না', en: 'Clashes with a crossing word' },

    phonetic: { bn: 'ইংরেজি হরফে বাংলা লেখা (ফোনেটিক)', en: 'Phonetic typing (Latin → Bengali)' },
    phoneticHelp: { bn: 'ফোনেটিক নিয়ম', en: 'Phonetic keys' },
    phoneticRules: [
        {
            bn: 'ব্যঞ্জনের পরে স্বর লিখলে কার-চিহ্ন হয়: ka = কা। শুরুতে বা স্বরের পরে পুরো স্বর: a = আ।',
            en: 'A vowel after a consonant becomes its sign: ka = কা. At the start or after a vowel: a = আ.',
        },
        {
            bn: 'পাশাপাশি দুটি ব্যঞ্জন যুক্তাক্ষর হয়: kSh = ক্ষ, kormo = কর্ম। আলাদা রাখতে মাঝে o লিখুন: amora = আমরা।',
            en: 'Two consonants in a row join: kSh = ক্ষ, kormo = কর্ম. Put o between them to keep them apart: amora = আমরা.',
        },
        {
            bn: 'বড় ও ছোট হাতের অক্ষর আলাদা: t = ত, T = ট। ,, = হসন্ত (্), ` = শুধু বিভাজন।',
            en: 'Case matters: t = ত, T = ট. ,, = hasanta (্), ` = separator only.',
        },
        {
            bn: 'বাংলা কিবোর্ডে বা পেস্ট করে লেখা বাংলা যেমন আছে তেমনই থাকে।',
            en: 'Bengali typed with a Bengali keyboard, or pasted, is kept as it is.',
        },
    ],
    phoneticVowels: { bn: 'স্বর', en: 'Vowels' },
    phoneticConsonants: { bn: 'ব্যঞ্জন', en: 'Consonants' },
    phoneticMarks: { bn: 'চিহ্ন', en: 'Marks' },
    tryPhonetic: {
        bn: 'বাংলা কিবোর্ড নেই? "ইংরেজি হরফে বাংলা লেখা" চালু করুন।',
        en: 'No Bengali keyboard? Turn on "Phonetic typing".',
    },

    conflicts: { bn: 'অমিল', en: 'Conflicts' },
    noConflicts: { bn: 'কোনো অমিল নেই', en: 'No conflicts' },
    stats: { bn: 'হিসাব', en: 'Stats' },
    keys: { bn: 'কিবোর্ড', en: 'Keyboard' },
    keyArrows: { bn: 'তীর: ঘর বদল', en: 'Arrows: move' },
    keyTab: { bn: 'Tab: পাশাপাশি / উপর-নিচ', en: 'Tab: across / down' },
    keySpace: { bn: 'Space: কালো ঘর', en: 'Space: block' },
    keyEnter: { bn: 'Enter বা যেকোনো অক্ষর: শব্দ লেখা', en: 'Enter or any letter: type a word' },
    keyDelete: { bn: 'Delete: ঘর খালি', en: 'Delete: clear cell' },
    keyUndo: { bn: 'Ctrl+Z / Ctrl+Y: পূর্বাবস্থা / পুনরায়', en: 'Ctrl+Z / Ctrl+Y: undo / redo' },
    keyEsc: { bn: 'Esc: ছক-এ ফেরা', en: 'Esc: back to the grid' },
    board: { bn: 'শব্দছকের ঘর', en: 'Crossword grid' },
    savedLocally: { bn: 'এই ব্রাউজারে নিজে থেকেই সংরক্ষিত হয়', en: 'Autosaved in this browser' },
} satisfies Record<string, Text | Text[]>;

export const fmt = {
    slotLabel: (dir: 'across' | 'down', n: number, len: number): Text => ({
        bn: `${dir === 'across' ? 'পাশাপাশি' : 'উপর-নিচ'} ${bnN(n)} · ${bnN(len)} ঘর`,
        en: `${dir === 'across' ? 'Across' : 'Down'} ${n} · ${len} cells`,
    }),
    cellAt: (r: number, c: number): Text => ({
        bn: `সারি ${bnN(r + 1)}, কলাম ${bnN(c + 1)}`,
        en: `Row ${r + 1}, column ${c + 1}`,
    }),
    size: (rows: number, cols: number): Text => ({ bn: `${bnN(rows)}×${bnN(cols)}`, en: `${rows}×${cols}` }),
    stats: (white: number, filled: number, blocks: number, slots: number): Text => ({
        bn: `${bnN(filled)}/${bnN(white)} ঘর ভরা · ${bnN(blocks)} কালো ঘর · ${bnN(slots)} শব্দ`,
        en: `${filled}/${white} cells filled · ${blocks} blocks · ${slots} words`,
    }),
    listCoverage: (inList: number, complete: number): Text => ({
        bn: `সম্পূর্ণ ${bnN(complete)} শব্দের ${bnN(inList)}টি শব্দতালিকায়`,
        en: `${inList} of ${complete} complete words are in the word list`,
    }),
};

/** "bn / en" for attributes (title, aria-label) where markup is not possible. */
export const plain = (t: Text): string => `${t.bn} / ${t.en}`;
