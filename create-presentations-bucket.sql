-- Create presentations storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'presentations',
  'presentations',
  true,
  52428800, -- 50MB limit
  ARRAY['application/vnd.openxmlformats-officedocument.presentationml.presentation']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- Create storage policy for presentations bucket
CREATE POLICY "Public read access for presentations"
ON storage.objects FOR SELECT
USING (bucket_id = 'presentations');

CREATE POLICY "Authenticated users can upload presentations"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'presentations' AND auth.role() = 'authenticated');

CREATE POLICY "Service role can manage all presentations"
ON storage.objects FOR ALL
USING (bucket_id = 'presentations' AND auth.role() = 'service_role');
