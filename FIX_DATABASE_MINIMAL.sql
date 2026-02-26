-- Minimal fix for Supabase RLS and missing tables
-- This version only does what's absolutely necessary

-- Step 1: Ensure users table exists (most critical)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    username VARCHAR(255) UNIQUE,
    full_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user',
    avatar_url TEXT,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Create default organization
INSERT INTO organizations (id, name)
VALUES ('00000000-0000-0000-0000-000000000001', 'Default Organization')
ON CONFLICT (id) DO NOTHING;

-- Step 3: Auto-create user profiles on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.users (id, email, username, organization_id, role)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
        '00000000-0000-0000-0000-000000000001',
        COALESCE(new.raw_user_meta_data->>'role', 'admin')
    )
    ON CONFLICT (id) DO UPDATE
    SET 
        email = EXCLUDED.email,
        updated_at = NOW();
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 4: Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Step 5: Create basic RLS policies
DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can view their organization" ON organizations;
CREATE POLICY "Users can view their organization" ON organizations
    FOR SELECT USING (
        id IN (SELECT organization_id FROM users WHERE id = auth.uid())
    );

-- Step 6: Create RLS policies for tables that have organization_id
DO $$
DECLARE
    tbl RECORD;
BEGIN
    FOR tbl IN 
        SELECT DISTINCT t.tablename 
        FROM pg_tables t
        JOIN information_schema.columns c ON c.table_name = t.tablename
        WHERE t.schemaname = 'public' 
        AND c.column_name = 'organization_id'
        AND t.tablename NOT IN ('users', 'organizations')
    LOOP
        -- Enable RLS
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl.tablename);
        
        -- Drop existing policy if it exists
        EXECUTE format('DROP POLICY IF EXISTS "Users can manage org %I" ON %I', tbl.tablename, tbl.tablename);
        
        -- Create new policy
        EXECUTE format('CREATE POLICY "Users can manage org %I" ON %I FOR ALL USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()))', 
                      tbl.tablename, tbl.tablename);
                      
        RAISE NOTICE 'Created RLS policy for table: %', tbl.tablename;
    END LOOP;
END $$;

-- Step 7: Grant basic permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

-- Step 8: Show what we've done
SELECT 'Summary of changes:' as info;

SELECT 
    'Users table exists' as check_item,
    CASE 
        WHEN EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'users') 
        THEN '✅ Yes' 
        ELSE '❌ No' 
    END as status
UNION ALL
SELECT 
    'RLS Policies created' as check_item,
    COUNT(*)::text || ' policies' as status
FROM pg_policies 
WHERE schemaname = 'public'
UNION ALL
SELECT 
    'Tables with organization_id' as check_item,
    COUNT(DISTINCT table_name)::text || ' tables' as status
FROM information_schema.columns 
WHERE table_schema = 'public' AND column_name = 'organization_id';

-- Final message
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ Basic setup complete!';
    RAISE NOTICE '';
    RAISE NOTICE 'What was done:';
    RAISE NOTICE '1. Created users table (if missing)';
    RAISE NOTICE '2. Set up auto-creation of user profiles';
    RAISE NOTICE '3. Created RLS policies for data access';
    RAISE NOTICE '4. Granted necessary permissions';
    RAISE NOTICE '';
    RAISE NOTICE 'You can now proceed with Vercel deployment!';
END $$;