-- Create Storage Bucket for Proposals
-- Run this in Supabase SQL Editor or Dashboard

-- Create the bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'proposals',
  'proposals',
  true,
  10485760, -- 10MB limit
  ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword']
)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on the bucket
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to upload proposals
CREATE POLICY "Allow authenticated users to upload proposals"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'proposals');

-- Policy: Allow authenticated users to read proposals
CREATE POLICY "Allow authenticated users to read proposals"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'proposals');

-- Policy: Allow users to update their own proposals
CREATE POLICY "Allow users to update their own proposals"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'proposals');

-- Policy: Allow users to delete their own proposals
CREATE POLICY "Allow users to delete their own proposals"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'proposals');

-- Verify the bucket was created
SELECT * FROM storage.buckets WHERE id = 'proposals';
