-- Phase: Carousel Support
-- Adds carousel_slides table for multi-slide visual versions.
-- Each slide has its own prompt, image, headline, and body text.
-- visual_versions.slide_count tracks how many slides a carousel has (NULL for single images).

-- 1. Add slide_count to visual_versions (NULL = single image, 2-10 = carousel)
ALTER TABLE public.visual_versions
  ADD COLUMN IF NOT EXISTS slide_count smallint;

-- 2. Create carousel_slides table
CREATE TABLE IF NOT EXISTS public.carousel_slides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visual_version_id uuid NOT NULL REFERENCES public.visual_versions(id) ON DELETE CASCADE,
  slide_index smallint NOT NULL CHECK (slide_index >= 0 AND slide_index <= 9),
  prompt_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  image_url text,
  headline text,
  body_text text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (visual_version_id, slide_index)
);

ALTER TABLE public.carousel_slides ENABLE ROW LEVEL SECURITY;

-- RLS: access via visual_version → post → campaign → workspace
CREATE POLICY carousel_slides_workspace_isolation ON public.carousel_slides
  FOR ALL USING (
    visual_version_id IN (
      SELECT vv.id FROM public.visual_versions vv
      JOIN public.posts p ON vv.post_id = p.id
      JOIN public.campaigns c ON p.campaign_id = c.id
      JOIN public.workspace_members wm ON wm.workspace_id = c.workspace_id
      WHERE wm.user_id = auth.uid()
    )
  );

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_carousel_slides_version ON public.carousel_slides(visual_version_id);
CREATE INDEX IF NOT EXISTS idx_carousel_slides_order ON public.carousel_slides(visual_version_id, slide_index);

-- 4. Update visual_concepts concept_type CHECK to be more explicit about carousel
-- (carousel_4x5 already exists in the CHECK, no change needed)
