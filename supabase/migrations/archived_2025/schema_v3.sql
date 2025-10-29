-- SignalDesk V3 Database Schema
-- Complete schema for Supabase deployment
-- Last Updated: 2025-08-29

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Organizations Table
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  domain TEXT,
  industry TEXT,
  size TEXT,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users & Auth Profiles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member', 'viewer')),
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Intelligence Pipeline Runs
CREATE TABLE IF NOT EXISTS intelligence_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  stages_complete INTEGER DEFAULT 0,
  total_stages INTEGER DEFAULT 7,
  current_stage TEXT,
  results JSONB,
  duration_ms INTEGER,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Intelligence Stage Results (for tracking individual stages)
CREATE TABLE IF NOT EXISTS intelligence_stage_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID REFERENCES intelligence_runs(id) ON DELETE CASCADE,
  stage_name TEXT NOT NULL,
  stage_index INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  data JSONB,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Opportunities
CREATE TABLE IF NOT EXISTS opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  score INTEGER CHECK (score >= 0 AND score <= 100),
  urgency TEXT CHECK (urgency IN ('high', 'medium', 'low')),
  time_window TEXT,
  source TEXT,
  category TEXT,
  data JSONB,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'expired', 'executed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- Campaigns
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'ready', 'exported', 'archived')),
  content JSONB,
  visuals JSONB,
  media_list JSONB,
  social_posts JSONB,
  exports JSONB[], -- Track all exports for liability protection
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  executed_at TIMESTAMPTZ
);

-- MemoryVault with Vector Support
CREATE TABLE IF NOT EXISTS memoryvault (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  type TEXT,
  title TEXT,
  content JSONB,
  embedding vector(1536), -- For semantic search
  patterns JSONB,
  success_metrics JSONB,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- MemoryVault Attachments
CREATE TABLE IF NOT EXISTS memoryvault_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  memoryvault_id UUID REFERENCES memoryvault(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT,
  file_type TEXT,
  file_size INTEGER,
  extracted_text TEXT,
  key_points JSONB,
  embedding vector(1536),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Monitoring Alerts
CREATE TABLE IF NOT EXISTS monitoring_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('opportunity', 'crisis', 'deadline')),
  severity TEXT CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  title TEXT NOT NULL,
  message TEXT,
  data JSONB,
  status TEXT DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'acknowledged', 'resolved')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  acknowledged_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ
);

-- Canvas States (for infinite canvas UI)
CREATE TABLE IF NOT EXISTS canvas_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  components JSONB, -- Component positions and states
  scale NUMERIC DEFAULT 1,
  scroll_position JSONB,
  active_tab TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Exports Log (for audit trail)
CREATE TABLE IF NOT EXISTS exports_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  export_type TEXT NOT NULL,
  format TEXT NOT NULL,
  watermark_applied BOOLEAN DEFAULT true,
  file_url TEXT,
  metadata JSONB,
  exported_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Niv Interactions (for context-aware assistant)
