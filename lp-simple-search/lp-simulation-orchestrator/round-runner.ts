/**
 * Round Runner
 *
 * Executes a single simulation round - dispatches all entities in parallel,
 * collects responses, and runs cross-entity analysis.
 *
 * Uses the batch pattern from existing cron jobs for parallel execution.
 */

import type {
  SimulationEntity,
  EntityResponse,
  RoundContext,
  CrossEntityAnalysis,
  ThemeAnalysis,
  InfluenceRanking,
  InfluenceFlow,
  Coalition,
  Gap,
  EntityRoundMemory
} from './types.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const GOOGLE_API_KEY = Deno.env.get('GOOGLE_API_KEY') || Deno.env.get('GEMINI_API_KEY')

interface RoundRunnerConfig {
  parallelBatchSize: number
  entityTimeoutMs: number
}

interface RoundResult {
  roundNumber: number
  responses: EntityResponse[]
  analysis: CrossEntityAnalysis
  duration_ms: number
}

/**
 * Run a single simulation round
 */
export async function runRound(
  roundNumber: number,
  entities: SimulationEntity[],
  context: RoundContext,
  config: RoundRunnerConfig
): Promise<RoundResult> {
  const startTime = Date.now()
  console.log(`🔄 Starting Round ${roundNumber} with ${entities.length} entities`)

  // Filter to included entities only
  const activeEntities = entities.filter(e => e.included)

  // Run entity simulations in parallel batches
  const responses: EntityResponse[] = []

  for (let i = 0; i < activeEntities.length; i += config.parallelBatchSize) {
    const batch = activeEntities.slice(i, i + config.parallelBatchSize)

    const batchPromises = batch.map(entity =>
      runEntitySimulation(entity, context, config.entityTimeoutMs)
    )

    const batchResults = await Promise.allSettled(batchPromises)

    for (let j = 0; j < batchResults.length; j++) {
      const result = batchResults[j]
      const entity = batch[j]

      if (result.status === 'fulfilled' && result.value) {
        responses.push(result.value)
        console.log(`  ✅ ${entity.entity_name}: ${result.value.response_decision}`)
      } else {
        console.warn(`  ⚠️ ${entity.entity_name} failed:`,
          result.status === 'rejected' ? result.reason : 'null response')
        // Create a minimal response for failed entities
        responses.push(createFailedResponse(entity, roundNumber))
      }
    }

    // Small delay between batches to avoid overwhelming APIs
    if (i + config.parallelBatchSize < activeEntities.length) {
      await new Promise(r => setTimeout(r, 500))
    }
  }

  // Track content influence from entity responses (fire-and-forget, non-blocking)
  trackRoundInfluence(roundNumber, responses, context).catch(err =>
    console.warn(`⚠️ Influence tracking failed for Round ${roundNumber}:`, err.message)
  )

  // Run cross-entity analysis
  console.log(`📊 Running cross-entity analysis for Round ${roundNumber}`)
  const analysis = await runCrossEntityAnalysis(
    roundNumber,
    responses,
    context.prior_responses,
    context
  )

  const duration = Date.now() - startTime
  console.log(`✅ Round ${roundNumber} complete in ${duration}ms - stabilization: ${analysis.stabilization_score.toFixed(2)}`)

  return {
    roundNumber,
    responses,
    analysis,
    duration_ms: duration
  }
}

/**
 * Run simulation for a single entity
 */
async function runEntitySimulation(
  entity: SimulationEntity,
  context: RoundContext,
  timeoutMs: number
): Promise<EntityResponse | null> {
  const startTime = Date.now()

  try {
    // Call the entity simulation function
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
        scenario: context.scenario,
        prior_responses: context.prior_responses,
        themes_so_far: context.themes_so_far,
        dominant_narratives: context.dominant_narratives,
        gaps_identified: context.gaps_identified,
        entity_memory: context.entity_memory.get(entity.entity_id)
      }),
      signal: AbortSignal.timeout(timeoutMs)
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
      processing_time_ms: Date.now() - startTime,
      model_used: result.model_used || 'unknown'
    }

  } catch (err: any) {
    console.error(`Entity ${entity.entity_name} simulation error:`, err.message)
    return null
  }
}

/**
 * Create a minimal response for entities that failed to respond
 */
