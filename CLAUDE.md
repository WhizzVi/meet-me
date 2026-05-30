# CLAUDE.md

Next.js 15.3 App Router app (TypeScript). A playful, pastel-cat-themed romantic date-invitation flow.

## Map
- Storage: `lib/storage.ts` — the ONLY place that touches `data/submissions.json`. Each pass through the app creates a NEW attempt (never overwrites), so all attempts stay visible.
- Dishes: `lib/dishes.ts` — single source of truth for the dish list (`DISHES`, `dishLabel`).
- Sessions: `lib/session.ts` — `sid` cookie correlates one attempt across `/when` → `/what` → `/final`; `show_auth` gates `/show`. `cookies()` is async in Next 15 — always `await`.
- Runaway button: `components/NoButton.tsx` — slides via CSS transition on `left`/`top` (not a teleport); flees on `mouseenter` (desktop) and `pointerdown` (touch), switching the emoji to 😏.
- API: `app/api/submit` (create on `{date,time}` / update on `{dish}`), `app/api/submission` (read current by sid), `app/api/show-login` (password → `show_auth`).
- Theme: `app/globals.css` — pastel palette + shared classes + hearts animation. `components/HeartsBackground.tsx` renders the floating glyphs. `components/cats.tsx` is the cat emoji.

## Commands
- `npm run dev` — dev server (port 3000)
- `npm run build` — production build
- `npm test` — Vitest unit tests (storage + dishes)

## Gotchas
- **Node 25 + Next dev:** Node 25 ships a `localStorage` global whose methods throw without `--localstorage-file`, crashing Next SSR. The `dev` and `start` scripts set `NODE_OPTIONS=--localstorage-file=.localstorage` to fix this. Do NOT run `next dev` directly — use `npm run dev`.
- `SHOW_PASSWORD` lives in `.env.local` (gitignored). Without it, `/show` login always fails.
- `data/submissions.json` is gitignored and created on first submit. Delete it to reset all attempts.
- Tests point storage at `data/submissions.test.json` via the `SUBMISSIONS_FILE` env var; Vitest resolves the `@/` alias via `resolve.alias` in `vitest.config.ts`.
