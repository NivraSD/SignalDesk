/**
 * LP Scenario Builder Probes
 * Type-specific questions to extract structured scenario data
 */

import type { ScenarioType, ProbeSet, ScenarioProbe } from './types.ts'

// Probes for Product Launch scenarios
const PRODUCT_LAUNCH_PROBES: ProbeSet = {
  type: 'product_launch',
  description: 'New product, feature, or capability announcement',
  probes: [
    {
      id: 'what_product',
      question: 'What exactly are you launching? Describe the product/feature and its key capabilities.',
      field: 'action.what',
      required: true,
      extract_aspects: true
    },
    {
      id: 'bold_claims',
      question: 'What bold claims or positioning statements will you make? (e.g., "first to market", "most advanced", "industry-leading")',
      field: 'action.claims',
      required: false,
      extract_aspects: true
    },
    {
      id: 'initial_audience',
      question: 'Who gets access first? How will you roll this out?',
      field: 'distribution.initial',
      required: true
    },
    {
      id: 'exclusions',
      question: 'Are there any markets, segments, or regions you\'re excluding? Why?',
      field: 'distribution.exclusions',
      required: false,
      extract_aspects: true
    },
    {
      id: 'timing',
      question: 'When are you launching? Is there anything significant about this timing? (competitor events, market conditions, regulatory windows)',
      field: 'timing',
      required: true,
      extract_aspects: true
    },
    {
      id: 'vulnerabilities',
      question: 'What concerns you about this launch? What could go wrong or be criticized?',
      field: 'known_vulnerabilities',
      required: true,
      extract_aspects: true
    }
  ],
  aspect_categories: ['product_capabilities', 'pricing', 'timing_claims', 'market_exclusions', 'competitive_positioning', 'technical_limitations']
}

// Probes for M&A / Deal scenarios
const MERGER_ACQUISITION_PROBES: ProbeSet = {
  type: 'merger_acquisition',
  description: 'Merger, acquisition, investment, or major partnership',
  probes: [
    {
      id: 'what_deal',
      question: 'Describe the deal. Who is the target/partner? What are the key terms?',
      field: 'action.what',
      required: true,
      extract_aspects: true
    },
    {
      id: 'rationale',
      question: 'What\'s the strategic rationale? Why this target/partner, why now?',
      field: 'action.capabilities',
      required: true,
      extract_aspects: true
    },
    {
      id: 'regulatory',
      question: 'What regulatory approvals are needed? Any antitrust concerns?',
      field: 'distribution.exclusions',
      required: true,
      extract_aspects: true
    },
    {
      id: 'timing',
      question: 'What\'s the timeline? Key milestones and announcement dates?',
      field: 'timing',
      required: true
    },
    {
      id: 'stakeholder_impact',
      question: 'Who\'s most affected by this deal? Employees, customers, competitors?',
      field: 'known_vulnerabilities',
      required: true,
      extract_aspects: true
    },
    {
      id: 'integration',
      question: 'What are the integration risks or concerns? What might critics attack?',
      field: 'known_vulnerabilities',
      required: true,
      extract_aspects: true
    }
  ],
  aspect_categories: ['deal_terms', 'regulatory_approval', 'employee_impact', 'customer_continuity', 'competitive_implications', 'integration_risk']
}

// Probes for Market Entry scenarios
const MARKET_ENTRY_PROBES: ProbeSet = {
  type: 'market_entry',
  description: 'Entering a new geographic or product market',
  probes: [
    {
      id: 'what_market',
      question: 'What market are you entering? Geographic region, product category, or customer segment?',
      field: 'action.what',
      required: true,
      extract_aspects: true
    },
    {
      id: 'positioning',
      question: 'How will you position against existing players? What\'s your differentiation?',
      field: 'action.claims',
      required: true,
      extract_aspects: true
    },
    {
      id: 'competitive_context',
      question: 'Who are the incumbents? How will they likely respond to your entry?',
      field: 'action.competitor_action',
      required: true,
      extract_aspects: true
    },
    {
      id: 'entry_strategy',
      question: 'What\'s your entry strategy? (organic build, acquisition, partnership)',
      field: 'distribution.initial',
      required: true
    },
    {
      id: 'timing',
      question: 'Why enter now? What market conditions make this the right time?',
      field: 'timing',
      required: true,
      extract_aspects: true
    },
    {
      id: 'barriers',
      question: 'What barriers do you face? Regulatory, competitive, capability gaps?',
      field: 'known_vulnerabilities',
      required: true,
      extract_aspects: true
    }
  ],
  aspect_categories: ['geographic_focus', 'competitive_positioning', 'incumbent_response', 'regulatory_barriers', 'local_adaptation', 'partnership_dynamics']
}

