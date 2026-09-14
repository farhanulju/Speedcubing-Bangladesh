# OPS HANDOFF — WP-00 dashboard clicks (human-only, ~30 min)

Agents cannot click Cloudflare/WCA/Resend dashboards. A human does this list once, in order, then agents take over (WP-01+ is already scaffolded). Tick each box; paste IDs only into the files named — never into chat.

## 1. Cloudflare Pages app

- [ ] Dash → Workers & Pages → Create → Pages → Connect to Git → select `Speedcubing-Bangladesh` repo.
- [ ] Framework preset: Astro. Root directory: `web`. Build command: `npm run build`. Output: `dist`.
- [ ] Deploy once (placeholder site is expected). Note the `*.pages.dev` URL → final domain later (M5 cutover).

## 2. D1 database

- [ ] Workers & Pages → D1 → Create → name `speedbd` (region: nearest to Dhaka).
- [ ] Copy the database ID into `web/wrangler.jsonc` AND `web/workers/sync/wrangler.jsonc` (replace both `REPLACE_WITH_D1_ID` markers).
- [ ] From `web/`: `npm run db:migrate:remote` (applies `migrations/0001–0007`).

## 3. KV namespace (WCA cache)

- [ ] Workers & Pages → KV → Create namespace `wca-cache`.
- [ ] Copy the ID into the same two `wrangler.jsonc` files (`REPLACE_WITH_KV_ID` markers).

## 4. R2 bucket (media)

- [ ] R2 → Create bucket `speedbd-media` (default settings; no public dev URL needed — served via Worker).

## 5. Turnstile (spam shield)

- [ ] Security → Turnstile → Add site → mode Managed. Add the production domain + `localhost` (dev).
- [ ] Save Site key + Secret key for step 8.

## 6. Access (admin gate)

- [ ] Zero Trust → Access → Add application → Self-hosted. Name `speedbd-admin`.
- [ ] Protect path: `<pages-domain>/admin*` (tighten to exact admin routes post-M1 if desired).
- [ ] Policy: Allow → Emails → paste each admin's email (board + delegates only; ≤50 free seats).
- [ ] Test: logged-out visit to `/admin` redirects to Access login.

## 7. Resend (transactional email)

- [ ] Resend dashboard → Domains → Add + verify DNS (3 records at registrar).
- [ ] Create API key (sending only) → save for step 8. Sender identity, e.g. `Speedcubing BD <noreply@<domain>>`.
- [ ] Note: free tier 3k/mo, 100/day — matches outbox design (dashboard stays canonical).

## 8. Secrets (Pages project → Settings → Variables & Secrets)

Add each as **secret** (not plain variable):

- [ ] `SESSION_SECRET` (generate: `openssl rand -base64 32`)
- [ ] `WCA_CLIENT_ID` / `WCA_CLIENT_SECRET` (from step 9)
- [ ] `RESEND_API_KEY` (from step 7)
- [ ] `EMAIL_FROM` (e.g. `Speedcubing BD <noreply@<domain>>` — must match the verified Resend domain)
- [ ] `TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY` (from step 5)
- [ ] `ORGANIZER_INBOX` (e.g. `organizers@<domain>` — TxID fail-closed BCC)
- [ ] Sync worker: `wrangler secret put RESEND_API_KEY -c workers/sync/wrangler.jsonc` (run from `web/`).

Local dev mirror: copy `web/.dev.vars.example` → `web/.dev.vars`, fill values (gitignored).

## 9. WCA OAuth app (user login)

- [ ] `worldcubeassociation.org/oauth/applications` → New → callback URL `https://<production-domain>/api/auth/callback` (+ `http://localhost:4321/api/auth/callback` for dev if allowed).
- [ ] Save client ID/secret into step 8. Scopes: default profile only.

## 10. Sync worker deploy

- [ ] From `web/`: `npx wrangler deploy -c workers/sync/wrangler.jsonc` (after steps 2–3 IDs are in).
- [ ] Workers → Triggers confirm two crons: daily `0 20 * * *` (02:00 Dhaka), every-5-min outbox flush.
- [ ] Bodies are stubs until WP-40/WP-42 — deploy succeeds, crons throw "not implemented" until then (expected).

## Done when

`/api/health` returns `{"ok":true}`, `/admin` challenges via Access, D1 shows 20 tables, KV + R2 exist, Resend domain verified. Report back with ONLY "WP-00 done" (no secrets in chat) and agents continue at WP-10.
