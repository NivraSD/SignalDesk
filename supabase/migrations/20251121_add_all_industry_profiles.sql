-- Comprehensive industry intelligence profiles for all major industries
-- Provides connection detection patterns for any industry type

-- ============================================================================
-- PROFESSIONAL SERVICES INDUSTRIES
-- ============================================================================

-- Management Consulting
INSERT INTO industry_intelligence_profiles (industry, industry_category, connection_patterns, relevance_weights, prediction_contexts, org_type_modifiers)
VALUES (
  'Management Consulting',
  'Professional Services',
  '[
    {
      "type": "client_competitive_threat",
      "description": "Client facing competitive pressure or market disruption",
      "triggers": ["market_entry", "pricing_pressure", "innovation", "regulation"],
      "entity_types_to_correlate": ["client", "competitor", "industry_body"],
      "detection_window_days": 30,
      "minimum_strength": 65,
      "prediction_window_days": 21,
      "relevance_for_pr_agency": 85
    },
    {
      "type": "industry_expertise_demand",
      "description": "Emerging demand for specific consulting expertise",
      "triggers": ["regulatory_change", "technology_shift", "market_disruption"],
      "entity_types_to_correlate": ["industry_body", "competitor", "media_outlet"],
      "detection_window_days": 60,
      "minimum_strength": 60,
      "prediction_window_days": 45,
      "relevance_for_pr_agency": 75
    }
  ]'::jsonb,
  '{
    "co_occurrence": 55,
    "temporal_correlation": 70,
    "thematic_overlap": 65,
    "sentiment_correlation": 60
  }'::jsonb,
  '[]'::jsonb,
  '{}'::jsonb
)
ON CONFLICT (industry) DO NOTHING;

-- Legal Services
INSERT INTO industry_intelligence_profiles (industry, industry_category, connection_patterns, relevance_weights, prediction_contexts, org_type_modifiers)
VALUES (
  'Legal Services',
  'Professional Services',
  '[
    {
      "type": "regulatory_change_impact",
      "description": "New regulations affecting client industries",
      "triggers": ["law_change", "court_ruling", "regulatory_announcement"],
      "entity_types_to_correlate": ["regulatory_body", "client", "industry_body"],
      "detection_window_days": 30,
      "minimum_strength": 70,
      "prediction_window_days": 14,
      "relevance_for_pr_agency": 90
    },
    {
      "type": "litigation_trend",
      "description": "Patterns in lawsuits or legal actions",
      "triggers": ["lawsuit", "settlement", "class_action"],
      "entity_types_to_correlate": ["competitor", "client", "industry_body"],
      "detection_window_days": 90,
      "minimum_strength": 65,
      "prediction_window_days": 60,
      "relevance_for_pr_agency": 85
    }
  ]'::jsonb,
  '{
    "co_occurrence": 60,
    "temporal_correlation": 80,
    "thematic_overlap": 70,
    "sentiment_correlation": 75
  }'::jsonb,
  '[]'::jsonb,
  '{}'::jsonb
)
ON CONFLICT (industry) DO NOTHING;

-- Accounting & Financial Services
INSERT INTO industry_intelligence_profiles (industry, industry_category, connection_patterns, relevance_weights, prediction_contexts, org_type_modifiers)
VALUES (
  'Accounting',
  'Professional Services',
  '[
    {
      "type": "compliance_change",
      "description": "Accounting standards or tax law changes",
      "triggers": ["standard_change", "tax_law", "reporting_requirement"],
      "entity_types_to_correlate": ["regulatory_body", "client", "industry_body"],
      "detection_window_days": 60,
      "minimum_strength": 70,
      "prediction_window_days": 30,
      "relevance_for_pr_agency": 85
    }
  ]'::jsonb,
  '{
    "co_occurrence": 55,
    "temporal_correlation": 75,
    "thematic_overlap": 65,
    "sentiment_correlation": 70
  }'::jsonb,
  '[]'::jsonb,
  '{}'::jsonb
)
ON CONFLICT (industry) DO NOTHING;

-- ============================================================================
-- FINANCIAL SERVICES
-- ============================================================================

