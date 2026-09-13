-- 0006_history.sql — record snapshots + derived champions (WP-41).
-- Append-only; write only on change. ~12k rows/year — trivial.

CREATE TABLE record_snapshot (
  event TEXT NOT NULL,
  kind TEXT NOT NULL,
  value_centis INTEGER NOT NULL,
  holder_wca_id TEXT,
  holder_name TEXT,
  comp_wca_id TEXT,
  export_date TEXT NOT NULL,
  PRIMARY KEY (event, kind, export_date)
);

CREATE TABLE comp_champion (
  comp_wca_id TEXT PRIMARY KEY,
  winner_wca_id TEXT,
  winning_value_centis INTEGER,
  derived_at TEXT NOT NULL,
  override_winner_wca_id TEXT
);
