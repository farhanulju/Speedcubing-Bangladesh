-- scripts/seed.sql — PII-free local/dev samples (WP-10). Reversible: re-apply migrations fresh.
-- NEVER production data. Placeholders are purged in WP-51 before launch.

INSERT INTO announcement (slug, title, date, comp_wca_id, body_json, pinned, status, updated_by, updated_at) VALUES
('sample-registration-open', 'Sample: registration opens Friday 8 PM', '2026-09-14', NULL, '{"blocks":[{"type":"paragraph","data":{"text":"Sample announcement body."}}]}', 1, 'published', 'seed', '2026-09-14'),
('sample-venue-map', 'Sample: venue map and reporting time', '2026-09-10', 'DhakaSpringOpen2026', '{"blocks":[{"type":"paragraph","data":{"text":"Sample venue note. Report 30 minutes early."}}]}', 0, 'published', 'seed', '2026-09-10');

INSERT INTO page (slug, title, body_json, status, updated_by, updated_at) VALUES
('about', 'Sample story', '{"blocks":[{"type":"header","data":{"text":"Sample","level":2}}]}', 'published', 'seed', '2026-09-14'),
('contact-info', 'How to reach us', '{"blocks":[{"type":"paragraph","data":{"text":"Sample contact side copy."}}]}', 'published', 'seed', '2026-09-14'),
('sponsors-pitch', 'Why partner with us', '{"blocks":[{"type":"paragraph","data":{"text":"Sample pitch."}}]}', 'published', 'seed', '2026-09-14'),
 ('worlds-story', 'Road to Worlds', '{"blocks":[{"type":"paragraph","data":{"text":"Sample story."}}]}', 'published', 'seed', '2026-09-14'),
 ('worlds-criteria', 'Criteria and refunds', '{"blocks":[{"type":"paragraph","data":{"text":"Sample criteria."}}]}', 'published', 'seed', '2026-09-14'),
 ('privacy', 'Privacy notice', '{"blocks":[{"type":"paragraph","data":{"text":"Sample privacy notice."}}]}', 'published', 'seed', '2026-09-14');

INSERT INTO person (id, name, photo_r2, photo_consent, role, wca_id, focus_area, member_since, links_json, status, updated_by, updated_at) VALUES
('sample-delegate', 'Sample Delegate', NULL, 0, 'WCA Delegate', NULL, 'Dhaka', '2024-01', '{}', 'published', 'seed', '2026-09-14'),
('sample-exec', 'Sample Executive', NULL, 0, 'Head of Competitions', NULL, 'Dhaka', '2025-06', '{}', 'published', 'seed', '2026-09-14'),
('sample-media', 'Sample Media Lead', NULL, 0, 'Head of Media', NULL, 'Chittagong', '2025-01', '{}', 'published', 'seed', '2026-09-14'),
('sample-outreach', 'Sample Outreach', NULL, 0, 'School Outreach Coordinator', NULL, 'Sylhet', '2025-09', '{}', 'published', 'seed', '2026-09-14');

INSERT INTO sponsor (id, name, logo_r2, tier, url, sort_order, status, updated_by, updated_at) VALUES
('sample-sponsor', 'Sample Sponsor Ltd', NULL, 'gold', 'https://example.org', 0, 'published', 'seed', '2026-09-14'),
('sample-silver', 'Sample Foods BD', NULL, 'silver', 'https://example.org', 1, 'published', 'seed', '2026-09-14'),
('sample-community', 'Sample Cube Shop', NULL, 'community', 'https://example.org', 2, 'published', 'seed', '2026-09-14');

