-- Add selected_variant column to posts table
-- Tracks which copy variant the user has chosen for publication
ALTER TABLE posts ADD COLUMN selected_variant text;

-- No CHECK constraint needed — null means "not yet selected"
-- Valid values are enforced at the application layer (Zod validation)
