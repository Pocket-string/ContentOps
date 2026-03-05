-- Phase: Research → Pillar link
-- Adds pillar_id FK to research_reports for thematic categorization.

-- 1. Add pillar_id FK to research_reports
ALTER TABLE public.research_reports
  ADD COLUMN pillar_id uuid REFERENCES public.content_pillars(id) ON DELETE SET NULL;

CREATE INDEX idx_research_reports_pillar ON public.research_reports(pillar_id);
