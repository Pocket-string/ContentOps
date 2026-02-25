-- ============================================
-- Orchestrator Memory System
-- ============================================

-- Chat sessions (persist conversations)
CREATE TABLE orchestrator_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text,
  messages_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  page_context jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Action log (what the orchestrator did)
CREATE TABLE orchestrator_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES orchestrator_sessions(id) ON DELETE SET NULL,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  agent_type text NOT NULL,
  action_name text NOT NULL,
  input_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  output_data jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
  error_message text,
  executed_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Learning events (feedback + outcomes for continuous improvement)
CREATE TABLE orchestrator_learnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  action_id uuid REFERENCES orchestrator_actions(id) ON DELETE SET NULL,
  agent_type text NOT NULL,
  feedback_type text NOT NULL CHECK (feedback_type IN ('positive', 'negative', 'refinement')),
  feedback_text text,
  context_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS (SAME migration as table creation per CLAUDE.md rules)
ALTER TABLE orchestrator_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE orchestrator_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE orchestrator_learnings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own sessions"
  ON orchestrator_sessions FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own actions"
  ON orchestrator_actions FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own learnings"
  ON orchestrator_learnings FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- Indexes
CREATE INDEX idx_orchestrator_sessions_workspace ON orchestrator_sessions(workspace_id);
CREATE INDEX idx_orchestrator_sessions_user ON orchestrator_sessions(user_id);
CREATE INDEX idx_orchestrator_actions_session ON orchestrator_actions(session_id);
CREATE INDEX idx_orchestrator_actions_workspace ON orchestrator_actions(workspace_id);
CREATE INDEX idx_orchestrator_learnings_workspace ON orchestrator_learnings(workspace_id);
CREATE INDEX idx_orchestrator_learnings_agent ON orchestrator_learnings(agent_type);

-- Updated_at triggers
CREATE TRIGGER update_orchestrator_sessions_updated_at
  BEFORE UPDATE ON orchestrator_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
