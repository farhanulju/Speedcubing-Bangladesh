# DEVELOPMENT_LOG

Newest first. One line per meaningful change.

- 2026-09-15 — WP-50 slice: masked wallet Reveal on Worlds + comp-detail (closes P4); punchlist code-sweep clean (no fabricated citations/Axx tags, lockup canonical, footer links, claimed-log private); public JS 0KB, admin Editor.js 311KB raw/87.5KB gzip (WP-03 public budget holds, admin-only).
- 2026-09-15 — WP-03 budget guard shipped: `scripts/check-budget.mjs` (`npm run check:budget`) pins @editorjs/* exact, confines Editor.js to EditorField, bans `client:` hydration in public pages, budgets chunks at 200KB gzip; green on current build.
- 2026-09-15 — WP-51 runbook drafted: `plan/SEEDING_RUNBOOK.md` (owner matrix, placeholder inventory, purge-audit SQL, photo-consent gate, donor/Worlds checklist, sign-off); fixed stale wallet hint in `admin.ts`; `check`+`check:budget` green. Human entry waits on WP-00.
- 2026-09-15 — Product docs synced to built state: build-status section in `docs/product/FEATURE_LIST.md` (A1–A22 vs code evidence; scope ticks untouched); open gaps named for M5 (A1 countdown, A4 past split, A5 roster, A15 plumbing, A16 progression, A21 archive).
- 2026-09-15 — WP-16 Access JWT shipped (RS256 JWKS verify, fail-closed 401/403/503, dev-bypass seam) + `test-access` 4/4; `requireAdmin` async across 7 admin APIs; number-empty omit fix; e2e Playwright harness (`db:reset`, `e2e.mjs` 7 checks + 8 screenshots) + slip print-CSS `is:global` fix; `check`+`build` green (pending commit).
- 2026-09-14 — M3 accounts + money shipped: HMAC sessions, WCA OAuth routes, registration/tx/consent/me endpoints, dashboard + print slip; `test-auth` 6/6, `smoke-m3` 5/5; fixed KV `items` shape + list fallbacks + shaping kv-seed.

- 2026-09-14 — M4 sync worker shipped + proven LIVE (`--test-scheduled` vs real WCA: 28 comps, 17 records, 31 snapshots, 26 champions, 0 emails); `test-sync` 5/5; canonical-17 filter + FMC/MBLD display rules; per-config local-state lesson recorded.

- 2026-09-14 — M2 public site shipped: 13 data pages (KV+D1, SSR + edge s-maxage), Turnstile public endpoints (contact/lost-found+photo-pdf/opt-in), migration 0009 (worlds wallets), fixtures + `kv:seed`, `smoke:m2` 10/10 green; fixed fixture wca_id, seed slug, R2-stream quirk, test-secret quirk.

- 2026-09-14 — WP-14 + WP-15 shipped: payment queue UI + atomic decision txn (fee track + audit + outbox, 409 guard, manual WCA tick) + lost-found/contact inboxes; migration 0008 (competitor.email); `db:seed`; full local-D1 flow verified incl. side-effect assertions; `check`+`build` green.
- 2026-09-14 — WP-13 admin CRUD shipped: registry-driven API + index/list/edit pages with EditorField; end-to-end local-D1 verified (CRUD, 400/404 paths, attr-JSON proof); fixed optional-editor + required-checkbox coercion. Auth: switched machine gh identity to farhanulju after farhanulbevy 403 (READ-only); push restored.

- 2026-09-14 — M1 (no WP-00): WP-10 schema green via `npm run db:check` (seed + constraints); WP-12 Editor.js pinned exact + allowlisted parsers + EditorField; WP-11 uploader (503 fail-closed) + media route (400/404) smoke-verified; `check`+`build` green.

- 2026-09-14 — M0 scaffold built green: Astro 5 + TS + Tailwind v4, tokens shell, 19 routes (placeholders), workers/api + sync-worker stubs, migrations 0001–0007, `.dev.vars.example`; `check`+`build`+dev smoke pass; workers-types→v5 for wrangler peer; added `plan/OPS_HANDOFF.md` (WP-00).
- 2026-09-14 — Issued executable build: `plan/BUILD_PLAN.md` (WP-00…WP-53, M0–M5, API/cron/secrets tables, launch runbook); recorded round-2 review (`plan/DESIGN_REVIEW_ROUND2.md`); amended ARCHITECTURE (Resend outbox, snapshots/champions, acceptance split, audit log, consent, slip route); added A22 email + B10 psych sheet; decided Astro, Resend, CF Web Analytics, content-accuracy rules; fixed ROADMAP staleness (TipTap ref, A19 typo).
- 2026-09-14 — Evaluated Editor.js vs TipTap/TinyMCE; switched admin rich-text to Editor.js (block allowlist, flat D1 JSON, Node rendering for ISR, R2 uploader hook, Apache-2.0). Updated ARCHITECTURE §5, FEATURE_LIST A18/A20, AGENTS.md, web docs, DECISION_REGISTER.