-- Banking
INSERT INTO industry_intelligence_profiles (industry, industry_category, connection_patterns, relevance_weights, prediction_contexts, org_type_modifiers)
VALUES (
  'Banking',
  'Financial Services',
  '[
    {
      "type": "regulatory_enforcement",
      "description": "Banking regulations and enforcement actions",
      "triggers": ["fine", "investigation", "regulation_change", "compliance_failure"],
      "entity_types_to_correlate": ["competitor", "regulatory_body"],
      "detection_window_days": 30,
      "minimum_strength": 75,
      "prediction_window_days": 21,
      "relevance_for_pr_agency": 90
    },
    {
      "type": "fintech_disruption",
      "description": "Technology disruption in banking services",
      "triggers": ["fintech_launch", "digital_banking", "blockchain", "payment_innovation"],
      "entity_types_to_correlate": ["competitor", "technology_partner"],
      "detection_window_days": 90,
      "minimum_strength": 60,
      "prediction_window_days": 60,
      "relevance_for_pr_agency": 75
    }
  ]'::jsonb,
  '{
    "co_occurrence": 60,
    "temporal_correlation": 80,
    "thematic_overlap": 70,
    "sentiment_correlation": 85
  }'::jsonb,
  '[]'::jsonb,
  '{}'::jsonb
)
ON CONFLICT (industry) DO NOTHING;

-- Investment Management
INSERT INTO industry_intelligence_profiles (industry, industry_category, connection_patterns, relevance_weights, prediction_contexts, org_type_modifiers)
VALUES (
  'Investment Management',
  'Financial Services',
  '[
    {
      "type": "market_volatility_response",
      "description": "Fund performance and strategy changes during market volatility",
      "triggers": ["market_crash", "volatility_spike", "strategy_shift"],
      "entity_types_to_correlate": ["competitor", "market_indicator"],
      "detection_window_days": 14,
      "minimum_strength": 65,
      "prediction_window_days": 7,
      "relevance_for_pr_agency": 80
    }
  ]'::jsonb,
  '{
    "co_occurrence": 55,
    "temporal_correlation": 75,
    "thematic_overlap": 65,
    "sentiment_correlation": 80
  }'::jsonb,
  '[]'::jsonb,
  '{}'::jsonb
)
ON CONFLICT (industry) DO NOTHING;

-- ============================================================================
-- HEALTHCARE
-- ============================================================================

-- Pharmaceuticals
INSERT INTO industry_intelligence_profiles (industry, industry_category, connection_patterns, relevance_weights, prediction_contexts, org_type_modifiers)
VALUES (
  'Pharmaceuticals',
  'Healthcare',
  '[
    {
      "type": "drug_approval_cascade",
      "description": "FDA approvals or rejections affecting competitive landscape",
      "triggers": ["fda_approval", "fda_rejection", "clinical_trial_result"],
      "entity_types_to_correlate": ["competitor", "regulatory_body"],
      "detection_window_days": 30,
      "minimum_strength": 75,
      "prediction_window_days": 21,
      "relevance_for_pr_agency": 90
    },
    {
      "type": "patent_expiry_impact",
      "description": "Patent expirations creating generic competition",
      "triggers": ["patent_expiry", "generic_launch", "exclusivity_loss"],
      "entity_types_to_correlate": ["competitor", "product"],
      "detection_window_days": 180,
      "minimum_strength": 70,
      "prediction_window_days": 90,
      "relevance_for_pr_agency": 85
    }
  ]'::jsonb,
  '{
    "co_occurrence": 60,
    "temporal_correlation": 80,
    "thematic_overlap": 70,
    "sentiment_correlation": 75
  }'::jsonb,
  '[]'::jsonb,
  '{}'::jsonb
)
ON CONFLICT (industry) DO NOTHING;

