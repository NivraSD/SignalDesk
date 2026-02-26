-- Fix MCP Database Schema Issues
-- Run this in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ========================================
-- Fix MemoryVault Tables
-- ========================================

-- Drop existing table if it exists with wrong schema
DROP TABLE IF EXISTS memoryvault_items CASCADE;

-- Create memoryvault_items with correct schema
CREATE TABLE memoryvault_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) NOT NULL DEFAULT 'demo-user',
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(100) DEFAULT 'general',
    tags TEXT[] DEFAULT '{}',
    embedding vector(1536), -- For semantic search
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for better search performance
CREATE INDEX IF NOT EXISTS idx_memoryvault_user_id ON memoryvault_items(user_id);
CREATE INDEX IF NOT EXISTS idx_memoryvault_category ON memoryvault_items(category);
CREATE INDEX IF NOT EXISTS idx_memoryvault_created_at ON memoryvault_items(created_at DESC);

-- Enable RLS
ALTER TABLE memoryvault_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policy (allows all for now - adjust as needed)
CREATE POLICY "Allow all access to memoryvault_items" 
ON memoryvault_items 
FOR ALL 
TO PUBLIC 
USING (true) 
WITH CHECK (true);

-- ========================================
-- Fix Campaigns Tables
-- ========================================

-- Drop existing table if it exists with wrong schema
DROP TABLE IF EXISTS campaigns CASCADE;

-- Create campaigns with correct schema including objectives
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) DEFAULT 'demo-user',
    name VARCHAR(255) NOT NULL,
    objectives JSONB DEFAULT '[]',
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    target_audience TEXT,
    budget DECIMAL(10,2),
    status VARCHAR(50) DEFAULT 'planning',
    metrics JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for campaigns
CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_at ON campaigns(created_at DESC);

-- Enable RLS
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "Allow all access to campaigns" 
ON campaigns 
FOR ALL 
TO PUBLIC 
USING (true) 
WITH CHECK (true);

-- ========================================
-- Fix Media Tables
-- ========================================

-- Drop existing tables if they exist
DROP TABLE IF EXISTS media_lists CASCADE;
DROP TABLE IF EXISTS media_outreach CASCADE;
DROP TABLE IF EXISTS media_assets CASCADE;

-- Create media_lists table
CREATE TABLE media_lists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) DEFAULT 'demo-user',
    name VARCHAR(255),
    topic VARCHAR(255),
    journalists JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create media_outreach table
CREATE TABLE media_outreach (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    journalist_id VARCHAR(255),
    user_id VARCHAR(255) DEFAULT 'demo-user',
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    status VARCHAR(50),
    pitch_sent TIMESTAMP,
    response_received TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(journalist_id, user_id)
);

-- Create media_assets table
CREATE TABLE media_assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) DEFAULT 'demo-user',
    organization_id UUID,
    filename VARCHAR(255) NOT NULL,
    file_type VARCHAR(100),
    file_size INTEGER,
    url TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for media tables
CREATE INDEX IF NOT EXISTS idx_media_lists_user_id ON media_lists(user_id);
CREATE INDEX IF NOT EXISTS idx_media_outreach_user_id ON media_outreach(user_id);
CREATE INDEX IF NOT EXISTS idx_media_outreach_campaign_id ON media_outreach(campaign_id);
CREATE INDEX IF NOT EXISTS idx_media_assets_user_id ON media_assets(user_id);

-- Enable RLS for media tables
ALTER TABLE media_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_outreach ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_assets ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for media tables
CREATE POLICY "Allow all access to media_lists" 
ON media_lists 
FOR ALL 
TO PUBLIC 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow all access to media_outreach" 
ON media_outreach 
FOR ALL 
TO PUBLIC 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow all access to media_assets" 
ON media_assets 
FOR ALL 
TO PUBLIC 
USING (true) 
WITH CHECK (true);

-- ========================================
-- Add some test data to verify
-- ========================================

-- Insert test memory item
INSERT INTO memoryvault_items (title, content, category, tags)
VALUES ('Test Memory Item', 'This is a test memory item to verify the schema is working', 'test', ARRAY['test', 'verification'])
ON CONFLICT DO NOTHING;

-- Insert test campaign
INSERT INTO campaigns (name, objectives, target_audience, status)
VALUES ('Test Campaign', '["Test Objective 1", "Test Objective 2"]'::jsonb, 'Test Audience', 'active')
ON CONFLICT DO NOTHING;

-- Insert test media list
INSERT INTO media_lists (name, topic, journalists)
VALUES ('Test Media List', 'Technology', '[{"name": "Test Journalist", "outlet": "Test Outlet"}]'::jsonb)
ON CONFLICT DO NOTHING;

-- Verify tables exist with correct schema
SELECT 'MemoryVault Items' as table_name, COUNT(*) as row_count FROM memoryvault_items
UNION ALL
SELECT 'Campaigns', COUNT(*) FROM campaigns
UNION ALL
SELECT 'Media Lists', COUNT(*) FROM media_lists
UNION ALL
SELECT 'Media Outreach', COUNT(*) FROM media_outreach
UNION ALL
SELECT 'Media Assets', COUNT(*) FROM media_assets;