-- 0004_engagement.sql — lost-found, opt-ins, contact inbox (WP-10).
-- Turnstile + rate limits enforced in workers/api.ts, not here.

CREATE TABLE lost_found (
  id TEXT PRIMARY KEY,
  comp_wca_id TEXT,
  item TEXT NOT NULL,
  photo_r2 TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  reporter_contact TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX idx_lostfound_status ON lost_found(status);

CREATE TABLE opt_in (
  id TEXT PRIMARY KEY,
  channel TEXT NOT NULL,
  handle TEXT NOT NULL,
  consent_at TEXT NOT NULL,
  UNIQUE (channel, handle)
);

CREATE TABLE contact_message (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  wca_id TEXT,
  category TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  at TEXT NOT NULL
);
CREATE INDEX idx_contact_status ON contact_message(status);
