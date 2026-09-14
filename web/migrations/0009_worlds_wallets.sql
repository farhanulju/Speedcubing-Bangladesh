-- 0009_worlds_wallets.sql — receiving wallets for Worlds donations (WP-23).
-- Rendered in full with copy button: payment destinations must be shareable
-- to function (spam risk accepted, minuted in DECISION_REGISTER content rules).
-- Comp wallets live in comp_override.fee_tiers_json under bkash_wallet/nagad_wallet.
ALTER TABLE donation_page ADD COLUMN bkash_wallet TEXT;
ALTER TABLE donation_page ADD COLUMN nagad_wallet TEXT;
