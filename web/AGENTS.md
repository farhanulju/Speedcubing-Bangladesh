# AGENTS.md — web/

Applies under `web/` in addition to root `AGENTS.md` and `docs/architecture/ARCHITECTURE.md`.

## Stack lock

Cloudflare free tier only: Pages, Workers, D1, KV, R2, Turnstile, Access. No other hosting, DB, CMS, or auth vendor. Content lives in `src/content/` (git) for v1; D1 holds roster/announcements/forms state per the architecture doc.

## Rules

- English strings only, and only via content files / i18n dictionaries — never hardcoded in components. Reserve `/bn/` prefix; do not implement it.
- WCA reads go through `src/lib/wca.ts` (KV cache, 24h TTL, stale-on-failure + "cached data" banner). No direct `fetch(worldcubeassociation.org)` from pages/components. No WCA HTML scraping.
- Public queries must never select volunteer internal fields (`tier`, `notes`). Enforce at the query layer, not just the template.
- Forms: Turnstile + rate limit + server-side validation in `workers/api.ts`. BDT amounts as integers. TxID flow fails closed (retry message + organizer-inbox fallback).
- Images: R2 keys `/{year}/{comp-slug}/{file}`; stills only in `images[]`-equivalent fields; AVIF/WebP via resizing; `og:image` must resolve without JS.
- Budgets: <200 KB JS per content route; no client-side data fetching for content pages (ISR only).
- Verify with `npm run build` before review. Mobile (360px) screenshot for every new route.
