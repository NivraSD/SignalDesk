/**
 * LP Simulation Orchestrator
 *
 * Multi-round simulation engine where entity responses propagate across rounds.
 *
 * Flow:
 * 1. Load scenario + identify relevant entities
 * 2. Run Round 1: all entities respond to scenario (parallel)
 * 3. Cross-entity analysis: themes, influence, coalitions, gaps
 * 4. Check stabilization - if not stable and rounds < max, continue
 * 5. Round 2+: entities respond to prior round outputs
 * 6. Repeat until stabilization or max rounds
 * 7. Identify fulcrums (only after seeing full cascade)
 *
 * Key insight: Fulcrums only become visible after watching the cascade play out.
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders, jsonResponse, errorResponse } from '../_shared/cors.ts'
import { runRound, buildEntityMemory } from './round-runner.ts'
import { detectStabilization } from './stabilization-detector.ts'
import type {
  SimulationRequest,
  SimulationResponse,
  Simulation,
  SimulationConfig,
  SimulationEntity,
  SimulationRound,
  RoundContext,
  EntityResponse,
  CrossEntityAnalysis,
  EntityRoundMemory,
  Fulcrum
} from './types.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const GOOGLE_API_KEY = Deno.env.get('GOOGLE_API_KEY') || Deno.env.get('GEMINI_API_KEY')
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') || Deno.env.get('CLAUDE_API_KEY')

// === AI Helpers ===

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 3,
  baseDelay = 2000
): Promise<Response> {
  const retryableStatuses = [429, 500, 502, 503, 529]
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, options)
    if (response.ok || !retryableStatuses.includes(response.status)) {
      return response
    }
    if (attempt < maxRetries) {
      const jitter = Math.random() * 0.5 + 1
      const delay = Math.round(baseDelay * Math.pow(2, attempt) * jitter)
      console.log(`⚠️ AI API returned ${response.status}, retrying in ${delay}ms...`)
      await new Promise(resolve => setTimeout(resolve, delay))
    } else {
      return response
    }
  }
  throw new Error('Unexpected: retry loop exited without returning')
}

function parseJSON(text: string): any {
  let clean = text.trim()
  try { return JSON.parse(clean) } catch (_) { /* continue */ }

  if (clean.includes('```json')) {
    const match = clean.match(/```json\s*([\s\S]*?)```/)
    if (match) clean = match[1].trim()
  } else if (clean.includes('```')) {
    const match = clean.match(/```\s*([\s\S]*?)```/)
    if (match) clean = match[1].trim()
  }
  try { return JSON.parse(clean) } catch (_) { /* continue */ }

  // Array extraction
  const firstBracket = clean.indexOf('[')
  const lastBracket = clean.lastIndexOf(']')
  if (firstBracket >= 0 && lastBracket > firstBracket) {
    try { return JSON.parse(clean.substring(firstBracket, lastBracket + 1)) } catch (_) { /* continue */ }
  }

  // Object extraction
  const firstBrace = clean.indexOf('{')
  const lastBrace = clean.lastIndexOf('}')
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    try { return JSON.parse(clean.substring(firstBrace, lastBrace + 1)) } catch (_) { /* continue */ }
  }

  throw new Error('Failed to parse JSON from AI response')
}

async function callGemini(prompt: string): Promise<any> {
  if (!GOOGLE_API_KEY) throw new Error('No Google API key configured')

  const response = await fetchWithRetry(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GOOGLE_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 6000 }
      })
    }
  )

  if (!response.ok) {
    throw new Error(`Gemini error: ${response.status}`)
  }

  const result = await response.json()
  const content = result.candidates?.[0]?.content?.parts?.[0]?.text || ''
  return parseJSON(content)
}

async function callClaude(prompt: string): Promise<any> {
  if (!ANTHROPIC_API_KEY) throw new Error('No Anthropic API key configured')

  const response = await fetchWithRetry(
    'https://api.anthropic.com/v1/messages',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 6000,
        temperature: 0.3,
        messages: [{ role: 'user', content: prompt }]
      })
    }
  )

  if (!response.ok) {
    throw new Error(`Claude error: ${response.status}`)
  }

  const result = await response.json()
  const content = result.content?.[0]?.text || ''
  return parseJSON(content)
}

async function callAI(prompt: string): Promise<any> {
  try {
    return await callGemini(prompt)
  } catch (err: any) {
    console.warn(`Gemini failed: ${err.message}, trying Claude...`)
    return await callClaude(prompt)
  }
}

