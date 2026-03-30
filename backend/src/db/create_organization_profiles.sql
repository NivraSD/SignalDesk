-- Organization Profiles Database Schema
-- Stores persistent intelligence profiles for organizations

-- Create organization profiles table
CREATE TABLE IF NOT EXISTS organization_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Identity & Basic Info
  name VARCHAR(255) NOT NULL,
  website VARCHAR(255),
  industry VARCHAR(100),
  description TEXT,
  size VARCHAR(50),
  founded INTEGER,
  headquarters VARCHAR(255),
  market_position VARCHAR(50),
  
  -- Established Facts (JSONB for flexibility)
  established_facts JSONB DEFAULT '{
    "strategic_initiatives": [],
    "recent_history": [],
    "pain_points": [],
    "strengths": [],
    "public_commitments": []
  }'::jsonb,
  
  -- Monitoring Configuration
  monitoring_targets JSONB DEFAULT '{
    "competitors": {"primary": [], "emerging": [], "to_watch": []},
    "stakeholder_groups": {},
    "critical_topics": [],
    "keywords": []
  }'::jsonb,
  
  -- Intelligence Objectives
  objectives JSONB DEFAULT '{
    "primary": "",
    "risk_areas": [],
    "opportunity_areas": [],
    "blindspots": []
  }'::jsonb,
  
  -- Context Flags
  context_flags JSONB DEFAULT '{
    "is_crisis_mode": false,
    "is_launching": false,
    "is_pivoting": false,
    "regulatory_pressure": false,
    "competitive_threat_level": "moderate"
  }'::jsonb,
  
  -- Profile Metadata
  confidence_level VARCHAR(20) DEFAULT 'building', -- building, established, refined
  last_ai_analysis TIMESTAMP,
  profile_version INTEGER DEFAULT 1,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_org_profiles_organization_id ON organization_profiles(organization_id);
CREATE INDEX idx_org_profiles_name ON organization_profiles(name);
CREATE INDEX idx_org_profiles_industry ON organization_profiles(industry);
CREATE INDEX idx_org_profiles_confidence ON organization_profiles(confidence_level);

-- Create profile events table to track changes
CREATE TABLE IF NOT EXISTS profile_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES organization_profiles(id) ON DELETE CASCADE,
  event_type VARCHAR(50), -- update, enrichment, validation, correction
  event_data JSONB,
  source VARCHAR(100), -- ai_analysis, user_input, news_extraction, etc
  created_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create competitive intelligence table