function createFailedResponse(entity: SimulationEntity, roundNumber: number): EntityResponse {
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

/**
 * Run cross-entity analysis after a round completes
 */
async function runCrossEntityAnalysis(
  roundNumber: number,
  currentResponses: EntityResponse[],
  priorResponses: EntityResponse[],
  context: RoundContext
): Promise<CrossEntityAnalysis> {
  // Extract themes
  const themes = extractThemes(currentResponses, priorResponses)

  // Calculate influence
  const { rankings, flows } = calculateInfluence(currentResponses)

  // Detect coalitions
  const coalitions = detectCoalitions(currentResponses)

  // Find gaps
  const gaps = detectGaps(currentResponses, context.scenario)

  // Calculate stabilization metrics
  const positionChanges = calculatePositionChanges(currentResponses, priorResponses)
  const newThemesCount = themes.filter(t => t.first_appeared === roundNumber).length

  // Stabilization score (simple version - enhanced in stabilization-detector.ts)
  const stabilizationScore = calculateSimpleStabilization(
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

/**
 * Extract and track themes from responses
 */
function extractThemes(
  current: EntityResponse[],
  prior: EntityResponse[]
): ThemeAnalysis[] {
  const themeMap = new Map<string, ThemeAnalysis>()

  // Get existing themes from prior round
  const priorThemes = new Set<string>()
  for (const response of prior) {
    for (const theme of response.themes_championed) {
      priorThemes.add(theme.toLowerCase())
    }
  }

  // Process current responses
  for (const response of current) {
    for (const theme of response.themes_championed) {
      const normalizedTheme = theme.toLowerCase()

      if (!themeMap.has(normalizedTheme)) {
        themeMap.set(normalizedTheme, {
          theme,
          momentum: priorThemes.has(normalizedTheme) ? 'stable' : 'rising',
          owner: response.entity_name,
          adopters: [response.entity_name],
          first_appeared: priorThemes.has(normalizedTheme) ? 0 : response.round_number
        })
      } else {
        const existing = themeMap.get(normalizedTheme)!
        existing.adopters.push(response.entity_name)
        // Update momentum based on adopter count
        if (existing.adopters.length > 2) {
          existing.momentum = 'rising'
        }
      }
    }
  }

  // Mark themes that lost traction
  for (const priorTheme of priorThemes) {
    if (!themeMap.has(priorTheme)) {
      // Theme from prior round not mentioned this round
      themeMap.set(priorTheme, {
        theme: priorTheme,
        momentum: 'falling',
        owner: '',
        adopters: [],
        first_appeared: 0
      })
    }
  }

  return Array.from(themeMap.values())
}

/**
 * Calculate influence rankings and flows
 */
function calculateInfluence(
  responses: EntityResponse[]
): { rankings: InfluenceRanking[], flows: InfluenceFlow[] } {
  const influenceScores = new Map<string, { citations: number, framesAdopted: number }>()
  const flows: InfluenceFlow[] = []

  // Build name→entity_id map (AI returns names, not UUIDs, in entities_referenced)
  const nameToId = new Map<string, string>()
  for (const response of responses) {
    nameToId.set(response.entity_name.toLowerCase(), response.entity_id)
    if (!influenceScores.has(response.entity_id)) {
      influenceScores.set(response.entity_id, { citations: 0, framesAdopted: 0 })
    }
  }

  // Count citations — resolve names to IDs before lookup
  for (const response of responses) {
    for (const ref of response.entities_referenced) {
      // Try direct ID match first, then name match
      const resolvedId = influenceScores.has(ref) ? ref : nameToId.get(ref.toLowerCase())
      if (!resolvedId || resolvedId === response.entity_id) continue // skip self-references

      const scores = influenceScores.get(resolvedId)
      if (scores) {
        scores.citations++
      }

      flows.push({
        from_entity: resolvedId,
        to_entity: response.entity_id,
        type: 'citation',
        strength: 0.5
      })
    }
  }

  // Count frames adopted — when entity B champions a theme first introduced by entity A
  const themeOriginators = new Map<string, string>() // theme → first entity_id
  for (const response of responses) {
    for (const theme of response.themes_championed) {
      const key = theme.toLowerCase()
      if (!themeOriginators.has(key)) {
        themeOriginators.set(key, response.entity_id)
      } else if (themeOriginators.get(key) !== response.entity_id) {
        // Someone else originated this theme — credit the originator
        const originatorId = themeOriginators.get(key)!
        const scores = influenceScores.get(originatorId)
        if (scores) scores.framesAdopted++
      }
    }
  }

  // Build rankings
  const rankings: InfluenceRanking[] = []
  for (const response of responses) {
    const scores = influenceScores.get(response.entity_id) || { citations: 0, framesAdopted: 0 }
    rankings.push({
      entity_id: response.entity_id,
      entity_name: response.entity_name,
      score: scores.citations * 0.7 + scores.framesAdopted * 0.3,
      citations_received: scores.citations,
      frames_adopted: scores.framesAdopted
    })
  }

  // Sort by score descending
  rankings.sort((a, b) => b.score - a.score)

  return { rankings, flows }
}

/**
 * Detect coalitions based on position similarity
 */
function detectCoalitions(responses: EntityResponse[]): Coalition[] {
  // Simple coalition detection based on shared themes
  const themeGroups = new Map<string, string[]>()

  for (const response of responses) {
    for (const theme of response.themes_championed) {
      const normalized = theme.toLowerCase()
      if (!themeGroups.has(normalized)) {
        themeGroups.set(normalized, [])
      }
      themeGroups.get(normalized)!.push(response.entity_id)
    }
  }

  // Convert groups with 2+ members into coalitions
  const coalitions: Coalition[] = []
  let coalitionId = 0

  for (const [theme, members] of themeGroups) {
    if (members.length >= 2) {
      coalitions.push({
        coalition_id: `coalition_${coalitionId++}`,
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

/**
 * Detect gaps in the discourse
 */
function detectGaps(responses: EntityResponse[], scenario: any): Gap[] {
  const gaps: Gap[] = []

  // Extract all mentioned topics
  const mentionedTopics = new Set<string>()
  for (const response of responses) {
    for (const claim of response.key_claims) {
      // Simple extraction - could be enhanced with NLP
      const words = claim.toLowerCase().split(/\s+/)
      words.forEach(w => mentionedTopics.add(w))
    }
  }

  // Check scenario aspects that weren't addressed
  const scenarioAspects = scenario?.aspects || []
  for (const aspect of scenarioAspects) {
    const aspectWords = aspect.toLowerCase().split(/\s+/)
    const covered = aspectWords.some(w => mentionedTopics.has(w))

    if (!covered) {
      gaps.push({
        gap_id: `gap_${gaps.length}`,
        description: `No entity addressed: ${aspect}`,
        strategic_value: 'medium',
        related_aspects: [aspect],
        potential_fillers: []
      })
    }
  }

  // Look for obvious gaps (no one mentioned key stakeholders, etc.)
  const silentEntities = responses.filter(r => r.response_decision === 'silent')
  if (silentEntities.length > responses.length * 0.3) {
    gaps.push({
      gap_id: `gap_${gaps.length}`,
      description: `${silentEntities.length} entities chose to remain silent - opportunity for narrative leadership`,
      strategic_value: 'high',
      related_aspects: [],
      potential_fillers: silentEntities.map(e => e.entity_id)
    })
  }

  return gaps
}

/**
 * Count how many entities changed position between rounds
 */
function calculatePositionChanges(
  current: EntityResponse[],
  prior: EntityResponse[]
): number {
  if (prior.length === 0) return current.length

  const priorPositions = new Map(prior.map(r => [r.entity_id, r.position_summary]))
  let changes = 0

  for (const response of current) {
    const priorPos = priorPositions.get(response.entity_id)
    if (!priorPos || priorPos !== response.position_summary) {
      changes++
    }
  }

  return changes
}

/**
 * Simple stabilization score calculation
 */
function calculateSimpleStabilization(
  positionChanges: number,
  newThemes: number,
  totalEntities: number
): number {
  if (totalEntities === 0) return 0

  const changeRate = positionChanges / totalEntities
  const themeRate = Math.min(newThemes / 5, 1) // Cap at 5 new themes

  // Lower change/theme rates = higher stability
  return Math.max(0, 1 - (changeRate * 0.6 + themeRate * 0.4))
}

/**
 * Build entity memory from all prior rounds
 */
export function buildEntityMemory(
  entityId: string,
  allResponses: EntityResponse[]
): EntityRoundMemory {
  const entityResponses = allResponses.filter(r => r.entity_id === entityId)

  // Find this entity's name for reference matching
  const entityName = entityResponses[0]?.entity_name || ''

  // Helper: check if an entities_referenced array references a given entity
  // AI returns names not UUIDs, so match on both
  const referencesEntity = (refs: string[], targetId: string, targetName: string): boolean => {
    return refs.some(ref =>
      ref === targetId || ref.toLowerCase() === targetName.toLowerCase()
    )
  }

  const positions = entityResponses.map(r => ({
    round: r.round_number,
    position: r.position_summary
  }))

  const allReferenced = new Set<string>()
  const allThemes = new Set<string>()
  const attacks: Array<{ from: string, round: number, attack: string }> = []

  for (const response of entityResponses) {
    response.entities_referenced.forEach(e => allReferenced.add(e))
    response.themes_championed.forEach(t => allThemes.add(t))
  }

  // Find attacks from other entities
  for (const response of allResponses) {
    if (response.entity_id !== entityId &&
        response.response_decision === 'counter' &&
        referencesEntity(response.entities_referenced, entityId, entityName)) {
      attacks.push({
        from: response.entity_name || response.entity_id,
        round: response.round_number,
        attack: response.position_summary
      })
    }
  }

  // Calculate credibility trajectory
  let trajectory: 'rising' | 'stable' | 'falling' = 'stable'
  if (entityResponses.length >= 2) {
    const recentCitations = allResponses
      .filter(r => r.round_number === entityResponses[entityResponses.length - 1].round_number)
      .filter(r => referencesEntity(r.entities_referenced, entityId, entityName))
      .length

    const priorCitations = allResponses
      .filter(r => r.round_number === entityResponses[entityResponses.length - 2]?.round_number)
      .filter(r => referencesEntity(r.entities_referenced, entityId, entityName))
      .length

    if (recentCitations > priorCitations + 1) trajectory = 'rising'
    else if (recentCitations < priorCitations - 1) trajectory = 'falling'
  }

  return {
    entity_id: entityId,
    positions_taken: positions,
    entities_referenced: Array.from(allReferenced),
    themes_championed: Array.from(allThemes),
    attacks_received: attacks,
    credibility_trajectory: trajectory
  }
}

/**
 * Track content influence from entity responses
 * Calls the simulation-influence-tracker for each entity that responded
 * Fire-and-forget pattern - doesn't block simulation progress
 */
async function trackRoundInfluence(
  roundNumber: number,
  responses: EntityResponse[],
  context: RoundContext
): Promise<void> {
  // Only track responses that actually responded (not silent/failed)
  const activeResponses = responses.filter(r =>
    r.response_decision !== 'silent' &&
    r.response_decision !== 'wait' &&
    r.position_summary.length > 0
  )

  if (activeResponses.length === 0) {
    console.log(`📊 Round ${roundNumber}: No active responses to track for influence`)
    return
  }

  console.log(`📊 Tracking content influence for ${activeResponses.length} responses in Round ${roundNumber}`)

  // Build entity response text for each response (combine all text fields)
  const trackingPromises = activeResponses.map(async (response) => {
    const entityResponseText = [
      response.position_summary,
      response.thought_leadership || '',
      response.media_pitch || '',
      response.social_response || '',
      ...response.key_claims
    ].filter(Boolean).join('\n\n')

    try {
      const trackResponse = await fetch(`${SUPABASE_URL}/functions/v1/simulation-influence-tracker`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
        },
        body: JSON.stringify({
          simulation_id: context.simulation_id,
          simulation_round: roundNumber,
          simulated_entity: response.entity_name,
          simulated_entity_type: 'organization', // Could be enhanced with entity type from profile
          entity_response: entityResponseText,
          scenario_type: context.scenario?.type || 'general',
          scenario_description: context.scenario?.description || context.scenario?.title || '',
          detect_influences: true
        }),
        signal: AbortSignal.timeout(30000) // 30s timeout for influence detection
      })

      if (trackResponse.ok) {
        const result = await trackResponse.json()
        if (result.influences_recorded > 0) {
          console.log(`  📈 ${response.entity_name}: ${result.influences_recorded} influence(s) detected`)
        }
      }
    } catch (err: any) {
      console.warn(`  ⚠️ Influence tracking failed for ${response.entity_name}:`, err.message)
    }
  })

  // Run all tracking in parallel but don't wait for completion
  await Promise.allSettled(trackingPromises)
}
