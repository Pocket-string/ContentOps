-- 018: Add author_signature to brand_profiles
-- Allows customization of the author signature text used in visual prompts.

ALTER TABLE brand_profiles
  ADD COLUMN IF NOT EXISTS author_signature text NOT NULL DEFAULT 'Jonathan Navarrete — Bitalize';
