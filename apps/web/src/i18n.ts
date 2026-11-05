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
    clues: { bn: 'সূত্র', en: 'Clues' },
    clueFor: { bn: 'সূত্র লিখুন', en: 'Write the clue' },
    cluePlaceholder: { bn: 'সূত্র লিখুন', en: 'Write the clue' },
    noAnswer: { bn: 'উত্তর নেই', en: 'no answer yet' },
    clueGivesAway: { bn: 'সূত্রে উত্তরটিই লেখা আছে', en: 'The clue contains its own answer' },
    noSlotsYet: {
        bn: 'এখনও কোনো শব্দ নেই। ছকে কালো ঘর বসিয়ে শব্দের জায়গা বানান।',
        en: 'No words yet. Place blocks in the grid to make word slots.',
    },
    cluesPhonetic: { bn: 'সূত্রেও ফোনেটিক লেখা', en: 'Phonetic typing in clues' },
    cluesPhoneticHint: {
        bn: 'লেখা শেষে Enter চাপুন বা অন্য জায়গায় ক্লিক করুন: তখন বাংলা হয়ে বসবে।',
        en: 'Press Enter or click elsewhere when done: the Bengali is saved then.',
    },

    exportPataparbon: { bn: 'Pataparbon-এর জন্য', en: 'Export to Pataparbon' },
    exportTitleOk: { bn: 'Pataparbon-এ পাঠানো যাবে', en: 'Ready for Pataparbon' },
    exportTitleBad: { bn: 'এখনও পাঠানো যাবে না', en: 'Cannot export yet' },
    exportBadHelp: {
        bn: 'Pataparbon এই নিয়মগুলো না মানলে ফাইল নেয় না। আগে এগুলো ঠিক করুন।',
        en: 'Pataparbon rejects a file that breaks these rules. Fix them first.',
    },
    exportOkHelp: {
        bn: 'Pataparbon অ্যাডমিন → Crosswords → New-তে ফাইলটি দিন বা JSON পেস্ট করুন।',
        en: 'In Pataparbon Admin → Crosswords → New, upload the file or paste the JSON.',
    },
    exportFormHelp: {
        bn: 'অ্যাডমিন ফর্মে এই মাপ লিখতে হবে, আর তারিখ ও শিরোনাম সেখানেই দিন:',
        en: 'Enter this size in the admin form; the date and title are entered there too:',
    },
    exportWarnings: { bn: 'সতর্কতা (পাঠানো আটকাবে না)', en: 'Warnings (they do not block the export)' },
    download: { bn: 'ফাইল নামান', en: 'Download .json' },
    copyJson: { bn: 'JSON কপি করুন', en: 'Copy JSON' },
    copied: { bn: 'কপি হয়েছে', en: 'Copied' },
    copyFailed: { bn: 'কপি করা গেল না; ফাইল নামান', en: 'Could not copy; download the file' },
    showJson: { bn: 'JSON দেখুন', en: 'Show the JSON' },
    close: { bn: 'বন্ধ করুন', en: 'Close' },
    importedPataparbon: {
        bn: 'Pataparbon-এর ফাইল খোলা হয়েছে। শিরোনাম ও নির্মাতা ফাঁকা, ভরে নিন।',
        en: 'Opened a Pataparbon file. Title and author are empty; fill them in.',
    },

    print: { bn: 'ছাপুন', en: 'Print' },
    printTitle: { bn: 'ছাপার ধরন', en: 'Print layout' },
    printHelp: {
        bn: 'A4 কাগজে ছাপা হবে। ব্রাউজারের ছাপার জানালায় "PDF-এ সংরক্ষণ" বেছে নিলে PDF হবে।',
        en: 'Prints on A4. Choose "Save as PDF" in the browser print window to get a PDF.',
    },
    layoutPuzzle: { bn: 'ফাঁকা ছক ও সূত্র', en: 'Blank grid + clues' },
    layoutKey: { bn: 'উত্তরমালা', en: 'Answer key' },
    layoutBoth: { bn: 'দুটিই (দুই পাতায়)', en: 'Both (two pages)' },
    printNow: { bn: 'ছাপুন', en: 'Print' },
    answerKey: { bn: 'উত্তরমালা', en: 'Answer key' },
    printCredit: {
        bn: 'অক্ষরখোপ দিয়ে তৈরি · শব্দতালিকা: kawshikbuet17/bengali-words (MIT)',
        en: 'Made with Aksharkhop · Word list: kawshikbuet17/bengali-words (MIT)',
    },
    untitled: { bn: 'শব্দছক', en: 'Crossword' },
    suggest: { bn: 'শব্দের পরামর্শ', en: 'Word suggestions' },
    suggestHelp: {
        bn: 'ঘরের অক্ষরের সঙ্গে মেলে, আর আড়াআড়ি শব্দগুলোরও অন্তত একটি করে শব্দ থাকে। বেশি চেনা শব্দ আগে।',
        en: 'Words that fit the letters and leave each crossing slot at least one word. Commonest first.',
    },
    suggestNone: { bn: 'কোনো শব্দ মেলেনি', en: 'No word fits' },
    suggestPick: { bn: 'এটি বসান', en: 'Place this word' },
    suggestBlock: { bn: 'এই শব্দ আর চাই না', en: 'Never suggest or use this word' },
    suggestLoading: { bn: 'শব্দ খোঁজা হচ্ছে…', en: 'Looking…' },
    suggestNoWordList: {
        bn: 'শব্দতালিকা ছাড়া পরামর্শ দেওয়া যায় না',
        en: 'Suggestions need the word list',
    },
    suggestSelect: {
        bn: 'পরামর্শ পেতে ছকে একটি শব্দের ঘর বাছুন',
        en: 'Select a word in the grid to get suggestions',
    },

    autofill: { bn: 'নিজে থেকে ভরা', en: 'Auto-fill' },
    fillHelp: {
        bn: 'ছকে আগে থেকে যে অক্ষর আছে সেগুলো থাকবে; বাকি ঘর শব্দতালিকা থেকে ভরা হবে, একই শব্দ দুবার নয়। ফল এক ধাপে পূর্বাবস্থায় ফেরানো যায়।',
        en: 'Letters already in the grid stay; the other cells are filled from the word list, with no word used twice. The result is one undo step.',
    },
    fillRun: { bn: 'বাকিটা ভরুন', en: 'Fill the rest' },
    fillStop: { bn: 'থামান', en: 'Stop' },
    fillWorking: { bn: 'ভরা হচ্ছে…', en: 'Filling…' },
    fillCommon: { bn: 'শুধু চেনা শব্দ (সর্বনিম্ন চলতি-মান)', en: 'Common words only (minimum frequency)' },
    fillCommonHelp: {
        bn: '০ হলে সব শব্দ, অচেনা সহ। বাড়ালে শুধু জানা চলতি-মানের শব্দ থাকে: তখন শব্দ কমে যায়, ভরা কঠিন হয়।',
        en: '0 allows every word, rare ones too. Higher keeps only words with a known frequency, so there are fewer and filling is harder.',
    },
    fillTime: { bn: 'সময়সীমা', en: 'Time limit' },
    fillSeed: { bn: 'সিড (একই সিডে একই ফল)', en: 'Seed (same seed, same result)' },
    fillBlock: { bn: 'যে শব্দ কখনও বসবে না', en: 'Words never to use' },
    fillBlockHelp: {
        bn: 'প্রতি লাইনে একটি শব্দ। পরামর্শ ও নিজে-থেকে-ভরা, দুটোতেই বাদ যাবে। এই ব্রাউজারে সংরক্ষিত থাকে।',
        en: 'One word per line. Left out of suggestions and auto-fill. Saved in this browser.',
    },
    fillNoWordList: {
        bn: 'শব্দতালিকা পাওয়া যায়নি। python3 scripts/build_wordlist.py চালান।',
        en: 'Word list not found. Run python3 scripts/build_wordlist.py.',
    },
    fillLoading: { bn: 'শব্দতালিকা আসছে…', en: 'Loading the word list…' },
    fillSolvedNothing: {
        bn: 'সব ঘর আগেই ভরা, ভরার কিছু নেই',
        en: 'Every cell is already filled; nothing to fill',
    },
    fillStale: {
        bn: 'ভরার সময় ছক বদলে গেছে, তাই ফল বসানো হয়নি। আবার চেষ্টা করুন।',
        en: 'The grid changed while filling, so the result was not used. Try again.',
    },
    fillBlockedTitle: { bn: 'যে শব্দের ঘর আটকে আছে', en: 'Slots that hold it up' },
    fillTried: { bn: 'আবার চেষ্টা: সিড বদলে গেছে', en: 'Try again: the seed has changed' },
    share: { bn: 'শেয়ার', en: 'Share' },
    shareTitle: { bn: 'সমাধানের লিঙ্ক', en: 'Link to solve' },
    shareHelp: {
        bn: 'যে এই লিঙ্ক খুলবে সে নিজের ব্রাউজারেই শব্দছকটি সমাধান করতে পারবে। কোনো সার্ভার লাগে না।',
        en: 'Anyone who opens this link can solve the crossword in their own browser. No server is needed.',
    },
    shareAnswers: {
        bn: 'লিঙ্কের ভেতরে উত্তরও আছে (উত্তর যাচাই ব্রাউজারেই হয়), তাই লিঙ্কটি যে ডিকোড করবে সে উত্তর দেখতে পারবে।',
        en: 'The answers are inside the link (checking happens in the browser), so anyone who decodes the link can read them.',
    },
    shareBad: { bn: 'এখনও লিঙ্ক বানানো যাবে না', en: 'Cannot make a link yet' },
    shareBadHelp: {
        bn: 'সমাধানের জন্য ছকটি পুরো ভরা আর প্রতিটি শব্দের সূত্র থাকতে হবে। নিচের সমস্যাগুলো ঠিক করুন।',
        en: 'To solve it, the grid must be full and every word needs a clue. Fix these first.',
    },
    shareOpen: { bn: 'সমাধান পাতা খুলুন (নতুন ট্যাবে)', en: 'Open the solver (new tab)' },
    shareMaking: { bn: 'লিঙ্ক বানানো হচ্ছে…', en: 'Making the link…' },
    shareLinkLabel: { bn: 'লিঙ্ক', en: 'Link' },

    solverTitle: { bn: 'শব্দছক সমাধান', en: 'Solve a crossword' },
    solveLoading: { bn: 'শব্দছক খোলা হচ্ছে…', en: 'Opening the crossword…' },
    solveFailed: { bn: 'শব্দছকটি খোলা গেল না', en: 'Could not open the crossword' },
    solveFailedHelp: {
        bn: 'লিঙ্কটি অসম্পূর্ণ বা ভুল হতে পারে। পুরো লিঙ্কটি আবার কপি করুন, অথবা ফাইল খুলুন।',
        en: 'The link may be cut short or wrong. Copy the whole link again, or open a file.',
    },
    solveFileFailed: { bn: 'ফাইলটি সমাধানের জন্য খোলা গেল না', en: 'Could not open the file for solving' },
    solveCopyLink: { bn: 'লিঙ্ক কপি', en: 'Copy link' },
    solveMake: { bn: 'নিজের শব্দছক বানান', en: 'Make your own' },
    solveOpenFile: { bn: 'ফাইল খুলুন', en: 'Open a file' },
    timer: { bn: 'সময়', en: 'Time' },
    currentClue: { bn: 'এই শব্দের সূত্র', en: 'Clue' },
    solveAnswerHint: {
        bn: 'পুরো শব্দ লিখলে শব্দের শুরু থেকে বসবে। কম লিখলে বাছা ঘর থেকে বসবে।',
        en: 'A whole word fills the word from its start. Anything shorter fills from the selected cell.',
    },
    solveNoClue: { bn: 'একটি ঘর বাছুন', en: 'Select a cell' },
    check: { bn: 'পরীক্ষা', en: 'Check' },
    reveal: { bn: 'উত্তর দেখুন', en: 'Reveal' },
    scopeCell: { bn: 'ঘর', en: 'Cell' },
    scopeWord: { bn: 'শব্দ', en: 'Word' },
    scopePuzzle: { bn: 'পুরো ছক', en: 'Puzzle' },
    startOver: { bn: 'নতুন করে শুরু', en: 'Start over' },
    startOverConfirm: {
        bn: 'সব লেখা আর সময় মুছে নতুন করে শুরু হবে। চালিয়ে যাবেন?',
        en: 'This clears everything you typed and the time. Continue?',
    },
    revealAllConfirm: {
        bn: 'পুরো ছকের উত্তর দেখে নিলে সমাধানটি "সাহায্য নিয়ে" ধরা হবে। চালিয়ে যাবেন?',
        en: 'Revealing the whole puzzle counts as solving it with help. Continue?',
    },
    allCorrect: { bn: 'যা লেখা হয়েছে সব ঠিক আছে', en: 'Everything typed so far is correct' },
    solvedTitle: { bn: 'সমাধান হয়েছে!', en: 'Solved!' },
    solvedHelped: { bn: 'কিছু উত্তর দেখে নেওয়া হয়েছে।', en: 'Some answers were revealed.' },
    solveKeys: { bn: 'কিবোর্ড', en: 'Keyboard' },
    solveClues: { bn: 'সূত্র', en: 'Clues' },
} satisfies Record<string, Text | Text[]>;

