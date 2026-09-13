// Auth contracts (WP-30 users via WCA OAuth, WP-16 admins via Access).
// Sessions: httpOnly + SameSite=Lax. Never store WCA passwords.

export const SESSION_COOKIE = 'speedbd_session';
export const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

export interface Session {
  competitorId: string;
  wcaId: string;
}

export async function getSessionNotImplemented(): Promise<never> {
  throw new Error('not implemented — WP-30 (WCA OAuth session)');
}
