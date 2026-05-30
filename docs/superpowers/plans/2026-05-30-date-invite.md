# Date Invite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A playful, pastel-cat-themed romantic date invitation web app where the girl answers a question, picks date/time and a dish (all saved to a JSON file), and the author views every attempt on a password-protected `/show` page.

**Architecture:** Single Next.js 15.3 App Router project (TypeScript). Pages are React components; a runaway "No" button (client component) slides away fast from cursor/touch. State is persisted to `data/submissions.json` through Route Handlers. Each full pass creates a new attempt record (never overwritten), correlated via an `sid` cookie. `/show` is gated by a simple password stored in `.env.local`.

**Tech Stack:** Next.js 15.3 (App Router), React 19, TypeScript, plain CSS (pastel theme + CSS animations), inline SVG + emoji for cats/hearts, Vitest for unit tests, Node `fs` for JSON storage.

---

## File Structure

```
date-invite/
  package.json
  next.config.ts
  tsconfig.json
  vitest.config.ts
  .env.local                     # SHOW_PASSWORD (gitignored)
  app/
    layout.tsx                   # root layout: fonts, hearts background, theme
    globals.css                  # pastel theme + shared classes + animations
    page.tsx                     # "/" question + Yes button + runaway No button
    when/page.tsx                # "/when" date & time picker
    what/page.tsx                # "/what" dish selection
    final/page.tsx               # "/final" summary (server component, reads sid)
    show/page.tsx                # "/show" password gate + attempts table
    api/
      submit/route.ts            # POST: create (date/time) or update (dish) by sid
      submission/route.ts        # GET: one record by sid (for /final)
      show-login/route.ts        # POST: verify password -> session cookie
  components/
    NoButton.tsx                 # runaway No button (client)
    HeartsBackground.tsx         # floating hearts/paws (client)
    DishPicker.tsx               # dish buttons grid (client)
    WhenForm.tsx                 # date/time form (client)
    cats.tsx                     # inline SVG cat illustrations + helpers
  lib/
    storage.ts                   # types + read/write submissions.json
    session.ts                   # sid + show-session cookie helpers
    dishes.ts                    # dish catalog (id, label, emoji)
  data/
    submissions.json             # created at runtime (gitignored)
  tests/
    storage.test.ts
    dishes.test.ts
```

Responsibilities:
- `lib/storage.ts` — pure-ish data layer: read all, append attempt, update attempt by id, find by id. Only place that touches the JSON file.
- `lib/session.ts` — wraps Next `cookies()` for `sid` (attempt correlation) and `show_auth` (viewer session).
- `lib/dishes.ts` — single source of truth for the dish list (used by `/what`, `/final`, `/show`).
- `components/*` — focused client components; pages stay thin and orchestrate.

---

## Task 1: Scaffold project and dependencies

**Files:**
- Create: `date-invite/package.json`, `tsconfig.json`, `next.config.ts`, `vitest.config.ts`, `app/layout.tsx`, `app/globals.css`, `app/page.tsx`

- [ ] **Step 1: Scaffold Next.js app**

Run from `/Users/viktor/Work/pycharm/agents`:

```bash
cd /Users/viktor/Work/pycharm/agents/date-invite
npx create-next-app@latest . --ts --app --no-src-dir --no-tailwind --eslint --import-alias "@/*" --use-npm --yes
```

If the directory is non-empty (it already has `.git`, `docs/`, `.gitignore`), create-next-app may refuse. In that case scaffold in a temp dir and move files in:

```bash
cd /tmp && rm -rf di-scaffold && npx create-next-app@latest di-scaffold --ts --app --no-src-dir --no-tailwind --eslint --import-alias "@/*" --use-npm --yes
rsync -a --exclude .git --exclude .gitignore /tmp/di-scaffold/ /Users/viktor/Work/pycharm/agents/date-invite/
```

- [ ] **Step 2: Add Vitest dev dependency**

```bash
cd /Users/viktor/Work/pycharm/agents/date-invite
npm install -D vitest
```

- [ ] **Step 3: Add test script and create vitest config**

Edit `package.json` `"scripts"` to include:

