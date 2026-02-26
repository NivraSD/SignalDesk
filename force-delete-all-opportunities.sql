-- FORCE DELETE ALL OPPORTUNITIES
-- This script completely clears the opportunities table

-- 1. Show current count
SELECT COUNT(*) as "Current opportunity count" FROM opportunities;

-- 2. Show the opportunities that exist
SELECT id, organization_id, title, created_at 
FROM opportunities 
ORDER BY created_at DESC;

-- 3. Disable any RLS that might be blocking deletion
ALTER TABLE opportunities DISABLE ROW LEVEL SECURITY;

-- 4. FORCE DELETE ALL - no conditions
DELETE FROM opportunities;

-- 5. Verify deletion
SELECT COUNT(*) as "Count after deletion (should be 0)" FROM opportunities;

-- 6. Reset the ID sequence if it exists
-- First check what sequences exist for the opportunities table
DO $$ 
BEGIN
    -- Only reset if sequence exists
    IF EXISTS (SELECT 1 FROM pg_class WHERE relkind = 'S' AND relname = 'opportunities_id_seq') THEN
        ALTER SEQUENCE opportunities_id_seq RESTART WITH 1;
    END IF;
END $$;

-- 7. Confirm table is empty
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ SUCCESS: All opportunities deleted'
        ELSE '❌ FAILED: ' || COUNT(*) || ' opportunities still remain'
    END as status
FROM opportunities;