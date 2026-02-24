-- Storage bucket for AI-generated visual assets (Nano Banana / Nano Banana Pro)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'visual-assets',
  'visual-assets',
  true,
  10485760, -- 10 MB max
  ARRAY['image/png', 'image/jpeg', 'image/webp']
);

-- Authenticated users can upload
CREATE POLICY "visual_assets_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'visual-assets');

-- Public read (for <img src> tags)
CREATE POLICY "visual_assets_select" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'visual-assets');

-- Authenticated users can update/delete their uploads
CREATE POLICY "visual_assets_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'visual-assets');

CREATE POLICY "visual_assets_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'visual-assets');
