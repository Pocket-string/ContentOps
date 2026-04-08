-- ============================================================
-- PRP-011: Visual System Upgrade
-- ============================================================

-- 1. visual_versions: tipo, preset, modo de generacion
ALTER TABLE visual_versions
  ADD COLUMN IF NOT EXISTS visual_type TEXT CHECK (visual_type IN ('infographic','carousel')),
  ADD COLUMN IF NOT EXISTS aesthetic_preset TEXT,
  ADD COLUMN IF NOT EXISTS generation_mode TEXT CHECK (generation_mode IN ('single_image','storyboard_slides'));

-- 2. carousel_slides: enriquecer slides con role y status
ALTER TABLE carousel_slides
  ADD COLUMN IF NOT EXISTS subtitle TEXT,
  ADD COLUMN IF NOT EXISTS slide_role TEXT CHECK (slide_role IN ('cover','context','deep_dive','evidence','method','cta_close')),
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft' CHECK (status IN ('draft','pending_qa','approved','rejected'));
