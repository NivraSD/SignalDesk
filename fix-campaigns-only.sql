-- Minimal Fix: Add Missing Columns to Campaigns Table
-- This script ONLY adds the missing columns, no destructive operations

-- ========================================
-- Add missing columns to campaigns table
-- ========================================

-- Add objectives column (for storing campaign goals)
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS objectives JSONB DEFAULT '[]';

-- Add user_id column (for tracking who owns the campaign)
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS user_id VARCHAR(255) DEFAULT 'demo-user';

-- ========================================
-- Verify the fix worked
-- ========================================

-- Show all columns in campaigns table after fix
SELECT 
    'Campaigns table columns after fix:' as info;

SELECT 
    column_name,
    data_type,
    column_default
FROM information_schema.columns
WHERE table_name = 'campaigns'
ORDER BY ordinal_position;

-- Verify required columns now exist
SELECT 
    'Verification:' as info;

SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaigns' AND column_name = 'objectives') 
        THEN '✅ campaigns.objectives now exists'
        ELSE '❌ campaigns.objectives still MISSING'
    END as status
UNION ALL
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaigns' AND column_name = 'user_id') 
        THEN '✅ campaigns.user_id now exists'
        ELSE '❌ campaigns.user_id still MISSING'
    END;

-- Show row count to confirm no data was lost
SELECT 
    'Data preserved:' as info;
    
SELECT 
    COUNT(*) as total_campaigns,
    'campaigns in database' as description
FROM campaigns;