// Connection Intelligence Types

export interface EntityConnection {
  id: string;
  organization_id: string;

  // Entity pair
  entity_a_id: string;
  entity_a_name: string;
  entity_a_type: string;

  entity_b_id: string;
  entity_b_name: string;
  entity_b_type: string;

  // Connection metrics
  connection_type: 'co_occurrence' | 'temporal_correlation' | 'thematic_overlap';
  connection_strength: number; // 0-100

  // Evidence
  shared_articles: number;
  shared_topics: string[];
  shared_categories: string[];
  temporal_proximity_days?: number;

  // Time tracking
  first_detected: string;
  last_updated: string;
  detection_window_start: string;
  detection_window_end: string;

  // Metadata
  evidence_articles: string[];
  metadata: Record<string, any>;

  created_at: string;
}

export interface ConnectionSignal {
  id: string;
  organization_id: string;

  // Signal identification
  signal_type: string;
  signal_title: string;
  signal_description: string;

  // Entities involved
  primary_entity_id: string;
  primary_entity_name: string;
  related_entities: Array<{
    id?: string;
    name: string;
    role?: string;
  }>;

  // Signal strength and confidence
  strength_score: number; // 0-100
  confidence_score: number; // 0-100

  // Industry context
  industry_relevance: string;
  client_impact_level: 'critical' | 'high' | 'medium' | 'low';

  // Pattern details
  pattern_data: {
    pattern_type: string;
    entities_involved: string[];
    mention_count: number;
    detection_window_days: number;
    triggers_matched: string[];
  };

  supporting_connections: string[];
  supporting_mentions: string[];

  // Temporal context
  signal_start_date: string;
  signal_detected_date: string;
  signal_maturity: 'emerging' | 'developing' | 'mature' | 'declining';

  // Prediction generation
  prediction_generated: boolean;
  prediction_id?: string;

  metadata: Record<string, any>;

  created_at: string;
  updated_at: string;
}

export interface IndustryProfile {
  id: string;
  industry: string;
  industry_category: string;

  connection_patterns: ConnectionPattern[];
  relevance_weights: {
    co_occurrence: number;
    temporal_correlation: number;
    thematic_overlap: number;
    sentiment_correlation?: number;
  };

  prediction_contexts: PredictionContext[];
  org_type_modifiers: Record<string, OrgTypeModifier>;

  created_at: string;
  updated_at: string;
}

export interface ConnectionPattern {
  type: string;
  description: string;
  triggers: string[];
  entity_types_to_correlate: string[];
  detection_window_days: number;
  minimum_strength: number;
  prediction_window_days: number;
  relevance_for_pr_agency?: number;
}

export interface PredictionContext {
  context: string;
  prediction_type: string;
  confidence_modifier: number;
  timeframe_days: number;
}

export interface OrgTypeModifier {
  focus_areas: string[];
  signal_priority_multipliers: Record<string, number>;
}

export interface IntelligenceGraph {
  id: string;
  organization_id: string;

  // Graph structure
  node_type: 'entity' | 'topic' | 'event' | 'location';
  node_id: string;
  node_name: string;

  relationships: GraphRelationship[];

  // Node metrics
  centrality_score: number;
  activity_score: number;

  created_at: string;
  updated_at: string;
}

export interface GraphRelationship {
  to_node_id: string;
  to_node_name: string;
  relationship_type: 'competitor' | 'supplier' | 'customer' | 'partner' | 'adversary';
  relationship_strength: number;
  evidence_count: number;
  last_interaction_date: string;
}

// View types
export interface StrongConnection {
  organization_id: string;
  entity_a_name: string;
  entity_b_name: string;
  connection_type: string;
  connection_strength: number;
  shared_articles: number;
  shared_topics: string[];
  last_updated: string;
  connection_id: string;
}

export interface SignalNeedingAttention {
  organization_id: string;
  signal_type: string;
  signal_title: string;
  primary_entity_name: string;
  strength_score: number;
  confidence_score: number;
  client_impact_level: string;
  signal_maturity: string;
  prediction_generated: boolean;
  signal_detected_date: string;
  signal_id: string;
}

export interface EntityNetworkActivity {
  organization_id: string;
  entity_name: string;
  total_connections: number;
  avg_connection_strength: number;
  strong_connections: number;
  connection_types: string[];
  most_recent_connection: string;
}
