-- DIAGNOSE WHY OPPORTUNITIES CAN'T BE DELETED

-- 1. Check RLS status
SELECT 
    'RLS Status' as check_type,
    schemaname, 
    tablename, 
    rowsecurity as "RLS Enabled"
FROM pg_tables 
WHERE tablename = 'opportunities';

-- 2. Check for foreign key constraints (other tables referencing opportunities)
SELECT 
    'Foreign Key Constraints' as check_type,
    tc.constraint_name, 
    tc.table_name as "Table with FK",
    kcu.column_name as "Column with FK",
    ccu.table_name AS "References Table",
    ccu.column_name AS "References Column"
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE ccu.table_name = 'opportunities'
    AND tc.constraint_type = 'FOREIGN KEY';

-- 3. Check for triggers on opportunities table
SELECT 
    'Triggers' as check_type,
    trigger_name,
    event_manipulation as "Trigger Event",
    action_timing as "When",
    action_orientation as "Row/Statement"
FROM information_schema.triggers
WHERE event_object_table = 'opportunities';

-- 4. Check RLS policies
SELECT 
    'RLS Policies' as check_type,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd as "Operation",
    qual as "Using Expression",
    with_check as "With Check Expression"
FROM pg_policies
WHERE tablename = 'opportunities';

-- 5. Check user permissions
SELECT 
    'Permissions' as check_type,
    grantee, 
    privilege_type 
FROM information_schema.table_privileges 
WHERE table_name = 'opportunities'
ORDER BY grantee, privilege_type;

-- 6. Check if there are any locks on the table
SELECT 
    'Table Locks' as check_type,
    pid,
    usename,
    application_name,
    client_addr,
    backend_start,
    state,
    wait_event_type,
    wait_event,
    query
FROM pg_stat_activity
WHERE query ILIKE '%opportunities%'
    AND pid != pg_backend_pid();

-- 7. Try TRUNCATE instead of DELETE (more aggressive)
-- TRUNCATE TABLE opportunities RESTART IDENTITY CASCADE;
-- Uncomment above line if you want to try TRUNCATE

-- 8. Check table owner
SELECT 
    'Table Owner' as check_type,
    schemaname,
    tablename,
    tableowner
FROM pg_tables
WHERE tablename = 'opportunities';