CREATE TABLE IF NOT EXISTS competitive_intelligence (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES organization_profiles(id) ON DELETE CASCADE,
  competitor_name VARCHAR(255),
  
  -- Latest Intelligence
  latest_developments JSONB DEFAULT '[]'::jsonb,
  strategic_moves JSONB DEFAULT '[]'::jsonb,
  market_position JSONB,
  threat_assessment JSONB,
  opportunities JSONB DEFAULT '[]'::jsonb,
  
  -- Analysis
  last_analyzed TIMESTAMP,
  data_sources JSONB DEFAULT '[]'::jsonb,
  confidence_score DECIMAL(3,2),
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create stakeholder intelligence table
CREATE TABLE IF NOT EXISTS stakeholder_intelligence (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES organization_profiles(id) ON DELETE CASCADE,
  stakeholder_group VARCHAR(100),
  
  -- Group Analysis
  sentiment VARCHAR(20), -- positive, negative, neutral, mixed
  sentiment_score DECIMAL(3,2),
  key_concerns JSONB DEFAULT '[]'::jsonb,
  recent_actions JSONB DEFAULT '[]'::jsonb,
  influence_level VARCHAR(20), -- high, medium, low
  engagement_opportunities JSONB DEFAULT '[]'::jsonb,
  
  -- Tracking
  last_analyzed TIMESTAMP,
  data_points INTEGER DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create topic intelligence table
CREATE TABLE IF NOT EXISTS topic_intelligence (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES organization_profiles(id) ON DELETE CASCADE,
  topic_name VARCHAR(255),
  
  -- Topic Analysis
  status VARCHAR(50), -- breakthrough, trending_up, stable, trending_down, stagnant
  recent_developments JSONB DEFAULT '[]'::jsonb,
  trend_direction VARCHAR(20),
  trend_velocity DECIMAL(3,2),
  impact_assessment JSONB,
  response_options JSONB DEFAULT '[]'::jsonb,
  
  -- Metadata
  last_significant_change TIMESTAMP,
  monitoring_priority VARCHAR(20), -- critical, high, medium, low
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create predictions table
CREATE TABLE IF NOT EXISTS predictive_scenarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES organization_profiles(id) ON DELETE CASCADE,
  
  -- Scenario Details
  scenario_type VARCHAR(50), -- most_likely, best_case, worst_case, black_swan
  scenario_name VARCHAR(255),
  probability DECIMAL(3,2),
  description TEXT,
  
  -- Analysis
  triggers JSONB DEFAULT '[]'::jsonb,
  cascade_effects JSONB DEFAULT '[]'::jsonb,
  preparation_steps JSONB DEFAULT '[]'::jsonb,
  early_warning_signals JSONB DEFAULT '[]'::jsonb,
  
  -- Tracking
  status VARCHAR(50), -- monitoring, emerging, active, resolved
  first_detected TIMESTAMP,
  last_updated TIMESTAMP DEFAULT NOW(),
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create profile intelligence cache
CREATE TABLE IF NOT EXISTS profile_intelligence_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES organization_profiles(id) ON DELETE CASCADE,
  cache_key VARCHAR(255),
  cache_type VARCHAR(50), -- overview, competition, stakeholders, topics, predictions
  
  -- Cached Content
  content JSONB,
  metadata JSONB,
  
  -- Cache Management
  expires_at TIMESTAMP,
  hit_count INTEGER DEFAULT 0,
  last_accessed TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for intelligence tables
CREATE INDEX idx_competitive_intel_profile ON competitive_intelligence(profile_id);
CREATE INDEX idx_stakeholder_intel_profile ON stakeholder_intelligence(profile_id);
CREATE INDEX idx_topic_intel_profile ON topic_intelligence(profile_id);
CREATE INDEX idx_predictions_profile ON predictive_scenarios(profile_id);
CREATE INDEX idx_intel_cache_profile ON profile_intelligence_cache(profile_id);
CREATE INDEX idx_intel_cache_key ON profile_intelligence_cache(cache_key);

-- Function to update profile timestamp
CREATE OR REPLACE FUNCTION update_profile_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_org_profiles_timestamp
  BEFORE UPDATE ON organization_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_timestamp();

CREATE TRIGGER update_competitive_intel_timestamp
  BEFORE UPDATE ON competitive_intelligence
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_timestamp();

CREATE TRIGGER update_stakeholder_intel_timestamp
  BEFORE UPDATE ON stakeholder_intelligence
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_timestamp();

CREATE TRIGGER update_topic_intel_timestamp
  BEFORE UPDATE ON topic_intelligence
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_timestamp();

-- Function to increment profile version
CREATE OR REPLACE FUNCTION increment_profile_version()
RETURNS TRIGGER AS $$
BEGIN
  NEW.profile_version = OLD.profile_version + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to increment version on significant updates
CREATE TRIGGER increment_profile_version_trigger
  BEFORE UPDATE ON organization_profiles
  FOR EACH ROW
  WHEN (
    OLD.established_facts IS DISTINCT FROM NEW.established_facts OR
    OLD.monitoring_targets IS DISTINCT FROM NEW.monitoring_targets OR
    OLD.objectives IS DISTINCT FROM NEW.objectives
  )
  EXECUTE FUNCTION increment_profile_version();

-- Sample data for Toyota profile
INSERT INTO organization_profiles (
  name,
  website,
  industry,
  description,
  market_position,
  established_facts,
  monitoring_targets,
  objectives,
  confidence_level
) VALUES (
  'Toyota Motor Corporation',
  'https://www.toyota.com',
  'automotive',
  'Global automotive manufacturer and leader in hybrid technology',
  'global_leader',
  '{
    "strategic_initiatives": [
      "Hybrid technology leadership",
      "Gradual EV transition strategy", 
      "Hydrogen fuel cell development",
      "Manufacturing efficiency (TPS)"
    ],
    "recent_history": [
      "2024: Announced $8B battery plant in North Carolina",
      "2023: Committed to 30 EV models by 2030",
      "2023: Solid-state battery breakthrough announced"
    ],
    "pain_points": [
      "EV transition pace criticism",
      "Supply chain vulnerabilities",
      "Regulatory compliance costs"
    ],
    "strengths": [
      "Manufacturing excellence (TPS)",
      "Hybrid technology leadership",
      "Global supply chain network",
      "Brand reliability reputation"
    ]
  }'::jsonb,
  '{
    "competitors": {
      "primary": ["Tesla", "Volkswagen", "GM", "Ford", "Stellantis"],
      "emerging": ["BYD", "Rivian", "Nio"],
      "to_watch": ["Lucid", "Polestar", "Fisker"]
    },
    "critical_topics": [
      "Electric vehicle adoption",
      "Solid-state battery technology",
      "Autonomous driving",
      "Supply chain resilience",
      "Environmental regulations"
    ],
    "keywords": [
      "Toyota EV",
      "solid-state battery",
      "Toyota production",
      "TPS",
      "Toyota recall"
    ]
  }'::jsonb,
  '{
    "primary": "Maintain market leadership during EV transition",
    "risk_areas": [
      "Regulatory changes",
      "Supply chain disruption",
      "Technology disruption",
      "Market share erosion"
    ],
    "opportunity_areas": [
      "Solid-state battery leadership",
      "Emerging markets expansion",
      "Mobility services",
      "Hydrogen economy"
    ]
  }'::jsonb,
  'established'
) ON CONFLICT (name) DO NOTHING;