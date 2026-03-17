/**
 * LP Simulation Orchestrator Types
 *
 * Multi-round simulation where entity responses propagate across rounds.
 * Key insight: Fulcrums only become visible after watching the cascade play out.
 */

// === Simulation Phases ===
// Each round forces a distinct analytical lens instead of repeating the same prompt.
// Two modes based on scenario type:
//   - FAIT_ACCOMPLI: the event happened, entities react outward from known resolution
//   - SPECULATIVE: the event might happen, entities jockey to influence the outcome

export type ScenarioMode = 'fait_accompli' | 'speculative'

export interface SimulationPhase {
  id: string
  name: string
  description: string
  lens: string
  focus_areas: string[]
}

export const PHASES_FAIT_ACCOMPLI: SimulationPhase[] = [
  {
    id: 'immediate_reaction',
    name: 'Immediate Reaction',
    description: 'Gut response to the event — threat/opportunity assessment, first-mover signals.',
    lens: 'This event HAS HAPPENED. Focus on each entity\'s immediate strategic reaction. What does this mean for their interests? Who sees opportunity, who sees threat? What is their instinctive first move? No hedging — they must respond to a new reality.',
    focus_areas: ['threat_assessment', 'opportunity_capture', 'first_mover_signals'],
  },
  {
    id: 'stakes_exposure',
    name: 'Stakes & Exposure',
    description: 'Who wins, who loses — economic fallout, vulnerabilities exposed.',
    lens: 'Focus on the material consequences. What are the financial, operational, and reputational stakes for each entity? Who is most exposed? Where does economic pain concentrate? Entities should quantify their risk and articulate what they stand to gain or lose.',
    focus_areas: ['economic_fallout', 'vulnerability_exposure', 'winners_losers', 'material_impact'],
  },
  {
    id: 'alliances_opposition',
    name: 'Alliances & Opposition',
    description: 'Who bands together, who fights — coalition dynamics and isolation.',
    lens: 'Focus on relationship dynamics. Who is reaching out to form alliances? Who is being isolated? What shared interests drive coalition-building? Which entities are directly opposing each other and why? Reference specific positions from prior rounds.',
    focus_areas: ['coalition_formation', 'opposition_lines', 'isolation_risk', 'alliance_drivers'],
  },
  {
    id: 'narrative_battle',
    name: 'Narrative Battle',
    description: 'How the event is being framed publicly — media wars, spin, messaging.',
    lens: 'Focus on the battle for narrative control. How is each entity framing this event for public consumption? What media strategies are they deploying? Which narrative is winning? Who controls the story? Entities should articulate their public messaging and attack competing frames.',
    focus_areas: ['narrative_framing', 'media_strategy', 'public_perception', 'competing_frames'],
  },
  {
    id: 'adaptation',
    name: 'Adaptation',
    description: 'How entities adjust to the new reality — strategic pivots, next moves.',
    lens: 'Focus on what comes next. How is each entity adapting their strategy to the new status quo? What operational changes are they making? What opportunities remain uncaptured? Entities should state their final position and lay out their forward-looking strategy.',
    focus_areas: ['strategic_pivot', 'operational_changes', 'forward_strategy', 'uncaptured_opportunity'],
  },
]

export const PHASES_SPECULATIVE: SimulationPhase[] = [
  {
    id: 'position_staking',
    name: 'Position Staking',
    description: 'Where each entity stands on the possibility — initial camps form.',
    lens: 'This event MIGHT HAPPEN. Focus on where each entity stakes their position. Are they for it, against it, or hedging? What is their stated rationale? Who is already mobilizing? Entities must take a clear stance, even if provisional.',
    focus_areas: ['initial_positions', 'rationale', 'mobilization', 'stance_clarity'],
  },
  {
    id: 'leverage_lobbying',
    name: 'Leverage & Lobbying',
    description: 'Who is pushing for or against — pressure tactics, influence campaigns.',
    lens: 'Focus on influence and leverage. Who is lobbying whom? What pressure tactics are being deployed — financial, political, reputational? Who has leverage and how are they using it? Entities should articulate their influence strategy and identify pressure points.',
    focus_areas: ['lobbying_tactics', 'pressure_application', 'leverage_points', 'influence_campaigns'],
  },
  {
    id: 'coalition_building',
    name: 'Coalition Building',
    description: 'Alliances form to shape the outcome — strange bedfellows, power blocs.',
    lens: 'Focus on alliance dynamics. Who is joining forces and why? Are there surprising alliances — entities that normally oppose each other now aligned? What are the power blocs and what do they want? Reference specific lobbying moves from the prior round.',
    focus_areas: ['alliance_dynamics', 'power_blocs', 'surprising_alignments', 'shared_objectives'],
  },
  {
    id: 'public_framing',
    name: 'Public Framing',
    description: 'How the issue plays in public discourse — opinion shaping, messaging.',
    lens: 'Focus on the public conversation. How is each entity framing this possibility for public opinion? What narratives are they pushing? Which frames are resonating and which are failing? Entities should articulate their public communications strategy.',
    focus_areas: ['public_narrative', 'opinion_shaping', 'frame_competition', 'communications_strategy'],
  },
  {
    id: 'contingency_planning',
    name: 'Contingency Planning',
    description: 'How entities prepare for different outcomes — hedging, scenario planning.',
    lens: 'Focus on preparation for multiple outcomes. How is each entity hedging? What happens if this event occurs vs. doesn\'t? What are their contingency moves? Entities should lay out their plans for each scenario and articulate their final strategic position.',
    focus_areas: ['scenario_hedging', 'contingency_moves', 'outcome_preparation', 'final_position'],
  },
]

/** Get the right phase set based on scenario mode */
export function getPhasesForMode(mode: ScenarioMode): SimulationPhase[] {
  return mode === 'fait_accompli' ? PHASES_FAIT_ACCOMPLI : PHASES_SPECULATIVE
}

// === Request/Response ===

export interface SimulationRequest {
  scenario_id: string
  organization_id: string
  // Optional overrides
  max_rounds?: number           // default 5
  min_rounds?: number           // default 2
  stabilization_threshold?: number  // default 0.8
  entity_ids?: string[]         // override auto-detection by ID
  entity_names?: string[]       // override auto-detection by name (from UI selection)
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
  phase: string          // phase id (e.g. 'immediate_reaction')
  phase_name: string     // display name (e.g. 'Immediate Reaction')
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
  phase: SimulationPhase        // current phase with lens/focus
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
