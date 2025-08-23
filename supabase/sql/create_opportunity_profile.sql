-- Opportunity Engine Profile
-- Organization-specific configuration for opportunity detection and execution

-- Enhanced organization profile for opportunity engine
CREATE TABLE IF NOT EXISTS organization_opportunity_profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) UNIQUE,
  
  -- Brand & Voice
  brand_voice TEXT, -- formal, conversational, bold, technical
  risk_tolerance TEXT, -- conservative, moderate, aggressive
  response_speed TEXT, -- immediate, considered, strategic
  
  -- Key Messages & Positioning
  core_value_props JSONB DEFAULT '[]', -- Array of key differentiators
  proof_points JSONB DEFAULT '[]', -- Data points, achievements, credentials
  competitive_advantages JSONB DEFAULT '[]', -- What makes them better
  key_narratives JSONB DEFAULT '[]', -- Stories they want to own
  
  -- Media Preferences
  preferred_media_tiers JSONB DEFAULT '[]', -- tier1_business, tier1_tech, trade, regional
  exclusive_partners JSONB DEFAULT '[]', -- Media outlets with special relationships
  journalist_relationships JSONB DEFAULT '[]', -- Known journalists with relationship status
  no_comment_topics JSONB DEFAULT '[]', -- Topics to avoid
  
  -- Spokesperson Configuration
  spokespeople JSONB DEFAULT '[]', -- Array of {name, role, expertise, availability}
  approval_chain JSONB DEFAULT '[]', -- Who needs to approve what
  
  -- Opportunity Preferences
  opportunity_types JSONB DEFAULT '{
    "competitor_weakness": true,
    "narrative_vacuum": true,
    "cascade_effect": true,
    "crisis_prevention": true,
    "alliance_opening": false
  }',
  
  minimum_confidence INTEGER DEFAULT 70, -- Don't show opportunities below this
  auto_execute_threshold INTEGER DEFAULT 95, -- Auto-execute above this confidence
  
  -- Action Templates
  standard_responses JSONB DEFAULT '{}', -- Pre-approved response templates
  escalation_triggers JSONB DEFAULT '[]', -- When to escalate to leadership
  
  -- Constraints & Guidelines
  legal_constraints JSONB DEFAULT '[]', -- Things they can't say/do
  regulatory_requirements JSONB DEFAULT '[]', -- Compliance needs
  brand_guidelines JSONB DEFAULT '{}', -- Visual/verbal brand rules
  
  -- Historical Performance
  successful_tactics JSONB DEFAULT '[]', -- What has worked before
  failed_approaches JSONB DEFAULT '[]', -- What to avoid
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Opportunity execution history for learning
CREATE TABLE IF NOT EXISTS opportunity_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  opportunity_id UUID,
  
  -- Opportunity details
  opportunity_type TEXT,
  opportunity_title TEXT,
  confidence_score INTEGER,
  urgency_level TEXT,
  
  -- Execution details
  executed_at TIMESTAMP,
  execution_strategy JSONB, -- What was done
  channels_used JSONB, -- Where it was executed
  content_used JSONB, -- What was said
  
  -- Results
  media_coverage JSONB DEFAULT '[]', -- Articles generated
  sentiment_impact TEXT, -- positive, negative, neutral
  reach_metrics JSONB, -- Impressions, engagement
  competitive_impact TEXT, -- Did it work against competitors
  
  -- Learning
  success_rating INTEGER, -- 1-10 scale
  lessons_learned TEXT,
  would_repeat BOOLEAN,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Quick action templates for common scenarios
CREATE TABLE IF NOT EXISTS action_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  
  template_name TEXT NOT NULL,
  trigger_condition TEXT, -- When to use this template
  
  -- Template content
  press_release_template TEXT,
  executive_statement_template TEXT,
  social_media_templates JSONB,
  email_templates JSONB,
  
  -- Execution rules
  media_targets JSONB, -- Which outlets to target
  timing_rules JSONB, -- When to execute
  approval_required BOOLEAN DEFAULT true,
  
  -- Performance
  times_used INTEGER DEFAULT 0,
  success_rate DECIMAL,
  last_used TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Media relationship tracking
