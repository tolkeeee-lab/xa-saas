-- Create storage bucket for pertes photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'pertes-photos',
  'pertes-photos',
  false,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for the bucket
CREATE POLICY "pertes_photos_insert" ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'pertes-photos' AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY "pertes_photos_select" ON storage.objects FOR SELECT
  USING (
    bucket_id = 'pertes-photos' AND
    auth.uid() IS NOT NULL
  );
