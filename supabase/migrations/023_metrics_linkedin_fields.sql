-- Add LinkedIn-specific metrics fields and demographics
ALTER TABLE metrics
  ADD COLUMN IF NOT EXISTS reactions integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS members_reached integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS followers_gained integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS profile_views integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sends integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS post_url text,
  ADD COLUMN IF NOT EXISTS publish_date text,
  ADD COLUMN IF NOT EXISTS highlights_json jsonb,
  ADD COLUMN IF NOT EXISTS demographics_json jsonb;
