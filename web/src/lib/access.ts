// Cloudflare Access JWT verification (WP-16).
// RS256 tokens from https://<team>.cloudflareaccess.com, JWKS at
// /cdn-cgi/access/certs. Verified claims: signature (kid-matched key),
// exp, iss, aud (the app's AUD tag). Pure + injectable — node-tested
// (scripts/test-access.mjs) with locally generated RSA keys.
export interface AccessConfig {
  teamDomain: string; // e.g. speedcubingbd.cloudflareaccess.com (no scheme)
  aud: string; // Application Audience tag from the Access app
}

export interface AccessIdentity {
  email: string | null;
  sub: string | null;
}

type FetchFn = (url: string) => Promise<{ ok: boolean; json: () => Promise<unknown> }>;

interface JwksKey {
  kid?: string;
  kty?: string;
  alg?: string;
  use?: string;
  n?: string;
  e?: string;
}

function b64urlToBytes(s: string): Uint8Array<ArrayBuffer> {
  const b = s.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b + '='.repeat((4 - (b.length % 4)) % 4));
  const out = new Uint8Array(new ArrayBuffer(bin.length));
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function importRsaKey(jwk: JwksKey): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'jwk',
    { kty: 'RSA', n: jwk.n, e: jwk.e, alg: 'RS256', ext: true } as JsonWebKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify'],
  );
}

export async function verifyAccessJwt(
  token: string,
  config: AccessConfig,
  fetchFn: FetchFn,
  nowSec?: number,
): Promise<AccessIdentity | null> {
  try {
    if (!token || !config.teamDomain || !config.aud) return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const header = JSON.parse(new TextDecoder().decode(b64urlToBytes(parts[0]!))) as {
      alg?: string;
      kid?: string;
    };
    if (header.alg !== 'RS256' || !header.kid) return null;
    const payload = JSON.parse(new TextDecoder().decode(b64urlToBytes(parts[1]!))) as {
      exp?: number;
      iss?: string;
      aud?: string | string[];
      email?: string;
      sub?: string;
    };
    const now = nowSec ?? Math.floor(Date.now() / 1000);
    if (typeof payload.exp !== 'number' || payload.exp <= now) return null;
    if (payload.iss !== `https://${config.teamDomain}`) return null;
    const audOk = Array.isArray(payload.aud) ? payload.aud.includes(config.aud) : payload.aud === config.aud;
    if (!audOk) return null;

    const certs = (await fetchFn(`https://${config.teamDomain}/cdn-cgi/access/certs`)) as unknown as {
      ok: boolean;
      json: () => Promise<unknown>;
    };
    if (!certs.ok) return null;
    const jwks = (await certs.json()) as { keys?: JwksKey[] };
    const jwk = (jwks.keys ?? []).find((k) => k.kid === header.kid && k.kty === 'RSA' && k.n && k.e);
    if (!jwk) return null;
    const key = await importRsaKey(jwk);
    const data = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
    const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, b64urlToBytes(parts[2]!), data);
    if (!ok) return null;
    return {
      email: typeof payload.email === 'string' ? payload.email : null,
      sub: typeof payload.sub === 'string' ? payload.sub : null,
    };
  } catch {
    return null;
  }
}
