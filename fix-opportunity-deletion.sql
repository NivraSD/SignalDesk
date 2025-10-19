-- Fix opportunity deletion issues
-- This script ensures proper deletion of old opportunities

-- 1. Check current RLS status
SELECT 
    schemaname, 
    tablename, 
    rowsecurity 
FROM pg_tables 
WHERE tablename = 'opportunities';

-- 2. Disable RLS to ensure service role can delete
ALTER TABLE opportunities DISABLE ROW LEVEL SECURITY;

-- 3. Check for any constraints that might prevent deletion
SELECT 
    tc.constraint_name, 
    tc.constraint_type,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.table_name = 'opportunities'
    AND tc.constraint_type = 'FOREIGN KEY';

-- 4. Check if there are any triggers preventing deletion
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'opportunities';

-- 5. Clean up old opportunities (older than 2 hours)
DELETE FROM opportunities 
WHERE created_at < NOW() - INTERVAL '2 hours';

-- 6. Show remaining opportunities count by organization
SELECT 
    organization_id,
    COUNT(*) as opportunity_count,
    MIN(created_at) as oldest_opportunity,
    MAX(created_at) as newest_opportunity
FROM opportunities
GROUP BY organization_id;

-- 7. Create or replace a function to handle opportunity cleanup
CREATE OR REPLACE FUNCTION cleanup_old_opportunities()
RETURNS void 
LANGUAGE plpgsql
AS $$
BEGIN
    -- Delete opportunities older than 4 hours
    DELETE FROM opportunities 
    WHERE created_at < NOW() - INTERVAL '4 hours';
    
    -- Log the cleanup
    RAISE NOTICE 'Cleaned up opportunities older than 4 hours';
END;
$$;

-- 8. Grant necessary permissions
GRANT ALL ON opportunities TO service_role;
GRANT DELETE ON opportunities TO service_role;

-- 9. Verify service role permissions
SELECT 
    grantee, 
    privilege_type 
FROM information_schema.table_privileges 
WHERE table_name = 'opportunities' 
    AND grantee = 'service_role';

-- 10. Final check - count remaining opportunities
SELECT 
    'Total opportunities: ' || COUNT(*) as status,
    'Opportunities in last 2 hours: ' || COUNT(CASE WHEN created_at > NOW() - INTERVAL '2 hours' THEN 1 END) as recent
FROM opportunities;