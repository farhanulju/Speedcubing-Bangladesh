// scripts/smoke-m3.mjs — M3 accounts+money smoke (WP-30/31/32/34).
// Uses the dev-only session seam: ADMIN_DEV_BYPASS=1 in .dev.vars +
// `x-dev-user: <competitor_id>` header (inert in production).
// Live OAuth (login/callback) needs WP-00 app creds — covered by fail-closed checks.
// Usage: node scripts/smoke-m3.mjs http://localhost:XXXX
const base = process.argv[2] ?? 'http://localhost:4321';
const DEV_USER = process.argv[3] ?? 'sample-competitor';
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
const H = { 'x-dev-user': DEV_USER };

async function get(path, headers = {}) {
  const res = await fetch(base + path, { redirect: 'manual', headers });
  return { status: res.status, text: await res.text(), location: res.headers.get('location') };
}
async function postJson(path, obj, headers = {}) {
  const res = await fetch(base + path, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(obj),
  });
  let body = {};
  try {
    body = await res.json();
  } catch { /* non-JSON */ }
  return { status: res.status, body };
}

await check('dashboard requires login, renders with session', async () => {
  const anon = await get('/dashboard');
  assert(anon.status === 302 && (anon.location ?? '').includes('/api/auth/login'), 'anon not redirected');
  const authed = await get('/dashboard', H);
  assert(authed.status === 200, `dashboard ${authed.status}`);
  for (const s of ['Sample Competitor', '8.42', 'Dhaka Spring Open 2026', 'Registration slip']) {
    assert(authed.text.includes(s), `missing ${s}`);
  }
});

let newRegId = '';
await check('registration create/update/validate', async () => {
  const create = await postJson('/api/registrations', { comp_wca_id: 'ChittagongCubeOpen2026', events: ['333', '555'] }, H);
  assert(create.status === 200 && create.body.status === 'pending', `create failed: ${create.status}`);
  newRegId = create.body.id;
  const update = await postJson('/api/registrations', { comp_wca_id: 'ChittagongCubeOpen2026', events: ['333'] }, H);
  assert(update.status === 200 && update.body.id === newRegId, 'update changed id');
  const badEvent = await postJson('/api/registrations', { comp_wca_id: 'ChittagongCubeOpen2026', events: ['999'] }, H);
  assert(badEvent.status === 400, 'bad event accepted');
  const unknown = await postJson('/api/registrations', { comp_wca_id: 'Nope2026', events: ['333'] }, H);
  assert(unknown.status === 404, 'unknown comp accepted');
  const noAuth = await postJson('/api/registrations', { comp_wca_id: 'ChittagongCubeOpen2026', events: ['333'] });
  assert(noAuth.status === 401, 'unauth accepted');
});

await check('tx submit guards', async () => {
  assert(newRegId !== '', 'no reg id from previous step');
  const ok = await postJson('/api/tx', { registration_id: newRegId, sender_number: '+8801000000010', txn_id: 'SMOKE99TX', amount_bdt: 850 }, H);
  assert(ok.status === 200 && ok.body.ok === true, `submit failed: ${ok.status}`);
  const dup = await postJson('/api/tx', { registration_id: newRegId, sender_number: '+8801', txn_id: 'TESTTXID1', amount_bdt: 800 }, H);
  assert(dup.status === 409, 'duplicate txn accepted');
  const bad = await postJson('/api/tx', { registration_id: newRegId, sender_number: '+8801', txn_id: '!!!', amount_bdt: 800 }, H);
  assert(bad.status === 400, 'bad txn accepted');
  const missing = await postJson('/api/tx', { registration_id: 'reg-nope', sender_number: '+8801', txn_id: 'ABCDEF12', amount_bdt: 800 }, H);
  assert(missing.status === 404, 'unknown reg accepted');
});

await check('my registrations + slip + consent', async () => {
  const me = await get('/api/me/registrations', H);
  assert(me.status === 200, `me failed: ${me.status}`);
  const rows = JSON.parse(me.text).rows;
  assert(Array.isArray(rows) && rows.length >= 3, 'expected 3+ regs');
  const found = rows.find((r) => r.id === newRegId);
  assert(found && found.comp_name === 'Chittagong Cube Open 2026', 'comp name join broken');
  const slip = await get(`/dashboard/registrations/${newRegId}/slip`, H);
  assert(slip.status === 200 && slip.text.includes('SMOKE99TX'), 'slip broken');
  const consent = await postJson('/api/consent', { guardian_name: 'Smoke Guardian', relation: 'parent', agree: true }, H);
  assert(consent.status === 200 && consent.body.emailed === true, 'consent failed');
  const noAgree = await postJson('/api/consent', { guardian_name: 'X', relation: 'parent', agree: false }, H);
  assert(noAgree.status === 400, 'unchecked consent accepted');
});

await check('auth fail-closed without WP-00 app', async () => {
  const login = await get('/api/auth/login');
  assert(login.status === 500, `expected configured 500, got ${login.status}`);
  const logout = await get('/api/auth/logout');
  assert(logout.status === 302, 'logout broken');
});

if (failures > 0) {
  console.log(`${failures} check(s) failed`);
  process.exit(1);
}
console.log('smoke-m3: all green');