// Probes for Policy Change scenarios
const POLICY_CHANGE_PROBES: ProbeSet = {
  type: 'policy_change',
  description: 'Changes to company policy, pricing, terms of service, or practices',
  probes: [
    {
      id: 'what_changing',
      question: 'What exactly is changing? What\'s the old policy vs. new policy?',
      field: 'action.what',
      required: true,
      extract_aspects: true
    },
    {
      id: 'why_changing',
      question: 'Why are you making this change? What drove this decision?',
      field: 'action.capabilities',
      required: true,
      extract_aspects: true
    },
    {
      id: 'who_affected',
      question: 'Who\'s most affected? Winners and losers from this change?',
      field: 'distribution',
      required: true,
      extract_aspects: true
    },
    {
      id: 'timing',
      question: 'When does this take effect? What\'s the transition period?',
      field: 'timing',
      required: true
    },
    {
      id: 'backlash_risk',
      question: 'What backlash do you anticipate? What will critics say?',
      field: 'known_vulnerabilities',
      required: true,
      extract_aspects: true
    },
    {
      id: 'competitive_context',
      question: 'How does this compare to competitor policies? Are you leading or following?',
      field: 'action.competitor_action',
      required: false,
      extract_aspects: true
    }
  ],
  aspect_categories: ['policy_specifics', 'affected_users', 'pricing_impact', 'competitive_comparison', 'regulatory_implications', 'transition_period']
}

// Probes for Crisis Response scenarios
const CRISIS_RESPONSE_PROBES: ProbeSet = {
  type: 'crisis_response',
  description: 'Responding to a crisis, incident, or negative situation',
  probes: [
    {
      id: 'what_happened',
      question: 'What happened? Describe the incident or situation as factually as possible.',
      field: 'action.incident',
      required: true,
      extract_aspects: true
    },
    {
      id: 'exposure',
      question: 'What\'s your exposure? Who was affected and how badly?',
      field: 'action.what',
      required: true,
      extract_aspects: true
    },
    {
      id: 'known_facts',
      question: 'What do you know for certain? What facts are confirmed?',
      field: 'action.capabilities',
      required: true
    },
    {
      id: 'unknowns',
      question: 'What don\'t you know yet? What\'s still being investigated?',
      field: 'known_vulnerabilities',
      required: true,
      extract_aspects: true
    },
    {
      id: 'timing',
      question: 'What\'s the timeline? When did it happen, when was it discovered, when do you need to respond?',
      field: 'timing',
      required: true
    },
    {
      id: 'stakeholder_pressure',
      question: 'Who\'s demanding answers or action? What are they asking for?',
      field: 'distribution',
      required: true,
      extract_aspects: true
    }
  ],
  aspect_categories: ['incident_details', 'affected_parties', 'liability_exposure', 'media_narrative', 'regulatory_response', 'remediation_actions']
}