INSERT INTO faq (id, q, a_json, sort_order, status, updated_by, updated_at) VALUES
('sample-faq-1', 'Sample: do I need to be fast?', '{"blocks":[{"type":"paragraph","data":{"text":"No — sample answer."}}]}', 0, 'published', 'seed', '2026-09-14'),
('sample-faq-2', 'Sample: do I need my own cube?', '{"blocks":[{"type":"paragraph","data":{"text":"Yes — bring your own cube and mark it so you recognise it."}}]}', 1, 'published', 'seed', '2026-09-14'),
('sample-faq-3', 'Sample: when do I get a WCA ID?', '{"blocks":[{"type":"paragraph","data":{"text":"After your first competition — it appears on your WCA profile."}}]}', 2, 'published', 'seed', '2026-09-14'),
('sample-faq-4', 'Sample: can spectators watch for free?', '{"blocks":[{"type":"paragraph","data":{"text":"Yes — spectators are free at our competitions."}}]}', 3, 'published', 'seed', '2026-09-14');

INSERT INTO news (slug, title, published_at, body_json, cover_r2, status, updated_by, updated_at) VALUES
('sample-recap', 'Sample competition recap', '2026-09-01', '{"blocks":[{"type":"paragraph","data":{"text":"Sample recap."}}]}', NULL, 'published', 'seed', '2026-09-14'),
('sample-nr-alert', 'Sample: new national record in 3x3', '2026-09-05', '{"blocks":[{"type":"paragraph","data":{"text":"Sample record post."}}]}', NULL, 'published', 'seed', '2026-09-05'),
('sample-welcome', 'Sample: welcome to the new site', '2026-08-20', '{"blocks":[{"type":"paragraph","data":{"text":"Sample welcome post."}}]}', NULL, 'published', 'seed', '2026-08-20');

INSERT INTO comp_override (wca_id, payment_steps_json, venue_note, fee_tiers_json, updated_by, updated_at) VALUES
('SampleComp2026', '{"blocks":[]}', 'Sample venue note', '{"early":800,"regular":1000}', 'seed', '2026-09-14'),
 ('DhakaSpringOpen2026', '{"blocks":[{"type":"paragraph","data":{"text":"Pay early, keep your SMS."}}]}', 'Sample venue note', '{"early":800,"regular":1000,"bkash_wallet":"+8801000000000","nagad_wallet":"+8801000000001"}', 'seed', '2026-09-14'),
 ('ChittagongCubeOpen2026', '{"blocks":[{"type":"paragraph","data":{"text":"Sample payment steps for Chittagong."}}]}', 'Sample Chittagong venue note', '{"early":850,"regular":1050,"bkash_wallet":"+8801000000004","nagad_wallet":"+8801000000005"}', 'seed', '2026-09-14');

INSERT INTO donation_page (id, target_bdt, raised_manual_bdt, policy_json, worlds_host_city, bkash_wallet, nagad_wallet, updated_by, updated_at) VALUES
(1, 500000, 185000, '{"blocks":[]}', 'Sweden', '+8801000000002', '+8801000000003', 'seed', '2026-09-14');

INSERT INTO donor (id, name, amount_bdt, consent, sort_order, updated_by, updated_at) VALUES
('sample-donor', 'Sample Family', 25000, 1, 0, 'seed', '2026-09-14'),
('sample-donor-2', 'Sample Patron', 10000, 1, 1, 'seed', '2026-09-14'),
('sample-donor-3', 'Anonymous', NULL, 1, 2, 'seed', '2026-09-14');

INSERT INTO competitor (id, wca_id, wca_oauth_sub, name, email, created_at) VALUES
('sample-competitor', '2026SAMP01', 'oauth-sub-sample', 'Sample Competitor', 'sample@example.org', '2026-09-14');

INSERT INTO registration (id, competitor_id, comp_wca_id, events_json, status, wca_accepted, created_at) VALUES
('sample-registration', 'sample-competitor', 'SampleComp2026', '["333","222"]', 'pending', 0, '2026-09-14'),
('sample-registration-2', 'sample-competitor', 'DhakaSpringOpen2026', '["333"]', 'pending', 0, '2026-09-14'),
('sample-registration-3', 'sample-competitor', 'SampleComp2026', '["333","pyram"]', 'verified', 1, '2026-09-13');

