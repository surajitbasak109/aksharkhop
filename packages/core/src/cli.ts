// Prints the cells of a word, or of every line of a file.
//   pnpm seg ক্ষমা              ->  ক্ষ|মা
//   pnpm seg words.txt         ->  one "word<TAB>cells" line per input line
//   pnpm seg --json words.txt  ->  JSON lines: {"w": "...", "cells": [...]}
import { existsSync, readFileSync } from 'node:fs';
import { normalize } from './normalize.ts';
import { segment } from './segment.ts';

const args = process.argv.slice(2);
const json = args[0] === '--json';
const input = json ? args[1] : args[0];

if (!input) {
    console.error('Usage: pnpm seg [--json] <word | file>');
    process.exit(2);
}

const words = existsSync(input) ? readFileSync(input, 'utf8').replace(/^﻿/, '').split(/\r?\n/) : [input];

for (const raw of words) {
    const w = normalize(raw);
    if (w === '') continue;
    const cells = segment(w);
    console.log(json ? JSON.stringify({ w, cells }) : `${w}\t${cells.join('|')}`);
}
