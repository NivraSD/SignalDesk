/**
 * LP Scenario Builder Types
 * Structured scenario format for Liminal Propagation simulation
 */

// Scenario trigger source — internal (we act) vs external (something happens to us)
export type TriggerSource = 'internal' | 'external'

// Scenario types supported by LP
// Internal: org is the actor
// External: org is the recipient/reactor
export type ScenarioType =
  // Internal actions (we are doing X)
  | 'product_launch'
  | 'merger_acquisition'
  | 'market_entry'
  | 'policy_change'
  | 'crisis_response'
  | 'competitive_response'
  | 'leadership_change'
  | 'strategic_initiative'
  | 'expansion'
  // External triggers (X is happening to/around us)
  | 'regulatory_change'      // new legislation, regulatory ruling, compliance requirement
  | 'market_disruption'      // technology shift, economic event, new entrant, industry change
  | 'geopolitical_event'     // trade policy, sanctions, political shift, international development
  | 'stakeholder_move'       // key customer, partner, investor, or supplier does something
  | 'custom'

// Stakeholder categories
export type StakeholderCategory =
  | 'competitors'
  | 'regulators'
  | 'customers'
  | 'ecosystem'
  | 'media'
  | 'analysts'
  | 'investors'
  | 'employees'

// The structured scenario output
export interface LPScenario {
  scenario_id: string
  type: ScenarioType
  org_id: string
  created_at: string

  // Trigger source
  trigger_source?: TriggerSource    // 'internal' (we act) or 'external' (something happens)

  // What's happening
  action: {
    what: string                    // Core action/event description
    rationale?: string[]            // Why — strategic reasoning, goals
    claims?: string[]               // Bold claims or positioning statements
    details?: string[]              // Supporting details, specifics
    terms?: string                  // Deal terms (for M&A)
    changes?: string[]              // What's changing (for policy)
    incident?: string               // What happened (for crisis)
    competitor_action?: string      // What competitor did (for competitive response)
    // External trigger fields
    trigger_source_actor?: string   // Who/what is causing this (for external events)
    trigger_description?: string    // What exactly is happening externally
    impact_hypothesis?: string[]    // How this could affect the org
    probability?: 'confirmed' | 'likely' | 'possible' | 'speculative'  // How certain is this event
    // Legacy aliases
    capabilities?: string[]         // What it enables (product launch — alias for rationale)
  }

  // Who gets it and when
  distribution?: {
    initial?: string                // Initial rollout audience
    phases?: { audience: string; timing: string }[]
    exclusions?: string[]           // Who's excluded and why
  }

  // Timing context
  timing: {
    date?: string                   // Target date
    context?: string[]              // Timing context (e.g., "1 week before competitor event")
    window_rationale?: string       // Why this timing
    urgency?: 'immediate' | 'short_term' | 'medium_term' | 'long_term'
  }

  // Known risks
  known_vulnerabilities: string[]

  // Stakeholders who will respond
  stakeholder_seed: {
    [key in StakeholderCategory]?: string[]
  }

  // Which aspects map to which stakeholders
  aspect_mapping: {
    [aspect: string]: string[]      // aspect -> stakeholder IDs who care about it
  }

  // Research context from PA intelligence (injected into simulation prompts)
  research_context?: {
    executive_summary?: string
    situation?: {
      current?: string
      key_developments?: string[]
      key_actors?: string[]
    }
    stakeholder_positions?: Array<{
      name: string
      type?: string
      position?: string
      interest?: string
      influence?: string
    }>
    pressure_points?: string
    impact?: {
      direct?: string
      second_order?: string
    }
    existing_scenarios?: Array<{
      name?: string
      probability?: string
      description?: string
    }>
  }

  // Dialogue state (for incremental building)
  _dialogue_state?: {
    phase: 'initial' | 'probing' | 'stakeholders' | 'complete'
    questions_asked: string[]
    aspects_identified: string[]
    confidence: number
  }
}

// Request to scenario builder
export interface ScenarioBuilderRequest {
  organization_id: string

  // For new scenario
  initial_description?: string

  // For continuing dialogue
  scenario_id?: string
  user_response?: string

  // Options
  skip_stakeholder_suggestions?: boolean
  scenario_type_hint?: ScenarioType

  // Research context from PA intelligence reports
  research_context?: LPScenario['research_context']
}

// Response from scenario builder
export interface ScenarioBuilderResponse {
  success: boolean

  // Current state
  scenario: Partial<LPScenario>

  // Dialogue continuation
  phase: 'initial' | 'probing' | 'stakeholders' | 'complete'
  next_question?: string
  question_options?: string[]       // Multiple choice options if applicable

  // When complete
  ready_for_simulation?: boolean

  // Metadata
  detected_type?: ScenarioType
  confidence?: number
  suggestions?: {
    stakeholders?: { category: StakeholderCategory; entities: string[] }[]
    aspects?: string[]
    vulnerabilities?: string[]
  }

  error?: string
}

// Probe definition
export interface ScenarioProbe {
  id: string
  question: string
  field: keyof LPScenario | string  // Which field this populates
  required: boolean
  options?: string[]                // Multiple choice options
  followup_if?: string              // Condition for asking this probe
  extract_aspects?: boolean         // Whether to extract aspects from answer
}

// Type-specific probe set
export interface ProbeSet {
  type: ScenarioType
  description: string
  probes: ScenarioProbe[]
  aspect_categories: string[]       // Common aspects for this type
}
