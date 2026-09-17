// scripts/smoke-m2.mjs — M2 page + public-form smoke (WP-21/22/23).
// Usage: node scripts/smoke-m2.mjs http://localhost:XXXX
// Exit 0 = all pass. Needs seeded local D1 + KV (db:seed, kv:seed) and
// Turnstile test secret in .dev.vars (always-pass documented test keys).
//
// NOTE on Turnstile negatives: the documented TEST secret accepts any token
// (result_with_testing_key), so rejection is exercised with an EMPTY token,
// which fails closed before any network call. Production secrets reject
// forged tokens via the same branch.
const base = process.argv[2] ?? 'http://localhost:4321';
const DUMMY_TOKEN = 'XXXX.DUMMY.TOKEN.XXXX';
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

async function get(path, opts = {}) {
  const res = await fetch(base + path, { redirect: 'manual', ...opts });
  return { status: res.status, text: await res.text(), location: res.headers.get('location') };
}

async function postJson(path, obj) {
  const res = await fetch(base + path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(obj),
  });
  let body = {};
  try {
    body = await res.json();
  } catch { /* non-JSON */ }
  return { status: res.status, body };
}

const has = (text, s) => text.includes(s);
const notHas = (text, s) => !text.includes(s);

await check('home renders data sections', async () => {
  const page = await get('/');
  assert(page.status === 200, `status ${page.status}`);
  for (const s of ['Sample: registration opens', 'Dhaka Spring Open 2026', '5.82', 'Sample Sponsor Ltd', 'Sample competition recap', '185000', 'Subscribe']) {
    assert(has(page.text, s), `missing ${s}`);
  }
  for (const s of ['rel="canonical"', 'property="og:image"', '/social-card.jpg']) assert(has(page.text, s), `missing metadata ${s}`);
});

await check('robots and sitemap expose only public discovery routes', async () => {
  const robots = await get('/robots.txt');
  assert(robots.status === 200 && has(robots.text, 'Disallow: /admin') && has(robots.text, 'Sitemap:'), 'robots rules missing');
  const sitemap = await get('/sitemap.xml');
  assert(sitemap.status === 200 && has(sitemap.text, '/competitions/DhakaSpringOpen2026') && has(sitemap.text, '/news/sample-recap'), 'dynamic sitemap entries missing');
  assert(notHas(sitemap.text, '/admin') && notHas(sitemap.text, '/dashboard'), 'private route leaked into sitemap');
});

await check('competitions list + city filter', async () => {
  const all = await get('/competitions');
  assert(all.status === 200 && has(all.text, 'Chittagong Cube Open 2026'), 'list incomplete');
  const dhaka = await get('/competitions?city=Dhaka');
  assert(has(dhaka.text, 'Dhaka Spring Open 2026') && notHas(dhaka.text, 'Chittagong Cube Open 2026'), 'filter broken');
});

await check('competition detail', async () => {
  const d = await get('/competitions/DhakaSpringOpen2026');
  assert(d.status === 200, `status ${d.status}`);
  for (const s of ['৳800', '+8801000000000', '1 registered on this site', 'Average of 5', 'Live Results', 'Official WCA Page', 'Pay early, keep your SMS']) {
    assert(has(d.text, s), `missing ${s}`);
  }
  const nope = await get('/competitions/Nope');
  assert(nope.status === 302 && (nope.location ?? '').includes('worldcubeassociation.org'), 'unknown comp should redirect to WCA');
});

await check('records table + stamp', async () => {
  const d = await get('/records');
  assert(d.status === 200, `status ${d.status}`);
  for (const s of ['5.82', '2026-09-13', 'Verify on WCA', 'Accumulates with daily syncs']) assert(has(d.text, s), `missing ${s}`);
});

await check('news list + article + 404', async () => {
  const l = await get('/news');
  assert(has(l.text, 'Sample competition recap'), 'list empty');
  const a = await get('/news/sample-recap');
  assert(a.status === 200 && has(a.text, 'Sample recap.'), 'article broken');
  const n = await get('/news/nope');
  assert(n.status === 404, `expected 404, got ${n.status}`);
});

await check('people with consent gate', async () => {
  const d = await get('/people');
  assert(has(d.text, 'Sample Delegate') && has(d.text, 'Sample Executive'), 'roster missing');
  assert(notHas(d.text, '/api/media'), 'unconsented photo leaked');
});

