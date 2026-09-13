# DESIGN REVIEW — Round 2 (2026-09-14)

Source: Stitch project `1262927000140828637` ("Speedcubing Bangladesh Web Portal").
Method: re-listed screens, downloaded fresh renders for all 13 new + 4 re-rendered screens, inspected each at full resolution. Screens with unchanged render URLs are treated as unchanged.

## New screens this round (13)

Our People, News, Sponsors, Lost & Found, Competition Detail (desktop + mobile), User Dashboard (desktop + mobile), Home (mobile), Records (mobile), FAQ (mobile), Competition Detail is also mobile, Payment Queue (mobile), Modal — Add Competition.

## Re-rendered (4)

Competitions, Records, Admin Competitions, Quick Payment Inspection modal.

## Unchanged (same render — findings against these still stand)

Home (desktop), Worlds 2027, About, FAQ (desktop), Contact, Admin Overview, Payment Verification page, System Settings ×2, Overview Default State, Create Announcement modal.

## A. Fixed & verified ✅

| # | Round-1 finding | Evidence |
|---|-----------------|----------|
| F1 | Missing pages | People, News, Sponsors, Lost & Found, Comp Detail, User Dashboard all exist (+ mobile for detail/dashboard) |
| F2 | Mobile gap | 6 mobile screens; stacking verified (hero, PR cards, tracker timeline, spotlight cards, fee tiers, FAQ accordion, pay queue) |
| F3 | Two-way-WCA-sync fiction | Detail notice bar (manual acceptance), roster split statuses (Fee Verified on Site vs Accepted on WCA / Pending Delegate Action), modal "Pending Manual Review", pay-queue SOP, AddComp "resolve against WCA ID once approved" |
| F4 | Auto TxID match / API webhooks | Removed from modal + gateway cards; replaced with statement-checklist SOP |
| F5 | Record single "official scramble" | Box removed from spotlight; 5-solve breakdown kept |
| F6 | Registration "on the WCA page" | Detail 3-step flow is site-native (WCA OAuth → our form → Send Money + TrxID) with masked wallet + Reveal |
| F7 | "WCA Live Stream" label | "WCA Live" / "Live Results" on detail pages |
| F8 | Bare counters | "(84 registered on this site)", "CAP: 120 (84 REGISTERED)" |
| F9 | Consent handling | "Consent on File" badges, privacy-protocol notice, guardian-consent card in dashboard |
| F10 | Lost-found3965 | Dedicated page: Turnstile notice, "No external Google Forms. Direct to Delegate D1", R2 upload note, status log, verification protocol |

## B. Partially fixed 🟡

| # | Item | Done | Remaining |
|---|------|------|-----------|
| P1 | Status lockup | New pages use "Prospective WCA Regional Organization" | 6+ live variants persist: "OFFICIAL REGIONAL COMMUNITY" (News), "GOVERNING COUNCIL" + "governing body" (Sponsors), "WCA REGIONAL ORG/HUB" (mobile headers), "Affiliated with WCA" (Lost & Found), "recognized by the WCA" (old footers, dashboard footer). Fix = one lockup component, then re-render all |
| P2 | Numbers disagree | — | 1,240+ vs 1,400+ competitors; 18 vs 45+ comps; record values differ per screen. All stats must derive from the WCA cache job |
| P3 | Sync wording | "Daily WCA Cache Sync (Read-only KV)" panel landed | "two-way sync" roster subtitle + "Sync WCA/Roster Now" button names still imply push. Rename to "Refresh WCA cache" |
| P4 | bKash masking | Reveal pattern on detail + settings | Worlds contribute section still plain-text number (page unchanged) |
| P5 | Messaging automation | SMS fiction removed from modal | Modal still says "Notice sent via email & WhatsApp channel" — email provider undecided at review time (decided: Resend — see DECISION_REGISTER); WhatsApp sends stay manual |

## C. Still open (unchanged screens) 🔴

