# Production UI QA — 2026-09-16

## Summary

Visual and task-flow review of the live site in the requested signed-in Chrome profile, compared with the supplied Stitch export. Public pages render and the admin area is reachable. The most important problems are that the homepage presents past events as upcoming, the registration CTA leads to a dashboard dead end, the Worlds campaign and several information pages are still placeholders, multiple key pages overflow a 360px viewport, and CMS saves are rejected by the admin API.

No registrations, payments, messages, subscriptions, uploads, accept/reject decisions, or deletes were submitted. One clearly labeled unpublished CMS draft save was attempted with user authorization, but the app returned `admin login required (Cloudflare Access)` and did not create a row. The live payment and inbox queues were empty, so positive admin decision flows could not be exercised safely.

## Environment and coverage

- Production: `https://speedbd-web.pages.dev`
- Admin: `https://speedbd-web.pages.dev/admin`
- Browser: user's signed-in Chrome profile; existing WCA session and Access session.
- Viewports: desktop 1920×889; responsive override 360×800.
- Public routes reviewed: home, About, competitions, a competition detail, records, Worlds 2027, FAQ, people, sponsors, news, contact, lost & found, and the signed-in dashboard.
- Admin routes reviewed: overview, payment queue, lost & found inbox, contact inbox, pages list/new editor, FAQ, announcements, Worlds donation page, and competition overrides.
- Filters exercised without changing data: city filter and records search (`333`).
- Console: no warnings or errors observed in the reviewed tab.

Screenshots were captured inline in this task thread (desktop/mobile home and competition detail; mobile contact and lost & found; Worlds page; admin overview, editor, and rejected-save state). They were not copied into the repository. The Stitch reference files are in the supplied `stitch_speedcubing_bangladesh_web_portal (1)/stitch_speedcubing_bangladesh_web_portal` export.

## Findings

### P1 — Home labels past competitions as “Upcoming”

The homepage's three cards show events dated 2026-09-05, 2026-08-29, and 2026-08-07, although the review date is 2026-09-16. The competitions page correctly says “Nothing upcoming in the cache right now” and places those events under “Past.” This is a misleading first impression and sends visitors toward expired events.

Suggested fix: apply the same date-based Upcoming/Past split on the homepage; when there are no upcoming events, show an explicit empty state and point to the archive.

### P1 — Registration CTA is available for a past event and leads to a dead end

The 2026-09-05 competition detail still shows “Register & Submit Payment.” Following it navigates to `/dashboard`; the signed-in dashboard then shows no registrations and only “Browse competitions,” with no event-specific registration form or preserved competition context. A visitor can loop between the detail page and dashboard without reaching registration.

Suggested fix: hide or replace registration actions when an event is past/closed, and make an open event's registration action carry the competition into a clear registration flow. Show a closed-registration explanation on past details.

### P1 — Mobile horizontal overflow on core pages

At a 360px viewport, the document measured 403px wide on `/competitions`, 417px on `/lost-found`, and 368px on `/contact`. The competitions cards extend to x=403; the lost-and-found form/content extends to x=417. This creates sideways scrolling and can hide form edges on the project's primary device class.

Suggested fix: constrain grid/card/form children to the viewport, allow long venue text to wrap, and verify at 360px after fixing the raw venue markup below.

### P1 — Public content is visibly unseeded

`/worlds-2027` currently says the story, candidates, and refund policy “publish here,” with no target/progress or donor information. FAQ says answers will appear once entered in `/admin`; people, news, and sponsors pages also show empty-state copy. About is limited to a short generic paragraph and cache-derived counts. This is consistent with `CURRENT_STATE.md` saying real content entry is deferred, but the live public pages currently read as unfinished—especially the dedicated fundraising page and first-timer FAQ.

Suggested fix: complete the approved content-entry checklist before promoting these pages; keep unready routes out of prominent navigation or replace implementation-facing copy with visitor-facing, honest empty states.

### P1 — Worlds donation page cannot be initialized from its admin screen

