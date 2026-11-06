// Batch clue drafting without an API. Three steps, all local:
//   node scripts/clues.ts batches [--size 40] [--limit 200]   writes prompts to paste into a chatbot
//   node scripts/clues.ts import <reply.json ...>             reads the chatbot's replies, writes a review sheet
//   node scripts/clues.ts approve <review_sheet.tsv>          turns your decisions into approved clues
// Approving also rebuilds public/clues.txt (the approved clues the editor suggests; committed).
// Input: data/processed/words.enriched.jsonl (Kaikki meanings; build-only, never shipped) and public/words.txt.

import { appendFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
    approveReview,
    buildBatchPrompt,
    filterDrafts,
    formatClueFile,
    formatReviewTsv,
    parseBatchReply,
    parseReviewTsv,
    readWordFile,
    type BatchEntry,
    type ReviewRow,
} from '../packages/core/src/index.ts';

const root = new URL('..', import.meta.url).pathname;
const dir = join(root, 'data/processed');
const batchDir = join(dir, 'clue_batches');
const draftsPath = join(dir, 'clue_drafts.jsonl');
const approvedPath = join(dir, 'clues.approved.jsonl');
const cluesTxt = join(root, 'public/clues.txt');

const readJsonl = <T>(path: string): T[] =>
    existsSync(path)
        ? readFileSync(path, 'utf8')
              .split('\n')
              .filter((l) => l.trim() !== '')
              .map((l) => JSON.parse(l) as T)
        : [];

interface Draft {
    w: string;
    clue: string;
    status: 'draft' | 'approved' | 'rejected';
}
interface Approved {
    word: string;
    clue: string;
    how: 'draft' | 'edited';
    approved: string;
}

function flag(name: string, fallback: number): number {
    const i = process.argv.indexOf(`--${name}`);
    return i >= 0 ? Number(process.argv[i + 1]) : fallback;
}

function batches(): void {
    const size = flag('size', 40);
    const limit = flag('limit', 0);
    if (!existsSync(join(dir, 'words.enriched.jsonl')))
        throw new Error('data/processed/words.enriched.jsonl is missing (run scripts/build_wordlist.py)');
    const freq = new Map(
        readWordFile(readFileSync(join(root, 'public/words.txt'), 'utf8')).map((r) => [r.w, r.freq]),
    );
    const done = new Set([
        ...readJsonl<Draft>(draftsPath).map((d) => d.w),
        ...readJsonl<Approved>(approvedPath).map((a) => a.word),
    ]);
    let entries: BatchEntry[] = readJsonl<{ w: string; senses: { glosses?: string[] }[] }>(
        join(dir, 'words.enriched.jsonl'),
    )
        .map((e) => ({ w: e.w, glosses: e.senses.flatMap((s) => s.glosses ?? []) }))
        .filter((e) => e.glosses.length > 0 && !done.has(e.w))
        .sort((a, b) => (freq.get(b.w) ?? 0) - (freq.get(a.w) ?? 0));
    if (limit > 0) entries = entries.slice(0, limit);
    mkdirSync(batchDir, { recursive: true });
    let n = readdirSync(batchDir).filter((f) => f.startsWith('batch-')).length;
    for (let i = 0; i < entries.length; i += size) {
        const name = `batch-${String(++n).padStart(3, '0')}.txt`;
        writeFileSync(join(batchDir, name), buildBatchPrompt(entries.slice(i, i + size)));
    }
    console.log(
        `${entries.length} words in ${Math.ceil(entries.length / size)} new batch file(s) in ${batchDir}`,
    );
    console.log(
        'Paste each batch into a chatbot, save its reply as a .json file, then run: node scripts/clues.ts import <reply files>',
    );
}

function importReplies(files: string[]): void {
    if (files.length === 0) throw new Error('give at least one reply file');
    const rows: ReviewRow[] = [];
    const known = new Set(readJsonl<Draft>(draftsPath).map((d) => `${d.w}\t${d.clue}`));
    let dropped = 0;
    for (const f of files) {
        const reply = parseBatchReply(readFileSync(f, 'utf8'));
        if (Object.keys(reply).length === 0) console.warn(`${f}: no usable JSON object found`);
        for (const [w, clues] of Object.entries(reply)) {
            const kept = filterDrafts(clues, w);
            dropped += clues.length - kept.length;
            for (const clue of kept) {
                if (known.has(`${w}\t${clue}`)) continue;
                known.add(`${w}\t${clue}`);
                rows.push({ word: w, clue, decision: '', edited: '' });
                appendFileSync(
                    draftsPath,
                    JSON.stringify({ w, clue, status: 'draft' } satisfies Draft) + '\n',
                );
            }
        }
    }
    const n = readdirSync(dir).filter((f) => /^clue_review_\d+\.tsv$/.test(f)).length + 1;
    const out = join(dir, `clue_review_${String(n).padStart(3, '0')}.tsv`);
    writeFileSync(out, formatReviewTsv(rows));
    console.log(`${rows.length} clues to review (${dropped} dropped: repeats, empty, or gave the word away)`);
    console.log(`Open ${out} in a spreadsheet, then run: node scripts/clues.ts approve ${out}`);
}

function approve(sheet: string | undefined): void {
    if (!sheet) throw new Error('give the review sheet');
    const { approved, refused } = approveReview(parseReviewTsv(readFileSync(sheet, 'utf8')));
    const have = new Set(readJsonl<Approved>(approvedPath).map((a) => `${a.word}\t${a.clue}`));
    const today = new Date().toISOString().slice(0, 10);
    let added = 0;
    for (const a of approved) {
        if (have.has(`${a.word}\t${a.clue}`)) continue;
        have.add(`${a.word}\t${a.clue}`);
        appendFileSync(approvedPath, JSON.stringify({ ...a, approved: today } satisfies Approved) + '\n');
        added++;
    }
    const all = readJsonl<Approved>(approvedPath);
    writeFileSync(cluesTxt, formatClueFile(all.map((a) => ({ word: a.word, clue: a.clue }))));
    console.log(`${added} new approved clue(s); ${all.length} in total. Rebuilt public/clues.txt.`);
    for (const r of refused) console.warn(`Refused (gives the word away): ${r.word}  ${r.edited || r.clue}`);
}

const [cmd, ...rest] = process.argv
    .slice(2)
    .filter((a, i, all) => !a.startsWith('--') && !all[i - 1]?.startsWith('--'));
try {
    if (cmd === 'batches') batches();
    else if (cmd === 'import') importReplies(rest);
    else if (cmd === 'approve') approve(rest[0]);
    else {
        console.error(
            'Usage: node scripts/clues.ts batches [--size N] [--limit N] | import <reply files> | approve <sheet.tsv>',
        );
        process.exit(2);
    }
} catch (e) {
    console.error((e as Error).message);
    process.exit(1);
}