-- Healthcare Services
INSERT INTO industry_intelligence_profiles (industry, industry_category, connection_patterns, relevance_weights, prediction_contexts, org_type_modifiers)
VALUES (
  'Healthcare Services',
  'Healthcare',
  '[
    {
      "type": "reimbursement_change",
      "description": "Insurance and Medicare reimbursement policy changes",
      "triggers": ["policy_change", "rate_change", "coverage_decision"],
      "entity_types_to_correlate": ["regulatory_body", "payer", "competitor"],
      "detection_window_days": 60,
      "minimum_strength": 70,
      "prediction_window_days": 30,
      "relevance_for_pr_agency": 85
    }
  ]'::jsonb,
  '{
    "co_occurrence": 55,
    "temporal_correlation": 75,
    "thematic_overlap": 65,
    "sentiment_correlation": 70
  }'::jsonb,
  '[]'::jsonb,
  '{}'::jsonb
)
ON CONFLICT (industry) DO NOTHING;

-- ============================================================================
-- TECHNOLOGY (Additional sectors)
-- ============================================================================

-- Software & SaaS
INSERT INTO industry_intelligence_profiles (industry, industry_category, connection_patterns, relevance_weights, prediction_contexts, org_type_modifiers)
VALUES (
  'Software',
  'Technology',
  '[
    {
      "type": "feature_parity_race",
      "description": "Competitors copying features or rushing to market",
      "triggers": ["feature_launch", "product_update", "acquisition_for_features"],
      "entity_types_to_correlate": ["competitor", "technology_partner"],
      "detection_window_days": 60,
      "minimum_strength": 65,
      "prediction_window_days": 45,
      "relevance_for_pr_agency": 75
    }
  ]'::jsonb,
  '{
    "co_occurrence": 55,
    "temporal_correlation": 70,
    "thematic_overlap": 65,
    "sentiment_correlation": 60
  }'::jsonb,
  '[]'::jsonb,
  '{}'::jsonb
)
ON CONFLICT (industry) DO NOTHING;

-- Cybersecurity
INSERT INTO industry_intelligence_profiles (industry, industry_category, connection_patterns, relevance_weights, prediction_contexts, org_type_modifiers)
VALUES (
  'Cybersecurity',
  'Technology',
  '[
    {
      "type": "breach_cascade",
      "description": "Security breaches creating industry-wide scrutiny",
      "triggers": ["data_breach", "ransomware", "vulnerability_disclosure"],
      "entity_types_to_correlate": ["competitor", "client", "regulatory_body"],
      "detection_window_days": 14,
      "minimum_strength": 75,
      "prediction_window_days": 7,
      "relevance_for_pr_agency": 95
    }
  ]'::jsonb,
  '{
    "co_occurrence": 60,
    "temporal_correlation": 85,
    "thematic_overlap": 70,
    "sentiment_correlation": 80
  }'::jsonb,
  '[]'::jsonb,
  '{}'::jsonb
)
ON CONFLICT (industry) DO NOTHING;

-- ============================================================================
-- RETAIL & CONSUMER
-- ============================================================================

-- Retail
INSERT INTO industry_intelligence_profiles (industry, industry_category, connection_patterns, relevance_weights, prediction_contexts, org_type_modifiers)
VALUES (
  'Retail',
  'Consumer',
  '[
    {
      "type": "consumer_trend_shift",
      "description": "Changing consumer preferences affecting multiple retailers",
      "triggers": ["trend_change", "buying_pattern_shift", "channel_shift"],
      "entity_types_to_correlate": ["competitor", "brand", "market_research"],
      "detection_window_days": 90,
      "minimum_strength": 60,
      "prediction_window_days": 60,
      "relevance_for_pr_agency": 75
    }
  ]'::jsonb,
  '{
    "co_occurrence": 55,
    "temporal_correlation": 70,
    "thematic_overlap": 65,
    "sentiment_correlation": 75
  }'::jsonb,
  '[]'::jsonb,
  '{}'::jsonb
)
ON CONFLICT (industry) DO NOTHING;

