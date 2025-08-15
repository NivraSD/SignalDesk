-- SignalDesk Scraper MCP Database Setup

-- Table for storing webpage snapshots
CREATE TABLE IF NOT EXISTS webpage_snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL,
  screenshot BYTEA,
  content_hash TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index for webpage snapshots
CREATE INDEX IF NOT EXISTS idx_webpage_url_created ON webpage_snapshots(url, created_at DESC);

-- Table for monitoring results
CREATE TABLE IF NOT EXISTS monitoring_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL,
  signals JSONB,
  patterns JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  organization_id UUID REFERENCES organizations(id)
);

-- Table for detected opportunities
CREATE TABLE IF NOT EXISTS detected_opportunities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  pattern_type VARCHAR(100),
  signal_data JSONB,
  confidence DECIMAL(3,2),
  action_window VARCHAR(50),
  status VARCHAR(50) DEFAULT 'pending',
  brief JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  acted_upon BOOLEAN DEFAULT FALSE,
  outcome JSONB
);

-- Table for cascade predictions
CREATE TABLE IF NOT EXISTS cascade_predictions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  primary_event JSONB NOT NULL,
  first_order_effects JSONB,
  second_order_effects JSONB,
  third_order_effects JSONB,
  opportunities JSONB,
  confidence DECIMAL(3,2),
  created_at TIMESTAMP DEFAULT NOW(),
  organization_id UUID REFERENCES organizations(id)
);

-- Table for opportunity patterns
CREATE TABLE IF NOT EXISTS opportunity_patterns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  required_signals JSONB,
  confidence_threshold DECIMAL(3,2),
  action_window VARCHAR(50),
  suggested_response TEXT,
  success_rate DECIMAL(3,2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default opportunity patterns
INSERT INTO opportunity_patterns (name, required_signals, confidence_threshold, action_window, suggested_response) VALUES
('competitor_weakness', '["negative_sentiment", "leadership_change", "product_issue"]', 0.7, '24-48 hours', 'Position as stable alternative'),
('narrative_vacuum', '["high_search_volume", "low_expert_coverage", "journalist_interest"]', 0.6, '3-5 days', 'Offer executive as expert source'),
('cascade_event', '["primary_disruption", "industry_impact", "supply_chain_effect"]', 0.8, '1-3 days', 'Pre-position for cascade effects'),
('viral_moment', '["rapid_social_growth", "relevant_to_brand", "positive_sentiment"]', 0.65, '6-12 hours', 'Amplify with brand perspective'),
('regulatory_change', '["new_regulation", "comment_period", "industry_impact"]', 0.75, '2-4 weeks', 'Thought leadership on implications')
ON CONFLICT (name) DO NOTHING;

-- Table for learning outcomes
CREATE TABLE IF NOT EXISTS opportunity_outcomes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  opportunity_id UUID REFERENCES detected_opportunities(id),
  action_taken BOOLEAN,
  outcome JSONB,
  success_metrics JSONB,
  lessons_learned TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_monitoring_results_created ON monitoring_results(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_detected_opportunities_status ON detected_opportunities(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cascade_predictions_confidence ON cascade_predictions(confidence DESC, created_at DESC);