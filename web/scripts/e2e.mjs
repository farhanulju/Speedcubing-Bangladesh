// scripts/e2e.mjs — browser end-to-end (WP-52 slice): admin Editor.js flow,
// payment inspection click-through, mobile screenshots, print CSS, Turnstile.
// Needs: seeded local D1+KV (db:reset + kv:seed), dev server running.
// Usage: node scripts/e2e.mjs http://localhost:XXXX
// Screenshots land in the OS temp dir (review artifacts, NOT committed).
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium } from '@playwright/test';

const base = process.argv[2] ?? 'http://localhost:4321';
const shots = mkdtempSync(join(tmpdir(), 'speedbd-shots-'));
let failures = 0;

async function check(name, fn) {
  try {
    await fn();
    console.log(`PASS ${name}`);
  } catch (err) {
    failures++;
    console.log(`FAIL ${name}: ${err.message}`);
  }
}
function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const browser = await chromium.launch();
const adminCtx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const admin = await adminCtx.newPage();

// --- 1. Editor.js mounts on the admin edit page ---
await check('editor mounts with toolbar', async () => {
  await admin.goto(`${base}/admin/faq/new`);
  await admin.waitForSelector('.codex-editor', { timeout: 15000 });
  const tools = await admin.locator('.codex-editor [contenteditable]').count();
  assert(tools > 0, 'no editable blocks');
});

// --- 2. Full content-creation round trip (EditorField save wiring) ---
await check('admin creates FAQ via editor', async () => {
  await admin.goto(`${base}/admin/faq/new`);
  await admin.waitForSelector('.codex-editor', { timeout: 15000 });
  await admin.fill('input[name="q"]', 'E2E: can I compete slowly?');
  await admin.click('.codex-editor__redactor .ce-paragraph');
  await admin.keyboard.type('Yes — absolutely. This answer was typed into Editor.js.');
  await admin.click('button[type="submit"]');
  await admin.waitForURL('**/admin/faq', { timeout: 15000 });
  const list = await admin.content();
  assert(list.includes('E2E: can I compete slowly?'), 'created row not listed');
  const pub = await (await fetch(`${base}/faq`)).text();
  assert(!pub.includes('E2E: can I compete slowly?'), 'draft leaked to public');
});

await check('admin fields use managed roles, file uploads, and anonymous donor option', async () => {
  await admin.goto(`${base}/admin/person/new`);
  assert(await admin.locator('select[name="role"] option').count() > 1, 'role options missing');
  assert(await admin.locator('select[name="role"]').inputValue() === '', 'required role should start unselected');
  assert(await admin.locator('input[data-upload-for="photo_r2"]').count() === 1, 'photo picker missing');
  await admin.goto(`${base}/admin/donor/new`);
  const anonymous = admin.locator('input[name="is_anonymous"]');
  await anonymous.check();
  assert(await admin.locator('input[name="name"]').isDisabled(), 'name should be optional while anonymous is selected');
});

await check('newsletter Turnstile stays unmounted until signup intent', async () => {
  await admin.goto(`${base}/`);
  assert(await admin.locator('[data-optin-form]').isHidden(), 'newsletter form should start hidden');
  assert(await admin.locator('script[src*="challenges.cloudflare.com/turnstile"]').count() === 0, 'Turnstile script should not load on initial render');
  await admin.click('[data-optin-reveal]');
  assert(await admin.locator('[data-optin-form]').isVisible(), 'signup form did not open');
});

// --- 3. Payment inspection click-through (fresh pending tx) ---
await check('payment accept flow', async () => {
  const reg = await (
    await fetch(`${base}/api/registrations`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-dev-user': 'sample-competitor' },
      body: JSON.stringify({ comp_wca_id: 'ChittagongCubeOpen2026', events: ['333'] }),
    })
  ).json();
  assert(reg.ok === true, 'reg create failed');
  const tx = await (
    await fetch(`${base}/api/tx`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-dev-user': 'sample-competitor' },
      body: JSON.stringify({ registration_id: reg.id, sender_number: '+8801000000100', txn_id: 'E2E99TXAA', amount_bdt: 850 }),
    })
  ).json();
  assert(tx.ok === true, 'tx submit failed');
  const txId = tx.id;
  await admin.goto(`${base}/admin/payments/${txId}`);
  await admin.waitForSelector('form[data-decide-form]', { timeout: 15000 });
  await admin.fill('input[name="note"]', 'E2E statement line 7');
  await admin.click('button[value="accepted"]');
  await admin.waitForLoadState('load');
  // Decided state renders the WCA-acceptance form instead of the decide form.
  await admin.waitForSelector('form[data-wca-form]', { timeout: 15000 });
  const decidedForm = await admin.locator('form[data-wca-form]').count();
  assert(decidedForm === 1, 'decision not reflected');
  // Double-decide guard via API.
  const replay = await fetch(`${base}/api/admin/tx-decision`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ id: txId, decision: 'accepted', note: 'x' }),
  });
  assert(replay.status === 409, 'replay not blocked');
  await admin.screenshot({ path: join(shots, 'desktop-payment-inspection.png') });
});

