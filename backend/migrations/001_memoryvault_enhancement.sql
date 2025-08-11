-- MemoryVault Enhancement Migration
-- Adds versioning, relationships, and semantic search support

-- Create memoryvault_items table if not exists
CREATE TABLE IF NOT EXISTS memoryvault_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100),
  content TEXT,
  metadata JSONB DEFAULT '{}',
  embedding_id VARCHAR(255), -- Reference to vector DB
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Version control table
CREATE TABLE IF NOT EXISTS memoryvault_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES memoryvault_items(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  content TEXT,
  changed_by INTEGER REFERENCES users(id),
  change_type VARCHAR(50), -- create, update, delete, rollback
  diff JSONB, -- Stores the diff from previous version
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(item_id, version_number)
);

-- Relationships table
CREATE TABLE IF NOT EXISTS memoryvault_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_item_id UUID REFERENCES memoryvault_items(id) ON DELETE CASCADE,
  target_item_id UUID REFERENCES memoryvault_items(id) ON DELETE CASCADE,
  relationship_type VARCHAR(50) NOT NULL, -- references, derived_from, related_to, etc.
  metadata JSONB DEFAULT '{}',
  strength DECIMAL(3,2) DEFAULT 0.5, -- 0.0 to 1.0
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(source_item_id, target_item_id, relationship_type)
);

-- AI Context Sessions
CREATE TABLE IF NOT EXISTS ai_context_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  feature VARCHAR(50), -- which feature is being used
  context_items UUID[], -- array of memoryvault item IDs
  conversation_history JSONB DEFAULT '[]',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Agent Workflows
CREATE TABLE IF NOT EXISTS agent_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  workflow_type VARCHAR(100),
  state JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'pending', -- pending, running, completed, failed
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  error_message TEXT,
  result JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Campaign Orchestration
CREATE TABLE IF NOT EXISTS campaign_orchestrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id INTEGER REFERENCES campaigns(id) ON DELETE CASCADE,
  orchestration_type VARCHAR(100),
  schedule JSONB, -- cron-like schedule or specific times
  automation_rules JSONB,
  execution_history JSONB DEFAULT '[]',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Semantic Search Cache (for performance)
CREATE TABLE IF NOT EXISTS semantic_search_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_hash VARCHAR(64) UNIQUE,
  query_text TEXT,
  results JSONB,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_memoryvault_items_project ON memoryvault_items(project_id);
CREATE INDEX IF NOT EXISTS idx_memoryvault_items_type ON memoryvault_items(type);
CREATE INDEX IF NOT EXISTS idx_memoryvault_items_created ON memoryvault_items(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_memoryvault_versions_item ON memoryvault_versions(item_id);
CREATE INDEX IF NOT EXISTS idx_memoryvault_versions_changed_by ON memoryvault_versions(changed_by);

CREATE INDEX IF NOT EXISTS idx_memoryvault_relationships_source ON memoryvault_relationships(source_item_id);
CREATE INDEX IF NOT EXISTS idx_memoryvault_relationships_target ON memoryvault_relationships(target_item_id);
CREATE INDEX IF NOT EXISTS idx_memoryvault_relationships_type ON memoryvault_relationships(relationship_type);

CREATE INDEX IF NOT EXISTS idx_ai_context_sessions_user ON ai_context_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_context_sessions_project ON ai_context_sessions(project_id);
CREATE INDEX IF NOT EXISTS idx_ai_context_sessions_active ON ai_context_sessions(active);

CREATE INDEX IF NOT EXISTS idx_agent_workflows_user ON agent_workflows(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_workflows_status ON agent_workflows(status);

CREATE INDEX IF NOT EXISTS idx_campaign_orchestrations_campaign ON campaign_orchestrations(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_orchestrations_status ON campaign_orchestrations(status);

-- Add updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_memoryvault_items_updated_at BEFORE UPDATE ON memoryvault_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_memoryvault_relationships_updated_at BEFORE UPDATE ON memoryvault_relationships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_context_sessions_updated_at BEFORE UPDATE ON ai_context_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaign_orchestrations_updated_at BEFORE UPDATE ON campaign_orchestrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample data for relationship types
INSERT INTO memoryvault_relationships (source_item_id, target_item_id, relationship_type, metadata)
VALUES 
  (gen_random_uuid(), gen_random_uuid(), 'references', '{"auto_discovered": false}'),
  (gen_random_uuid(), gen_random_uuid(), 'derived_from', '{"confidence": 0.9}'),
  (gen_random_uuid(), gen_random_uuid(), 'related_to', '{"keywords": ["marketing", "campaign"]}')
ON CONFLICT DO NOTHING;