-- Migration: Create Opportunity Detection Tables
-- Run this to set up the enhanced opportunity engine

-- Opportunity patterns library
CREATE TABLE IF NOT EXISTS opportunity_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50),
  description TEXT,
  signals JSONB,
  action_window VARCHAR(50),
  recommended_action TEXT,
  success_rate FLOAT DEFAULT 0,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert initial opportunity patterns
INSERT INTO opportunity_patterns (name, type, description, signals, action_window, recommended_action) VALUES
('Competitor Stumble', 'competitive', 'Negative news about competitor creates positioning opportunity', 
 '{"triggers": ["negative sentiment", "executive departure", "product failure", "lawsuit"], "threshold": 0.7}',
 '24-48 hours', 'Position as stable alternative, offer expert commentary'),

('Narrative Vacuum', 'thought_leadership', 'Topic trending with no clear expert voice',
 '{"triggers": ["high search volume", "journalist queries", "no dominant voice"], "threshold": 0.6}',
 '3-5 days', 'Provide expert commentary, publish thought leadership'),

('News Hijacking', 'reactive', 'Breaking news tangentially related to your expertise',
 '{"triggers": ["breaking news", "industry relevance", "unique angle"], "threshold": 0.8}',
 '2-6 hours', 'Rapid response with unique perspective'),

('Regulatory Change', 'strategic', 'New regulations affecting your industry',
 '{"triggers": ["policy announcement", "comment period", "industry impact"], "threshold": 0.5}',
 '2-4 weeks', 'Publish analysis, offer expert testimony'),

('Viral Moment', 'social', 'Rapidly spreading content relevant to brand',
 '{"triggers": ["viral velocity", "sentiment alignment", "brand relevance"], "threshold": 0.75}',
 '6-12 hours', 'Amplify with brand perspective, engage authentically'),

('Cascade Event', 'predictive', 'Event likely to trigger downstream effects',
 '{"triggers": ["supply chain disruption", "market shift", "technology breakthrough"], "threshold": 0.65}',
 '1-7 days', 'Position ahead of cascade, prepare responses');

-- Detected opportunities queue
CREATE TABLE IF NOT EXISTS opportunity_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id VARCHAR(255),
  pattern_id UUID REFERENCES opportunity_patterns(id),
  pattern_name VARCHAR(100),
  source_type VARCHAR(50), -- 'rss', 'api', 'social', 'manual'
  source_name VARCHAR(255),
  source_url TEXT,
  
  -- Scoring and timing
  score FLOAT,
  confidence FLOAT,
  window_start TIMESTAMP DEFAULT NOW(),
  window_end TIMESTAMP,
  urgency VARCHAR(20), -- 'critical', 'high', 'medium', 'low'
  
  -- Opportunity details
  title VARCHAR(500),
  description TEXT,
  key_points JSONB,
  recommended_actions JSONB,
  
  -- Status tracking
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'reviewing', 'acting', 'completed', 'expired', 'dismissed'
  assigned_to VARCHAR(255),
  acted_upon_at TIMESTAMP,
  outcome VARCHAR(50),
  outcome_notes TEXT,
  
  -- Metadata
  data JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for opportunity_queue
CREATE INDEX IF NOT EXISTS idx_org_status ON opportunity_queue(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_window ON opportunity_queue(window_end);
CREATE INDEX IF NOT EXISTS idx_score ON opportunity_queue(score DESC);
CREATE INDEX IF NOT EXISTS idx_urgency ON opportunity_queue(urgency);
CREATE INDEX IF NOT EXISTS idx_created ON opportunity_queue(created_at DESC);

-- Cascade predictions
CREATE TABLE IF NOT EXISTS cascade_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID REFERENCES opportunity_queue(id),
  trigger_event JSONB,
  
  -- Cascade effects
  first_order_effects JSONB,
  second_order_effects JSONB,
  third_order_effects JSONB,
  
  -- Predictions
  predicted_timeline JSONB,
  confidence_scores JSONB,
  opportunities_identified JSONB,
  risks_identified JSONB,
  
  -- Tracking
  accuracy_score FLOAT,
  validated_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Signal source performance tracking
CREATE TABLE IF NOT EXISTS source_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type VARCHAR(50),
  source_name VARCHAR(255),
  source_url TEXT,
  
  -- Performance metrics
  signals_generated INTEGER DEFAULT 0,
  opportunities_created INTEGER DEFAULT 0,
  opportunities_acted_upon INTEGER DEFAULT 0,
  false_positives INTEGER DEFAULT 0,
  
  -- Quality metrics
  signal_quality_score FLOAT DEFAULT 0,
  average_relevance FLOAT DEFAULT 0,
  exclusive_finds INTEGER DEFAULT 0,
  
  -- Timing metrics
  average_lead_time_hours FLOAT,
  fastest_detection_hours FLOAT,
  
  last_checked TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(source_type, source_name)
);

-- Learning and feedback
CREATE TABLE IF NOT EXISTS opportunity_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID REFERENCES opportunity_queue(id),
  pattern_id UUID REFERENCES opportunity_patterns(id),
  
  -- Feedback
  was_valuable BOOLEAN,
  action_taken TEXT,
  result_achieved TEXT,
  roi_estimate FLOAT,
  
  -- Learning data
  pattern_accuracy FLOAT,
  timing_accuracy FLOAT,
  score_accuracy FLOAT,
  
  -- User feedback
  user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),
  user_notes TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  created_by VARCHAR(255)
);

-- Create additional indexes
CREATE INDEX IF NOT EXISTS idx_queue_org_window ON opportunity_queue(organization_id, window_end);
CREATE INDEX IF NOT EXISTS idx_queue_pattern ON opportunity_queue(pattern_id);
CREATE INDEX IF NOT EXISTS idx_feedback_pattern ON opportunity_feedback(pattern_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS update_opportunity_patterns_updated_at ON opportunity_patterns;
CREATE TRIGGER update_opportunity_patterns_updated_at BEFORE UPDATE ON opportunity_patterns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_opportunity_queue_updated_at ON opportunity_queue;
CREATE TRIGGER update_opportunity_queue_updated_at BEFORE UPDATE ON opportunity_queue
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_source_performance_updated_at ON source_performance;
CREATE TRIGGER update_source_performance_updated_at BEFORE UPDATE ON source_performance
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();