INSERT INTO tx_submission (id, registration_id, sender_number, txn_id, amount_bdt, status, created_at) VALUES
('sample-tx', 'sample-registration', '+8801000000000', 'TESTTXID1', 800, 'pending', '2026-09-14');

-- Decided examples (as decideTx would write them): one accepted + verified reg,
-- one rejected. SampleComp2026 is seed-only so queue/demo stays clear of real comps.
INSERT INTO tx_submission (id, registration_id, sender_number, txn_id, amount_bdt, status, decided_by, decided_at, note, created_at) VALUES
('sample-tx-2', 'sample-registration-3', '+8801000000005', 'TESTTXID2', 1000, 'accepted', 'seed', '2026-09-13', 'Sample statement line 3', '2026-09-13'),
('sample-tx-3', 'sample-registration-2', '+8801000000006', 'TESTTXID3', 700, 'rejected', 'seed', '2026-09-14', 'Sample amount mismatch', '2026-09-14');

INSERT INTO lost_found (id, comp_wca_id, item, photo_r2, status, reporter_contact, created_at) VALUES
('sample-lf', 'SampleComp2026', 'Sample 3x3 cube', NULL, 'open', 'sample@example.org', '2026-09-14'),
('sample-lf-2', 'SampleComp2026', 'Sample timer display', NULL, 'in_progress', 'sample@example.org', '2026-09-13'),
('sample-lf-3', 'SampleComp2026', 'Sample 2x2 cube', NULL, 'returned', 'sample@example.org', '2026-09-12');

INSERT INTO opt_in (id, channel, handle, consent_at) VALUES
('sample-optin', 'email', 'sample@example.org', '2026-09-14');

INSERT INTO contact_message (id, name, email, wca_id, category, body, status, at) VALUES
('sample-contact', 'Sample Visitor', 'sample@example.org', NULL, 'general', 'Sample message.', 'open', '2026-09-14'),
('sample-contact-2', 'Sample Parent', 'sample@example.org', NULL, 'competition', 'Sample follow-up message.', 'closed', '2026-09-13');

INSERT INTO guardian_consent (competitor_id, guardian_name, relation, consent_at, verified_by) VALUES
('sample-competitor', 'Sample Guardian', 'parent', '2026-09-14', NULL);

INSERT INTO audit_log (actor, action, entity, entity_id, at, meta_json) VALUES
('seed', 'seed.insert', 'announcement', 'sample-registration-open', '2026-09-14', '{}'),
('seed', 'tx-accepted', 'tx_submission', 'sample-tx-2', '2026-09-13', '{}'),
('seed', 'tx-rejected', 'tx_submission', 'sample-tx-3', '2026-09-14', '{}'),
('seed', 'wca-accepted', 'registration', 'sample-registration-3', '2026-09-13', '{}'),
('seed', 'lostfound-in_progress', 'lost_found', 'sample-lf-2', '2026-09-13', '{}'),
('seed', 'contact-closed', 'contact_message', 'sample-contact-2', '2026-09-13', '{}');

INSERT INTO email_outbox (to_addr, template, payload_json, status, attempts, sent_at) VALUES
('sample@example.org', 'payment-verified', '{}', 'sent', 1, '2026-09-14'),
('sample@example.org', 'payment-rejected', '{}', 'queued', 0, NULL);

INSERT INTO record_snapshot (event, kind, value_centis, holder_wca_id, holder_name, comp_wca_id, export_date) VALUES
('333', 'single', 582, '2026SAMP01', 'Sample Holder', 'SampleComp2026', '2026-09-13');

INSERT INTO comp_champion (comp_wca_id, winner_wca_id, winning_value_centis, derived_at, override_winner_wca_id) VALUES
('SampleComp2026', '2026SAMP01', 742, '2026-09-14', NULL);
