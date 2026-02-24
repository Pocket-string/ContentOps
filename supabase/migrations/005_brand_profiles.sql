-- Migration: 005_brand_profiles
-- Phase 8: Brand Profiles Versionados
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/nwkelxffirgvxayethco/sql/new

CREATE TABLE brand_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Default',
  version smallint NOT NULL DEFAULT 1,
  is_active boolean DEFAULT true,
  colors jsonb NOT NULL DEFAULT '{"primary":"#1E3A5F","secondary":"#F97316","accent":"#10B981","background":"#FFFFFF","text":"#1F2937"}'::jsonb,
  typography jsonb NOT NULL DEFAULT '{"heading":"Inter, sans-serif","body":"Inter, sans-serif","style":"moderno, limpio, sin serif"}'::jsonb,
  logo_rules jsonb NOT NULL DEFAULT '{"placement":"esquina inferior derecha","size":"discreto, no dominante","includeAlways":true}'::jsonb,
  imagery jsonb NOT NULL DEFAULT '{"style":"editorial, fotografico con toques graficos","subjects":["plantas solares","paneles fotovoltaicos","equipos de mantenimiento"],"mood":"profesional, innovador, sostenible"}'::jsonb,
  tone text NOT NULL DEFAULT 'profesional, tecnico pero accesible, confiable',
  negative_prompts jsonb DEFAULT '["texto borroso o ilegible","logos de competidores","imagenes de baja calidad"]'::jsonb,
  qa_checklist jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE brand_profiles ENABLE ROW LEVEL SECURITY;

-- RLS: users can only access brand_profiles in their workspaces
-- NOTE: no public.is_workspace_member() function — use inline subquery
CREATE POLICY brand_profiles_workspace ON brand_profiles
  FOR ALL USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

CREATE INDEX idx_brand_profiles_workspace ON brand_profiles(workspace_id);

-- Auto-update updated_at (reuses existing trigger function)
CREATE TRIGGER trg_brand_profiles_updated_at
  BEFORE UPDATE ON brand_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
