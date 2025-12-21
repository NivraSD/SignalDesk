-- Add file_url column to content_library table
-- This stores the URL to uploaded files in Supabase Storage

ALTER TABLE content_library
ADD COLUMN IF NOT EXISTS file_url TEXT;

-- Add index for querying by file_url
CREATE INDEX IF NOT EXISTS idx_content_library_file_url
ON content_library(file_url)
WHERE file_url IS NOT NULL;

-- Add comment
COMMENT ON COLUMN content_library.file_url IS 'URL to the uploaded file in Supabase Storage (for proposals, documents, etc.)';
