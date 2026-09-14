// Turnstile server verification (WP-21). All public forms require a valid token.
// Local/dev: use Cloudflare's documented test keys (always-pass widget +
// matching secret) in .dev.vars — see plan/OPS_HANDOFF.md.

interface VerifyResponse {
  success: boolean;
  'error-codes'?: string[];
}

export async function verifyTurnstile(token: string, secret: string): Promise<boolean> {
  if (!token || !secret) return false;
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret, response: token }),
    });
    const data = (await res.json()) as VerifyResponse;
    return data.success === true;
  } catch {
    return false; // fail closed: verification service unreachable → reject
  }
}

export function turnstileSecret(env: Record<string, string | undefined>): string {
  return env.TURNSTILE_SECRET_KEY ?? '';
}
