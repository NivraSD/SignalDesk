-- Create table for storing custom sources per intelligence target
CREATE TABLE IF NOT EXISTS target_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_id UUID NOT NULL REFERENCES intelligence_targets(id) ON DELETE CASCADE,
  source_type VARCHAR(50) NOT NULL, -- 'rss', 'website', 'api', 'social', 'news'
  source_name VARCHAR(255) NOT NULL,
  source_url TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  check_frequency VARCHAR(20) DEFAULT 'daily', -- 'realtime', 'hourly', 'daily', 'weekly'
  last_checked TIMESTAMP,
  metadata JSONB DEFAULT '{}', -- Store additional config like API keys, selectors, etc.
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_target_sources_target_id ON target_sources(target_id);
CREATE INDEX idx_target_sources_active ON target_sources(is_active);
CREATE INDEX idx_target_sources_type ON target_sources(source_type);

-- Add some default sources for existing targets (example)
-- These will be customized per target through the UI