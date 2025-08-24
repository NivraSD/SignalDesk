-- SignalDesk Supabase Database Setup
-- Run this in your Supabase SQL Editor to create all required tables and policies

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search

-- Create organizations table
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255),
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create users table (extends auth.users)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user',
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create intelligence_targets table
CREATE TABLE IF NOT EXISTS intelligence_targets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'competitor', 'industry', 'topic', etc.
    config JSONB DEFAULT '{}',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create intelligence_findings table
CREATE TABLE IF NOT EXISTS intelligence_findings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    target_id UUID REFERENCES intelligence_targets(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    content TEXT,
    source VARCHAR(255),
    source_url TEXT,
    relevance_score INTEGER DEFAULT 0,
    sentiment VARCHAR(20),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create monitoring_runs table
CREATE TABLE IF NOT EXISTS monitoring_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    target_id UUID REFERENCES intelligence_targets(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'pending', -- pending, running, completed, failed
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    findings_count INTEGER DEFAULT 0,
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create opportunity_queue table
CREATE TABLE IF NOT EXISTS opportunity_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    score DECIMAL(5,2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'active', -- active, in_progress, completed, archived
    source VARCHAR(255),
    nvs_analysis JSONB DEFAULT '{}', -- Narrative Vacuum Score analysis
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'draft', -- draft, active, completed, archived
    type VARCHAR(50), -- campaign, press_release, content_series, etc.
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create content table
CREATE TABLE IF NOT EXISTS content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    title VARCHAR(255),
    type VARCHAR(50), -- press_release, social_post, article, etc.
    content TEXT,
    status VARCHAR(50) DEFAULT 'draft', -- draft, review, approved, published
    version INTEGER DEFAULT 1,
    metadata JSONB DEFAULT '{}',
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create memoryvault_items table (for knowledge management)
CREATE TABLE IF NOT EXISTS memoryvault_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    title VARCHAR(255),
    content TEXT NOT NULL,
    type VARCHAR(50), -- fact, insight, template, reference, etc.
    tags TEXT[],
    embedding vector(1536), -- For AI similarity search
    metadata JSONB DEFAULT '{}',
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_intelligence_findings_org ON intelligence_findings(organization_id);
CREATE INDEX IF NOT EXISTS idx_intelligence_findings_created ON intelligence_findings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_monitoring_runs_org ON monitoring_runs(organization_id);
CREATE INDEX IF NOT EXISTS idx_opportunity_queue_org ON opportunity_queue(organization_id);
CREATE INDEX IF NOT EXISTS idx_opportunity_queue_score ON opportunity_queue(score DESC);
CREATE INDEX IF NOT EXISTS idx_projects_org ON projects(organization_id);
CREATE INDEX IF NOT EXISTS idx_content_project ON content(project_id);
CREATE INDEX IF NOT EXISTS idx_memoryvault_org ON memoryvault_items(organization_id);

-- Full text search indexes
CREATE INDEX IF NOT EXISTS idx_memoryvault_content_search ON memoryvault_items USING gin(to_tsvector('english', content));
CREATE INDEX IF NOT EXISTS idx_intelligence_findings_search ON intelligence_findings USING gin(to_tsvector('english', title || ' ' || COALESCE(content, '')));

-- Enable Row Level Security (RLS)
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE intelligence_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE intelligence_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitoring_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunity_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE content ENABLE ROW LEVEL SECURITY;
ALTER TABLE memoryvault_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Organizations: Users can only see their own organization
CREATE POLICY "Users can view own organization" ON organizations
    FOR SELECT USING (
        id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

-- Users: Can see users in same organization
CREATE POLICY "Users can view users in same org" ON users
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (id = auth.uid());

-- Intelligence Targets: Organization-based access
CREATE POLICY "Users can view org intelligence targets" ON intelligence_targets
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

-- Intelligence Findings: Organization-based access
CREATE POLICY "Users can view org intelligence findings" ON intelligence_findings
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

-- Monitoring Runs: Organization-based access
CREATE POLICY "Users can view org monitoring runs" ON monitoring_runs
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

-- Opportunity Queue: Organization-based access
CREATE POLICY "Users can manage org opportunities" ON opportunity_queue
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

-- Projects: Organization-based access
CREATE POLICY "Users can manage org projects" ON projects
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

-- Content: Organization-based access
CREATE POLICY "Users can manage org content" ON content
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

-- MemoryVault: Organization-based access
CREATE POLICY "Users can manage org memory items" ON memoryvault_items
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

-- Create trigger to auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply the trigger to all tables with updated_at
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_intelligence_targets_updated_at BEFORE UPDATE ON intelligence_targets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_intelligence_findings_updated_at BEFORE UPDATE ON intelligence_findings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_opportunity_queue_updated_at BEFORE UPDATE ON opportunity_queue
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_updated_at BEFORE UPDATE ON content
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_memoryvault_items_updated_at BEFORE UPDATE ON memoryvault_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on signup
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Insert default organization and admin user
DO $$
DECLARE
    org_id UUID;
    user_id UUID;
BEGIN
    -- Check if default organization exists
    SELECT id INTO org_id FROM organizations WHERE name = 'SignalDesk Demo';
    
    IF org_id IS NULL THEN
        -- Create default organization
        INSERT INTO organizations (name, domain, settings)
        VALUES ('SignalDesk Demo', 'signaldesk.com', '{"tier": "enterprise"}')
        RETURNING id INTO org_id;
    END IF;
    
    -- Update admin2@signaldesk.com user with organization if exists
    UPDATE users 
    SET organization_id = org_id, 
        role = 'admin',
        full_name = 'Admin User'
    WHERE email = 'admin2@signaldesk.com';
    
    RAISE NOTICE 'Default organization setup complete: %', org_id;
END $$;

-- Grant necessary permissions for real-time
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated;

-- Enable real-time for specific tables
ALTER PUBLICATION supabase_realtime ADD TABLE intelligence_findings;
ALTER PUBLICATION supabase_realtime ADD TABLE monitoring_runs;
ALTER PUBLICATION supabase_realtime ADD TABLE opportunity_queue;