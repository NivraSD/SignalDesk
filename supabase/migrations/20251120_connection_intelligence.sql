-- Connection Intelligence Schema
-- Enables detection of relationships and patterns between entities
-- Industry-aware connection detection based on client context

-- ============================================================================
-- 1. ENTITY CONNECTIONS
-- Tracks when entities appear together or show correlated activity
-- ============================================================================

CREATE TABLE IF NOT EXISTS entity_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id VARCHAR(255) NOT NULL,

  -- Entity pair
  entity_a_id UUID REFERENCES intelligence_targets(id),
  entity_a_name TEXT NOT NULL,
  entity_a_type VARCHAR(50) NOT NULL,

  entity_b_id UUID REFERENCES intelligence_targets(id),
  entity_b_name TEXT NOT NULL,
  entity_b_type VARCHAR(50) NOT NULL,

  -- Connection metrics
  connection_type VARCHAR(100) NOT NULL, -- co_occurrence, temporal_correlation, thematic_overlap
  connection_strength DECIMAL(5,2) DEFAULT 0.0, -- 0-100 score

  -- Evidence
  shared_articles INTEGER DEFAULT 0,
  shared_topics TEXT[] DEFAULT '{}',
  shared_categories TEXT[] DEFAULT '{}',
  temporal_proximity_days INTEGER, -- How close in time are their activities

  -- Time tracking
  first_detected TIMESTAMP DEFAULT NOW(),
  last_updated TIMESTAMP DEFAULT NOW(),
  detection_window_start TIMESTAMP,
  detection_window_end TIMESTAMP,

  -- Metadata
  evidence_articles UUID[] DEFAULT '{}', -- References to target_intelligence records
  metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for entity_connections
CREATE INDEX IF NOT EXISTS idx_entity_connections_org ON entity_connections(organization_id);
CREATE INDEX IF NOT EXISTS idx_entity_connections_entity_a ON entity_connections(entity_a_id);
CREATE INDEX IF NOT EXISTS idx_entity_connections_entity_b ON entity_connections(entity_b_id);
CREATE INDEX IF NOT EXISTS idx_entity_connections_type ON entity_connections(connection_type);
CREATE INDEX IF NOT EXISTS idx_entity_connections_strength ON entity_connections(connection_strength DESC);
CREATE INDEX IF NOT EXISTS idx_entity_connections_updated ON entity_connections(last_updated DESC);

-- Unique constraint to prevent duplicate connections
CREATE UNIQUE INDEX IF NOT EXISTS idx_entity_connections_unique ON entity_connections(
  organization_id,
  entity_a_id,
  entity_b_id,
  connection_type
);

-- ============================================================================
-- 2. CONNECTION SIGNALS
-- Detected patterns based on entity relationships
-- ============================================================================

CREATE TABLE IF NOT EXISTS connection_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id VARCHAR(255) NOT NULL,

  -- Signal identification
  signal_type VARCHAR(100) NOT NULL, -- supply_chain_disruption, competitive_coordination, market_shift, reputational_cascade
  signal_title TEXT NOT NULL,
  signal_description TEXT,

  -- Entities involved
  primary_entity_id UUID REFERENCES intelligence_targets(id),
  primary_entity_name TEXT NOT NULL,
  related_entities JSONB DEFAULT '[]'::jsonb, -- Array of {id, name, role}

  -- Signal strength and confidence
  strength_score DECIMAL(5,2) DEFAULT 0.0, -- 0-100
  confidence_score DECIMAL(5,2) DEFAULT 0.0, -- 0-100

  -- Industry context
  industry_relevance VARCHAR(100), -- From industry_intelligence_profiles
  client_impact_level VARCHAR(50), -- critical, high, medium, low

  -- Pattern details
  pattern_data JSONB DEFAULT '{}'::jsonb,
  supporting_connections UUID[] DEFAULT '{}', -- References to entity_connections
  supporting_mentions UUID[] DEFAULT '{}', -- References to target_intelligence

  -- Temporal context
  signal_start_date TIMESTAMP,
  signal_detected_date TIMESTAMP DEFAULT NOW(),
  signal_maturity VARCHAR(50) DEFAULT 'emerging', -- emerging, developing, mature, declining

  -- Prediction generation
  prediction_generated BOOLEAN DEFAULT FALSE,
  prediction_id UUID, -- Reference to predictions table if generated

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for connection_signals
CREATE INDEX IF NOT EXISTS idx_connection_signals_org ON connection_signals(organization_id);
CREATE INDEX IF NOT EXISTS idx_connection_signals_type ON connection_signals(signal_type);
CREATE INDEX IF NOT EXISTS idx_connection_signals_strength ON connection_signals(strength_score DESC);
CREATE INDEX IF NOT EXISTS idx_connection_signals_confidence ON connection_signals(confidence_score DESC);
CREATE INDEX IF NOT EXISTS idx_connection_signals_detected ON connection_signals(signal_detected_date DESC);
CREATE INDEX IF NOT EXISTS idx_connection_signals_primary_entity ON connection_signals(primary_entity_id);
CREATE INDEX IF NOT EXISTS idx_connection_signals_prediction ON connection_signals(prediction_generated);
CREATE INDEX IF NOT EXISTS idx_connection_signals_industry ON connection_signals(industry_relevance);

