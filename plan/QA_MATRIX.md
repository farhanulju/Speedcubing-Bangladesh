# QA MATRIX — WP-52 (local results 2026-09-15; prod smoke pending on live data)

How to re-run locally: `npm run db:reset` → `npm run kv:seed` →
`npm run dev -- --port 4321` → harnesses below. Verified registrations are
immutable, so re-runs need a fresh `db:reset` first.

## Harnesses (all green 2026-09-15, fresh seed)

| Harness | Command | Result |
|---|---|---|
| Public pages + forms | `node scripts/smoke-m2.mjs` | 10/10 |
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

Playwright `e2e.mjs` captures 8 screenshots (390px mobile: home,
competitions, comp-detail, records, faq, contact; 1280px: dashboard, payment
inspection) plus editor-mount, FAQ-create, payment-accept+409, Turnstile, and
print-CSS checks — all green. Visual review of the captures is pending.

## Pending (needs WP-00 remote or human)

- Real-secret Turnstile accept/reject, live Resend delivery, live WCA OAuth
  login, live Access gate, daily cron + outbox flush on schedule.
- DNS cutover, secrets rotation, KV warm, rollback rehearsal (<15 min).
- Full screenshot review across 360/768/1280px per route. A targeted production visual pass at 360px and desktop, including an authorized unpublished CMS draft-save attempt, was completed 2026-09-16; the save was rejected with `admin login required (Cloudflare Access)`. Findings are in `plan/PRODUCTION_UI_QA_2026-09-16.md`.
- D1-write-fail at the driver level (covered by validation gates locally).
