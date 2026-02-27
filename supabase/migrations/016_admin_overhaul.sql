-- 016_admin_overhaul.sql
-- Global platform admin system: adds is_platform_admin flag,
-- replaces workspace-scoped admin check with platform-wide role.

-- 1. Add platform admin flag to workspace_members
ALTER TABLE public.workspace_members
  ADD COLUMN IF NOT EXISTS is_platform_admin boolean NOT NULL DEFAULT false;

-- 2. Promote existing workspace admins to platform admins
UPDATE public.workspace_members
SET is_platform_admin = true
WHERE role = 'admin';

-- 3. Function: list ALL platform users (admin panel)
--    SECURITY DEFINER runs as postgres to access auth.users.
--    Caller must be a platform admin.
CREATE OR REPLACE FUNCTION public.get_all_platform_users(p_caller_id uuid)
RETURNS TABLE (
  user_id          uuid,
  email            text,
  workspace_name   text,
  role             text,
  joined_at        timestamptz,
  last_sign_in_at  timestamptz,
  has_api_keys     boolean,
  is_platform_admin boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify caller is a platform admin
  IF NOT EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_members.user_id = p_caller_id
      AND workspace_members.is_platform_admin = true
  ) THEN
    RAISE EXCEPTION 'Unauthorized: caller is not a platform admin';
  END IF;

  RETURN QUERY
  SELECT
    wm.user_id,
    au.email::text,
    w.name::text                AS workspace_name,
    wm.role::text,
    wm.joined_at,
    au.last_sign_in_at,
    EXISTS (
      SELECT 1 FROM api_keys ak
      WHERE ak.workspace_id = wm.workspace_id
        AND ak.is_valid = true
    )                           AS has_api_keys,
    wm.is_platform_admin
  FROM workspace_members wm
  JOIN auth.users   au ON au.id = wm.user_id
  JOIN workspaces   w  ON w.id  = wm.workspace_id
  ORDER BY wm.joined_at DESC;
END;
$$;

-- 4. Function: toggle platform admin status for a target user
CREATE OR REPLACE FUNCTION public.toggle_platform_admin(
  p_caller_id      uuid,
  p_target_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify caller is a platform admin
  IF NOT EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_members.user_id = p_caller_id
      AND workspace_members.is_platform_admin = true
  ) THEN
    RAISE EXCEPTION 'Unauthorized: caller is not a platform admin';
  END IF;

  -- Prevent removing the last platform admin
  IF (
    SELECT COUNT(*) FROM workspace_members WHERE is_platform_admin = true
  ) <= 1
  AND EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_members.user_id       = p_target_user_id
      AND workspace_members.is_platform_admin = true
  ) THEN
    RAISE EXCEPTION 'Cannot remove the last platform admin';
  END IF;

  UPDATE workspace_members
  SET is_platform_admin = NOT is_platform_admin
  WHERE workspace_members.user_id = p_target_user_id;
END;
$$;
