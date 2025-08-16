-- SignalDesk Complete Database Schema for Supabase
-- This sets up all tables needed for the Opportunity Engine and MCPs

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ========================================
-- Core Tables
-- ========================================

-- Organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  domain VARCHAR(255),
  industry VARCHAR(100),
  size VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  organization_id UUID REFERENCES organizations(id),
  role VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ========================================
-- Opportunity Engine Tables
-- ========================================

-- Opportunity patterns table
CREATE TABLE IF NOT EXISTS opportunity_patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255),
  required_signals JSONB,
  confidence_threshold DECIMAL(3,2),
  action_window VARCHAR(50),
  suggested_response TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Cascade predictions table
CREATE TABLE IF NOT EXISTS cascade_predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  primary_event JSONB,
  first_order_effects JSONB,
  second_order_effects JSONB,
  third_order_effects JSONB,
  opportunities JSONB,
  confidence DECIMAL(3,2),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Detected opportunities table
CREATE TABLE IF NOT EXISTS detected_opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id),
  pattern_id UUID REFERENCES opportunity_patterns(id),
  signal_data JSONB,
  cascade_id UUID REFERENCES cascade_predictions(id),
  confidence DECIMAL(3,2),
  action_window VARCHAR(50),
  status VARCHAR(50),
  brief JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Opportunity outcomes table
CREATE TABLE IF NOT EXISTS opportunity_outcomes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  opportunity_id UUID REFERENCES detected_opportunities(id),
  action_taken BOOLEAN,
  outcome JSONB,
  success_metrics JSONB,
  lessons_learned TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Opportunities table (for signaldesk-opportunities MCP)
CREATE TABLE IF NOT EXISTS opportunities (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  description TEXT,
  score INTEGER DEFAULT 0,
  urgency VARCHAR(20) DEFAULT 'medium',
  deadline VARCHAR(100),
  keywords TEXT[],
  relevant_journalists TEXT[],
  suggested_action TEXT,
  cascade_data JSONB,
  status VARCHAR(50) DEFAULT 'tracking',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- Intelligence & Monitoring Tables
-- ========================================

-- Intelligence findings table
CREATE TABLE IF NOT EXISTS intelligence_findings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id),
  source VARCHAR(255),
  type VARCHAR(100),
  title VARCHAR(500),
  content TEXT,
  relevance_score DECIMAL(3,2),
  entities JSONB,
  sentiment VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Intelligence targets table
CREATE TABLE IF NOT EXISTS intelligence_targets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id),
  target_type VARCHAR(50),
  target_name VARCHAR(255),
  target_url VARCHAR(500),
  monitoring_frequency VARCHAR(50),
  last_checked TIMESTAMP,
  status VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Monitoring alerts table
CREATE TABLE IF NOT EXISTS monitoring_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id),
  alert_type VARCHAR(100),
  severity VARCHAR(50),
  title VARCHAR(500),
  description TEXT,
  source VARCHAR(255),
  action_required BOOLEAN DEFAULT false,
  status VARCHAR(50) DEFAULT 'new',
  created_at TIMESTAMP DEFAULT NOW()
);

-- ========================================
-- Media & Relationships Tables
-- ========================================

-- Journalists table
CREATE TABLE IF NOT EXISTS journalists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  publication VARCHAR(255),
  beat VARCHAR(255),
  twitter VARCHAR(255),
  linkedin VARCHAR(255),
  phone VARCHAR(50),
  notes TEXT,
  relationship_score INTEGER DEFAULT 0,
  last_contacted TIMESTAMP,
  last_updated TIMESTAMP DEFAULT NOW()
);

-- Media lists table
CREATE TABLE IF NOT EXISTS media_lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id VARCHAR(255),
  name VARCHAR(255),
  topic VARCHAR(255),
  journalists JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Media outreach table
CREATE TABLE IF NOT EXISTS media_outreach (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  journalist_id VARCHAR(255),
  user_id VARCHAR(255),
  campaign_id UUID,
  status VARCHAR(50),
  pitch_sent TIMESTAMP,
  response_received TIMESTAMP,
  notes TEXT,
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(journalist_id, user_id)
);

-- ========================================
-- Campaign Tables
-- ========================================

-- Campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id VARCHAR(255),
  name VARCHAR(255) NOT NULL,
  objectives JSONB,
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  target_audience TEXT,
  budget DECIMAL(10,2),
  status VARCHAR(50) DEFAULT 'planning',
  metrics JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Campaign tasks table
