-- Create storage bucket for Gamma presentations
-- This stores the actual PPTX files downloaded from Gamma

-- Create the bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'presentations',
  'presentations',
  true,  -- Public bucket so users can download presentations
  52428800,  -- 50MB limit per file
  ARRAY[
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/pdf',
    'application/vnd.ms-powerpoint'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for presentations bucket
-- Note: These policies are permissive to allow Edge Functions to work
-- The Edge Function uses service_role which bypasses RLS anyway

-- Allow anyone to view presentations (public bucket)
CREATE POLICY "Public can view presentations"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'presentations');

-- Allow authenticated users to manage presentations
CREATE POLICY "Authenticated can manage presentations"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'presentations')
WITH CHECK (bucket_id = 'presentations');

-- Allow anon users to upload (for Edge Functions using anon key)
CREATE POLICY "Anon can manage presentations"
ON storage.objects FOR ALL
TO anon
USING (bucket_id = 'presentations')
WITH CHECK (bucket_id = 'presentations');

-- Service role has full access (bypasses RLS anyway, but explicit is good)
CREATE POLICY "Service role full access to presentations"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'presentations')
WITH CHECK (bucket_id = 'presentations');
