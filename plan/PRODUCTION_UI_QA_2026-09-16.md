# Production UI QA — 2026-09-16

## Summary

Visual and task-flow review of the live site in the requested signed-in Chrome profile, compared with the supplied Stitch export. The latest production retest confirms fixes for past-event labeling, closed-event registration, venue rendering, and the Worlds donation-page create path. A subsequent local code change addresses most remaining in-scope UX findings, but it has not been deployed or verified in the browser yet. Real content/privacy decisions and per-user WCA history data remain owner/source dependent. The earlier CMS save failure was retested after the user's fix and passes for an unpublished page draft.

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

Retest screenshots were captured inline in this task: fresh homepage load, newsletter section after focusing its email field, competition list/detail, CMS page editor, and the admin overview. No test content was entered and no form was submitted.

## Follow-up retest — CMS fix

The first pass showed `admin login required (Cloudflare Access)` on Save. After the user reported the fix, a separate test tab in the intended Chrome profile successfully saved the unique test page. The list displayed it with status `draft`; reopening loaded its title, body, slug, and `draft` status. No public/published content was created. The labeled QA draft is intentionally retained for the user to remove if desired.

## Retest after user-reported fixes — 2026-09-16

Read-only retest of the production site in the same signed-in Chrome profile at the desktop viewport. Results below supersede the earlier state for the named items. Mobile behavior was not rechecked.

| Reported item | Retest | Evidence |
|---|---|---|
| Homepage shows past events as upcoming | Fixed | Home now has an explicit empty upcoming state with “Browse the archive”; recent cards carry “Past” labels. |
| Past competition still offers registration | Fixed | The sampled ended event shows “Registration closed” and no registration/payment CTA. |
| WCA venue markup appears literally | Fixed for sampled event | “Govt. KC College” is rendered as a named external link on the competition list and detail page. |
| Worlds donation page has no way to add an entry | Admin path fixed; content still absent | `/admin/donation_page` now offers “Create the first entry” and opens a create form. It still has no row; no row was created during this retest. |
| Turnstile runs on every homepage load | Partially fixed | After a fresh load and 1.2-second wait, no Turnstile appeared in the accessibility tree. Focusing the email field brought the signup section into view and then a successful widget appeared without email entry or submission. The signup form itself is still present in the page on initial load rather than hidden behind an explicit reveal action. |
| Event labels are cryptic | Open | Competition cards and Records still show raw codes (`222`, `333oh`, `333bf`, etc.) with no human-readable event names. |
| Filters are too basic | Open | Competition discovery still exposes city links only. Records exposes one event/holder search and a Filter button; no dropdown/combobox or date/status filter was present. |
| Admin create forms are low-level | Open | People, Sponsor, Donor, and Competition Override forms still require text IDs; R2 keys remain text inputs; Role is free text; Member since is text; Links and fee tiers are JSON textareas; Sort order is an unexplained number; sponsor tiers remain four fixed choices; and WCA competition ID remains a text field. |
| Anonymous donor name is required | Open | “Name (or Anonymous) *” is still a required text field with no anonymous toggle. |
| Body editor has poor visual guidance/preview | Open | A fresh Page form still presents a large blank body canvas. No preview action or formatting guidance appears in the initial view/accessibility tree. |
| Admin overview differs from Stitch | Open | Live overview remains the three queue counters, recent activity, and operations/content links; Stitch's richer operations panels and inspection modal are not present. |
| Homepage record cards omit the event | Open | Cards still show time, “single,” and holder, without a visible event label. |
| User history does not show the approved archive | Open | Dashboard still directs archived results to the user's WCA profile. |
| Privacy notice is missing | Partially fixed | A Privacy footer link and `/privacy` page now exist, but the page says the full notice is “being published here” and lacks concrete retention/access guidance. |
| Public pages look unseeded | Still incomplete | A people profile is now present, but Worlds, FAQ, Sponsors, and News still display “publish here/once entered” copy; About remains generic. Content entry is owner-dependent and was not performed. |
| Mobile overflow and schedule scanning | Local viewport check passes; production not retested | A read-only 360×800 local Playwright check measured 360px document width on home, competitions list/detail, Records, FAQ, Contact, Lost & Found, and the signed-in dashboard. The Records table scrolls within its own card. Schedule scanning and production behavior still need a deployed-browser retest. |

