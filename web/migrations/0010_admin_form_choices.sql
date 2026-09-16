-- Admin-managed choices for people roles and sponsor tiers, plus explicit
-- anonymity for donor-wall entries.
ALTER TABLE donor ADD COLUMN is_anonymous INTEGER NOT NULL DEFAULT 0;

CREATE TABLE person_role (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL UNIQUE,
  updated_by TEXT,
  updated_at TEXT
);

CREATE TABLE sponsor_tier (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL UNIQUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  updated_by TEXT,
  updated_at TEXT
);

INSERT INTO person_role (id, label) VALUES
  ('delegate', 'Delegate'),
  ('organizer', 'Organizer'),
  ('executive', 'Executive'),
  ('media', 'Media'),
  ('outreach', 'Outreach'),
  ('volunteer', 'Volunteer');

INSERT INTO sponsor_tier (id, label, sort_order) VALUES
  ('gold', 'gold', 10),
  ('silver', 'silver', 20),
  ('bronze', 'bronze', 30),
  ('community', 'community', 40);

-- Preserve any custom values already in use when this migration is applied.
INSERT OR IGNORE INTO person_role (id, label)
  SELECT 'legacy-' || lower(hex(randomblob(8))), trim(role)
  FROM person WHERE role IS NOT NULL AND trim(role) <> '';
INSERT OR IGNORE INTO sponsor_tier (id, label, sort_order)
  SELECT 'legacy-' || lower(hex(randomblob(8))), trim(tier), MIN(sort_order)
  FROM sponsor WHERE tier IS NOT NULL AND trim(tier) <> '' GROUP BY trim(tier);
