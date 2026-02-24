-- Phase 9: Iteraciones Nano Banana Pro
-- Adds metadata columns for tracking NanoBanana design tool iterations
-- on visual_versions.

ALTER TABLE visual_versions
  ADD COLUMN IF NOT EXISTS nanobanana_run_id  text,
  ADD COLUMN IF NOT EXISTS output_asset_id    uuid REFERENCES assets(id),
  ADD COLUMN IF NOT EXISTS qa_notes           text,
  ADD COLUMN IF NOT EXISTS iteration_reason   text;

COMMENT ON COLUMN visual_versions.nanobanana_run_id  IS 'Run ID from the Nano Banana Pro design tool';
COMMENT ON COLUMN visual_versions.output_asset_id    IS 'FK to the asset produced by this NB run';
COMMENT ON COLUMN visual_versions.qa_notes           IS 'QA observations written by the designer';
COMMENT ON COLUMN visual_versions.iteration_reason   IS 'Why this iteration was requested (preset or free text)';
