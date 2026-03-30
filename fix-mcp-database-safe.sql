-- Safe MCP Database Schema Fix
-- This version preserves existing data and only adds missing columns/tables

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ========================================
-- Fix MemoryVault Tables (Safe Version)
-- ========================================

-- Check if memoryvault_items exists and add missing columns
DO $$ 
BEGIN
    -- Create table if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'memoryvault_items') THEN
        CREATE TABLE memoryvault_items (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id VARCHAR(255) NOT NULL DEFAULT 'demo-user',
            title VARCHAR(500) NOT NULL,
            content TEXT NOT NULL,
            category VARCHAR(100) DEFAULT 'general',
            tags TEXT[] DEFAULT '{}',
            embedding vector(1536),
            metadata JSONB DEFAULT '{}',
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        );
    END IF;
    
    -- Add missing columns if they don't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'memoryvault_items' AND column_name = 'user_id') THEN
        ALTER TABLE memoryvault_items ADD COLUMN user_id VARCHAR(255) DEFAULT 'demo-user';
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'memoryvault_items' AND column_name = 'category') THEN
        ALTER TABLE memoryvault_items ADD COLUMN category VARCHAR(100) DEFAULT 'general';
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'memoryvault_items' AND column_name = 'tags') THEN
        ALTER TABLE memoryvault_items ADD COLUMN tags TEXT[] DEFAULT '{}';
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'memoryvault_items' AND column_name = 'metadata') THEN
        ALTER TABLE memoryvault_items ADD COLUMN metadata JSONB DEFAULT '{}';
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'memoryvault_items' AND column_name = 'updated_at') THEN
        ALTER TABLE memoryvault_items ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
    END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_memoryvault_user_id ON memoryvault_items(user_id);
CREATE INDEX IF NOT EXISTS idx_memoryvault_category ON memoryvault_items(category);
CREATE INDEX IF NOT EXISTS idx_memoryvault_created_at ON memoryvault_items(created_at DESC);

-- Enable RLS if not already enabled
ALTER TABLE memoryvault_items ENABLE ROW LEVEL SECURITY;

-- Create or replace RLS policy
DROP POLICY IF EXISTS "Allow all access to memoryvault_items" ON memoryvault_items;
CREATE POLICY "Allow all access to memoryvault_items" 
ON memoryvault_items 
FOR ALL 
TO PUBLIC 
USING (true) 
WITH CHECK (true);

-- ========================================
-- Fix Campaigns Tables (Safe Version)
-- ========================================

DO $$ 
BEGIN
    -- Create table if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'campaigns') THEN
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
    ELSE
        -- Add missing columns to existing table
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'campaigns' AND column_name = 'objectives') THEN
            ALTER TABLE campaigns ADD COLUMN objectives JSONB DEFAULT '[]';
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'campaigns' AND column_name = 'user_id') THEN
            ALTER TABLE campaigns ADD COLUMN user_id VARCHAR(255) DEFAULT 'demo-user';
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'campaigns' AND column_name = 'target_audience') THEN
            ALTER TABLE campaigns ADD COLUMN target_audience TEXT;
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'campaigns' AND column_name = 'metrics') THEN
            ALTER TABLE campaigns ADD COLUMN metrics JSONB DEFAULT '{}';
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'campaigns' AND column_name = 'updated_at') THEN
            ALTER TABLE campaigns ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
        END IF;
    END IF;
END $$;

-- Create indexes for campaigns
CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_at ON campaigns(created_at DESC);

-- Enable RLS
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

-- Create or replace RLS policy
DROP POLICY IF EXISTS "Allow all access to campaigns" ON campaigns;
CREATE POLICY "Allow all access to campaigns" 
ON campaigns 
FOR ALL 
TO PUBLIC 
USING (true) 
WITH CHECK (true);

-- ========================================
-- Fix Media Tables (Safe Version)
-- ========================================

-- Create media_lists if it doesn't exist
CREATE TABLE IF NOT EXISTS media_lists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) DEFAULT 'demo-user',
    name VARCHAR(255),
    topic VARCHAR(255),
    journalists JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create media_outreach if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'media_outreach') THEN
        CREATE TABLE media_outreach (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            journalist_id VARCHAR(255),
            user_id VARCHAR(255) DEFAULT 'demo-user',
            campaign_id UUID,
            status VARCHAR(50),
            pitch_sent TIMESTAMP,
            response_received TIMESTAMP,
            notes TEXT,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        );
        
        -- Add foreign key only if campaigns table exists
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'campaigns') THEN
            ALTER TABLE media_outreach ADD CONSTRAINT fk_media_outreach_campaign 
            FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE;
        END IF;
        
        -- Add unique constraint
        ALTER TABLE media_outreach ADD CONSTRAINT unique_journalist_user 
        UNIQUE(journalist_id, user_id);
    END IF;
END $$;

-- Create media_assets if it doesn't exist
CREATE TABLE IF NOT EXISTS media_assets (
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

-- Create or replace RLS policies for media tables
DROP POLICY IF EXISTS "Allow all access to media_lists" ON media_lists;
CREATE POLICY "Allow all access to media_lists" 
ON media_lists 
FOR ALL 
TO PUBLIC 
USING (true) 
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to media_outreach" ON media_outreach;
CREATE POLICY "Allow all access to media_outreach" 
ON media_outreach 
FOR ALL 
TO PUBLIC 
USING (true) 
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to media_assets" ON media_assets;
CREATE POLICY "Allow all access to media_assets" 
ON media_assets 
FOR ALL 
TO PUBLIC 
USING (true) 
WITH CHECK (true);

-- ========================================
-- Verify Schema (Non-Destructive)
-- ========================================

-- Check what columns exist in each table
SELECT 
    'memoryvault_items' as table_name,
    COUNT(*) as row_count,
    array_agg(column_name ORDER BY ordinal_position) as columns
FROM information_schema.columns
WHERE table_name = 'memoryvault_items'
GROUP BY table_name

UNION ALL

SELECT 
    'campaigns' as table_name,
    COUNT(*) as row_count,
    array_agg(column_name ORDER BY ordinal_position) as columns
FROM information_schema.columns
WHERE table_name = 'campaigns'
GROUP BY table_name

UNION ALL

SELECT 
    'media_lists' as table_name,
    COUNT(*) as row_count,
    array_agg(column_name ORDER BY ordinal_position) as columns
FROM information_schema.columns
WHERE table_name = 'media_lists'
GROUP BY table_name;

-- Show actual data counts
SELECT 'Data Summary:' as info;
SELECT 'memoryvault_items' as table_name, COUNT(*) as records FROM memoryvault_items
UNION ALL
SELECT 'campaigns', COUNT(*) FROM campaigns
UNION ALL
SELECT 'media_lists', COUNT(*) FROM media_lists
UNION ALL
SELECT 'media_outreach', COUNT(*) FROM media_outreach
UNION ALL
SELECT 'media_assets', COUNT(*) FROM media_assets;