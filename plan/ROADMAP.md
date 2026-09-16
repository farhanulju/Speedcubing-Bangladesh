# ROADMAP

Phased plan. Scope gate: `docs/product/FEATURE_LIST.md` (review applied 2026-09-14; A22 email added after design review round 2). Stack gate: `docs/architecture/ARCHITECTURE.md`. Execution order: `plan/BUILD_PLAN.md` (WP-00…WP-53). English-only v1, Cloudflare-only (+Resend exception), WCA-cached. No Google Forms. No content in repo.

## Phase 0 — Review (done 2026-09-14; design round 2 graded after)

- [x] Board ticked MVP rows A1–A8, A11–A21 in `FEATURE_LIST.md`; deferred A9 volunteers UI, A10 gallery UI; promoted records (A16); added WCA auth + user dashboard (A17), admin dashboard (A18), payment dashboard (A19), news (A20), competition history (A21).
- [x] Design review round 2 (`plan/DESIGN_REVIEW_ROUND2.md`): 13 new screens verified; Stitch punchlist feeds BUILD_PLAN M5.
- [x] Resolved 2026-09-16: WCA OAuth app credentials, Cloudflare Access seats (8 Allow emails). Still open: payment-number owner, TxID verifier roster, photo-consent ops, newsletter provider, Worlds candidate list (see CURRENT_STATE gaps).

Exit: owner per MVP row + Cloudflare account/D1/R2/KV provisioned — MET 2026-09-16 (infra live, first deploy green).

## Phase 1 — MVP (execute `plan/BUILD_PLAN.md` M0→M5)

Three surfaces, one stack (Pages + Workers + D1 + KV + R2 + Turnstile + Access; Resend deferred). WCA crons 02:00 (ranks) + 02:30 (details) → KV (+ snapshots/champions → D1); 5-min outbox flush (skips cleanly).

1. M0 foundations: accounts/secrets, Astro scaffold, Stitch tokens, CI budgets (WP-00…WP-03).
2. M1 data + admin: migrations 0001–0007, R2 uploader, Editor.js field, admin CRUD, payment queue, inboxes, Access gating (WP-10…WP-16). **No `src/content/` in repo.**
3. M2 public site wired to D1 + WCA cache: shell, home/about/people/faq/contact/lost-found, competitions + detail, records + progression, news, sponsors, worlds (WP-20…WP-23).
4. M3 accounts + money: WCA OAuth, registration flow, user dashboard (+ consent card, seed display), email notices, print slip (WP-30…WP-34).
5. M4 sync jobs: cache, snapshots, champions, outbox flush, rate-limited manual refresh (WP-40…WP-42).
6. M5 content + launch: punchlist sweep, seeding runbook (consent gate ON, placeholders purged), QA matrix, cutover + rollback rehearsal (WP-50…WP-53).

Exit: a stranger can find the next comp, understand fees/payment, meet the org, register with a verified WCA ID, track payment, and read news/records — all on mobile. An admin can publish everything without a deploy.

## Phase 2 — parked (needs tick + owner)

- Rankings (B2). Gateway payments (B3). Gallery UI activation (B4). Volunteer UI activation (B5). Organizer toolkit (B6). Donation receipts + expense log (B7). Search (B9).

## Phase 3 — future (volume/hosting-gated)

- Own registration UX (WCA stays canonical publish target). Live hub. School/membership: not needed. Forum: Discourse only (own host + moderation decision first). Open API on demand.

## What we are not doing

Google Forms/iframes, repo content files, gallery/volunteer public UI in v1, Bangla UI in v1, gateway payments in v1, regional sub-pages, school portal, membership, any non-Cloudflare vendor (Discourse is the single recorded future exception). See `FEATURE_LIST.md` non-goals.
