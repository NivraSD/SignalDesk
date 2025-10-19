-- Fix tables for the 3 MCPs that weren't working
-- This only adds the specific tables these MCPs need

-- ========================================
-- Tables for signaldesk-media MCP
-- ========================================

-- Journalists table (if it doesn't exist)
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

-- Media lists table
CREATE TABLE IF NOT EXISTS media_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255),
  name VARCHAR(255),
  topic VARCHAR(255),
  journalists JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Media outreach table
CREATE TABLE IF NOT EXISTS media_outreach (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journalist_id VARCHAR(255),
  user_id VARCHAR(255),
  campaign_id UUID,
  status VARCHAR(50),
  pitch_sent TIMESTAMP,
  response_received TIMESTAMP,
  notes TEXT,
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(journalist_id, user_id)
);

-- ========================================
-- Tables for signaldesk-campaigns MCP
-- ========================================

-- Campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255),
  name VARCHAR(255) NOT NULL,
  objectives JSONB,
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  target_audience TEXT,
  budget DECIMAL(10,2),
  status VARCHAR(50) DEFAULT 'planning',
  metrics JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Campaign tasks table
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

-- ========================================
-- Create indexes for performance
-- ========================================

CREATE INDEX IF NOT EXISTS idx_journalists_email ON journalists(email);
CREATE INDEX IF NOT EXISTS idx_media_lists_user ON media_lists(user_id);
CREATE INDEX IF NOT EXISTS idx_media_outreach_journalist ON media_outreach(journalist_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_user ON campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaign_tasks_campaign ON campaign_tasks(campaign_id);

-- ========================================
-- Verify tables exist
-- ========================================

DO $$
BEGIN
  RAISE NOTICE 'Checking tables for MCPs...';
  
  -- Check memoryvault_items (for memory MCP)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'memoryvault_items') THEN
    RAISE NOTICE '✓ memoryvault_items table exists';
  ELSE
    RAISE NOTICE '✗ memoryvault_items table missing';
  END IF;
  
  -- Check journalists (for media MCP)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'journalists') THEN
    RAISE NOTICE '✓ journalists table exists';
  ELSE
    RAISE NOTICE '✗ journalists table missing';
  END IF;
  
  -- Check campaigns (for campaigns MCP)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'campaigns') THEN
    RAISE NOTICE '✓ campaigns table exists';
  ELSE
    RAISE NOTICE '✗ campaigns table missing';
  END IF;
  
END $$;