# QA MATRIX — WP-52 (local results refreshed 2026-09-17; production-readiness patch not deployed)

How to re-run locally: `npm run db:reset` → `npm run kv:seed` →
`npm run dev -- --port 4321` → harnesses below. Verified registrations are
immutable, so re-runs need a fresh `db:reset` first.

## Harnesses (all green 2026-09-17, fresh seed)

| Harness | Command | Result |
|---|---|---|
| Public pages + forms | `node scripts/smoke-m2.mjs` | 11/11, including SEO metadata + public-only robots/sitemap |
| Accounts + money | `node scripts/smoke-m3.mjs` | 5/5 |
| Failure drills | `node scripts/drills-wp52.mjs` | 9/9 |
| Empty-KV (WCA-down) | manual wrangler deletes + marker fetch | 3/3 honest-empty, zero 500s |
| Unit: sync/auth/access/db | `test-sync`, `test-auth`, `test-access`, `db:check` | 5/5, 6/6, 4/4, green |
| Static + budget | `npm run check`, `check:budget`, `build` | 0 errors, green, green |

## Failure drills (detail)

| Drill | Expected | Got |
|---|---|---|
| Contact / opt-in / lost-found with empty Turnstile token | 403, nothing written (contact count unchanged) | 403 ×3, count unchanged |
| `GET /api/media/definitely-not-a-key` | 404 | 404 |
| `GET /competitions/NoSuchComp2026` | 302 to canonical WCA URL | 302 |
| Registration unknown event `999` | 400 | 400 |
| Tx negative amount | 400 `amount must be whole taka` | 400 |
| Admin FAQ upsert missing `q` | 400 | 400 |
| Payment accept with no `RESEND_API_KEY` | 200, `tx_status=accepted`, `reg_status=verified`, dashboard updated | 200, verified |
| Empty KV: `/`, `/competitions`, `/records` | 200 + honest empty copy | 200 ×3, markers present |
| `GET /api/auth/login` without WP-00 app | configured 500 (fail-closed, no redirect loop) | 500 |

## Routes × viewports

Playwright `e2e.mjs` captures mobile home, competitions, comp-detail, records,
FAQ, contact and lost-found plus desktop dashboard/payment views. It also checks
editor mount, FAQ create, managed admin inputs, payment accept+409, intent-only
newsletter Turnstile, contact Turnstile, print CSS, the 360px public menu, and
the 360px dashboard/guardian state — all green. The repaired mobile menu and
generated social card were also visually checked in the requested Chrome profile.

## Pending (needs WP-00 remote or human)

- Real-secret Turnstile accept/reject, live Resend delivery, live WCA OAuth
  login, live Access gate, daily cron + outbox flush on schedule.
- DNS cutover, secrets rotation, KV warm, rollback rehearsal (<15 min).
- Full screenshot review across 768/1280px per route remains pending. Production fixes confirmed in the last live read-only pass include the home date split, ended-event registration closure, sampled venue link, and donation-page first-create path. The local, not-yet-deployed patch adds the remaining UX fixes plus mobile-menu, metadata, sitemap/robots, media safety, dashboard semantics, and security headers. Owner content/privacy review, analytics/custom-domain setup, and local per-user WCA archive data remain open. See `plan/PRODUCTION_UI_QA_2026-09-16.md` for evidence and status.
- D1-write-fail at the driver level (covered by validation gates locally).