- Announcement modal: WhatsApp-broadcast checkbox, "WCA registration feeds" copy, Markdown editor (needs Editor.js rebuild).
- Worlds: "updated every 4 hours" donor-wall line; Tri-city conflict (see N2).
- Contact: venue-host registration section (defer to B6); News-subscribe phone field (see N7).
- Settings: dated Bangla promise; "Target Automated Merchant Account" label (also in AddComp modal — reword to "Receiving Merchant Account").
- Admin shells: still three (Delegate Admin Portal / CMS Studio / Admin Studio). Unify to one.
- Desktop Competitions re-render has blank CTA pills (capture glitch) — re-render required to verify F7/F8 there.
- No Editor.js editor screen exists (old TipTap/Markdown screens deleted, not converted).

## D. New issues this round 🆕

| # | Issue | Severity | Fix |
|---|-------|----------|-----|
| N1 | Worlds host city in 3 versions: Sweden (truth) vs "Korea" (News) vs "Minneapolis, USA" (Sponsors) | High (factual) | Single `worlds_host_city` admin field; default Sweden |
| N2 | Fabricated regulation citations: "REGULATION A5/A6", "WCA Regulation A21", "Article 9b", "WCA Rule 1.12", "A6/A17 compliant" | High (trust/legal) | Strip all; cite real WCA links (regulations pages) or nothing |
| N3 | Internal feature tags in UI: "(A3 COMPLIANT)", "LOST & FOUND REGISTRY (A11)" | Medium | Strip all `Axx` tags before build |
| N4 | New pages orphaned: headers/footers link only the original 6 routes | High (nav) | Add People/News/Sponsors/Lost & Found to footer minimum; "More" menu on desktop |
| N5 | "On-the-spot: Strictly Not Permitted by WCA" | Medium (false attribution) | "Not offered for this competition" — organizer policy, not WCA's |
| N6 | "NR REPOSITORY // LIVE" | Low | "DAILY" — only truly-live data may say live |
| N7 | Public log "Claimed by #2024RAHM" | Medium (privacy) | "Claimed ✓", no ID |
| N8 | News collects phone numbers ("email or mobile + WhatsApp Sync") | Medium (privacy/scope) | Email-only in v1; phones need explicit-consent flow (deferred) |
| N9 | Transactional email assumed (verification notices, guardian confirmations) | High (scope) | Decided: Resend free tier, outbox pattern; dashboard stays source of truth (see ARCHITECTURE §3/§4) |
| N10 | Guardian-consent card = new flow | Low (small) | Approved simple version: guardian name + relation + checkbox + timestamp (A17 sub-scope) |
| N11 | PDF registration slip = new deliverable | Low (small) | Approved: print-CSS route, no PDF lib (A6 sub-scope) |
| N12 | Psych-sheet widget | Low | Deferred to Phase 2 (B10); seed-time display stays in A17 roster |
| N13 | "Roster #64" precision | Nit | Label "Site reg #64" |
| N14 | Countdown honesty | Nit | Day-precision unless <48h out (rule recorded) |

## E. Pre-build punchlist (for BUILD_PLAN M5)

Copy: P1 (lockup component + sweep), P2 (stat derivations), N1 (host city), N2 (citations), N3 (tags), P5 (notice wording), N5, N6, N7, N8, N13, N14, "Target Automated Merchant Account" → "Receiving Merchant Account", "two-way/real-time sync" → "refresh cache", stale subtitle on Admin Competitions ("real-time roster sync with WCA Live").
Components: unified admin shell; Editor.js editor screen; footer/nav links (N4); masked Reveal on Worlds numbers.
Screens: re-render Competitions desktop (blank CTAs); mobile for Worlds/Contact/News/Sponsors/People/Lost & Found; WCA login edge states (no-ID first-timer, validation failure).
Data/arch (recorded): Resend outbox, nightly record snapshots, derived champions, manual `wca_accepted` tick, audit log, guardian consent table, print-slip route.
