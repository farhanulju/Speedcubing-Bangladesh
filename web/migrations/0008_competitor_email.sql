-- 0008_competitor_email.sql — email captured at WCA OAuth login (WP-30 writes it).
-- Nullable: older rows predate login; outbox sends only when present.
ALTER TABLE competitor ADD COLUMN email TEXT;
