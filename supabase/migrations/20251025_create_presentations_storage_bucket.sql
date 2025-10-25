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
CREATE POLICY "Authenticated users can upload presentations"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'presentations');

CREATE POLICY "Anyone can view presentations"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'presentations');

CREATE POLICY "Users can update their own presentations"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'presentations');

CREATE POLICY "Users can delete their own presentations"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'presentations');

-- Service role has full access
CREATE POLICY "Service role full access to presentations"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'presentations')
WITH CHECK (bucket_id = 'presentations');

-- Anon access for edge functions
CREATE POLICY "Anon can upload presentations"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (bucket_id = 'presentations');

CREATE POLICY "Anon can update presentations"
ON storage.objects FOR UPDATE
TO anon
USING (bucket_id = 'presentations');