-- Consumer Goods
INSERT INTO industry_intelligence_profiles (industry, industry_category, connection_patterns, relevance_weights, prediction_contexts, org_type_modifiers)
VALUES (
  'Consumer Goods',
  'Consumer',
  '[
    {
      "type": "product_recall_cascade",
      "description": "Product recalls triggering industry scrutiny",
      "triggers": ["recall", "safety_issue", "quality_problem"],
      "entity_types_to_correlate": ["competitor", "regulatory_body"],
      "detection_window_days": 30,
      "minimum_strength": 75,
      "prediction_window_days": 21,
      "relevance_for_pr_agency": 90
    }
  ]'::jsonb,
  '{
    "co_occurrence": 60,
    "temporal_correlation": 80,
    "thematic_overlap": 70,
    "sentiment_correlation": 85
  }'::jsonb,
  '[]'::jsonb,
  '{}'::jsonb
)
ON CONFLICT (industry) DO NOTHING;

-- ============================================================================
-- ENERGY & UTILITIES
-- ============================================================================

-- Oil & Gas
INSERT INTO industry_intelligence_profiles (industry, industry_category, connection_patterns, relevance_weights, prediction_contexts, org_type_modifiers)
VALUES (
  'Oil & Gas',
  'Energy',
  '[
    {
      "type": "commodity_price_shock",
      "description": "Oil price volatility affecting operations and investments",
      "triggers": ["price_spike", "price_crash", "opec_decision", "geopolitical_event"],
      "entity_types_to_correlate": ["competitor", "supplier", "geopolitical"],
      "detection_window_days": 30,
      "minimum_strength": 70,
      "prediction_window_days": 21,
      "relevance_for_pr_agency": 85
    },
    {
      "type": "environmental_scrutiny",
      "description": "ESG pressures and environmental regulations",
      "triggers": ["environmental_violation", "climate_activism", "regulation"],
      "entity_types_to_correlate": ["competitor", "regulatory_body", "activist"],
      "detection_window_days": 60,
      "minimum_strength": 75,
      "prediction_window_days": 45,
      "relevance_for_pr_agency": 90
    }
  ]'::jsonb,
  '{
    "co_occurrence": 60,
    "temporal_correlation": 80,
    "thematic_overlap": 70,
    "sentiment_correlation": 75
  }'::jsonb,
  '[]'::jsonb,
  '{}'::jsonb
)
ON CONFLICT (industry) DO NOTHING;

-- Renewable Energy
INSERT INTO industry_intelligence_profiles (industry, industry_category, connection_patterns, relevance_weights, prediction_contexts, org_type_modifiers)
VALUES (
  'Renewable Energy',
  'Energy',
  '[
    {
      "type": "policy_incentive_change",
      "description": "Changes in government renewable energy incentives",
      "triggers": ["subsidy_change", "tax_credit", "mandate", "policy_shift"],
      "entity_types_to_correlate": ["regulatory_body", "competitor"],
      "detection_window_days": 60,
      "minimum_strength": 70,
      "prediction_window_days": 30,
      "relevance_for_pr_agency": 85
    }
  ]'::jsonb,
  '{
    "co_occurrence": 55,
    "temporal_correlation": 75,
    "thematic_overlap": 65,
    "sentiment_correlation": 70
  }'::jsonb,
  '[]'::jsonb,
  '{}'::jsonb
)
ON CONFLICT (industry) DO NOTHING;

-- ============================================================================
-- MANUFACTURING & INDUSTRIAL
-- ============================================================================

-- Automotive
INSERT INTO industry_intelligence_profiles (industry, industry_category, connection_patterns, relevance_weights, prediction_contexts, org_type_modifiers)
VALUES (
  'Automotive',
  'Manufacturing',
  '[
    {
      "type": "supply_chain_disruption",
      "description": "Chip shortages, parts delays, factory shutdowns",
      "triggers": ["supply_shortage", "factory_closure", "logistics_delay"],
      "entity_types_to_correlate": ["competitor", "supplier"],
      "detection_window_days": 30,
      "minimum_strength": 70,
      "prediction_window_days": 21,
      "relevance_for_pr_agency": 85
    },
    {
      "type": "ev_transition",
      "description": "Electric vehicle announcements and competition",
      "triggers": ["ev_launch", "battery_tech", "charging_network"],
      "entity_types_to_correlate": ["competitor", "technology_partner"],
      "detection_window_days": 90,
      "minimum_strength": 65,
      "prediction_window_days": 60,
      "relevance_for_pr_agency": 80
    }
  ]'::jsonb,
  '{
    "co_occurrence": 60,
    "temporal_correlation": 75,
    "thematic_overlap": 65,
    "sentiment_correlation": 70
  }'::jsonb,
  '[]'::jsonb,
  '{}'::jsonb
)
ON CONFLICT (industry) DO NOTHING;

