-- Fix critic_reviews for visual critics:
-- The post_version_id column had a FK to post_versions, but visual critics
-- store a visual_version_id there, causing FK + RLS violations.
-- Solution: add a dedicated visual_version_id column, make post_version_id nullable,
-- and update RLS to handle both paths.

-- 1. Add visual_version_id column
ALTER TABLE public.critic_reviews
  ADD COLUMN IF NOT EXISTS visual_version_id uuid REFERENCES public.visual_versions(id) ON DELETE CASCADE;

-- 2. Make post_version_id nullable (visual critics don't have a post_version)
ALTER TABLE public.critic_reviews
  ALTER COLUMN post_version_id DROP NOT NULL;

-- 3. Add check constraint: exactly one FK must be set
ALTER TABLE public.critic_reviews
  ADD CONSTRAINT critic_reviews_one_fk_check
  CHECK (
    (post_version_id IS NOT NULL AND visual_version_id IS NULL)
    OR (post_version_id IS NULL AND visual_version_id IS NOT NULL)
  );

-- 4. Drop old RLS policy and create new one that handles both paths
DROP POLICY IF EXISTS critic_reviews_workspace_isolation ON public.critic_reviews;

CREATE POLICY critic_reviews_workspace_isolation ON public.critic_reviews
  FOR ALL USING (
    -- Path 1: Copy critics via post_versions
    (post_version_id IS NOT NULL AND post_version_id IN (
      SELECT pv.id FROM public.post_versions pv
      JOIN public.posts p ON pv.post_id = p.id
      JOIN public.campaigns c ON p.campaign_id = c.id
      JOIN public.workspace_members wm ON wm.workspace_id = c.workspace_id
      WHERE wm.user_id = auth.uid()
    ))
    OR
    -- Path 2: Visual critics via visual_versions
    (visual_version_id IS NOT NULL AND visual_version_id IN (
      SELECT vv.id FROM public.visual_versions vv
      JOIN public.posts p ON vv.post_id = p.id
      JOIN public.campaigns c ON p.campaign_id = c.id
      JOIN public.workspace_members wm ON wm.workspace_id = c.workspace_id
      WHERE wm.user_id = auth.uid()
    ))
  );

-- 5. Index for visual_version_id lookups
CREATE INDEX IF NOT EXISTS idx_critic_reviews_visual_version ON public.critic_reviews(visual_version_id);
