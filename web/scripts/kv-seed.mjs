// scripts/kv-seed.mjs — seeds local KV through the REAL sync shapers (WP-22).
// Raw upstream fixtures go IN, shaped KV values come OUT — the same transform
// the daily cron applies. Never hand-write shaped KV fixtures (they drift).
// Usage: npm run kv:seed  (needs local wrangler KV; see plan/OPS_HANDOFF.md)
import { execSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const fix = (p) => JSON.parse(readFileSync(join(root, 'scripts', 'fixtures', p), 'utf8'));

const outDir = mkdtempSync(join(tmpdir(), 'kvseed-'));
execSync(
  `npx tsc workers/sync/src/sync.ts --outDir "${outDir}" --module nodenext --moduleResolution nodenext --target es2022 --strict --skipLibCheck`,
  { cwd: root, stdio: 'pipe' },
);
const sync = await import(pathToFileURL(join(outDir, 'sync.js')).href);
const putDir = mkdtempSync(join(tmpdir(), 'kvseed-put-'));
const puts = [];
function stage(key, value) {
  const file = join(putDir, Buffer.from(key).toString('hex') + '.json');
  writeFileSync(file, JSON.stringify(value));
  puts.push([key, file]);
}

// Competitions: raw upstream → shaped (emails stripped, canonical fields).
const rawComps = fix('wca-competitions.json');
const summaries = [];
for (const u of rawComps.items ?? []) {
  const s = sync.shapeCompSummary(u, null);
  if (s) summaries.push(s);
}
stage('wca:competitions:BD', { asOfExportDate: '2026-09-13', items: summaries });

// Detail: shaped summary + WCIF-derived event table (proves the WCIF path too).
// v0 stub mirrors the registration metadata the official API contributes live.
const dhakaRaw = rawComps.items.find((c) => c.id === 'DhakaSpringOpen2026');
const dhaka = sync.shapeCompSummary(dhakaRaw, { id: 'DhakaSpringOpen2026', competitor_limit: 120 });
const wcif = fix('wca-wcif-sample.json');
stage('wca:competition:DhakaSpringOpen2026', {
  ...dhaka,
  schedule_note: null,
  event_detail: sync.shapeEventDetail(wcif),
  schedule: sync.shapeSchedule(wcif),
  delegates: sync.shapeDelegates(wcif),
});

// Records + ranks: shaped fixture / raw upstream passthrough (sync stores raw).
stage('wca:records:BD', fix('wca-records.json'));
stage('wca:ranks:BD:333:single', fix('wca-ranks-333-single.json'));
stage('wca:ranks:BD:333:average', fix('wca-ranks-333-average.json'));

for (const [key, file] of puts) {
  execSync(`npx wrangler kv key put "${key}" --binding WCA_CACHE --local --path "${file}"`, {
    cwd: root,
    stdio: 'pipe',
  });
  console.log(`seeded ${key}`);
}
