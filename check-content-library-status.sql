-- Diagnostic queries to understand the current state

-- 1. Check if content_library table exists
SELECT
  'Table Exists' as check_type,
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'content_library')
    THEN 'YES'
    ELSE 'NO'
  END as result;

-- 2. If table exists, show its columns
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'content_library'
ORDER BY ordinal_position;

-- 3. Check existing indexes
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'content_library';

-- 4. Check row count
SELECT
  'Row Count' as metric,
  COUNT(*) as value
FROM content_library;

-- 5. Check RLS policies
SELECT
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'content_library';