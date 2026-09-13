# FEATURE_LIST — board review checklist

Tick what ships immediately. Only ticked items may be built. Unticked items stay parked in Phase 2 / Future.

Conventions: `Source` = where data comes from (WCA = do not duplicate). `CF` = Cloudflare free-tier piece. Effort: S < 3d, M < 2w, L > 2w. All UI English-only v1. Mobile-first.

## How to review

1. Go through **A. MVP candidates** row by row. Tick = "build now". Cross = "defer".
2. Do not pull Phase 2 items into MVP without moving a dependency with it (see Depends column).
3. Worlds fundraising is always a **separate page** (`/worlds-2027`), never a homepage widget.

## A. MVP candidates (Immediate — trust + comps + people)

| # | Tick | Feature / route | Problem it solves | Source | CF | Effort | Depends |
|---|------|-----------------|-------------------|--------|----|--------|---------|
| A1 | [ ] | Home `/` — hero (next comp countdown), trust strip (WCA Regional Org), next-3 comps, NR spotlight, sponsors strip, Worlds banner → `/worlds-2027` | "Who are you, are you legit, when is the next comp?" | WCA cache + repo content | Pages (static, ISR daily) | M | A4 |
| A2 | [ ] | About `/about` — story, mission/vision, legal identity placeholder, financial-report slot (like SCA), contact | Sponsor/parent trust; "are they fokinni?" | Repo markdown | Pages static | S | — |
| A3 | [ ] | Our People `/people` — execs + delegates (photo, role, WCA ID link), volunteers (name, focus area, member-since only) | Recognition; delegate lookup | Repo content + `wca_id` links | Pages static + R2 photos | M | Content model §ARCH |
| A4 | [ ] | Competitions `/competitions` — upcoming auto-list (BD) + past list, city filter | Scattered Facebook posts; "where do I register?" | Unofficial API `competitions` + official v0 `country_iso2=BD`, cached daily | Workers Cron → KV → Pages | M | ARCH cache |
| A5 | [ ] | Competition detail `/competitions/[slug]` — dates, venue/map, fee tiers (Early/Late/Spot), schedule, events/limits, payment steps, refund + ID policy, WCA + WCA Live buttons | "How much, how do I pay, am I accepted?" (acceptance stays on WCA) | WCA WCIF-public + repo override file per comp | Pages ISR | M | A4 |
| A6 | [ ] | Registration guide + manual payment v1 — WCA account → Register on WCA → bKash/Nagad Send-Money → TxID form → organizer verifies manually | Unblocks comps without merchant account | Repo markdown + form → D1 | Pages + Worker + D1 + Turnstile | M | A5 |
| A7 | [ ] | Announcements — pinned notices (registration open/close, venue change) managed in-repo, shown on Home + comp page | Single canonical record, not chat threads | Repo content collection | Pages static | S | — |
| A8 | [ ] | FAQ `/faq` — first-timer guide (bring own cube + mark it, WCA ID after first comp, no age divisions, time limits, spectators free, filming rules, results on WCA Live → WCA DB) | Re-asked questions burn delegate time | Repo markdown | Pages static | S | — |
| A9 | [ ] | Volunteers `/volunteers` — public roster + Join form (name, area, availability, mobility Dhaka/outside, skills: design/video) | 12–13 applicants now ad-hoc; future recruiting | Roster: D1 (public view); Applications: D1 (private) | Pages + Worker + D1 | M | Content model |
| A10 | [ ] | Gallery `/gallery` v1 — manual curated albums `/{year}/{comp-slug}/`, link to Google Photos overflow | "Where are my photos?" | Repo-curated, R2 images | Pages + R2 | S | R2 bucket |
| A11 | [ ] | Lost & Found `/lost-found` — form (comp, item, photo) → delegate inbox/tracker | Lost cubes every comp | Form → D1 | Pages + Worker + D1 | S | — |
| A12 | [ ] | Sponsors `/sponsors` — logo wall, what funds cover, media-kit PDF download | Sponsor asks "where does money go?" | Repo content + R2 PDF | Pages static | S | A2 |
| A13 | [ ] | Worlds 2027 `/worlds-2027` — story, target (e.g. ৳10L), manual progress total, candidate criteria (TBD), donor wall (opt-in), refund-if-visa-fails policy | Crowdfunding needs a home separate from comps | Manual total in repo/D1 | Pages static | M | A12 |
| A14 | [ ] | Contact `/contact` + updates opt-in (newsletter + WhatsApp Channel link + voluntary broadcast signup) | "How do I reach you / follow comps?" — explicit opt-in only, never scraped phones | Form → D1; newsletter via free provider | Pages + Worker + D1 | S | — |
| A15 | [ ] | SEO + analytics + social plumbing — `og:image` (stills only), sitemap, lightweight analytics, link-in-bio landing | Discovery + sharing on mobile | Repo config | Pages headers | S | — |

