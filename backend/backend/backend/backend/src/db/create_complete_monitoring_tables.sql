-- Create comprehensive monitoring system tables

-- Source configurations table
CREATE TABLE IF NOT EXISTS source_configurations (
  id SERIAL PRIMARY KEY,
  organization_id VARCHAR(255) NOT NULL,
  source_type VARCHAR(50) NOT NULL, -- rss, google-news, api, web
  source_name VARCHAR(255) NOT NULL,
  configuration JSONB NOT NULL, -- url, credentials, parameters
  active BOOLEAN DEFAULT true,
  last_checked TIMESTAMP,
  last_success TIMESTAMP,
  failure_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(organization_id, source_name)
);

-- News articles table with better structure
CREATE TABLE IF NOT EXISTS news_articles (
  id SERIAL PRIMARY KEY,
  organization_id VARCHAR(255) NOT NULL,
  title TEXT NOT NULL,
  url TEXT UNIQUE NOT NULL,
  content TEXT,
  source VARCHAR(255),
  source_type VARCHAR(50),
  category VARCHAR(50), -- competitor, topic, industry, general
  published_date TIMESTAMP,
  guid TEXT,
  relevance_score DECIMAL(3,2),
  sentiment VARCHAR(20),
  entities JSONB, -- extracted entities
  topics JSONB, -- extracted topics
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Intelligence summaries table
CREATE TABLE IF NOT EXISTS intelligence_summaries (
  id SERIAL PRIMARY KEY,
  organization_id VARCHAR(255) NOT NULL,
  summary_data JSONB NOT NULL,
  key_insights TEXT[],
  competitor_activities JSONB,
  emerging_trends JSONB,
  narrative_gaps JSONB,
  sentiment_analysis JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Monitoring runs table for tracking
CREATE TABLE IF NOT EXISTS monitoring_runs (
  id SERIAL PRIMARY KEY,
  organization_id VARCHAR(255) NOT NULL,
  run_type VARCHAR(50), -- scheduled, manual, triggered
  phases_completed JSONB,
  articles_collected INTEGER DEFAULT 0,
  opportunities_found INTEGER DEFAULT 0,
  errors JSONB,
  results JSONB,
  success BOOLEAN DEFAULT false,
  duration_ms INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Monitoring alerts table
CREATE TABLE IF NOT EXISTS monitoring_alerts (
  id SERIAL PRIMARY KEY,
  organization_id VARCHAR(255) NOT NULL,
  alert_type VARCHAR(50), -- competitor_move, trend_emerging, opportunity_detected
  severity VARCHAR(20), -- low, medium, high, critical
  title VARCHAR(500),
  description TEXT,
  data JSONB,
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_source_configs_org ON source_configurations(organization_id);
CREATE INDEX IF NOT EXISTS idx_source_configs_active ON source_configurations(active);
CREATE INDEX IF NOT EXISTS idx_articles_org ON news_articles(organization_id);
CREATE INDEX IF NOT EXISTS idx_articles_published ON news_articles(published_date DESC);
CREATE INDEX IF NOT EXISTS idx_articles_category ON news_articles(category);
CREATE INDEX IF NOT EXISTS idx_articles_url ON news_articles(url);
CREATE INDEX IF NOT EXISTS idx_summaries_org ON intelligence_summaries(organization_id);
CREATE INDEX IF NOT EXISTS idx_summaries_created ON intelligence_summaries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_monitoring_runs_org ON monitoring_runs(organization_id);
CREATE INDEX IF NOT EXISTS idx_monitoring_runs_created ON monitoring_runs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_org ON monitoring_alerts(organization_id);
CREATE INDEX IF NOT EXISTS idx_alerts_acknowledged ON monitoring_alerts(acknowledged);

-- Add missing columns to existing tables if they don't exist
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS monitoring_enabled BOOLEAN DEFAULT true;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS last_monitoring_run TIMESTAMP;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS monitoring_frequency VARCHAR(50) DEFAULT '1 hour';

ALTER TABLE intelligence_targets ADD COLUMN IF NOT EXISTS keywords TEXT[];
ALTER TABLE intelligence_targets ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP;
ALTER TABLE intelligence_targets ADD COLUMN IF NOT EXISTS mention_count INTEGER DEFAULT 0;

-- Function to get monitoring health status
CREATE OR REPLACE FUNCTION get_monitoring_health(p_organization_id VARCHAR)
RETURNS TABLE (
  last_run TIMESTAMP,
  last_success TIMESTAMP,
  total_runs BIGINT,
  success_rate NUMERIC,
  avg_articles_collected NUMERIC,
  active_sources BIGINT,
  recent_alerts BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    MAX(mr.created_at) as last_run,
    MAX(CASE WHEN mr.success THEN mr.created_at END) as last_success,
    COUNT(*) as total_runs,
    ROUND(SUM(CASE WHEN mr.success THEN 1 ELSE 0 END)::NUMERIC / COUNT(*), 2) as success_rate,
    ROUND(AVG(mr.articles_collected)) as avg_articles_collected,
    (SELECT COUNT(*) FROM source_configurations WHERE organization_id = p_organization_id AND active = true) as active_sources,
    (SELECT COUNT(*) FROM monitoring_alerts WHERE organization_id = p_organization_id AND acknowledged = false) as recent_alerts
  FROM monitoring_runs mr
  WHERE mr.organization_id = p_organization_id
    AND mr.created_at > NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- Function to clean old monitoring data
CREATE OR REPLACE FUNCTION clean_old_monitoring_data(p_days INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER := 0;
  temp_count INTEGER;
BEGIN
  -- Delete old articles
  DELETE FROM news_articles WHERE created_at < NOW() - INTERVAL '1 day' * p_days;
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_count := deleted_count + temp_count;
  
  -- Delete old monitoring runs
  DELETE FROM monitoring_runs WHERE created_at < NOW() - INTERVAL '1 day' * p_days;
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_count := deleted_count + temp_count;
  
  -- Delete old acknowledged alerts
  DELETE FROM monitoring_alerts 
  WHERE acknowledged = true AND acknowledged_at < NOW() - INTERVAL '1 day' * p_days;
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_count := deleted_count + temp_count;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE source_configurations IS 'Stores all configured news and data sources for monitoring';
COMMENT ON TABLE news_articles IS 'Stores all collected news articles with analysis metadata';
COMMENT ON TABLE intelligence_summaries IS 'Stores analyzed intelligence summaries';
COMMENT ON TABLE monitoring_runs IS 'Tracks each monitoring run for debugging and optimization';
COMMENT ON TABLE monitoring_alerts IS 'Stores alerts generated from monitoring for user action';