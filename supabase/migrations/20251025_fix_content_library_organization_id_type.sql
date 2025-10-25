-- Fix content_library organization_id type mismatch
-- The column was changed to UUID but code sends TEXT, causing insert failures

-- Change organization_id back to TEXT to match existing data and code expectations
ALTER TABLE content_library
ALTER COLUMN organization_id TYPE TEXT;

-- Ensure it can still be null
ALTER TABLE content_library
ALTER COLUMN organization_id DROP NOT NULL;

-- Add comment explaining the type choice
COMMENT ON COLUMN content_library.organization_id IS 'Organization ID as TEXT to support flexible ID formats from various sources';
