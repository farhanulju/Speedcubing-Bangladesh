# Web — website (placeholder until scaffold)

Future home of the Cloudflare-only site. Do not scaffold until the board ticks MVP rows in `docs/product/FEATURE_LIST.md`.

## Planned stack (locked by `docs/architecture/ARCHITECTURE.md`)

- Static site (Astro or Next.js static export) on **Cloudflare Pages**. English v1, strings externalized for future `/bn/`.
- **Workers** for `/api/*` (forms → D1) + daily cron syncing WCA (official v0 + unofficial REST) → **KV**.
- **D1** for announcements/people/volunteers/forms/donations-manual. **R2** for photos/PDFs. **Turnstile** on all forms. **Access** for admin.

## Planned layout

```
/web
  src/pages/          — /, /about, /people, /competitions, /competitions/[slug],
                        /faq, /volunteers, /gallery, /lost-found,
                        /sponsors, /worlds-2027, /contact
  src/content/        — announcements/, people/, sponsors/, faq/, comp-overrides/
  src/lib/wca.ts      — one WCA cache client (KV-backed, daily revalidate)
  workers/api.ts      — form validation + D1 writes
  workers/sync-wca.ts — cron: WCA → KV/D1
  migrations/         — D1 schema (integers for BDT, consent flags)
```

## Commands (once scaffolded)

- `npm ci`, `npm run dev`, `npm run build`, `npm run preview`
- Secrets via Cloudflare dashboard + `.dev.vars` locally (never committed).

See `web/AGENTS.md` for web-specific agent rules.
