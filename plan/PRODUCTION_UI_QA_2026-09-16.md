# Production UI QA — 2026-09-16

## Summary

Visual and task-flow review of the live site in the requested signed-in Chrome profile, compared with the supplied Stitch export. Public pages render and the admin area is reachable. The most important problems are that the homepage presents past events as upcoming, the registration CTA leads to a dashboard dead end, the Worlds campaign and several information pages are still placeholders, and multiple key pages overflow a 360px viewport. The CMS save failure from the first pass was retested after the user's fix and now passes for an unpublished page draft.

No registrations, payments, messages, subscriptions, uploads, accept/reject decisions, or deletes were submitted. With user authorization, one clearly labeled CMS test page was saved as a draft and reopened to verify persistence; it remains unpublished. The live payment and inbox queues were empty, so positive admin decision flows could not be exercised safely.

## Environment and coverage

- Production: `https://speedbd-web.pages.dev`
- Admin: `https://speedbd-web.pages.dev/admin`
- Browser: user's signed-in Chrome profile; existing WCA session and Access session.
- Viewports: desktop 1920×889; responsive override 360×800.
- Public routes reviewed: home, About, competitions, a competition detail, records, Worlds 2027, FAQ, people, sponsors, news, contact, lost & found, and the signed-in dashboard.
- Admin routes reviewed: overview, payment queue, lost & found inbox, contact inbox, pages list/new editor, FAQ, announcements, Worlds donation page, and competition overrides.
- Filters exercised without changing data: city filter and records search (`333`).
- CMS retest after fix: created `codex-qa-smoke-2026-09-16` as a draft, confirmed it appears in the Pages list, and reopened it to verify slug, title, body, and draft status persisted.
- Console: no warnings or errors observed in the reviewed tab.

Screenshots were captured inline in this task thread (desktop/mobile home and competition detail; mobile contact and lost & found; Worlds page; admin overview; initial rejected-save state; and post-fix saved-draft list/editor). They were not copied into the repository. The Stitch reference files are in the supplied `stitch_speedcubing_bangladesh_web_portal (1)/stitch_speedcubing_bangladesh_web_portal` export.

Follow-up screenshots were also captured inline: the homepage Turnstile before interaction, competition list/event codes, the Records table and filters, People/Sponsor/Donor/Competition Override create forms, the blank page-body editor, the Worlds donation-page admin empty state, and the live admin overview. They were not copied into the repository.

## Follow-up retest — CMS fix

The first pass showed `admin login required (Cloudflare Access)` on Save. After the user reported the fix, a separate test tab in the intended Chrome profile successfully saved the unique test page. The list displayed it with status `draft`; reopening loaded its title, body, slug, and `draft` status. No public/published content was created. The labeled QA draft is intentionally retained for the user to remove if desired.

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

Rechecked read-only on 2026-09-16: `/admin/donation_page` says “No rows yet” and exposes only a back-to-admin link—no “New” or “Create first entry” action, unlike the other content collections. The public Worlds page is empty, and the A13 campaign's manual target/raised values therefore cannot be initialized through the admin UI as tested.

Suggested fix: provide a first-time setup/create path for the singleton donation row, or seed a safe draft/default row that admins can edit.

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

### P2 — CMS editor starts as a large blank area and pushes Save below the fold

On a new Page form, the body editor initially appears as a large blank rectangle (roughly 400px tall) with no visible placeholder, formatting guidance, rendered preview, or preview action. The editor is not represented by useful controls in the accessibility view either. An author cannot tell what the output will look like from this initial state; at shorter desktop heights, Save also falls below the fold.

Suggested fix: show the available blocks and a first-block prompt, offer a rendered preview (ideally side-by-side or toggleable), and keep Save easy to reach.

### P2 — Newsletter Turnstile runs before the visitor expresses intent

On two homepage loads/reloads, the “Sign up for alerts” section and Cloudflare Turnstile challenge initialized automatically before any click or form interaction. The widget completed its check on its own. The signup module was not present on the About route, so this finding is specifically about homepage loads—not every route. No signup was submitted.

