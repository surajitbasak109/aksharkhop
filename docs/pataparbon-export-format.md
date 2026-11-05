# Export format: Aksharkhop → Pataparbon

Aksharkhop's main export is a JSON file that the **Pataparbon** app imports in **Admin → Crosswords → New** (paste the JSON or upload the `.json` file).

Example: [pataparbon-export.json](../packages/core/test/fixtures/pataparbon-export.json)

**Source of truth is Pataparbon.** If this file and Pataparbon disagree, Pataparbon wins. Update this file to match.

| Pataparbon file                                           | What it defines                                      |
| --------------------------------------------------------- | ---------------------------------------------------- |
| `docs/crossword-format.md`                                | The format, for humans                               |
| `app/Services/Crossword/CrosswordValidator.php`           | Every rule an import must pass                       |
| `app/Services/Crossword/CrosswordNumberer.php`            | How clue numbers are assigned                        |
| `app/Services/Crossword/CrosswordJson.php`                | Parsing (NFC-normalizes the whole JSON first)        |
| `app/Support/Akshara.php` + `resources/js/lib/akshara.js` | The akshara splitter (identical regex in PHP and JS) |
| `tests/fixtures/akshara.json`                             | Shared akshara test cases                            |

---

## Shape

```json
{
  "grid": {
    "cells": [
      [{"s": "ক"}, {"s": "খ"}, {"b": 1}],
      ...
    ]
  },
  "clues": {
    "across": [{"n": 1, "r": 0, "c": 0, "len": 5, "clue": "…"}],
    "down":   [{"n": 1, "r": 0, "c": 0, "len": 5, "clue": "…"}]
  }
}
```

| Field                             | Type                                      | Meaning                                           |
| --------------------------------- | ----------------------------------------- | ------------------------------------------------- |
| `grid.cells`                      | array of rows; each row an array of cells | Row-major, top to bottom, left to right           |
| cell `{"s": "…"}`                 | string                                    | White cell: its solution, **exactly one akshara** |
| cell `{"b": 1}`                   | `1`                                       | Black block                                       |
| `clues.across[]` / `clues.down[]` | array                                     | One object per entry (word of 2+ cells)           |
| `n`                               | int                                       | Clue number (see numbering below)                 |
| `r`, `c`                          | int, 0-based                              | Start cell row and column                         |
| `len`                             | int                                       | Length in cells (aksharas), not characters        |
| `clue`                            | string                                    | Non-empty clue text                               |

Not in the JSON: puzzle date, rows and columns. The Pataparbon admin enters those in its form, and rows/cols must match the grid.

## Rules (all must pass, or Pataparbon rejects the import)

1. **Size:** 5 to 15 rows and 5 to 15 columns. Every row is the same length.
2. **Cells:** each white cell's `s` is exactly one akshara according to Pataparbon's splitter. `ক্ষ`, `শ্রী`, `কি`, `চাঁ`, `অ্যা` are one cell each (ঁ stays with its letter). The marks `ং` and `ঃ` and the letter `ৎ` are **not** part of the letter before them: each takes a cell of its own (`অংশ` = `অ|ং|শ`, `দুঃখ` = `দু|ঃ|খ`, `উৎসব` = `উ|ৎ|স|ব`; this changed on 2026-11-05). No empty white cells: the grid must be completely filled.
3. **No orphan cells:** every white cell is part of at least one across or down entry of 2+ cells.
4. **Numbering:** scan row by row, left to right. A white cell gets the next number if it starts an across entry (left is edge/block and right is white) **or** a down entry (above is edge/block and below is white). One number per cell, even if it starts both.
5. **Clues:** exactly one clue per entry in each direction, `n` matching the numbering. No extra clues, and no empty clue text.
6. **Positions:** `r`, `c` and `len` must match the numbered entry. Pataparbon treats them as optional, but **Aksharkhop always writes them**.
7. **Text:** NFC-normalized. NFC keeps ড় ঢ় য় **decomposed** (base letter + nukta U+09BC), since the precomposed forms are Unicode composition exclusions. Don't try to precompose them. ZWJ/ZWNJ are removed from cell text.

## Writing the file

- UTF-8, Bengali written as-is rather than as `\uXXXX` escapes, pretty-printed with 4-space indent (the same as PHP `JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT`).
- Write `across` before `down`, with each list sorted by `n`. Key order inside objects doesn't matter.
- Default filename: `<slug>-<YYYY-MM-DD>.json`, e.g. `shobdochhok-2026-11-04.json`.
- Only puzzle data goes in the file: no answers list, no metadata, no internal IDs. Aksharkhop's own save file (with title, author, locked words, etc.) is a separate format. This is an **export**, not a save.

## Aksharkhop requirements

- **Same splitter:** Aksharkhop's segmenter must split text exactly like Pataparbon's `akshara.js`. Port that regex as-is, and run Pataparbon's `tests/fixtures/akshara.json` cases in Aksharkhop's test suite (keep a copy in `data/test/`, and note in PROGRESS.md whenever it is re-synced).
- **Same numbering:** port `CrosswordNumberer` to TypeScript. Test it on the example file: numbers 1, 2, 3 at the top row; across 1, 4, 5; down 1, 2, 3.
- **Check before export:** run all the rules above in Aksharkhop and block the export with bilingual messages (Bengali / English, same wording style as Pataparbon) if any fail.
- **Round-trip test:** export → parse → compare. The example file must re-export to exactly the same data.
- **Import too (nice to have):** loading a Pataparbon JSON file into the editor lets old puzzles be edited.
