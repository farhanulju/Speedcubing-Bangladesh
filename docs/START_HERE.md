# START_HERE — Speedcubing Bangladesh

## What this org is

Speedcubing Bangladesh is the WCA-recognized Regional Organization for Bangladesh. It runs official competitions (Dhaka, Chattogram, Rajshahi, Jhenaidah, …), manages delegates/organizers/volunteers, publishes results and records, and is now raising funds to send competitors to Worlds 2027 (Sweden).

80%+ of visitors will be on mobile. English UI for v1; Bangla is a future locale.

## Source-of-truth order

1. WCA (`worldcubeassociation.org`, WCA Live) for competitions, results, persons, records. We cache and link; local rows mirror, never fork acceptance.
2. D1 (via the admin dashboard) for website content (announcements, people, sponsors, news). This repo holds decisions, plans, and code — never content.
3. Socials (Facebook, WhatsApp Channel) for distribution only — never as the canonical record.

## Boundaries

- Website (`web/`) is three surfaces in v1: public site + user dashboard (WCA OAuth, registrations, payment status, history) + admin dashboard (Access-gated content + payment queue). Registration acceptance stays on WCA. Payment v1 is manual bKash/Nagad Send-Money + TxID form with human verification; automated gateway (SSLCommerz/ShurjoPay) is Phase 2.
- Worlds 2027 fundraising is a separate page (`/worlds-2027`), not a homepage widget.
- News ships in v1 via the admin dashboard; no forum in v1 (Discourse is the recorded future exception). Volunteer and gallery public UI are deferred; competition history replaces regional sub-pages.
- Cloudflare free tier only: Pages, Workers, D1, KV, R2, Turnstile, Access. No Google Forms — all forms are Workers + D1 + Turnstile.

## How to work

1. Read `AGENTS.md`, then `docs/project-memory/CURRENT_STATE.md`.
2. Pick scope only from checked items in `docs/product/FEATURE_LIST.md`.
3. Follow `docs/architecture/ARCHITECTURE.md` for data shapes and caching.
4. Record decisions in `DECISION_REGISTER.md`, progress in `DEVELOPMENT_LOG.md`, next-agent context in `CURRENT_STATE.md`.

## Inspirations (researched Sep 2026)

- Functionality: `westcoastcubing.com` — regional hub → sub-region pages, delegate cards with WCA links, first-timer FAQ, lost & found form, CubersLive media brand. Does not re-implement registration/results.
- UI/org maturity: `speedcubing.org.au` — nonprofit story + legal identity + published financial reports, committee/roles/delegates by state, competitions list+map, national records table, 14-item FAQ, newsletter per state.

## WCA data (researched Sep 2026)

- Official API v0: OAuth + `/api/v0/competitions?country_iso2=BD`, `/competitions/:id/wcif/public`, `/competitions/:id/results`. For reads at our scale, prefer the unofficial API below.
- Unofficial REST API (`wca-rest-api.robiningelbrecht.be`, WST-endorsed, daily static JSON): `/v1/competitions/:id.json`, `/v1/persons/:wca_id.json`, ranks, events, championships. 1-day lag is fine for our pages.
- WCA Live + WCIF: day-of source of truth. Embed/link, never replace.
