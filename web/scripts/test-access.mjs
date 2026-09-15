// scripts/test-access.mjs — Access JWT verification (WP-16).
// Compiles the REAL src/lib/access.ts, then verifies with locally generated
// RSA keys (no Access app needed): valid, tampered, expired, wrong aud,
// wrong iss, unknown kid, bad shape.
// Usage: node scripts/test-access.mjs
import { execSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { generateKeyPairSync, createSign } from 'node:crypto';

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

const outDir = mkdtempSync(join(tmpdir(), 'access-test-'));
try {
  execSync(`npx tsc src/lib/access.ts --outDir "${outDir}" --module nodenext --moduleResolution nodenext --target es2022 --strict --skipLibCheck`, {
    cwd: root,
    stdio: 'pipe',
  });
} catch (err) {
  console.log('tsc failed:');
  console.log(String(err.stdout ?? err.message));
  process.exit(1);
}
const access = await import(pathToFileURL(join(outDir, 'access.js')).href);

// Local RSA pair; public half served as JWKS.
const { publicKey, privateKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { format: 'jwk' },
  privateKeyEncoding: { format: 'jwk' },
});
const KID = 'test-key-1';
const TEAM = 'speedbd.cloudflareaccess.com';
const AUD = 'test-aud-tag';
const jwksFetch = async () => ({
  ok: true,
  json: async () => ({ keys: [{ ...publicKey, kid: KID, alg: 'RS256', use: 'sig' }] }),
});

function b64url(obj) {
  return Buffer.from(JSON.stringify(obj))
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}
function signToken(payload, kid = KID, key = privateKey) {
  const header = b64url({ alg: 'RS256', kid, typ: 'JWT' });
  const body = b64url(payload);
  const signer = createSign('RSA-SHA256');
  signer.update(`${header}.${body}`);
  const sig = signer.sign({ key, format: 'jwk' }, 'base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${header}.${body}.${sig}`;
}
const NOW = 1780000000;
const goodPayload = { exp: NOW + 300, iss: `https://${TEAM}`, aud: AUD, email: 'delegate@example.org', sub: 'user-1' };

await check('valid token verifies', async () => {
  const id = await access.verifyAccessJwt(signToken(goodPayload), { teamDomain: TEAM, aud: AUD }, jwksFetch, NOW);
  assert(id !== null && id.email === 'delegate@example.org', 'valid rejected');
});

await check('tampered payload rejected', async () => {
  const t = signToken(goodPayload).split('.');
  const evil = { ...goodPayload, email: 'attacker@example.org' };
  const forged = `${t[0]}.${b64url(evil)}.${t[2]}`;
  assert((await access.verifyAccessJwt(forged, { teamDomain: TEAM, aud: AUD }, jwksFetch, NOW)) === null, 'forged accepted');
});

await check('expired / wrong-aud / wrong-iss rejected', async () => {
  assert((await access.verifyAccessJwt(signToken({ ...goodPayload, exp: NOW - 1 }), { teamDomain: TEAM, aud: AUD }, jwksFetch, NOW)) === null, 'expired accepted');
  assert((await access.verifyAccessJwt(signToken({ ...goodPayload, aud: 'other' }), { teamDomain: TEAM, aud: AUD }, jwksFetch, NOW)) === null, 'wrong aud accepted');
  assert((await access.verifyAccessJwt(signToken({ ...goodPayload, iss: 'https://evil.example.com' }), { teamDomain: TEAM, aud: AUD }, jwksFetch, NOW)) === null, 'wrong iss accepted');
});

await check('unknown kid / malformed rejected', async () => {
  assert((await access.verifyAccessJwt(signToken(goodPayload, 'nope'), { teamDomain: TEAM, aud: AUD }, jwksFetch, NOW)) === null, 'unknown kid accepted');
  assert((await access.verifyAccessJwt('garbage', { teamDomain: TEAM, aud: AUD }, jwksFetch, NOW)) === null, 'garbage accepted');
  assert((await access.verifyAccessJwt(signToken(goodPayload), { teamDomain: '', aud: AUD }, jwksFetch, NOW)) === null, 'empty config accepted');
});

if (failures > 0) {
  console.log(`${failures} check(s) failed`);
  process.exit(1);
}
console.log('test-access: all green');