```json
"test": "vitest run"
```

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
```

- [ ] **Step 4: Verify dev server boots**

Run: `npm run dev` then open `http://localhost:3000`.
Expected: default Next.js page renders, no errors. Stop the server (Ctrl-C) after confirming.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: scaffold next.js app with vitest"
```

---

## Task 2: Storage layer

**Files:**
- Create: `lib/storage.ts`
- Test: `tests/storage.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/storage.test.ts`:

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { promises as fs } from "fs";
import path from "path";
import { createAttempt, setDish, getAttempt, getAllAttempts } from "@/lib/storage";

const DATA_FILE = path.join(process.cwd(), "data", "submissions.test.json");

beforeEach(async () => {
  await fs.rm(DATA_FILE, { force: true });
  process.env.SUBMISSIONS_FILE = DATA_FILE;
});

describe("storage", () => {
  it("creates an attempt with date/time and timestamps", async () => {
    const attempt = await createAttempt({ date: "2026-06-01", time: "19:30" });
    expect(attempt.id).toBeTruthy();
    expect(attempt.date).toBe("2026-06-01");
    expect(attempt.time).toBe("19:30");
    expect(attempt.dish).toBeNull();
    expect(attempt.createdAt).toBeTruthy();
    expect(attempt.updatedAt).toBe(attempt.createdAt);
  });

  it("sets dish on an existing attempt and bumps updatedAt", async () => {
    const created = await createAttempt({ date: "2026-06-01", time: "19:30" });
    const updated = await setDish(created.id, "sushi");
    expect(updated?.dish).toBe("sushi");
    expect(updated?.updatedAt).not.toBe(created.updatedAt);
  });

  it("keeps each pass as a separate attempt", async () => {
    await createAttempt({ date: "2026-06-01", time: "19:30" });
    await createAttempt({ date: "2026-06-02", time: "20:00" });
    const all = await getAllAttempts();
    expect(all).toHaveLength(2);
  });

  it("returns null for unknown id", async () => {
    expect(await getAttempt("nope")).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — cannot resolve `@/lib/storage`.

- [ ] **Step 3: Write minimal implementation**

Create `lib/storage.ts`:

```ts
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";

export type Attempt = {
  id: string;
  date: string;
  time: string;
  dish: string | null;
  createdAt: string;
  updatedAt: string;
};

function dataFile(): string {
  return process.env.SUBMISSIONS_FILE ?? path.join(process.cwd(), "data", "submissions.json");
}

async function readAll(): Promise<Attempt[]> {
  try {
    const raw = await fs.readFile(dataFile(), "utf8");
    return JSON.parse(raw) as Attempt[];
  } catch {
    return [];
  }
}

async function writeAll(attempts: Attempt[]): Promise<void> {
  const file = dataFile();
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(attempts, null, 2), "utf8");
}

export async function createAttempt(input: { date: string; time: string }): Promise<Attempt> {
  const now = new Date().toISOString();
  const attempt: Attempt = {
    id: randomUUID(),
    date: input.date,
    time: input.time,
    dish: null,
    createdAt: now,
    updatedAt: now,
  };
  const all = await readAll();
  all.push(attempt);
  await writeAll(all);
  return attempt;
}

export async function setDish(id: string, dish: string): Promise<Attempt | null> {
  const all = await readAll();
  const attempt = all.find((item) => item.id === id);
  if (!attempt) return null;
  attempt.dish = dish;
  attempt.updatedAt = new Date().toISOString();
  await writeAll(all);
  return attempt;
}

export async function getAttempt(id: string): Promise<Attempt | null> {
  const all = await readAll();
  return all.find((item) => item.id === id) ?? null;
}

