-- ============================================
-- LinkedIn ContentOps — Migration 001
-- All tables + RLS + triggers + indices
-- ============================================

-- 0. Reusable updated_at trigger function
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. Workspaces
-- ============================================
CREATE TABLE public.workspaces (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_workspaces_updated_at
  BEFORE UPDATE ON public.workspaces
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 2. Workspace Members (junction table)
-- ============================================
CREATE TABLE public.workspace_members (
  workspace_id  uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role          text NOT NULL DEFAULT 'collaborator' CHECK (role IN ('admin', 'editor', 'collaborator')),
  joined_at     timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, user_id)
);

ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_workspace_members_user ON public.workspace_members(user_id);

-- RLS: users can see their own memberships
CREATE POLICY "members_own" ON public.workspace_members
  FOR ALL USING (user_id = auth.uid());

-- RLS: workspace admins can manage members
CREATE POLICY "members_admin_manage" ON public.workspace_members
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- RLS for workspaces: only members can see/edit
CREATE POLICY "workspace_member_access" ON public.workspaces
  FOR ALL USING (
    id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- 3. Research Reports
-- ============================================
CREATE TABLE public.research_reports (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  title         text NOT NULL,
  source        text,
  raw_text      text NOT NULL,
  tags_json     jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_by    uuid NOT NULL REFERENCES auth.users(id),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.research_reports ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_research_workspace ON public.research_reports(workspace_id);
CREATE INDEX idx_research_tags ON public.research_reports USING gin(tags_json);

CREATE TRIGGER trg_research_updated_at
  BEFORE UPDATE ON public.research_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE POLICY "research_workspace_isolation" ON public.research_reports
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
    )
  );

-- 4. Topics
-- ============================================
CREATE TABLE public.topics (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  title         text NOT NULL,
  hypothesis    text,
  evidence      text,
  anti_myth     text,
  signals_json  jsonb NOT NULL DEFAULT '[]'::jsonb,
  fit_score     smallint CHECK (fit_score BETWEEN 0 AND 10),
  priority      text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status        text NOT NULL DEFAULT 'backlog' CHECK (status IN ('backlog', 'selected', 'used', 'archived')),
  created_by    uuid NOT NULL REFERENCES auth.users(id),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_topics_workspace ON public.topics(workspace_id);
CREATE INDEX idx_topics_status ON public.topics(workspace_id, status);

CREATE TRIGGER trg_topics_updated_at
  BEFORE UPDATE ON public.topics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE POLICY "topics_workspace_isolation" ON public.topics
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
    )
  );

-- 5. Campaigns
-- ============================================
CREATE TABLE public.campaigns (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  topic_id        uuid REFERENCES public.topics(id) ON DELETE SET NULL,
  week_start      date NOT NULL,
  keyword         text,
  resource_json   jsonb NOT NULL DEFAULT '{}'::jsonb,
  audience_json   jsonb NOT NULL DEFAULT '{}'::jsonb,
  status          text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'ready', 'published', 'archived')),
  created_by      uuid NOT NULL REFERENCES auth.users(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_campaigns_workspace ON public.campaigns(workspace_id);
CREATE INDEX idx_campaigns_week ON public.campaigns(workspace_id, week_start);
CREATE INDEX idx_campaigns_topic ON public.campaigns(topic_id);

CREATE TRIGGER trg_campaigns_updated_at
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE POLICY "campaigns_workspace_isolation" ON public.campaigns
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
    )
  );

-- 6. Posts
-- ============================================
CREATE TABLE public.posts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id   uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  day_of_week   smallint NOT NULL CHECK (day_of_week BETWEEN 1 AND 5),
  funnel_stage  text NOT NULL CHECK (funnel_stage IN ('tofu_problem', 'mofu_problem', 'tofu_solution', 'mofu_solution', 'bofu_conversion')),
  objective     text,
  status        text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'approved', 'published')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_posts_campaign ON public.posts(campaign_id);
CREATE UNIQUE INDEX idx_posts_campaign_day ON public.posts(campaign_id, day_of_week);

