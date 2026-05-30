# Changelog

## Unreleased
- 2026-05-30 [fix] Production storage moved to Upstash Redis (Vercel's read-only FS broke the JSON-file write, causing the `/when`→`/what` step to fail silently). `lib/storage.ts` is now a Redis/file adapter; added error logging in the submit route and error messages in the forms.
- 2026-05-30 [app] Initial date-invite app: `/` question with sliding runaway "No" button, `/when` date/time picker, `/what` dish selection, `/final` summary, password-gated `/show` attempts table. Pastel-cat theme, JSON-file storage (one record per attempt with fill timestamps).
- 2026-05-30 [build] Pinned Next.js to 15.3.5; added `--localstorage-file` to dev/start scripts for Node 25 compatibility.
