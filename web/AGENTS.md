# AGENTS.md — web/

Applies under `web/` in addition to root `AGENTS.md` and `docs/architecture/ARCHITECTURE.md`.

## Stack lock

Cloudflare free tier + two exceptions (Resend transactional email; Discourse only if ever approved): Pages, Workers, D1, KV, R2, Turnstile, Access. No other hosting, DB, CMS, auth vendor, or Google Forms. No `src/content/` — all content lives in D1 and is edited at `/admin` with Editor.js.

## Rules

- English strings only via UI dictionaries — never hardcoded in components. Body copy comes from D1 (`locale='en'` rows). Reserve `/bn/` prefix; do not implement it.
- WCA reads go through `src/lib/wca.ts` (KV cache, 24h TTL, stale-on-failure + "cached data" banner). No direct `fetch(worldcubeassociation.org)` from pages/components. No WCA HTML scraping. WCA ID linking must validate against the cache.
- Auth: `/admin/*` + `admin:*` APIs require Cloudflare Access; `/dashboard` + user APIs require WCA OAuth session (httpOnly, SameSite=Lax, `state`+PKCE). Never store WCA passwords.
- Public queries must never select volunteer internal columns (`tier`, `notes`) or any private contact columns. Enforce at the query layer, not just the template.
- Rich text: Editor.js JSON only, v1 toolset = paragraph, header, nested-list, quote, image (custom R2 uploader ONLY), delimiter, link/marker/bold/italic inline. No table, embeds, attaches, code, or raw-HTML blocks. Render via allowlisted per-block parsers (`editorjs-html` style); strip everything else. Pin every `@editorjs/*` version. No raw HTML from editors reaches the page.
- Forms: Turnstile + rate limit + server-side validation in `workers/api.ts`. BDT amounts as integers. TxID flow fails closed (retry message + organizer-inbox BCC). No Durable Objects for v1 forms.
- Email: only via `src/lib/email.ts` (Resend, D1 outbox, versioned templates: `payment-verified`, `payment-rejected`, `guardian-consent-recorded`). Never block a verification on send success; dashboard is canonical.
- Sync: WCA pull + snapshot appends + champion derivation live in `workers/sync-wca.ts`; manual "refresh cache" admin action is rate-limited (1/10 min) and never writes to WCA.
- Images: R2 keys `/{year}/{comp-slug}/{file}`; stills only; AVIF/WebP via resizing; `og:image` must resolve without JS.
- Budgets: <200 KB JS per public route (ISR, no client fetching for content); dashboards may hydrate per route.
- Verify with `npm run build` before review. Mobile (360px) screenshots for every new public route plus `/dashboard` and `/admin` states touched.