-- Aerospace & Defense
INSERT INTO industry_intelligence_profiles (industry, industry_category, connection_patterns, relevance_weights, prediction_contexts, org_type_modifiers)
VALUES (
  'Aerospace',
  'Manufacturing',
  '[
    {
      "type": "defense_contract_award",
      "description": "Major defense contract wins and losses",
      "triggers": ["contract_win", "contract_loss", "program_cancellation"],
      "entity_types_to_correlate": ["competitor", "government"],
      "detection_window_days": 60,
      "minimum_strength": 70,
      "prediction_window_days": 30,
      "relevance_for_pr_agency": 80
    }
  ]'::jsonb,
  '{
    "co_occurrence": 55,
    "temporal_correlation": 75,
    "thematic_overlap": 65,
    "sentiment_correlation": 70
  }'::jsonb,
  '[]'::jsonb,
  '{}'::jsonb
)
ON CONFLICT (industry) DO NOTHING;

-- ============================================================================
-- TELECOMMUNICATIONS & MEDIA
-- ============================================================================

-- Telecommunications
INSERT INTO industry_intelligence_profiles (industry, industry_category, connection_patterns, relevance_weights, prediction_contexts, org_type_modifiers)
VALUES (
  'Telecommunications',
  'Technology',
  '[
    {
      "type": "network_rollout_competition",
      "description": "5G, fiber, infrastructure deployment competition",
      "triggers": ["network_launch", "coverage_expansion", "infrastructure_investment"],
      "entity_types_to_correlate": ["competitor", "technology_vendor"],
      "detection_window_days": 90,
      "minimum_strength": 65,
      "prediction_window_days": 60,
      "relevance_for_pr_agency": 75
    }
  ]'::jsonb,
  '{
    "co_occurrence": 55,
    "temporal_correlation": 70,
    "thematic_overlap": 65,
    "sentiment_correlation": 60
  }'::jsonb,
  '[]'::jsonb,
  '{}'::jsonb
)
ON CONFLICT (industry) DO NOTHING;

-- Media & Entertainment
INSERT INTO industry_intelligence_profiles (industry, industry_category, connection_patterns, relevance_weights, prediction_contexts, org_type_modifiers)
VALUES (
  'Media',
  'Entertainment',
  '[
    {
      "type": "streaming_competition",
      "description": "Content wars, pricing changes, platform features",
      "triggers": ["content_deal", "price_change", "feature_launch", "exclusive_content"],
      "entity_types_to_correlate": ["competitor", "content_provider"],
      "detection_window_days": 60,
      "minimum_strength": 65,
      "prediction_window_days": 45,
      "relevance_for_pr_agency": 75
    }
  ]'::jsonb,
  '{
    "co_occurrence": 60,
    "temporal_correlation": 70,
    "thematic_overlap": 70,
    "sentiment_correlation": 75
  }'::jsonb,
  '[]'::jsonb,
  '{}'::jsonb
)
ON CONFLICT (industry) DO NOTHING;

-- ============================================================================
-- REAL ESTATE & CONSTRUCTION
-- ============================================================================

-- Real Estate
INSERT INTO industry_intelligence_profiles (industry, industry_category, connection_patterns, relevance_weights, prediction_contexts, org_type_modifiers)
VALUES (
  'Real Estate',
  'Real Estate',
  '[
    {
      "type": "market_cycle_shift",
      "description": "Interest rate changes affecting property markets",
      "triggers": ["rate_change", "lending_restriction", "market_correction"],
      "entity_types_to_correlate": ["competitor", "financial_institution", "regulatory_body"],
      "detection_window_days": 90,
      "minimum_strength": 65,
      "prediction_window_days": 60,
      "relevance_for_pr_agency": 75
    }
  ]'::jsonb,
  '{
    "co_occurrence": 55,
    "temporal_correlation": 75,
    "thematic_overlap": 60,
    "sentiment_correlation": 70
  }'::jsonb,
  '[]'::jsonb,
  '{}'::jsonb
)
ON CONFLICT (industry) DO NOTHING;

