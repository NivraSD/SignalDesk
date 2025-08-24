-- Complete Supabase Setup for SignalDesk
-- This migration sets up all necessary tables, functions, and policies

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users profile extension (extends auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id),
  username VARCHAR(100) UNIQUE,
  full_name VARCHAR(255),
  avatar_url TEXT,
  role VARCHAR(50) DEFAULT 'member',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Intelligence Targets
CREATE TABLE IF NOT EXISTS intelligence_targets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'competitor', 'topic', 'person', 'company', etc.
  description TEXT,
  keywords TEXT[],
  focus_areas TEXT[],
  active BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, name, type)
);

-- Target Sources
CREATE TABLE IF NOT EXISTS target_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  target_id UUID REFERENCES intelligence_targets(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  url TEXT,
  type VARCHAR(50), -- 'website', 'rss', 'api', 'social', etc.
  credentials JSONB,
  active BOOLEAN DEFAULT true,
  check_frequency INTEGER DEFAULT 3600, -- seconds
  last_checked TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Monitoring Runs
CREATE TABLE IF NOT EXISTS monitoring_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  target_id UUID REFERENCES intelligence_targets(id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed'
  mode VARCHAR(50) DEFAULT 'comprehensive',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  findings_count INTEGER DEFAULT 0,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Intelligence Findings
CREATE TABLE IF NOT EXISTS intelligence_findings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  target_id UUID REFERENCES intelligence_targets(id) ON DELETE SET NULL,
  monitoring_run_id UUID REFERENCES monitoring_runs(id) ON DELETE SET NULL,
  title VARCHAR(500) NOT NULL,
  content TEXT,
  source VARCHAR(255),
  source_url TEXT,
  relevance_score INTEGER DEFAULT 50,
  sentiment VARCHAR(20), -- 'positive', 'negative', 'neutral'
  tags TEXT[],
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversations (for Claude chat history)
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  title VARCHAR(255),
  messages JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Usage Logs
CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  function_name VARCHAR(100),
  model VARCHAR(100),
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  cost DECIMAL(10, 6),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(50),
  title VARCHAR(255),
  message TEXT,
  read BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Error Logs
CREATE TABLE IF NOT EXISTS error_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  function_name VARCHAR(100),
  error_message TEXT,
  error_stack TEXT,
  metadata JSONB DEFAULT '{}',
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Opportunity Queue
CREATE TABLE IF NOT EXISTS opportunity_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  type VARCHAR(50),
  source VARCHAR(255),
  score INTEGER DEFAULT 50,
  status VARCHAR(50) DEFAULT 'active',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projects
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50),
  status VARCHAR(50) DEFAULT 'active',
  settings JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Content
CREATE TABLE IF NOT EXISTS content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title VARCHAR(500),
  body TEXT,
  type VARCHAR(50),
  status VARCHAR(50) DEFAULT 'draft',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- MemoryVault Items
CREATE TABLE IF NOT EXISTS memoryvault_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  type VARCHAR(50),
  title VARCHAR(500),
  content TEXT,
  tags TEXT[],
  metadata JSONB DEFAULT '{}',
  embedding vector(1536), -- For AI semantic search
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_intelligence_targets_org ON intelligence_targets(organization_id);
CREATE INDEX IF NOT EXISTS idx_intelligence_findings_org ON intelligence_findings(organization_id);
CREATE INDEX IF NOT EXISTS idx_intelligence_findings_target ON intelligence_findings(target_id);
CREATE INDEX IF NOT EXISTS idx_monitoring_runs_org ON monitoring_runs(organization_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_org ON conversations(organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_org ON ai_usage_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_opportunity_queue_org ON opportunity_queue(organization_id);
CREATE INDEX IF NOT EXISTS idx_projects_org ON projects(organization_id);
CREATE INDEX IF NOT EXISTS idx_content_project ON content(project_id);
CREATE INDEX IF NOT EXISTS idx_memoryvault_org ON memoryvault_items(organization_id);

-- Row Level Security (RLS) Policies
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE intelligence_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE target_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitoring_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE intelligence_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunity_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE content ENABLE ROW LEVEL SECURITY;
ALTER TABLE memoryvault_items ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies for authenticated users
CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users can view their organization" ON organizations
  FOR SELECT USING (
    id IN (SELECT organization_id FROM user_profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can manage their organization's targets" ON intelligence_targets
  FOR ALL USING (
    organization_id IN (SELECT organization_id FROM user_profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can view their organization's findings" ON intelligence_findings
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM user_profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can manage their conversations" ON conversations
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can view their notifications" ON notifications
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can manage their organization's projects" ON projects
  FOR ALL USING (
    organization_id IN (SELECT organization_id FROM user_profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can manage their organization's content" ON content
  FOR ALL USING (
    organization_id IN (SELECT organization_id FROM user_profiles WHERE id = auth.uid())
  );

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update triggers
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  
CREATE TRIGGER update_intelligence_targets_updated_at BEFORE UPDATE ON intelligence_targets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  
CREATE TRIGGER update_target_sources_updated_at BEFORE UPDATE ON target_sources
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  
CREATE TRIGGER update_intelligence_findings_updated_at BEFORE UPDATE ON intelligence_findings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  
CREATE TRIGGER update_opportunity_queue_updated_at BEFORE UPDATE ON opportunity_queue
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  
CREATE TRIGGER update_content_updated_at BEFORE UPDATE ON content
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  
CREATE TRIGGER update_memoryvault_items_updated_at BEFORE UPDATE ON memoryvault_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Insert demo organization and user (optional)
DO $$
BEGIN
  -- Check if demo org exists
  IF NOT EXISTS (SELECT 1 FROM organizations WHERE name = 'Demo Organization') THEN
    INSERT INTO organizations (id, name, description)
    VALUES ('d3f4b5c6-7a8b-9c0d-1e2f-3a4b5c6d7e8f', 'Demo Organization', 'Demo organization for testing');
  END IF;
END $$;