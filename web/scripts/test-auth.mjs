// scripts/test-auth.mjs — session crypto verification (WP-30).
// Compiles the REAL src/lib/auth.ts with tsc, then exercises it in node
// (WebCrypto subtle is identical in node 18+ and workerd).
// Usage: node scripts/test-auth.mjs
import { execSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
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

const outDir = mkdtempSync(join(tmpdir(), 'auth-test-'));
try {
  execSync(`npx tsc src/lib/auth.ts --outDir "${outDir}" --module nodenext --moduleResolution nodenext --target es2022 --strict --skipLibCheck`, {
    cwd: root,
    stdio: 'pipe',
  });
} catch (err) {
  console.log('tsc failed:');
  console.log(String(err.stdout ?? err.message));
  process.exit(1);
}
const auth = await import(pathToFileURL(join(outDir, 'auth.js')).href);
const SECRET = 'test-secret-that-is-long-enough-12345';
const NOW = 1780000000;

await check('roundtrip', async () => {
  const c = await auth.createSession(SECRET, 'comp-1', '2026SAMP01', NOW);
  const s = await auth.verifySession(SECRET, c, NOW + 100);
  assert(s !== null && s.cid === 'comp-1' && s.wca === '2026SAMP01', 'roundtrip broken');
});

await check('null wca (newcomer) survives', async () => {
  const c = await auth.createSession(SECRET, 'comp-2', null, NOW);
  const s = await auth.verifySession(SECRET, c, NOW + 100);
  assert(s !== null && s.cid === 'comp-2' && s.wca === null, 'null wca broken');
});

await check('tamper rejected', async () => {
  const c = await auth.createSession(SECRET, 'comp-1', null, NOW);
  const parts = c.split('.');
  const forged = `${parts[0].slice(0, -2)}xx.${parts[1]}`;
  assert((await auth.verifySession(SECRET, forged, NOW + 100)) === null, 'forged body accepted');
  const badSig = `${parts[0]}.AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA`;
  assert((await auth.verifySession(SECRET, badSig, NOW + 100)) === null, 'forged sig accepted');
});

await check('expiry + wrong secret rejected', async () => {
  const c = await auth.createSession(SECRET, 'comp-1', null, NOW);
  assert((await auth.verifySession(SECRET, c, NOW + 31 * 24 * 3600)) === null, 'expired accepted');
  assert((await auth.verifySession('different-secret-that-is-long-enough', c, NOW + 100)) === null, 'wrong secret accepted');
  assert((await auth.verifySession(SECRET, 'garbage', NOW)) === null, 'garbage accepted');
});

await check('short secret refused at creation', async () => {
  let threw = false;
  try {
    await auth.createSession('short', 'c', null, NOW);
  } catch {
    threw = true;
  }
  assert(threw, 'short secret accepted');
});

await check('cookie headers + parsing', async () => {
  const set = auth.sessionCookieHeader('abc.def', true);
  assert(set.includes('HttpOnly') && set.includes('SameSite=Lax') && set.includes('Secure') && set.includes('Max-Age='), 'cookie flags wrong');
  const plain = auth.sessionCookieHeader('abc.def', false);
  assert(!plain.includes('Secure'), 'non-https should omit Secure');
  assert(auth.readCookie('a=1; speedbd_session=tok123; b=2', 'speedbd_session') === 'tok123', 'cookie parse broken');
  assert(auth.readCookie(null, 'speedbd_session') === null, 'null header broken');
  assert(auth.clearSessionCookieHeader().includes('Max-Age=0'), 'clear broken');
});

if (failures > 0) {
  console.log(`${failures} check(s) failed`);
  process.exit(1);
}
console.log('test-auth: all green');