-- ============================================================================
-- TRANSPORTATION & LOGISTICS
-- ============================================================================

-- Logistics
INSERT INTO industry_intelligence_profiles (industry, industry_category, connection_patterns, relevance_weights, prediction_contexts, org_type_modifiers)
VALUES (
  'Logistics',
  'Transportation',
  '[
    {
      "type": "supply_chain_bottleneck",
      "description": "Port congestion, driver shortages, capacity constraints",
      "triggers": ["port_congestion", "capacity_shortage", "fuel_price_spike"],
      "entity_types_to_correlate": ["competitor", "supplier", "infrastructure"],
      "detection_window_days": 30,
      "minimum_strength": 70,
      "prediction_window_days": 21,
      "relevance_for_pr_agency": 80
    }
  ]'::jsonb,
  '{
    "co_occurrence": 60,
    "temporal_correlation": 75,
    "thematic_overlap": 65,
    "sentiment_correlation": 70
  }'::jsonb,
  '[]'::jsonb,
  '{}'::jsonb
)
ON CONFLICT (industry) DO NOTHING;

-- Airlines
INSERT INTO industry_intelligence_profiles (industry, industry_category, connection_patterns, relevance_weights, prediction_contexts, org_type_modifiers)
VALUES (
  'Airlines',
  'Transportation',
  '[
    {
      "type": "operational_disruption",
      "description": "Flight cancellations, operational issues spreading across industry",
      "triggers": ["mass_cancellation", "system_outage", "weather_disruption", "staff_shortage"],
      "entity_types_to_correlate": ["competitor", "regulatory_body"],
      "detection_window_days": 14,
      "minimum_strength": 70,
      "prediction_window_days": 7,
      "relevance_for_pr_agency": 85
    }
  ]'::jsonb,
  '{
    "co_occurrence": 60,
    "temporal_correlation": 80,
    "thematic_overlap": 65,
    "sentiment_correlation": 75
  }'::jsonb,
  '[]'::jsonb,
  '{}'::jsonb
)
ON CONFLICT (industry) DO NOTHING;

-- ============================================================================
-- FOOD & BEVERAGE
-- ============================================================================

-- Food & Beverage
INSERT INTO industry_intelligence_profiles (industry, industry_category, connection_patterns, relevance_weights, prediction_contexts, org_type_modifiers)
VALUES (
  'Food & Beverage',
  'Consumer',
  '[
    {
      "type": "food_safety_incident",
      "description": "Contamination, recalls, or safety issues",
      "triggers": ["recall", "contamination", "fda_warning", "illness_outbreak"],
      "entity_types_to_correlate": ["competitor", "supplier", "regulatory_body"],
      "detection_window_days": 21,
      "minimum_strength": 75,
      "prediction_window_days": 14,
      "relevance_for_pr_agency": 95
    }
  ]'::jsonb,
  '{
    "co_occurrence": 60,
    "temporal_correlation": 85,
    "thematic_overlap": 70,
    "sentiment_correlation": 80
  }'::jsonb,
  '[]'::jsonb,
  '{}'::jsonb
)
ON CONFLICT (industry) DO NOTHING;

-- ============================================================================
-- HOSPITALITY & TOURISM
-- ============================================================================

-- Hospitality
INSERT INTO industry_intelligence_profiles (industry, industry_category, connection_patterns, relevance_weights, prediction_contexts, org_type_modifiers)
VALUES (
  'Hospitality',
  'Services',
  '[
    {
      "type": "reputation_incident",
      "description": "Service failures, guest safety, or reputation issues",
      "triggers": ["incident", "negative_review_spike", "safety_issue"],
      "entity_types_to_correlate": ["competitor", "brand", "location"],
      "detection_window_days": 21,
      "minimum_strength": 70,
      "prediction_window_days": 14,
      "relevance_for_pr_agency": 85
    }
  ]'::jsonb,
  '{
    "co_occurrence": 55,
    "temporal_correlation": 75,
    "thematic_overlap": 65,
    "sentiment_correlation": 80
  }'::jsonb,
  '[]'::jsonb,
  '{}'::jsonb
)
ON CONFLICT (industry) DO NOTHING;

