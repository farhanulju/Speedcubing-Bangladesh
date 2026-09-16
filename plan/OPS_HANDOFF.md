# OPS HANDOFF — WP-00 dashboard clicks (human-only, ~30 min)

Agents cannot click Cloudflare/WCA/Resend dashboards. A human does this list once, in order, then agents take over (WP-01+ is already scaffolded). Tick each box; paste IDs only into the files named — never into chat.

## 1. Cloudflare Pages app

- [x] Project `speedbd-web` created via API 2026-09-16 → `https://speedbd-web.pages.dev/` (live after first deploy).
- [x] GitHub connected (`farhanulju/Speedcubing-Bangladesh`, branch `main`, deployments on). Root dir fixed to `web` via API (was empty — builds would have failed). Build `npm run build`, output `dist`.
- [x] First deploy built green 2026-09-16 (cf0bf4d). Compat date `2026-09-01` + `nodejs_compat` set via API. The `wrangler.json` warning in logs is harmless (Pages ignores it; dashboard/API is source of truth — file still drives local dev).
- [ ] Bindings CANNOT go via project PATCH (API 400s) — add in dashboard: project → Settings → Bindings → Add: D1 name `DB` → `speedbd`; KV `WCA_CACHE` → `wca-cache`; R2 `MEDIA` → `speedbd-media`. Without these every data page 500s.
- [ ] Then Retry deployment (bindings + compat need a fresh deploy). Then the live URL serves the app.

## 2. D1 database

- [x] Created via API 2026-09-16: `speedbd`, id `53805520-bdb1-474a-aab5-e4368118a5a5`.
- [x] ID wired into `web/wrangler.jsonc` AND `web/workers/sync/wrangler.jsonc`.
- [x] Migrations 0001–0009 applied remote; verified 24 tables, 0 rows (no seed data in prod — WP-51 only).

## 3. KV namespace (WCA cache)

- [x] Created via API 2026-09-16: `wca-cache`, id `082f9d45da744e2a8f2a6825045e4bf8` (+ preview `5bc0cca379b04480b0bc5b82aa6237f5`).
- [x] IDs wired into the same two `wrangler.jsonc` files.

## 4. R2 bucket (media)

- [x] Bucket `speedbd-media` created via API 2026-09-16 (after human enabled R2). No public dev URL — served via Worker.

## 5. Turnstile (spam shield)

- [x] Widget `speedbd-local` created via API 2026-09-16, mode Managed, domains `localhost` + `127.0.0.1` + `speedbd-web.pages.dev` (prod hostname added before first deploy so live forms verify).
- [x] Site key + Secret stored in root `.env` (gitignored, never commit). Local `.dev.vars` keeps documented test keys (harnesses depend on always-pass).
- [ ] Add the custom domain to the widget once DNS is known (Turnstile dash → widget → Domains).

## 6. Access (admin gate)

- [x] Zero Trust enabled by human; app `speedbd-admin` created via API 2026-09-16 (destinations `speedbd-web.pages.dev/admin` + `/admin/*`; team `falling-scene-e081.cloudflareaccess.com`, renameable in Zero Trust settings).
- [x] `ACCESS_TEAM_DOMAIN` + `ACCESS_AUD` saved to gitignored root `.env`.
- [x] Policy `org-admins` (Allow) created via API 2026-09-16, now 8 rules (6 originals + dotted Gmail variant + munemshahriar007@gmail.com). Lesson: Access matches email strings EXACTLY — Gmail ignores dots but Access does not. No Cloudflare account invites needed: email-OTP policies admit any listed Gmail; the 50 free seats count monthly active users automatically.
- [ ] Add the two `ACCESS_*` values to Pages env (step 8) + redeploy.
- [ ] Test: logged-out visit to `/admin` redirects to Access login.

## 7. Resend (transactional email)

- [ ] Resend dashboard → Domains → Add + verify DNS (3 records at registrar).
- [ ] Create API key (sending only) → save for step 8. Sender identity, e.g. `Speedcubing BD <noreply@<domain>>`.
- [ ] Note: free tier 3k/mo, 100/day — matches outbox design (dashboard stays canonical).

## 8. Secrets (Pages project → Settings → Variables & Secrets)

Done via API 2026-09-16 (verified: 5 encrypted secrets + 2 plain vars; plain-text secret copies deleted):

- [x] Secrets: `SESSION_SECRET`, `WCA_CLIENT_SECRET`, `TURNSTILE_SECRET_KEY`, `ACCESS_TEAM_DOMAIN`, `ACCESS_AUD`
- [x] Plain vars: `PUBLIC_TURNSTILE_SITE_KEY` (exact name — code reads it at build time), `WCA_CLIENT_ID`
- [ ] `RESEND_API_KEY` — skipped with Resend (step 7). `EMAIL_FROM` / `ORGANIZER_INBOX` unread by code today; add with Resend.
- [ ] Sync worker: `wrangler secret put RESEND_API_KEY -c workers/sync/wrangler.jsonc` (run from `web/`) — with Resend.

Local dev mirror: copy `web/.dev.vars.example` → `web/.dev.vars`, fill values (gitignored).

## 9. WCA OAuth app (user login)

- [ ] `worldcubeassociation.org/oauth/applications` → app exists (`Speedcubing Bangladesh`). Replace the callback list with exactly: `https://speedbd-web.pages.dev/api/auth/callback` + `http://localhost:4321/api/auth/callback` (remove `https://127.0.0.1` — code builds `origin + /api/auth/callback`, so any other value breaks login).
- [ ] Scopes: `public email` (matches `WCA_OAUTH_SCOPE` default in `api/auth/login.ts`; needs profile + WCA ID + email).
- [x] Client ID/secret saved to gitignored root `.env` 2026-09-16 (`WCA_CLIENT_ID`, `WCA_CLIENT_SECRET`, `WCA_OAUTH_SCOPE`, generated `SESSION_SECRET`). Secret was pasted in chat — consider regenerating in WCA dash after setup, then update `.env` + Pages secret.

## 10. Sync worker deploy

- [x] Deployed via API token 2026-09-16: `speedbd-sync` (version `802f613e`), bindings KV + D1 confirmed.
- [x] Triggers live: `0 20 * * *` ranks stage, `30 20 * * *` detail stage, `*/5 * * * *` outbox flush. Outbox flush skips cleanly without `RESEND_API_KEY` (by design until step 7 returns).
- [x] First manual runs 2026-09-16 filled prod: 28 comps, 17 record lines, 31 snapshots, 9 champions, full WCIF details (temp gated trigger used, then removed + secret deleted + redeployed clean).

## Done when

`/api/health` returns `{"ok":true}`, `/admin` challenges via Access, D1 shows 24 tables, KV + R2 exist, Resend domain verified. Report back with ONLY "WP-00 done" (no secrets in chat) and agents continue at WP-10.
