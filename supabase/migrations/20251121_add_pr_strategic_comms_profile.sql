-- Add industry profile for "Public Relations & Strategic Communications"
-- This matches the exact industry name used by KARV and other PR agencies

INSERT INTO industry_intelligence_profiles (industry, industry_category, connection_patterns, relevance_weights, prediction_contexts, org_type_modifiers)
VALUES (
  'Public Relations & Strategic Communications',
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
