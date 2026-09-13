# DECISION_REGISTER

Durable decisions. Newest first. Format: `YYYY-MM-DD — Decision — rationale — owner`.

- 2026-09-14 — English-only website v1; Bangla is a future locale, not a priority — keeps v1 shippable; content structured for later `bn/` locale — board.
- 2026-09-14 — Worlds fundraising is a separate page (`/worlds-2027`), not a homepage section — needs its own story, progress, donor wall, refund policy — board.
- 2026-09-14 — Volunteer names/data are public (name, focus area, member-since); tiers and internal notes stay private and are never rendered — recognition without hierarchy drama — board.
- 2026-09-14 — Competition announcements managed in this repo and rendered by the site — single canonical record instead of scattered Facebook posts — board.
- 2026-09-14 — Cloudflare free tier only (Pages, Workers, D1, KV, R2, Turnstile) — generous free plan, single vendor, no new bills — board.
- 2026-09-14 — One repo is the source of truth for org + discussion (`docs/`, `plan/`, `web/`) — avoids knowledge split across drives/chats — board.
- 2026-09-14 — WCA is source of truth for comps/results/persons/records; site caches daily and links back — avoids fork drift and rate limits — research.
- 2026-09-14 — No blog/forum in v1 — moderation and editorial capacity missing; announcements + gallery + records cover v1 needs — board call.
- 2026-09-14 — Payment v1 is manual bKash/Nagad Send-Money + TxID form; automated gateway is Phase 2 — merchant onboarding takes time; manual unblocks comps now — board call.
- 2026-09-14 — Money is whole taka (integers only, no paisa) — matches local payment reality — standing rule.
- 2026-09-14 — MVP review applied: A1 home, A2 about, A3 people, A4 competitions, A5 comp detail, A6 manual-payment guide, A7 announcements, A8 FAQ, A11 lost-found ship; A9 volunteers and A10 gallery UI deferred (data models stay ready) — board review; low volunteer count and no gallery need right now.
- 2026-09-14 — Records (ex-B1) promoted into MVP: BD NR table + hero cards from daily WCA export cache — cheap, high prestige — board review.
- 2026-09-14 — News posts required in MVP (comp recaps, NR posts, Worlds journey), managed via admin dashboard — media home without a forum — board review.
- 2026-09-14 — WCA authentication in MVP: users log in with WCA OAuth, validate WCA ID, register on our site; long-term direction is our own registration UX with WCA as the canonical publish target — board review.
- 2026-09-14 — Competition-history view (general archive + per-user history in dashboard) replaces regional sub-pages, which are deferred indefinitely (Dhaka not proceeding) — board review.
- 2026-09-14 — No Google Forms anywhere: no embeds, no iframes. All forms are Cloudflare-native (Workers + D1 + Turnstile) for maintainability — board review.
- 2026-09-14 — Lost-found is a simple Cloudflare form → D1 inbox. No Durable Object / workflow needed — board review.
- 2026-09-14 — Repo stores no content. All content (announcements, people, sponsors, FAQ, news, comp overrides, Worlds page, donation totals) lives in D1 and is managed via an MVP admin dashboard; phases out the earlier repo-markdown interim — board review.
- 2026-09-14 — Three surfaces in MVP: public site + logged-in user dashboard (registrations, payments, history) + admin dashboard (content, announcements, payment verification). Admin gated by Cloudflare Access; users via WCA OAuth — board review.
- 2026-09-14 — Payments stay manual + human-verified in MVP, with a dedicated payment dashboard (verification queue, accept/reject, receipt note) — board review.
- 2026-09-14 — Rich-text editor choice: TipTap over TinyMCE — headless, MIT-licensed, JSON output that sanitizes cleanly for static render, no cloud key or GPL encumbrance; fixed toolbar with restricted marks — board review.
- 2026-09-14 — Site search deferred to later; school portal and membership not needed; rankings stay Phase 2 — board review.
- 2026-09-14 — If a forum is ever added, it will be Discourse (open-source) — recorded exception to Cloudflare-only, since Discourse needs its own host; needs a separate hosting decision before build — board review.
