-- 013_admin_functions.sql
-- Admin panel: SECURITY DEFINER functions for workspace member management

-- Function: list workspace members with email from auth.users
CREATE OR REPLACE FUNCTION public.get_workspace_members_with_email(p_workspace_id uuid)
RETURNS TABLE (
  user_id uuid,
  email text,
  role text,
  joined_at timestamptz,
  last_sign_in_at timestamptz,
  has_api_keys boolean
) SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Verify caller is admin of this workspace
  IF NOT EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_id = p_workspace_id
      AND user_id = auth.uid()
      AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;

  RETURN QUERY
  SELECT
    wm.user_id,
    au.email::text,
    wm.role,
    wm.joined_at,
    au.last_sign_in_at,
    EXISTS (
      SELECT 1 FROM api_keys ak
      WHERE ak.workspace_id = p_workspace_id
      AND ak.is_valid = true
    ) AS has_api_keys
  FROM workspace_members wm
  JOIN auth.users au ON au.id = wm.user_id
  WHERE wm.workspace_id = p_workspace_id
  ORDER BY wm.joined_at ASC;
END;
$$;

-- Function: update a member's role (admin only)
CREATE OR REPLACE FUNCTION public.update_member_role(
  p_workspace_id uuid,
  p_user_id uuid,
  p_new_role text
)
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  IF p_new_role NOT IN ('admin', 'editor', 'collaborator') THEN
    RAISE EXCEPTION 'Invalid role: %', p_new_role;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_id = p_workspace_id
      AND user_id = auth.uid()
      AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;

  IF p_new_role != 'admin' AND p_user_id = auth.uid() THEN
    IF (SELECT COUNT(*) FROM workspace_members WHERE workspace_id = p_workspace_id AND role = 'admin') <= 1 THEN
      RAISE EXCEPTION 'Cannot remove last admin from workspace';
    END IF;
  END IF;

  UPDATE workspace_members
  SET role = p_new_role
  WHERE workspace_id = p_workspace_id AND user_id = p_user_id;
END;
$$;
