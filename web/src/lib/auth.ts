// User sessions (WP-30): HMAC-signed cookies, no server state.
// Uses globalThis.crypto.subtle — identical API in workerd and node 18+,
// so this file is node-tested directly (scripts/test-auth.mjs).
// Prod note: SESSION_SECRET must be 32+ random bytes (OPS_HANDOFF WP-00).

export const SESSION_COOKIE = 'speedbd_session';
export const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;
const STATE_COOKIE = 'speedbd_oauth_state';
const STATE_MAX_AGE_SECONDS = 5 * 60;

export interface Session {
  cid: string; // competitor.id
  wca: string | null; // validated WCA ID, or null for newcomers
  exp: number; // unix seconds
}

function b64urlEncode(bytes: Uint8Array): string {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlDecode(s: string): Uint8Array {
  const b = s.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b + '='.repeat((4 - (b.length % 4)) % 4));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function hmac(secret: string, data: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return new Uint8Array(sig);
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i]! ^ b[i]!;
  return diff === 0;
}

export async function createSession(secret: string, cid: string, wca: string | null, nowSec?: number): Promise<string> {
  if (!secret || secret.length < 16) throw new Error('SESSION_SECRET too short');
  const now = nowSec ?? Math.floor(Date.now() / 1000);
  const payload: Session = { cid, wca, exp: now + SESSION_MAX_AGE_SECONDS };
  const body = b64urlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const sig = b64urlEncode(await hmac(secret, body));
  return `${body}.${sig}`;
}

export async function verifySession(secret: string, cookieValue: string, nowSec?: number): Promise<Session | null> {
  try {
    const dot = cookieValue.indexOf('.');
    if (dot < 0) return null;
    const body = cookieValue.slice(0, dot);
    const sig = b64urlDecode(cookieValue.slice(dot + 1));
    const expected = await hmac(secret, body);
    if (!constantTimeEqual(sig, expected)) return null;
    const payload = JSON.parse(new TextDecoder().decode(b64urlDecode(body))) as Session;
    if (typeof payload.cid !== 'string' || !payload.cid) return null;
    if (typeof payload.exp !== 'number') return null;
    const now = nowSec ?? Math.floor(Date.now() / 1000);
    if (payload.exp <= now) return null;
    return { cid: payload.cid, wca: typeof payload.wca === 'string' ? payload.wca : null, exp: payload.exp };
  } catch {
    return null;
  }
}

export function sessionCookieHeader(value: string, secure: boolean): string {
  const parts = [
    `${SESSION_COOKIE}=${value}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${SESSION_MAX_AGE_SECONDS}`,
  ];
  if (secure) parts.push('Secure');
  return parts.join('; ');
}

export function clearSessionCookieHeader(): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export function stateCookieHeader(state: string): string {
  return `${STATE_COOKIE}=${state}; Path=/api/auth; HttpOnly; SameSite=Lax; Max-Age=${STATE_MAX_AGE_SECONDS}`;
}

export function clearStateCookieHeader(): string {
  return `${STATE_COOKIE}=; Path=/api/auth; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export function readCookie(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx < 0) continue;
    if (part.slice(0, idx).trim() === name) return part.slice(idx + 1).trim();
  }
  return null;
}