-- ============================================================================
-- 3. INDUSTRY INTELLIGENCE PROFILES
-- Defines what connection patterns matter for each industry
-- ============================================================================

CREATE TABLE IF NOT EXISTS industry_intelligence_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Industry identification
  industry VARCHAR(100) NOT NULL UNIQUE,
  industry_category VARCHAR(50), -- B2B, B2C, Services, Manufacturing, etc.

  -- Connection patterns to detect
  connection_patterns JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Structure: [{
  --   type: "supply_chain_disruption",
  --   description: "Production issues at one company affecting downstream",
  --   triggers: ["production_halt", "logistics_delay", "regulatory_block"],
  --   entity_types_to_correlate: ["competitor", "supplier", "regulatory"],
  --   detection_window_days: 30,
  --   minimum_strength: 60,
  --   prediction_window_days: 14,
  --   relevance_for_pr_agency: 85
  -- }]

  -- Relevance weights for different connection types
  relevance_weights JSONB DEFAULT '{}'::jsonb,
  -- Structure: {
  --   "co_occurrence": 50,
  --   "temporal_correlation": 80,
  --   "thematic_overlap": 60
  -- }

  -- Prediction contexts
  prediction_contexts JSONB DEFAULT '[]'::jsonb,
  -- Structure: [{
  --   context: "When competitor faces lawsuit",
  --   prediction_type: "industry_scrutiny_increase",
  --   confidence_modifier: 0.8,
  --   timeframe_days: 30
  -- }]

  -- Organization type modifiers
  -- Different insights needed by PR agency vs. the client company itself
  org_type_modifiers JSONB DEFAULT '{}'::jsonb,
  -- Structure: {
  --   "public_relations": {
  --     "focus_areas": ["reputation_risk", "competitive_positioning", "crisis_prediction"],
  --     "signal_priority_multipliers": {
  --       "reputational_cascade": 1.5,
  --       "competitive_coordination": 1.2
  --     }
  --   },
  --   "corporate": {
  --     "focus_areas": ["market_opportunity", "competitive_threat", "operational_impact"]
  --   }
  -- }

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for industry lookup
CREATE INDEX IF NOT EXISTS idx_industry_profiles_industry ON industry_intelligence_profiles(industry);

-- ============================================================================
-- 4. INTELLIGENCE GRAPH
-- Knowledge graph structure for entity relationships
-- ============================================================================

