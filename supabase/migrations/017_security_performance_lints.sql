-- 017_security_performance_lints.sql
-- Fixes Supabase linter warnings: mutable search_path, auth_rls_initplan,
-- multiple permissive policies, and overly permissive INSERT policy.

-- ============================================================
-- PART 1: Fix 4 functions — add SET search_path = public
-- ============================================================

-- 1a. update_updated_at — trigger function (not SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 1b. is_workspace_member — SECURITY DEFINER, also wrap auth.uid()
CREATE OR REPLACE FUNCTION public.is_workspace_member(ws_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = ws_id AND user_id = (SELECT auth.uid())
  );
$$;

-- 1c. is_workspace_admin — SECURITY DEFINER, also wrap auth.uid()
CREATE OR REPLACE FUNCTION public.is_workspace_admin(ws_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = ws_id AND user_id = (SELECT auth.uid()) AND role = 'admin'
  );
$$;

-- 1d. swap_post_days — SECURITY DEFINER (no auth.uid() inside)
CREATE OR REPLACE FUNCTION public.swap_post_days(post_a_id uuid, post_b_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  day_a INT;
  day_b INT;
BEGIN
  SELECT day_of_week INTO day_a FROM public.posts WHERE id = post_a_id;
  SELECT day_of_week INTO day_b FROM public.posts WHERE id = post_b_id;

  IF day_a IS NULL OR day_b IS NULL THEN
    RAISE EXCEPTION 'One or both posts not found';
  END IF;

  IF day_a = day_b THEN
    RETURN;
  END IF;

  SET CONSTRAINTS uq_posts_campaign_day DEFERRED;

  UPDATE public.posts SET day_of_week = day_b WHERE id = post_a_id;
  UPDATE public.posts SET day_of_week = day_a WHERE id = post_b_id;
END;
$$;

-- ============================================================
-- PART 2: Merge workspace_members duplicate policies
-- ============================================================

DROP POLICY IF EXISTS "members_own" ON public.workspace_members;
DROP POLICY IF EXISTS "members_admin_manage" ON public.workspace_members;

CREATE POLICY "members_access" ON public.workspace_members
  FOR ALL USING (
    user_id = (SELECT auth.uid())
    OR is_workspace_admin(workspace_id)
  );

-- ============================================================
-- PART 3: Fix RLS policies — wrap auth.uid() in (SELECT auth.uid())
-- ============================================================

-- 3a. Simple workspace_id pattern (9 tables)

DROP POLICY IF EXISTS "assets_workspace_isolation" ON public.assets;
CREATE POLICY "assets_workspace_isolation" ON public.assets
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "brand_profiles_workspace" ON public.brand_profiles;
CREATE POLICY "brand_profiles_workspace" ON public.brand_profiles
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "research_workspace_isolation" ON public.research_reports;
CREATE POLICY "research_workspace_isolation" ON public.research_reports
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "topics_workspace_isolation" ON public.topics;
CREATE POLICY "topics_workspace_isolation" ON public.topics
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "pattern_library_workspace" ON public.pattern_library;
CREATE POLICY "pattern_library_workspace" ON public.pattern_library
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can manage own sessions" ON public.orchestrator_sessions;
CREATE POLICY "Users can manage own sessions" ON public.orchestrator_sessions
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can manage own actions" ON public.orchestrator_actions;
CREATE POLICY "Users can manage own actions" ON public.orchestrator_actions
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can manage own learnings" ON public.orchestrator_learnings;
CREATE POLICY "Users can manage own learnings" ON public.orchestrator_learnings
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "campaigns_workspace_isolation" ON public.campaigns;
CREATE POLICY "campaigns_workspace_isolation" ON public.campaigns
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = (SELECT auth.uid())
    )
  );

-- 3b. JOIN-based: campaign_id -> campaigns (2 tables)

