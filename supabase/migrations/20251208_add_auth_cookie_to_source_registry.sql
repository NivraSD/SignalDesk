-- Add auth_cookie column to source_registry for authenticated scraping
-- This allows storing session cookies for paywalled sources like The Information

ALTER TABLE source_registry
ADD COLUMN IF NOT EXISTS auth_cookie TEXT;

-- Add a comment explaining the purpose
COMMENT ON COLUMN source_registry.auth_cookie IS 'Session cookie string for authenticated scraping of paywalled sources';
