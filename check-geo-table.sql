-- Check if geo_intelligence table exists and RLS status
SELECT
    schemaname,
    tablename,
    tableowner,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'geo_intelligence';

-- Check policies
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
WHERE tablename = 'geo_intelligence';

-- Check if service role can insert
GRANT ALL ON TABLE public.geo_intelligence TO service_role;
GRANT ALL ON TABLE public.geo_intelligence TO postgres;