const DEFAULT_CONFIG: SimulationConfig = {
  max_rounds: 5,
  min_rounds: 2,
  stabilization_threshold: 0.8,
  parallel_batch_size: 5,
  entity_timeout_ms: 30000
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  const startTime = Date.now()

  try {
    const body: SimulationRequest = await req.json()
    console.log(`🎭 LP Simulation Orchestrator: scenario ${body.scenario_id}`)

    if (!body.scenario_id) {
      return errorResponse('scenario_id is required', 400)
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    // Load scenario
    const { data: scenario, error: scenarioError } = await supabase
      .from('lp_scenarios')
      .select('*')
      .eq('id', body.scenario_id)
      .single()

    if (scenarioError || !scenario) {
      return errorResponse(`Scenario not found: ${scenarioError?.message}`, 404)
    }

    console.log(`📋 Scenario: ${scenario.title || scenario.scenario_type}`)

    // Build config
    const config: SimulationConfig = {
      ...DEFAULT_CONFIG,
      max_rounds: body.max_rounds || DEFAULT_CONFIG.max_rounds,
      min_rounds: body.min_rounds || DEFAULT_CONFIG.min_rounds,
      stabilization_threshold: body.stabilization_threshold || DEFAULT_CONFIG.stabilization_threshold
    }

    // Identify entities for simulation
    const entities = await identifyEntities(
      supabase,
      scenario,
      body.organization_id,
      body.entity_ids,
      body.include_client
    )

    if (entities.length === 0) {
      return errorResponse('No entities found for simulation', 400)
    }

    console.log(`👥 ${entities.length} entities identified for simulation`)

    // Create simulation record
    const { data: simulation, error: simError } = await supabase
      .from('lp_simulations')
      .insert({
        scenario_id: body.scenario_id,
        organization_id: body.organization_id,
        status: 'running',
        config,
        entities,
        rounds_completed: 0
      })
      .select()
      .single()

    if (simError) {
      return errorResponse(`Failed to create simulation: ${simError.message}`, 500)
    }

    console.log(`🆔 Simulation ID: ${simulation.id}`)

    // Run simulation loop
    const result = await runSimulationLoop(
      supabase,
      simulation.id,
      scenario,
      entities,
      config
    )

    // Update final simulation state
    await supabase
      .from('lp_simulations')
      .update({
        status: result.status,
        rounds_completed: result.roundsCompleted,
        stabilization_score: result.stabilizationScore,
        dominant_narratives: result.dominantNarratives,
        key_coalitions: result.keyCoalitions,
        gaps_identified: result.gapsIdentified,
        fulcrums: result.fulcrums,
        completed_at: new Date().toISOString(),
        error: result.error
      })
      .eq('id', simulation.id)

    const totalTime = Date.now() - startTime
    console.log(`✅ Simulation complete in ${totalTime}ms - ${result.roundsCompleted} rounds, status: ${result.status}`)

    return jsonResponse({
      success: true,
      simulation_id: simulation.id,
      status: result.status,
      rounds_completed: result.roundsCompleted,
      stabilization_score: result.stabilizationScore,
      dominant_narratives: result.dominantNarratives,
      key_coalitions: result.keyCoalitions,
      gaps_identified: result.gapsIdentified,
      fulcrums: result.fulcrums,
      duration_ms: totalTime
    })

  } catch (err: any) {
    console.error('❌ Simulation orchestrator error:', err.message)
    return errorResponse(err.message || 'Simulation failed', 500)
  }
})

/**
 * Identify which entities should participate in the simulation
 */
