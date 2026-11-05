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

**The word list is not in the repository** (`public/words.bn.json`, built by
`python3 scripts/build_wordlist.py` from `data/raw/`). Without it a deployed site works, but word
suggestions and auto-fill say that the word list was not found. To give the deployed site the word list,
either add the file to the deployment, or host it somewhere that allows cross-origin requests and set
`VITE_WORDS_URL` to its address in the Vercel project settings, then redeploy.