CREATE TABLE IF NOT EXISTS campaign_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES campaigns(id),
  name VARCHAR(255),
  description TEXT,
  due_date TIMESTAMP,
  assignee VARCHAR(255),
  dependencies JSONB,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

-- ========================================
-- Content Tables
-- ========================================

-- Content pieces table
CREATE TABLE IF NOT EXISTS content_pieces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id),
  title VARCHAR(500),
  type VARCHAR(100),
  content TEXT,
  status VARCHAR(50),
  campaign_id UUID REFERENCES campaigns(id),
  performance_metrics JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  published_at TIMESTAMP
);

-- Content templates table
CREATE TABLE IF NOT EXISTS content_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255),
  type VARCHAR(100),
  template TEXT,
  variables JSONB,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ========================================
-- Analytics Tables
-- ========================================

-- Analytics metrics table
CREATE TABLE IF NOT EXISTS analytics_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id),
  metric_type VARCHAR(100),
  metric_name VARCHAR(255),
  value DECIMAL,
  period_start TIMESTAMP,
  period_end TIMESTAMP,
  dimensions JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Performance snapshots table
CREATE TABLE IF NOT EXISTS performance_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id),
  snapshot_date DATE,
  metrics JSONB,
  comparisons JSONB,
  insights TEXT[],
  created_at TIMESTAMP DEFAULT NOW()
);

-- ========================================
-- Memory Vault Tables
-- ========================================

-- Memory vault items table
CREATE TABLE IF NOT EXISTS memoryvault_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id VARCHAR(255),
  title VARCHAR(500),
  content TEXT,
  category VARCHAR(100),
  tags TEXT[],
  embedding vector(1536), -- For semantic search
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ========================================
-- Scraper & Web Monitoring Tables
-- ========================================

-- Scraped content table
CREATE TABLE IF NOT EXISTS scraped_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_url VARCHAR(1000),
  content_type VARCHAR(100),
  title VARCHAR(500),
  content TEXT,
  extracted_data JSONB,
  screenshot_url VARCHAR(1000),
  scraped_at TIMESTAMP DEFAULT NOW()
);

-- Web monitoring targets table
CREATE TABLE IF NOT EXISTS web_monitoring_targets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id),
  url VARCHAR(1000),
  selector VARCHAR(500),
  monitoring_type VARCHAR(100),
  frequency VARCHAR(50),
  last_check TIMESTAMP,
  last_change_detected TIMESTAMP,
  status VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ========================================
-- Indexes for Performance
-- ========================================

CREATE INDEX idx_opportunities_status ON opportunities(status);
CREATE INDEX idx_opportunities_created ON opportunities(created_at DESC);
CREATE INDEX idx_intelligence_findings_org ON intelligence_findings(organization_id);
CREATE INDEX idx_intelligence_findings_created ON intelligence_findings(created_at DESC);
CREATE INDEX idx_monitoring_alerts_status ON monitoring_alerts(status);
CREATE INDEX idx_journalists_email ON journalists(email);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_content_pieces_status ON content_pieces(status);
CREATE INDEX idx_memoryvault_items_user ON memoryvault_items(user_id);
CREATE INDEX idx_memoryvault_items_category ON memoryvault_items(category);

-- ========================================
-- Initial Data
-- ========================================

-- Insert demo organization
INSERT INTO organizations (id, name, domain, industry, size)
VALUES ('11111111-1111-1111-1111-111111111111', 'Demo Organization', 'demo.com', 'Technology', 'Startup')
ON CONFLICT DO NOTHING;

-- Insert demo user
INSERT INTO users (email, name, organization_id, role)
VALUES ('demo@signaldesk.com', 'Demo User', '11111111-1111-1111-1111-111111111111', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Insert initial opportunity patterns
INSERT INTO opportunity_patterns (name, required_signals, confidence_threshold, action_window, suggested_response)
VALUES 
  ('Competitor Stumble', '["negative_sentiment", "leadership_change", "product_issue"]', 0.6, '24-48 hours', 'Position as stable alternative'),
  ('Narrative Vacuum', '["high_search_volume", "low_expert_coverage", "journalist_interest"]', 0.5, '3-5 days', 'Offer executive as expert source'),
  ('Cascade Event', '["primary_disruption", "industry_impact", "supply_chain_effect"]', 0.7, '1-3 days', 'Pre-position for cascade effects')
ON CONFLICT DO NOTHING;

-- Grant permissions (adjust based on your Supabase auth setup)
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'SignalDesk database schema created successfully!';
END $$;