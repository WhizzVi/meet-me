### 2026-05-30 · Upstash Redis for production, JSON file for dev
After deploying to Vercel, the flow broke at `/when` → `/what`: Vercel's serverless filesystem is read-only, so the JSON-file write in `POST /api/submit` threw `EACCES`, the route returned 500, and the client never navigated. Fixed by making `lib/storage.ts` a backend adapter: Upstash Redis when its env vars are present (prod), JSON file otherwise (dev + tests). Chose Upstash (Marketplace) over Vercel Blob (read-modify-write races on a single file) and Neon Postgres (overkill for a single-invite app). Added a try/catch + log in the submit route and visible error messages in the forms so a future storage misconfig is no longer a silent failure.

### 2026-05-30 · Node 25 dev fix via --localstorage-file
Node 25 exposes a global `localStorage` whose methods throw unless `--localstorage-file` is supplied; Next.js touches it during dev SSR and crashes with "localStorage.getItem is not a function". The `dev`/`start` scripts set `NODE_OPTIONS=--localstorage-file=.localstorage`. Chosen over downgrading Node so the project runs on the user's existing environment unchanged.

### 2026-05-30 · Pin Next.js to the 15.3 line
`create-next-app@latest` installs Next 16; the project requirement is explicitly Next 15.3. Pinned `next` and `eslint-config-next` to `15.3.5` (React stays 19). Accepting the newer major would diverge from the requested target.

### 2026-05-30 · JSON file storage over a database
Single-invitation app; the viewer needs cross-device read on `/show`. A JSON file via Route Handlers is the simplest durable option — no DB dependency. Each pass creates a new attempt so every try stays visible with its own fill timestamp.

### 2026-05-30 · Sliding runaway "No" button, not teleport
Per request the button must visibly move. CSS `transition` on `left`/`top` (~0.18s) produces a fast glide instead of an instant jump, and the same `flee()` fires on both cursor approach (`mouseenter`) and touch (`pointerdown`), so it works on desktop and mobile.
