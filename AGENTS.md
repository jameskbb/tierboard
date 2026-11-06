# Tierboard Agent Rules

`CLAUDE.md` and `AGENTS.md` are the same document under two names so every
coding agent follows identical rules. Change both together; they must stay
byte-identical.

## Purpose

Tierboard is a fast, free tier-ranking web app that runs entirely in the
browser and deploys as a static site on GitHub Pages. The core promise: a group
can open the site, paste a list, and be dragging items into S through F tiers
within 30 seconds, on a laptop, TV or phone, with no login, no backend and no
confusion.

## Install, run, test

Requires Node 22+.

```bash
npm install
npm run dev        # dev server at http://localhost:5173
npm run check      # typecheck, lint, test, build (the CI gate)
```

`npm run check` must pass before every push. Other scripts: `npm test`
(Vitest), `npm run typecheck`, `npm run lint`, `npm run format`,
`npm run build`, `npm run preview`.

## Constraints

- **Stack**: React, TypeScript (strict), Vite, Tailwind CSS, dnd-kit, Lucide,
  zustand for state, idb-keyval for image blobs, Vitest. Keep extra
  dependencies to a minimum.
- **Hosting**: static GitHub Pages under a subpath (`/tierboard/`). Routing
  uses the URL hash and assets use a relative base; the build reads
  `BASE_PATH`.
- **No backend**: all persistence is local (localStorage plus IndexedDB);
  sharing travels in the URL hash. No analytics.
- **Performance**: stay responsive with 100+ items, many tiers and images,
  including during drag.
- **Code quality**: no `any`, no giant components, ESLint and Prettier clean,
  clear feature folders.

## Architecture

- Every board change goes through `useBoardStore.apply(op)`, where `op` is a
  pure function from `src/features/ranking/boardOps.ts`. That single path gives
  undo/redo, autosave and easy tests; do not mutate board state any other way.
- Persistence, sharing and voting sit behind small interfaces
  (`BoardRepository`, `ShareTransport`, `VoteChannel`) so a realtime backend can
  be added later without touching the UI.
- Keep board logic in pure functions with tests next to them (`*.test.ts`).
- Details: `docs/ARCHITECTURE.md`.

## Branches and landing

- Single branch `main`; there is no prod branch.
- Every push to `main` runs `.github/workflows/deploy.yml` and redeploys the
  live GitHub Pages site. Pull requests run the same checks without deploying.
- Never force-push or rewrite published history.

## Never do

- Never write an em dash in code, comments, docs, UI text or commit messages.
  Reword with a colon, semicolon, comma, parentheses or a new sentence; do not
  substitute a hyphen or en dash.
- Never commit secrets or `.env` files (only `.env.example`).
- Never add a backend, login or tracking without an explicit decision.
- Never commit GSD planning state (`.planning/` is ignored).

## README and images

- Interface changes update the README screenshots (`docs/screenshots/`) in the
  same change.
- The title card is `docs/readme-title-tierboard.png`, rendered from
  `docs/src/title-card.html` by `docs/src/render-title-card.mjs`.
- The README stays public-ready: nothing in it should need removing for a
  public audience.
