# Aksharkhop (অক্ষরখোপ)

A Bengali crossword builder: one akshara per cell, with export to the Pataparbon app.

Status: Phases 0–6 and 8 done (editor, clues, print, Pataparbon export, word suggestions, auto-fill, solver and
share links, landing page, Vercel setup). Phase 7 (AI clue drafting) is optional and not started. See the
[Pataparbon export format](docs/pataparbon-export-format.md).

```bash
pnpm install
pnpm test
pnpm seg ক্ষমা     # ক্ষ|মা
```

Needs Node 22.18 or newer and pnpm.

## Pages

| Address               | Page                                                                     |
| --------------------- | ------------------------------------------------------------------------ |
| `/`                   | Landing page: what it is, features, how to use it, who it is for, FAQ    |
| `/editor`             | Build a crossword                                                        |
| `/solve`              | Open a crossword to solve (paste a link, open a file, or try the sample) |
| `/solve#solve=<code>` | A shared crossword (the Share button makes this link)                    |
| `/solve/sample`       | The built-in sample                                                      |

## Deploy to Vercel

`vercel.json` already holds the settings: install with `pnpm install --frozen-lockfile`, build with
`pnpm build`, publish `dist` (the build writes there, at the repository root), and send every address to `index.html` so deep links such as
`/solve` work.

1. Import the repository in Vercel. Leave the root directory as the repository root.
2. Deploy.

**The word list is in the repository** as `public/words.txt` (about 2 MB, 0.35 MB once Vercel compresses
it): one word per line with its frequency score. The app splits the words into aksharas itself when it
loads. `python3 scripts/build_wordlist.py` (needs `data/raw/`) rebuilds it, and also writes the full
`public/words.bn.json`, which is not committed and not used by the app. To load the list from somewhere
else, host it (the server must allow cross-origin requests) and set `VITE_WORDS_URL` in the Vercel project
settings, then redeploy.

## Licence

The code is released under the [MIT licence](LICENSE). The word list in `public/words.txt` comes from an
MIT-licensed dataset: see [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).

## Credits

**Word list.** The words in `public/words.txt` come from
[kawshikbuet17/bengali-words](https://huggingface.co/datasets/kawshikbuet17/bengali-words) on Hugging Face
(MIT licence, per the dataset card). The frequency scores are numbers worked out from the Bengali word counts
in [orgtre/top-open-subtitles-sentences](https://github.com/orgtre/top-open-subtitles-sentences), which come
from the OpenSubtitles2018 corpus. Only the numbers are shipped, not that list, and the corpus licence is
not clearly stated, so treat it as unverified.

**Used to build the list, not shipped.** These sources are read on the build machine to check, rank and
filter words. None of their words or text is in this repository, and `data/raw/` is never committed:

- IndoWordNet Bengali word list, IIT Bombay CFILT (CC BY-NC-SA 4.0), via
  [cfilt/iwn_wordlists](https://huggingface.co/datasets/cfilt/iwn_wordlists)
- Hunspell `bn_BD` dictionary from [LibreOffice/dictionaries](https://github.com/LibreOffice/dictionaries) (GPL v2)
- [MinhasKamal/BengaliDictionary](https://github.com/MinhasKamal/BengaliDictionary) (GPL v3)
- [Kaikki.org](https://kaikki.org/dictionary/Bengali/) Bengali entries, extracted from English Wiktionary by
  wiktextract (Tatu Ylonen), CC BY-SA

Where each source comes from, its licence, and whether it ships are recorded in
[`data/SOURCES.md`](data/SOURCES.md).

**Pataparbon.** The akshara splitting, the clue numbering and the export format follow the Pataparbon app.
`packages/core/src/segment.ts` is a port of Pataparbon's splitter, and the tests use Pataparbon's own cases.

**Phonetic typing** follows the idea of the Avro layout (Latin letters typed as Bengali) but is our own
implementation, not a copy of Avro.

**Font.** Noto Sans Bengali, from Google Fonts (SIL Open Font License).

**Built with** React, React Router, Vite, TypeScript and Vitest.
