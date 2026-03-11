-- Migration 022: Add solution_framework to topics
-- Captures WHAT the solution is, so the campaign can differentiate problem vs solution posts

ALTER TABLE topics
  ADD COLUMN solution_framework jsonb;