No user data was changed. No email was entered, no subscription submitted, no draft or donation row created, and no payment/registration decision was made.

## Local implementation follow-up — pending deployment and production verification

The following changes are in the working tree on `codex/fix-production-ui-qa-findings`; production still reflects the last browser retest above. No deploy, remote migration, or production data change was made.

| Finding | Local change | Remaining verification / dependency |
|---|---|---|
| Cryptic WCA events and basic filters | Added readable names with IDs secondary on competition list/detail, registration choices, records, and home record cards. Competition filters now include city, event, year, and upcoming/past; Records has an event dropdown plus holder search. | Production visual/task-flow retest after deployment. |
| Admin create forms | IDs are generated; WCA competition uses a searchable datalist; images use Access-gated R2 upload; member-since uses a month picker; links and fee tiers use repeatable rows; display order is explained. People roles and sponsor tiers have D1-backed managers and refreshable choices. | Apply migration `web/migrations/0010_admin_form_choices.sql` before deployment. Exercise uploads in an isolated admin session; no R2 upload was performed. |
| Anonymous donors | Added an explicit “Show as Anonymous” option; name becomes optional and public output remains “Anonymous.” | Browser/admin save test after migration; no donor row was created. |
| CMS body preview | Added block guidance and a toggleable preview using the existing allowlisted renderer. | Verify editor rendering and image upload in a browser after deployment. |
| Newsletter challenge before intent | Signup form is hidden behind an explicit CTA; Cloudflare Turnstile is loaded/rendered only when opened and removed when closed. Copy now discloses that bulk alert delivery is not active. | Production retest; no email was entered or submitted. |
| Admin dashboard parity | Added quick actions and linked published-content counts using existing D1 data; no Stitch-only sync/emergency controls were added. | Visual comparison after deployment. This is a scoped improvement, not full Stitch parity. |
| Past competition archive | Past cards now show the cached 3×3 champion where available and link to WCA results/podiums. Dashboard copy distinguishes this site's registrations from the official WCA profile. | Production retest. Full per-user historical WCA results are still not cached locally, so the dashboard remains a link-out for that history. |
| Unfinished public empty states | Removed implementation-facing `/admin` copy and the absent partnership-deck link; Worlds copy no longer implies unconfirmed candidates or campaign terms. | Actual FAQ, story, sponsor/news, target, wallet, donor, and policy content still requires the responsible owners; none was invented or entered. |
| Privacy notice | Removed the unsupported “never sell or share” claim and made the incomplete notice explicit, with safe interim guidance. | A complete notice still needs owner/privacy review of data access, retention, request handling, and approved wording. |
| Mobile overflow/schedule | Expanded the local e2e script and completed read-only 360×800 Playwright checks on home, competitions list/detail, Records, FAQ, Contact, Lost & Found, and Dashboard. Each document measured 360px wide; the Records table is internally scrollable. | Production behavior still needs a post-deployment retest. Schedule scanning has not been assessed. |

Verification completed: `npm run check`, `npm run build`, `npm run check:budget`, `node scripts/db-check.mjs`, `npm run test:sync`, `npm run test:auth`, and `npm run test:access` all pass. The integration harnesses ran in isolated/in-memory contexts; the route-width check was read-only. The full browser e2e suite was not run because it creates CMS, payment, and registration test records. No post-change screenshots were captured because the local changes are not deployed.

## Findings

### Resolved on retest — Home labels past competitions as “Upcoming”

Initial review: the homepage showed events dated 2026-09-05, 2026-08-29, and 2026-08-07 as upcoming. Retest: it now shows an explicit empty upcoming state linking to the archive and labels recent event cards “Past.”

No further issue observed in this flow.

### Resolved on retest — Registration CTA is available for a past event and leads to a dead end

Initial review: the 2026-09-05 event detail showed “Register & Submit Payment” and sent visitors to a dashboard dead end. Retest: the detail now states “Registration closed — this event ended 2026-09-05” and exposes no registration/payment CTA.

The open-event registration flow was not tested in this retest.

### P1 — Mobile horizontal overflow on core pages (historical production finding)

At a 360px viewport, the document measured 403px wide on `/competitions`, 417px on `/lost-found`, and 368px on `/contact`. The competitions cards extend to x=403; the lost-and-found form/content extends to x=417. This creates sideways scrolling and can hide form edges on the project's primary device class.