CREATE TABLE IF NOT EXISTS intelligence_graph (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id VARCHAR(255) NOT NULL,

  -- Graph structure
  node_type VARCHAR(50) NOT NULL, -- entity, topic, event, location
  node_id UUID NOT NULL, -- References intelligence_targets or other tables
  node_name TEXT NOT NULL,

  -- Relationships (edges)
  relationships JSONB DEFAULT '[]'::jsonb,
  -- Structure: [{
  --   to_node_id: "uuid",
  --   to_node_name: "Entity B",
  --   relationship_type: "competitor|supplier|customer|partner|adversary",
  --   relationship_strength: 75,
  --   evidence_count: 12,
  --   last_interaction_date: "2025-11-20"
  -- }]

  -- Node metrics
  centrality_score DECIMAL(5,2) DEFAULT 0.0, -- How central is this node in the graph
  activity_score DECIMAL(5,2) DEFAULT 0.0, -- How active recently

  -- Time tracking
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for intelligence_graph
CREATE INDEX IF NOT EXISTS idx_intelligence_graph_org ON intelligence_graph(organization_id);
CREATE INDEX IF NOT EXISTS idx_intelligence_graph_node_type ON intelligence_graph(node_type);
CREATE INDEX IF NOT EXISTS idx_intelligence_graph_node_id ON intelligence_graph(node_id);
CREATE INDEX IF NOT EXISTS idx_intelligence_graph_centrality ON intelligence_graph(centrality_score DESC);

-- Unique constraint for nodes
CREATE UNIQUE INDEX IF NOT EXISTS idx_intelligence_graph_unique ON intelligence_graph(
  organization_id,
  node_type,
  node_id
);

-- ============================================================================
-- 5. VIEWS FOR CONNECTION ANALYSIS
-- ============================================================================

-- View: High-strength connections needing investigation
CREATE OR REPLACE VIEW strong_connections_summary AS
SELECT
  ec.organization_id,
  ec.entity_a_name,
  ec.entity_b_name,
  ec.connection_type,
  ec.connection_strength,
  ec.shared_articles,
  ec.shared_topics,
  ec.last_updated,
  ec.id as connection_id
FROM entity_connections ec
WHERE ec.connection_strength >= 60
ORDER BY ec.connection_strength DESC, ec.last_updated DESC;

-- View: Emerging signals that need predictions
CREATE OR REPLACE VIEW signals_needing_attention AS
SELECT
  cs.organization_id,
  cs.signal_type,
  cs.signal_title,
  cs.primary_entity_name,
  cs.strength_score,
  cs.confidence_score,
  cs.client_impact_level,
  cs.signal_maturity,
  cs.prediction_generated,
  cs.signal_detected_date,
  cs.id as signal_id
FROM connection_signals cs
WHERE cs.prediction_generated = FALSE
  AND cs.strength_score >= 50
  AND cs.confidence_score >= 40
ORDER BY cs.strength_score DESC, cs.confidence_score DESC;

-- View: Network activity summary by entity
CREATE OR REPLACE VIEW entity_network_activity AS
SELECT
  organization_id,
  entity_a_name as entity_name,
  COUNT(*) as total_connections,
  AVG(connection_strength) as avg_connection_strength,
  COUNT(CASE WHEN connection_strength >= 70 THEN 1 END) as strong_connections,
  ARRAY_AGG(DISTINCT connection_type) as connection_types,
  MAX(last_updated) as most_recent_connection
FROM entity_connections
GROUP BY organization_id, entity_a_name
ORDER BY total_connections DESC;

-- ============================================================================
-- 6. SEED DATA: COMMODITIES TRADING INDUSTRY PROFILE
-- ============================================================================

INSERT INTO industry_intelligence_profiles (industry, industry_category, connection_patterns, relevance_weights, prediction_contexts, org_type_modifiers)
VALUES (
  'commodities_trading',
  'B2B',
  '[
    {
      "type": "supply_chain_disruption",
      "description": "Production issues, logistics delays, or regulatory blocks affecting supply",
      "triggers": ["production_halt", "logistics_delay", "regulatory_block", "sanctions", "mine_closure", "refinery_shutdown"],
      "entity_types_to_correlate": ["competitor", "supplier", "regulatory_body"],
      "detection_window_days": 30,
      "minimum_strength": 60,
      "prediction_window_days": 14,
      "relevance_for_pr_agency": 85
    },
    {
      "type": "competitive_coordination",
      "description": "Multiple competitors making similar moves in pricing, supply, or market entry",
      "triggers": ["price_change", "supply_announcement", "production_cut", "market_expansion", "market_exit"],
      "entity_types_to_correlate": ["competitor"],
      "detection_window_days": 7,
      "minimum_strength": 70,
      "prediction_window_days": 7,
      "relevance_for_pr_agency": 75
    },
    {
      "type": "reputational_cascade",
      "description": "Negative event at one company triggering industry-wide scrutiny",
      "triggers": ["lawsuit", "scandal", "environmental_violation", "safety_incident", "corruption_allegation"],
      "entity_types_to_correlate": ["competitor", "industry_body", "regulatory_body"],
      "detection_window_days": 14,
      "minimum_strength": 65,
      "prediction_window_days": 21,
      "relevance_for_pr_agency": 95
    },
    {
      "type": "geopolitical_impact",
      "description": "Geopolitical events affecting multiple entities in the industry",
      "triggers": ["trade_war", "sanctions", "political_instability", "conflict", "regulatory_change"],
      "entity_types_to_correlate": ["competitor", "supplier", "regulatory_body", "country"],
      "detection_window_days": 45,
      "minimum_strength": 70,
      "prediction_window_days": 30,
      "relevance_for_pr_agency": 90
    },
    {
      "type": "market_consolidation",
      "description": "M&A activity, partnerships, or strategic alliances reshaping competitive landscape",
      "triggers": ["acquisition", "merger", "partnership", "joint_venture", "strategic_alliance"],
      "entity_types_to_correlate": ["competitor", "supplier", "customer"],
      "detection_window_days": 60,
      "minimum_strength": 75,
      "prediction_window_days": 90,
      "relevance_for_pr_agency": 80
    }
  ]'::jsonb,
  '{
    "co_occurrence": 50,
    "temporal_correlation": 80,
    "thematic_overlap": 60,
    "sentiment_correlation": 70
  }'::jsonb,
  '[
    {
      "context": "When competitor faces major lawsuit or regulatory action",
      "prediction_type": "industry_scrutiny_increase",
      "confidence_modifier": 0.85,
      "timeframe_days": 30
    },
    {
      "context": "When multiple competitors announce supply cuts",
      "prediction_type": "market_price_volatility",
      "confidence_modifier": 0.75,
      "timeframe_days": 14
    },
    {
      "context": "When geopolitical event affects key supplier region",
      "prediction_type": "supply_chain_disruption",
      "confidence_modifier": 0.80,
      "timeframe_days": 21
    }
  ]'::jsonb,
  '{
    "public_relations": {
      "focus_areas": ["reputation_risk", "competitive_positioning", "crisis_prediction", "narrative_opportunity"],
      "signal_priority_multipliers": {
        "reputational_cascade": 1.5,
        "competitive_coordination": 1.2,
        "geopolitical_impact": 1.4,
        "market_consolidation": 1.1
      }
    },
    "corporate": {
      "focus_areas": ["market_opportunity", "competitive_threat", "operational_impact", "strategic_positioning"],
      "signal_priority_multipliers": {
        "supply_chain_disruption": 1.5,
        "market_consolidation": 1.4,
        "competitive_coordination": 1.3
      }
    }
  }'::jsonb
)
ON CONFLICT (industry) DO UPDATE SET
  connection_patterns = EXCLUDED.connection_patterns,
  relevance_weights = EXCLUDED.relevance_weights,
  prediction_contexts = EXCLUDED.prediction_contexts,
  org_type_modifiers = EXCLUDED.org_type_modifiers,
  updated_at = NOW();

