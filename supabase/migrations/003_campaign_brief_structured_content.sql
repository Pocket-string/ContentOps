-- Phase 3: Campaign Weekly Brief
ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS weekly_brief jsonb,
  ADD COLUMN IF NOT EXISTS publishing_plan jsonb;

-- Phase 4: Structured Content for post versions
ALTER TABLE post_versions
  ADD COLUMN IF NOT EXISTS structured_content jsonb;