## B. Phase 2 — good-to-have (3–9 months, needs MVP live + owners)

| # | Feature | Why now | Source | CF | Effort |
|---|---------|---------|--------|----|--------|
| B1 | Records `/records` auto — BD NR table (like SCA), history, hero cards | High prestige, cheap (daily JSON) | Unofficial `ranks`/`results` cache | Cron → KV → Pages | M |
| B2 | Rankings `/rankings/[event]` — BD rankings per event | "Where do I stand?" | Unofficial `ranks` cache | Cron → KV → Pages | M |
| B3 | Payments v2 — SSLCommerz/ShurjoPay aggregator (cards + bKash/Nagad/Rocket), IPN reconcile, waitlist auto-promote, treasurer dashboard | Kill manual TxID matching | Gateway IPN → D1 | Worker + D1 | L |
| B4 | Gallery backend — admin upload, consent flag, album per comp | Manual curation won't scale | R2 + D1 meta | Worker + D1 + R2 | M |
| B5 | Volunteer backend — internal tiers/notes, slot assignment, hours log (public stays flat) | Fairs + scheduling | D1 (private fields never rendered) | Worker + D1 | M |
| B6 | Organizer toolkit — comp checklist, budget template, venue letter, school-outreach pack (notice-board letter + script; Jhenaidah lesson) | Grow outside Dhaka | Repo docs + downloads | Pages static | M |
| B7 | Donations v2 — receipts, expense log feeding financial report, auto totals | Sponsor trust at scale | D1 | Worker + D1 | M |
| B8 | News posts (not forum) — comp recaps, NR posts, Worlds journey | Media coverage home | Repo content | Pages static | S |
| B9 | Site search (comps, people, FAQ, records) | Content outgrows nav | Local index | Pages client index | M |

Explicitly **not** in Phase 2: WCA OAuth login, regional sub-pages (`/dhaka/…`), school portal, PWA push, forum. Those are Future.

## C. Future — Year 2+ (only when volume demands)

- WCA OAuth → `My cubing` dashboard (my comps, PBs from person API, registration status).
- Live hub: WCA Live embed + CubersLive-BD (streams, interviews).
- Regional pages (`/dhaka`, `/chattogram`, …) once 20+ comps/yr (SCA does 60+/yr; BD runs a handful today).
- School portal: request-a-comp form, toolkit, school leaderboard.
- Membership/fees if org formalizes; PWA offline schedule + push on registration open.
- Forum/community only with moderation capacity. Open JSON API for third parties.

## Non-goals (do not build)

- Mirroring WCA registration acceptance, live results entry, or scramble distribution. Link to WCA / WCA Live.
- Bangla UI in v1. Structure strings for future `bn/` locale but ship English.
- Pipra Pay integration (flagged sketchy in board call). Phase 2 uses PSO-licensed aggregators only.
- Public volunteer tiers, public DOB/phones/addresses, YouTube URLs in `images[]` (stills only).