-- ============================================================================
-- EDUCATION
-- ============================================================================

-- Education
INSERT INTO industry_intelligence_profiles (industry, industry_category, connection_patterns, relevance_weights, prediction_contexts, org_type_modifiers)
VALUES (
  'Education',
  'Services',
  '[
    {
      "type": "accreditation_regulatory",
      "description": "Accreditation issues or regulatory changes",
      "triggers": ["accreditation_loss", "regulatory_change", "policy_shift"],
      "entity_types_to_correlate": ["competitor", "regulatory_body", "accreditor"],
      "detection_window_days": 60,
      "minimum_strength": 70,
      "prediction_window_days": 30,
      "relevance_for_pr_agency": 85
    }
  ]'::jsonb,
  '{
    "co_occurrence": 55,
    "temporal_correlation": 75,
    "thematic_overlap": 65,
    "sentiment_correlation": 70
  }'::jsonb,
  '[]'::jsonb,
  '{}'::jsonb
)
ON CONFLICT (industry) DO NOTHING;

-- ============================================================================
-- DEFAULT / FALLBACK PROFILE
-- Used by connection-detector for any industry without a specific profile
-- ============================================================================

INSERT INTO industry_intelligence_profiles (industry, industry_category, connection_patterns, relevance_weights, prediction_contexts, org_type_modifiers)
VALUES (
  'DEFAULT',
  'General',
  '[
    {
      "type": "competitive_activity",
      "description": "Significant competitive moves or announcements",
      "triggers": ["announcement", "launch", "partnership", "acquisition", "expansion"],
      "entity_types_to_correlate": ["competitor", "partner"],
      "detection_window_days": 60,
      "minimum_strength": 65,
      "prediction_window_days": 30,
      "relevance_for_pr_agency": 75
    },
    {
      "type": "regulatory_change",
      "description": "Regulatory or policy changes affecting the industry",
      "triggers": ["regulation", "policy_change", "compliance", "legal_action"],
      "entity_types_to_correlate": ["regulatory_body", "competitor", "industry_body"],
      "detection_window_days": 60,
      "minimum_strength": 70,
      "prediction_window_days": 30,
      "relevance_for_pr_agency": 85
    },
    {
      "type": "reputation_event",
      "description": "Reputation-impacting events in the industry",
      "triggers": ["scandal", "crisis", "controversy", "lawsuit", "investigation"],
      "entity_types_to_correlate": ["competitor", "media_outlet", "regulatory_body"],
      "detection_window_days": 30,
      "minimum_strength": 70,
      "prediction_window_days": 21,
      "relevance_for_pr_agency": 90
    },
    {
      "type": "market_shift",
      "description": "Market trends or disruptions",
      "triggers": ["market_change", "trend_shift", "disruption", "innovation"],
      "entity_types_to_correlate": ["competitor", "technology_partner", "industry_body"],
      "detection_window_days": 90,
      "minimum_strength": 60,
      "prediction_window_days": 45,
      "relevance_for_pr_agency": 75
    }
  ]'::jsonb,
  '{
    "co_occurrence": 55,
    "temporal_correlation": 75,
    "thematic_overlap": 65,
    "sentiment_correlation": 70
  }'::jsonb,
  '[
    {
      "context": "When competitor faces negative publicity",
      "prediction_type": "industry_scrutiny_increase",
      "confidence_modifier": 0.75,
      "timeframe_days": 30
    }
  ]'::jsonb,
  '{
    "public_relations": {
      "focus_areas": ["reputation_management", "competitive_positioning", "crisis_prevention"],
      "signal_priority_multipliers": {
        "reputation_event": 1.5,
        "regulatory_change": 1.3,
        "competitive_activity": 1.2
      }
    }
  }'::jsonb
)
ON CONFLICT (industry) DO NOTHING;