CREATE TABLE IF NOT EXISTS niv_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  context TEXT, -- Which component/tab user was in
  query TEXT NOT NULL,
  response TEXT,
  data_context JSONB, -- What data was visible to user
  helpful BOOLEAN, -- User feedback
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_organizations_domain ON organizations(domain);
CREATE INDEX IF NOT EXISTS idx_intelligence_runs_org ON intelligence_runs(organization_id);
CREATE INDEX IF NOT EXISTS idx_intelligence_runs_status ON intelligence_runs(status);
CREATE INDEX IF NOT EXISTS idx_opportunities_org ON opportunities(organization_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_status ON opportunities(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_org ON campaigns(organization_id);
CREATE INDEX IF NOT EXISTS idx_memoryvault_org ON memoryvault(organization_id);
CREATE INDEX IF NOT EXISTS idx_alerts_org_status ON monitoring_alerts(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_canvas_states_user ON canvas_states(user_id);

-- Create GIN indexes for JSONB columns
CREATE INDEX IF NOT EXISTS idx_organizations_config ON organizations USING GIN(config);
CREATE INDEX IF NOT EXISTS idx_intelligence_runs_results ON intelligence_runs USING GIN(results);
CREATE INDEX IF NOT EXISTS idx_opportunities_data ON opportunities USING GIN(data);
CREATE INDEX IF NOT EXISTS idx_campaigns_content ON campaigns USING GIN(content);
CREATE INDEX IF NOT EXISTS idx_memoryvault_content ON memoryvault USING GIN(content);

-- Create text search indexes
CREATE INDEX IF NOT EXISTS idx_memoryvault_text_search ON memoryvault USING GIN(to_tsvector('english', content::text));
CREATE INDEX IF NOT EXISTS idx_opportunities_title_search ON opportunities USING GIN(to_tsvector('english', title));

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE intelligence_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE intelligence_stage_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE memoryvault ENABLE ROW LEVEL SECURITY;
ALTER TABLE memoryvault_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitoring_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE canvas_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE exports_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE niv_interactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Organizations: Users can only see their own organization
CREATE POLICY "Users can view own organization" ON organizations
  FOR SELECT USING (
    id IN (
      SELECT organization_id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- Profiles: Users can see profiles in their organization
CREATE POLICY "Users can view profiles in organization" ON profiles
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- Intelligence Runs: Organization-scoped
CREATE POLICY "Organization members can view intelligence runs" ON intelligence_runs
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- Opportunities: Organization-scoped
CREATE POLICY "Organization members can view opportunities" ON opportunities
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- Campaigns: Organization-scoped
CREATE POLICY "Organization members can view campaigns" ON campaigns
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- MemoryVault: Organization-scoped
CREATE POLICY "Organization members can view memoryvault" ON memoryvault
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- Alerts: Organization-scoped
CREATE POLICY "Organization members can view alerts" ON monitoring_alerts
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- Canvas States: User-specific
CREATE POLICY "Users can manage own canvas state" ON canvas_states
  FOR ALL USING (user_id = auth.uid());

-- Exports Log: Organization-scoped, view only
CREATE POLICY "Organization members can view exports" ON exports_log
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- Niv Interactions: User can see own interactions
CREATE POLICY "Users can view own Niv interactions" ON niv_interactions
  FOR SELECT USING (user_id = auth.uid());

-- Create update timestamp triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_memoryvault_updated_at BEFORE UPDATE ON memoryvault
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_canvas_states_updated_at BEFORE UPDATE ON canvas_states
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create functions for common operations

-- Function to get organization stats
CREATE OR REPLACE FUNCTION get_organization_stats(org_id UUID)
RETURNS TABLE(
  total_runs BIGINT,
  successful_runs BIGINT,
  total_opportunities BIGINT,
  active_opportunities BIGINT,
  total_campaigns BIGINT,
  total_alerts BIGINT,
  unread_alerts BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM intelligence_runs WHERE organization_id = org_id),
    (SELECT COUNT(*) FROM intelligence_runs WHERE organization_id = org_id AND status = 'completed'),
    (SELECT COUNT(*) FROM opportunities WHERE organization_id = org_id),
    (SELECT COUNT(*) FROM opportunities WHERE organization_id = org_id AND status = 'active'),
    (SELECT COUNT(*) FROM campaigns WHERE organization_id = org_id),
    (SELECT COUNT(*) FROM monitoring_alerts WHERE organization_id = org_id),
    (SELECT COUNT(*) FROM monitoring_alerts WHERE organization_id = org_id AND status = 'unread');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up expired opportunities
CREATE OR REPLACE FUNCTION cleanup_expired_opportunities()
RETURNS void AS $$
BEGIN
  UPDATE opportunities
  SET status = 'expired'
  WHERE expires_at < NOW() AND status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a scheduled job for cleanup (requires pg_cron extension)
-- SELECT cron.schedule('cleanup-expired-opportunities', '0 */6 * * *', 'SELECT cleanup_expired_opportunities();');

COMMENT ON SCHEMA public IS 'SignalDesk V3 Database Schema';
COMMENT ON TABLE organizations IS 'Organizations using the platform';
COMMENT ON TABLE intelligence_runs IS 'Tracks execution of the 7-stage intelligence pipeline';
COMMENT ON TABLE opportunities IS 'Strategic opportunities detected by the intelligence pipeline';
COMMENT ON TABLE campaigns IS 'Marketing campaigns created from opportunities';
COMMENT ON TABLE memoryvault IS 'Knowledge base with vector search capabilities';
COMMENT ON TABLE monitoring_alerts IS 'Alerts for opportunities, crises, and deadlines';
COMMENT ON TABLE canvas_states IS 'Stores infinite canvas UI state per user';
COMMENT ON TABLE exports_log IS 'Audit trail for all content exports';
COMMENT ON TABLE niv_interactions IS 'Context-aware assistant interaction history';