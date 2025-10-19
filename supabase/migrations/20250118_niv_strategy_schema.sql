-- NIV Strategy Schema
-- Memory Vault for NIV-generated strategies
-- Created: 2025-01-18

-- NIV Strategies Table
CREATE TABLE IF NOT EXISTS niv_strategies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Basic metadata
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  version INTEGER DEFAULT 1,

  -- Research data that informed this strategy
  research_sources JSONB DEFAULT '[]', -- Array of ResearchSource objects
  research_key_findings TEXT[] DEFAULT '{}',
  research_gaps TEXT[] DEFAULT '{}',
  research_confidence DECIMAL(3,2) DEFAULT 0.75, -- 0-1 confidence score
  research_timestamp TIMESTAMPTZ DEFAULT NOW(),

  -- Strategic framework
  strategy_objective TEXT,
  strategy_approach TEXT,
  strategy_positioning TEXT,
  strategy_key_messages TEXT[] DEFAULT '{}',
  strategy_narratives TEXT[] DEFAULT '{}',
  strategy_timeline TEXT,
  strategy_urgency_level TEXT CHECK (strategy_urgency_level IN ('immediate', 'high', 'medium', 'low')) DEFAULT 'medium',
  strategy_rationale TEXT,

  -- Metadata
  created_by TEXT DEFAULT 'niv',
  status TEXT CHECK (status IN ('draft', 'reviewed', 'approved', 'archived')) DEFAULT 'draft',
  tags TEXT[] DEFAULT '{}',

  -- Workflow configuration for orchestration
  workflow_campaign_intelligence JSONB DEFAULT '{"enabled": false}',
  workflow_content_generation JSONB DEFAULT '{"enabled": false}',
  workflow_strategic_planning JSONB DEFAULT '{"enabled": false}',
  workflow_media_outreach JSONB DEFAULT '{"enabled": false}',

  -- Vector embedding for semantic search
  embedding vector(1536),

  -- Full-text search (will be populated via trigger)
  search_vector tsvector
);

-- Strategy Execution Results Table
-- Tracks outputs from workflow components
CREATE TABLE IF NOT EXISTS niv_strategy_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_id UUID REFERENCES niv_strategies(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Execution metadata
  workflow_type TEXT NOT NULL CHECK (workflow_type IN ('campaign_intelligence', 'content_generation', 'strategic_planning', 'media_outreach')),
  executed_at TIMESTAMPTZ DEFAULT NOW(),
  duration_ms INTEGER,
  status TEXT CHECK (status IN ('pending', 'running', 'completed', 'failed')) DEFAULT 'pending',

  -- Results
  output JSONB, -- The generated content/plan
  metadata JSONB DEFAULT '{}', -- Additional execution metadata
  error_message TEXT, -- If execution failed

  -- User feedback
  user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),
  user_feedback TEXT,

  -- Version tracking
  version INTEGER DEFAULT 1,
  parent_execution_id UUID REFERENCES niv_strategy_executions(id)
);

