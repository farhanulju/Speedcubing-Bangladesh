# CURRENT_STATE

Updated: 2026-09-14 (build plan issued). Newest first. This is the file the next agent reads to avoid reconstructing context from chat.

## Implemented (docs only — no website code yet)

- Repo is the org source of truth (`README.md`, `AGENTS.md`/`CLAUDE.md`, `docs/`, `plan/`, `web/`).
- Scope: `docs/product/FEATURE_LIST.md` MVP = A1–A8, A11–A22 (A22 transactional email added post-review). Deferred: A9 volunteers UI, A10 gallery UI, search, school, membership, regional pages.
- Stack: `docs/architecture/ARCHITECTURE.md` — Astro+TS+Tailwind on Pages; Workers API + daily WCA→KV cron (+ snapshots/champions → D1) + 5-min Resend outbox flush; D1 content store; Editor.js allowlist; fee-vs-WCA-acceptance split states; audit log; guardian consent (simple); print-slip route.
- Design: Stitch round 1 + round 2 reviewed (`plan/DESIGN_REVIEW_ROUND2.md`); new screens + mobile verified; punchlist feeds build M5.
- Execution: `plan/BUILD_PLAN.md` WP-00…WP-53 across M0–M5 with acceptance criteria, API/cron/secrets tables, launch runbook.

## Current focus

- Assign owners per BUILD_PLAN milestone; resolve unknowns below; start M0 (WP-00 accounts/secrets, WP-01 scaffold).

## Gaps / unknowns

- Bank account (org name vs individual) pending verification with WCA/banks.
- Payment number custody + TxID verifier roster undefined (blocks M3 staffing).
- Photo-consent ops undefined (blocks WP-51 seeding; gate is specced, process owner missing).
- Bulk newsletter provider undefined (transactional Resend decided; broadcast list still open).
- Worlds 2027 candidate list undefined (page shape + refund policy approved, content pending).
- WCA OAuth app credentials + redirect URLs undefined (blocks WP-30).
- Cloudflare Access admin list undefined (blocks WP-16).
