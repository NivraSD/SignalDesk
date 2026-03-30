-- Fix Database Schema and RLS Policies for SignalDesk
-- This version works with your existing schema

-- Step 1: Add slug column to organizations if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'organizations' AND column_name = 'slug') THEN
        ALTER TABLE organizations ADD COLUMN slug VARCHAR(255) UNIQUE;
        UPDATE organizations SET slug = LOWER(REPLACE(name, ' ', '-')) WHERE slug IS NULL;
    END IF;
END $$;

-- Step 2: Create users table if it doesn't exist
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

-- Step 3: Create a default organization if none exists
INSERT INTO organizations (id, name)
VALUES ('00000000-0000-0000-0000-000000000001', 'Default Organization')
ON CONFLICT (id) DO NOTHING;

-- Update slug for default org if needed
UPDATE organizations 
SET slug = 'default' 
WHERE id = '00000000-0000-0000-0000-000000000001' AND slug IS NULL;

-- Step 4: Create trigger to auto-create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.users (id, email, username, organization_id, role)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
        '00000000-0000-0000-0000-000000000001', -- Default org
        COALESCE(new.raw_user_meta_data->>'role', 'admin')
    )
    ON CONFLICT (id) DO UPDATE
    SET 
        email = EXCLUDED.email,
        updated_at = NOW();
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 5: Enable RLS on core tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Check and enable RLS on existing tables
DO $$
DECLARE
    tbl RECORD;
BEGIN
    FOR tbl IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN (
            'intelligence_targets', 'intelligence_findings', 'monitoring_runs',
            'opportunity_queue', 'projects', 'todos', 'content', 'monitoring_alerts'
        )
    LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl.tablename);
    END LOOP;
END $$;

-- Step 6: Drop all existing policies and create new ones
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop existing policies
    FOR r IN (SELECT tablename, policyname 
              FROM pg_policies 
              WHERE schemaname = 'public') 
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
    END LOOP;
    
    -- Create new policies
    -- Users table policies
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        CREATE POLICY "Users can view own profile" ON users
            FOR SELECT USING (auth.uid() = id);
        CREATE POLICY "Users can update own profile" ON users
            FOR UPDATE USING (auth.uid() = id);
    END IF;
    
    -- Organizations policies
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organizations') THEN
        CREATE POLICY "Users can view their organization" ON organizations
            FOR SELECT USING (
                id IN (SELECT organization_id FROM users WHERE id = auth.uid())
            );
    END IF;
    
    -- Create policies for tables with organization_id
    FOR r IN 
        SELECT tablename 
        FROM pg_tables t
        WHERE schemaname = 'public' 
        AND EXISTS (
            SELECT 1 FROM information_schema.columns c 
            WHERE c.table_name = t.tablename 
            AND c.column_name = 'organization_id'
        )
        AND tablename NOT IN ('users', 'organizations')
    LOOP
        EXECUTE format('CREATE POLICY "Users can manage org %I" ON %I FOR ALL USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()))', 
                      r.tablename, r.tablename);
    END LOOP;
END $$;

-- Step 7: Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- For authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- For anon users (minimal access)
GRANT SELECT ON organizations TO anon;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        GRANT SELECT ON users TO anon;
    END IF;
END $$;

-- Step 8: Create indexes for performance (only if tables exist)
DO $$
DECLARE
    idx_sql TEXT;
BEGIN
    -- Create indexes only for existing tables
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        CREATE INDEX IF NOT EXISTS idx_users_org ON users(organization_id);
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'intelligence_targets') THEN
        CREATE INDEX IF NOT EXISTS idx_intelligence_targets_org ON intelligence_targets(organization_id);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'intelligence_findings') THEN
        CREATE INDEX IF NOT EXISTS idx_intelligence_findings_org ON intelligence_findings(organization_id);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'monitoring_runs') THEN
        CREATE INDEX IF NOT EXISTS idx_monitoring_runs_org ON monitoring_runs(organization_id);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'opportunity_queue') THEN
        CREATE INDEX IF NOT EXISTS idx_opportunity_queue_org ON opportunity_queue(organization_id);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'projects') THEN
        CREATE INDEX IF NOT EXISTS idx_projects_org ON projects(organization_id);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'content') THEN
        CREATE INDEX IF NOT EXISTS idx_content_org ON content(organization_id);
        CREATE INDEX IF NOT EXISTS idx_content_project ON content(project_id);
    END IF;
END $$;

-- Step 9: Final verification
DO $$
DECLARE
    table_count INTEGER;
    policy_count INTEGER;
    user_table_exists BOOLEAN;
BEGIN
    -- Check if users table exists
    SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'users') INTO user_table_exists;
    
    -- Count tables
    SELECT COUNT(*) INTO table_count FROM information_schema.tables WHERE table_schema = 'public';
    
    -- Count policies
    SELECT COUNT(*) INTO policy_count FROM pg_policies WHERE schemaname = 'public';
    
    RAISE NOTICE '✅ Database setup complete!';
    RAISE NOTICE '';
    RAISE NOTICE 'Status:';
    RAISE NOTICE '  - Tables in public schema: %', table_count;
    RAISE NOTICE '  - RLS policies created: %', policy_count;
    RAISE NOTICE '  - Users table exists: %', user_table_exists;
    RAISE NOTICE '';
    
    IF NOT user_table_exists THEN
        RAISE WARNING '⚠️  Users table does not exist! You may need to run the full schema setup.';
    ELSE
        RAISE NOTICE '✅ Users table is ready';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Test by creating a user account';
    RAISE NOTICE '2. Check that user profile is auto-created';
    RAISE NOTICE '3. Verify data access works correctly';
END $$;

-- Show summary
SELECT 
    'Tables' as category,
    COUNT(*) as count
FROM information_schema.tables 
WHERE table_schema = 'public'
UNION ALL
SELECT 
    'RLS Policies' as category,
    COUNT(*) as count
FROM pg_policies 
WHERE schemaname = 'public'
UNION ALL
SELECT 
    'Users in System' as category,
    COUNT(*) as count
FROM auth.users;