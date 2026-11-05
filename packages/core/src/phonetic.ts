// Phonetic typing: Latin letters → Bengali, in the style of Avro Phonetic (not an exact copy of it).
//
// Rules:
//   - A vowel after a consonant becomes its sign (ka → কা); anywhere else it is the full vowel (a → আ).
//     `o` after a consonant writes nothing (the unwritten inherent vowel): kolom → কলম.
//   - Two consonants next to each other join with a hasanta: kSh → ক্ষ, sondhya → সন্ধ্যা, kormo → কর্ম.
//     Type `o` between them to keep them apart: amora → আমরা.
//   - Letters are case-sensitive where the table has both (t ত / T ট); other capitals act as lower case.
//   - ` (backtick) separates without writing anything; ,, writes a hasanta (্) by hand.
//   - Anything else, Bengali text included, is kept as it is. So text typed with a Bengali keyboard
//     or pasted passes through unchanged.
//
// The output is NFC, like everything else: ড় ঢ় য় come out decomposed (base + nukta).

type Kind = 'consonant' | 'vowel' | 'mark' | 'hasanta' | 'separator';

interface Rule {
    kind: Kind;
    /** Consonant or mark text; for a vowel, the full (independent) form. */
    text: string;
    /** Vowel sign written after a consonant ('' for the inherent o). */
    sign?: string;
}

const V = (text: string, sign: string): Rule => ({ kind: 'vowel', text, sign });
const C = (text: string): Rule => ({ kind: 'consonant', text });
const M = (text: string): Rule => ({ kind: 'mark', text });

/** The table, also shown in the editor's help. Keys are what you type. */
export const PHONETIC_TABLE: Readonly<Record<string, Rule>> = {
    // Vowels
    o: V('অ', ''),
    a: V('আ', 'া'),
    i: V('ই', 'ি'),
    I: V('ঈ', 'ী'),
    ee: V('ঈ', 'ী'),
    u: V('উ', 'ু'),
    oo: V('উ', 'ু'),
    U: V('ঊ', 'ূ'),
    rri: V('ঋ', 'ৃ'),
    e: V('এ', 'ে'),
    OI: V('ঐ', 'ৈ'),
    O: V('ও', 'ো'),
    OU: V('ঔ', 'ৌ'),

    // Consonants
    k: C('ক'),
    kh: C('খ'),
    g: C('গ'),
    gh: C('ঘ'),
    Ng: C('ঙ'),
    c: C('চ'),
    ch: C('ছ'),
    j: C('জ'),
    jh: C('ঝ'),
    NG: C('ঞ'),
    T: C('ট'),
    Th: C('ঠ'),
    D: C('ড'),
    Dh: C('ঢ'),
    N: C('ণ'),
    t: C('ত'),
    th: C('থ'),
    d: C('দ'),
    dh: C('ধ'),
    n: C('ন'),
    p: C('প'),
    ph: C('ফ'),
    f: C('ফ'),
    b: C('ব'),
    bh: C('ভ'),
    v: C('ভ'),
    m: C('ম'),
    z: C('য'),
    y: C('য়'), // but য after a consonant (য-ফলা: byakti → ব্যক্তি)
    Y: C('য়'),
    r: C('র'),
    l: C('ল'),
    sh: C('শ'),
    S: C('শ'),
    Sh: C('ষ'),
    s: C('স'),
    h: C('হ'),
    R: C('ড়'),
    Rh: C('ঢ়'),
    x: C('ক্স'),

    // Marks
    ng: M('ং'),
    ':': M('ঃ'),
    '^': M('ঁ'),
    't``': M('ৎ'),
    ',,': { kind: 'hasanta', text: '্' },
    '`': { kind: 'separator', text: '' },
};

const KEYS = Object.keys(PHONETIC_TABLE).sort((a, b) => b.length - a.length);
const LONGEST = KEYS[0]!.length;

function match(input: string, at: number): [string, Rule] | null {
    for (let len = Math.min(LONGEST, input.length - at); len > 0; len--) {
        const piece = input.slice(at, at + len);
        const exact = PHONETIC_TABLE[piece];
        if (exact) return [piece, exact];
    }
    // Capitals that have no rule of their own act as lower case (K → ক). One letter at a time, so
    // a capital never changes how the letters after it are read.
    const ch = input[at]!;
    const lower = ch.toLowerCase();
    if (lower !== ch) {
        for (let len = Math.min(LONGEST, input.length - at); len > 0; len--) {
            const piece = lower + input.slice(at + 1, at + len);
            const rule = PHONETIC_TABLE[piece];
            if (rule) return [input.slice(at, at + len), rule];
        }
    }
    return null;
}

/** Converts phonetic Latin to Bengali. Never throws; unknown characters are kept. */
export function phoneticToBengali(input: string): string {
    let out = '';
    let prev: 'consonant' | 'other' = 'other';

    for (let i = 0; i < input.length;) {
        const m = match(input, i);
        if (!m) {
            out += input[i];
            i++;
            prev = 'other';
            continue;
        }
        const [piece, rule] = m;
        i += piece.length;

        switch (rule.kind) {
            case 'consonant': {
                // After a consonant, y is the য of য-ফলা (ব্যক্তি), not য়.
                const text = prev === 'consonant' && piece === 'y' ? 'য' : rule.text;
                if (prev === 'consonant') out += '্';
                out += text;
                prev = 'consonant';
                break;
            }
            case 'vowel':
                out += prev === 'consonant' ? rule.sign! : rule.text;
                prev = 'other';
                break;
            case 'hasanta':
                out += rule.text;
                prev = 'other';
                break;
            case 'mark':
            case 'separator':
                out += rule.text;
                prev = 'other';
                break;
        }
    }

    return out.normalize('NFC');
}
