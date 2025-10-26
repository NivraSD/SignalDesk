// Campaign Outcome Record
// Purpose: Record campaign outcome in semantic memory after completion
// Trigger: Called when campaign is marked complete or after tracking period ends

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!

interface OutcomeRequest {
  campaignId?: string
  strategyId?: string
  contentId?: string
  organizationId: string
}

serve(async (req) => {
  try {
    const {
      campaignId,
      strategyId,
      contentId,
      organizationId
    }: OutcomeRequest = await req.json()

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    console.log('📝 Recording campaign outcome...')
    console.log(`   Organization: ${organizationId}`)
    if (campaignId) console.log(`   Campaign: ${campaignId}`)
    if (strategyId) console.log(`   Strategy: ${strategyId}`)
    if (contentId) console.log(`   Content: ${contentId}`)

    // 1. Get campaign performance
    console.log('   Fetching performance data...')
    const performance = await getCampaignPerformance(
      supabase,
      organizationId,
      campaignId,
      contentId
    )

    console.log(`   Coverage: ${performance.total_coverage}`)
    console.log(`   Reach: ${performance.total_reach.toLocaleString()}`)

    // 2. Get original strategy if available
    let strategy = null
    if (strategyId) {
      const { data } = await supabase
        .from('content_library')
        .select('*')
        .eq('id', strategyId)
        .maybeSingle()

      strategy = data
    }

    // 3. Extract learnings using AI
    console.log('   Extracting learnings...')
    const learnings = await extractLearnings(performance, strategy)
    console.log(`   Extracted ${learnings.length} learnings`)

    // 4. Determine outcome type
    const outcomeType = determineOutcomeType(performance)
    const effectivenessScore = calculateEffectiveness(performance)

    console.log(`   Outcome type: ${outcomeType}`)
    console.log(`   Effectiveness: ${effectivenessScore.toFixed(2)}/5.0`)

    // 5. Record outcome
    const { data: outcome, error: outcomeError } = await supabase
      .from('strategy_outcomes')
      .insert({
        strategy_id: strategyId || contentId || campaignId,
        organization_id: organizationId,
        outcome_type: outcomeType,
        effectiveness_score: effectivenessScore,
        key_learnings: learnings,
        success_factors: {
          coverage_count: performance.total_coverage,
          reach: performance.total_reach,
          avg_confidence: performance.avg_confidence,
          top_outlets: performance.top_outlets,
          sentiment_positive_rate: performance.sentiment_breakdown.positive /
            (performance.total_coverage || 1)
        },
        failure_factors: identifyFailureFactors(performance),
        total_coverage: performance.total_coverage,
        total_reach: performance.total_reach,
        avg_confidence: performance.avg_confidence
      })
      .select()
      .single()

    if (outcomeError) {
      console.error('Error recording outcome:', outcomeError)
      throw outcomeError
    }

    console.log('✅ Outcome recorded:', outcome.id)

    // 6. Update semantic memory salience if strategy has embeddings
    if (strategyId && outcomeType === 'success') {
      console.log('   Boosting strategy salience...')
      const { error: salienceError } = await supabase.rpc('execute_sql', {
        sql: `
          UPDATE strategy_embeddings
          SET salience = LEAST(salience * 1.5, 1.0),
              access_count = access_count + 1,
              last_accessed_at = NOW()
          WHERE strategy_id = '${strategyId}'
        `
      })

      // If RPC not available, try direct update
      if (salienceError) {
        await supabase
          .from('strategy_embeddings')
          .update({
            last_accessed_at: new Date().toISOString(),
            access_count: supabase.sql`access_count + 1`
          })
          .eq('strategy_id', strategyId)
      }
    }

    // 7. Create waypoints to similar successful campaigns
    if (strategyId && outcomeType === 'success') {
      console.log('   Creating success waypoints...')
      await createSuccessWaypoints(supabase, strategyId, organizationId, effectivenessScore)
    }

    return new Response(
      JSON.stringify({
        success: true,
        outcome,
        outcomeType,
        effectivenessScore,
        learnings
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('❌ Error in campaign-outcome-record:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Outcome recording failed'
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})

async function getCampaignPerformance(
  supabase: any,
  organizationId: string,
  campaignId?: string,
  contentId?: string
) {
  let query = supabase
    .from('campaign_attributions')
    .select('*')
    .eq('organization_id', organizationId)

  if (campaignId) {
    query = query.eq('campaign_id', campaignId)
  }

  const { data: attributions } = await query

  // Filter by content_id if provided
  let filteredAttributions = attributions || []
  if (contentId && attributions) {
    const { data: fingerprints } = await supabase
      .from('campaign_fingerprints')
      .select('id')
      .eq('content_id', contentId)

    const fingerprintIds = fingerprints?.map(f => f.id) || []
    filteredAttributions = attributions.filter(a =>
      fingerprintIds.includes(a.fingerprint_id)
    )
  }

  return {
    total_coverage: filteredAttributions?.length || 0,
    total_reach: filteredAttributions?.reduce((sum: number, a: any) =>
      sum + (a.estimated_reach || 0), 0) || 0,
    avg_confidence: filteredAttributions?.length
      ? filteredAttributions.reduce((sum: number, a: any) =>
          sum + a.confidence_score, 0) / filteredAttributions.length
      : 0,
    sentiment_breakdown: {
      positive: filteredAttributions?.filter((a: any) => a.sentiment === 'positive').length || 0,
      neutral: filteredAttributions?.filter((a: any) => a.sentiment === 'neutral').length || 0,
      negative: filteredAttributions?.filter((a: any) => a.sentiment === 'negative').length || 0
    },
    top_outlets: getTopOutlets(filteredAttributions || [])
  }
}

function getTopOutlets(attributions: any[]) {
  const outlets = attributions
    .filter(a => a.source_outlet)
    .reduce((acc: any, a) => {
      acc[a.source_outlet] = (acc[a.source_outlet] || 0) + 1
      return acc
    }, {})

  return Object.entries(outlets)
    .map(([outlet, count]) => ({ outlet, count }))
    .sort((a: any, b: any) => b.count - a.count)
    .slice(0, 5)
}

function determineOutcomeType(performance: any): string {
  if (performance.total_coverage >= 10 && performance.avg_confidence > 0.8) {
    return 'success'
  } else if (performance.total_coverage >= 5) {
    return 'partial'
  } else if (performance.total_coverage >= 1) {
    return 'minimal'
  } else {
    return 'failed'
  }
}

function calculateEffectiveness(performance: any): number {
  let score = 0

  // Coverage component (0-2 points)
  score += Math.min(performance.total_coverage / 10, 1) * 2

  // Reach component (0-2 points)
  score += Math.min(performance.total_reach / 1000000, 1) * 2

  // Confidence component (0-1 point)
  score += performance.avg_confidence

  return Math.min(score, 5)
}

function identifyFailureFactors(performance: any): any {
  const factors: any = {}

  if (performance.total_coverage < 3) {
    factors.low_coverage = true
  }

  if (performance.avg_confidence < 0.7) {
    factors.low_confidence_matches = true
  }

  if (performance.sentiment_breakdown.negative > performance.sentiment_breakdown.positive) {
    factors.negative_sentiment = true
  }

  return factors
}

async function extractLearnings(performance: any, strategy: any): Promise<string[]> {
  const prompt = `Analyze this campaign outcome and extract 3-5 key learnings.

PERFORMANCE:
- Coverage: ${performance.total_coverage} articles/mentions
- Reach: ${performance.total_reach.toLocaleString()}
- Avg Confidence: ${(performance.avg_confidence * 100).toFixed(0)}%
- Sentiment: ${performance.sentiment_breakdown.positive} positive, ${performance.sentiment_breakdown.negative} negative
- Top outlets: ${performance.top_outlets.map((o: any) => o.outlet).join(', ')}

${strategy ? `STRATEGY APPROACH: ${JSON.stringify(strategy.metadata)}` : ''}

Extract key learnings as brief, actionable insights (1 sentence each).
What worked? What didn't? What should we do differently next time?

Return as JSON: {"learnings": ["learning1", "learning2", ...]}`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 400,
      messages: [{ role: 'user', content: prompt }]
    })
  })

  const data = await response.json()
  const text = data.content[0].text

  try {
    const result = JSON.parse(text)
    return result.learnings || []
  } catch (e) {
    console.error('Failed to parse learnings:', e)
    return ['Campaign completed with measurable results']
  }
}

async function createSuccessWaypoints(
  supabase: any,
  strategyId: string,
  organizationId: string,
  effectivenessScore: number
) {
  // Find other successful strategies
  const { data: successfulStrategies } = await supabase
    .from('strategy_outcomes')
    .select('strategy_id, effectiveness_score')
    .eq('organization_id', organizationId)
    .eq('outcome_type', 'success')
    .neq('strategy_id', strategyId)
    .gte('effectiveness_score', 3.5)
    .order('effectiveness_score', { ascending: false })
    .limit(5)

  if (!successfulStrategies || successfulStrategies.length === 0) {
    console.log('   No other successful strategies found')
    return
  }

  // Create waypoint links
  const waypoints = successfulStrategies.map((s: any) => ({
    organization_id: organizationId,
    from_strategy_id: strategyId,
    to_strategy_id: s.strategy_id,
    weight: s.effectiveness_score / 5, // Normalize to 0-1
    link_type: 'successful_pattern'
  }))

  const { error } = await supabase
    .from('strategy_waypoints')
    .insert(waypoints)

  if (error) {
    console.error('Error creating waypoints:', error)
  } else {
    console.log(`   Created ${waypoints.length} success waypoints`)
  }
}
