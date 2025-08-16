-- Add missing tables for signaldesk-media MCP
-- The MCP expects journalists, media_lists, and media_outreach tables

-- Create journalists table
CREATE TABLE IF NOT EXISTS journalists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  publication VARCHAR(255),
  beat VARCHAR(255),
  twitter VARCHAR(255),
  linkedin VARCHAR(255),
  phone VARCHAR(50),
  notes TEXT,
  relationship_score INTEGER DEFAULT 0,
  last_contacted TIMESTAMP,
  last_updated TIMESTAMP DEFAULT NOW()
);

-- Create media_lists table  
CREATE TABLE IF NOT EXISTS media_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255),
  name VARCHAR(255),
  topic VARCHAR(255),
  journalists JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create media_outreach table
CREATE TABLE IF NOT EXISTS media_outreach (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journalist_id VARCHAR(255),
  user_id VARCHAR(255),
  campaign_id UUID REFERENCES campaigns(id),
  status VARCHAR(50),
  pitch_sent TIMESTAMP,
  response_received TIMESTAMP,
  notes TEXT,
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(journalist_id, user_id)
);

-- Create campaign_tasks table (needed by campaigns MCP)
CREATE TABLE IF NOT EXISTS campaign_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id),
  name VARCHAR(255),
  description TEXT,
  due_date TIMESTAMP,
  assignee VARCHAR(255),
  dependencies JSONB,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_journalists_email ON journalists(email);
CREATE INDEX IF NOT EXISTS idx_media_lists_user ON media_lists(user_id);
CREATE INDEX IF NOT EXISTS idx_media_outreach_journalist ON media_outreach(journalist_id);
CREATE INDEX IF NOT EXISTS idx_campaign_tasks_campaign ON campaign_tasks(campaign_id);

-- Verify tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'memoryvault_items',
  'campaigns',
  'campaign_tasks',
  'journalists',
  'media_lists', 
  'media_outreach'
)
ORDER BY table_name;