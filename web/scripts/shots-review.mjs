// scripts/shots-review.mjs — Stitch design-comparison captures (WP-52 viewports).
// Needs: seeded local D1+KV, dev server running. Read-only (no DB writes).
// Usage: node scripts/shots-review.mjs http://localhost:XXXX [outDir]
// Prints each shot path for review.
import { mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium } from '@playwright/test';

const base = process.argv[2] ?? 'http://localhost:4321';
const out = process.argv[3] ?? join(tmpdir(), 'speedbd-review-');
mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
const desktop = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const mobile = await browser.newContext({ viewport: { width: 390, height: 844 } });
const userCtx = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  extraHTTPHeaders: { 'x-dev-user': 'sample-competitor' },
});
const d = await desktop.newPage();
const m = await mobile.newPage();
const u = await userCtx.newPage();

async function shot(page, name, path) {
  await page.goto(`${base}${path}`, { waitUntil: 'load' });
  await page.waitForTimeout(600);
  const file = join(out, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  console.log(`SHOT ${name} -> ${file}`);
}

await shot(d, 'desktop-home', '/');
await shot(d, 'desktop-competitions', '/competitions');
await shot(d, 'desktop-comp-detail', '/competitions/DhakaSpringOpen2026');
await shot(d, 'desktop-records', '/records');
await shot(d, 'desktop-worlds', '/worlds-2027');
await shot(d, 'desktop-faq', '/faq');
await shot(d, 'desktop-admin', '/admin');
await shot(u, 'desktop-dashboard', '/dashboard');
await shot(m, 'mobile-home', '/');
await shot(m, 'mobile-competitions', '/competitions');
await shot(m, 'mobile-records', '/records');

await browser.close();
console.log(`done in ${out}`);