DROP POLICY IF EXISTS "posts_workspace_isolation" ON public.posts;
CREATE POLICY "posts_workspace_isolation" ON public.posts
  FOR ALL USING (
    campaign_id IN (
      SELECT c.id FROM public.campaigns c
      JOIN public.workspace_members wm ON wm.workspace_id = c.workspace_id
      WHERE wm.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "learnings_workspace_isolation" ON public.learnings;
CREATE POLICY "learnings_workspace_isolation" ON public.learnings
  FOR ALL USING (
    campaign_id IN (
      SELECT c.id FROM public.campaigns c
      JOIN public.workspace_members wm ON wm.workspace_id = c.workspace_id
      WHERE wm.user_id = (SELECT auth.uid())
    )
  );

-- 3c. JOIN-based: post_id -> posts -> campaigns (4 tables)

DROP POLICY IF EXISTS "post_versions_workspace_isolation" ON public.post_versions;
CREATE POLICY "post_versions_workspace_isolation" ON public.post_versions
  FOR ALL USING (
    post_id IN (
      SELECT p.id FROM public.posts p
      JOIN public.campaigns c ON c.id = p.campaign_id
      JOIN public.workspace_members wm ON wm.workspace_id = c.workspace_id
      WHERE wm.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "visual_versions_workspace_isolation" ON public.visual_versions;
CREATE POLICY "visual_versions_workspace_isolation" ON public.visual_versions
  FOR ALL USING (
    post_id IN (
      SELECT p.id FROM public.posts p
      JOIN public.campaigns c ON c.id = p.campaign_id
      JOIN public.workspace_members wm ON wm.workspace_id = c.workspace_id
      WHERE wm.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "visual_concepts_workspace_isolation" ON public.visual_concepts;
CREATE POLICY "visual_concepts_workspace_isolation" ON public.visual_concepts
  FOR ALL USING (
    post_id IN (
      SELECT p.id FROM public.posts p
      JOIN public.campaigns c ON p.campaign_id = c.id
      JOIN public.workspace_members wm ON wm.workspace_id = c.workspace_id
      WHERE wm.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "metrics_workspace_isolation" ON public.metrics;
CREATE POLICY "metrics_workspace_isolation" ON public.metrics
  FOR ALL USING (
    post_id IN (
      SELECT p.id FROM public.posts p
      JOIN public.campaigns c ON c.id = p.campaign_id
      JOIN public.workspace_members wm ON wm.workspace_id = c.workspace_id
      WHERE wm.user_id = (SELECT auth.uid())
    )
  );

-- 3d. Complex JOINs

DROP POLICY IF EXISTS "carousel_slides_workspace_isolation" ON public.carousel_slides;
CREATE POLICY "carousel_slides_workspace_isolation" ON public.carousel_slides
  FOR ALL USING (
    visual_version_id IN (
      SELECT vv.id FROM public.visual_versions vv
      JOIN public.posts p ON vv.post_id = p.id
      JOIN public.campaigns c ON p.campaign_id = c.id
      JOIN public.workspace_members wm ON wm.workspace_id = c.workspace_id
      WHERE wm.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "critic_reviews_workspace_isolation" ON public.critic_reviews;
CREATE POLICY "critic_reviews_workspace_isolation" ON public.critic_reviews
  FOR ALL USING (
    (post_version_id IS NOT NULL AND post_version_id IN (
      SELECT pv.id FROM public.post_versions pv
      JOIN public.posts p ON pv.post_id = p.id
      JOIN public.campaigns c ON p.campaign_id = c.id
      JOIN public.workspace_members wm ON wm.workspace_id = c.workspace_id
      WHERE wm.user_id = (SELECT auth.uid())
    ))
    OR
    (visual_version_id IS NOT NULL AND visual_version_id IN (
      SELECT vv.id FROM public.visual_versions vv
      JOIN public.posts p ON vv.post_id = p.id
      JOIN public.campaigns c ON p.campaign_id = c.id
      JOIN public.workspace_members wm ON wm.workspace_id = c.workspace_id
      WHERE wm.user_id = (SELECT auth.uid())
    ))
  );

-- 3e. api_keys — 4 separate per-action policies (admin only)

DROP POLICY IF EXISTS "workspace_admin_select_api_keys" ON public.api_keys;
CREATE POLICY "workspace_admin_select_api_keys" ON public.api_keys
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "workspace_admin_insert_api_keys" ON public.api_keys;
CREATE POLICY "workspace_admin_insert_api_keys" ON public.api_keys
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "workspace_admin_update_api_keys" ON public.api_keys;
CREATE POLICY "workspace_admin_update_api_keys" ON public.api_keys
  FOR UPDATE USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "workspace_admin_delete_api_keys" ON public.api_keys;
CREATE POLICY "workspace_admin_delete_api_keys" ON public.api_keys
  FOR DELETE USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

-- ============================================================
-- PART 4: Tighten workspaces INSERT policy
-- ============================================================

DROP POLICY IF EXISTS "allow_authenticated_insert" ON public.workspaces;
CREATE POLICY "allow_authenticated_insert" ON public.workspaces
  FOR INSERT TO authenticated
  WITH CHECK (
    NOT EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE user_id = (SELECT auth.uid())
    )
  );