CREATE TABLE IF NOT EXISTS media_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  
  -- Journalist/outlet info
  journalist_name TEXT,
  outlet_name TEXT NOT NULL,
  outlet_tier TEXT, -- tier1, tier2, trade, regional
  beat TEXT, -- What they cover
  
  -- Relationship details
  relationship_status TEXT, -- cold, warm, hot, exclusive
  last_interaction TIMESTAMP,
  interaction_history JSONB DEFAULT '[]',
  
  -- Preferences
  preferred_contact_method TEXT, -- email, phone, twitter
  best_pitch_time TEXT, -- morning, afternoon, evening
  interests JSONB DEFAULT '[]', -- Topics they like
  avoid_topics JSONB DEFAULT '[]', -- Topics they don't like
  
  -- Performance
  pitches_sent INTEGER DEFAULT 0,
  pitches_accepted INTEGER DEFAULT 0,
  articles_published INTEGER DEFAULT 0,
  sentiment_average TEXT, -- positive, neutral, negative
  
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Competitive positioning for opportunity detection
CREATE TABLE IF NOT EXISTS competitive_positioning (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  competitor_name TEXT NOT NULL,
  
  -- Positioning
  our_advantages JSONB DEFAULT '[]', -- Where we beat them
  their_advantages JSONB DEFAULT '[]', -- Where they beat us
  
  -- Messaging
  counter_narratives JSONB DEFAULT '[]', -- How to respond to their moves
  differentiation_points JSONB DEFAULT '[]', -- How we're different
  
  -- Tactics
  their_typical_moves JSONB DEFAULT '[]', -- What they usually do
  our_counter_moves JSONB DEFAULT '[]', -- How we respond
  
  -- History
  past_battles JSONB DEFAULT '[]', -- Previous competitive situations
  win_loss_record JSONB DEFAULT '{}', -- Track record against them
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(organization_id, competitor_name)
);

-- Create indexes
CREATE INDEX idx_opp_profile_org ON organization_opportunity_profile(organization_id);
CREATE INDEX idx_opp_executions_org ON opportunity_executions(organization_id);
CREATE INDEX idx_opp_executions_date ON opportunity_executions(executed_at);
CREATE INDEX idx_action_templates_org ON action_templates(organization_id);
CREATE INDEX idx_media_relationships_org ON media_relationships(organization_id);
CREATE INDEX idx_competitive_positioning_org ON competitive_positioning(organization_id);

-- Function to get opportunity configuration
CREATE OR REPLACE FUNCTION get_opportunity_config(p_org_id UUID)
RETURNS JSON AS $$
DECLARE
  v_config JSON;
BEGIN
  SELECT json_build_object(
    'profile', row_to_json(oop.*),
    'media_relationships', (
      SELECT json_agg(row_to_json(mr.*))
      FROM media_relationships mr
      WHERE mr.organization_id = p_org_id
    ),
    'action_templates', (
      SELECT json_agg(row_to_json(at.*))
      FROM action_templates at
      WHERE at.organization_id = p_org_id
    ),
    'competitive_positioning', (
      SELECT json_agg(row_to_json(cp.*))
      FROM competitive_positioning cp
      WHERE cp.organization_id = p_org_id
    ),
    'recent_executions', (
      SELECT json_agg(row_to_json(oe.*))
      FROM opportunity_executions oe
      WHERE oe.organization_id = p_org_id
      ORDER BY oe.executed_at DESC
      LIMIT 10
    )
  ) INTO v_config
  FROM organization_opportunity_profile oop
  WHERE oop.organization_id = p_org_id;
  
  RETURN v_config;
END;
$$ LANGUAGE plpgsql;