`/admin/donation_page` has zero rows and exposes no “New” or “Create first entry” action, unlike the other content collections. The public Worlds page is empty, and the A13 campaign's manual target/raised values therefore cannot be initialized through the admin UI as tested.

Suggested fix: provide a first-time setup/create path for the singleton donation row, or seed a safe draft/default row that admins can edit.

### P1 — CMS save is rejected while the Access-gated admin UI is open

In the signed-in Chrome session, `/admin/page/new` loaded and accepted the test slug, title, body, and default `draft` status. Clicking Save returned `admin login required (Cloudflare Access)`. Returning to `/admin/page` showed “No rows yet,” so no draft was persisted. This prevents content entry through the tested admin workflow even though its pages are accessible.

Suggested fix: trace the production admin API's Access identity/JWT authorization path for writes, then verify a draft create/edit round trip without publishing.

### P2 — WCA venue markup is printed literally

Competition cards and detail pages render source values such as `[Govt. KC College](https://www.kccollege.edu.bd)` as literal text instead of a linked venue name. Other venues show the raw URL inline. Besides looking unfinished, the long strings contribute to the mobile overflow.

Suggested fix: normalize venue names/URLs at the data-shaping or rendering boundary and render a safe external link; never display the Markdown source verbatim.

### P2 — No privacy notice is discoverable from data-collection flows

The contact form collects name, email, optional WCA ID, and a message; lost & found requests phone/email and accepts a photo/receipt; the dashboard has a guardian-consent form. The footer and these forms expose no privacy-policy link or concise purpose/retention guidance. The lost-and-found page says reporter contacts stay private, but does not say who can access them or how long they are kept.

Suggested fix: publish a plain-language privacy notice and link it beside the relevant forms, with purpose, access, retention, and contact details.

### P2 — Homepage record cards omit the event

The “Bangladesh's Best Records” cards show a time, “single,” and a holder, but not the event. A visitor cannot tell whether a displayed value is 2×2, 3×3, or another event without opening the records page.

Suggested fix: include the event name/code and link the card to the corresponding record row or WCA source.

### P2 — User competition history does not provide the approved archive experience

The dashboard's history section directs visitors to their WCA profile for archived results; it does not present the local competition history/archive described by A21. This gap is also recorded in `FEATURE_LIST.md` as not yet built.

Suggested fix: complete the approved A21 archive/podium view and make the distinction between site registration history and WCA competition history explicit.

### P2 — Competition schedule is difficult to scan on a phone

The detail page places the full round/group schedule into a very long single-column list at 360px. The event table is horizontally scrollable, but there is no visual hint that additional columns are off-screen.

Suggested fix: group/collapse schedule by day or event and add a clear horizontal-scroll cue to the event table. Keep all official schedule details available.

### Design-reference differences — confirm scope before building

The live homepage is much sparser than the Stitch home: no hero photography, trust/city strip, Hall of Fame treatment, organization-story section, Worlds progress banner, or sponsor/news teaser. The live admin is a lightweight CMS/queue shell rather than Stitch's fuller operations hub with competition-health panels and quick-inspection modal. The dashboard has the expected core sections but not the richer history presentation.

Treat these as parity observations, not blanket build authorization. Some are documented M5 gaps or content-entry work; other Stitch-only controls (for example emergency banners or sync controls) are not in the approved MVP list and should not be added without a scope decision.

## What worked

- Public routes and the Access-gated admin overview loaded in the existing signed-in session.
- The competitions city filter and records search returned matching results.
- The mobile public menu and admin menu opened; the admin overview and dashboard had no horizontal document overflow at 360px.
- The lost-and-found form displayed its Cloudflare Turnstile widget in a successful state.
- Empty payment, lost-and-found, and contact queues are clearly reported as clear; no production records were created to manufacture test data.
- CMS form fields accepted input, but the authorized draft-save smoke test exposed a production authorization error and no row was created.

## Not tested

No public form was submitted and no registration/payment workflow was committed. File upload, email delivery, payment accept/reject, WCA acceptance tick, Access denial from an unauthenticated browser, and content publish/rollback remain unverified in this pass. The unpublished CMS draft create path was attempted but blocked by the error above; no production content row was created.
