// Memory Vault V2: Composite Retrieval Scoring
// Purpose: Multi-factor ranking for intelligent content retrieval
// Based on OpenMemory's composite scoring approach
//
// Formula: score = 0.4 × similarity + 0.2 × salience + 0.1 × recency + 0.1 × relationship + 0.2 × execution_success

export interface ContentItem {
  id: string
  title: string
  content: any
  content_type: string
  created_at: string
  updated_at?: string
  salience_score?: number
  last_accessed_at?: string
  access_count?: number
  executed?: boolean
  feedback?: string | number
  themes?: string[]
  topics?: string[]
  entities?: any
  content_signature?: string
  metadata?: any
}

export interface ScoredContent extends ContentItem {
  composite_score: number
  score_breakdown: {
    similarity: number
    salience: number
    recency: number
    relationship: number
    execution_success: number
  }
  retrieval_reason: string
  confidence: number
}

export interface ScoringOptions {
  query?: string
  queryKeywords?: string[]
  relatedContentIds?: string[]
  contentRelationships?: Map<string, number> // contentId -> relationship strength
  weights?: {
    similarity?: number
    salience?: number
    recency?: number
    relationship?: number
    execution_success?: number
  }
}

/**
 * Calculate composite retrieval score for content items
 * Uses multi-factor ranking: similarity, salience, recency, relationships, execution success
 */
export function scoreContentItems(
  items: ContentItem[],
  options: ScoringOptions = {}
): ScoredContent[] {
  const {
    query,
    queryKeywords = [],
    relatedContentIds = [],
    contentRelationships = new Map(),
    weights = {}
  } = options

  // Default weights (inspired by OpenMemory)
  const w = {
    similarity: weights.similarity ?? 0.4,
    salience: weights.salience ?? 0.2,
    recency: weights.recency ?? 0.1,
    relationship: weights.relationship ?? 0.1,
    execution_success: weights.execution_success ?? 0.2
  }

  const scoredItems = items.map(item => {
    // 1. Calculate similarity score (0.0 - 1.0)
    const similarity = calculateSimilarity(item, query, queryKeywords)

    // 2. Get salience score (0.0 - 1.0)
    const salience = item.salience_score ?? 1.0

    // 3. Calculate recency score (0.0 - 1.0)
    const recency = calculateRecency(item.created_at, item.last_accessed_at)

    // 4. Calculate relationship strength (0.0 - 1.0)
    const relationship = calculateRelationshipStrength(
      item.id,
      relatedContentIds,
      contentRelationships
    )

    // 5. Calculate execution success score (0.0 - 1.0)
    const execution_success = calculateExecutionSuccess(item)

    // Composite score
    const composite_score =
      w.similarity * similarity +
      w.salience * salience +
      w.recency * recency +
      w.relationship * relationship +
      w.execution_success * execution_success

    // Generate retrieval reason
    const retrieval_reason = generateRetrievalReason({
      similarity,
      salience,
      recency,
      relationship,
      execution_success,
      item,
      query,
      queryKeywords
    })

    // Calculate confidence (how strong is this match?)
    const confidence = calculateConfidence({
      similarity,
      salience,
      execution_success
    })

    return {
      ...item,
      composite_score,
      score_breakdown: {
        similarity,
        salience,
        recency,
        relationship,
        execution_success
      },
      retrieval_reason,
      confidence
    }
  })

  // Sort by composite score (descending)
  return scoredItems.sort((a, b) => b.composite_score - a.composite_score)
}

/**
 * Calculate similarity between content and query
 * Uses keyword overlap, theme matching, and content signature similarity
 */
function calculateSimilarity(
  item: ContentItem,
  query?: string,
  queryKeywords: string[] = []
): number {
  if (!query && queryKeywords.length === 0) {
    return 0.5 // Neutral score if no query
  }

  let score = 0
  let factors = 0

  // Factor 1: Keyword overlap
  if (queryKeywords.length > 0) {
    const itemKeywords = [
      ...(item.themes || []),
      ...(item.topics || []),
      item.content_type,
      ...(Array.isArray(item.metadata?.tags) ? item.metadata.tags : [])
    ].map(k => k.toLowerCase())

    const matches = queryKeywords.filter(qk =>
      itemKeywords.some(ik => ik.includes(qk.toLowerCase()) || qk.toLowerCase().includes(ik))
    )

    score += matches.length / queryKeywords.length
    factors++
  }

  // Factor 2: Title/content text similarity
  if (query) {
    const queryLower = query.toLowerCase()
    const titleMatch = item.title?.toLowerCase().includes(queryLower) ? 1 : 0
    const contentStr = typeof item.content === 'string' ? item.content : JSON.stringify(item.content)
    const contentMatch = contentStr.toLowerCase().includes(queryLower) ? 0.5 : 0

    score += Math.max(titleMatch, contentMatch)
    factors++
  }

  // Factor 3: Content signature similarity (if available)
  if (item.content_signature && query) {
    const signatureMatch = item.content_signature.toLowerCase().includes(query.toLowerCase()) ? 0.8 : 0
    score += signatureMatch
    factors++
  }

  return factors > 0 ? score / factors : 0.5
}

