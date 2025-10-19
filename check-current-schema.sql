-- Check Current Database Schema
-- Run this first to see what tables and columns you already have

-- ========================================
-- Check what tables exist
-- ========================================
SELECT 
    'Existing Tables:' as info;

SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_name IN (
    'memoryvault_items',
    'campaigns', 
    'media_lists',
    'media_outreach',
    'media_assets',
    'organizations',
    'users',
    'projects'
)
ORDER BY table_name;

-- ========================================
-- Check columns in memoryvault_items
-- ========================================
SELECT 
    'Columns in memoryvault_items:' as info;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'memoryvault_items'
ORDER BY ordinal_position;

-- ========================================
-- Check columns in campaigns
-- ========================================
SELECT 
    'Columns in campaigns:' as info;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'campaigns'
ORDER BY ordinal_position;

-- ========================================
-- Check columns in media tables
-- ========================================
SELECT 
    'Columns in media_lists:' as info;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'media_lists'
ORDER BY ordinal_position;

SELECT 
    'Columns in media_outreach:' as info;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'media_outreach'
ORDER BY ordinal_position;

SELECT 
    'Columns in media_assets:' as info;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'media_assets'
ORDER BY ordinal_position;

-- ========================================
-- Check existing RLS policies
-- ========================================
SELECT 
    'Existing RLS Policies:' as info;

SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN (
    'memoryvault_items',
    'campaigns',
    'media_lists',
    'media_outreach',
    'media_assets'
)
ORDER BY tablename, policyname;

-- ========================================
-- Check row counts
-- ========================================
SELECT 
    'Data counts in tables:' as info;

SELECT 
    'memoryvault_items' as table_name, 
    COUNT(*) as row_count 
FROM memoryvault_items
UNION ALL
SELECT 
    'campaigns', 
    COUNT(*) 
FROM campaigns
UNION ALL
SELECT 
    'media_lists', 
    COUNT(*) 
FROM media_lists
UNION ALL
SELECT 
    'media_outreach', 
    COUNT(*) 
FROM media_outreach
UNION ALL
SELECT 
    'media_assets', 
    COUNT(*) 
FROM media_assets;

-- ========================================
-- Check if required columns exist
-- ========================================
SELECT 
    'Required columns check:' as info;

SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'memoryvault_items' AND column_name = 'user_id') 
        THEN '✅ memoryvault_items.user_id exists'
        ELSE '❌ memoryvault_items.user_id MISSING'
    END as status
UNION ALL
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'memoryvault_items' AND column_name = 'category') 
        THEN '✅ memoryvault_items.category exists'
        ELSE '❌ memoryvault_items.category MISSING'
    END
UNION ALL
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaigns' AND column_name = 'objectives') 
        THEN '✅ campaigns.objectives exists'
        ELSE '❌ campaigns.objectives MISSING'
    END
UNION ALL
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaigns' AND column_name = 'user_id') 
        THEN '✅ campaigns.user_id exists'
        ELSE '❌ campaigns.user_id MISSING'
    END;