# Aksharkhop (অক্ষরখোপ)

A Bengali crossword builder: one akshara per cell, with export to the Pataparbon app.

Status: Phases 0–6 done, plus the site (landing page, routes, Vercel). See `.claude/PROGRESS.md`.

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
`pnpm build`, publish `apps/web/dist`, and send every address to `index.html` so deep links such as
`/solve` work.

1. Import the repository in Vercel. Leave the root directory as the repository root.
2. Deploy.

**The word list is in the repository** as `public/words.txt` (about 2 MB, 0.35 MB once Vercel compresses
it): one word per line with its frequency score. The app splits the words into aksharas itself when it
loads. `python3 scripts/build_wordlist.py` (needs `data/raw/`) rebuilds it, and also writes the full
`public/words.bn.json`, which is not committed and not used by the app. To load the list from somewhere
else, host it (the server must allow cross-origin requests) and set `VITE_WORDS_URL` in the Vercel project
settings, then redeploy.