Suggested fix: defer mounting the signup form and Turnstile until the visitor deliberately chooses to subscribe or open alerts signup; avoid running the challenge merely because the homepage rendered.

### P2 — Competition and record pages expose WCA event codes without human labels

Competition cards list codes such as `222`, `333oh`, `333bf`, `333mbf`, `clock`, and `sq1`. The National Records table also uses these codes as its event names. These are official identifiers but are cryptic to newer cubers and general visitors.

Suggested fix: show familiar event names (for example, “2×2×2 Cube” and “3×3×3 Blindfolded”) and retain the WCA code secondarily where useful.

### P2 — Discovery filters offer too little structure for browsing

On `/competitions`, the only filter controls are city links/chips; there is no event, date, or registration-state filter or searchable selector. On `/records`, the only control is one text search for event or holder plus a “Filter” button; the event values in the table remain raw codes. No dropdown/combobox was exposed in either surface during this check.

Suggested fix: provide clear, usable selectors for the larger option sets (such as city and event), with relevant date/status filters and a visible reset state. Preserve the simple city chips if they remain useful shortcuts.

### P2 — Admin create forms expose implementation details instead of task-oriented inputs

Read-only inspection of the People, Sponsor, Donor, and Competition Override “New” forms found required IDs entered as plain text; Photo/Logo R2 object keys entered as text; Role as free text; “Member since (YYYY-MM)” as text rather than a date control; Links as a raw JSON textarea; and Sort order as an unexplained number stepper. Sponsor tier is a dropdown, but its four options are fixed in the form and there is no UI to define/manage tiers. Competition Override requires manually typing a WCA competition ID and exposes fee tiers as raw JSON (`{"early":800,"regular":1000}`). No forms were submitted.

Suggested fix: auto-generate IDs; offer an upload flow that stores media in R2; use a date picker, searchable WCA competition picker, repeatable link and fee-tier rows, and plain-language labels/help; provide admin-managed role and sponsor-tier values; and explain ordering or replace it with a more direct ordering control.

### P2 — Anonymous donor entry still requires a name

The Donor create form labels the required text input “Name (or Anonymous) *”. There is no separate anonymity choice, so an admin must type a literal placeholder such as “Anonymous” to represent an anonymous contribution.

Suggested fix: provide an explicit anonymous toggle/display choice and make the name optional when anonymous is selected; keep public-display consent clear and independent.

### Design-reference differences — confirm scope before building

The live homepage is much sparser than the Stitch home: no hero photography, trust/city strip, Hall of Fame treatment, organization-story section, Worlds progress banner, or sponsor/news teaser. The live admin overview is a lightweight CMS/queue shell: it shows three queue counters, recent activity, and links to operations/content collections. Stitch instead depicts quick actions, active-competition and Worlds campaign cards, national-record and platform-health panels, a recent-admin panel, and a quick-payment-inspection modal. The dashboard has the expected core sections but not the richer history presentation.

Treat these as parity observations, not blanket build authorization. Some are documented M5 gaps or content-entry work; other Stitch-only controls (for example emergency banners or sync controls) are not in the approved MVP list and should not be added without a scope decision.

## What worked

- Public routes and the Access-gated admin overview loaded in the existing signed-in session.
- The competitions city filter and records search returned matching results.
- The mobile public menu and admin menu opened; the admin overview and dashboard had no horizontal document overflow at 360px.
- The lost-and-found form displayed its Cloudflare Turnstile widget in a successful state.
- Empty payment, lost-and-found, and contact queues are clearly reported as clear; no payment or inbox records were created to manufacture test data.
- After the reported fix, the authorized draft-save smoke test passed; reopening the row confirmed the content and unpublished status persisted.

## Not tested

No public form was submitted and no registration/payment workflow was committed. File upload, email delivery, payment accept/reject, WCA acceptance tick, Access denial from an unauthenticated browser, and content publish/rollback remain unverified in this pass. The CMS draft create and read-back path was verified; edit/update behavior and publishing were not exercised.
