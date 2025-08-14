-- SignalDesk Supabase Schema Setup (SAFE VERSION - No Destructive Operations)
-- Run this in your Supabase SQL editor for a fresh project

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- Create organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  industry VARCHAR(100),
  size VARCHAR(50),
  configuration JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create users table (integrates with Supabase Auth)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  organization_id VARCHAR(255) REFERENCES organizations(id),
  role VARCHAR(50) DEFAULT 'member',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  organization_id VARCHAR(255) REFERENCES organizations(id),
  status VARCHAR(50) DEFAULT 'active',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create content table
CREATE TABLE IF NOT EXISTS content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(50), -- 'press_release', 'pitch', 'social_post', etc.
  title VARCHAR(500),
  content TEXT,
  metadata JSONB DEFAULT '{}',
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  organization_id VARCHAR(255) REFERENCES organizations(id),
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Intelligence & Monitoring Tables
CREATE TABLE IF NOT EXISTS intelligence_targets (
  id SERIAL PRIMARY KEY,
  organization_id VARCHAR(255) NOT NULL REFERENCES organizations(id),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'competitor', 'topic', 'stakeholder'
  priority VARCHAR(20) DEFAULT 'medium',
  keywords TEXT[],
  sources JSONB DEFAULT '{}',
  monitoring_config JSONB DEFAULT '{}',
  active BOOLEAN DEFAULT true,
  last_monitored TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS intelligence_findings (
  id SERIAL PRIMARY KEY,
  organization_id VARCHAR(255) NOT NULL REFERENCES organizations(id),
  target_id INTEGER REFERENCES intelligence_targets(id) ON DELETE CASCADE,
  finding_type VARCHAR(100),
  title TEXT,
  content TEXT,
  source_url TEXT,
  relevance_score DECIMAL(3,2),
  sentiment VARCHAR(20),
  metadata JSONB DEFAULT '{}',
  ai_analysis TEXT,
  action_required BOOLEAN DEFAULT false,
  processed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS monitoring_runs (
  id SERIAL PRIMARY KEY,
  organization_id VARCHAR(255) NOT NULL REFERENCES organizations(id),
  target_id INTEGER REFERENCES intelligence_targets(id),
  status VARCHAR(50),
  findings_count INTEGER DEFAULT 0,
  error_message TEXT,
  execution_time INTEGER, -- milliseconds
  metadata JSONB DEFAULT '{}',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Opportunities Tables
CREATE TABLE IF NOT EXISTS opportunity_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id VARCHAR(255) REFERENCES organizations(id),
  title VARCHAR(500),
  type VARCHAR(100),
  description TEXT,
  score INTEGER,
  urgency VARCHAR(20),
  relevant_stakeholders JSONB DEFAULT '[]',
  suggested_action TEXT,
  deadline VARCHAR(100),
  keywords TEXT[],
  status VARCHAR(50) DEFAULT 'active',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS opportunity_patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50),
  description TEXT,
  signals JSONB DEFAULT '{}',
  success_criteria JSONB DEFAULT '{}',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- MemoryVault Tables with Vector Support
CREATE TABLE IF NOT EXISTS memoryvault_items (
  id SERIAL PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  organization_id VARCHAR(255) REFERENCES organizations(id),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100),
  content TEXT,
  metadata JSONB DEFAULT '{}',
  embedding vector(1536), -- For semantic search with OpenAI embeddings
  access_count INTEGER DEFAULT 0,
  last_accessed TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS memoryvault_versions (
  id SERIAL PRIMARY KEY,
  item_id INTEGER REFERENCES memoryvault_items(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  content TEXT,
  metadata JSONB DEFAULT '{}',
  changed_by UUID REFERENCES users(id),
  change_summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS memoryvault_relationships (
  id SERIAL PRIMARY KEY,
  source_item_id INTEGER REFERENCES memoryvault_items(id) ON DELETE CASCADE,
  target_item_id INTEGER REFERENCES memoryvault_items(id) ON DELETE CASCADE,
  relationship_type VARCHAR(100),
  strength DECIMAL(3,2) DEFAULT 1.0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance (IF NOT EXISTS for safety)
CREATE INDEX IF NOT EXISTS idx_users_organization ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_projects_user ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_org ON projects(organization_id);
CREATE INDEX IF NOT EXISTS idx_content_user ON content(user_id);
CREATE INDEX IF NOT EXISTS idx_content_project ON content(project_id);
CREATE INDEX IF NOT EXISTS idx_intelligence_targets_org ON intelligence_targets(organization_id);
CREATE INDEX IF NOT EXISTS idx_intelligence_findings_org ON intelligence_findings(organization_id);
CREATE INDEX IF NOT EXISTS idx_intelligence_findings_target ON intelligence_findings(target_id);
CREATE INDEX IF NOT EXISTS idx_intelligence_findings_created ON intelligence_findings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_monitoring_runs_org ON monitoring_runs(organization_id);
CREATE INDEX IF NOT EXISTS idx_opportunity_queue_org ON opportunity_queue(organization_id);
CREATE INDEX IF NOT EXISTS idx_opportunity_queue_status ON opportunity_queue(status);
CREATE INDEX IF NOT EXISTS idx_memoryvault_items_project ON memoryvault_items(project_id);
CREATE INDEX IF NOT EXISTS idx_memoryvault_items_org ON memoryvault_items(organization_id);

-- Vector similarity search index (check if exists first)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'memoryvault_items_embedding_idx'
  ) THEN
    CREATE INDEX memoryvault_items_embedding_idx ON memoryvault_items 
    USING ivfflat (embedding vector_cosine_ops);
  END IF;
END $$;

-- Enable Row Level Security (RLS)
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE content ENABLE ROW LEVEL SECURITY;
ALTER TABLE intelligence_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE intelligence_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitoring_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunity_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE memoryvault_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (only if they don't exist)
DO $$ 
BEGIN
  -- Organizations policies
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'organizations' AND policyname = 'Users can view own organization data'
  ) THEN
    CREATE POLICY "Users can view own organization data" ON organizations
      FOR SELECT USING (id = current_setting('app.current_organization', true)::text);
  END IF;

  -- Users policies
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can view own organization users'
  ) THEN
    CREATE POLICY "Users can view own organization users" ON users
      FOR SELECT USING (organization_id = current_setting('app.current_organization', true)::text);
  END IF;

  -- Projects policies
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'projects' AND policyname = 'Users can manage own organization projects'
  ) THEN
    CREATE POLICY "Users can manage own organization projects" ON projects
      FOR ALL USING (organization_id = current_setting('app.current_organization', true)::text);
  END IF;

  -- Content policies
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'content' AND policyname = 'Users can manage own organization content'
  ) THEN
    CREATE POLICY "Users can manage own organization content" ON content
      FOR ALL USING (organization_id = current_setting('app.current_organization', true)::text);
  END IF;

  -- Intelligence targets policies
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'intelligence_targets' AND policyname = 'Users can manage own organization intelligence'
  ) THEN
    CREATE POLICY "Users can manage own organization intelligence" ON intelligence_targets
      FOR ALL USING (organization_id = current_setting('app.current_organization', true)::text);
  END IF;

  -- Intelligence findings policies
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'intelligence_findings' AND policyname = 'Users can view own organization findings'
  ) THEN
    CREATE POLICY "Users can view own organization findings" ON intelligence_findings
      FOR ALL USING (organization_id = current_setting('app.current_organization', true)::text);
  END IF;

  -- Monitoring runs policies
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'monitoring_runs' AND policyname = 'Users can view own organization monitoring'
  ) THEN
    CREATE POLICY "Users can view own organization monitoring" ON monitoring_runs
      FOR ALL USING (organization_id = current_setting('app.current_organization', true)::text);
  END IF;

  -- Opportunity queue policies
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'opportunity_queue' AND policyname = 'Users can manage own organization opportunities'
  ) THEN
    CREATE POLICY "Users can manage own organization opportunities" ON opportunity_queue
      FOR ALL USING (organization_id = current_setting('app.current_organization', true)::text);
  END IF;

  -- MemoryVault policies
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'memoryvault_items' AND policyname = 'Users can manage own organization memory'
  ) THEN
    CREATE POLICY "Users can manage own organization memory" ON memoryvault_items
      FOR ALL USING (organization_id = current_setting('app.current_organization', true)::text);
  END IF;