/**
 * Calculate recency score
 * More recent content scores higher
 * Also considers last_accessed_at (recently used content is more relevant)
 */
function calculateRecency(
  created_at: string,
  last_accessed_at?: string
): number {
  const now = Date.now()

  // Use last accessed time if available, otherwise created time
  const referenceTime = last_accessed_at || created_at
  const referenceDate = new Date(referenceTime).getTime()

  const daysAgo = (now - referenceDate) / (1000 * 60 * 60 * 24)

  // Decay curve: 1.0 for today, 0.5 for 30 days ago, 0.1 for 365 days ago
  // Formula: e^(-days / 90)
  const recencyScore = Math.exp(-daysAgo / 90)

  return Math.max(0.1, Math.min(1.0, recencyScore))
}

/**
 * Calculate relationship strength
 * Higher if content is related to query context
 */
function calculateRelationshipStrength(
  contentId: string,
  relatedContentIds: string[],
  contentRelationships: Map<string, number>
): number {
  // Check if this content is in the related set
  if (relatedContentIds.includes(contentId)) {
    return 1.0
  }

  // Check relationship map for connection strength
  const relationshipStrength = contentRelationships.get(contentId)
  if (relationshipStrength !== undefined) {
    return relationshipStrength
  }

  return 0.0
}

/**
 * Calculate execution success score
 * Higher if content has been successfully executed
 */
function calculateExecutionSuccess(item: ContentItem): number {
  if (!item.executed) {
    return 0.0 // Not executed
  }

  // Check feedback
  if (typeof item.feedback === 'number') {
    // Numeric feedback (e.g., 1-5 rating)
    return Math.min(1.0, item.feedback / 5)
  }

  if (typeof item.feedback === 'string') {
    // Text feedback - check for positive indicators
    const feedbackLower = item.feedback.toLowerCase()
    const positiveWords = ['success', 'great', 'excellent', 'worked', 'effective', 'good']
    const negativeWords = ['failed', 'poor', 'ineffective', 'bad', 'didn\'t work']

    const hasPositive = positiveWords.some(word => feedbackLower.includes(word))
    const hasNegative = negativeWords.some(word => feedbackLower.includes(word))

    if (hasPositive && !hasNegative) return 0.9
    if (hasNegative) return 0.3
  }

  // Executed but no feedback
  return 0.5
}

/**
 * Generate human-readable retrieval reason
 * Explains WHY this content was retrieved
 */
function generateRetrievalReason(params: {
  similarity: number
  salience: number
  recency: number
  relationship: number
  execution_success: number
  item: ContentItem
  query?: string
  queryKeywords?: string[]
}): string {
  const { similarity, salience, recency, relationship, execution_success, item, query, queryKeywords } = params

  const reasons: string[] = []

  // Primary reason (highest score)
  if (similarity > 0.7) {
    const matchedKeywords = queryKeywords?.filter(qk =>
      item.themes?.some(t => t.toLowerCase().includes(qk.toLowerCase())) ||
      item.topics?.some(t => t.toLowerCase().includes(qk.toLowerCase()))
    ) || []

    if (matchedKeywords.length > 0) {
      reasons.push(`Strong match on keywords: ${matchedKeywords.slice(0, 3).join(', ')}`)
    } else if (query) {
      reasons.push(`High relevance to query "${query.slice(0, 50)}${query.length > 50 ? '...' : ''}"`)
    }
  }

  // Secondary reasons
  if (execution_success > 0.7) {
    reasons.push('Proven successful in previous executions')
  }

  if (salience > 0.8) {
    reasons.push('Highly relevant and recently accessed')
  } else if (salience < 0.3) {
    reasons.push('Note: Content may be outdated or less relevant')
  }

  if (recency > 0.8) {
    reasons.push('Recently created or accessed')
  }

  if (relationship > 0.7) {
    reasons.push('Closely related to referenced content')
  }

  // Content type info
  if (item.content_type) {
    reasons.push(`Type: ${item.content_type}`)
  }

  return reasons.length > 0 ? reasons.join(' • ') : 'General match'
}

/**
 * Calculate confidence score
 * How confident are we in this match?
 */
function calculateConfidence(params: {
  similarity: number
  salience: number
  execution_success: number
}): number {
  const { similarity, salience, execution_success } = params

  // High confidence if:
  // - Strong similarity AND good salience
  // - OR proven execution success
  if (similarity > 0.8 && salience > 0.7) return 0.95
  if (execution_success > 0.8) return 0.9
  if (similarity > 0.7) return 0.85
  if (similarity > 0.5 && salience > 0.5) return 0.75
  if (similarity > 0.3) return 0.6

  return 0.5
}

/**
 * Filter content by minimum composite score
 */
export function filterByMinScore(
  scoredItems: ScoredContent[],
  minScore: number = 0.3
): ScoredContent[] {
  return scoredItems.filter(item => item.composite_score >= minScore)
}

/**
 * Get top N results
 */
export function getTopResults(
  scoredItems: ScoredContent[],
  limit: number = 10
): ScoredContent[] {
  return scoredItems.slice(0, limit)
}