async function identifyEntities(
  supabase: any,
  scenario: any,
  organizationId: string,
  overrideEntityIds?: string[],
  includeClient?: boolean
): Promise<SimulationEntity[]> {
  const entities: SimulationEntity[] = []

  // If explicit entity IDs provided, use those
  if (overrideEntityIds && overrideEntityIds.length > 0) {
    const { data: profiles } = await supabase
      .from('lp_entity_profiles')
      .select('id, entity_name, entity_type')
      .in('id', overrideEntityIds)

    for (const profile of profiles || []) {
      entities.push({
        entity_id: profile.id,
        entity_name: profile.entity_name,
        entity_type: profile.entity_type,
        profile_id: profile.id,
        relevance_score: 1.0,
        included: true
      })
    }
    return entities
  }

  // Auto-detect from scenario stakeholders
  const stakeholders = scenario.stakeholders || scenario.stakeholder_seed || []

  for (const stakeholder of stakeholders) {
    // Try to find existing profile
    const { data: profile } = await supabase
      .from('lp_entity_profiles')
      .select('id, entity_name, entity_type')
      .ilike('entity_name', `%${stakeholder.name || stakeholder}%`)
      .limit(1)
      .single()

    if (profile) {
      entities.push({
        entity_id: profile.id,
        entity_name: profile.entity_name,
        entity_type: profile.entity_type,
        profile_id: profile.id,
        relevance_score: stakeholder.relevance || 0.8,
        included: true
      })
    }
  }

  // If still no entities, pull from industry-relevant profiles
  if (entities.length < 3) {
    const industry = scenario.industry || 'technology'
    const { data: industryProfiles } = await supabase
      .from('lp_entity_profiles')
      .select('id, entity_name, entity_type')
      .eq('entity_type', 'company')
      .limit(10)

    for (const profile of industryProfiles || []) {
      if (!entities.find(e => e.entity_id === profile.id)) {
        entities.push({
          entity_id: profile.id,
          entity_name: profile.entity_name,
          entity_type: profile.entity_type,
          profile_id: profile.id,
          relevance_score: 0.5,
          included: entities.length < 10 // Include up to 10
        })
      }
    }
  }

  // Optionally include client's org
  if (includeClient && organizationId) {
    const { data: clientProfile } = await supabase
      .from('lp_entity_profiles')
      .select('id, entity_name, entity_type')
      .eq('organization_id', organizationId)
      .eq('entity_type', 'company')
      .limit(1)
      .single()

    if (clientProfile && !entities.find(e => e.entity_id === clientProfile.id)) {
      entities.push({
        entity_id: clientProfile.id,
        entity_name: clientProfile.entity_name,
        entity_type: 'client',
        profile_id: clientProfile.id,
        relevance_score: 1.0,
        included: true
      })
    }
  }

  return entities
}

/**
 * Main simulation loop - runs rounds until stabilization or max rounds
 */
async function runSimulationLoop(
  supabase: any,
  simulationId: string,
  scenario: any,
  entities: SimulationEntity[],
  config: SimulationConfig
): Promise<{
  status: string
  roundsCompleted: number
  stabilizationScore: number
  dominantNarratives: string[]
  keyCoalitions: any[]
  gapsIdentified: string[]
  fulcrums: Fulcrum[]
  error?: string
}> {
  const allResponses: EntityResponse[] = []
  const allAnalyses: CrossEntityAnalysis[] = []
  const entityMemory = new Map<string, EntityRoundMemory>()

  let currentRound = 0
  let isStabilized = false
  let stabilizationScore = 0

  try {
    while (currentRound < config.max_rounds) {
      currentRound++

      // Build context for this round
      const context: RoundContext = {
        simulation_id: simulationId,
        round_number: currentRound,
        scenario,
        prior_responses: currentRound === 1 ? [] : allResponses.filter(r => r.round_number === currentRound - 1),
        themes_so_far: allAnalyses.length > 0
          ? allAnalyses[allAnalyses.length - 1].themes.map(t => t.theme)
          : [],
        dominant_narratives: allAnalyses.length > 0
          ? allAnalyses[allAnalyses.length - 1].themes
              .filter(t => t.momentum === 'rising')
              .map(t => t.theme)
          : [],
        gaps_identified: allAnalyses.length > 0
          ? allAnalyses[allAnalyses.length - 1].gaps.map(g => g.description)
          : [],
        entity_memory: entityMemory
      }

      // Run the round
      const roundResult = await runRound(
        currentRound,
        entities,
        context,
        {
          parallelBatchSize: config.parallel_batch_size,
          entityTimeoutMs: config.entity_timeout_ms
        }
      )

      // Store round in DB
      await supabase
        .from('lp_simulation_rounds')
        .insert({
          simulation_id: simulationId,
          round_number: currentRound,
          entity_responses: roundResult.responses,
          cross_analysis: roundResult.analysis,
          started_at: new Date(Date.now() - roundResult.duration_ms).toISOString(),
          completed_at: new Date().toISOString(),
          status: 'completed'
        })

      // Update simulation progress
      await supabase
        .from('lp_simulations')
        .update({
          rounds_completed: currentRound,
          stabilization_score: roundResult.analysis.stabilization_score
        })
        .eq('id', simulationId)

      // Accumulate results
      allResponses.push(...roundResult.responses)
      allAnalyses.push(roundResult.analysis)

      // Update entity memory
      for (const entity of entities) {
        entityMemory.set(entity.entity_id, buildEntityMemory(entity.entity_id, allResponses))
      }

      // Check stabilization (only after min rounds)
      if (currentRound >= config.min_rounds) {
        const priorAnalysis = allAnalyses.length > 1 ? allAnalyses[allAnalyses.length - 2] : undefined
        const priorResponses = allResponses.filter(r => r.round_number === currentRound - 1)

        const stabilization = detectStabilization({
          currentRound,
          currentResponses: roundResult.responses,
          priorResponses,
          currentAnalysis: roundResult.analysis,
          priorAnalysis,
          threshold: config.stabilization_threshold
        })

        stabilizationScore = stabilization.score
        isStabilized = stabilization.isStabilized

        if (isStabilized) {
          console.log(`🎯 Stabilization reached at round ${currentRound}: ${stabilization.reasons.join(', ')}`)
          break
        }
      }
    }

    // Extract final results
    const lastAnalysis = allAnalyses[allAnalyses.length - 1]
    const dominantNarratives = lastAnalysis.themes
      .filter(t => t.momentum === 'rising' || t.adopters.length > 2)
      .map(t => t.theme)

    const gapsIdentified = lastAnalysis.gaps.map(g => g.description)

    // Identify fulcrums (only after simulation completes)
    const fulcrums = await identifyFulcrums(allResponses, allAnalyses, scenario)

    return {
      status: isStabilized ? 'stabilized' : 'max_rounds_reached',
      roundsCompleted: currentRound,
      stabilizationScore,
      dominantNarratives,
      keyCoalitions: lastAnalysis.coalitions,
      gapsIdentified,
      fulcrums
    }

  } catch (err: any) {
    console.error('Simulation loop error:', err.message)
    return {
      status: 'failed',
      roundsCompleted: currentRound,
      stabilizationScore,
      dominantNarratives: [],
      keyCoalitions: [],
      gapsIdentified: [],
      fulcrums: [],
      error: err.message
    }
  }
}

