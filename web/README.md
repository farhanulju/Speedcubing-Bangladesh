# Web — website (LIVE at https://speedbd-web.pages.dev)

Build only the ticked MVP rows in `docs/product/FEATURE_LIST.md` (build status per row lives there). Live: Pages deploy green, D1/KV/R2 bound, Access-gated admin, WCA OAuth login, daily two-stage sync running. Local: `astro check` ✓, `astro build` ✓, `db:check` + `test:*` + `smoke:*` + `drills-wp52` + `e2e` green (see `scripts/`, run after `db:reset` + `kv:seed` against a dev server).

## Stack (locked by `docs/architecture/ARCHITECTURE.md`)

- Public site in **Astro + TypeScript + Tailwind** (static ISR) on **Cloudflare Pages**. English v1, strings in dictionaries for future `/bn/`; fonts self-hosted via fontsource.
- **User dashboard** `/dashboard` (WCA OAuth, registrations, payment status, history, consent card) + **admin dashboard** `/admin` (Access-gated: Editor.js content, announcements, payment queue, lost-found inbox, donors).
- **Workers** for `/api/*` (see `plan/BUILD_PLAN.md` API table) + daily cron (WCA → KV, snapshots + champions to D1) + 5-min outbox flush (Resend). **D1** is the only content store (no `src/content/`). **R2** for photos/PDFs (gallery UI deferred, bucket kept). **Turnstile** on all forms.

## Layout

```
/web
  src/pages/          — /, /about, /people, /competitions, /competitions/[slug],
                        /records, /faq, /news, /news/[slug],
                        /lost-found, /sponsors, /worlds-2027, /contact,
                        /dashboard (+ registrations/[id]/slip), /admin/* (AdminShell)
  src/lib/            — wca (KV cache client), editor (allowlist parsers),
                        auth/session/access (HMAC sessions, WCA OAuth, Access JWT),
                        registrations (reads + site roster), payments (queue),
                        content/inbox/email/turnstile/uploads
  src/components/     — EditorField, AdminForm, TurnstileWidget, NewsletterForm, ContentBody
  src/layouts/        — Base (public) + AdminShell (dark sidebar + who-am-I)
  src/pages/api/      — public forms, registrations/tx/consent/me, uploads, media,
                        records.csv, admin CRUD + queue + inbox endpoints, auth
  workers/sync/       — scheduled worker: ranks stage 02:00 + details stage 02:30
                        (subrequest budget split) + 5-min outbox flush
  migrations/         — 0001 content … 0010 admin choices/anonymity (BDT
                        integers, consent flags, updated_by/at, audit log)
  scripts/            — db-check/reset/seed, kv-seed (real shapers), test-sync/auth/access,
                        smoke-m2/m3, drills-wp52, e2e, check-budget, shots-review
```

Deferred routes (reserved, no UI v1): `/volunteers`, `/gallery`, `/rankings/[event]`, `/bn/*`.

## Commands

- `npm ci`, `npm run dev` (port 4321), `npm run build`, `npm run check`
- Data: `npm run db:reset` → `npm run kv:seed` (local only, never prod)
- Verify: `db:check`, `test-sync`, `test-auth`, `test-access`, `check:budget`, `smoke-m2`, `smoke-m3`, `drills-wp52`, `e2e` (last four need the dev server)
- Secrets via Cloudflare dashboard + `.dev.vars` locally (never committed). Production IDs live in `wrangler.jsonc`; secret values never do.

See `web/AGENTS.md` for web-specific agent rules.
