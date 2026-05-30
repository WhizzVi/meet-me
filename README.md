# Date Invite 💕🐱

Игривое романтичное приглашение на свидание в пастельно-кошачьем стиле. Девушка отвечает на вопрос, выбирает дату/время и блюдо — всё сохраняется, а пригласивший смотрит результат на защищённой паролем странице.

## Что внутри
- `/` — вопрос «Ты пойдёшь со мной на свидание?» с кнопками «Да» 💖 и «Нет» 😢 (кнопка «Нет» убегает от курсора/пальца).
- `/when` — выбор даты и времени.
- `/what` — выбор блюда (рамен, морепродукты, паста, стейк, суши, борщ, десертики).
- `/final` — итоговое сообщение со счастливым котиком.
- `/show` — все попытки (нужен пароль `SHOW_PASSWORD`).

Ответы сохраняются в `data/submissions.json`. Каждый проход = отдельная попытка.

## Запуск

```bash
npm install
echo 'SHOW_PASSWORD=меняй-меня' > .env.local
npm run dev
```

Открой http://localhost:3000.

## Сборка

```bash
npm run build
npm start
```

## Тесты

```bash
npm test
```

## Хранение данных
- **Локально / dev:** JSON-файл `data/submissions.json` — ничего настраивать не нужно.
- **На Vercel:** файловая система read-only, поэтому файл не работает — нужен Upstash Redis. Подключи его один раз через Vercel Marketplace (Dashboard → Storage → Upstash / Redis). Он сам пропишет переменные `UPSTASH_REDIS_REST_URL` и `UPSTASH_REDIS_REST_TOKEN` в проект. После этого передеплой — и всё заработает.
- Чтобы потестить Redis локально: `vercel env pull .env.local` (подтянет токены), затем `npm run dev`.

`lib/storage.ts` сам выбирает бэкенд: есть переменные Upstash → Redis, нет → файл.

## Деплой на Vercel (кратко)
1. В проекте на Vercel: Storage → добавить Upstash Redis (env-переменные пропишутся автоматически).
2. Задай `SHOW_PASSWORD` в Project Settings → Environment Variables.
3. Передеплой.

## Стек
Next.js 15.3 (App Router), React 19, TypeScript, чистый CSS, Vitest. Хранение — Upstash Redis (prod) / JSON-файл (dev).

## Примечание про Node 25
Скрипты `dev`/`start` выставляют `NODE_OPTIONS=--localstorage-file=.localstorage` для совместимости с Node 25 (иначе Next падает на SSR локально). Запускай через `npm run dev`, а не `next dev` напрямую. (На Vercel это не нужно — там своя сборка.)
