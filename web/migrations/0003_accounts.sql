-- 0003_accounts.sql — competitors, registrations, TxID queue (WP-10).
-- Fee verification and WCA acceptance are SEPARATE states (standing rule).
-- Money: whole taka integers only.

CREATE TABLE competitor (
  id TEXT PRIMARY KEY,
  wca_id TEXT UNIQUE,
  wca_oauth_sub TEXT UNIQUE,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE registration (
  id TEXT PRIMARY KEY,
  competitor_id TEXT NOT NULL REFERENCES competitor(id),
  comp_wca_id TEXT NOT NULL,
  events_json TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'pending',
  wca_accepted INTEGER NOT NULL DEFAULT 0,
  wca_accepted_by TEXT,
  wca_accepted_at TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX idx_registration_competitor ON registration(competitor_id);
CREATE INDEX idx_registration_comp ON registration(comp_wca_id);

CREATE TABLE tx_submission (
  id TEXT PRIMARY KEY,
  registration_id TEXT NOT NULL REFERENCES registration(id),
  sender_number TEXT NOT NULL,
  txn_id TEXT NOT NULL,
  amount_bdt INTEGER NOT NULL CHECK (amount_bdt >= 0),
  status TEXT NOT NULL DEFAULT 'pending',
  decided_by TEXT,
  decided_at TEXT,
  note TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX idx_tx_registration ON tx_submission(registration_id);
CREATE INDEX idx_tx_status ON tx_submission(status);
