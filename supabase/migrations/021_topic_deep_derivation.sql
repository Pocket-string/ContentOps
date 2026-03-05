-- Migration 021: Deep Topic Derivation — enrich topics for campaign self-sufficiency
-- Adds fields that allow a Topic to carry enough context for a full weekly campaign

ALTER TABLE topics
  ADD COLUMN source_context text,
  ADD COLUMN content_angles jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN key_data_points jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN target_audience text,
  ADD COLUMN market_context text;
