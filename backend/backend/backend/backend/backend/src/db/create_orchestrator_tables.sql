-- Create tables for Opportunity Orchestrator system

-- Table to store opportunity history for learning
CREATE TABLE IF NOT EXISTS opportunity_history (
  id SERIAL PRIMARY KEY,
  organization_id VARCHAR(255) NOT NULL,
  title VARCHAR(500),
  type VARCHAR(100),
  score DECIMAL(3,2),
  execution_plan JSONB,
  outcome VARCHAR(50), -- success, partial, failed, pending
  feedback TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Table to track agent performance metrics
CREATE TABLE IF NOT EXISTS agent_performance_logs (
  id SERIAL PRIMARY KEY,
  organization_id VARCHAR(255) NOT NULL,
  agent_type VARCHAR(100) NOT NULL,
  task_description TEXT,
  processing_time INTEGER, -- milliseconds
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  input_size INTEGER,
  output_size INTEGER,
  quality_score DECIMAL(3,2),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table to store optimized workflows
CREATE TABLE IF NOT EXISTS optimized_workflows (
  id SERIAL PRIMARY KEY,
  workflow_name VARCHAR(255) UNIQUE NOT NULL,
  workflow_type VARCHAR(100),
  agent_configuration JSONB NOT NULL,
  performance_metrics JSONB,
  optimization_score DECIMAL(3,2),
  last_used TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Table to cache research results for efficiency
CREATE TABLE IF NOT EXISTS research_cache (
  id SERIAL PRIMARY KEY,
  cache_key VARCHAR(500) UNIQUE NOT NULL,
  organization_id VARCHAR(255),
  query_hash VARCHAR(64),
  results JSONB,
  agent_type VARCHAR(100),
  confidence_score DECIMAL(3,2),
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_opportunity_history_org ON opportunity_history(organization_id);
CREATE INDEX IF NOT EXISTS idx_opportunity_history_created ON opportunity_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_performance_logs_org ON agent_performance_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_performance_logs_agent ON agent_performance_logs(agent_type);
CREATE INDEX IF NOT EXISTS idx_performance_logs_created ON agent_performance_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_research_cache_key ON research_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_research_cache_expires ON research_cache(expires_at);

-- Add comments for documentation
COMMENT ON TABLE opportunity_history IS 'Stores historical opportunities for learning and optimization';
COMMENT ON TABLE agent_performance_logs IS 'Tracks performance metrics for each agent execution';
COMMENT ON TABLE optimized_workflows IS 'Stores optimized workflow configurations';
COMMENT ON TABLE research_cache IS 'Caches research results to improve performance';

-- Function to clean expired cache entries
CREATE OR REPLACE FUNCTION clean_expired_cache()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM research_cache WHERE expires_at < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get agent performance summary
CREATE OR REPLACE FUNCTION get_agent_performance_summary(
  p_organization_id VARCHAR,
  p_days INTEGER DEFAULT 7
)
RETURNS TABLE (
  agent_type VARCHAR,
  total_runs BIGINT,
  avg_processing_time NUMERIC,
  success_rate NUMERIC,
  avg_quality_score NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    apl.agent_type,
    COUNT(*) as total_runs,
    ROUND(AVG(apl.processing_time)) as avg_processing_time,
    ROUND(SUM(CASE WHEN apl.success THEN 1 ELSE 0 END)::NUMERIC / COUNT(*), 2) as success_rate,
    ROUND(AVG(apl.quality_score), 2) as avg_quality_score
  FROM agent_performance_logs apl
  WHERE apl.organization_id = p_organization_id
    AND apl.created_at > NOW() - INTERVAL '1 day' * p_days
  GROUP BY apl.agent_type
  ORDER BY total_runs DESC;
END;
$$ LANGUAGE plpgsql;

-- Sample data for testing
INSERT INTO optimized_workflows (workflow_name, workflow_type, agent_configuration, optimization_score)
VALUES 
  ('quick_opportunity_scan', 'opportunity', 
   '{"parallel": [{"agent": "data-analyst", "task": "Quick metrics"}], "sequential": []}'::jsonb, 
   0.75),
  ('deep_competitive_analysis', 'competitive', 
   '{"parallel": [{"agent": "search-specialist", "task": "Competitor research"}, {"agent": "data-analyst", "task": "Market analysis"}], "sequential": [{"agent": "report-generator", "task": "Synthesize findings"}]}'::jsonb, 
   0.85),
  ('trend_identification', 'trend', 
   '{"parallel": [{"agent": "data-analyst", "task": "Trend analysis"}], "sequential": [{"agent": "search-specialist", "task": "Verify trends"}]}'::jsonb, 
   0.80)
ON CONFLICT (workflow_name) DO NOTHING;

-- Grant permissions (adjust as needed for your setup)
-- GRANT ALL ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO your_app_user;