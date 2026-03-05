/**
 * LP Simulation Orchestrator Types
 *
 * Multi-round simulation where entity responses propagate across rounds.
 * Key insight: Fulcrums only become visible after watching the cascade play out.
 */

// === Request/Response ===

export interface SimulationRequest {
  scenario_id: string
  organization_id: string
  // Optional overrides
  max_rounds?: number           // default 6
  min_rounds?: number           // default 2
  stabilization_threshold?: number  // default 0.8
  entity_ids?: string[]         // override auto-detection
  include_client?: boolean      // include user's org in simulation
}

export interface SimulationResponse {
  success: boolean
  simulation_id: string
  status: SimulationStatus
  rounds_completed: number
  stabilization_score: number
  // Summary (full results stored in DB)
  dominant_narratives: string[]
  key_coalitions: Coalition[]
  gaps_identified: string[]
  fulcrums?: Fulcrum[]          // only populated after stabilization
  error?: string
}

// === Simulation State ===

export type SimulationStatus =
  | 'initializing'
  | 'running'
  | 'analyzing'
  | 'stabilized'
  | 'max_rounds_reached'
  | 'failed'

export interface Simulation {
  simulation_id: string
  scenario_id: string
  organization_id: string
  status: SimulationStatus
  config: SimulationConfig
  entities: SimulationEntity[]
  rounds: SimulationRound[]
  cross_analyses: CrossEntityAnalysis[]
  stabilization_score: number
  created_at: string
  completed_at?: string
  error?: string
}

export interface SimulationConfig {
  max_rounds: number
  min_rounds: number
  stabilization_threshold: number
  parallel_batch_size: number
  entity_timeout_ms: number
}

export interface SimulationEntity {
  entity_id: string
  entity_name: string
  entity_type: string
  profile_id: string            // lp_entity_profiles.id
  relevance_score: number       // how relevant this entity is to the scenario
  included: boolean             // whether to include in simulation
}

// === Round Structure ===

export interface SimulationRound {
  round_number: number
  started_at: string
  completed_at?: string
  entity_responses: EntityResponse[]
  themes_emerged: string[]
  status: 'pending' | 'running' | 'completed' | 'failed'
}

export interface EntityResponse {
  entity_id: string
  entity_name: string
  round_number: number

  // Decision
  response_decision: ResponseDecision
  decision_rationale: string

  // Position
  position_summary: string      // 1-2 sentence stance
  key_claims: string[]

  // Content (internal - never shown to users)
  thought_leadership?: string   // simulated content piece
  media_pitch?: string
  social_response?: string

  // Influence
  entities_referenced: string[] // who they engaged with
  themes_championed: string[]   // narratives they're pushing

  // Cascade prediction
  predicted_reactions: Array<{
    entity_id: string
    predicted_response: string
    confidence: number
  }>

  // Metadata
  processing_time_ms: number
  model_used: string
}

export type ResponseDecision =
  | 'respond'       // Active response
  | 'counter'       // Directly challenge another entity
  | 'amplify'       // Support/boost another entity's position
  | 'fill_gap'      // Address something no one else covered
  | 'differentiate' // Stand out from similar positions
  | 'build'         // Add to a growing narrative
  | 'synthesize'    // Unify multiple threads
  | 'wait'          // Hold position, watch
  | 'silent'        // No strategic value in responding

// === Cross-Entity Analysis ===

export interface CrossEntityAnalysis {
  round_number: number

  // Theme tracking
  themes: ThemeAnalysis[]

  // Influence mapping
  influence_rankings: InfluenceRanking[]
  influence_flows: InfluenceFlow[]

  // Coalition detection
  coalitions: Coalition[]

  // Gap detection
  gaps: Gap[]

  // Stabilization
  position_changes: number      // how many entities changed position
  new_themes_count: number
  stabilization_score: number   // 0-1, triggers end when > threshold
}

export interface ThemeAnalysis {
  theme: string
  momentum: 'rising' | 'stable' | 'falling'
  owner: string                 // entity that "owns" this narrative
  adopters: string[]            // entities using this theme
  first_appeared: number        // round number
}

export interface InfluenceRanking {
  entity_id: string
  entity_name: string
  score: number
  citations_received: number
  frames_adopted: number        // how many of their frames others adopted
}

export interface InfluenceFlow {
  from_entity: string
  to_entity: string
  type: 'citation' | 'frame_adoption' | 'counter' | 'amplify'
  strength: number
}

export interface Coalition {
  coalition_id: string
  name: string
  members: string[]
  shared_position: string
  stability: 'forming' | 'stable' | 'fracturing'
  formed_round: number
}

export interface Gap {
  gap_id: string
  description: string
  strategic_value: 'high' | 'medium' | 'low'
  related_aspects: string[]     // which scenario aspects this relates to
  potential_fillers: string[]   // entities who could fill this gap
}

// === Fulcrum (Post-Stabilization) ===

export interface Fulcrum {
  fulcrum_id: string
  type: 'validator_path' | 'unoccupied_position' | 'wedge_issue' | 'preemption'
  description: string
  target_entity?: string
  rationale: string
  cascade_prediction: string[]  // what happens if client acts on this
  effort_level: 'low' | 'medium' | 'high'
  impact_level: 'low' | 'medium' | 'high'
  confidence: number
}

// === Entity Memory (Across Rounds) ===

export interface EntityRoundMemory {
  entity_id: string
  positions_taken: Array<{ round: number, position: string }>
  entities_referenced: string[]
  themes_championed: string[]
  attacks_received: Array<{ from: string, round: number, attack: string }>
  credibility_trajectory: 'rising' | 'stable' | 'falling'
}

// === Round Context (Injected into Round N+1) ===

export interface RoundContext {
  simulation_id: string         // for tracking content influence
  round_number: number
  scenario: any                 // from lp_scenarios
  prior_responses: EntityResponse[]
  themes_so_far: string[]
  dominant_narratives: string[]
  gaps_identified: string[]
  entity_memory: Map<string, EntityRoundMemory>
}

// === Database Records ===

export interface SimulationRecord {
  id: string
  scenario_id: string
  organization_id: string
  status: SimulationStatus
  config: SimulationConfig
  entities: SimulationEntity[]
  rounds_completed: number
  stabilization_score: number
  dominant_narratives: string[]
  key_coalitions: Coalition[]
  gaps_identified: string[]
  fulcrums: Fulcrum[]
  created_at: string
  completed_at?: string
  error?: string
}

export interface SimulationRoundRecord {
  id: string
  simulation_id: string
  round_number: number
  entity_responses: EntityResponse[]
  cross_analysis: CrossEntityAnalysis
  started_at: string
  completed_at?: string
  status: string
}
