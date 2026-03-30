-- Add fingerprint column for content deduplication
ALTER TABLE content_library
ADD COLUMN IF NOT EXISTS fingerprint VARCHAR(100);

-- Create index for fast fingerprint lookups
CREATE INDEX IF NOT EXISTS content_library_fingerprint_idx
ON content_library(fingerprint);

-- Add unique constraint for fingerprint + organization (allows same content in different orgs)
CREATE UNIQUE INDEX IF NOT EXISTS content_library_fingerprint_org_idx
ON content_library(fingerprint, organization_id)
WHERE fingerprint IS NOT NULL;

-- Comment for documentation
COMMENT ON COLUMN content_library.fingerprint IS 'Hash-based fingerprint for content deduplication within an organization';