CREATE TRIGGER trg_posts_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- RLS: access through campaign → workspace
CREATE POLICY "posts_workspace_isolation" ON public.posts
  FOR ALL USING (
    campaign_id IN (
      SELECT c.id FROM public.campaigns c
      JOIN public.workspace_members wm ON wm.workspace_id = c.workspace_id
      WHERE wm.user_id = auth.uid()
    )
  );

-- 7. Post Versions (copy variants)
-- ============================================
CREATE TABLE public.post_versions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  version     smallint NOT NULL DEFAULT 1,
  variant     text NOT NULL DEFAULT 'contrarian' CHECK (variant IN ('contrarian', 'story', 'data_driven')),
  content     text NOT NULL DEFAULT '',
  score_json  jsonb,
  notes       text,
  is_current  boolean NOT NULL DEFAULT false,
  created_by  uuid NOT NULL REFERENCES auth.users(id),
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.post_versions ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_post_versions_post ON public.post_versions(post_id);
CREATE INDEX idx_post_versions_current ON public.post_versions(post_id) WHERE is_current = true;

-- RLS: access through post → campaign → workspace
CREATE POLICY "post_versions_workspace_isolation" ON public.post_versions
  FOR ALL USING (
    post_id IN (
      SELECT p.id FROM public.posts p
      JOIN public.campaigns c ON c.id = p.campaign_id
      JOIN public.workspace_members wm ON wm.workspace_id = c.workspace_id
      WHERE wm.user_id = auth.uid()
    )
  );

-- 8. Visual Versions (JSON prompts for Nano Banana Pro)
-- ============================================
CREATE TABLE public.visual_versions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  version     smallint NOT NULL DEFAULT 1,
  format      text NOT NULL DEFAULT '1:1',
  prompt_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  qa_json     jsonb,
  image_url   text,
  status      text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_qa', 'approved', 'rejected')),
  created_by  uuid NOT NULL REFERENCES auth.users(id),
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.visual_versions ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_visual_versions_post ON public.visual_versions(post_id);

-- RLS: access through post → campaign → workspace
CREATE POLICY "visual_versions_workspace_isolation" ON public.visual_versions
  FOR ALL USING (
    post_id IN (
      SELECT p.id FROM public.posts p
      JOIN public.campaigns c ON c.id = p.campaign_id
      JOIN public.workspace_members wm ON wm.workspace_id = c.workspace_id
      WHERE wm.user_id = auth.uid()
    )
  );

-- 9. Assets (uploaded images/files)
-- ============================================
CREATE TABLE public.assets (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  type          text NOT NULL DEFAULT 'image' CHECK (type IN ('image', 'document', 'other')),
  url           text NOT NULL,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_assets_workspace ON public.assets(workspace_id);

CREATE POLICY "assets_workspace_isolation" ON public.assets
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
    )
  );

-- 10. Metrics (post performance)
-- ============================================
CREATE TABLE public.metrics (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  impressions integer NOT NULL DEFAULT 0,
  comments    integer NOT NULL DEFAULT 0,
  saves       integer NOT NULL DEFAULT 0,
  shares      integer NOT NULL DEFAULT 0,
  leads       integer NOT NULL DEFAULT 0,
  notes       text,
  captured_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.metrics ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX idx_metrics_post ON public.metrics(post_id);

-- RLS: access through post → campaign → workspace
CREATE POLICY "metrics_workspace_isolation" ON public.metrics
  FOR ALL USING (
    post_id IN (
      SELECT p.id FROM public.posts p
      JOIN public.campaigns c ON c.id = p.campaign_id
      JOIN public.workspace_members wm ON wm.workspace_id = c.workspace_id
      WHERE wm.user_id = auth.uid()
    )
  );

-- 11. Learnings (weekly campaign insights)
-- ============================================
CREATE TABLE public.learnings (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id   uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  summary       text NOT NULL,
  bullets_json  jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_by    uuid NOT NULL REFERENCES auth.users(id),
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.learnings ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_learnings_campaign ON public.learnings(campaign_id);

-- RLS: access through campaign → workspace
CREATE POLICY "learnings_workspace_isolation" ON public.learnings
  FOR ALL USING (
    campaign_id IN (
      SELECT c.id FROM public.campaigns c
      JOIN public.workspace_members wm ON wm.workspace_id = c.workspace_id
      WHERE wm.user_id = auth.uid()
    )
  );
