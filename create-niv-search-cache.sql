-- Create cache table for NIV search results
CREATE TABLE IF NOT EXISTS niv_search_cache (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cache_key TEXT UNIQUE NOT NULL,
    result JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '30 minutes')
);

-- Add index for cache lookups
CREATE INDEX IF NOT EXISTS idx_niv_search_cache_key ON niv_search_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_niv_search_cache_expires ON niv_search_cache(expires_at);

-- Clean up expired cache entries automatically
CREATE OR REPLACE FUNCTION cleanup_expired_niv_cache()
RETURNS void AS $$
BEGIN
    DELETE FROM niv_search_cache WHERE expires_at < CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to clean up expired cache (requires pg_cron extension)
-- Run this if pg_cron is available:
-- SELECT cron.schedule('cleanup-niv-cache', '*/30 * * * *', 'SELECT cleanup_expired_niv_cache();');