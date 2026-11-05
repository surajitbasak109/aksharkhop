# Aksharkhop (অক্ষরখোপ)

Bengali crossword builder. One crossword cell = one akshara. The main output is a JSON file for the Pataparbon app (`../pataparbon`).

Read these first, in order:

1. `.claude/PLAN.md`: goal, hard rules, tech stack
2. `.claude/PHASES.md`: phases, tasks and subtasks (IDs like `P1.3.2`)
3. `.claude/PROGRESS.md`: current status, decisions, session log. **Update it at the end of every session.**
4. `.claude/EXPORT-FORMAT.md`: the Pataparbon export format

Rules that are easy to break:

- Work one phase at a time. Stop after each phase and wait for the human's approval.
- Pataparbon is the source of truth for akshara splitting, numbering and the export format. Don't edit Pataparbon unless the human asks you to (the splitter has to change there first). `packages/core/src/segment.ts` is a port of `../pataparbon/resources/js/lib/akshara.js`: don't change its regex. If a case seems wrong, report it.
- NFC keeps ড় ঢ় য় decomposed. Do not precompose them.
- `data/raw/` is untracked third-party data. Only the source marked "ship" in `data/SOURCES.md` may feed the shipped word list.
- Don't use `Intl.Segmenter`.

Commands (from the repo root):

- `pnpm dev` runs the editor at http://localhost:5173 (`pnpm build` builds it)
- `pnpm test` / `pnpm typecheck` / `pnpm lint` / `pnpm format`
- `pnpm seg ক্ষমা` prints the cells; `pnpm seg words.txt` does a file
- `python3 scripts/build_wordlist.py` rebuilds `public/words.bn.json` (untracked) and `public/words.txt` (the small list the app loads, committed) (needs `data/raw/`); `python3 -m unittest discover -s scripts -v` tests it
- `node scripts/check-segmentation.mjs` compares `data/test/segmentation.tsv` with Pataparbon's splitter
