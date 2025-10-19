-- Create tables for Fireplexity caching and usage tracking

-- Cache table for search results
CREATE TABLE IF NOT EXISTS fireplexity_cache (
  cache_key TEXT PRIMARY KEY,
  result JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours'
);

-- Create index for faster cache lookups
CREATE INDEX idx_fireplexity_cache_expires ON fireplexity_cache(expires_at);

-- Usage tracking table
CREATE TABLE IF NOT EXISTS fireplexity_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  query TEXT NOT NULL,
  module TEXT,
  strategy TEXT,
  cost DECIMAL(10, 6),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  organization_id TEXT
);

-- Create index for usage analytics
CREATE INDEX idx_fireplexity_usage_timestamp ON fireplexity_usage(timestamp);
CREATE INDEX idx_fireplexity_usage_module ON fireplexity_usage(module);

-- Clean up expired cache entries periodically (optional cron job)
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM fireplexity_cache WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Create a function to get daily usage stats
CREATE OR REPLACE FUNCTION get_fireplexity_daily_stats(p_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE (
  total_queries BIGINT,
  total_cost DECIMAL,
  by_module JSONB,
  by_strategy JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_queries,
    COALESCE(SUM(cost), 0) as total_cost,
    jsonb_object_agg(
      COALESCE(module, 'unknown'),
      module_count
    ) FILTER (WHERE module IS NOT NULL) as by_module,
    jsonb_object_agg(
      COALESCE(strategy, 'unknown'),
      strategy_count
    ) FILTER (WHERE strategy IS NOT NULL) as by_strategy
  FROM (
    SELECT
      module,
      COUNT(*) as module_count,
      strategy,
      COUNT(*) as strategy_count,
      SUM(cost) as cost
    FROM fireplexity_usage
    WHERE DATE(timestamp) = p_date
    GROUP BY module, strategy
  ) stats;
END;
$$ LANGUAGE plpgsql;