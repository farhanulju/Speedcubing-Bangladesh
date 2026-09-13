-- 0002_comps_donations.sql — comp overrides + Worlds fundraising (WP-10).

CREATE TABLE comp_override (
  wca_id TEXT PRIMARY KEY,
  payment_steps_json TEXT NOT NULL DEFAULT '{"blocks":[]}',
  venue_note TEXT,
  fee_tiers_json TEXT NOT NULL DEFAULT '{}',
  updated_by TEXT,
  updated_at TEXT
);

CREATE TABLE donation_page (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  target_bdt INTEGER NOT NULL,
  raised_manual_bdt INTEGER NOT NULL DEFAULT 0,
  policy_json TEXT NOT NULL DEFAULT '{"blocks":[]}',
  worlds_host_city TEXT NOT NULL DEFAULT 'Sweden',
  updated_by TEXT,
  updated_at TEXT
);

CREATE TABLE donor (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  amount_bdt INTEGER,
  consent INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  updated_by TEXT,
  updated_at TEXT
);
