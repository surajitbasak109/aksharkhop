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

    draftButton: { bn: 'খসড়া', en: 'Draft' },
    draftTitle: { bn: 'সূত্রের খসড়া (Claude)', en: 'Draft a clue (Claude)' },
    draftMode: { bn: 'পদ্ধতি', en: 'Method' },
    draftModePaste: { bn: 'কপি-পেস্ট (বিনা খরচে)', en: 'Copy and paste (free)' },
    draftModeKey: { bn: 'নিজের API কী', en: 'My own API key' },
    draftPaste1: {
        bn: 'নিচের লেখাটি কপি করুন।',
        en: 'Copy the text below.',
    },
    draftPaste2: {
        bn: 'যে কোনো চ্যাটবটে (Claude, Gemini, ChatGPT…) পেস্ট করে উত্তর কপি করুন।',
        en: 'Paste it into any chatbot (Claude, Gemini, ChatGPT…) and copy its reply.',
    },
    draftPaste3: {
        bn: 'উত্তরটি নিচের দ্বিতীয় বাক্সে পেস্ট করে “উত্তর পড়ুন” চাপুন।',
        en: 'Paste the reply in the second box and press “Read reply”.',
    },
    draftPromptLabel: { bn: 'চ্যাটবটের জন্য লেখা', en: 'Text for the chatbot' },
    draftCopyPrompt: { bn: 'লেখাটি কপি', en: 'Copy text' },
    draftReplyLabel: { bn: 'চ্যাটবটের উত্তর', en: 'The chatbot’s reply' },
    draftReadReply: { bn: 'উত্তর পড়ুন', en: 'Read reply' },
    draftPasteSends: {
        bn: 'এই সাইট কিছুই পাঠায় না: কপি-পেস্ট আপনি নিজে করেন।',
        en: 'This site sends nothing anywhere: you do the copying and pasting yourself.',
    },
    draftKeyHelp: {
        bn: 'খসড়া করতে আপনার নিজের Claude API কী লাগবে।',
        en: 'Drafting needs your own Claude API key.',
    },
    draftKeyMemory: {
        bn: 'কী শুধু এই পাতার মেমরিতে থাকে। পাতা রিলোড করলে বা বন্ধ করলে মুছে যায়। কোথাও সংরক্ষণ বা শেয়ার হয় না।',
        en: 'The key stays in this page’s memory only. Reloading or closing the page clears it. It is never saved, shared or exported.',
    },
    draftKeyLimit: {
        bn: 'শুধু এই কাজের জন্য আলাদা কী বানান, আর Anthropic কনসোলে খরচের সীমা দিন।',
        en: 'Make a separate key just for this, with a spend limit in the Anthropic console.',
    },
    draftKeySends: {
        bn: 'উত্তরের শব্দটি সরাসরি Anthropic-এ যায়, এই সাইটের কোনো সার্ভারে নয়। শুধু এই ঠিকানার পাতাতেই কী দিন।',
        en: 'The answer word goes straight to Anthropic, not through any server of this site. Only paste a key on this exact address.',
    },
    draftKeyLabel: { bn: 'Claude API কী', en: 'Claude API key' },
    draftUseKey: { bn: 'কী ব্যবহার করুন', en: 'Use key' },
    draftForgetKey: { bn: 'কী ভুলে যান', en: 'Forget key' },
    draftAgain: { bn: 'আবার খসড়া', en: 'Draft again' },
    draftWorking: { bn: 'খসড়া হচ্ছে…', en: 'Drafting…' },
    draftReview: {
        bn: 'এগুলো খসড়া। পড়ে দেখে একটি বেছে নিন, তারপর দরকারমতো বদলান।',
        en: 'These are drafts. Read them, pick one, then edit it if needed.',
    },
    draftErrNoKey: { bn: 'কী দিন।', en: 'Enter a key.' },
    draftErrBadKey: { bn: 'কীটি চলল না। ঠিক আছে কিনা দেখুন।', en: 'The key was refused. Check it.' },
    draftErrRate: {
        bn: 'অনেক অনুরোধ হয়েছে। একটু পরে চেষ্টা করুন।',
        en: 'Too many requests. Try again shortly.',
    },
    draftErrNetwork: { bn: 'Anthropic-এর সঙ্গে যোগ হল না।', en: 'Could not reach Anthropic.' },
    draftErrServer: { bn: 'Anthropic থেকে ভুল উত্তর এল।', en: 'Anthropic returned an error.' },
    draftErrNone: {
        bn: 'কাজে লাগার মতো সূত্র পাওয়া গেল না (সব উত্তর-ফাঁস)। আবার চেষ্টা করুন।',
        en: 'No usable clue (each gave the answer away). Try again.',
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

// ---- Site navigation and the landing page ------------------------------------------------------

export const site = {
    navBuild: { bn: 'ছক বানান', en: 'Build' },
    navSolve: { bn: 'সমাধান', en: 'Solve' },
    navHome: { bn: 'হোম', en: 'Home' },
    menu: { bn: 'মেনু', en: 'Menu' },
    notFoundTitle: { bn: 'এই পাতাটি পাওয়া গেল না', en: 'Page not found' },
    notFoundHelp: {
        bn: 'ঠিকানাটি ভুল হতে পারে, বা পাতাটি সরে গেছে।',
        en: 'The address may be wrong, or the page has moved.',
    },
    backHome: { bn: 'হোম পাতায় ফিরুন', en: 'Back to the home page' },
    pageTitleHome: {
        bn: 'অক্ষরখোপ — বাংলা শব্দছক বানান ও সমাধান',
        en: 'Aksharkhop — build and solve Bengali crosswords',
    },
    pageTitleEditor: { bn: 'ছক বানান · অক্ষরখোপ', en: 'Build · Aksharkhop' },
    pageTitleSolve: { bn: 'সমাধান · অক্ষরখোপ', en: 'Solve · Aksharkhop' },
};

export const solveHome = {
    title: { bn: 'শব্দছক সমাধান করুন', en: 'Solve a crossword' },
    lead: {
        bn: 'অক্ষরখোপের লিঙ্ক খুলুন, কোনো ফাইল খুলুন, বা নমুনা দিয়ে শুরু করুন। কিছু ইনস্টল করতে হয় না।',
        en: 'Open an Aksharkhop link, open a file, or start with the sample. Nothing to install.',
    },
    pasteLabel: { bn: 'লিঙ্ক বা কোড পেস্ট করুন', en: 'Paste a link or code' },
    pastePlaceholder: { bn: 'https://…/solve#solve=…', en: 'https://…/solve#solve=…' },
    pasteGo: { bn: 'খুলুন', en: 'Open' },
    pasteBad: {
        bn: 'এটি অক্ষরখোপের সঠিক লিঙ্ক বা কোড নয়।',
        en: 'That is not a valid Aksharkhop link or code.',
    },
    fileHelp: {
        bn: 'অক্ষরখোপের সংরক্ষণ-ফাইল বা Pataparbon-এর JSON ফাইল খোলা যায়।',
        en: 'An Aksharkhop save file or a Pataparbon JSON file can be opened.',
    },
    sample: { bn: 'নমুনা শব্দছক সমাধান করুন', en: 'Solve the sample' },
    or: { bn: 'অথবা', en: 'or' },
};

export const landing = {
    eyebrow: { bn: 'বাংলা শব্দছক · এক ঘরে এক অক্ষর', en: 'Bengali crosswords · one akshara per cell' },
    heroTitle: {
        bn: 'বাংলা শব্দছক বানান, ছাপুন আর সমাধান করুন',
        en: 'Build, print and solve Bengali crosswords',
    },
    heroLead: {
        bn: 'অক্ষরখোপে ক্ষমা-র মতো যুক্তাক্ষর ভাঙে না: যেমন পড়েন, তেমনই এক ঘরে বসে। ছক আঁকুন, শব্দ বসান বা নিজে-থেকে ভরান, সূত্র লিখুন, তারপর ছাপুন বা একটি লিঙ্কে সবার সঙ্গে ভাগ করুন।',
        en: 'In Aksharkhop a conjunct like ক্ষমা is never broken up: each akshara sits in one cell, the way you read it. Draw the grid, place words or auto-fill, write clues, then print it or share it as one link.',
    },
    ctaBuild: { bn: 'ছক বানানো শুরু করুন', en: 'Start building' },
    ctaSample: { bn: 'নমুনা শব্দছক সমাধান করুন', en: 'Solve a sample' },
    heroNote: {
        bn: 'বিনামূল্যে · সাইন-আপ লাগে না · আপনার ছক আপনার ব্রাউজারেই থাকে',
        en: 'Free · no sign-up · your puzzle stays in your browser',
    },
    sampleCaption: { bn: 'একটি নমুনা ছক: ১২টি শব্দ, ৫×৫', en: 'A sample grid: 12 words, 5×5' },

    whatTitle: { bn: 'অক্ষরখোপ কী?', en: 'What is Aksharkhop?' },
    whatText: {
        bn: 'অক্ষরখোপ (অক্ষর + খোপ) বাংলা শব্দছক তৈরির একটি ওয়েব অ্যাপ। এতে আছে ছক-সম্পাদক, সূত্র লেখার জায়গা, প্রায় ৭৭ হাজার শব্দের তালিকা থেকে পরামর্শ ও নিজে-থেকে-ভরা, A4 কাগজে ছাপার ব্যবস্থা, আর একটি সমাধান-পাতা, যেখানে যে-কেউ লিঙ্ক খুলে ছকটি সমাধান করতে পারেন।',
        en: 'Aksharkhop (অক্ষর, letter + খোপ, box) is a web app for making Bengali crosswords. It has a grid editor, a place to write clues, suggestions and auto-fill from a list of about 77,000 words, A4 printing, and a solver page where anyone can open a link and solve the puzzle.',
    },

    whyTitle: { bn: 'এক ঘরে এক অক্ষর', en: 'One akshara per cell' },
    whyText: {
        bn: 'বাংলা লেখায় একটি অক্ষর একাধিক বর্ণচিহ্ন দিয়ে তৈরি হতে পারে: ক্ষ, স্ত্র, কি, চাঁ। ছাপা শব্দছকে ঠিক এমনই একটি অক্ষর একটি ঘরে বসে। অক্ষরখোপ প্রতিটি শব্দকে নিজে থেকে এভাবে ভাগ করে, তাই আপনাকে হিসেব করতে হয় না। দুটি ঘর মিলবে তখনই, যখন দুটি অক্ষর হুবহু এক।',
        en: 'In Bengali writing one akshara can be made of several characters: ক্ষ, স্ত্র, কি, চাঁ. In a printed শব্দছক such an akshara fills exactly one cell. Aksharkhop splits every word this way for you, so you never count by hand. Two crossing cells match only when the two aksharas are exactly the same.',
    },
    whyCaption: { bn: 'শব্দ যেভাবে ঘরে ভাগ হয়', en: 'How words split into cells' },
    whyNote: {
        bn: 'ং, ঃ আর ৎ আলাদা ঘর পায়; চন্দ্রবিন্দু (ঁ) নিজের অক্ষরের সঙ্গে থাকে।',
        en: 'ং, ঃ and ৎ get a cell of their own; the chandrabindu (ঁ) stays with its letter.',
    },

    featuresTitle: { bn: 'কী কী করা যায়', en: 'What you can do' },
    features: [
        {
            title: { bn: 'ছক-সম্পাদক', en: 'Grid editor' },
            text: {
                bn: '৫×৫ থেকে ১৫×১৫ পর্যন্ত যেকোনো মাপ। কালো ঘর বসান, চাইলে ১৮০° প্রতিসাম্য রাখুন। নম্বর নিজে থেকে বসে। পূর্বাবস্থা, কিবোর্ডে চলাচল সবই আছে।',
                en: 'Any size from 5×5 to 15×15. Place blocks, keep 180° symmetry if you like. Numbers appear on their own. Undo and keyboard movement included.',
            },
        },
        {
            title: { bn: 'ইংরেজি কিবোর্ডেই বাংলা', en: 'Bengali from any keyboard' },
            text: {
                bn: 'বাংলা কিবোর্ড না থাকলেও চলবে: ফোনেটিক টাইপিংয়ে kShoma লিখলে ক্ষমা হয়। উত্তর আর সূত্র দুটোতেই কাজ করে।',
                en: 'No Bengali keyboard needed: with phonetic typing, kShoma becomes ক্ষমা. It works for answers and for clues.',
            },
        },
        {
            title: { bn: 'শব্দের পরামর্শ', en: 'Word suggestions' },
            text: {
                bn: 'কোনো শব্দের ঘর বাছলে সেখানে যা বসতে পারে সেই শব্দগুলো দেখায়, যেগুলো আড়াআড়ি শব্দকেও আটকায় না। বেশি চেনা শব্দ আগে।',
                en: 'Pick a slot and see the words that fit, leaving each crossing word at least one option. Commonest words first.',
            },
        },
        {
            title: { bn: 'নিজে-থেকে ভরা', en: 'Auto-fill' },
            text: {
                bn: 'ছকে যা লিখেছেন তা রেখে বাকিটা সাধারণত কয়েক সেকেন্ডে ভরে দেয়। একই শব্দ দুবার নয়। না মিললে বলে কোন ঘরটা আটকাচ্ছে। এক ধাপে পূর্বাবস্থায় ফেরানো যায়।',
                en: 'Keeps what you typed and usually fills the rest in seconds, never repeating a word. If it cannot, it tells you which slot is in the way. One undo takes it back.',
            },
        },
        {
            title: { bn: 'সূত্র লেখা', en: 'Clue writing' },
            text: {
                bn: 'পাশাপাশি ও উপর-নিচের সূত্র ছকের সঙ্গে মিলিয়ে দেখায়। কোন শব্দের উত্তর বা সূত্র বাকি, আর কোন সূত্রে উত্তরটিই লেখা আছে, সব ধরা পড়ে।',
                en: 'Across and down clues sit beside the grid. You see which words still lack an answer or a clue, and which clue gives its answer away.',
            },
        },
        {
            title: { bn: 'A4 কাগজে ছাপা', en: 'Print on A4' },
            text: {
                bn: 'ফাঁকা ছক ও সূত্র, উত্তরমালা, বা দুটিই। যুক্তাক্ষর ও কার-চিহ্ন ঘরের মধ্যেই থাকে, কাটা পড়ে না।',
                en: 'Blank grid with clues, answer key, or both. Conjuncts and vowel signs stay inside their cells.',
            },
        },
        {
            title: { bn: 'Pataparbon-এর জন্য এক্সপোর্ট', en: 'Export for Pataparbon' },
            text: {
                bn: 'এক্সপোর্টের আগে ছকটি Pataparbon-এর নিজস্ব নিয়মে যাচাই হয়: অক্ষর-ভাগ, নম্বর, সূত্র। ভুল থাকলে বাংলা-ইংরেজিতে জানায়।',
                en: "Before exporting, the puzzle is checked against Pataparbon's own rules: akshara split, numbering, clues. Problems are explained in Bengali and English.",
            },
        },
        {
            title: { bn: 'লিঙ্কে শেয়ার, আলাদা সমাধান-পাতা', en: 'Share by link, a solver page' },
            text: {
                bn: 'একটি লিঙ্কেই পুরো শব্দছক। যিনি খুলবেন তিনি ঘরে বা পুরো শব্দ লিখে সমাধান করতে পারবেন, ঘর বা শব্দ পরীক্ষা করতে পারবেন, উত্তর দেখে নিতে পারবেন। সময় গোনা হয়, আর অগ্রগতি ব্রাউজারে জমা থাকে।',
                en: 'The whole crossword in one link. The solver types a cell at a time or a whole word, checks a cell or word, or reveals an answer. A timer runs and progress is kept in the browser.',
            },
        },
        {
            title: { bn: 'আপনার ছক আপনার কাছে', en: 'Your puzzle stays with you' },
            text: {
                bn: 'সাইন-আপ বা অ্যাকাউন্ট নেই। কাজ নিজে থেকে এই ব্রাউজারে সংরক্ষিত হয়, আর ফাইল হিসেবেও নামিয়ে রাখা যায়। লিঙ্কে শেয়ার না করলে কিছুই বাইরে যায় না।',
                en: 'No sign-up or account. Work is autosaved in this browser and can be saved as a file. Nothing leaves your device unless you share a link.',
            },
        },
    ],

    stepsTitle: { bn: 'কীভাবে ব্যবহার করবেন', en: 'How to use it' },
    steps: [
        {
            title: { bn: 'ছক আঁকুন', en: 'Draw the grid' },
            text: {
                bn: 'মাপ বেছে নিন (৯×৯ দিয়ে শুরু করা যায়), তারপর ক্লিক করে কালো ঘর বসান।',
                en: 'Pick a size (9×9 is a good start), then click to place the black blocks.',
            },
        },
        {
            title: { bn: 'শব্দ বসান', en: 'Add the words' },
            text: {
                bn: 'শব্দের ঘরে গিয়ে পুরো শব্দ লিখুন, বা পরামর্শ থেকে বেছে নিন, বা “বাকিটা ভরুন” চাপুন।',
                en: 'Select a slot and type the whole word, pick from the suggestions, or press “Fill the rest”.',
            },
        },
        {
            title: { bn: 'সূত্র লিখুন', en: 'Write the clues' },
            text: {
                bn: 'ছকের নিচের সূত্র-তালিকায় প্রতিটি শব্দের সূত্র লিখুন। সব ঘর ও সূত্র ঠিক হলে ছক তৈরি।',
                en: 'In the clue list under the grid, write a clue for every word. When every slot has an answer and a clue, the puzzle is done.',
            },
        },
        {
            title: { bn: 'ছাপুন, এক্সপোর্ট করুন বা শেয়ার করুন', en: 'Print, export or share' },
            text: {
                bn: 'A4 কাগজে ছাপুন, Pataparbon-এর জন্য JSON নামান, বা একটি লিঙ্ক বানিয়ে পাঠিয়ে দিন।',
                en: 'Print on A4, download the JSON for Pataparbon, or make a link and send it.',
            },
        },
        {
            title: { bn: 'সমাধান করুন', en: 'Solve it' },
            text: {
                bn: 'লিঙ্ক খুললেই সমাধান-পাতা। আলাদা কিছু ইনস্টল করতে হয় না।',
                en: 'Opening the link shows the solver page. Nothing to install.',
            },
        },
    ],

    audienceTitle: { bn: 'কাদের কাজে লাগবে', en: 'Who it is for' },
    audience: [
        {
            title: { bn: 'শব্দছক-নির্মাতা ও সম্পাদক', en: 'Puzzle makers and editors' },
            text: {
                bn: 'পত্রিকা, ম্যাগাজিন বা লিটল ম্যাগাজিনের জন্য নিয়মিত শব্দছক বানান: ছক, শব্দ, সূত্র আর ছাপা এক জায়গায়।',
                en: 'For anyone making a regular শব্দছক for a newspaper, magazine or little magazine: grid, words, clues and print in one place.',
            },
        },
        {
            title: { bn: 'শিক্ষক ও শিক্ষার্থী', en: 'Teachers and students' },
            text: {
                bn: 'ক্লাসের পাঠ থেকে শব্দ নিয়ে বানান-চর্চা বা শব্দভান্ডারের খেলা। শিক্ষার্থীরা নিজেরাও শব্দছক বানাতে পারে।',
                en: 'Spelling practice or vocabulary games from the words of a lesson. Students can build puzzles themselves.',
            },
        },
        {
            title: { bn: 'পরিবার, ক্লাব ও কুইজের আয়োজক', en: 'Families, clubs and quiz hosts' },
            text: {
                bn: 'জন্মদিন, পুজোসংখ্যা বা আড্ডার জন্য নিজেদের শব্দছক বানিয়ে একটি লিঙ্কে সবাইকে পাঠান।',
                en: 'Make your own puzzle for a birthday, a festival issue or a get-together, and send everyone one link.',
            },
        },
        {
            title: { bn: 'যাঁরা বাংলা শিখছেন', en: 'People learning Bengali' },
            text: {
                bn: 'ফোনেটিক টাইপিংয়ে ইংরেজি কিবোর্ডেই বাংলা লেখা যায়, আর শব্দছক অক্ষর চেনার ভালো অনুশীলন।',
                en: 'Phonetic typing lets you write Bengali on an English keyboard, and a crossword is good practice for knowing aksharas.',
            },
        },
        {
            title: { bn: 'Pataparbon-এ প্রকাশকারী', en: 'Pataparbon publishers' },
            text: {
                bn: 'Pataparbon-এ শব্দছক প্রকাশ করেন? ছক যাচাই করে সরাসরি তার JSON ফাইল পাবেন।',
                en: 'Publishing a crossword on Pataparbon? Get its JSON file straight from a checked puzzle.',
            },
        },
    ],

    sampleTitle: { bn: 'এখনই চেষ্টা করুন', en: 'Try it now' },
    sampleText: {
        bn: 'নমুনা শব্দছকটি সমাধান করে দেখুন: ঘরে বসান, পরীক্ষা করুন, আটকে গেলে উত্তর দেখুন।',
        en: 'Solve the sample crossword: type in the cells, check your answers, and reveal one if you are stuck.',
    },

    faqTitle: { bn: 'সচরাচর প্রশ্ন', en: 'Questions' },
    faq: [
        {
            q: { bn: 'বাংলা কিবোর্ড না থাকলে কী করব?', en: 'What if I have no Bengali keyboard?' },
            a: {
                bn: 'ফোনেটিক টাইপিং চালু থাকলে ইংরেজি হরফে লিখলেই বাংলা হয়। যেমন amora = আমরা, kShoma = ক্ষমা। নিয়মের তালিকা উত্তরের বাক্সের নিচেই আছে।',
                en: 'With phonetic typing on, type in Latin letters and get Bengali: amora = আমরা, kShoma = ক্ষমা. The list of keys is right under the answer box.',
            },
        },
        {
            q: { bn: 'এটা কি বিনামূল্যে?', en: 'Is it free?' },
            a: {
                bn: 'হ্যাঁ। এটি একটি অবাণিজ্যিক প্রকল্প, সাইন-আপ বা অ্যাকাউন্ট লাগে না।',
                en: 'Yes. It is a non-commercial project and needs no sign-up or account.',
            },
        },
        {
            q: { bn: 'আমার ছক কোথায় জমা থাকে?', en: 'Where is my puzzle stored?' },
            a: {
                bn: 'আপনার ব্রাউজারে, নিজে থেকে। আলাদা করে ফাইল হিসেবে সংরক্ষণও করতে পারেন। অন্য ব্রাউজার বা কম্পিউটারে নিতে ফাইলটি খুলুন। লিঙ্কে শেয়ার না করলে কিছুই বাইরে যায় না।',
                en: 'In your browser, automatically. You can also save it as a file and open it on another browser or computer. Nothing leaves your device unless you share a link.',
            },
        },
        {
            q: {
                bn: 'অন্যরা কি কিছু ইনস্টল না করেই সমাধান করতে পারবেন?',
                en: 'Can others solve it without installing anything?',
            },
            a: {
                bn: 'পারবেন। “শেয়ার” থেকে লিঙ্ক নিয়ে পাঠান; যিনি খুলবেন তিনি ব্রাউজারেই সমাধান করবেন। মনে রাখবেন, লিঙ্কের ভেতরে উত্তরও থাকে, তাই লিঙ্ক ডিকোড করলে উত্তর দেখা সম্ভব।',
                en: 'Yes. Take the link from “Share” and send it; whoever opens it solves in the browser. Note that the answers are inside the link, so someone who decodes the link can read them.',
            },
        },
        {
            q: { bn: 'শব্দতালিকার বানান কোন রীতির?', en: 'Which spelling does the word list follow?' },
            a: {
                bn: 'লক্ষ্য পশ্চিমবঙ্গের বানান। তালিকাটি একটি উন্মুক্ত শব্দভান্ডার থেকে নেওয়া, তাই কিছু শব্দের দুই রকম বানানই থাকতে পারে। তালিকা শুধু পরামর্শ আর নিজে-থেকে-ভরার জন্য: নিজের পছন্দের যেকোনো শব্দ লিখতে বাধা নেই।',
                en: 'The aim is West Bengal spelling. The list comes from an open word list, so a few words may appear in both spellings. It is only used for suggestions and auto-fill: you can always type any word you like.',
            },
        },
        {
            q: { bn: 'আমার নিজের শব্দ বসাতে পারব?', en: 'Can I use my own words?' },
            a: {
                bn: 'অবশ্যই। শব্দের ঘরে যেকোনো শব্দ লিখুন; তালিকায় না থাকলে শুধু জানিয়ে দেয়। কিছু শব্দ কখনও চান না? “যে শব্দ কখনও বসবে না” তালিকায় রাখুন।',
                en: 'Of course. Type any word into a slot; if it is not in the list, you are only told so. Never want a word? Put it in the “Words never to use” list.',
            },
        },
        {
            q: { bn: 'বড় ছক ভরা যায় না কেন?', en: 'Why can a big grid fail to fill?' },
            a: {
                bn: 'তালিকায় লম্বা শব্দ কম: সাত অক্ষরের শব্দ প্রায় ১,৯০০টি, নয় অক্ষরের ৬৮টি। তাই লম্বা ঘর কম রেখে মাঝে কালো ঘর দিলে ভরা অনেক সহজ হয়। ভরতে না পারলে অক্ষরখোপ বলে দেয় কোন ঘরটি আটকাচ্ছে।',
                en: 'The list has few long words: about 1,900 words of 7 cells and 68 of 9. Breaking long rows with blocks makes filling much easier. When it cannot fill, Aksharkhop tells you which slot is in the way.',
            },
        },
    ],

    finalTitle: { bn: 'আপনার প্রথম শব্দছক বানিয়ে ফেলুন', en: 'Make your first crossword' },
    finalText: {
        bn: 'নতুন ছক খুলুন, বা আগের সংরক্ষিত কাজ ফাইল থেকে খুলুন।',
        en: 'Open a new grid, or open earlier work from a file.',
    },
    footerCredit: {
        bn: 'শব্দতালিকা: kawshikbuet17/bengali-words (MIT লাইসেন্স)। অক্ষরখোপ একটি অবাণিজ্যিক প্রকল্প।',
        en: 'Word list: kawshikbuet17/bengali-words (MIT licence). Aksharkhop is a non-commercial project.',
    },
};
