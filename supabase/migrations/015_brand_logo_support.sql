-- Add logo_urls and ai_palettes columns to brand_profiles
-- logo_urls: Array of { url: string, name: string } objects
-- ai_palettes: Array of 2 AI-generated palette options from Gemini Vision analysis
ALTER TABLE brand_profiles
  ADD COLUMN IF NOT EXISTS logo_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS ai_palettes JSONB NOT NULL DEFAULT '[]'::jsonb;
