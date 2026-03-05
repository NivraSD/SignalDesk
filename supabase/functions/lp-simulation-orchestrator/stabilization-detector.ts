/**
 * Stabilization Detector
 *
 * Determines when a simulation has "settled" - when entity positions
 * stop changing significantly between rounds.
 *
 * Stabilization triggers:
 * - < 20% of entities change position between rounds
 * - No new themes emerge for 2 consecutive rounds
 * - Coalition membership stops shifting
 * - Dominant narrative reaches > 60% entity adoption
 */

import type {
  EntityResponse,
  CrossEntityAnalysis,
  ThemeAnalysis,
  Coalition
} from './types.ts'

interface StabilizationInput {
  currentRound: number
  currentResponses: EntityResponse[]
  priorResponses: EntityResponse[]
  currentAnalysis: CrossEntityAnalysis
  priorAnalysis?: CrossEntityAnalysis
  threshold: number
}

interface StabilizationResult {
  score: number                  // 0-1, higher = more stable
  isStabilized: boolean
  reasons: string[]
  metrics: {
    positionChangeRate: number
    newThemeRate: number
    coalitionStability: number
    narrativeDominance: number
  }
}

export function detectStabilization(input: StabilizationInput): StabilizationResult {
  const {
    currentRound,
    currentResponses,
    priorResponses,
    currentAnalysis,
    priorAnalysis,
    threshold
  } = input

  // Can't stabilize on round 1
  if (currentRound === 1 || !priorAnalysis) {
    return {
      score: 0,
      isStabilized: false,
      reasons: ['First round - no comparison possible'],
      metrics: {
        positionChangeRate: 1,
        newThemeRate: 1,
        coalitionStability: 0,
        narrativeDominance: 0
      }
    }
  }

  const metrics = {
    positionChangeRate: calculatePositionChangeRate(currentResponses, priorResponses),
    newThemeRate: calculateNewThemeRate(currentAnalysis.themes, priorAnalysis.themes),
    coalitionStability: calculateCoalitionStability(currentAnalysis.coalitions, priorAnalysis.coalitions),
    narrativeDominance: calculateNarrativeDominance(currentAnalysis.themes, currentResponses.length)
  }

  // Weighted score (invert change rates since lower = more stable)
  const score =
    (1 - metrics.positionChangeRate) * 0.35 +     // 35% weight
    (1 - metrics.newThemeRate) * 0.20 +           // 20% weight
    metrics.coalitionStability * 0.25 +            // 25% weight
    metrics.narrativeDominance * 0.20              // 20% weight

  const reasons: string[] = []

  if (metrics.positionChangeRate < 0.2) {
    reasons.push(`Only ${Math.round(metrics.positionChangeRate * 100)}% of entities changed position`)
  }
  if (metrics.newThemeRate < 0.1) {
    reasons.push('No significant new themes emerged')
  }
  if (metrics.coalitionStability > 0.8) {
    reasons.push('Coalition membership is stable')
  }
  if (metrics.narrativeDominance > 0.6) {
    reasons.push(`Dominant narrative adopted by ${Math.round(metrics.narrativeDominance * 100)}% of entities`)
  }

  return {
    score,
    isStabilized: score >= threshold,
    reasons,
    metrics
  }
}

/**
 * Calculate what percentage of entities changed their position
 */
function calculatePositionChangeRate(
  current: EntityResponse[],
  prior: EntityResponse[]
): number {
  if (current.length === 0) return 0

  const priorPositions = new Map(
    prior.map(r => [r.entity_id, r.position_summary])
  )

  let changedCount = 0
  for (const response of current) {
    const priorPosition = priorPositions.get(response.entity_id)
    if (!priorPosition) {
      // New entity = change
      changedCount++
    } else if (positionsAreDifferent(response.position_summary, priorPosition)) {
      changedCount++
    }
  }

  return changedCount / current.length
}

/**
 * Simple position comparison - could be enhanced with embeddings
 */
function positionsAreDifferent(pos1: string, pos2: string): boolean {
  // Normalize and compare
  const norm1 = pos1.toLowerCase().trim()
  const norm2 = pos2.toLowerCase().trim()

  // If identical, not different
  if (norm1 === norm2) return false

  // Simple word overlap check - if >70% overlap, consider same
  const words1 = new Set(norm1.split(/\s+/).filter(w => w.length > 3))
  const words2 = new Set(norm2.split(/\s+/).filter(w => w.length > 3))

  if (words1.size === 0 || words2.size === 0) return true

  const intersection = [...words1].filter(w => words2.has(w))
  const overlap = intersection.length / Math.min(words1.size, words2.size)

  return overlap < 0.7
}

/**
 * Calculate rate of new themes appearing
 */
function calculateNewThemeRate(
  current: ThemeAnalysis[],
  prior: ThemeAnalysis[]
): number {
  if (current.length === 0) return 0

  const priorThemes = new Set(prior.map(t => t.theme.toLowerCase()))
  const newThemes = current.filter(t => !priorThemes.has(t.theme.toLowerCase()))

  return newThemes.length / current.length
}

/**
 * Calculate how stable coalitions are between rounds
 */
function calculateCoalitionStability(
  current: Coalition[],
  prior: Coalition[]
): number {
  if (current.length === 0 && prior.length === 0) return 1
  if (current.length === 0 || prior.length === 0) return 0

  // Match coalitions by member overlap
  let totalStability = 0
  let matchedCount = 0

  for (const currCoalition of current) {
    const currMembers = new Set(currCoalition.members)

    // Find best matching prior coalition
    let bestOverlap = 0
    for (const priorCoalition of prior) {
      const priorMembers = new Set(priorCoalition.members)
      const intersection = [...currMembers].filter(m => priorMembers.has(m))
      const union = new Set([...currMembers, ...priorMembers])
      const jaccard = intersection.length / union.size
      bestOverlap = Math.max(bestOverlap, jaccard)
    }

    if (bestOverlap > 0.3) {
      // Found a matching coalition
      totalStability += bestOverlap
      matchedCount++
    }
  }

  if (matchedCount === 0) return 0
  return totalStability / matchedCount
}

/**
 * Calculate how dominant the leading narrative is
 */
function calculateNarrativeDominance(
  themes: ThemeAnalysis[],
  totalEntities: number
): number {
  if (themes.length === 0 || totalEntities === 0) return 0

  // Find theme with most adopters
  let maxAdopters = 0
  for (const theme of themes) {
    if (theme.adopters.length > maxAdopters) {
      maxAdopters = theme.adopters.length
    }
  }

  return maxAdopters / totalEntities
}

/**
 * Aggregate analysis across multiple rounds to detect longer-term patterns
 */
export function detectLongTermStabilization(
  analyses: CrossEntityAnalysis[],
  minConsecutiveStableRounds: number = 2
): boolean {
  if (analyses.length < minConsecutiveStableRounds) return false

  // Check if last N rounds have had low change
  const recentAnalyses = analyses.slice(-minConsecutiveStableRounds)

  for (let i = 1; i < recentAnalyses.length; i++) {
    const curr = recentAnalyses[i]
    const prev = recentAnalyses[i - 1]

    // If position changes > 20% or new themes > 10%, not stable
    if (curr.position_changes > 0.2 * prev.position_changes) return false
    if (curr.new_themes_count > 0) return false
  }

  return true
}
