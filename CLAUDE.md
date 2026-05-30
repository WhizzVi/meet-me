# CLAUDE.md

Next.js 15.3 App Router app (TypeScript). A playful, pastel-cat-themed romantic date-invitation flow.

## Map
- Storage: `lib/storage.ts` — backend adapter. Uses **Upstash Redis** when REST creds are present, otherwise falls back to a local JSON file `data/submissions.json` (dev + tests). `redisCreds()` resolves creds from `UPSTASH_REDIS_REST_URL/TOKEN`, plain `KV_REST_API_URL/TOKEN`, OR any **prefixed** pair (Vercel's Upstash integration injects e.g. `DATE_INVITE_REDDIS_KV_REST_API_URL/TOKEN`) — it scans env keys ending in `KV_REST_API_URL` and pairs the matching token. Same async interface (`createAttempt`/`setDish`/`getAttempt`/`getAllAttempts`). Redis stores each attempt in the `attempts` hash keyed by id. `GET /api/health` reports the active backend + a live redis ping for debugging.
- Dishes: `lib/dishes.ts` — single source of truth for the dish list (`DISHES`, `dishLabel`).
- Sessions: `lib/session.ts` — `sid` cookie correlates one attempt across `/when` → `/what` → `/final`; `show_auth` gates `/show`. `cookies()` is async in Next 15 — always `await`.
- Runaway button: `components/NoButton.tsx` — slides via CSS transition on `left`/`top` (not a teleport); flees on `mouseenter` (desktop) and `pointerdown` (touch), switching the emoji to 😏.
- API: `app/api/submit` (create on `{date,time}` / update on `{dish}`), `app/api/show-login` (password → `show_auth`). `/final` reads its attempt server-side via `getAttempt(sid)` — no read API needed.
- Theme: `app/globals.css` — pastel palette + shared classes + hearts animation. `components/HeartsBackground.tsx` renders the floating glyphs. `components/cats.tsx` is the cat emoji.

## Commands
- `npm run dev` — dev server (port 3000)
- `npm run build` — production build
- `npm test` — Vitest unit tests (storage + dishes)

## Gotchas
- **Node 25 + Next dev:** Node 25 ships a `localStorage` global whose methods throw without `--localstorage-file`, crashing Next SSR. The `dev` and `start` scripts set `NODE_OPTIONS=--localstorage-file=.localstorage` to fix this. Do NOT run `next dev` directly — use `npm run dev`.
- `SHOW_PASSWORD` lives in `.env.local` (gitignored). Without it, `/show` login always fails.
- `data/submissions.json` is gitignored and created on first submit (local/dev only). Delete it to reset local attempts.
- **Vercel filesystem is read-only** — the JSON-file backend CANNOT work there (writes throw `EACCES`/`EROFS` → API 500 → page won't advance). Production MUST use Redis. Provision an Upstash store via Vercel Marketplace (Storage → it auto-injects `UPSTASH_REDIS_REST_URL`/`_TOKEN`), then `vercel env pull .env.local` for local Redis testing.
- Tests: file-backend tests force the file path (clear UPSTASH env); the Redis-backend test (`tests/storage-redis.test.ts`) mocks `@upstash/redis`. Vitest resolves `@/` via `resolve.alias` in `vitest.config.ts`.
