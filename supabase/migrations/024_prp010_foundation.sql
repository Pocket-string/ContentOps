-- ============================================================
-- PRP-010 Foundation: Research enrichment, prompt versioning,
-- golden templates, performance analytics
-- ============================================================

-- 1. Research enrichment columns
ALTER TABLE research_reports
  ADD COLUMN IF NOT EXISTS source_quality_json JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS narrative_angles_json JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS conversion_resources_json JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS topic_deepening_json JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS research_depth_score SMALLINT CHECK (research_depth_score >= 0 AND research_depth_score <= 100),
  ADD COLUMN IF NOT EXISTS campaign_readiness_score SMALLINT CHECK (campaign_readiness_score >= 0 AND campaign_readiness_score <= 100);

-- 2. Metrics enrichment
ALTER TABLE metrics
  ADD COLUMN IF NOT EXISTS weighted_engagement_rate NUMERIC,
  ADD COLUMN IF NOT EXISTS performance_label TEXT CHECK (performance_label IN ('top_performer','average','underperformer'));

-- 3. Pattern library enrichment
ALTER TABLE pattern_library
  ADD COLUMN IF NOT EXISTS recipe_step TEXT,
  ADD COLUMN IF NOT EXISTS effectiveness_score NUMERIC,
  ADD COLUMN IF NOT EXISTS extracted_by TEXT DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS source_post_content TEXT;

-- 4. Prompt versioning
CREATE TABLE IF NOT EXISTS prompt_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  prompt_type TEXT NOT NULL CHECK (prompt_type IN ('copy_system','research_system','topic_deepening_system','critic_system')),
  version INTEGER NOT NULL,
  content TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  performance_score NUMERIC,
  posts_generated INTEGER DEFAULT 0,
  parent_version_id UUID REFERENCES prompt_versions(id),
  hypothesis TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE prompt_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "prompt_versions_workspace_isolation" ON prompt_versions
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- Unique constraint: only one active prompt per workspace+type
CREATE UNIQUE INDEX idx_prompt_versions_active
  ON prompt_versions (workspace_id, prompt_type)
  WHERE is_active = true;

-- 5. Prompt optimization log
CREATE TABLE IF NOT EXISTS prompt_optimization_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  prompt_version_id UUID NOT NULL REFERENCES prompt_versions(id) ON DELETE CASCADE,
  iteration INTEGER NOT NULL,
  hypothesis TEXT,
  change_description TEXT,
  eval_results JSONB NOT NULL DEFAULT '{}'::jsonb,
  score NUMERIC,
  previous_score NUMERIC,
  status TEXT NOT NULL CHECK (status IN ('baseline','keep','discard','rollback')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE prompt_optimization_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "prompt_optimization_log_workspace_isolation" ON prompt_optimization_log
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- 6. Post-to-prompt junction
CREATE TABLE IF NOT EXISTS post_prompt_version (
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  prompt_version_id UUID NOT NULL REFERENCES prompt_versions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (post_id, prompt_version_id)
);

ALTER TABLE post_prompt_version ENABLE ROW LEVEL SECURITY;

CREATE POLICY "post_prompt_version_workspace_isolation" ON post_prompt_version
  FOR ALL USING (
    post_id IN (
      SELECT p.id FROM posts p
      JOIN campaigns c ON p.campaign_id = c.id
      JOIN workspace_members wm ON c.workspace_id = wm.workspace_id
      WHERE wm.user_id = auth.uid()
    )
  );

-- 7. Golden templates
CREATE TABLE IF NOT EXISTS golden_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('alcance','nutricion','conversion')),
  template_content TEXT NOT NULL,
  metrics_snapshot JSONB DEFAULT '{}'::jsonb,
  recipe_analysis JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE golden_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "golden_templates_workspace_isolation" ON golden_templates
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- 8. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_prompt_versions_workspace_type ON prompt_versions (workspace_id, prompt_type);
CREATE INDEX IF NOT EXISTS idx_prompt_optimization_log_version ON prompt_optimization_log (prompt_version_id);
CREATE INDEX IF NOT EXISTS idx_golden_templates_workspace_type ON golden_templates (workspace_id, content_type) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_metrics_performance_label ON metrics (performance_label) WHERE performance_label IS NOT NULL;
