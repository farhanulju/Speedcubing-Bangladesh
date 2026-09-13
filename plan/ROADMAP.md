# ROADMAP

Phased plan. Scope gate: `docs/product/FEATURE_LIST.md`. Stack gate: `docs/architecture/ARCHITECTURE.md`. English-only v1, Cloudflare-only, WCA-cached.

## Phase 0 — Review (this week)

- [ ] Board ticks MVP rows A1–A15 in `FEATURE_LIST.md` (tick = build now, cross = defer).
- [ ] Confirm unknowns in `docs/project-memory/CURRENT_STATE.md`: payment-number owner, TxID verifier, photo-consent flow, newsletter provider, volunteer approver, Worlds candidate criteria + refund policy.
- [ ] Lock UI direction from `speedcubing.org.au` (reference for polish) with `westcoastcubing.com` IA (reference for structure).
- [ ] Create Cloudflare account + R2 bucket + D1 database (free tier); store IDs in dashboard, never in git.

Exit: ticked feature list + owner per row.

## Phase 1 — MVP (6–8 weeks after review)

Static site on Cloudflare Pages + Workers API + D1 + R2 + Turnstile. Daily WCA cron → KV.

1. Shell + design system (EN strings externalized for future `bn/`), header/footer, SEO/sitemap/analytics.
2. Content collections in repo: announcements, people, sponsors, FAQ, comp overrides.
3. Competitions list + detail template wired to WCA cache (upcoming BD + past + WCA/Live links).
4. Manual payment v1: fee-tier display + bKash/Nagad steps + TxID form → D1 → organizer inbox.
5. Volunteer roster (public) + join form (private fields); gallery manual albums; lost-found form; contact + opt-in forms.
6. Worlds 2027 separate page with manual total + donor wall (opt-in) + refund policy.
7. UAT on mid-range Android; content freeze; launch + link-in-bio swap.

Exit: a stranger can find next comp, understand fees/payment, meet the org, join as volunteer, and donate — all on mobile.

## Phase 2 — Good-to-have (3–9 months, needs owners)

- Records + rankings auto (B1–B2). Payments v2 via SSLCommerz/ShurjoPay (B3). Gallery + volunteer backends (B4–B5). Organizer/school toolkit (B6). Donation receipts + expense log (B7). News posts (B8). Search (B9).

Each item needs a feature-list tick + data owner before build starts.

## Phase 3 — Future (Year 2+, volume-gated)

- WCA OAuth dashboard, live hub, regional sub-pages (only at 20+ comps/yr), school portal, membership, PWA push, forum (moderation-gated), open API.

## What we are not doing

Blog/forum in v1, Bangla UI in v1, automated payments in v1, regional sub-pages in v1, any non-Cloudflare vendor. See `FEATURE_LIST.md` non-goals.
