-- scripts/seed.sql — PII-free local/dev samples (WP-10). Reversible: re-apply migrations fresh.
-- NEVER production data. Placeholders are purged in WP-51 before launch.

INSERT INTO announcement (slug, title, date, comp_wca_id, body_json, pinned, status, updated_by, updated_at) VALUES
('sample-registration-open', 'Sample: registration opens Friday 8 PM', '2026-09-14', NULL, '{"blocks":[{"type":"paragraph","data":{"text":"Sample announcement body."}}]}', 1, 'published', 'seed', '2026-09-14');

INSERT INTO page (slug, title, body_json, status, updated_by, updated_at) VALUES
('about-story', 'Sample story', '{"blocks":[{"type":"header","data":{"text":"Sample","level":2}}]}', 'draft', 'seed', '2026-09-14');

INSERT INTO person (id, name, photo_r2, photo_consent, role, wca_id, focus_area, member_since, links_json, status, updated_by, updated_at) VALUES
('sample-delegate', 'Sample Delegate', NULL, 0, 'WCA Delegate', NULL, 'Dhaka', '2024-01', '{}', 'draft', 'seed', '2026-09-14'),
('sample-exec', 'Sample Executive', NULL, 0, 'Head of Competitions', NULL, 'Dhaka', '2025-06', '{}', 'draft', 'seed', '2026-09-14');

INSERT INTO sponsor (id, name, logo_r2, tier, url, sort_order, status, updated_by, updated_at) VALUES
('sample-sponsor', 'Sample Sponsor Ltd', NULL, 'gold', 'https://example.org', 0, 'draft', 'seed', '2026-09-14');

INSERT INTO faq (id, q, a_json, sort_order, status, updated_by, updated_at) VALUES
('sample-faq-1', 'Sample: do I need to be fast?', '{"blocks":[{"type":"paragraph","data":{"text":"No — sample answer."}}]}', 0, 'draft', 'seed', '2026-09-14');

INSERT INTO news (slug, title, published_at, body_json, cover_r2, status, updated_by, updated_at) VALUES
('sample-recap', 'Sample competition recap', '2026-09-01', '{"blocks":[{"type":"paragraph","data":{"text":"Sample recap."}}]}', NULL, 'draft', 'seed', '2026-09-14');

INSERT INTO comp_override (wca_id, payment_steps_json, venue_note, fee_tiers_json, updated_by, updated_at) VALUES
('SampleComp2026', '{"blocks":[]}', 'Sample venue note', '{"early":800,"regular":1000}', 'seed', '2026-09-14');

INSERT INTO donation_page (id, target_bdt, raised_manual_bdt, policy_json, worlds_host_city, updated_by, updated_at) VALUES
(1, 500000, 185000, '{"blocks":[]}', 'Sweden', 'seed', '2026-09-14');

INSERT INTO donor (id, name, amount_bdt, consent, sort_order, updated_by, updated_at) VALUES
('sample-donor', 'Sample Family', 25000, 1, 0, 'seed', '2026-09-14');

INSERT INTO competitor (id, wca_id, wca_oauth_sub, name, email, created_at) VALUES
('sample-competitor', '2026SAMP01', 'oauth-sub-sample', 'Sample Competitor', 'sample@example.org', '2026-09-14');

INSERT INTO registration (id, competitor_id, comp_wca_id, events_json, status, wca_accepted, created_at) VALUES
('sample-registration', 'sample-competitor', 'SampleComp2026', '["333","222"]', 'pending', 0, '2026-09-14');

INSERT INTO tx_submission (id, registration_id, sender_number, txn_id, amount_bdt, status, created_at) VALUES
('sample-tx', 'sample-registration', '+8801000000000', 'TESTTXID1', 800, 'pending', '2026-09-14');

INSERT INTO lost_found (id, comp_wca_id, item, photo_r2, status, reporter_contact, created_at) VALUES
('sample-lf', 'SampleComp2026', 'Sample 3x3 cube', NULL, 'open', 'sample@example.org', '2026-09-14');

INSERT INTO opt_in (id, channel, handle, consent_at) VALUES
('sample-optin', 'email', 'sample@example.org', '2026-09-14');

INSERT INTO contact_message (id, name, email, wca_id, category, body, status, at) VALUES
('sample-contact', 'Sample Visitor', 'sample@example.org', NULL, 'general', 'Sample message.', 'open', '2026-09-14');

INSERT INTO guardian_consent (competitor_id, guardian_name, relation, consent_at, verified_by) VALUES
('sample-competitor', 'Sample Guardian', 'parent', '2026-09-14', NULL);

INSERT INTO audit_log (actor, action, entity, entity_id, at, meta_json) VALUES
('seed', 'seed.insert', 'announcement', 'sample-registration-open', '2026-09-14', '{}');

INSERT INTO email_outbox (to_addr, template, payload_json, status, attempts, sent_at) VALUES
('sample@example.org', 'payment-verified', '{}', 'sent', 1, '2026-09-14');

INSERT INTO record_snapshot (event, kind, value_centis, holder_wca_id, holder_name, comp_wca_id, export_date) VALUES
('333', 'single', 582, '2026SAMP01', 'Sample Holder', 'SampleComp2026', '2026-09-13');

INSERT INTO comp_champion (comp_wca_id, winner_wca_id, winning_value_centis, derived_at, override_winner_wca_id) VALUES
('SampleComp2026', '2026SAMP01', 742, '2026-09-14', NULL);
