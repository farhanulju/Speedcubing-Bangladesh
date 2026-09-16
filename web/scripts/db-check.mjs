// scripts/db-check.mjs — validates migrations + seed on throwaway SQLite (WP-10).
// Usage: node scripts/db-check.mjs
// Exit 0 = all checks pass. Uses node:sqlite (dev harness only, not shipped).
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
let failures = 0;

function check(name, fn) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (err) {
    failures++;
    console.log(`FAIL ${name}: ${err.message}`);
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const db = new DatabaseSync(':memory:');

const migrations = readdirSync(join(root, 'migrations')).filter((f) => f.endsWith('.sql')).sort();
check('migrations apply in order', () => {
  assert(migrations.length > 0, 'no migrations found');
  const sorted = [...migrations].sort();
  assert(JSON.stringify(migrations) === JSON.stringify(sorted), 'migrations not in order');
  for (const f of migrations) db.exec(readFileSync(join(root, 'migrations', f), 'utf8'));
});

db.exec(readFileSync(join(root, 'scripts', 'seed.sql'), 'utf8'));

const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all().map((r) => r.name);
check('all tables exist', () => {
  const expected = ['announcement','page','person','person_role','volunteer_internal','sponsor','sponsor_tier','faq','news','comp_override','donation_page','donor','competitor','registration','tx_submission','lost_found','opt_in','contact_message','guardian_consent','audit_log','email_outbox','record_snapshot','comp_champion','gallery_album','gallery_photo'];
  assert(tables.length === expected.length, `expected ${expected.length} tables, got ${tables.length}: ${tables.join(',')}`);
  for (const t of expected) assert(tables.includes(t), `missing table ${t}`);
});

check('seed rows present', () => {
  for (const t of ['announcement','person','competitor','registration','tx_submission','record_snapshot']) {
    const n = db.prepare(`SELECT COUNT(*) AS n FROM ${t}`).get().n;
    assert(n > 0, `${t} empty`);
  }
});

check('whole-taka CHECK rejects negatives', () => {
  let threw = false;
  try {
    db.exec("INSERT INTO tx_submission (id, registration_id, sender_number, txn_id, amount_bdt, status, created_at) VALUES ('neg-test','sample-registration','x','y',-5,'pending','2026-09-14')");
  } catch { threw = true; }
  assert(threw, 'negative amount_bdt accepted');
});

check('wca_accepted defaults to 0', () => {
  const r = db.prepare("SELECT wca_accepted FROM registration WHERE id='sample-registration'").get();
  assert(r.wca_accepted === 0, 'default not 0');
});

check('donation_page singleton + Sweden default', () => {
  const r = db.prepare('SELECT target_bdt, worlds_host_city FROM donation_page WHERE id=1').get();
  assert(r.target_bdt === 500000 && r.worlds_host_city === 'Sweden', 'unexpected donation_page row');
});

check('admin form choices and donor anonymity are migrated', () => {
  const roles = db.prepare('SELECT COUNT(*) AS n FROM person_role').get().n;
  const tiers = db.prepare('SELECT COUNT(*) AS n FROM sponsor_tier').get().n;
  const cols = db.prepare('PRAGMA table_info(donor)').all().map((r) => r.name);
  assert(roles >= 1 && tiers >= 1, 'role/tier options were not seeded');
  assert(cols.includes('is_anonymous'), 'donor anonymity column missing');
});

check('unique constraints hold', () => {
  let threw = false;
  try {
    db.exec("INSERT INTO competitor (id, wca_id, wca_oauth_sub, name, created_at) VALUES ('dup','2026SAMP01','other','Dup','2026-09-14')");
  } catch { threw = true; }
  assert(threw, 'duplicate wca_id accepted');
});

if (failures > 0) {
  console.log(`${failures} check(s) failed`);
  process.exit(1);
}
console.log('db-check: all green');