END $$;

-- Enable real-time subscriptions for monitoring tables
ALTER TABLE intelligence_findings REPLICA IDENTITY FULL;
ALTER TABLE intelligence_targets REPLICA IDENTITY FULL;
ALTER TABLE monitoring_runs REPLICA IDENTITY FULL;
ALTER TABLE opportunity_queue REPLICA IDENTITY FULL;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers (only if they don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_organizations_updated_at') THEN
    CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_updated_at') THEN
    CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_projects_updated_at') THEN
    CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_content_updated_at') THEN
    CREATE TRIGGER update_content_updated_at BEFORE UPDATE ON content
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_intelligence_targets_updated_at') THEN
    CREATE TRIGGER update_intelligence_targets_updated_at BEFORE UPDATE ON intelligence_targets
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_opportunity_queue_updated_at') THEN
    CREATE TRIGGER update_opportunity_queue_updated_at BEFORE UPDATE ON opportunity_queue
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_memoryvault_items_updated_at') THEN
    CREATE TRIGGER update_memoryvault_items_updated_at BEFORE UPDATE ON memoryvault_items
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Insert demo organization and user
INSERT INTO organizations (id, name, industry, size, configuration)
VALUES ('demo-org', 'Demo Organization', 'Technology', 'startup', 
  '{"features": ["monitoring", "opportunities", "content", "memoryvault"], "tier": "premium"}')
ON CONFLICT (id) DO NOTHING;

-- Success message
DO $$ 
BEGIN
  RAISE NOTICE 'SignalDesk schema setup completed successfully!';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Create a user in Authentication tab';
  RAISE NOTICE '2. Run the demo data script with your user ID';
  RAISE NOTICE '3. Enable realtime on the monitoring tables';
END $$;