-- Complete Supabase Setup Script for SignalDesk
-- Run this in the Supabase SQL Editor to set up all required tables and functions

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search
CREATE EXTENSION IF NOT EXISTS "vector"; -- For AI embeddings (if available)

-- Drop existing tables if they exist (be careful in production!)
-- Comment these out if you want to preserve existing data
DROP TABLE IF EXISTS adaptive_learning CASCADE;
DROP TABLE IF EXISTS campaign_intelligence CASCADE;
DROP TABLE IF EXISTS memoryvault_items CASCADE;
DROP TABLE IF EXISTS opportunity_queue CASCADE;
DROP TABLE IF EXISTS monitoring_runs CASCADE;
DROP TABLE IF EXISTS intelligence_findings CASCADE;
DROP TABLE IF EXISTS intelligence_targets CASCADE;
DROP TABLE IF EXISTS content CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;

-- Create organizations table
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create users table (extends auth.users)
CREATE TABLE users (
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

-- Create projects table
CREATE TABLE projects (
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

-- Create content table
CREATE TABLE content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'article', 'email', 'social', etc.
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

-- Create intelligence_targets table
CREATE TABLE intelligence_targets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'person', 'company', 'topic', etc.
    profile JSONB DEFAULT '{}',
    monitoring_config JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create intelligence_findings table
CREATE TABLE intelligence_findings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    target_id UUID REFERENCES intelligence_targets(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'insight', 'event', 'trend', etc.
    title VARCHAR(500) NOT NULL,
    content TEXT,
    source VARCHAR(255),
    relevance_score FLOAT DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    is_actionable BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create monitoring_runs table
CREATE TABLE monitoring_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    target_id UUID REFERENCES intelligence_targets(id),
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed'
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    findings_count INTEGER DEFAULT 0,
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create opportunity_queue table
CREATE TABLE opportunity_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'content', 'outreach', 'campaign', etc.
    title VARCHAR(500) NOT NULL,
    description TEXT,
    score FLOAT DEFAULT 0,
    priority VARCHAR(20) DEFAULT 'medium',
    status VARCHAR(50) DEFAULT 'active',
    target_id UUID REFERENCES intelligence_targets(id),
    metadata JSONB DEFAULT '{}',
    expires_at TIMESTAMP WITH TIME ZONE,
    actioned_at TIMESTAMP WITH TIME ZONE,
    actioned_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create memoryvault_items table
CREATE TABLE memoryvault_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'fact', 'preference', 'interaction', etc.
    category VARCHAR(100),
    content TEXT NOT NULL,
    source VARCHAR(255),
    confidence_score FLOAT DEFAULT 1.0,
    metadata JSONB DEFAULT '{}',
    embedding vector(1536), -- For AI similarity search
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create campaign_intelligence table
CREATE TABLE campaign_intelligence (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    campaign_name VARCHAR(255) NOT NULL,
    target_audience JSONB DEFAULT '{}',
    objectives JSONB DEFAULT '[]',
    strategies JSONB DEFAULT '[]',
    tactics JSONB DEFAULT '[]',
    performance_data JSONB DEFAULT '{}',
    insights JSONB DEFAULT '[]',
    status VARCHAR(50) DEFAULT 'planning',
    start_date DATE,
    end_date DATE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create adaptive_learning table
CREATE TABLE adaptive_learning (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    model_type VARCHAR(50) NOT NULL, -- 'content', 'targeting', 'timing', etc.
    input_data JSONB NOT NULL,
    output_data JSONB NOT NULL,
    feedback JSONB DEFAULT '{}',
    performance_score FLOAT,
    is_successful BOOLEAN,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_organization ON users(organization_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_projects_organization ON projects(organization_id);
CREATE INDEX idx_content_project ON content(project_id);
CREATE INDEX idx_content_organization ON content(organization_id);
CREATE INDEX idx_intelligence_targets_organization ON intelligence_targets(organization_id);
CREATE INDEX idx_intelligence_findings_organization ON intelligence_findings(organization_id);
CREATE INDEX idx_intelligence_findings_target ON intelligence_findings(target_id);
CREATE INDEX idx_monitoring_runs_organization ON monitoring_runs(organization_id);
CREATE INDEX idx_opportunity_queue_organization ON opportunity_queue(organization_id);
CREATE INDEX idx_memoryvault_organization ON memoryvault_items(organization_id);
CREATE INDEX idx_campaign_intelligence_organization ON campaign_intelligence(organization_id);
CREATE INDEX idx_adaptive_learning_organization ON adaptive_learning(organization_id);

-- Text search indexes
CREATE INDEX idx_content_search ON content USING gin(to_tsvector('english', content || ' ' || COALESCE(title, '')));
CREATE INDEX idx_memoryvault_search ON memoryvault_items USING gin(to_tsvector('english', content));

-- Enable Row Level Security
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE content ENABLE ROW LEVEL SECURITY;
ALTER TABLE intelligence_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE intelligence_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitoring_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunity_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE memoryvault_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_intelligence ENABLE ROW LEVEL SECURITY;
ALTER TABLE adaptive_learning ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Allow authenticated users to access their organization's data

-- Organizations policies
CREATE POLICY "Users can view their organization" ON organizations
    FOR SELECT USING (
        id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

-- Users policies
CREATE POLICY "Users can view users in their organization" ON users
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (id = auth.uid());

-- Projects policies
CREATE POLICY "Users can view projects in their organization" ON projects
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can create projects in their organization" ON projects
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can update projects in their organization" ON projects
    FOR UPDATE USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

-- Content policies
CREATE POLICY "Users can view content in their organization" ON content
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can create content in their organization" ON content
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can update content in their organization" ON content
    FOR UPDATE USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

-- Similar policies for other tables
CREATE POLICY "View organization data" ON intelligence_targets
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Manage organization data" ON intelligence_targets
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "View organization findings" ON intelligence_findings
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "View organization monitoring" ON monitoring_runs
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "View organization opportunities" ON opportunity_queue
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Manage organization opportunities" ON opportunity_queue
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "View organization memory" ON memoryvault_items
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Manage organization memory" ON memoryvault_items
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "View organization campaigns" ON campaign_intelligence
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Manage organization campaigns" ON campaign_intelligence
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "View organization learning" ON adaptive_learning
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

-- Create trigger functions for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_updated_at BEFORE UPDATE ON content
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_intelligence_targets_updated_at BEFORE UPDATE ON intelligence_targets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_opportunity_queue_updated_at BEFORE UPDATE ON opportunity_queue
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_memoryvault_items_updated_at BEFORE UPDATE ON memoryvault_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaign_intelligence_updated_at BEFORE UPDATE ON campaign_intelligence
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create a function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    default_org_id UUID;
BEGIN
    -- Create a default organization if needed
    INSERT INTO organizations (name, slug)
    VALUES (
        COALESCE(NEW.raw_user_meta_data->>'company_name', NEW.email),
        LOWER(REPLACE(COALESCE(NEW.raw_user_meta_data->>'company_name', SPLIT_PART(NEW.email, '@', 1)), ' ', '-'))
    )
    ON CONFLICT (slug) DO NOTHING
    RETURNING id INTO default_org_id;
    
    -- If no organization was created (slug conflict), get the existing one
    IF default_org_id IS NULL THEN
        SELECT id INTO default_org_id FROM organizations 
        WHERE slug = LOWER(REPLACE(COALESCE(NEW.raw_user_meta_data->>'company_name', SPLIT_PART(NEW.email, '@', 1)), ' ', '-'))
        LIMIT 1;
    END IF;
    
    -- Create user profile
    INSERT INTO public.users (id, email, username, full_name, organization_id, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
        default_org_id,
        COALESCE(NEW.raw_user_meta_data->>'role', 'admin')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert demo data for testing
DO $$
DECLARE
    demo_org_id UUID;
    demo_user_id UUID;
    demo_project_id UUID;
    demo_target_id UUID;
BEGIN
    -- Check if demo org exists
    SELECT id INTO demo_org_id FROM organizations WHERE slug = 'demo-org';
    
    IF demo_org_id IS NULL THEN
        -- Create demo organization
        INSERT INTO organizations (name, slug, settings)
        VALUES ('Demo Organization', 'demo-org', '{"tier": "premium", "features": ["ai", "monitoring", "campaigns"]}')
        RETURNING id INTO demo_org_id;
        
        -- Create demo project
        INSERT INTO projects (organization_id, name, description, status)
        VALUES (demo_org_id, 'Demo Campaign', 'A demonstration campaign project', 'active')
        RETURNING id INTO demo_project_id;
        
        -- Create demo intelligence target
        INSERT INTO intelligence_targets (organization_id, name, type, profile)
        VALUES (
            demo_org_id, 
            'Tech Industry', 
            'topic',
            '{"keywords": ["AI", "cloud", "startup"], "sources": ["techcrunch", "hackernews"]}'
        )
        RETURNING id INTO demo_target_id;
        
        -- Create demo findings
        INSERT INTO intelligence_findings (organization_id, target_id, type, title, content, relevance_score)
        VALUES
        (demo_org_id, demo_target_id, 'insight', 'AI Adoption Accelerating', 'Recent studies show 75% increase in enterprise AI adoption', 0.9),
        (demo_org_id, demo_target_id, 'trend', 'Cloud Migration Wave', 'Major enterprises moving to multi-cloud strategies', 0.85),
        (demo_org_id, demo_target_id, 'event', 'Tech Conference Announced', 'Major tech conference scheduled for next quarter', 0.7);
        
        -- Create demo opportunities
        INSERT INTO opportunity_queue (organization_id, type, title, description, score, priority)
        VALUES
        (demo_org_id, 'content', 'AI Trends Article', 'Write about recent AI adoption trends', 0.95, 'high'),
        (demo_org_id, 'outreach', 'Partner with Tech Influencer', 'Collaborate on cloud migration content', 0.8, 'medium'),
        (demo_org_id, 'campaign', 'Q4 Tech Campaign', 'Launch targeted campaign for tech audience', 0.75, 'medium');
        
        RAISE NOTICE 'Demo data created successfully';
    ELSE
        RAISE NOTICE 'Demo organization already exists';
    END IF;
END $$;

-- Grant necessary permissions for public access (carefully!)
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Output success message
DO $$
BEGIN
    RAISE NOTICE 'SignalDesk database setup completed successfully!';
    RAISE NOTICE 'Tables created: organizations, users, projects, content, intelligence_targets, intelligence_findings, monitoring_runs, opportunity_queue, memoryvault_items, campaign_intelligence, adaptive_learning';
    RAISE NOTICE 'Row Level Security enabled with proper policies';
    RAISE NOTICE 'Demo data inserted for testing';
END $$;