-- Check what schemas exist and their folder values
SELECT
  id,
  title,
  folder,
  content_type,
  organization_id,
  created_at,
  LENGTH(content::text) as content_length
FROM content_library
WHERE content_type = 'schema'
ORDER BY created_at DESC
LIMIT 10;
