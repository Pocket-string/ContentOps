-- Phase 5: CopyCritic Agent
-- Update post status to include needs_human_review
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_status_check;
ALTER TABLE posts ADD CONSTRAINT posts_status_check
  CHECK (status IN ('draft', 'review', 'needs_human_review', 'approved', 'published'));

-- Critic reviews table (for both copy and visual critics)
CREATE TABLE IF NOT EXISTS public.critic_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_version_id uuid NOT NULL REFERENCES public.post_versions(id) ON DELETE CASCADE,
  critic_type text NOT NULL CHECK (critic_type IN ('copy', 'visual')),
  score_json jsonb,
  findings jsonb DEFAULT '[]'::jsonb,
  suggestions jsonb DEFAULT '[]'::jsonb,
  verdict text CHECK (verdict IN ('pass', 'needs_work', 'rewrite')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.critic_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY critic_reviews_workspace_isolation ON public.critic_reviews
  FOR ALL USING (
    post_version_id IN (
      SELECT pv.id FROM public.post_versions pv
      JOIN public.posts p ON pv.post_id = p.id
      JOIN public.campaigns c ON p.campaign_id = c.id
      JOIN public.workspace_members wm ON wm.workspace_id = c.workspace_id
      WHERE wm.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_critic_reviews_version ON public.critic_reviews(post_version_id);

-- Phase 6: Visual Concepts
CREATE TABLE IF NOT EXISTS public.visual_concepts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  concept_type text NOT NULL CHECK (concept_type IN (
    'infographic_1x1', 'carousel_4x5', 'humanized_photo', 'data_chart', 'custom'
  )),
  rationale text NOT NULL,
  layout text,
  text_budget text,
  data_evidence text,
  risk_notes text,
  selected boolean DEFAULT false,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.visual_concepts ENABLE ROW LEVEL SECURITY;

CREATE POLICY visual_concepts_workspace_isolation ON public.visual_concepts
  FOR ALL USING (
    post_id IN (
      SELECT p.id FROM public.posts p
      JOIN public.campaigns c ON p.campaign_id = c.id
      JOIN public.workspace_members wm ON wm.workspace_id = c.workspace_id
      WHERE wm.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_visual_concepts_post ON public.visual_concepts(post_id);

-- Add concept_type to visual_versions
ALTER TABLE public.visual_versions ADD COLUMN IF NOT EXISTS concept_type text;
