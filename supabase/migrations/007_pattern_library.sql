-- Phase 12: Pattern Library
-- Stores reusable content patterns (hooks, CTAs, visual formats, topic angles, content structures)
-- with performance metrics for AI retrieval.

CREATE TABLE pattern_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  pattern_type text NOT NULL CHECK (pattern_type IN ('hook', 'cta', 'visual_format', 'topic_angle', 'content_structure')),
  content text NOT NULL,
  context jsonb DEFAULT '{}'::jsonb,
  performance jsonb DEFAULT '{}'::jsonb,
  source_post_version_id uuid REFERENCES post_versions(id),
  source_campaign_id uuid REFERENCES campaigns(id),
  tags jsonb DEFAULT '[]'::jsonb,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE pattern_library ENABLE ROW LEVEL SECURITY;

-- RLS: users can only access patterns in their workspace
CREATE POLICY pattern_library_workspace ON pattern_library
  FOR ALL
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  ));

-- Indexes for common queries
CREATE INDEX idx_pattern_library_workspace ON pattern_library(workspace_id);
CREATE INDEX idx_pattern_library_type ON pattern_library(workspace_id, pattern_type);
