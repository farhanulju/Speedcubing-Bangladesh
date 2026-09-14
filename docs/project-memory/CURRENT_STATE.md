# CURRENT_STATE

Updated: 2026-09-14 (M0 scaffold built green). Newest first. This is the file the next agent reads to avoid reconstructing context from chat.

## Implemented (M0 code + full docs — no M1+ features yet)

- Repo is the org source of truth (`README.md`, `AGENTS.md`/`CLAUDE.md`, `docs/`, `plan/`, `web/`).
- Scope: `docs/product/FEATURE_LIST.md` MVP = A1–A8, A11–A22 (A22 transactional email added post-review). Deferred: A9 volunteers UI, A10 gallery UI, search, school, membership, regional pages.
- Stack: `docs/architecture/ARCHITECTURE.md` — Astro+TS+Tailwind on Pages; Workers API + daily WCA→KV cron (+ snapshots/champions → D1) + 5-min Resend outbox flush; D1 content store; Editor.js allowlist; fee-vs-WCA-acceptance split states; audit log; guardian consent (simple); print-slip route.
- Design: Stitch round 1 + round 2 reviewed (`plan/DESIGN_REVIEW_ROUND2.md`); new screens + mobile verified; punchlist feeds build M5.
- Execution: `plan/BUILD_PLAN.md` WP-00…WP-53 across M0–M5 with acceptance criteria, API/cron/secrets tables, launch runbook.
- M0 DONE: `web/` scaffold builds green — Astro 5 + TS + Tailwind v4 (Cloudflare adapter), Stitch tokens + EN dicts + unified lockup shell, 13 public routes + `/dashboard` + `/admin` + print-slip + `/api/health` + 404/500 (placeholders with WP pointers), shared `workers/api.ts`, standalone `workers/sync` cron worker (stubs), D1 migrations 0001–0007, `.dev.vars.example`. `npm run check` + `npm run build` + dev-serve smoke (/, /dashboard, /api/health, slug-404) pass. workers-types v5 (wrangler 4.131 peer). Ops handoff: `plan/OPS_HANDOFF.md`.
- M1 admin core DONE (local, no WP-00): generic CRUD framework (`src/lib/admin.ts` registry + coercion + audit) with query-param API (`/api/admin/:table`, auth fails closed, dev-bypass for local), admin index/list/edit pages with `AdminForm` + `EditorField`; verified end-to-end against local D1 (create/list/get/validate-400/unknown-404/edit-page/edit-attr-JSON/delete/singleton) + `check`+`build` green. Auth note: machine gh identity switched to farhanulju (owner) after farhanulbevy proved READ-only; pushes flow again.

## Current focus

- HUMAN: execute `plan/OPS_HANDOFF.md` (WP-00) and reply "WP-00 done" — remote deploy waits on it.
- AGENTS next: WP-14 payment queue UI + actions → WP-15 inboxes (lost-found/contact/donors UI polish) → WP-16 Access verification. All buildable locally.

## Gaps / unknowns

- Bank account (org name vs individual) pending verification with WCA/banks.
- Payment number custody + TxID verifier roster undefined (blocks M3 staffing).
- Photo-consent ops undefined (blocks WP-51 seeding; gate is specced, process owner missing).
- Bulk newsletter provider undefined (transactional Resend decided; broadcast list still open).
- Worlds 2027 candidate list undefined (page shape + refund policy approved, content pending).
- WCA OAuth app credentials + redirect URLs undefined (blocks WP-30).
- Cloudflare Access admin list undefined (blocks WP-16).
