// Compares data/test/segmentation.tsv with Pataparbon's akshara splitter.
// Usage: node scripts/check-segmentation.mjs [path/to/pataparbon/resources/js/lib/akshara.js]
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const splitterPath = resolve(process.argv[2] ?? '../pataparbon/resources/js/lib/akshara.js');
const { splitAkshara } = await import(pathToFileURL(splitterPath));

const lines = readFileSync(new URL('../data/test/segmentation.tsv', import.meta.url), 'utf8').split('\n');
let total = 0;
const bad = [];

for (const [i, line] of lines.entries()) {
    if (line.trim() === '' || line.startsWith('#')) continue;
    const [word, expected] = line.split('\t');
    total++;
    const actual = splitAkshara(word).join('|');
    if (actual !== expected.normalize('NFC'))
        bad.push(`line ${i + 1}: ${word}  expected ${expected}  Pataparbon ${actual}`);
}

console.log(`${total - bad.length}/${total} agree with Pataparbon`);
bad.forEach((b) => console.log(b));
process.exitCode = bad.length ? 1 : 0;
