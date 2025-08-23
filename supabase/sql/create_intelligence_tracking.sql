-- Intelligence Tracking System
-- Maintains continuity and builds understanding over time

-- Track entities we're monitoring with their behavioral patterns
CREATE TABLE IF NOT EXISTS tracked_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  entity_name TEXT NOT NULL,
  entity_type TEXT NOT NULL, -- competitor, activist, regulator, influencer
  first_seen TIMESTAMP DEFAULT NOW(),
  last_seen TIMESTAMP DEFAULT NOW(),
  
  -- Behavioral patterns
  typical_behavior TEXT, -- What they usually do
  unusual_behaviors JSONB DEFAULT '[]', -- Array of unusual actions
  communication_style TEXT, -- How they typically communicate
  frequency_pattern TEXT, -- How often they act/speak
  
  -- Relationship to organization
  stance_toward_org TEXT, -- supportive, neutral, critical, hostile
  interaction_history JSONB DEFAULT '[]', -- Past interactions
  threat_level INTEGER DEFAULT 0, -- 0-10 scale
  opportunity_level INTEGER DEFAULT 0, -- 0-10 scale
  
  -- Story tracking
  ongoing_narratives JSONB DEFAULT '[]', -- Stories they're part of
  last_significant_action TEXT,
  last_significant_date TIMESTAMP,
  
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(organization_id, entity_name, entity_type)
);

-- Track topics/narratives over time
CREATE TABLE IF NOT EXISTS tracked_narratives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  narrative_title TEXT NOT NULL,
  narrative_type TEXT, -- crisis, opportunity, regulatory, market_shift
  
  -- Narrative evolution
  origin_date TIMESTAMP,
  origin_event TEXT, -- What started this narrative
  current_phase TEXT, -- emerging, accelerating, peak, declining, dormant
  key_players JSONB DEFAULT '[]', -- Entities involved
  
  -- Timeline of developments
  timeline JSONB DEFAULT '[]', -- Array of {date, event, impact}
  
  -- Predictions vs Reality
  predictions_made JSONB DEFAULT '[]', -- What we predicted
  actual_outcomes JSONB DEFAULT '[]', -- What actually happened
  
  -- Impact tracking
  impact_on_organization TEXT,
  actions_taken JSONB DEFAULT '[]',
  lessons_learned TEXT,
  
  status TEXT DEFAULT 'active', -- active, resolved, monitoring
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Track surprising/unexpected developments
CREATE TABLE IF NOT EXISTS intelligence_surprises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  
  -- What was surprising
  event_description TEXT NOT NULL,
  entity_involved TEXT,
  surprise_type TEXT, -- behavior_change, timing, alliance, reversal, emergence
  
  -- Why it was surprising
  expected_behavior TEXT, -- What we expected
  actual_behavior TEXT, -- What actually happened
  surprise_score INTEGER, -- 1-10 how surprising
  
  -- Implications
  immediate_implications TEXT,
  pattern_break TEXT, -- What pattern this breaks
  new_questions JSONB DEFAULT '[]', -- Questions this raises
  
  detected_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- Track entity relationships and alliances
CREATE TABLE IF NOT EXISTS entity_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  entity_a TEXT NOT NULL,
  entity_b TEXT NOT NULL,
  relationship_type TEXT, -- alliance, opposition, supplier, competitor
  strength INTEGER DEFAULT 5, -- 1-10 relationship strength
  
  -- Relationship dynamics
  formation_date TIMESTAMP,
  formation_context TEXT,
  recent_interactions JSONB DEFAULT '[]',
  relationship_trajectory TEXT, -- strengthening, stable, weakening
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Daily intelligence snapshots for pattern detection
CREATE TABLE IF NOT EXISTS intelligence_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  snapshot_date DATE DEFAULT CURRENT_DATE,
  
  -- What's happening
  key_events JSONB NOT NULL, -- Main events of the day
  active_entities JSONB, -- Who was active today
  dominant_topics JSONB, -- What people are talking about
  
  -- Patterns and changes
  behavioral_changes JSONB DEFAULT '[]', -- Who acted differently
  new_alliances JSONB DEFAULT '[]', -- New relationships formed
  narrative_shifts JSONB DEFAULT '[]', -- How stories evolved
  
  -- Surprise factor
  surprise_count INTEGER DEFAULT 0,
  biggest_surprise TEXT,
  
  -- Mood/Sentiment
  overall_sentiment TEXT, -- positive, negative, neutral, mixed
  tension_level INTEGER DEFAULT 5, -- 1-10 scale
  opportunity_level INTEGER DEFAULT 5, -- 1-10 scale
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(organization_id, snapshot_date)
);

-- Create indexes for performance
CREATE INDEX idx_tracked_entities_org ON tracked_entities(organization_id);
CREATE INDEX idx_tracked_entities_last_seen ON tracked_entities(last_seen);
CREATE INDEX idx_tracked_narratives_org ON tracked_narratives(organization_id);
CREATE INDEX idx_tracked_narratives_status ON tracked_narratives(status);
CREATE INDEX idx_intelligence_surprises_org ON intelligence_surprises(organization_id);
CREATE INDEX idx_intelligence_surprises_date ON intelligence_surprises(detected_at);
CREATE INDEX idx_intelligence_snapshots_org_date ON intelligence_snapshots(organization_id, snapshot_date);

-- Function to detect surprises automatically
CREATE OR REPLACE FUNCTION detect_surprise(
  p_org_id UUID,
  p_entity_name TEXT,
  p_new_action TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_entity tracked_entities;
  v_is_surprising BOOLEAN := FALSE;
BEGIN
  -- Get entity's typical behavior
  SELECT * INTO v_entity 
  FROM tracked_entities 
  WHERE organization_id = p_org_id 
  AND entity_name = p_entity_name
  LIMIT 1;
  
  IF v_entity.id IS NOT NULL THEN
    -- Check if action differs from typical behavior
    -- This is simplified - real logic would be more sophisticated
    IF v_entity.typical_behavior IS NOT NULL 
    AND p_new_action NOT LIKE '%' || v_entity.typical_behavior || '%' THEN
      v_is_surprising := TRUE;
      
      -- Record the surprise
      INSERT INTO intelligence_surprises (
        organization_id,
        entity_involved,
        event_description,
        expected_behavior,
        actual_behavior,
        surprise_type,
        surprise_score
      ) VALUES (
        p_org_id,
        p_entity_name,
        p_new_action,
        v_entity.typical_behavior,
        p_new_action,
        'behavior_change',
        7
      );
    END IF;
  END IF;
  
  RETURN v_is_surprising;
END;
$$ LANGUAGE plpgsql;