/**
 * Identify fulcrums - high-leverage intervention points
 * Hybrid approach: algorithmic pre-filter for candidate signals, then AI synthesis
 * for grounded descriptions referencing actual entity behavior.
 */
async function identifyFulcrums(
  allResponses: EntityResponse[],
  allAnalyses: CrossEntityAnalysis[],
  scenario: any
): Promise<Fulcrum[]> {
  if (allAnalyses.length === 0) return []

  const lastAnalysis = allAnalyses[allAnalyses.length - 1]
  const lastRound = allAnalyses.length

  // === Step 1: Extract algorithmic candidate signals ===

  // Top influencers with citation detail
  const influencerCandidates = lastAnalysis.influence_rankings
    .slice(0, 5)
    .filter(inf => inf.citations_received >= 2)
    .map(inf => {
      const citers = lastAnalysis.influence_flows
        .filter(f => f.to_entity === inf.entity_id && (f.type === 'citation' || f.type === 'frame_adoption'))
        .map(f => f.from_entity)
      return {
        entity_id: inf.entity_id,
        entity_name: inf.entity_name,
        citations: inf.citations_received,
        frames_adopted: inf.frames_adopted,
        cited_by: citers
      }
    })

  // High-value gaps with potential fillers
  const gapCandidates = lastAnalysis.gaps
    .filter(g => g.strategic_value === 'high' || g.strategic_value === 'medium')
    .map(g => ({
      description: g.description,
      strategic_value: g.strategic_value,
      potential_fillers: g.potential_fillers,
      related_aspects: g.related_aspects
    }))

  // Coalitions with diverging member positions
  const wedgeCandidates = lastAnalysis.coalitions
    .filter(c => c.members.length >= 2)
    .map(coalition => {
      const memberPositions = allResponses
        .filter(r => coalition.members.includes(r.entity_id) && r.round_number === lastRound)
        .map(r => ({
          entity_id: r.entity_id,
          entity_name: r.entity_name,
          position: r.position_summary,
          decision: r.response_decision,
          key_claims: r.key_claims
        }))
      const uniquePositions = new Set(memberPositions.map(m => m.position))
      return {
        coalition_name: coalition.name,
        coalition_id: coalition.coalition_id,
        stability: coalition.stability,
        members: memberPositions,
        has_divergence: uniquePositions.size > 1
      }
    })

  // Entities with high-confidence predicted reactions (preemption targets)
  const preemptionCandidates = allResponses
    .filter(r => r.round_number === lastRound && r.predicted_reactions.length > 0)
    .flatMap(r => r.predicted_reactions
      .filter(p => p.confidence > 0.5)
      .map(p => ({
        predictor_entity: r.entity_name,
        target_entity_id: p.entity_id,
        predicted_response: p.predicted_response,
        confidence: p.confidence
      }))
    )
    .slice(0, 5)

  // === Step 2: Build entity position summaries from final round ===

  const entityPositions = allResponses
    .filter(r => r.round_number === lastRound)
    .map(r => ({
      name: r.entity_name,
      decision: r.response_decision,
      position: r.position_summary,
      key_claims: r.key_claims.slice(0, 3),
      themes: r.themes_championed
    }))

  // Theme momentum
  const themeMomentum = lastAnalysis.themes.map(t => ({
    theme: t.theme,
    momentum: t.momentum,
    owner: t.owner,
    adopters: t.adopters
  }))

  // === Step 3: AI call to synthesize grounded fulcrums ===

  const prompt = `You are analyzing the results of a multi-round narrative simulation to identify strategic fulcrums — high-leverage intervention points where a small action produces disproportionate impact.

## Scenario
Type: ${scenario.scenario_type || scenario.type || 'unknown'}
Action: ${JSON.stringify(scenario.action || scenario.scenario_data?.action || scenario.title || '')}

## Entity Final Positions (Round ${lastRound})
${entityPositions.map(e => `- **${e.name}** [${e.decision}]: ${e.position}
  Claims: ${e.key_claims.join('; ')}
  Themes: ${e.themes.join(', ')}`).join('\n')}

## Theme Momentum
${themeMomentum.map(t => `- "${t.theme}" — ${t.momentum}, owned by ${t.owner}, adopted by: ${t.adopters.join(', ')}`).join('\n')}

## Candidate Signals

### High-Influence Entities
${influencerCandidates.length > 0
  ? influencerCandidates.map(i => `- ${i.entity_name}: ${i.citations} citations, ${i.frames_adopted} frames adopted. Cited by: ${i.cited_by.join(', ')}`).join('\n')
  : '(none with 2+ citations)'}

### Narrative Gaps
${gapCandidates.length > 0
  ? gapCandidates.map(g => `- [${g.strategic_value}] ${g.description}. Potential fillers: ${g.potential_fillers.join(', ')}`).join('\n')
  : '(no significant gaps)'}

### Coalition Dynamics
${wedgeCandidates.map(c => `- "${c.coalition_name}" (${c.stability}): ${c.has_divergence ? 'DIVERGING' : 'aligned'}
  ${c.members.map(m => `  ${m.entity_name}: ${m.position}`).join('\n')}`).join('\n')}

### Preemption Opportunities
${preemptionCandidates.length > 0
  ? preemptionCandidates.map(p => `- ${p.predictor_entity} predicts ${p.target_entity_id} will: "${p.predicted_response}" (confidence: ${p.confidence})`).join('\n')
  : '(no high-confidence predictions)'}

## Instructions

Identify 3-8 strategic fulcrums. Each fulcrum MUST:
1. Be grounded in specific entity behavior from this simulation (reference entity names and their actual positions/decisions)
2. Have a unique, specific description — no generic phrases like "endorsement cascades to others"
3. Include concrete cascade predictions specific to this scenario
4. Be actionable for the organization running this simulation

For each fulcrum, output a JSON object with these exact fields:
- fulcrum_id: string (use format: type_entityname, e.g. "validator_techcorp")
- type: one of "validator_path" | "unoccupied_position" | "wedge_issue" | "preemption"
- description: string (1-2 sentences, specific to this simulation)
- target_entity: string or null (entity_id if applicable)
- rationale: string (explain WHY this is a leverage point, referencing actual simulation data)
- cascade_prediction: string[] (2-3 specific predicted outcomes)
- effort_level: "low" | "medium" | "high"
- impact_level: "low" | "medium" | "high"
- confidence: number 0-1

Output a JSON array of fulcrum objects. No commentary outside the JSON.`

  try {
    console.log('🔍 AI fulcrum identification starting...')
    const startTime = Date.now()
    const aiFulcrums = await callAI(prompt)
    console.log(`🔍 AI fulcrum identification complete in ${Date.now() - startTime}ms`)

    // Validate and normalize the response
    const fulcrumArray = Array.isArray(aiFulcrums) ? aiFulcrums : [aiFulcrums]
    const validTypes = ['validator_path', 'unoccupied_position', 'wedge_issue', 'preemption']

    const validated: Fulcrum[] = fulcrumArray
      .filter((f: any) => f && f.description && f.type && validTypes.includes(f.type))
      .slice(0, 8)
      .map((f: any) => ({
        fulcrum_id: f.fulcrum_id || `fulcrum_${Math.random().toString(36).substring(2, 8)}`,
        type: f.type as Fulcrum['type'],
        description: f.description,
        target_entity: f.target_entity || undefined,
        rationale: f.rationale || f.description,
        cascade_prediction: Array.isArray(f.cascade_prediction) ? f.cascade_prediction : [f.cascade_prediction || 'Impact depends on execution timing'],
        effort_level: (['low', 'medium', 'high'].includes(f.effort_level) ? f.effort_level : 'medium') as Fulcrum['effort_level'],
        impact_level: (['low', 'medium', 'high'].includes(f.impact_level) ? f.impact_level : 'medium') as Fulcrum['impact_level'],
        confidence: typeof f.confidence === 'number' ? Math.min(1, Math.max(0, f.confidence)) : 0.5
      }))

    if (validated.length > 0) {
      return validated
    }

    // If AI returned nothing valid, fall through to algorithmic fallback
    console.warn('⚠️ AI returned no valid fulcrums, using algorithmic fallback')
  } catch (err: any) {
    console.error(`❌ AI fulcrum identification failed: ${err.message}, using algorithmic fallback`)
  }

  // === Algorithmic fallback (same structure, kept minimal) ===
  return buildAlgorithmicFulcrums(allResponses, lastAnalysis, lastRound)
}

