// Shared API handlers (single definition per concept).
// Astro endpoints under src/pages/api/* are thin wrappers around these.
// Full implementations land in M1 (forms/registrations) and M3/M4 (sync, mail).

export function health(): Response {
  return Response.json({ ok: true, service: 'speedbd-web' });
}

export function notImplemented(feature: string): Response {
  return Response.json({ error: 'not_implemented', feature }, { status: 501 });
}

export const BDT_ZERO_DECIMALS = true; // whole taka end to end (standing rule)

export function assertWholeTaka(amount: number): void {
  if (!Number.isInteger(amount) || amount < 0) {
    throw new Error(`amount_bdt must be a non-negative integer, got ${amount}`);
  }
}
