/**
 * LP Run Simulation Round
 *
 * Runs ONE round of a simulation. Client drives the loop.
 * Each call: entity simulations (parallel) → cross-entity analysis → save to DB → return.
 *
 * If this function dies, the prior rounds are already saved.
 * If it completes, the client sees the result and decides whether to run another round.
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders, jsonResponse, errorResponse } from '../_shared/cors.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const GOOGLE_API_KEY = Deno.env.get('GOOGLE_AI_API_KEY') || Deno.env.get('GEMINI_API_KEY') || Deno.env.get('GOOGLE_API_KEY')

// === Types (inlined to avoid cross-function imports) ===

interface RunRoundRequest {
  simulation_id: string
  round_number: number
  phase: {
    id: string
    name: string
    description: string
    lens: string
    focus_areas: string[]
  }
  scenario: any
  entities: Array<{
    entity_id: string
    entity_name: string
    entity_type: string
    profile_id: string
    included: boolean
  }>
  prior_responses?: any[]
  themes_so_far?: string[]
  dominant_narratives?: string[]
  gaps_identified?: string[]
  entity_memory?: Record<string, any>
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  const startTime = Date.now()

  try {
    const body: RunRoundRequest = await req.json()

    if (!body.simulation_id || !body.round_number || !body.phase || !body.entities) {
      return errorResponse('simulation_id, round_number, phase, and entities required', 400)
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    console.log(`🔄 Round ${body.round_number}: ${body.phase.name} — ${body.entities.length} entities`)

    // Run all entity simulations in parallel
    const activeEntities = body.entities.filter(e => e.included)
    const entityPromises = activeEntities.map(entity =>
      runEntitySimulation(entity, body)
        .catch(err => {
          console.warn(`  ⚠️ ${entity.entity_name} failed: ${err.message}`)
          return createFailedResponse(entity, body.round_number)
        })
    )

    const responses = await Promise.all(entityPromises)
    console.log(`  ✅ ${responses.filter(r => r.response_decision !== 'silent').length}/${activeEntities.length} entities responded`)

    // Cross-entity analysis (algorithmic, no AI call needed)
    const analysis = runCrossEntityAnalysis(
      body.round_number,
      responses,
      body.prior_responses || []
    )

    // Save round to DB
    await supabase
      .from('lp_simulation_rounds')
      .insert({
        simulation_id: body.simulation_id,
        round_number: body.round_number,
        entity_responses: responses,
        cross_analysis: {
          ...analysis,
          phase_id: body.phase.id,
          phase_name: body.phase.name,
          phase_description: body.phase.description,
        },
        started_at: new Date(startTime).toISOString(),
        completed_at: new Date().toISOString(),
        status: 'completed'
      })

    // Update simulation progress
    await supabase
      .from('lp_simulations')
      .update({
        rounds_completed: body.round_number,
        stabilization_score: analysis.stabilization_score
      })
      .eq('id', body.simulation_id)

    const duration = Date.now() - startTime
    console.log(`✅ Round ${body.round_number} complete in ${duration}ms — stabilization: ${analysis.stabilization_score.toFixed(2)}`)

    return jsonResponse({
      round_number: body.round_number,
      responses,
      analysis,
      duration_ms: duration
    })

  } catch (err: any) {
    console.error('❌ Round error:', err.message)
    return errorResponse(err.message || 'Round failed', 500)
  }
})

// === Entity Simulation ===

async function runEntitySimulation(
  entity: any,
  context: RunRoundRequest
): Promise<any> {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/lp-entity-simulation`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
    },
    body: JSON.stringify({
      entity_id: entity.entity_id,
      entity_name: entity.entity_name,
      profile_id: entity.profile_id,
      round_number: context.round_number,
      phase: context.phase,
      scenario: context.scenario,
      prior_responses: context.prior_responses || [],
      themes_so_far: context.themes_so_far || [],
      dominant_narratives: context.dominant_narratives || [],
      gaps_identified: context.gaps_identified || [],
      entity_memory: context.entity_memory?.[entity.entity_id]
    }),
    signal: AbortSignal.timeout(45000)
  })

  if (!response.ok) {
    throw new Error(`Entity simulation failed: ${response.status}`)
  }

  const result = await response.json()

  return {
    entity_id: entity.entity_id,
    entity_name: entity.entity_name,
    round_number: context.round_number,
    response_decision: result.response_decision || 'respond',
    decision_rationale: result.decision_rationale || '',
    position_summary: result.position_summary || '',
    key_claims: result.key_claims || [],
    thought_leadership: result.thought_leadership,
    media_pitch: result.media_pitch,
    social_response: result.social_response,
    entities_referenced: result.entities_referenced || [],
    themes_championed: result.themes_championed || [],
    predicted_reactions: result.predicted_reactions || [],
    processing_time_ms: 0,
    model_used: result.model_used || 'unknown'
  }
}

function createFailedResponse(entity: any, roundNumber: number): any {
  return {
    entity_id: entity.entity_id,
    entity_name: entity.entity_name,
    round_number: roundNumber,
    response_decision: 'silent',
    decision_rationale: 'Entity simulation failed',
    position_summary: '',
    key_claims: [],
    entities_referenced: [],
    themes_championed: [],
    predicted_reactions: [],
    processing_time_ms: 0,
    model_used: 'none'
  }
}

// === Cross-Entity Analysis (algorithmic, no AI) ===

function runCrossEntityAnalysis(
  roundNumber: number,
  currentResponses: any[],
  priorResponses: any[]
): any {
  const themes = extractThemes(currentResponses, priorResponses)
  const { rankings, flows } = calculateInfluence(currentResponses)
  const coalitions = detectCoalitions(currentResponses)
  const gaps = detectGaps(currentResponses)
  const positionChanges = calculatePositionChanges(currentResponses, priorResponses)
  const newThemesCount = themes.filter((t: any) => t.first_appeared === roundNumber).length

  const stabilizationScore = calculateStabilization(
    positionChanges,
    newThemesCount,
    currentResponses.length
  )

  return {
    round_number: roundNumber,
    themes,
    influence_rankings: rankings,
    influence_flows: flows,
    coalitions,
    gaps,
    position_changes: positionChanges,
    new_themes_count: newThemesCount,
    stabilization_score: stabilizationScore
  }
}

function extractThemes(current: any[], prior: any[]): any[] {
  const themeMap = new Map<string, any>()
  const priorThemes = new Set<string>()

  for (const r of prior) {
    for (const theme of (r.themes_championed || [])) {
      priorThemes.add(theme.toLowerCase())
    }
  }

  for (const r of current) {
    for (const theme of (r.themes_championed || [])) {
      const key = theme.toLowerCase()
      if (!themeMap.has(key)) {
        themeMap.set(key, {
          theme,
          momentum: priorThemes.has(key) ? 'stable' : 'rising',
          owner: r.entity_name,
          adopters: [r.entity_name],
          first_appeared: priorThemes.has(key) ? 0 : r.round_number
        })
      } else {
        themeMap.get(key)!.adopters.push(r.entity_name)
        if (themeMap.get(key)!.adopters.length > 2) {
          themeMap.get(key)!.momentum = 'rising'
        }
      }
    }
  }

  for (const pt of priorThemes) {
    if (!themeMap.has(pt)) {
      themeMap.set(pt, { theme: pt, momentum: 'falling', owner: '', adopters: [], first_appeared: 0 })
    }
  }

  return Array.from(themeMap.values())
}

function calculateInfluence(responses: any[]): { rankings: any[], flows: any[] } {
  const scores = new Map<string, { citations: number, framesAdopted: number }>()
  const flows: any[] = []
  const nameToId = new Map<string, string>()

  for (const r of responses) {
    nameToId.set(r.entity_name.toLowerCase(), r.entity_id)
    if (!scores.has(r.entity_id)) scores.set(r.entity_id, { citations: 0, framesAdopted: 0 })
  }

  for (const r of responses) {
    for (const ref of (r.entities_referenced || [])) {
      const resolvedId = scores.has(ref) ? ref : nameToId.get(ref.toLowerCase())
      if (!resolvedId || resolvedId === r.entity_id) continue
      const s = scores.get(resolvedId)
      if (s) s.citations++
      flows.push({ from_entity: resolvedId, to_entity: r.entity_id, type: 'citation', strength: 0.5 })
    }
  }

  const themeOriginators = new Map<string, string>()
  for (const r of responses) {
    for (const theme of (r.themes_championed || [])) {
      const key = theme.toLowerCase()
      if (!themeOriginators.has(key)) {
        themeOriginators.set(key, r.entity_id)
      } else if (themeOriginators.get(key) !== r.entity_id) {
        const s = scores.get(themeOriginators.get(key)!)
        if (s) s.framesAdopted++
      }
    }
  }

  const rankings = responses.map(r => {
    const s = scores.get(r.entity_id) || { citations: 0, framesAdopted: 0 }
    return {
      entity_id: r.entity_id,
      entity_name: r.entity_name,
      score: s.citations * 0.7 + s.framesAdopted * 0.3,
      citations_received: s.citations,
      frames_adopted: s.framesAdopted
    }
  }).sort((a, b) => b.score - a.score)

  return { rankings, flows }
}

function detectCoalitions(responses: any[]): any[] {
  const themeGroups = new Map<string, string[]>()
  for (const r of responses) {
    for (const theme of (r.themes_championed || [])) {
      const key = theme.toLowerCase()
      if (!themeGroups.has(key)) themeGroups.set(key, [])
      themeGroups.get(key)!.push(r.entity_id)
    }
  }

  const coalitions: any[] = []
  let id = 0
  for (const [theme, members] of themeGroups) {
    if (members.length >= 2) {
      coalitions.push({
        coalition_id: `coalition_${id++}`,
        name: `${theme} advocates`,
        members,
        shared_position: theme,
        stability: 'forming',
        formed_round: responses[0]?.round_number || 1
      })
    }
  }
  return coalitions
}

function detectGaps(responses: any[]): any[] {
  const gaps: any[] = []
  const silentEntities = responses.filter(r => r.response_decision === 'silent')
  if (silentEntities.length > responses.length * 0.3) {
    gaps.push({
      gap_id: `gap_0`,
      description: `${silentEntities.length} entities chose to remain silent — opportunity for narrative leadership`,
      strategic_value: 'high',
      related_aspects: [],
      potential_fillers: silentEntities.map((e: any) => e.entity_id)
    })
  }
  return gaps
}

function calculatePositionChanges(current: any[], prior: any[]): number {
  if (prior.length === 0) return current.length
  const priorPositions = new Map(prior.map(r => [r.entity_id, r.position_summary]))
  let changes = 0
  for (const r of current) {
    const prev = priorPositions.get(r.entity_id)
    if (!prev || prev !== r.position_summary) changes++
  }
  return changes
}

function calculateStabilization(positionChanges: number, newThemes: number, totalEntities: number): number {
  if (totalEntities === 0) return 0
  const changeRate = positionChanges / totalEntities
  const themeRate = Math.min(newThemes / 5, 1)
  return Math.max(0, 1 - (changeRate * 0.6 + themeRate * 0.4))
}