export async function getAllAttempts(): Promise<Attempt[]> {
  return readAll();
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/storage.ts tests/storage.test.ts vitest.config.ts package.json
git commit -m "feat: json storage layer for date attempts"
```

---

## Task 3: Dish catalog

**Files:**
- Create: `lib/dishes.ts`
- Test: `tests/dishes.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/dishes.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { DISHES, dishLabel } from "@/lib/dishes";

describe("dishes", () => {
  it("has 7 dishes with unique ids", () => {
    const ids = DISHES.map((dish) => dish.id);
    expect(ids).toHaveLength(7);
    expect(new Set(ids).size).toBe(7);
  });

  it("resolves a label by id", () => {
    expect(dishLabel("sushi")).toBe("суши");
  });

  it("returns the id itself for unknown dish", () => {
    expect(dishLabel("mystery")).toBe("mystery");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — cannot resolve `@/lib/dishes`.

- [ ] **Step 3: Write minimal implementation**

Create `lib/dishes.ts`:

```ts
export type Dish = {
  id: string;
  label: string;
  emoji: string;
};

export const DISHES: Dish[] = [
  { id: "ramen", label: "рамен", emoji: "🍜" },
  { id: "seafood", label: "морепродукты", emoji: "🦐" },
  { id: "pasta", label: "паста", emoji: "🍝" },
  { id: "steak", label: "стейк", emoji: "🥩" },
  { id: "sushi", label: "суши", emoji: "🍣" },
  { id: "borsch", label: "борщ", emoji: "🥣" },
  { id: "dessert", label: "десертики", emoji: "🍰" },
];

export function dishLabel(id: string): string {
  return DISHES.find((dish) => dish.id === id)?.label ?? id;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/dishes.ts tests/dishes.test.ts
git commit -m "feat: dish catalog"
```

---

## Task 4: Session helpers

**Files:**
- Create: `lib/session.ts`

- [ ] **Step 1: Implement session helpers**

Create `lib/session.ts` (Next 15 `cookies()` is async — always `await`):

```ts
import { cookies } from "next/headers";

const SID = "sid";
const SHOW_AUTH = "show_auth";

export async function setSid(id: string): Promise<void> {
  const store = await cookies();
  store.set(SID, id, { httpOnly: true, sameSite: "lax", path: "/" });
}

export async function getSid(): Promise<string | null> {
  const store = await cookies();
  return store.get(SID)?.value ?? null;
}

export async function grantShowAccess(): Promise<void> {
  const store = await cookies();
  store.set(SHOW_AUTH, "1", { httpOnly: true, sameSite: "lax", path: "/" });
}

export async function hasShowAccess(): Promise<boolean> {
  const store = await cookies();
  return store.get(SHOW_AUTH)?.value === "1";
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/session.ts
git commit -m "feat: cookie session helpers"
```

---

## Task 5: API route handlers

**Files:**
- Create: `app/api/submit/route.ts`, `app/api/submission/route.ts`, `app/api/show-login/route.ts`
- Create: `.env.local`

- [ ] **Step 1: Create `.env.local`**

```bash
printf 'SHOW_PASSWORD=meow-please-2026\n' > /Users/viktor/Work/pycharm/agents/date-invite/.env.local
```

- [ ] **Step 2: Implement submit route**

Create `app/api/submit/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { createAttempt, setDish } from "@/lib/storage";
import { setSid, getSid } from "@/lib/session";

export async function POST(request: NextRequest) {
  const body = await request.json();

  if (typeof body.date === "string" && typeof body.time === "string") {
    const attempt = await createAttempt({ date: body.date, time: body.time });
    await setSid(attempt.id);
    return NextResponse.json({ ok: true, id: attempt.id });
  }

  if (typeof body.dish === "string") {
    const sid = await getSid();
    if (!sid) return NextResponse.json({ ok: false, error: "no_sid" }, { status: 400 });
    const updated = await setDish(sid, body.dish);
    if (!updated) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
}
```

- [ ] **Step 3: Implement submission GET route**

Create `app/api/submission/route.ts`:

```ts
import { NextResponse } from "next/server";
import { getAttempt } from "@/lib/storage";
import { getSid } from "@/lib/session";

export async function GET() {
  const sid = await getSid();
  if (!sid) return NextResponse.json({ ok: false }, { status: 400 });
  const attempt = await getAttempt(sid);
  if (!attempt) return NextResponse.json({ ok: false }, { status: 404 });
  return NextResponse.json({ ok: true, attempt });
}
```

- [ ] **Step 4: Implement show-login route**

Create `app/api/show-login/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { grantShowAccess } from "@/lib/session";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const expected = process.env.SHOW_PASSWORD ?? "";
  if (typeof body.password === "string" && expected && body.password === expected) {
    await grantShowAccess();
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ ok: false }, { status: 401 });
}
```

- [ ] **Step 5: Manually verify submit + read**

Run `npm run dev`, then in another terminal:

```bash
curl -s -X POST localhost:3000/api/submit -H 'content-type: application/json' -d '{"date":"2026-06-01","time":"19:30"}' -c /tmp/cj.txt
curl -s -X POST localhost:3000/api/submit -H 'content-type: application/json' -d '{"dish":"sushi"}' -b /tmp/cj.txt
curl -s localhost:3000/api/submission -b /tmp/cj.txt
```

Expected: first returns `{"ok":true,"id":...}`, second `{"ok":true}`, third returns the attempt with `dish:"sushi"`. Confirm `data/submissions.json` now exists with one record. Stop the server.

- [ ] **Step 6: Commit**

```bash
git add app/api .env.local
git commit -m "feat: submit, submission, and show-login API routes"
```

Note: `.env.local` is gitignored — it will not actually be committed; that's expected. The default password lives in the plan.

---

## Task 6: Theme, layout, and hearts background

**Files:**
- Modify: `app/layout.tsx`, `app/globals.css`
- Create: `components/HeartsBackground.tsx`, `components/cats.tsx`

- [ ] **Step 1: Write global pastel theme**

Replace `app/globals.css` with:

```css
:root {
  --pink-50: #fff0f5;
  --pink-100: #ffe5ec;
  --pink-200: #ffd1dc;
  --pink-300: #ffb3c8;
  --pink-500: #ff7aa2;
  --pink-700: #e85c87;
  --ink: #6b3a4b;
  --radius: 22px;
  --shadow: 0 10px 30px rgba(232, 92, 135, 0.18);
}

* { box-sizing: border-box; }

html, body {
  margin: 0;
  padding: 0;
  min-height: 100%;
  color: var(--ink);
  font-family: "Nunito", ui-rounded, "Segoe UI", system-ui, sans-serif;
  background: linear-gradient(135deg, var(--pink-200) 0%, var(--pink-100) 45%, var(--pink-50) 100%);
  background-attachment: fixed;
}

.page {
  position: relative;
  z-index: 1;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 24px;
  gap: 24px;
}

.card {
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(6px);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 32px 28px;
  max-width: 520px;
  width: 100%;
}

h1 { font-size: clamp(24px, 6vw, 38px); margin: 0 0 8px; }
.subtitle { color: var(--pink-700); font-size: clamp(15px, 4vw, 18px); }

.btn {
  border: none;
  cursor: pointer;
  border-radius: 999px;
  padding: 16px 32px;
  font-size: 20px;
  font-weight: 800;
  color: white;
  background: linear-gradient(135deg, var(--pink-500), var(--pink-700));
  box-shadow: var(--shadow);
  transition: transform 0.12s ease, box-shadow 0.12s ease;
}
.btn:hover { transform: translateY(-2px) scale(1.03); }
.btn:active { transform: translateY(0) scale(0.98); }

.btn-secondary {
  background: linear-gradient(135deg, #cfcfe8, #a9a9cf);
}

.btn-row { display: flex; gap: 18px; justify-content: center; flex-wrap: wrap; }

@keyframes floatUp {
  0% { transform: translateY(20px); opacity: 0; }
  10% { opacity: 0.9; }
  100% { transform: translateY(-110vh); opacity: 0; }
}

.hearts {
  position: fixed;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
}
.hearts span {
  position: absolute;
  bottom: -40px;
  font-size: 24px;
  animation: floatUp linear infinite;
}

.runaway-zone {
  position: relative;
  width: 100%;
  min-height: 140px;
}
.btn-no {
  position: absolute;
  transition: left 0.18s ease-out, top 0.18s ease-out;
}

.dish-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 14px;
}
.dish-btn {
  border: 2px solid var(--pink-200);
  background: white;
  border-radius: 18px;
  padding: 18px 10px;
  cursor: pointer;
  font-size: 17px;
  font-weight: 700;
  color: var(--ink);
  transition: transform 0.12s ease, border-color 0.12s ease, box-shadow 0.12s ease;
}
.dish-btn:hover { transform: translateY(-3px); border-color: var(--pink-500); box-shadow: var(--shadow); }
.dish-emoji { display: block; font-size: 38px; margin-bottom: 6px; }

.field { display: flex; flex-direction: column; gap: 6px; text-align: left; margin-bottom: 16px; }
.field label { font-weight: 700; color: var(--pink-700); }
.field input {
  border: 2px solid var(--pink-200);
  border-radius: 14px;
  padding: 12px 14px;
  font-size: 16px;
  font-family: inherit;
}

table { width: 100%; border-collapse: collapse; }
th, td { padding: 10px 12px; text-align: left; border-bottom: 1px solid var(--pink-200); }
th { color: var(--pink-700); }
```

- [ ] **Step 2: Create cat SVG helpers**

Create `components/cats.tsx`:

```tsx
export function CatFace({ mood, size = 120 }: { mood: "sly" | "happy" | "sweet"; size?: number }) {
  const eyes = mood === "sly" ? "︶  ︶" : mood === "happy" ? "^   ^" : "•   •";
  const mouth = mood === "happy" ? "ω" : mood === "sly" ? "‿" : "ᴥ";
  return (
    <div aria-hidden style={{ fontSize: size, lineHeight: 1 }}>
      {mood === "happy" ? "😸" : mood === "sly" ? "😼" : "😺"}
      <div style={{ fontSize: size * 0.18, color: "var(--pink-700)" }}>{eyes} {mouth}</div>
    </div>
  );
}
```

- [ ] **Step 3: Create hearts background client component**

Create `components/HeartsBackground.tsx`:

```tsx
"use client";

import { useMemo } from "react";

const GLYPHS = ["💕", "🐾", "💗", "✨", "🐱"];

export default function HeartsBackground() {
  const items = useMemo(
    () =>
      Array.from({ length: 18 }).map((_, index) => ({
        left: (index * 53) % 100,
        delay: (index % 9) * 1.3,
        duration: 9 + (index % 6),
        glyph: GLYPHS[index % GLYPHS.length],
        size: 18 + (index % 4) * 8,
      })),
    [],
  );

  return (
    <div className="hearts" aria-hidden>
      {items.map((item, index) => (
        <span
          key={index}
          style={{
            left: `${item.left}%`,
            animationDelay: `${item.delay}s`,
            animationDuration: `${item.duration}s`,
            fontSize: item.size,
          }}
        >
          {item.glyph}
        </span>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Wire layout**

Replace `app/layout.tsx` with:

```tsx
import type { Metadata } from "next";
import HeartsBackground from "@/components/HeartsBackground";
import "./globals.css";

export const metadata: Metadata = {
  title: "Приглашение 💕",
  description: "Маленький секрет для тебя",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <HeartsBackground />
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 5: Verify**

Run `npm run dev`, open `http://localhost:3000`. Expected: pastel gradient background with floating hearts/paws animating upward. Stop server.

- [ ] **Step 6: Commit**

```bash
git add app/layout.tsx app/globals.css components/HeartsBackground.tsx components/cats.tsx
git commit -m "feat: pastel theme, layout, hearts background, cat svg"
```

---

## Task 7: Home page with runaway "No" button

**Files:**
- Modify: `app/page.tsx`
- Create: `components/NoButton.tsx`

- [ ] **Step 1: Create the runaway No button**

Create `components/NoButton.tsx`. The button slides (CSS `transition` on `left`/`top`, ~0.18s) — it does NOT teleport; the motion is visible. It flees on mouse approach (desktop) and on touch/pointer-down (mobile).

```tsx
"use client";

import { useCallback, useRef, useState } from "react";

export default function NoButton() {
  const zoneRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const [sly, setSly] = useState(false);

  const flee = useCallback(() => {
    const zone = zoneRef.current;
    if (!zone) return;
    setSly(true);
    const maxLeft = Math.max(0, zone.clientWidth - 130);
    const maxTop = Math.max(0, zone.clientHeight - 60);
    const nextLeft = Math.floor((Math.sin(Date.now() * 0.013) * 0.5 + 0.5) * maxLeft);
    const nextTop = Math.floor((Math.cos(Date.now() * 0.017) * 0.5 + 0.5) * maxTop);
    setPos({ left: nextLeft, top: nextTop });
  }, []);

  return (
    <div ref={zoneRef} className="runaway-zone">
      <button
        type="button"
        className="btn btn-secondary btn-no"
        style={pos ? { left: pos.left, top: pos.top } : { left: "calc(50% + 90px)", top: 40 }}
        onMouseEnter={flee}
        onPointerDown={(event) => {
          event.preventDefault();
          flee();
        }}
        onClick={(event) => event.preventDefault()}
      >
        {sly ? "Нет 😏" : "Нет 😢"}
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Build the home page**

Replace `app/page.tsx` with:

```tsx
import Link from "next/link";
import NoButton from "@/components/NoButton";

export default function Home() {
  return (
    <main className="page">
      <div className="card">
        <h1>Ты пойдёшь со мной на свидание? 🥰</h1>
        <p className="subtitle">Только честно… 🐾</p>
        <div className="btn-row" style={{ marginTop: 24 }}>
          <Link href="/when" className="btn">Да 💖</Link>
        </div>
        <NoButton />
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Verify behavior**

Run `npm run dev`, open `http://localhost:3000`.
Expected (desktop): moving the cursor toward "Нет" makes it quickly slide to a new spot (visible glide, ~0.18s), emoji switches to 😏. "Да" is clickable and navigates to `/when`.
Expected (mobile view via devtools): tapping "Нет" makes it slide away.
Stop server.

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx components/NoButton.tsx
git commit -m "feat: home page with sliding runaway No button"
```

---

## Task 8: `/when` date & time page

**Files:**
- Create: `app/when/page.tsx`, `components/WhenForm.tsx`

- [ ] **Step 1: Create the WhenForm client component**

Create `components/WhenForm.tsx`:

```tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function WhenForm() {
  const router = useRouter();
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!date || !time) return;
    setBusy(true);
    const response = await fetch("/api/submit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ date, time }),
    });
    if (response.ok) {
      router.push("/what");
    } else {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <div className="field">
        <label htmlFor="date">Дата 📅</label>
        <input id="date" type="date" value={date} onChange={(event) => setDate(event.target.value)} required />
      </div>
      <div className="field">
        <label htmlFor="time">Время ⏰</label>
        <input id="time" type="time" value={time} onChange={(event) => setTime(event.target.value)} required />
      </div>
      <button type="submit" className="btn" disabled={busy} style={{ width: "100%" }}>
        Дальше 💌
      </button>
    </form>
  );
}
```

- [ ] **Step 2: Create the page**

Create `app/when/page.tsx`:

```tsx
import { CatFace } from "@/components/cats";
import WhenForm from "@/components/WhenForm";

export default function WhenPage() {
  return (
    <main className="page">
      <div className="card">
        <CatFace mood="sly" />
        <h1>Клааасс! ❤️</h1>
        <p className="subtitle">Когда у тебя есть свободное окошко?</p>
        <div style={{ marginTop: 20 }}>
          <WhenForm />
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Verify**

Run `npm run dev`, navigate `/` → "Да" → `/when`. Pick a date and time, submit.
Expected: redirect to `/what`; a new record appears in `data/submissions.json` with the chosen date/time and `dish: null`. Stop server.

- [ ] **Step 4: Commit**

```bash
git add app/when components/WhenForm.tsx
git commit -m "feat: when page with date/time picker"
```

---

## Task 9: `/what` dish selection page

**Files:**
- Create: `app/what/page.tsx`, `components/DishPicker.tsx`

- [ ] **Step 1: Create the DishPicker client component**

Create `components/DishPicker.tsx`:

```tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { DISHES } from "@/lib/dishes";

export default function DishPicker() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function pick(dishId: string) {
    if (busy) return;
    setBusy(true);
    const response = await fetch("/api/submit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ dish: dishId }),
    });
    if (response.ok) {
      router.push("/final");
    } else {
      setBusy(false);
    }
  }

  return (
    <div className="dish-grid">
      {DISHES.map((dish) => (
        <button key={dish.id} type="button" className="dish-btn" onClick={() => pick(dish.id)} disabled={busy}>
          <span className="dish-emoji">{dish.emoji}</span>
          {dish.label}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Create the page**

Create `app/what/page.tsx`:

```tsx
import DishPicker from "@/components/DishPicker";

export default function WhatPage() {
  return (
    <main className="page">
      <div className="card">
        <h1>Что хочешь покушать? 😋</h1>
        <p className="subtitle">Выбирай, чего душа просит 🐾</p>
        <div style={{ marginTop: 20 }}>
          <DishPicker />
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Verify**

Run `npm run dev`, go through `/` → `/when` → `/what`, click a dish.
Expected: redirect to `/final`; the same record in `data/submissions.json` now has the chosen `dish` and an updated `updatedAt`. Stop server.

- [ ] **Step 4: Commit**

```bash
git add app/what components/DishPicker.tsx
git commit -m "feat: what page with dish selection"
```

---

## Task 10: `/final` summary page

**Files:**
- Create: `app/final/page.tsx`

- [ ] **Step 1: Build the page (server component)**

Create `app/final/page.tsx`. It reads the current attempt via the `sid` cookie and formats the date nicely.

```tsx
import { CatFace } from "@/components/cats";
import { getSid } from "@/lib/session";
import { getAttempt } from "@/lib/storage";
import { dishLabel } from "@/lib/dishes";

function formatDate(date: string): string {
  const parsed = new Date(`${date}T00:00:00`);
  return parsed.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
}

export default async function FinalPage() {
  const sid = await getSid();
  const attempt = sid ? await getAttempt(sid) : null;

  if (!attempt) {
    return (
      <main className="page">
        <div className="card">
          <CatFace mood="sweet" />
          <h1>Ой! 🐱</h1>
          <p className="subtitle">Кажется, мы потеряли твой выбор. Начни сначала 💕</p>
        </div>
      </main>
    );
  }

  const when = `${formatDate(attempt.date)} в ${attempt.time}`;
  const dish = attempt.dish ? dishLabel(attempt.dish) : "что-нибудь вкусное";

  return (
    <main className="page">
      <div className="card">
        <CatFace mood="happy" size={140} />
        <h1>Супер ❤️</h1>
        <p className="subtitle">
          Тогда я заеду за тобой {when} и поедем кушать {dish}! 😻🎉
        </p>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Verify**

Run `npm run dev`, complete the full flow.
Expected: `/final` shows "Тогда я заеду за тобой [дата] в [время] и поедем кушать [блюдо]" with the happy cat. Stop server.

- [ ] **Step 3: Commit**

```bash
git add app/final
git commit -m "feat: final summary page"
```

---

## Task 11: `/show` password-gated attempts table

**Files:**
- Create: `app/show/page.tsx`

- [ ] **Step 1: Build the page**

Create `app/show/page.tsx`. It is a server component: shows a password form when not authenticated, otherwise renders all attempts (newest first) with fill timestamps. The form posts to `/api/show-login` then reloads.

```tsx
import { hasShowAccess } from "@/lib/session";
import { getAllAttempts } from "@/lib/storage";
import { dishLabel } from "@/lib/dishes";

function formatStamp(iso: string): string {
  return new Date(iso).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function LoginForm() {
  return (
    <main className="page">
      <div className="card">
        <h1>🔒 Секретная страница</h1>
        <p className="subtitle">Введите пароль</p>
        <form
          // progressive-enhancement client island below
          action="/api/show-login"
        >
          <ShowLogin />
        </form>
      </div>
    </main>
  );
}

export default async function ShowPage() {
  const authed = await hasShowAccess();
  if (!authed) return <LoginForm />;

  const attempts = (await getAllAttempts()).slice().reverse();

  return (
    <main className="page">
      <div className="card" style={{ maxWidth: 760 }}>
        <h1>Результаты 💌</h1>
        <p className="subtitle">Все попытки ({attempts.length})</p>
        {attempts.length === 0 ? (
          <p>Пока пусто 🐾</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Дата свидания</th>
                <th>Время</th>
                <th>Блюдо</th>
                <th>Заполнено</th>
              </tr>
            </thead>
            <tbody>
              {attempts.map((attempt, index) => (
                <tr key={attempt.id}>
                  <td>{attempts.length - index}</td>
                  <td>{attempt.date}</td>
                  <td>{attempt.time}</td>
                  <td>{attempt.dish ? dishLabel(attempt.dish) : "—"}</td>
                  <td>{formatStamp(attempt.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}

import ShowLogin from "@/components/ShowLogin";
```

- [ ] **Step 2: Create the login client island**

Create `components/ShowLogin.tsx`:

```tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ShowLogin() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/show-login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (response.ok) {
      router.refresh();
    } else {
      setError(true);
    }
  }

  return (
    <div onSubmit={submit}>
      <div className="field">
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Пароль"
          onKeyDown={(event) => {
            if (event.key === "Enter") submit(event);
          }}
        />
      </div>
      {error && <p style={{ color: "var(--pink-700)" }}>Неверный пароль 🙀</p>}
      <button type="button" className="btn" style={{ width: "100%" }} onClick={submit}>
        Войти
      </button>
    </div>
  );
}
```

Note: replace the `<form action=...>` wrapper in `app/show/page.tsx` Step 1 with just `<ShowLogin />` (no native form needed — the island handles submit). Move the `import ShowLogin` to the top of the file with the other imports.

- [ ] **Step 3: Verify**

Run `npm run dev`, open `/show`.
Expected: password prompt. Wrong password → error message. Correct password (`meow-please-2026`) → table of all attempts, newest first, with fill timestamps. Stop server.

- [ ] **Step 4: Commit**

```bash
git add app/show components/ShowLogin.tsx
git commit -m "feat: password-gated show page with attempts table"
```

---

## Task 12: Project docs and final polish

**Files:**
- Create: `README.md`, `CLAUDE.md`, `decisions.md`, `CHANGELOG.md`

- [ ] **Step 1: Run full test + typecheck**

Run:
```bash
npm test && npx tsc --noEmit && npm run build
```
Expected: tests pass, no type errors, production build succeeds.

- [ ] **Step 2: Write README.md**

Create `README.md`:

```markdown
# Date Invite 💕🐱

Игривое романтичное приглашение на свидание в пастельно-кошачьем стиле.

## Запуск

```bash
npm install
echo 'SHOW_PASSWORD=меняй-меня' > .env.local
npm run dev
```

Открой http://localhost:3000.

## Страницы
- `/` — вопрос + кнопки «Да»/«Нет» (убегающая)
- `/when` — выбор даты и времени
- `/what` — выбор блюда
- `/final` — итоговое сообщение
- `/show` — результаты всех попыток (пароль из `SHOW_PASSWORD`)

Ответы сохраняются в `data/submissions.json`.
```

- [ ] **Step 3: Write CLAUDE.md**

Create `CLAUDE.md`:

```markdown
# CLAUDE.md

Next.js 15.3 App Router app. Romantic date-invitation flow.

## Map
- Storage: `lib/storage.ts` — only place that touches `data/submissions.json`. Each pass = new attempt.
- Dishes: `lib/dishes.ts` — single source of truth for the dish list.
- Sessions: `lib/session.ts` — `sid` cookie correlates an attempt; `show_auth` gates `/show`. `cookies()` is async in Next 15 — always await.
- Runaway button: `components/NoButton.tsx` — slides via CSS transition (not teleport); flees on mouseenter + pointerdown.

## Commands
- `npm run dev` / `npm run build` / `npm test` (vitest)

## Gotchas
- `SHOW_PASSWORD` lives in `.env.local` (gitignored). Without it, `/show` login always fails.
- `data/submissions.json` is gitignored and created on first submit.
- Tests point storage at `data/submissions.test.json` via `SUBMISSIONS_FILE` env.
```

- [ ] **Step 4: Write decisions.md and CHANGELOG.md**

Create `decisions.md`:

```markdown
### 2026-05-30 · JSON file storage over a database
Single-invitation app; viewer needs cross-device read on `/show`. JSON file via Route Handlers is the simplest durable option — no DB dependency. Each pass creates a new attempt so all tries are visible.

### 2026-05-30 · Sliding runaway "No" button, not teleport
Per request: the button must visibly move. CSS `transition` on left/top (~0.18s) gives a fast glide instead of an instant jump, and works for both cursor (mouseenter) and touch (pointerdown).
```

Create `CHANGELOG.md`:

```markdown
# Changelog

## Unreleased
- 2026-05-30 [app] Initial date-invite app: home/when/what/final/show flow, JSON storage, runaway No button, pastel cat theme.
```

- [ ] **Step 5: Commit**

```bash
git add README.md CLAUDE.md decisions.md CHANGELOG.md
git commit -m "docs: project documentation"
```

---

## Definition of Done

- `npm test`, `npx tsc --noEmit`, and `npm run build` all pass.
- Full flow works: `/` (Да) → `/when` → `/what` → `/final` with correct summary text.
- "Нет" button visibly slides away on both cursor approach and touch.
- Each completed pass produces a new record in `data/submissions.json`.
- `/show` requires the password and lists all attempts (newest first) with fill timestamps.