// Probes for Competitive Response scenarios
const COMPETITIVE_RESPONSE_PROBES: ProbeSet = {
  type: 'competitive_response',
  description: 'Responding to a competitor action or market move',
  probes: [
    {
      id: 'competitor_action',
      question: 'What did your competitor do? Describe their announcement or action.',
      field: 'action.competitor_action',
      required: true,
      extract_aspects: true
    },
    {
      id: 'our_exposure',
      question: 'How does this affect you? What\'s at risk?',
      field: 'action.what',
      required: true,
      extract_aspects: true
    },
    {
      id: 'response_options',
      question: 'What are your response options? What could you do?',
      field: 'action.capabilities',
      required: true,
      extract_aspects: true
    },
    {
      id: 'timing_pressure',
      question: 'How urgent is this? Do you need to respond immediately or can you wait?',
      field: 'timing',
      required: true
    },
    {
      id: 'stakeholder_expectations',
      question: 'What do your stakeholders expect? Customers, investors, employees?',
      field: 'distribution',
      required: true,
      extract_aspects: true
    },
    {
      id: 'risks',
      question: 'What are the risks of responding vs. not responding?',
      field: 'known_vulnerabilities',
      required: true,
      extract_aspects: true
    }
  ],
  aspect_categories: ['competitor_claims', 'market_positioning', 'customer_concern', 'timing_dynamics', 'counter_narrative', 'strategic_options']
}

// Probes for Leadership Change scenarios
const LEADERSHIP_CHANGE_PROBES: ProbeSet = {
  type: 'leadership_change',
  description: 'New hire, departure, promotion, or leadership restructuring',
  probes: [
    {
      id: 'what_change',
      question: 'Describe the leadership change. Who is coming, going, or moving roles?',
      field: 'action.what',
      required: true,
      extract_aspects: true
    },
    {
      id: 'rationale',
      question: 'What\'s the strategic rationale for this change? What signal does it send?',
      field: 'action.rationale',
      required: true,
      extract_aspects: true
    },
    {
      id: 'background',
      question: 'What\'s the person\'s background? Any notable track record, affiliations, or reputation?',
      field: 'action.details',
      required: true,
      extract_aspects: true
    },
    {
      id: 'timing',
      question: 'When is this being announced? Is there strategic timing involved?',
      field: 'timing',
      required: true,
      extract_aspects: true
    },
    {
      id: 'stakeholder_impact',
      question: 'Who will react most strongly? Internal teams, competitors, investors, media?',
      field: 'distribution',
      required: true,
      extract_aspects: true
    },
    {
      id: 'vulnerabilities',
      question: 'What concerns exist? Potential criticism, departing talent risk, or narrative problems?',
      field: 'known_vulnerabilities',
      required: true,
      extract_aspects: true
    }
  ],
  aspect_categories: ['leadership_signal', 'strategic_direction', 'talent_implications', 'investor_confidence', 'cultural_impact', 'competitive_talent_war']
}

// Probes for Strategic Initiative scenarios
const STRATEGIC_INITIATIVE_PROBES: ProbeSet = {
  type: 'strategic_initiative',
  description: 'Major strategic move, pivot, capability announcement, political action, or organizational shift',
  probes: [
    {
      id: 'what_initiative',
      question: 'Describe the initiative. What are you doing and what does it signal?',
      field: 'action.what',
      required: true,
      extract_aspects: true
    },
    {
      id: 'goals',
      question: 'What are the strategic goals? What outcome are you trying to achieve?',
      field: 'action.rationale',
      required: true,
      extract_aspects: true
    },
    {
      id: 'claims',
      question: 'What claims or positioning statements will you make? How will you frame this?',
      field: 'action.claims',
      required: false,
      extract_aspects: true
    },
    {
      id: 'timing',
      question: 'What\'s the timing? Why now? Any external events or windows driving this?',
      field: 'timing',
      required: true,
      extract_aspects: true
    },
    {
      id: 'who_affected',
      question: 'Who is most affected? Who will support or oppose this?',
      field: 'distribution',
      required: true,
      extract_aspects: true
    },
    {
      id: 'vulnerabilities',
      question: 'What risks or vulnerabilities exist? What could go wrong or be criticized?',
      field: 'known_vulnerabilities',
      required: true,
      extract_aspects: true
    }
  ],
  aspect_categories: ['strategic_signal', 'competitive_implications', 'stakeholder_alignment', 'execution_risk', 'narrative_framing', 'political_dynamics']
}