-- ============================================================================
-- 7. SEED DATA: PUBLIC RELATIONS INDUSTRY PROFILE
-- ============================================================================

INSERT INTO industry_intelligence_profiles (industry, industry_category, connection_patterns, relevance_weights, prediction_contexts, org_type_modifiers)
VALUES (
  'public_relations',
  'Services',
  '[
    {
      "type": "client_reputation_threat",
      "description": "Negative events affecting client reputation or industry perception",
      "triggers": ["scandal", "lawsuit", "controversy", "crisis", "negative_coverage"],
      "entity_types_to_correlate": ["client", "media_outlet", "industry_body"],
      "detection_window_days": 14,
      "minimum_strength": 70,
      "prediction_window_days": 7,
      "relevance_for_pr_agency": 95
    },
    {
      "type": "media_narrative_shift",
      "description": "Changes in media coverage themes or sentiment across multiple outlets",
      "triggers": ["trend_change", "coverage_spike", "sentiment_shift", "new_angle"],
      "entity_types_to_correlate": ["media_outlet", "journalist", "competitor"],
      "detection_window_days": 21,
      "minimum_strength": 60,
      "prediction_window_days": 14,
      "relevance_for_pr_agency": 90
    },
    {
      "type": "competitive_pr_activity",
      "description": "Competitor PR campaigns, announcements, or reputation initiatives",
      "triggers": ["campaign_launch", "announcement", "partnership_pr", "award", "thought_leadership"],
      "entity_types_to_correlate": ["competitor", "media_outlet"],
      "detection_window_days": 30,
      "minimum_strength": 65,
      "prediction_window_days": 21,
      "relevance_for_pr_agency": 85
    },
    {
      "type": "industry_crisis",
      "description": "Industry-wide issues that could affect multiple clients or create opportunity",
      "triggers": ["regulatory_change", "industry_scandal", "market_disruption", "public_backlash"],
      "entity_types_to_correlate": ["industry_body", "regulatory_body", "competitor"],
      "detection_window_days": 30,
      "minimum_strength": 70,
      "prediction_window_days": 14,
      "relevance_for_pr_agency": 90
    }
  ]'::jsonb,
  '{
    "co_occurrence": 60,
    "temporal_correlation": 75,
    "thematic_overlap": 70,
    "sentiment_correlation": 85
  }'::jsonb,
  '[
    {
      "context": "When client faces negative media coverage spike",
      "prediction_type": "reputation_crisis_escalation",
      "confidence_modifier": 0.80,
      "timeframe_days": 7
    },
    {
      "context": "When competitor launches major PR campaign",
      "prediction_type": "media_share_loss",
      "confidence_modifier": 0.70,
      "timeframe_days": 21
    }
  ]'::jsonb,
  '{
    "public_relations": {
      "focus_areas": ["client_protection", "narrative_control", "opportunity_identification", "crisis_prevention"],
      "signal_priority_multipliers": {
        "client_reputation_threat": 2.0,
        "media_narrative_shift": 1.5,
        "industry_crisis": 1.6
      }
    }
  }'::jsonb
)
ON CONFLICT (industry) DO UPDATE SET
  connection_patterns = EXCLUDED.connection_patterns,
  relevance_weights = EXCLUDED.relevance_weights,
  prediction_contexts = EXCLUDED.prediction_contexts,
  org_type_modifiers = EXCLUDED.org_type_modifiers,
  updated_at = NOW();

