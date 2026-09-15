// scripts/drills-wp52.mjs — WP-52 failure drills (local, text-only).
// Proves fail-closed public forms, validation gates, unknown-asset handling,
// and Resend-down fail-open (no RESEND_API_KEY locally by design).
// Needs: freshly seeded local D1+KV (db:reset + kv:seed), dev server running,
// ADMIN_DEV_BYPASS=1 + Turnstile test secret in .dev.vars.
// Re-runs need db:reset first: verified registrations are immutable by design,
// so the accept drill 409s on a verified comp (that 409 is itself a guard).
// Usage: node scripts/drills-wp52.mjs http://localhost:XXXX
// Empty-KV + Access-off drills are manual (see plan/QA_MATRIX.md).
const base = process.argv[2] ?? 'http://localhost:4321';
const H = { 'x-dev-user': 'sample-competitor' };
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
async function getJson(path, headers = {}) {
  const res = await fetch(base + path, { headers });
  let body = {};
  try {
    body = await res.json();
  } catch { /* non-JSON */ }
  return { status: res.status, body };
}
async function get(path, opts = {}) {
  const res = await fetch(base + path, { redirect: 'manual', ...opts });
  return { status: res.status, text: await res.text(), location: res.headers.get('location') };
}

// --- 1. Turnstile forced-fail: forged/empty tokens rejected, nothing written ---
await check('contact rejects empty turnstile token, writes nothing', async () => {
  const before = await getJson('/api/admin/contact');
  const n0 = (before.body.rows ?? []).length;
  const bad = await postJson('/api/contact', {
    name: 'Drill Bot',
    email: 'drill@example.org',
    category: 'general',
    message: 'This message is long enough to pass validation.',
    turnstile_token: '',
  });
  assert(bad.status === 403, `expected 403, got ${bad.status}`);
  const after = await getJson('/api/admin/contact');
  assert((after.body.rows ?? []).length === n0, 'row written despite failed verification');
});

await check('opt-in rejects empty turnstile token', async () => {
  const bad = await postJson('/api/opt-in', {
    channel: 'email',
    handle: 'drill@example.org',
    turnstile_token: '',
  });
  assert(bad.status === 403, `expected 403, got ${bad.status}`);
});

await check('lost-found rejects empty turnstile token', async () => {
  const form = new FormData();
  form.set('item', 'Drill cube');
  form.set('reporter_contact', 'drill@example.org');
  form.set('turnstile_token', '');
  const res = await fetch(`${base}/api/lost-found`, { method: 'POST', body: form });
  assert(res.status === 403, `expected 403, got ${res.status}`);
});

// --- 2. Unknown assets fail with honest codes, never 500 ---
await check('missing R2 asset is 404', async () => {
  const page = await get('/api/media/definitely-not-a-key');
  assert(page.status === 404, `expected 404, got ${page.status}`);
});

await check('unknown competition redirects to WCA', async () => {
  const page = await get('/competitions/NoSuchComp2026');
  assert(page.status === 302, `expected 302, got ${page.status}`);
  assert((page.location ?? '').includes('worldcubeassociation.org/competitions/NoSuchComp2026'), 'not canonical WCA URL');
});

// --- 3. Validation gates (D1-write-fail equivalent: bad writes never land) ---
await check('registration rejects unknown event', async () => {
  const bad = await postJson('/api/registrations', { comp_wca_id: 'ChittagongCubeOpen2026', events: ['999'] }, H);
  assert(bad.status === 400, `expected 400, got ${bad.status}`);
});

await check('tx rejects non-positive amount', async () => {
  const reg = await postJson('/api/registrations', { comp_wca_id: 'ChittagongCubeOpen2026', events: ['333'] }, H);
  assert(reg.status === 200, `reg setup failed: ${reg.status}`);
  const bad = await postJson(
    '/api/tx',
    { registration_id: reg.body.id, sender_number: '+8801000000101', txn_id: 'DRILLBAD01', amount_bdt: -50 },
    H,
  );
  assert(bad.status === 400, `expected 400, got ${bad.status}`);
});

await check('admin CRUD rejects missing required field', async () => {
  const bad = await postJson('/api/admin/faq', { id: 'drill-faq-no-q' });
  assert(bad.status === 400, `expected 400, got ${bad.status}`);
});

// --- 4. Resend-down fail-open: decisions work with no RESEND_API_KEY ---
await check('payment accept works with outbox unsent (Resend down)', async () => {
  const reg = await postJson('/api/registrations', { comp_wca_id: 'ChittagongCubeOpen2026', events: ['555'] }, H);
  assert(reg.status === 200, `reg setup failed: ${reg.status}`);
  const tx = await postJson(
    '/api/tx',
    { registration_id: reg.body.id, sender_number: '+8801000000102', txn_id: 'DRILLTX02', amount_bdt: 850 },
    H,
  );
  assert(tx.status === 200, `tx setup failed: ${tx.status}`);
  const decide = await postJson('/api/admin/tx-decision', { id: tx.body.id, decision: 'accepted', note: 'drill statement line' });
  assert(decide.status === 200, `decision failed without Resend: ${decide.status}`);
  const fetched = await getJson(`/api/admin/tx-queue?id=${tx.body.id}`);
  assert(fetched.body.row?.tx_status === 'accepted', 'tx decision not persisted');
  assert(fetched.body.row?.reg_status === 'verified', 'registration not flipped to verified');
  const mine = await getJson('/api/me/registrations', H);
  const mineRow = (mine.body.rows ?? []).find((r) => r.id === reg.body.id);
  assert(mineRow?.status === 'verified', 'dashboard not updated after accept');
});

if (failures > 0) {
  console.log(`${failures} check(s) failed`);
  process.exit(1);
}
console.log('drills-wp52: all green');
