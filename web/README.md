# Web — website (placeholder until scaffold)

Scaffold only the ticked MVP rows in `docs/product/FEATURE_LIST.md` (review applied 2026-09-14).

## Planned stack (locked by `docs/architecture/ARCHITECTURE.md`)

- Public site in **Astro + TypeScript + Tailwind** (static ISR) on **Cloudflare Pages**. English v1, strings in dictionaries for future `/bn/`; fonts self-hosted via fontsource.
- **User dashboard** `/dashboard` (WCA OAuth, registrations, payment status, history, consent card) + **admin dashboard** `/admin` (Access-gated: Editor.js content, announcements, payment queue, lost-found inbox, donors).
- **Workers** for `/api/*` (see `plan/BUILD_PLAN.md` API table) + daily cron (WCA → KV, snapshots + champions to D1) + 5-min outbox flush (Resend). **D1** is the only content store (no `src/content/`). **R2** for photos/PDFs (gallery UI deferred, bucket kept). **Turnstile** on all forms.

## Planned layout

```
/web
  src/pages/          — /, /about, /people, /competitions, /competitions/[slug],
                        /records, /faq, /news, /news/[slug],
                        /lost-found, /sponsors, /worlds-2027, /contact,
                        /dashboard, /admin
  src/lib/wca.ts      — one WCA cache client (KV-backed, daily revalidate)
  src/lib/editor.ts   — Editor.js tool allowlist + custom R2 image uploader + JSON → sanitized HTML
  src/lib/email.ts    — Resend client, versioned templates (payment-verified/rejected, guardian-consent-recorded)
  src/lib/auth.ts     — WCA OAuth (users) + Access check (admin)
  workers/api.ts      — forms, registrations, verification actions (D1 writes)
  workers/sync-wca.ts — cron: WCA → KV, snapshots + champions → D1; outbox flush
  migrations/         — 0001 content … 0007 gallery-reserved (see plan/BUILD_PLAN.md M1)
                        (BDT integers, consent flags, updated_by/at)
```

Deferred routes (reserved, no UI v1): `/volunteers`, `/gallery`, `/rankings/[event]`, `/bn/*`.

## Commands (once scaffolded)

- `npm ci`, `npm run dev`, `npm run build`, `npm run preview`
- Secrets via Cloudflare dashboard + `.dev.vars` locally (never committed).

See `web/AGENTS.md` for web-specific agent rules.
