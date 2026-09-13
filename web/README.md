# Web — website (placeholder until scaffold)

Scaffold only the ticked MVP rows in `docs/product/FEATURE_LIST.md` (review applied 2026-09-14).

## Planned stack (locked by `docs/architecture/ARCHITECTURE.md`)

- Public site (Astro or Next.js static export, ISR) on **Cloudflare Pages**. English v1, strings in dictionaries for future `/bn/`.
- **User dashboard** `/dashboard` (WCA OAuth, registrations, payment status, history) + **admin dashboard** `/admin` (Access-gated: TipTap content, announcements, payment queue, lost-found inbox, donors).
- **Workers** for `/api/*` + daily cron syncing WCA (official v0 + unofficial REST) → **KV**. **D1** is the only content store (no `src/content/`). **R2** for photos/PDFs (gallery UI deferred, bucket kept). **Turnstile** on all forms.

## Planned layout

```
/web
  src/pages/          — /, /about, /people, /competitions, /competitions/[slug],
                        /records, /faq, /news, /news/[slug],
                        /lost-found, /sponsors, /worlds-2027, /contact,
                        /dashboard, /admin
  src/lib/wca.ts      — one WCA cache client (KV-backed, daily revalidate)
  src/lib/tiptap.ts   — fixed-toolbar editor config + JSON → sanitized HTML
  src/lib/auth.ts     — WCA OAuth (users) + Access check (admin)
  workers/api.ts      — forms, registrations, verification actions (D1 writes)
  workers/sync-wca.ts — cron: WCA → KV
  migrations/         — D1 schema: content tables, competitor/registration,
                        tx_submission queue, lost_found, opt_in, donors
                        (BDT integers, consent flags, updated_by/at)
```

Deferred routes (reserved, no UI v1): `/volunteers`, `/gallery`, `/rankings/[event]`, `/bn/*`.

## Commands (once scaffolded)

- `npm ci`, `npm run dev`, `npm run build`, `npm run preview`
- Secrets via Cloudflare dashboard + `.dev.vars` locally (never committed).

See `web/AGENTS.md` for web-specific agent rules.
