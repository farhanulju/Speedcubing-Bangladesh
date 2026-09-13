-- 0005_trust.sql — consent, audit trail, email outbox (WP-10, WP-33).

CREATE TABLE guardian_consent (
  competitor_id TEXT PRIMARY KEY REFERENCES competitor(id),
  guardian_name TEXT NOT NULL,
  relation TEXT NOT NULL,
  consent_at TEXT NOT NULL,
  verified_by TEXT
);

CREATE TABLE audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  at TEXT NOT NULL,
  meta_json TEXT NOT NULL DEFAULT '{}'
);
CREATE INDEX idx_audit_entity ON audit_log(entity, entity_id);

CREATE TABLE email_outbox (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  to_addr TEXT NOT NULL,
  template TEXT NOT NULL,
  payload_json TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'queued',
  attempts INTEGER NOT NULL DEFAULT 0,
  sent_at TEXT
);
CREATE INDEX idx_outbox_status ON email_outbox(status);