-- Strategy Versions Table
-- Track changes to strategies over time
CREATE TABLE IF NOT EXISTS niv_strategy_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_id UUID REFERENCES niv_strategies(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  version_number INTEGER NOT NULL,
  changes_summary TEXT,
  changed_fields TEXT[] DEFAULT '{}',

  -- Snapshot of strategy at this version
  strategy_snapshot JSONB NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Strategy Collaboration Table
-- Track who has worked on or reviewed strategies
CREATE TABLE IF NOT EXISTS niv_strategy_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_id UUID REFERENCES niv_strategies(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  role TEXT CHECK (role IN ('creator', 'reviewer', 'editor', 'viewer')) DEFAULT 'viewer',
  last_accessed TIMESTAMPTZ DEFAULT NOW(),
  permissions JSONB DEFAULT '{"read": true, "write": false, "delete": false}'
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_niv_strategies_org ON niv_strategies(organization_id);
CREATE INDEX IF NOT EXISTS idx_niv_strategies_created ON niv_strategies(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_niv_strategies_status ON niv_strategies(status);
CREATE INDEX IF NOT EXISTS idx_niv_strategies_search ON niv_strategies USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_niv_strategies_tags ON niv_strategies USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_niv_executions_strategy ON niv_strategy_executions(strategy_id);
CREATE INDEX IF NOT EXISTS idx_niv_executions_workflow ON niv_strategy_executions(workflow_type);
CREATE INDEX IF NOT EXISTS idx_niv_executions_status ON niv_strategy_executions(status);

CREATE INDEX IF NOT EXISTS idx_niv_versions_strategy ON niv_strategy_versions(strategy_id, version_number);

CREATE INDEX IF NOT EXISTS idx_niv_collaborators_strategy ON niv_strategy_collaborators(strategy_id);
CREATE INDEX IF NOT EXISTS idx_niv_collaborators_user ON niv_strategy_collaborators(user_id);

-- Enable Row Level Security
ALTER TABLE niv_strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE niv_strategy_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE niv_strategy_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE niv_strategy_collaborators ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Strategies: Allow all authenticated users for now (can be refined later)
CREATE POLICY "Authenticated users can view strategies" ON niv_strategies
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create strategies" ON niv_strategies
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update strategies" ON niv_strategies
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete strategies" ON niv_strategies
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Strategy Executions: Authenticated users only
CREATE POLICY "Authenticated users can view executions" ON niv_strategy_executions
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create executions" ON niv_strategy_executions
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Strategy Versions: Authenticated users only
CREATE POLICY "Authenticated users can view versions" ON niv_strategy_versions
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Collaborators: Authenticated users only
CREATE POLICY "Authenticated users can view collaborators" ON niv_strategy_collaborators
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Create update timestamp triggers
CREATE TRIGGER update_niv_strategies_updated_at BEFORE UPDATE ON niv_strategies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to automatically create version snapshots on updates
CREATE OR REPLACE FUNCTION create_strategy_version()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create version if this is an actual update (not insert)
  IF TG_OP = 'UPDATE' AND OLD.version != NEW.version THEN
    INSERT INTO niv_strategy_versions (
      strategy_id,
      organization_id,
      version_number,
      strategy_snapshot,
      created_by
    ) VALUES (
      NEW.id,
      NEW.organization_id,
      NEW.version,
      row_to_json(NEW),
      COALESCE(auth.uid(), uuid_nil())
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER niv_strategy_version_trigger
  AFTER INSERT OR UPDATE ON niv_strategies
  FOR EACH ROW EXECUTE FUNCTION create_strategy_version();

-- Trigger to populate search vector
CREATE OR REPLACE FUNCTION update_strategy_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english',
    COALESCE(NEW.title, '') || ' ' ||
    COALESCE(NEW.strategy_objective, '') || ' ' ||
    COALESCE(NEW.strategy_approach, '') || ' ' ||
    COALESCE(array_to_string(NEW.strategy_key_messages, ' '), '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER niv_strategy_search_trigger
  BEFORE INSERT OR UPDATE ON niv_strategies
  FOR EACH ROW EXECUTE FUNCTION update_strategy_search_vector();

-- Helper functions

-- Function to search strategies with ranking
CREATE OR REPLACE FUNCTION search_niv_strategies(
  org_id UUID,
  search_query TEXT,
  limit_count INTEGER DEFAULT 10
)
RETURNS TABLE(
  id UUID,
  title TEXT,
  strategy_objective TEXT,
  created_at TIMESTAMPTZ,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.title,
    s.strategy_objective,
    s.created_at,
    ts_rank(s.search_vector, websearch_to_tsquery('english', search_query)) as rank
  FROM niv_strategies s
  WHERE
    s.organization_id = org_id
    AND s.search_vector @@ websearch_to_tsquery('english', search_query)
  ORDER BY rank DESC, s.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get strategy with execution history
CREATE OR REPLACE FUNCTION get_strategy_with_executions(strategy_uuid UUID)
RETURNS TABLE(
  strategy JSONB,
  executions JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    row_to_json(s)::JSONB as strategy,
    COALESCE(
      json_agg(
        json_build_object(
          'id', e.id,
          'workflow_type', e.workflow_type,
          'executed_at', e.executed_at,
          'status', e.status,
          'output', e.output,
          'user_rating', e.user_rating
        ) ORDER BY e.executed_at DESC
      ) FILTER (WHERE e.id IS NOT NULL),
      '[]'::json
    )::JSONB as executions
  FROM niv_strategies s
  LEFT JOIN niv_strategy_executions e ON s.id = e.strategy_id
  WHERE s.id = strategy_uuid
  GROUP BY s.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get recent strategies for an organization
CREATE OR REPLACE FUNCTION get_recent_strategies(
  org_id UUID,
  limit_count INTEGER DEFAULT 10
)
RETURNS TABLE(
  id UUID,
  title TEXT,
  strategy_objective TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  status TEXT,
  execution_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.title,
    s.strategy_objective,
    s.created_at,
    s.updated_at,
    s.status,
    COUNT(e.id) as execution_count
  FROM niv_strategies s
  LEFT JOIN niv_strategy_executions e ON s.id = e.strategy_id
  WHERE s.organization_id = org_id
  GROUP BY s.id, s.title, s.strategy_objective, s.created_at, s.updated_at, s.status
  ORDER BY s.updated_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE niv_strategies IS 'NIV-generated strategies with research context and workflow orchestration';
COMMENT ON TABLE niv_strategy_executions IS 'Results from executing strategy workflows (campaign, content, planning, etc.)';
COMMENT ON TABLE niv_strategy_versions IS 'Version history tracking for strategy changes';
COMMENT ON TABLE niv_strategy_collaborators IS 'Track user access and collaboration on strategies';