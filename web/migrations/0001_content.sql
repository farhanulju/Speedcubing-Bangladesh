-- 0001_content.sql — content core (WP-10). All body copy: Editor.js JSON in *_json.
-- Human-edited rows carry updated_by/at. No website content lives in git.

CREATE TABLE announcement (
  slug TEXT PRIMARY KEY,
  locale TEXT NOT NULL DEFAULT 'en',
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  comp_wca_id TEXT,
  body_json TEXT NOT NULL DEFAULT '{"blocks":[]}',
  pinned INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  updated_by TEXT,
  updated_at TEXT
);

CREATE TABLE page (
  slug TEXT PRIMARY KEY,
  locale TEXT NOT NULL DEFAULT 'en',
  title TEXT NOT NULL,
  body_json TEXT NOT NULL DEFAULT '{"blocks":[]}',
  status TEXT NOT NULL DEFAULT 'draft',
  updated_by TEXT,
  updated_at TEXT
);

CREATE TABLE person (
  id TEXT PRIMARY KEY,
  locale TEXT NOT NULL DEFAULT 'en',
  name TEXT NOT NULL,
  photo_r2 TEXT,
  photo_consent INTEGER NOT NULL DEFAULT 0,
  role TEXT NOT NULL,
  wca_id TEXT,
  focus_area TEXT,
  member_since TEXT,
  links_json TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft',
  updated_by TEXT,
  updated_at TEXT
);

CREATE TABLE volunteer_internal (
  person_id TEXT PRIMARY KEY REFERENCES person(id),
  tier TEXT,
  notes TEXT,
  availability TEXT,
  mobility TEXT
);

CREATE TABLE sponsor (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  logo_r2 TEXT,
  tier TEXT,
  url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  updated_by TEXT,
  updated_at TEXT
);

CREATE TABLE faq (
  id TEXT PRIMARY KEY,
  locale TEXT NOT NULL DEFAULT 'en',
  q TEXT NOT NULL,
  a_json TEXT NOT NULL DEFAULT '{"blocks":[]}',
  sort_order INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  updated_by TEXT,
  updated_at TEXT
);

CREATE TABLE news (
  slug TEXT PRIMARY KEY,
  locale TEXT NOT NULL DEFAULT 'en',
  title TEXT NOT NULL,
  published_at TEXT,
  body_json TEXT NOT NULL DEFAULT '{"blocks":[]}',
  cover_r2 TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  updated_by TEXT,
  updated_at TEXT
);