// --- 4. Turnstile widget presence on public form ---
await check('turnstile renders on contact', async () => {
  await admin.goto(`${base}/contact`);
  await admin.waitForSelector('.cf-turnstile iframe, .cf-turnstile', { timeout: 15000 });
});

// --- 5. Print CSS hides chrome (session seam via header injection) ---
const userCtx = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  extraHTTPHeaders: { 'x-dev-user': 'sample-competitor' },
});
const userPage = await userCtx.newPage();
await check('print slip hides chrome', async () => {
  await userPage.goto(`${base}/dashboard/registrations/sample-registration-2/slip`);
  await userPage.emulateMedia({ media: 'print' });
  const headerDisplay = await userPage.evaluate(() => getComputedStyle(document.querySelector('header')).display);
  assert(headerDisplay === 'none', `header visible in print (${headerDisplay})`);
  await userPage.emulateMedia({ media: 'screen' });
});

// --- 6. Mobile screenshots (390px) ---
const mobile = await browser.newContext({ viewport: { width: 360, height: 800 } });
const m = await mobile.newPage();
await check('mobile public menu opens inside the viewport', async () => {
  await m.goto(`${base}/`);
  await m.click('summary[aria-label="Open menu"]');
  const menu = await m.locator('header details nav').boundingBox();
  assert(menu && menu.y >= 0 && menu.y < 800 && menu.height > 100, 'mobile menu opened off-screen');
});
for (const [name, path] of [
  ['mobile-home', '/'],
  ['mobile-competitions', '/competitions'],
  ['mobile-comp-detail', '/competitions/DhakaSpringOpen2026'],
  ['mobile-records', '/records'],
  ['mobile-faq', '/faq'],
  ['mobile-contact', '/contact'],
  ['mobile-lost-found', '/lost-found'],
]) {
  await m.goto(`${base}${path}`);
  await m.screenshot({ path: join(shots, `${name}.png`) });
  const widths = await m.evaluate(() => ({ viewport: document.documentElement.clientWidth, page: document.documentElement.scrollWidth }));
  assert(widths.page <= widths.viewport, `${path} overflows horizontally: ${widths.page}px > ${widths.viewport}px`);
  console.log(`SHOT ${name}`);
}

await check('dashboard fits the 360px viewport', async () => {
  const mobileUserCtx = await browser.newContext({
    viewport: { width: 360, height: 800 },
    extraHTTPHeaders: { 'x-dev-user': 'sample-competitor' },
  });
  const mobileDashboard = await mobileUserCtx.newPage();
  await mobileDashboard.goto(`${base}/dashboard`);
  const widths = await mobileDashboard.evaluate(() => ({ viewport: document.documentElement.clientWidth, page: document.documentElement.scrollWidth }));
  assert(widths.page <= widths.viewport, `dashboard overflows horizontally: ${widths.page}px > ${widths.viewport}px`);
  assert(await mobileDashboard.locator('main h1').count() === 1, 'dashboard needs one page heading');
  const guardianForm = mobileDashboard.locator('details:has(form[data-consent-form])');
  if (await guardianForm.count()) {
    assert(!(await guardianForm.getAttribute('open')), 'guardian form should start collapsed');
  } else {
    assert((await mobileDashboard.getByText('Consent on file').count()) > 0, 'guardian consent state should be visible');
  }
  await mobileUserCtx.close();
});

// --- 7. Dashboard via the same session seam ---
const dash = await userCtx.newPage();
await check('dashboard renders for session', async () => {
  await dash.goto(`${base}/dashboard`);
  const html = await dash.content();
  assert(html.includes('Sample Competitor'), 'profile missing');
});
await dash.screenshot({ path: join(shots, 'desktop-dashboard.png') });

await browser.close();
console.log(`shots in ${shots}`);
if (failures > 0) {
  console.log(`${failures} check(s) failed`);
  process.exit(1);
}
console.log('e2e: all green');
