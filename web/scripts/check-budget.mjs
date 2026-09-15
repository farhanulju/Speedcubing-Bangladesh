// scripts/check-budget.mjs — WP-03 CI guard: Editor.js exact pins + JS budget.
// Usage: npm run build && node scripts/check-budget.mjs  (aka npm run check:budget)
// Fails (exit 1) when: any @editorjs/* range isn't exact x.y.z; any
// `client:` hydration directive appears in public pages (admin exempt);
// any dist/_astro/*.js chunk exceeds 200 KB gzip; Editor.js is imported
// outside src/components/EditorField.astro. Public routes ship zero bundled
// JS (SSR, no client directives) — the single client chunk is the admin-only
// EditorField, so chunks are budgeted on gzip transfer size with raw reported.
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const GZIP_BUDGET = 200 * 1024;
let failures = 0;
function pass(name) {
  console.log(`PASS ${name}`);
}
function fail(name) {
  failures++;
  console.log(`FAIL ${name}`);
}

// --- 1. Editor.js versions pinned exact (no ^ ~ >=) ---
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const editorEntries = Object.entries({ ...pkg.dependencies, ...pkg.devDependencies }).filter(
  ([k]) => k === '@editorjs/editorjs' || k.startsWith('@editorjs/'),
);
if (editorEntries.length === 0) fail('no @editorjs/* entries in package.json');
for (const [name, ver] of editorEntries) {
  if (/^\d+\.\d+\.\d+$/.test(String(ver))) pass(`pinned ${name}@${ver}`);
  else fail(`unpinned ${name}@${ver} (must be exact x.y.z)`);
}

// --- 2. Editor.js imported only by the admin EditorField ---
function walk(dir, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}
const srcFiles = walk(join(root, 'src')).filter((p) => /\.(astro|ts|js|tsx|jsx|mjs)$/.test(p));
const editorImporters = srcFiles.filter((p) => readFileSync(p, 'utf8').includes('@editorjs/'));
const allowed = [join(root, 'src', 'components', 'EditorField.astro')];
const offenders = editorImporters.filter((p) => !allowed.includes(p));
if (offenders.length === 0) pass(`editor.js confined to EditorField (${editorImporters.length} file(s) import it)`);
else fail(`editor.js imported outside EditorField: ${offenders.map((p) => relative(root, p)).join(', ')}`);

// --- 3. No client: hydration in public pages (src/pages/admin/** exempt) ---
const pageFiles = walk(join(root, 'src', 'pages')).filter((p) => p.endsWith('.astro'));
const publicWithHydration = pageFiles
  .filter((p) => !relative(join(root, 'src', 'pages'), p).startsWith('admin'))
  .filter((p) => /client:(load|idle|visible|media|only)/.test(readFileSync(p, 'utf8')));
if (publicWithHydration.length === 0) pass(`public pages hydrate nothing (${pageFiles.length} page(s) scanned)`);
else fail(`client: directive in public page(s): ${publicWithHydration.map((p) => relative(root, p)).join(', ')}`);

// --- 4. Client chunk transfer sizes (needs a fresh build) ---
const astroDir = join(root, 'dist', '_astro');
if (!existsSync(astroDir)) {
  console.log('FAIL dist/_astro missing — run npm run build first');
  process.exit(2);
}
const chunks = readdirSync(astroDir).filter((f) => f.endsWith('.js'));
if (chunks.length === 0) pass('no client JS emitted at all (zero-JS site)');
for (const f of chunks) {
  const buf = readFileSync(join(astroDir, f));
  const rawKb = (buf.length / 1024).toFixed(1);
  const gzKb = (gzipSync(buf).length / 1024).toFixed(1);
  if (gzipSync(buf).length <= GZIP_BUDGET) pass(`${f} raw ${rawKb} KB / gzip ${gzKb} KB (budget 200 KB gzip)`);
  else fail(`${f} raw ${rawKb} KB / gzip ${gzKb} KB exceeds 200 KB gzip`);
}

if (failures > 0) {
  console.log(`${failures} check(s) failed`);
  process.exit(1);
}
console.log('check-budget: all green');
