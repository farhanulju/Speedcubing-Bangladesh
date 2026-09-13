-- 0007_gallery_reserved.sql — schema reserved, NO UI in v1 (A10 deferred).
-- Photo consent flag is load-bearing for the Phase-2 activation.

CREATE TABLE gallery_album (
  slug TEXT PRIMARY KEY,
  year INTEGER NOT NULL,
  comp_wca_id TEXT,
  title TEXT NOT NULL,
  cover_r2 TEXT
);

CREATE TABLE gallery_photo (
  id TEXT PRIMARY KEY,
  album_slug TEXT NOT NULL REFERENCES gallery_album(slug),
  r2key TEXT NOT NULL,
  caption TEXT,
  consent INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_gallery_album ON gallery_photo(album_slug);