// Probes for Expansion scenarios
const EXPANSION_PROBES: ProbeSet = {
  type: 'expansion',
  description: 'Geographic expansion, new office, facility, team, or operational scale-up',
  probes: [
    {
      id: 'what_expanding',
      question: 'What are you expanding? New region, facility, team, or capability?',
      field: 'action.what',
      required: true,
      extract_aspects: true
    },
    {
      id: 'rationale',
      question: 'Why this expansion? What business opportunity or strategic need does it address?',
      field: 'action.rationale',
      required: true,
      extract_aspects: true
    },
    {
      id: 'scale',
      question: 'What\'s the scale? Investment size, headcount, geographic scope?',
      field: 'action.details',
      required: true,
      extract_aspects: true
    },
    {
      id: 'timing',
      question: 'What\'s the timeline? Phased or all-at-once? Any market timing considerations?',
      field: 'timing',
      required: true
    },
    {
      id: 'competitive_context',
      question: 'How does this relate to competitors? Are they already there? Will they respond?',
      field: 'action.competitor_action',
      required: false,
      extract_aspects: true
    },
    {
      id: 'risks',
      question: 'What risks concern you? Execution, regulatory, competitive, cultural?',
      field: 'known_vulnerabilities',
      required: true,
      extract_aspects: true
    }
  ],
  aspect_categories: ['geographic_footprint', 'investment_signal', 'talent_acquisition', 'local_market_dynamics', 'competitive_response', 'regulatory_requirements']
}

// =============================================
// EXTERNAL TRIGGER SCENARIOS
// These are "if X happens, then..." scenarios
// =============================================

// Probes for Regulatory Change scenarios (external)
const REGULATORY_CHANGE_PROBES: ProbeSet = {
  type: 'regulatory_change',
  description: 'New legislation, regulatory ruling, compliance requirement, or policy mandate',
  probes: [
    {
      id: 'what_regulation',
      question: 'What is the regulation, legislation, or ruling? Describe it as specifically as possible.',
      field: 'action.trigger_description',
      required: true,
      extract_aspects: true
    },
    {
      id: 'who_behind',
      question: 'Who is behind this? Which regulatory body, government, or legislative body? What stage is it at (proposed, passed, enforced)?',
      field: 'action.trigger_source_actor',
      required: true,
      extract_aspects: true
    },
    {
      id: 'probability',
      question: 'How likely is this to happen (or has it already)? Is this confirmed, likely, possible, or speculative?',
      field: 'action.what',
      required: true,
      options: ['Already confirmed/passed', 'Very likely (75%+)', 'Possible (25-75%)', 'Speculative but worth modeling'],
      extract_aspects: false
    },
    {
      id: 'direct_impact',
      question: 'How would this directly affect your organization? Operations, revenue, compliance costs, market position?',
      field: 'action.impact_hypothesis',
      required: true,
      extract_aspects: true
    },
    {
      id: 'timing',
      question: 'What\'s the timeline? When could this take effect? Any compliance deadlines or phase-in periods?',
      field: 'timing',
      required: true,
      extract_aspects: true
    },
    {
      id: 'industry_impact',
      question: 'Who else in your industry is affected? Does this hit you harder or softer than competitors?',
      field: 'known_vulnerabilities',
      required: true,
      extract_aspects: true
    },
    {
      id: 'response_options',
      question: 'What response options are you considering? Compliance, lobbying, market pivot, strategic repositioning?',
      field: 'action.rationale',
      required: true,
      extract_aspects: true
    }
  ],
  aspect_categories: ['compliance_requirements', 'cost_impact', 'competitive_asymmetry', 'market_restructuring', 'lobbying_dynamics', 'timeline_pressure', 'adaptation_strategy']
}