-- ============================================================================
-- 8. SEED DATA: TECHNOLOGY INDUSTRY PROFILE
-- ============================================================================

INSERT INTO industry_intelligence_profiles (industry, industry_category, connection_patterns, relevance_weights, prediction_contexts, org_type_modifiers)
VALUES (
  'technology',
  'B2B/B2C',
  '[
    {
      "type": "competitive_product_response",
      "description": "Competitor product launches triggering responses from other players",
      "triggers": ["product_launch", "feature_announcement", "platform_update", "api_release"],
      "entity_types_to_correlate": ["competitor", "partner"],
      "detection_window_days": 90,
      "minimum_strength": 65,
      "prediction_window_days": 60,
      "relevance_for_pr_agency": 75
    },
    {
      "type": "ecosystem_shift",
      "description": "Platform changes, partnerships, or acquisitions affecting ecosystem",
      "triggers": ["partnership", "acquisition", "platform_policy_change", "deprecation"],
      "entity_types_to_correlate": ["partner", "supplier", "competitor"],
      "detection_window_days": 120,
      "minimum_strength": 70,
      "prediction_window_days": 90,
      "relevance_for_pr_agency": 80
    },
    {
      "type": "talent_movement",
      "description": "Key executive or talent moves between companies",
      "triggers": ["executive_hire", "departure", "team_acquisition", "poaching"],
      "entity_types_to_correlate": ["competitor", "partner"],
      "detection_window_days": 60,
      "minimum_strength": 60,
      "prediction_window_days": 45,
      "relevance_for_pr_agency": 70
    }
  ]'::jsonb,
  '{
    "co_occurrence": 55,
    "temporal_correlation": 70,
    "thematic_overlap": 65,
    "sentiment_correlation": 60
  }'::jsonb,
  '[
    {
      "context": "When major competitor launches similar product",
      "prediction_type": "feature_parity_race",
      "confidence_modifier": 0.75,
      "timeframe_days": 90
    }
  ]'::jsonb,
  '{
    "corporate": {
      "focus_areas": ["competitive_intelligence", "partnership_opportunities", "product_strategy"],
      "signal_priority_multipliers": {
        "competitive_product_response": 1.4,
        "ecosystem_shift": 1.5
      }
    }
  }'::jsonb
)
ON CONFLICT (industry) DO UPDATE SET
  connection_patterns = EXCLUDED.connection_patterns,
  relevance_weights = EXCLUDED.relevance_weights,
  prediction_contexts = EXCLUDED.prediction_contexts,
  org_type_modifiers = EXCLUDED.org_type_modifiers,
  updated_at = NOW();

-- ============================================================================
-- 9. TRIGGERS FOR AUTO-UPDATE
-- ============================================================================

-- Auto-update timestamp on connection_signals
CREATE OR REPLACE FUNCTION update_connection_signals_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER connection_signals_update_timestamp
BEFORE UPDATE ON connection_signals
FOR EACH ROW
EXECUTE FUNCTION update_connection_signals_timestamp();

-- Auto-update timestamp on entity_connections
CREATE OR REPLACE FUNCTION update_entity_connections_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER entity_connections_update_timestamp
BEFORE UPDATE ON entity_connections
FOR EACH ROW
EXECUTE FUNCTION update_entity_connections_timestamp();
