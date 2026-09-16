# CURRENT_STATE

Updated: 2026-09-16 (LIVE: Pages deployed, sync running in prod, both logins tested). Newest first. This is the file the next agent reads to avoid reconstructing context from chat.

## Live in production (https://speedbd-web.pages.dev)

- Pages project `speedbd-web` (Git-connected, root `web`) deployed green; D1 `speedbd` (24 tables), KV `wca-cache`, R2 `speedbd-media`, Turnstile widget, Access app `speedbd-admin` (path-scoped `/admin*`, 8-email Allow policy) all live. Secrets wired (5 encrypted + 2 plain vars). Full trail: `plan/OPS_HANDOFF.md`.
- Sync worker `speedbd-sync` live with THREE crons: ranks+lists 02:00, details+champions 02:30 (split because free-plan workers get ~50 fetch subrequests/invocation — proven; detail loop sequential against WCA 429s), outbox flush every 5 min (skips cleanly, Resend skipped). First runs filled prod: 28 comps, 17 NR lines, 31 snapshots, 9 champions.
- Both logins tested by human 2026-09-16: Access gate (incl. Gmail dot-variant lesson) + WCA OAuth (`public email` scope).
- Production UI review completed 2026-09-16 in the signed-in Chrome profile; after the user's CMS authorization fix, an authorized test page draft was created and reopened successfully (slug `codex-qa-smoke-2026-09-16`, still unpublished). A further read-only retest confirmed the homepage date split, ended-event CTA, sampled venue link, and Worlds donation-page first-create path are fixed. Event labels, filters, admin form UX, anonymous donor input, editor preview, Stitch parity, dashboard archive, and some content placeholders remain open; newsletter Turnstile/privacy are partial. Latest 360px behavior was not retested. Findings and screenshots: `plan/PRODUCTION_UI_QA_2026-09-16.md`; CMS save issue resolved on retest.
- Local remediation for remaining in-scope QA findings is implemented in the working tree (not deployed): event names/filters, general champion archive, admin choice lists/uploads/guided forms, editor preview, explicit-intent newsletter verification, clearer empty states, and admin quick actions. Migration `0010_admin_form_choices.sql` must be applied before the new admin fields work in production. Build/check, migration and unit harnesses pass; browser e2e and production screenshots remain pending. Real content, approved privacy/retention language, and per-user historical results still need owners/source data. See the implementation follow-up in `plan/PRODUCTION_UI_QA_2026-09-16.md`.
- Deferred by human decision: Resend onboarding, secret rotation (WCA secret + API token seen in chat), custom domain, real content entry. API token expires 2026-09-23.

## Implemented (M0–M4 code + full docs)

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
- WP-16 + e2e DONE, committed `45c4383`: Access RS256 JWKS verify (`test-access` 4/4), async `requireAdmin` on 7 admin APIs (401/403/503 fail-closed), number-empty omit, Playwright `e2e.mjs` (editor mount, FAQ create, payment accept+409, Turnstile, print CSS `is:global`, mobile shots, dashboard), `db:reset.mjs`; `check`+`build` green.
- WP-03 + WP-51 + WP-52 + product-docs DONE 2026-09-15: `check:budget` guard green, `SEEDING_RUNBOOK.md`, `drills-wp52.mjs` harness (run pending), FEATURE_LIST build-status section, wallet-hint fix; `check`+`check:budget` green.
- WP-50 slice DONE 2026-09-15: masked wallet Reveal (`maskWallet` + `<details>`) on Worlds + comp-detail (closes P4); code-sweep clean (no citations/Axx tags, canonical lockup only, footer N4, private contacts, daily stamps); public JS 0KB (no `client:` directives), admin Editor.js 311KB raw/87.5KB gzip — WP-03 public budget holds.

## Current focus

- HUMAN: real content entry per `plan/SEEDING_RUNBOOK.md` (placeholder purge, photo-consent gate, Worlds copy, real wallets, social handles beyond Facebook) + custom-domain cutover (WP-53) + Resend onboarding when wanted.
- AGENTS next: finish browser/e2e verification of the local remediation, then deploy/apply migration and retest production after approval. A21 per-user historical WCA result data needs a cache/source design; content and privacy retention/rights need owner review. Stitch-only gaps (A1 tasks view, hero stats/photos, Hall of Fame, A15 sitemap/og:image/beacon post-domain) remain subject to approved scope; WP-53 cutover checklist.

## Gaps / unknowns

- Bank account (org name vs individual) pending verification with WCA/banks.
- Payment number custody + TxID verifier roster undefined (blocks M3 staffing).
- Photo-consent ops undefined (blocks WP-51 seeding; gate is specced, process owner missing).
- Bulk newsletter provider undefined (transactional Resend decided but onboarding skipped; broadcast list still open).
- Worlds 2027 candidate list undefined (page shape + refund policy approved, content pending).
- WCA OAuth + Access admin list: RESOLVED 2026-09-16 (app live, 8 Allow emails, logins tested).
- Credential hygiene: WCA secret + API token seen in chat (rotation declined for now); API token expires 2026-09-23.