// Probes for Market Disruption scenarios (external)
const MARKET_DISRUPTION_PROBES: ProbeSet = {
  type: 'market_disruption',
  description: 'Technology shift, economic event, new market entrant, supply chain disruption, or industry transformation',
  probes: [
    {
      id: 'what_disruption',
      question: 'What is the disruption? Describe the event, technology shift, or market change.',
      field: 'action.trigger_description',
      required: true,
      extract_aspects: true
    },
    {
      id: 'source',
      question: 'Where is this coming from? A specific company, technology trend, economic shift, or market force?',
      field: 'action.trigger_source_actor',
      required: true,
      extract_aspects: true
    },
    {
      id: 'probability',
      question: 'How certain is this disruption? Is it already happening, imminent, or a potential scenario you want to model?',
      field: 'action.what',
      required: true,
      options: ['Already happening', 'Imminent (next 6 months)', 'Medium-term threat (6-18 months)', 'Speculative but high-impact'],
      extract_aspects: false
    },
    {
      id: 'impact_on_us',
      question: 'How does this threaten or create opportunity for your organization? What parts of your business are affected?',
      field: 'action.impact_hypothesis',
      required: true,
      extract_aspects: true
    },
    {
      id: 'industry_winners_losers',
      question: 'Who wins and who loses from this disruption? Which competitors are better or worse positioned?',
      field: 'known_vulnerabilities',
      required: true,
      extract_aspects: true
    },
    {
      id: 'timing',
      question: 'What\'s the timeline? How fast is this moving? When do you need to act?',
      field: 'timing',
      required: true,
      extract_aspects: true
    },
    {
      id: 'strategic_options',
      question: 'What strategic options are on the table? Adapt, acquire, partner, pivot, double-down on current strategy?',
      field: 'action.rationale',
      required: true,
      extract_aspects: true
    }
  ],
  aspect_categories: ['technology_impact', 'market_share_shift', 'supply_chain_effects', 'customer_behavior_change', 'competitive_repositioning', 'investment_required', 'timing_window']
}

// Probes for Geopolitical Event scenarios (external)
const GEOPOLITICAL_EVENT_PROBES: ProbeSet = {
  type: 'geopolitical_event',
  description: 'Trade policy change, sanctions, political shift, international development, or macro-economic event',
  probes: [
    {
      id: 'what_event',
      question: 'What is the geopolitical event or development? Describe it specifically.',
      field: 'action.trigger_description',
      required: true,
      extract_aspects: true
    },
    {
      id: 'actors',
      question: 'Which governments, institutions, or political actors are involved? What are their motivations?',
      field: 'action.trigger_source_actor',
      required: true,
      extract_aspects: true
    },
    {
      id: 'probability',
      question: 'How likely is this scenario? Has it happened, is it developing, or are you stress-testing a possibility?',
      field: 'action.what',
      required: true,
      options: ['Already happened', 'Actively developing', 'Likely scenario', 'Stress-test / what-if'],
      extract_aspects: false
    },
    {
      id: 'business_exposure',
      question: 'What\'s your exposure? Revenue, supply chain, personnel, market access, regulatory standing?',
      field: 'action.impact_hypothesis',
      required: true,
      extract_aspects: true
    },
    {
      id: 'cascade_effects',
      question: 'What second-order effects concern you? (e.g., tariffs lead to price increases lead to customer churn)',
      field: 'known_vulnerabilities',
      required: true,
      extract_aspects: true
    },
    {
      id: 'timing',
      question: 'What\'s the timeline? Is this sudden or gradual? When would impacts be felt?',
      field: 'timing',
      required: true,
      extract_aspects: true
    },
    {
      id: 'response_posture',
      question: 'What\'s your likely response posture? Hedge, diversify, lobby, accelerate contingency plans, wait and see?',
      field: 'action.rationale',
      required: true,
      extract_aspects: true
    }
  ],
  aspect_categories: ['trade_impact', 'supply_chain_risk', 'market_access', 'regulatory_compliance', 'political_alignment', 'currency_exposure', 'contingency_planning']
}

