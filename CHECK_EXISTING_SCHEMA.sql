-- Check what tables and columns exist in the database
-- Run this first to understand current state

-- List all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check if organizations table exists and its columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'organizations' 
ORDER BY ordinal_position;

-- Check if intelligence_findings exists and its columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'intelligence_findings' 
ORDER BY ordinal_position;

-- Check if intelligence_targets exists and its columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'intelligence_targets' 
ORDER BY ordinal_position;

-- Check if memory_vault exists
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_name = 'memory_vault'
) as memory_vault_exists;

-- Check if opportunity_queue exists
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_name = 'opportunity_queue'
) as opportunity_queue_exists;