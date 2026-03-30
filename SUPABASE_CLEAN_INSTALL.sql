-- SUPABASE CLEAN INSTALL - NUCLEAR RESET
-- This will completely reset your database to work properly with Supabase Auth

-- Step 1: DROP EVERYTHING (be careful, this deletes ALL data)
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;

-- Restore default permissions
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO anon;
GRANT ALL ON SCHEMA public TO authenticated;
GRANT ALL ON SCHEMA public TO service_role;

-- Step 2: Create the CORRECT schema for Supabase

-- Organizations table (MUST BE CREATED FIRST)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    industry VARCHAR(100),
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Profiles (extends Supabase auth.users)
-- This replaces the problematic custom users table
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255),
    name VARCHAR(255),
    company VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user',
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Projects table
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    campaign_name VARCHAR(255),
    industry VARCHAR(100),
    project_type VARCHAR(100),
    description TEXT,
    status VARCHAR(50) DEFAULT 'Planning',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Campaigns table
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100),
    status VARCHAR(50) DEFAULT 'draft',
    brief TEXT,
    goals JSONB,
    target_audience JSONB,
    budget DECIMAL(12,2),
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- MemoryVault documents
CREATE TABLE memory_vault_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100),
    size VARCHAR(50),
    content TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Campaign Intelligence
CREATE TABLE campaign_intelligence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    brief TEXT,
    analysis JSONB,
    recommendations JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Intelligence Findings (for monitoring)
CREATE TABLE intelligence_findings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    source VARCHAR(255),
    title TEXT,
    content TEXT,
    url TEXT,
    relevance_score INTEGER,
    sentiment VARCHAR(50),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Opportunity Queue
CREATE TABLE opportunity_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    title VARCHAR(255),
    description TEXT,
    score INTEGER,
    status VARCHAR(50) DEFAULT 'pending',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP
);

-- Todos table
CREATE TABLE todos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Content table
CREATE TABLE content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    type VARCHAR(100),
    title VARCHAR(255),
    body TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_vault_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_intelligence ENABLE ROW LEVEL SECURITY;
ALTER TABLE intelligence_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunity_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE content ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for organizations
CREATE POLICY "Users can view their organization" ON organizations
    FOR SELECT USING (
        id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    );

-- RLS Policies for projects
CREATE POLICY "Users can view own projects" ON projects
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create projects" ON projects
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own projects" ON projects
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own projects" ON projects
    FOR DELETE USING (user_id = auth.uid());

-- RLS Policies for other tables
CREATE POLICY "Users can manage own todos" ON todos
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can view org intelligence" ON intelligence_findings
    FOR SELECT USING (
        organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    );

CREATE POLICY "Users can view org opportunities" ON opportunity_queue
    FOR SELECT USING (
        organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    );

CREATE POLICY "Users can view their content" ON content
    FOR SELECT USING (
        project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can view their campaign intelligence" ON campaign_intelligence
    FOR SELECT USING (
        project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can view their memory vault" ON memory_vault_documents
    FOR SELECT USING (
        project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can view their campaigns" ON campaigns
    FOR SELECT USING (
        project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
    );

-- Function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, email, name)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for better performance
CREATE INDEX idx_profiles_organization ON profiles(organization_id);
CREATE INDEX idx_projects_user ON projects(user_id);
CREATE INDEX idx_projects_org ON projects(organization_id);
CREATE INDEX idx_intelligence_org ON intelligence_findings(organization_id);
CREATE INDEX idx_opportunity_org ON opportunity_queue(organization_id);

-- Insert default organization for testing
INSERT INTO organizations (id, name, industry)
VALUES (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid,
    'SignalDesk Demo Organization',
    'Technology'
);

-- Update function for timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add update triggers for all tables with updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Create profiles for existing auth users (if any)
INSERT INTO profiles (id, email, name)
SELECT 
    id,
    email,
    COALESCE(raw_user_meta_data->>'name', split_part(email, '@', 1))
FROM auth.users
WHERE id NOT IN (SELECT id FROM profiles);

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Database successfully reset and configured for Supabase Auth!';
    RAISE NOTICE 'Your existing auth users now have profiles.';
    RAISE NOTICE 'Login should work correctly now.';
END $$;