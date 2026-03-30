-- Fix Database Schema and RLS Policies for SignalDesk
-- This script ensures tables exist and RLS policies work correctly

-- Step 1: Create organizations table if it doesn't exist
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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
INSERT INTO organizations (id, name, slug)
VALUES ('00000000-0000-0000-0000-000000000001', 'Default Organization', 'default')
ON CONFLICT (id) DO NOTHING;

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

-- Step 5: Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create tables that depend on users/organizations if they don't exist
CREATE TABLE IF NOT EXISTS intelligence_targets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    profile JSONB DEFAULT '{}',
    monitoring_config JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS intelligence_findings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    target_id UUID REFERENCES intelligence_targets(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(500) NOT NULL,
    content TEXT,
    source_url TEXT,
    relevance_score DECIMAL(3,2),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS monitoring_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    target_id UUID REFERENCES intelligence_targets(id),
    status VARCHAR(50) DEFAULT 'pending',
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    results JSONB DEFAULT '{}',
    error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS opportunity_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    type VARCHAR(50),
    status VARCHAR(50) DEFAULT 'active',
    score DECIMAL(5,2),
    source_data JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'active',
    settings JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS todos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(500),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'draft',
    ai_generated BOOLEAN DEFAULT false,
    performance_metrics JSONB DEFAULT '{}',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS monitoring_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    status VARCHAR(50) DEFAULT 'active',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE intelligence_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE intelligence_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitoring_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunity_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE content ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitoring_alerts ENABLE ROW LEVEL SECURITY;

-- Step 6: Create RLS Policies
-- Drop all existing policies first
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename, policyname 
              FROM pg_policies 
              WHERE schemaname = 'public') 
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
    END LOOP;
END $$;

-- Create new policies for users table
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Create policies for organizations
CREATE POLICY "Users can view their organization" ON organizations
    FOR SELECT USING (
        id IN (SELECT organization_id FROM users WHERE id = auth.uid())
    );

-- Create policies for all other tables based on organization_id
CREATE POLICY "Users can manage org intelligence_targets" ON intelligence_targets
    FOR ALL USING (
        organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())
    );

CREATE POLICY "Users can manage org intelligence_findings" ON intelligence_findings
    FOR ALL USING (
        organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())
    );

CREATE POLICY "Users can manage org monitoring_runs" ON monitoring_runs
    FOR ALL USING (
        organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())
    );

CREATE POLICY "Users can manage org opportunity_queue" ON opportunity_queue
    FOR ALL USING (
        organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())
    );

CREATE POLICY "Users can manage org projects" ON projects
    FOR ALL USING (
        organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())
    );

CREATE POLICY "Users can manage org todos" ON todos
    FOR ALL USING (
        organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())
    );

CREATE POLICY "Users can manage org content" ON content
    FOR ALL USING (
        organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())
    );

CREATE POLICY "Users can manage org monitoring_alerts" ON monitoring_alerts
    FOR ALL USING (
        organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())
    );

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- For authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- For anon users (minimal access)
GRANT SELECT ON organizations TO anon;
GRANT SELECT ON users TO anon;

-- Step 7: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_org ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_intelligence_targets_org ON intelligence_targets(organization_id);
CREATE INDEX IF NOT EXISTS idx_intelligence_findings_org ON intelligence_findings(organization_id);
CREATE INDEX IF NOT EXISTS idx_monitoring_runs_org ON monitoring_runs(organization_id);
CREATE INDEX IF NOT EXISTS idx_opportunity_queue_org ON opportunity_queue(organization_id);
CREATE INDEX IF NOT EXISTS idx_projects_org ON projects(organization_id);
CREATE INDEX IF NOT EXISTS idx_content_org ON content(organization_id);
CREATE INDEX IF NOT EXISTS idx_content_project ON content(project_id);

-- Step 8: Verify everything is set up
DO $$
BEGIN
    RAISE NOTICE 'Database setup complete!';
    RAISE NOTICE 'Tables created/verified: organizations, users, and all dependent tables';
    RAISE NOTICE 'RLS policies created for all tables';
    RAISE NOTICE 'Indexes created for performance';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Test by creating a user account';
    RAISE NOTICE '2. Check that user profile is auto-created';
    RAISE NOTICE '3. Verify data access works correctly';
END $$;

-- Show final status
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
    'Indexes' as category,
    COUNT(*) as count
FROM pg_indexes 
WHERE schemaname = 'public';