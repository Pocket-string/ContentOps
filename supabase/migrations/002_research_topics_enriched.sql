-- Migration 002: Research Estructurado + Topics Enriquecidos
-- Phase 1: Add structured research fields for deep research analysis
-- Phase 2: Add "silent enemy" concept and minimal proof to topics

-- ============================================
-- Phase 1: Research Estructurado
-- ============================================

ALTER TABLE research_reports
  ADD COLUMN recency_date date,
  ADD COLUMN market_region text,
  ADD COLUMN buyer_persona text,
  ADD COLUMN trend_score smallint CHECK (trend_score >= 0 AND trend_score <= 10),
  ADD COLUMN fit_score smallint CHECK (fit_score >= 0 AND fit_score <= 10),
  ADD COLUMN evidence_links jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN key_takeaways jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN recommended_angles jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN ai_synthesis jsonb;

-- ============================================
-- Phase 2: Topics Enriquecidos
-- ============================================

ALTER TABLE topics
  ADD COLUMN silent_enemy_name text,
  ADD COLUMN minimal_proof text,
  ADD COLUMN failure_modes jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN expected_business_impact text,
  ADD COLUMN recommended_week_structure jsonb;