await check('faq/contact/sponsors/worlds/about/lost-found render', async () => {
  const f = await get('/faq');
  assert(has(f.text, 'do I need to be fast'), 'faq empty');
  const c = await get('/contact');
  assert(has(c.text, 'Get in Touch'), 'contact broken');
  const s = await get('/sponsors');
  assert(has(s.text, 'Sample Sponsor Ltd'), 'sponsors broken');
  // Deck link renders only when the PDF exists in R2 (WP-51 places it via wrangler).
  assert(notHas(s.text, 'partnership-deck.pdf'), 'deck link shown without deck file');
  {
    const { execSync } = await import('node:child_process');
    const { mkdtempSync, writeFileSync } = await import('node:fs');
    const { tmpdir } = await import('node:os');
    const { join, dirname } = await import('node:path');
    const { fileURLToPath } = await import('node:url');
    const root = join(dirname(fileURLToPath(import.meta.url)), '..');
    const pdf = join(mkdtempSync(join(tmpdir(), 'deck-')), 'deck.pdf');
    writeFileSync(pdf, '%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n');
    execSync(`npx wrangler r2 object put speedbd-media/org/partnership-deck.pdf --local --file "${pdf}"`, { cwd: root, stdio: 'pipe' });
    const withDeck = await get('/sponsors');
    assert(has(withDeck.text, 'partnership-deck.pdf'), 'deck link missing with deck file');
    execSync('npx wrangler r2 object delete speedbd-media/org/partnership-deck.pdf --local', { cwd: root, stdio: 'pipe' });
    const withoutDeck = await get('/sponsors');
    assert(notHas(withoutDeck.text, 'partnership-deck.pdf'), 'deck link stuck after delete');
  }
  const w = await get('/worlds-2027');
  assert(has(w.text, '+8801000000002') && has(w.text, 'Sample Family'), 'worlds broken');
  const a = await get('/about');
  assert(has(a.text, 'Sample story'), 'about story missing');
  const l = await get('/lost-found');
  assert(has(l.text, 'Sample 3x3 cube'), 'recovery log missing');
});

await check('contact form validation', async () => {
  const ok = await postJson('/api/contact', { name: 'Test Person', email: 'test@example.org', category: 'general', message: 'Hello, this is a long enough test message.', turnstile_token: DUMMY_TOKEN });
  assert(ok.status === 200 && ok.body.ok === true, `valid rejected: ${ok.status}`);
  const bad = await postJson('/api/contact', { name: 'T', email: 'nope', category: 'general', message: 'Hello, this is a long enough test message.', turnstile_token: DUMMY_TOKEN });
  assert(bad.status === 400, 'bad email accepted');
  // Empty token fails closed before network (test secrets accept anything).
  const noBot = await postJson('/api/contact', { name: 'T', email: 't@example.org', category: 'general', message: 'Hello, this is a long enough test message.', turnstile_token: '' });
  assert(noBot.status === 403, `empty token not rejected (got ${noBot.status})`);
});

await check('opt-in flow', async () => {
  const fresh = `smoke${Date.now()}@example.org`;
  const one = await postJson('/api/opt-in', { channel: 'email', handle: fresh, turnstile_token: DUMMY_TOKEN });
  assert(one.status === 200 && one.body.duplicate === false, 'fresh subscribe failed');
  const two = await postJson('/api/opt-in', { channel: 'email', handle: fresh, turnstile_token: DUMMY_TOKEN });
  assert(two.status === 200 && two.body.duplicate === true, 'duplicate not flagged');
  const sms = await postJson('/api/opt-in', { channel: 'sms', handle: '+8801', turnstile_token: DUMMY_TOKEN });
  assert(sms.status === 400, 'sms channel accepted');
});

await check('lost-found multipart', async () => {
  const fd = new FormData();
  fd.set('item', 'Smoke test cube');
  fd.set('reporter_contact', '+8801000000009');
  fd.set('turnstile_token', DUMMY_TOKEN);
  fd.set('photo', new File([new Uint8Array([137, 80, 78, 71])], 'cube.png', { type: 'image/png' }));
  const res = await fetch(base + '/api/lost-found', { method: 'POST', body: fd });
  const body = await res.json();
  assert(res.status === 200 && body.ok === true && typeof body.id === 'string', `upload rejected: ${res.status} ${JSON.stringify(body)}`);
  const bad = new FormData();
  bad.set('item', 'x');
  bad.set('reporter_contact', 'y');
  bad.set('turnstile_token', DUMMY_TOKEN);
  bad.set('photo', new File(['evil'], 'evil.sh', { type: 'application/x-sh' }));
  const res2 = await fetch(base + '/api/lost-found', { method: 'POST', body: bad });
  assert(res2.status === 400, 'bad file type accepted');
  const noItem = new FormData();
  noItem.set('reporter_contact', 'y');
  noItem.set('turnstile_token', DUMMY_TOKEN);
  const res3 = await fetch(base + '/api/lost-found', { method: 'POST', body: noItem });
  assert(res3.status === 400, 'missing item accepted');
});

if (failures > 0) {
  console.log(`${failures} check(s) failed`);
  process.exit(1);
}
console.log('smoke-m2: all green');
