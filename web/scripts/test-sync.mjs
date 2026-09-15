// scripts/test-sync.mjs — sync worker verification (WP-40/WP-41/WP-42).
// Compiles the REAL worker sources with tsc, then runs them in node against:
// - stub fetch serving repo fixtures (offline, deterministic),
// - fake KV (Map), real SQLite schema (migrations/) via node:sqlite.
// Usage: node scripts/test-sync.mjs
import { execSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const fix = (p) => JSON.parse(readFileSync(join(root, 'scripts', 'fixtures', p), 'utf8'));
let failures = 0;

function check(name, fn) {
  return Promise.resolve()
    .then(fn)
    .then(() => console.log(`PASS ${name}`))
    .catch((err) => {
      failures++;
      console.log(`FAIL ${name}: ${err.message}`);
    });
}
function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

// --- compile real worker sources ---
const outDir = mkdtempSync(join(tmpdir(), 'sync-test-'));
try {
  execSync(
    `npx tsc workers/sync/src/sync.ts workers/sync/src/index.ts --outDir "${outDir}" --module nodenext --moduleResolution nodenext --target es2022 --strict --skipLibCheck --types @cloudflare/workers-types`,
    { cwd: root, stdio: 'pipe' },
  );
} catch (err) {
  console.log('tsc failed:');
  console.log(String(err.stdout ?? err.message));
  process.exit(1);
}
const sync = await import(pathToFileURL(join(outDir, 'sync.js')).href);
const worker = (await import(pathToFileURL(join(outDir, 'index.js')).href)).default;

// --- fakes ---
const kvStore = new Map();
const kvFake = {
  async get(k, type) {
    const v = kvStore.get(k) ?? null;
    if (v === null) return null;
    return type === 'json' ? JSON.parse(v) : v;
  },
  async put(k, v) {
    kvStore.set(k, v);
  },
};

const sqlite = new DatabaseSync(':memory:');
for (const f of readdirSync(join(root, 'migrations')).filter((f) => f.endsWith('.sql')).sort()) {
  sqlite.exec(readFileSync(join(root, 'migrations', f), 'utf8'));
}
const dbFake = {
  prepare: (q) => {
    const stmt = sqlite.prepare(q);
    let args = [];
    const wrap = {
      bind: (...v) => {
        args = v;
        return wrap;
      },
      first: () => stmt.get(...args) ?? null,
      all: () => ({ results: stmt.all(...args) ?? [] }),
      run: () => stmt.run(...args),
    };
    return wrap;
  },
  batch: async (stmts) => {
    const out = [];
    for (const s of stmts) out.push(await s.run());
    return out;
  },
};

const routes = [
  [/\/events\.json$/, () => fix('wca-events.json')],
  [/\/rank\/BD\/single\/333\.json$/, () => fix('wca-ranks-333-single.json')],
  [/\/rank\/BD\/average\/333\.json$/, () => fix('wca-ranks-333-average.json')],
  [/\/rank\/BD\//, () => ({ items: [] })],
  [/\/competitions\/BD\.json$/, () => fix('wca-competitions.json')],
  [/\/competitions\/DhakaSpringOpen2026\.json$/, () => ({ id: 'DhakaSpringOpen2026' })],
  [/\/wcif\/public$/, () => fix('wca-wcif-sample.json')],
  [/\/persons\/2026FIXT01\.json$/, () => fix('wca-person-2026FIXT01.json')],
  [/\/results\/DhakaSpringOpen2026\/333\.json$/, () => fix('wca-results-sample.json')],
];
globalThis.fetch = async (url) => {
  const u = String(url);
  for (const [re, fn] of routes) {
    if (re.test(u)) {
      if (process.env.SYNC_DEBUG) console.log('HIT', fn.name || 'fn', '<=', u.slice(-50));
      return { ok: true, json: async () => fn() };
    }
  }
  if (process.env.SYNC_DEBUG) console.log('MISS <=', u.slice(-70));
  return { ok: false, json: async () => null };
};
const env = { DB: dbFake, WCA_CACHE: kvFake };

// --- run the REAL scheduled sync ---
await worker.scheduled({ cron: '0 20 * * *' }, env, {});

// --- assertions on shaped output ---
await check('records shaped from rank files', () => {
  const rec = JSON.parse(kvStore.get('wca:records:BD'));
  const r333 = rec.records.find((r) => r.event === '333');
  assert(r333.single.value_centis === 582 && r333.single.wca_id === '2026FIXT01', 'bad single');
  assert(r333.average.value_centis === 694, 'bad average');
  const r222 = rec.records.find((r) => r.event === '222');
  assert(r222.single === null && r222.average === null, 'empty ranks should yield nulls');
});

await check('competitions merged, emails stripped', () => {
  const comps = JSON.parse(kvStore.get('wca:competitions:BD'));
  assert(comps.items.length === 2, 'expected 2 comps');
  assert(!JSON.stringify(comps).includes('@'), 'PII leak: email in KV');
  const d = JSON.parse(kvStore.get('wca:competition:DhakaSpringOpen2026'));
  assert(d.event_detail.length === 2, 'event_detail missing');
  const e333 = d.event_detail.find((e) => e.event === '333');
  assert(e333.rounds === 3 && e333.format === 'Average of 5' && e333.time_limit_centis === 60000, 'bad 333 detail');
  assert(Array.isArray(d.schedule) && d.schedule.length === 2, 'schedule days missing');
  assert(d.schedule[0].items.some((i) => i.title.includes('Check-in') && i.start === '08:30'), 'bad schedule item');
  assert(d.delegates.length === 2 && d.delegates[0].role === 'delegate' && d.delegates[0].wca_id === '2019SAMP01', 'bad delegates');
});

await check('person cache + snapshots + champion', () => {
  const p = JSON.parse(kvStore.get('wca:person:2026FIXT01'));
  assert(p.name === 'Fixture Holder', 'person name wrong');
  const snaps = sqlite.prepare('SELECT COUNT(*) AS n FROM record_snapshot').get();
  assert(snaps.n === 2, `expected 2 snapshots, got ${snaps.n}`);
  const champ = sqlite.prepare('SELECT * FROM comp_champion').get();
  assert(champ.comp_wca_id === 'DhakaSpringOpen2026' && champ.winner_wca_id === '2026SAMP01' && champ.winning_value_centis === 1070, 'bad champion');
});

// --- outbox flush against the same sqlite ---
sqlite.exec("INSERT INTO email_outbox (to_addr, template, payload_json, status, attempts) VALUES ('a@example.org','payment-verified','{\"amount\":\"800\",\"comp\":\"X\"}','queued',0)");
sqlite.exec("INSERT INTO email_outbox (to_addr, template, payload_json, status, attempts) VALUES ('fail@example.org','payment-rejected','{\"comp\":\"X\",\"note\":\"<b>x</b>\"}','queued',0)");
sqlite.exec("INSERT INTO email_outbox (to_addr, template, payload_json, status, attempts) VALUES ('fail@example.org','payment-rejected','{\"comp\":\"X\"}','queued',2)");

await check('outbox flush: send, retry, dead-letter', async () => {
  const send = (to) => Promise.resolve(to !== 'fail@example.org');
  const r = await sync.flushOutbox(dbFake, send);
  assert(r.sent === 1 && r.failed === 2, `unexpected ${JSON.stringify(r)}`);
  const rows = sqlite.prepare('SELECT to_addr, status, attempts FROM email_outbox ORDER BY id').all();
  const byTo = Object.fromEntries(rows.map((x) => [`${x.to_addr}:${x.attempts}`, x.status]));
  assert(byTo['a@example.org:0'] === 'sent', 'sent row wrong');
  assert(byTo['fail@example.org:1'] === 'queued', 'retry row wrong');
  assert(byTo['fail@example.org:3'] === 'failed', 'dead-letter wrong');
});

await check('email escaping + resend sender shape', async () => {
  const { html } = sync.renderEmail('payment-rejected', { comp: 'X', note: '<script>alert(1)</script>' });
  assert(!html.includes('<script>'), 'XSS in template');
  let captured = null;
  const stub = async (url, init) => {
    captured = { url, init: JSON.parse(init.body), auth: init.headers.Authorization };
    return { ok: true, json: async () => ({ id: 're_1' }) };
  };
  const send = sync.resendSender(stub, 'KEY', 'Org <n@x.org>');
  assert((await send('a@x.org', 's', '<p>h</p>')) === true, 'send failed');
  assert(captured.url === 'https://api.resend.com/emails' && captured.auth === 'Bearer KEY', 'bad resend call');
  assert(captured.init.to[0] === 'a@x.org' && captured.init.from === 'Org <n@x.org>', 'bad resend body');
  const throwing = sync.resendSender(async () => {
    throw new Error('down');
  }, 'K', 'f');
  assert((await throwing('a@x.org', 's', 'h')) === false, 'throw should be false');
});

if (failures > 0) {
  console.log(`${failures} check(s) failed`);
  process.exit(1);
}
console.log('test-sync: all green');