Suggested fix: constrain grid/card/form children to the viewport, allow long venue text to wrap, and verify at 360px after fixing the raw venue markup below.

Local follow-up: the current working tree now passes a read-only 360×800 Playwright width check on home, competitions list/detail, Records, FAQ, Contact, Lost & Found, and Dashboard. Every document measured 360px wide; the Records table scrolls inside its bounded card. This does not establish that production is fixed until the current code is deployed and checked there.

### P1 — Public content is still visibly incomplete

Retest: a people profile is present, but `/worlds-2027` still says the story, candidates, and refund policy “publish here,” with no target/progress or donor information. FAQ, News, and Sponsors still display copy saying content will appear once entered in `/admin`. About remains limited to generic copy and cache-derived counts. This is owner-dependent content entry, not an empty-state code defect.

Suggested fix: complete the approved content-entry checklist before promoting these pages; keep unready routes out of prominent navigation or replace implementation-facing copy with visitor-facing, honest empty states.

### Resolved on retest — Worlds donation page cannot be initialized from its admin screen

Initial review: `/admin/donation_page` had no create action. Retest: the empty state now offers “Create the first entry” and opens a form for the donation singleton. The row is still absent, so the public Worlds campaign remains unpopulated; no production row was created during this read-only retest.

No further setup-path issue observed.

### Resolved for sampled event on retest — WCA venue markup is printed literally

Initial review: competition cards/detail rendered the WCA venue Markdown literally. Retest: “Govt. KC College” is now a named external link on the sampled list card and detail page. Other event venues were not exhaustively checked.

The mobile-overflow issue is tracked separately and was not retested at 360px in this pass.

### P2 — Privacy notice is discoverable, but its content is incomplete

Retest: a Privacy link is now present in the footer and opens `/privacy`. The page says the full notice “is being published here” and only gives a brief summary; it still lacks concrete purpose, access, and retention guidance near data-collection flows.

Suggested fix: complete the notice and link it near the relevant forms, with purpose, access, retention, and contact details.

### P2 — Homepage record cards omit the event

The “Bangladesh's Best Records” cards show a time, “single,” and a holder, but not the event. A visitor cannot tell whether a displayed value is 2×2, 3×3, or another event without opening the records page.

Suggested fix: include the event name/code and link the card to the corresponding record row or WCA source.

### P2 — User competition history does not provide the approved archive experience

The dashboard's history section directs visitors to their WCA profile for archived results; it does not present the local competition history/archive described by A21. This gap is also recorded in `FEATURE_LIST.md` as not yet built.

Suggested fix: complete the approved A21 archive/podium view and make the distinction between site registration history and WCA competition history explicit.

### P2 — Competition schedule is difficult to scan on a phone (not retested)

The detail page places the full round/group schedule into a very long single-column list at 360px. The event table is horizontally scrollable, but there is no visual hint that additional columns are off-screen.

Suggested fix: group/collapse schedule by day or event and add a clear horizontal-scroll cue to the event table. Keep all official schedule details available.

### P2 — CMS editor still starts as a large blank area without a visible preview

Retest: a new Page form still shows a large blank body canvas with no visible placeholder, formatting guidance, rendered preview, or preview action in the initial view/accessibility tree. An author cannot tell what the output will look like from this state; the 400px/Save-below-fold behavior was observed previously but not measured again at the same viewport height.

Suggested fix: show the available blocks and a first-block prompt, offer a rendered preview (ideally side-by-side or toggleable), and keep Save easy to reach.

### P2 — Newsletter form is still visible before intent; Turnstile is deferred only partially

Initial review: the Turnstile challenge initialized on homepage loads before interaction. Retest: after a fresh home load and 1.2-second wait, no Turnstile appeared in the accessibility tree; focusing the email field brought the signup form into view, after which the widget showed “Success!” without email entry. However, the form itself remains part of the home page from initial load rather than being hidden behind an explicit reveal action. The signup module is homepage-only. No signup was submitted.

Suggested fix: keep the challenge deferred and, if the intended behavior is to reveal the whole signup experience on intent, add an explicit “Get competition alerts” reveal action before mounting the form.

### P2 — Competition and record pages still expose WCA event codes without human labels

