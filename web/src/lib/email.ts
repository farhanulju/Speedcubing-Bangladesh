// Transactional email via Resend + D1 outbox (WP-33, WP-42).
// Dashboard is canonical — sends never block verifications.

export const EMAIL_TEMPLATES = [
  'payment-verified',
  'payment-rejected',
  'guardian-consent-recorded',
] as const;

export type EmailTemplate = (typeof EMAIL_TEMPLATES)[number];

export interface OutboxEntry {
  to_addr: string;
  template: EmailTemplate;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: Record<string, any>;
}

export async function queueEmailNotImplemented(_entry: OutboxEntry): Promise<never> {
  throw new Error('not implemented — WP-33 (outbox writer)');
}
