-- Create Supabase Storage bucket for presentations
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'presentations',
  'presentations',
  true,  -- Public access for easy downloading
  52428800,  -- 50MB limit
  ARRAY[
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',  -- .pptx
    'application/pdf'  -- .pdf
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for presentations bucket
CREATE POLICY "Allow authenticated users to upload presentations"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'presentations');

CREATE POLICY "Allow authenticated users to view presentations"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'presentations');

CREATE POLICY "Allow authenticated users to update their presentations"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'presentations');

CREATE POLICY "Allow authenticated users to delete their presentations"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'presentations');

-- Service role has full access
CREATE POLICY "Service role has full access to presentations"
ON storage.objects
TO service_role
USING (bucket_id = 'presentations')
WITH CHECK (bucket_id = 'presentations');

COMMENT ON TABLE storage.objects IS 'Storage policies for presentations bucket configured';
