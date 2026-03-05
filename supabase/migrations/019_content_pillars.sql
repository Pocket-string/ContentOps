-- Phase: Content Pillars
-- Categorizes topics into thematic pillars for strategic content planning.

-- 1. Create content_pillars table
CREATE TABLE public.content_pillars (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name          text NOT NULL,
  description   text,
  color         text NOT NULL DEFAULT '#6B7280',
  sort_order    smallint NOT NULL DEFAULT 0,
  is_active     boolean NOT NULL DEFAULT true,
  created_by    uuid NOT NULL REFERENCES auth.users(id),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- 2. RLS (same migration as table creation — auto-blindaje rule)
ALTER TABLE public.content_pillars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "content_pillars_workspace_isolation" ON public.content_pillars
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
    )
  );

-- 3. Indexes
CREATE INDEX idx_content_pillars_workspace ON public.content_pillars(workspace_id);
CREATE UNIQUE INDEX idx_content_pillars_name ON public.content_pillars(workspace_id, name);

-- 4. Trigger updated_at (reuses existing function)
CREATE TRIGGER trg_content_pillars_updated_at
  BEFORE UPDATE ON public.content_pillars
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 5. Add pillar_id FK to topics
ALTER TABLE public.topics
  ADD COLUMN pillar_id uuid REFERENCES public.content_pillars(id) ON DELETE SET NULL;

CREATE INDEX idx_topics_pillar ON public.topics(pillar_id);

-- 6. Add pillar_id FK to campaigns
ALTER TABLE public.campaigns
  ADD COLUMN pillar_id uuid REFERENCES public.content_pillars(id) ON DELETE SET NULL;

CREATE INDEX idx_campaigns_pillar ON public.campaigns(pillar_id);
