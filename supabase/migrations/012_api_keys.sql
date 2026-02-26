-- 012_api_keys.sql
-- BYOK (Bring Your Own Keys): Per-workspace API key storage
-- Keys are encrypted in the application layer (AES-256-GCM), not in Postgres

CREATE TABLE public.api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('google', 'openai', 'openrouter')),
  encrypted_key text NOT NULL,
  key_hint text NOT NULL DEFAULT '',
  is_valid boolean DEFAULT true,
  last_used_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(workspace_id, provider)
);

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Only workspace admins can manage API keys
CREATE POLICY "workspace_admin_select_api_keys" ON public.api_keys
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "workspace_admin_insert_api_keys" ON public.api_keys
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "workspace_admin_update_api_keys" ON public.api_keys
  FOR UPDATE USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "workspace_admin_delete_api_keys" ON public.api_keys
  FOR DELETE USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE TRIGGER update_api_keys_updated_at
  BEFORE UPDATE ON public.api_keys
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
