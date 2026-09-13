# ROADMAP

Phased plan. Scope gate: `docs/product/FEATURE_LIST.md` (review applied 2026-09-14). Stack gate: `docs/architecture/ARCHITECTURE.md`. English-only v1, Cloudflare-only, WCA-cached. No Google Forms. No content in repo.

## Phase 0 — Review (done 2026-09-14)

- [x] Board ticked MVP rows A1–A8, A11–A21 in `FEATURE_LIST.md`; deferred A9 volunteers UI, A10 gallery UI; promoted records (A16); added WCA auth + user dashboard (A17), admin dashboard (A18), payment dashboard (A19), news (A20), competition history (A21).
- [ ] Confirm remaining unknowns in `docs/project-memory/CURRENT_STATE.md`: payment-number owner, TxID verifier roster, photo-consent flow, newsletter provider, Worlds candidate criteria + refund policy, WCA OAuth app credentials, Cloudflare Access seats.

Exit: owner per MVP row + Cloudflare account/D1/R2/KV provisioned.

## Phase 1 — MVP (after review)

Three surfaces, one stack (Pages + Workers + D1 + KV + R2 + Turnstile + Access). Daily WCA cron → KV.

1. Shell + design system (EN strings externalized for future `bn/`), header/footer, SEO/sitemap/analytics (A1, A15).
2. D1 content schema + admin dashboard with TipTap (A18): announcements, pages/about, people, sponsors, FAQ, news, comp overrides, Worlds page, donation totals. **No `src/content/` in repo.**
3. Public content pages wired to D1 (A2, A3, A5 overrides, A7, A8, A12, A13, A14, A20) + competitions list/detail from WCA cache (A4, A5) + records (A16) + history archive (A21).
4. WCA OAuth + user dashboard (A17): login, WCA ID validation, local competitor profile, my registrations, payment status, my history.
5. Manual payments end-to-end (A6 + A19): fee tiers → Send-Money steps → TxID form (Turnstile) → D1 queue → admin accept/reject → status in user dashboard.
6. Lost-found + contact + opt-in forms, all Cloudflare-native (A11, A14). Simple Workers + D1; no Durable Objects, no Google embeds.
7. UAT on mid-range Android (public + `/dashboard` + `/admin`); content entered via admin (no content freeze on git); launch + link-in-bio swap.

Exit: a stranger can find the next comp, understand fees/payment, meet the org, register with a verified WCA ID, track payment, and read news/records — all on mobile. An admin can publish everything without a deploy.

## Phase 2 — parked (needs tick + owner)

- Rankings (B2). Gateway payments (B3). Gallery UI activation (B4). Volunteer UI activation (B5). Organizer toolkit (B6). Donation receipts + expense log (B7). Search (B9).

## Phase 3 — future (volume/hosting-gated)

- Own registration UX (WCA stays canonical publish target). Live hub. School/membership: not needed. Forum: Discourse only (own host + moderation decision first). Open API on demand.

## What we are not doing

Google Forms/iframes, repo content files, gallery/volunteer public UI in v1, Bangla UI in v1, gateway payments in v1, regional sub-pages, school portal, membership, any non-Cloudflare vendor (Discourse is the single recorded future exception). See `FEATURE_LIST.md` non-goals.