// Probes for Stakeholder Move scenarios (external)
const STAKEHOLDER_MOVE_PROBES: ProbeSet = {
  type: 'stakeholder_move',
  description: 'Key customer, partner, investor, or supplier takes significant action',
  probes: [
    {
      id: 'who_and_what',
      question: 'Who is making the move and what are they doing? (e.g., "Major customer switching to competitor", "Key investor divesting", "Partner launching competing product")',
      field: 'action.trigger_description',
      required: true,
      extract_aspects: true
    },
    {
      id: 'relationship',
      question: 'What\'s your relationship with this stakeholder? How important are they to your business?',
      field: 'action.trigger_source_actor',
      required: true,
      extract_aspects: true
    },
    {
      id: 'probability',
      question: 'Is this confirmed or something you\'re anticipating? How certain are you this will happen?',
      field: 'action.what',
      required: true,
      options: ['Confirmed/announced', 'Strong signals it\'s coming', 'Rumors/early indicators', 'Hypothetical scenario to plan for'],
      extract_aspects: false
    },
    {
      id: 'direct_impact',
      question: 'What\'s the direct impact on your organization? Revenue, reputation, capability, market position?',
      field: 'action.impact_hypothesis',
      required: true,
      extract_aspects: true
    },
    {
      id: 'ripple_effects',
      question: 'What ripple effects do you expect? Will other stakeholders follow suit? Does this change market dynamics?',
      field: 'known_vulnerabilities',
      required: true,
      extract_aspects: true
    },
    {
      id: 'timing',
      question: 'When is this happening or expected? How much lead time do you have?',
      field: 'timing',
      required: true,
      extract_aspects: true
    },
    {
      id: 'response_strategy',
      question: 'What are your response options? Retain, replace, retaliate, restructure, or reposition?',
      field: 'action.rationale',
      required: true,
      extract_aspects: true
    }
  ],
  aspect_categories: ['relationship_impact', 'revenue_exposure', 'market_signal', 'competitive_advantage_shift', 'ecosystem_dynamics', 'replacement_options', 'narrative_control']
}

// Probes for Custom / catch-all scenarios
const CUSTOM_PROBES: ProbeSet = {
  type: 'custom',
  description: 'Any scenario that doesn\'t fit standard categories',
  probes: [
    {
      id: 'what',
      question: 'Describe what\'s happening in more detail. What exactly is being announced or done?',
      field: 'action.what',
      required: true,
      extract_aspects: true
    },
    {
      id: 'why',
      question: 'What\'s the strategic reasoning? What goal does this serve?',
      field: 'action.rationale',
      required: true,
      extract_aspects: true
    },
    {
      id: 'timing',
      question: 'When is this happening? Is there anything significant about the timing?',
      field: 'timing',
      required: true,
      extract_aspects: true
    },
    {
      id: 'who_cares',
      question: 'Who will care most about this? Who will respond, and how?',
      field: 'distribution',
      required: true,
      extract_aspects: true
    },
    {
      id: 'risks',
      question: 'What could go wrong? What criticism or pushback do you anticipate?',
      field: 'known_vulnerabilities',
      required: true,
      extract_aspects: true
    }
  ],
  aspect_categories: ['strategic_impact', 'stakeholder_reactions', 'competitive_dynamics', 'narrative_risk', 'timing_dynamics', 'execution_concerns']
}

// Map of all probe sets
export const PROBE_SETS: Record<ScenarioType, ProbeSet> = {
  // Internal actions
  product_launch: PRODUCT_LAUNCH_PROBES,
  merger_acquisition: MERGER_ACQUISITION_PROBES,
  market_entry: MARKET_ENTRY_PROBES,
  policy_change: POLICY_CHANGE_PROBES,
  crisis_response: CRISIS_RESPONSE_PROBES,
  competitive_response: COMPETITIVE_RESPONSE_PROBES,
  leadership_change: LEADERSHIP_CHANGE_PROBES,
  strategic_initiative: STRATEGIC_INITIATIVE_PROBES,
  expansion: EXPANSION_PROBES,
  // External triggers
  regulatory_change: REGULATORY_CHANGE_PROBES,
  market_disruption: MARKET_DISRUPTION_PROBES,
  geopolitical_event: GEOPOLITICAL_EVENT_PROBES,
  stakeholder_move: STAKEHOLDER_MOVE_PROBES,
  // Catch-all
  custom: CUSTOM_PROBES
}

// Which scenario types are external triggers vs internal actions
export const EXTERNAL_TRIGGER_TYPES: ScenarioType[] = [
  'regulatory_change',
  'market_disruption',
  'geopolitical_event',
  'stakeholder_move'
]

export const INTERNAL_ACTION_TYPES: ScenarioType[] = [
  'product_launch',
  'merger_acquisition',
  'market_entry',
  'policy_change',
  'crisis_response',
  'competitive_response',
  'leadership_change',
  'strategic_initiative',
  'expansion'
]

