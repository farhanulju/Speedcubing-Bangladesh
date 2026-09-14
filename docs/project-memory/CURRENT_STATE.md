# CURRENT_STATE

Updated: 2026-09-14 (M0 scaffold built green). Newest first. This is the file the next agent reads to avoid reconstructing context from chat.

## Implemented (M0–M4 code + full docs — WP-00 deploy pending)

- Repo is the org source of truth (`README.md`, `AGENTS.md`/`CLAUDE.md`, `docs/`, `plan/`, `web/`).
- Scope: `docs/product/FEATURE_LIST.md` MVP = A1–A8, A11–A22 (A22 transactional email added post-review). Deferred: A9 volunteers UI, A10 gallery UI, search, school, membership, regional pages.
- Stack: `docs/architecture/ARCHITECTURE.md` — Astro+TS+Tailwind on Pages; Workers API + daily WCA→KV cron (+ snapshots/champions → D1) + 5-min Resend outbox flush; D1 content store; Editor.js allowlist; fee-vs-WCA-acceptance split states; audit log; guardian consent (simple); print-slip route.
- Design: Stitch round 1 + round 2 reviewed (`plan/DESIGN_REVIEW_ROUND2.md`); new screens + mobile verified; punchlist feeds build M5.
- Execution: `plan/BUILD_PLAN.md` WP-00…WP-53 across M0–M5 with acceptance criteria, API/cron/secrets tables, launch runbook.
- M0 DONE: `web/` scaffold builds green — Astro 5 + TS + Tailwind v4 (Cloudflare adapter), Stitch tokens + EN dicts + unified lockup shell, 13 public routes + `/dashboard` + `/admin` + print-slip + `/api/health` + 404/500 (placeholders with WP pointers), shared `workers/api.ts`, standalone `workers/sync` cron worker (stubs), D1 migrations 0001–0007, `.dev.vars.example`. `npm run check` + `npm run build` + dev-serve smoke (/, /dashboard, /api/health, slug-404) pass. workers-types v5 (wrangler 4.131 peer). Ops handoff: `plan/OPS_HANDOFF.md`.
- M1 admin core DONE (local, no WP-00): generic CRUD framework (`src/lib/admin.ts` registry + coercion + audit) with query-param API (`/api/admin/:table`, auth fails closed, dev-bypass for local), admin index/list/edit pages with `AdminForm` + `EditorField`; verified end-to-end against local D1 (create/list/get/validate-400/unknown-404/edit-page/edit-attr-JSON/delete/singleton) + `check`+`build` green. Auth note: machine gh identity switched to farhanulju (owner) after farhanulbevy proved READ-only; pushes flow again.
- M1 ops DONE: WP-14 payment queue (filterable list, inspection page, atomic accept/reject + note → fee track + audit + Resend outbox enqueue, 409 replay guard, separate manual WCA-accepted tick) + WP-15 lost-found/contact inboxes (status workflows + audit); migration 0008 (competitor.email); `db:seed` script; full flow smoke-verified on local D1 incl. DB side-effect assertions.
- M2 public site DONE (local, no WP-00): 13 data pages (home/about/people/faq/contact/lost-found/news/article/sponsors/worlds/competitions/detail/records) reading KV+D1 with honest empty states; SSR + edge s-maxage (documented Cloudflare ISR equivalent); Turnstile-gated public endpoints (contact/lost-found+photo-pdf/opt-in); migration 0009 (worlds wallets); fixtures + `kv:seed`; `smoke:m2` 10/10 green. Notable fixes: fixture wca_id omission, seed about-slug mismatch, miniflare-R2 stream quirk (buffered bytes), test-secret always-pass quirk (negatives via empty token).

- M4 sync DONE (local, no WP-00): daily cron worker pulls official v0 (registration windows/limits, WCIF rounds) + unofficial static (comps/BD, per-event ranks, holder persons, per-comp 333 results); strips ALL emails; KV cache + nightly snapshots + derived champions; outbox flush via Resend (skips cleanly without keys). Proven LIVE via `wrangler dev --test-scheduled` against real WCA: 28 comps, 17 canonical record lines, 31 snapshots, 26 champions, zero emails in KV. Unit harness `test:sync` 5/5 on real compiled code. Learnings: canonical-17 allowlist (upstream ships removed events), FMC-in-moves + MBLD-omitted display rule, per-config local D1/KV state (migrate both).

- M3 accounts + money DONE (local; live OAuth waits on WP-00 app): HMAC sessions (`test-auth` 6/6), WCA OAuth routes (endpoints/scopes/me-shape verified from thewca/wca-oauth; null-WCA newcomer path), registration/tx/consent/me endpoints (ownership, pending-only, dup-TxID 409, WCA-validated), dashboard (profile, PBs, 4-step tracker, history, consent, print slip), `smoke-m3` 5/5 via dev session seam. Notable fixes: KV shape standardized to upstream `items` (was the dashboard 500), list-fallback for names/registration, kv-seed shapes through real compiled shapers.

## Current focus

- HUMAN: execute `plan/OPS_HANDOFF.md` (WP-00) and reply "WP-00 done" — remote deploy waits on it.
- AGENTS next: M5 content + launch — WP-50 punchlist sweep, WP-51 seeding runbook, WP-52 QA matrix, WP-53 cutover. Needs WP-00 (remote) + human content entry; code-complete after this line except OAuth live-test.

## Gaps / unknowns

- Bank account (org name vs individual) pending verification with WCA/banks.
- Payment number custody + TxID verifier roster undefined (blocks M3 staffing).
- Photo-consent ops undefined (blocks WP-51 seeding; gate is specced, process owner missing).
- Bulk newsletter provider undefined (transactional Resend decided; broadcast list still open).
- Worlds 2027 candidate list undefined (page shape + refund policy approved, content pending).
- WCA OAuth app credentials + redirect URLs undefined (blocks WP-30).
- Cloudflare Access admin list undefined (blocks WP-16).