Competition cards list codes such as `222`, `333oh`, `333bf`, `333mbf`, `clock`, and `sq1`. The National Records table also uses these codes as its event names. These are official identifiers but are cryptic to newer cubers and general visitors.

Suggested fix: show familiar event names (for example, “2×2×2 Cube” and “3×3×3 Blindfolded”) and retain the WCA code secondarily where useful.

### P2 — Discovery filters still offer too little structure for browsing

On `/competitions`, the only filter controls are city links/chips; there is no event, date, or registration-state filter or searchable selector. On `/records`, the only control is one text search for event or holder plus a “Filter” button; the event values in the table remain raw codes. No dropdown/combobox was exposed in either surface during this check.

Suggested fix: provide clear, usable selectors for the larger option sets (such as city and event), with relevant date/status filters and a visible reset state. Preserve the simple city chips if they remain useful shortcuts.

### P2 — Admin create forms still expose implementation details instead of task-oriented inputs

Read-only inspection of the People, Sponsor, Donor, and Competition Override “New” forms found required IDs entered as plain text; Photo/Logo R2 object keys entered as text; Role as free text; “Member since (YYYY-MM)” as text rather than a date control; Links as a raw JSON textarea; and Sort order as an unexplained number stepper. Sponsor tier is a dropdown, but its four options are fixed in the form and there is no UI to define/manage tiers. Competition Override requires manually typing a WCA competition ID and exposes fee tiers as raw JSON (`{"early":800,"regular":1000}`). No forms were submitted.

Suggested fix: auto-generate IDs; offer an upload flow that stores media in R2; use a date picker, searchable WCA competition picker, repeatable link and fee-tier rows, and plain-language labels/help; provide admin-managed role and sponsor-tier values; and explain ordering or replace it with a more direct ordering control.

### P2 — Anonymous donor entry still requires a name

Retest confirms the Donor create form still labels the required text input “Name (or Anonymous) *”. There is no separate anonymity choice, so an admin must type a literal placeholder such as “Anonymous” to represent an anonymous contribution.

Suggested fix: provide an explicit anonymous toggle/display choice and make the name optional when anonymous is selected; keep public-display consent clear and independent.

### Design-reference differences — confirm scope before building

The live homepage is much sparser than the Stitch home: no hero photography, trust/city strip, Hall of Fame treatment, organization-story section, Worlds progress banner, or sponsor/news teaser. The live admin overview is a lightweight CMS/queue shell: it shows three queue counters, recent activity, and links to operations/content collections. Stitch instead depicts quick actions, active-competition and Worlds campaign cards, national-record and platform-health panels, a recent-admin panel, and a quick-payment-inspection modal. The dashboard has the expected core sections but not the richer history presentation.

Treat these as parity observations, not blanket build authorization. Some are documented M5 gaps or content-entry work; other Stitch-only controls (for example emergency banners or sync controls) are not in the approved MVP list and should not be added without a scope decision.

## What worked

- Latest production retest: homepage correctly separates upcoming from past and provides an archive link; ended-event registration is closed; the sampled competition venue is a named link; and the Worlds donation singleton now has a first-create path.
- Privacy is now discoverable from the footer. The Turnstile was absent after a fresh homepage load and appeared only after the email field was focused/brought into view; the signup was not submitted.
- Public routes and the Access-gated admin overview loaded in the existing signed-in session.
- The competitions city filter and records search returned matching results.
- The mobile public menu and admin menu opened; the admin overview and dashboard had no horizontal document overflow at 360px.
- The lost-and-found form displayed its Cloudflare Turnstile widget in a successful state.
- Empty payment, lost-and-found, and contact queues are clearly reported as clear; no payment or inbox records were created to manufacture test data.
- After the reported fix, the authorized draft-save smoke test passed; reopening the row confirmed the content and unpublished status persisted.

## Not tested

No public form was submitted and no registration/payment workflow was committed. File upload, email delivery, payment accept/reject, WCA acceptance tick, Access denial from an unauthenticated browser, and content publish/rollback remain unverified. The CMS draft create and read-back path was verified in the earlier pass; edit/update behavior and publishing were not exercised. The latest production retest did not repeat the 360px checks, so mobile overflow and schedule-scanning status remain unknown against the latest deployment.