// Get the next unanswered probe for a scenario
export function getNextProbe(
  type: ScenarioType,
  answeredProbes: string[]
): ScenarioProbe | null {
  const probeSet = PROBE_SETS[type]
  if (!probeSet) return null

  // Find first required probe not yet answered
  for (const probe of probeSet.probes) {
    if (probe.required && !answeredProbes.includes(probe.id)) {
      return probe
    }
  }

  // Then optional probes
  for (const probe of probeSet.probes) {
    if (!probe.required && !answeredProbes.includes(probe.id)) {
      return probe
    }
  }

  return null
}

// Get all probes for a type
export function getProbesForType(type: ScenarioType): ScenarioProbe[] {
  return PROBE_SETS[type]?.probes || []
}

// Get aspect categories for a type
export function getAspectCategories(type: ScenarioType): string[] {
  return PROBE_SETS[type]?.aspect_categories || []
}

// Type detection prompt
export const TYPE_DETECTION_PROMPT = `You are analyzing a scenario description to determine its type. Pay close attention to whether the organization is the ACTOR (internal action) or the REACTOR (external trigger).

INTERNAL ACTION types (the org IS doing something):
- product_launch: New product, feature, or technology announcement
- merger_acquisition: Merger, acquisition, investment, or major partnership
- market_entry: Entering a new geographic or product market
- policy_change: Changes to company policy, pricing, terms of service
- crisis_response: Responding to a crisis, incident, or negative situation
- competitive_response: Responding to a competitor action or market move
- leadership_change: New hire, executive departure, promotion, restructuring
- strategic_initiative: Major strategic move, pivot, political action, capability buildout, or organizational shift
- expansion: Geographic expansion, new office, facility, team scale-up

EXTERNAL TRIGGER types (something is happening TO or AROUND the org):
- regulatory_change: New legislation, regulatory ruling, compliance requirement, government mandate
- market_disruption: Technology shift, economic event, new market entrant, supply chain disruption, industry transformation
- geopolitical_event: Trade policy, sanctions, tariffs, political shift, international development, macro-economic event
- stakeholder_move: Key customer, partner, investor, or supplier takes significant action

- custom: Anything that doesn't clearly fit the above categories

Key distinction: If the description starts with "If...", "What if...", "New legislation...", "What happens when...", or describes an external force, it's likely an EXTERNAL TRIGGER. If it describes something the org is planning to do, it's an INTERNAL ACTION.

Analyze the description and return:
1. The most likely scenario type
2. Whether this is an internal action or external trigger
3. Your confidence (0.0-1.0)
4. Key aspects identified in the description

Respond with JSON only:
{
  "type": "regulatory_change",
  "trigger_source": "external",
  "confidence": 0.85,
  "aspects": ["aspect1", "aspect2"],
  "reasoning": "Brief explanation"
}`

// Stakeholder inference prompt
export const STAKEHOLDER_INFERENCE_PROMPT = `Based on this scenario, identify the key stakeholders who will respond.

IMPORTANT: If this is an EXTERNAL TRIGGER scenario (regulatory change, market disruption, geopolitical event, stakeholder move), focus on:
- Who else is affected by this same external event?
- Who benefits or loses from this change?
- Who has influence over the outcome?
- Who will the organization's stakeholders look to for guidance?

For each stakeholder category, suggest specific entities that would be relevant:
- competitors: Direct and indirect competitors who will respond (or also be affected)
- regulators: Regulatory bodies with jurisdiction
- customers: Customer segments affected
- ecosystem: Partners, suppliers, adjacent players
- media: Types of media outlets that will cover this
- analysts: Industry analysts who track this space
- investors: Investor types who will react
- employees: Internal stakeholder groups

Consider:
1. Who has the most at stake?
2. Who will feel compelled to respond publicly?
3. Who might be silently affected?
4. For external triggers: Who else faces the same event and might respond differently?

Respond with JSON:
{
  "stakeholders": {
    "competitors": ["entity1", "entity2"],
    "regulators": ["entity1"],
    ...
  },
  "aspect_mapping": {
    "aspect_name": ["stakeholder1", "stakeholder2"]
  }
}`