const FAIL_TEXT: Record<string, Text> = {
    no_candidates: {
        bn: 'কোনো শব্দ মেলে না এমন ঘর আছে: অক্ষর বদলান বা কালো ঘর সরান',
        en: 'A slot has no word that fits its letters: change a letter or move a block',
    },
    crossings: {
        bn: 'আড়াআড়ি ঘরগুলোর সঙ্গে মেলে এমন শব্দ নেই এমন ঘর আছে',
        en: 'A slot has no word that fits together with the slots it crosses',
    },
    exhausted: {
        bn: 'সব রকম চেষ্টা করেও ভরা গেল না: এই ছকে, এই শব্দতালিকায় ভরার উপায় নেই। নিজের বসানো কোনো শব্দ মুছে আবার চেষ্টা করুন',
        en: 'Every way was tried: this grid cannot be filled from this word list. Try clearing a word you typed',
    },
    timeout: {
        bn: 'সময় শেষ, ভরা গেল না',
        en: 'Time ran out before the grid was filled',
    },
    cancelled: { bn: 'থামানো হয়েছে', en: 'Stopped' },
    conflicts: {
        bn: 'ছকে অমিল আছে; আগে অমিলগুলো ঠিক করুন',
        en: 'The grid has conflicts; fix them first',
    },
};

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
    clueSummary: (answered: number, clued: number, total: number): Text => ({
        bn: `${bnN(answered)}/${bnN(total)} শব্দে উত্তর · ${bnN(clued)}/${bnN(total)} শব্দে সূত্র`,
        en: `${answered}/${total} words have an answer · ${clued}/${total} have a clue`,
    }),
    giveaways: (n: number): Text => ({
        bn: `${bnN(n)}টি সূত্রে উত্তরটিই লেখা আছে`,
        en: `${n} clue${n === 1 ? '' : 's'} contain${n === 1 ? 's' : ''} the answer`,
    }),
    clueLabel: (dir: 'across' | 'down', n: number): Text => ({
        bn: `${dir === 'across' ? 'পাশাপাশি' : 'উপর-নিচ'} ${bnN(n)}-এর সূত্র`,
        en: `Clue for ${dir === 'across' ? 'across' : 'down'} ${n}`,
    }),
    fillProgress: (nodes: number, restarts: number, ms: number): Text => ({
        bn: `${bnN(Math.round(ms / 100) / 10)} সেকেন্ড · ${bnN(nodes)}টি শব্দ চেষ্টা · ${bnN(restarts)} বার নতুন করে শুরু`,
        en: `${(ms / 1000).toFixed(1)} s · ${nodes} words tried · ${restarts} restarts`,
    }),
    fillSolved: (count: number, ms: number, seed: number): Text => ({
        bn: `${bnN(count)}টি শব্দ বসেছে (${bnN(Math.round(ms / 100) / 10)} সেকেন্ড, সিড ${bnN(seed)})`,
        en: `Filled ${count} word${count === 1 ? '' : 's'} in ${(ms / 1000).toFixed(1)} s (seed ${seed})`,
    }),
    fillFailed: (reason: string, ms: number): Text => {
        const t = FAIL_TEXT[reason] ?? FAIL_TEXT.exhausted!;
        return {
            bn: `${t.bn} (${bnN(Math.round(ms / 100) / 10)} সেকেন্ড)`,
            en: `${t.en} (${(ms / 1000).toFixed(1)} s)`,
        };
    },
    slotPattern: (dir: 'across' | 'down', n: number, len: number, candidates: number): Text => ({
        bn: `${dir === 'across' ? 'পাশাপাশি' : 'উপর-নিচ'} ${bnN(n)} · ${bnN(len)} ঘর · মেলে ${bnN(candidates)}টি শব্দ`,
        en: `${dir === 'across' ? 'Across' : 'Down'} ${n} · ${len} cells · ${candidates} words fit`,
    }),
    suggestCount: (shown: number, fitting: number): Text => ({
        bn: `${bnN(fitting)}টি শব্দ মেলে; ${bnN(shown)}টি দেখানো হল`,
        en: `${fitting} words fit; showing ${shown}`,
    }),
    usable: (n: number): Text => ({
        bn: `এখন ${bnN(n)}টি শব্দ ব্যবহারযোগ্য`,
        en: `${n} words usable now`,
    }),
    solveProgress: (filled: number, total: number): Text => ({
        bn: `${bnN(filled)}/${bnN(total)} ঘর ভরা`,
        en: `${filled}/${total} cells filled`,
    }),
    checkResult: (wrong: number, empty: number): Text => ({
        bn: `${bnN(wrong)}টি ঘর ভুল · ${bnN(empty)}টি খালি`,
        en: `${wrong} wrong · ${empty} empty`,
    }),
    tooLong: (left: number): Text => ({
        bn: `এই শব্দে বাছা ঘর থেকে আর মাত্র ${bnN(left)}টি ঘর বাকি`,
        en: `Only ${left} cell${left === 1 ? '' : 's'} left in this word from the selected cell`,
    }),
    linkLong: (n: number): Text => ({
        bn: `লিঙ্কটি অনেক লম্বা (${bnN(n)} অক্ষর)। কিছু চ্যাট অ্যাপ এত লম্বা লিঙ্ক কেটে দিতে পারে।`,
        en: `The link is very long (${n} characters). Some chat apps cut links this long.`,
    }),
    solveWord: (dir: 'across' | 'down', n: number, len: number): Text => fmt.slotLabel(dir, n, len),
    adminSize: (rows: number, cols: number): Text => ({
        bn: `${bnN(rows)} সারি × ${bnN(cols)} কলাম`,
        en: `${rows} rows × ${cols} columns`,
    }),
};

/** "bn / en" for attributes (title, aria-label) where markup is not possible. */
export const plain = (t: Text): string => `${t.bn} / ${t.en}`;