/**
 * Algorithmic fallback for fulcrum identification.
 * Used only if the AI call fails.
 */
function buildAlgorithmicFulcrums(
  allResponses: EntityResponse[],
  lastAnalysis: CrossEntityAnalysis,
  lastRound: number
): Fulcrum[] {
  const fulcrums: Fulcrum[] = []

  // Validator paths
  for (const inf of lastAnalysis.influence_rankings.slice(0, 3)) {
    if (inf.citations_received >= 2) {
      fulcrums.push({
        fulcrum_id: `validator_${inf.entity_id}`,
        type: 'validator_path',
        description: `${inf.entity_name} received ${inf.citations_received} citations and had ${inf.frames_adopted} frames adopted by others`,
        target_entity: inf.entity_id,
        rationale: `High influence score — other entities are already adopting their framing`,
        cascade_prediction: [`${inf.entity_name}'s endorsement would likely cascade through citing entities`],
        effort_level: 'medium',
        impact_level: 'high',
        confidence: 0.6
      })
    }
  }

  // Gap fulcrums
  for (const gap of lastAnalysis.gaps.filter(g => g.strategic_value === 'high')) {
    fulcrums.push({
      fulcrum_id: `gap_${gap.gap_id}`,
      type: 'unoccupied_position',
      description: gap.description,
      rationale: `No entity addressed this area. Potential fillers: ${gap.potential_fillers.join(', ') || 'none identified'}`,
      cascade_prediction: ['First mover in this space establishes the frame others must respond to'],
      effort_level: 'low',
      impact_level: 'medium',
      confidence: 0.5
    })
  }

  // Wedge issues
  for (const coalition of lastAnalysis.coalitions.filter(c => c.members.length >= 3)) {
    const memberPositions = allResponses
      .filter(r => coalition.members.includes(r.entity_id) && r.round_number === lastRound)
      .map(r => r.position_summary)
    if (new Set(memberPositions).size > 1) {
      fulcrums.push({
        fulcrum_id: `wedge_${coalition.coalition_id}`,
        type: 'wedge_issue',
        description: `${coalition.name} coalition (${coalition.stability}) shows position divergence among ${coalition.members.length} members`,
        target_entity: coalition.members[0],
        rationale: `Members hold ${new Set(memberPositions).size} distinct positions despite coalition alignment`,
        cascade_prediction: ['Targeting the divergence point could fracture coalition coordination'],
        effort_level: 'medium',
        impact_level: 'high',
        confidence: 0.4
      })
    }
  }

  return fulcrums
}
