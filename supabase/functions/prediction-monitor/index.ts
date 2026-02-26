import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') || Deno.env.get('CLAUDE_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🔍 Prediction Monitor - Starting automated check...')

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    // Get predictions that need checking
    const now = new Date()
    const { data: predictions, error: fetchError } = await supabase
      .from('predictions')
      .select(`
        *,
        prediction_monitoring (*)
      `)
      .eq('status', 'active')
      .or(`prediction_monitoring.next_check_at.lte.${now.toISOString()},prediction_monitoring.is.null`)
      .limit(50)

    if (fetchError) {
      console.error('Error fetching predictions:', fetchError)
      throw fetchError
    }

    console.log(`📊 Found ${predictions?.length || 0} predictions to check`)

    let checkedCount = 0
    let validatedCount = 0
    let expiredCount = 0

    for (const prediction of predictions || []) {
      const result = await checkPrediction(prediction, supabase)
      checkedCount++

      if (result.status === 'validated') validatedCount++
      if (result.status === 'expired') expiredCount++

      console.log(`   ${result.status === 'validated' ? '✅' : result.status === 'expired' ? '⏰' : '👀'} ${prediction.title.substring(0, 60)}...`)
    }

    console.log(`✅ Monitor complete: ${checkedCount} checked, ${validatedCount} validated, ${expiredCount} expired`)

    return new Response(JSON.stringify({
      success: true,
      checked: checkedCount,
      validated: validatedCount,
      expired: expiredCount
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('❌ Monitor error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

/**
 * Check a single prediction for outcomes
 */
async function checkPrediction(prediction: any, supabase: any) {
  // Calculate deadline
  const deadline = calculateDeadline(prediction)
  const now = new Date()

  // Check if deadline has passed
  if (now > deadline) {
    return await expirePrediction(prediction, supabase)
  }

  // Search for evidence of outcome in recent intelligence
  const evidence = await searchForOutcome(prediction, supabase)

  if (evidence.found && evidence.confidence >= 70) {
    // Outcome detected! Validate the prediction
    return await validatePrediction(prediction, evidence, supabase)
  } else {
    // No outcome yet, update monitoring status
    return await updateMonitoring(prediction, evidence, supabase)
  }
}

/**
 * Search for evidence that prediction came true
 */
async function searchForOutcome(prediction: any, supabase: any) {
  // Get recent intelligence since prediction was created
  const { data: recentEvents } = await supabase
    .from('content_library')
    .select('id, title, content, published_at, url')
    .eq('organization_id', prediction.organization_id)
    .gte('published_at', prediction.created_at)
    .order('published_at', { ascending: false })
    .limit(20)

  if (!recentEvents || recentEvents.length === 0) {
    return {
      found: false,
      confidence: 0,
      evidence: [],
      summary: 'No recent intelligence found'
    }
  }

  // Use AI to determine if any events match the prediction
  const matchResult = await analyzeOutcomeMatch(prediction, recentEvents)

  // Count supporting signals
  const supportingSignals = recentEvents.filter(event =>
    matchesKeyTerms(event, extractKeyTerms(prediction.title))
  ).length

  return {
    found: matchResult.matches,
    confidence: matchResult.confidence,
    evidence: matchResult.evidence,
    summary: matchResult.summary,
    supporting_signals: supportingSignals
  }
}

/**
 * Use AI to analyze if events match the prediction
 */
async function analyzeOutcomeMatch(prediction: any, events: any[]) {
  if (!ANTHROPIC_API_KEY) {
    // Fallback to simple keyword matching if no AI available
    return simpleOutcomeMatch(prediction, events)
  }

  const prompt = `You are validating whether a prediction came true.

PREDICTION:
Title: ${prediction.title}
Description: ${prediction.description}
Created: ${prediction.created_at}
Expected timeframe: ${prediction.time_horizon}

RECENT INTELLIGENCE EVENTS:
${events.map((e, i) => `${i + 1}. [${e.published_at}] ${e.title}`).join('\n')}

TASK:
Determine if any of these events represent the prediction coming true.

Consider:
- Does the event describe the same outcome as predicted?
- Is the timing within the expected timeframe?
- Are the key entities/stakeholders the same?

Return ONLY a JSON object:
{
  "matches": true/false,
  "confidence": 0-100,
  "evidence": ["List of event titles that match"],
  "summary": "Brief explanation of what happened or why it doesn't match"
}`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1000,
        temperature: 0.3,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    })

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`)
    }

    const data = await response.json()
    const text = data.content[0].text

    // Parse JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
  } catch (error) {
    console.error('AI analysis error:', error)
  }

  // Fallback to simple matching
  return simpleOutcomeMatch(prediction, events)
}

/**
 * Simple keyword-based outcome matching (fallback)
 */
function simpleOutcomeMatch(prediction: any, events: any[]) {
  const keywords = extractKeyTerms(prediction.title)
  const matches = events.filter(event =>
    matchesKeyTerms(event, keywords)
  )

  const confidence = matches.length > 0 ? Math.min(matches.length * 30, 100) : 0

  return {
    matches: confidence >= 60,
    confidence,
    evidence: matches.map(e => e.title),
    summary: matches.length > 0
      ? `Found ${matches.length} related events`
      : 'No matching events found'
  }
}

/**
 * Validate prediction (outcome occurred)
 */
async function validatePrediction(prediction: any, evidence: any, supabase: any) {
  console.log(`   ✅ Validating: ${prediction.title}`)

  // Update prediction status
  await supabase
    .from('predictions')
    .update({ status: 'validated' })
    .eq('id', prediction.id)

  // Record outcome
  await supabase
    .from('prediction_outcomes')
    .insert({
      prediction_id: prediction.id,
      validated_at: new Date().toISOString(),
      validation_method: 'automated',
      outcome_occurred: true,
      actual_outcome: evidence.summary,
      overall_accuracy: evidence.confidence,
      evidence_links: evidence.evidence.slice(0, 5)
    })

  return { status: 'validated', confidence: evidence.confidence }
}

/**
 * Expire prediction (deadline passed, no outcome)
 */
async function expirePrediction(prediction: any, supabase: any) {
  console.log(`   ⏰ Expiring: ${prediction.title}`)

  // Update prediction status
  await supabase
    .from('predictions')
    .update({ status: 'expired' })
    .eq('id', prediction.id)

  // Record outcome
  await supabase
    .from('prediction_outcomes')
    .insert({
      prediction_id: prediction.id,
      validated_at: new Date().toISOString(),
      validation_method: 'automated',
      outcome_occurred: false,
      actual_outcome: 'Prediction deadline passed with no outcome detected',
      overall_accuracy: 0
    })

  return { status: 'expired' }
}

/**
 * Update monitoring status (no outcome yet)
 */
async function updateMonitoring(prediction: any, evidence: any, supabase: any) {
  const supportingSignals = evidence.supporting_signals || 0
  const status = supportingSignals >= 3 ? 'signals_detected' : 'watching'

  // Update or create monitoring record
  await supabase
    .from('prediction_monitoring')
    .upsert({
      prediction_id: prediction.id,
      monitoring_status: status,
      last_checked_at: new Date().toISOString(),
      next_check_at: calculateNextCheck(prediction),
      supporting_signals_count: supportingSignals,
      confidence_trend: evidence.confidence > 50 ? 'increasing' : 'stable'
    })

  return { status: 'monitoring', signals: supportingSignals }
}

/**
 * Calculate prediction deadline
 */
function calculateDeadline(prediction: any): Date {
  const created = new Date(prediction.created_at)
  const daysToAdd = {
    '1-week': 14,
    '1-month': 45,
    '3-months': 120,
    '6-months': 210,
    '1-year': 425
  }[prediction.time_horizon] || 60

  return new Date(created.getTime() + daysToAdd * 24 * 60 * 60 * 1000)
}

/**
 * Calculate when to check next
 */
function calculateNextCheck(prediction: any): string {
  const deadline = calculateDeadline(prediction)
  const now = new Date()
  const daysUntil = Math.floor((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  let daysUntilNextCheck = 7

  if (daysUntil < 7) {
    daysUntilNextCheck = 1 // Check daily as deadline approaches
  } else if (daysUntil < 30) {
    daysUntilNextCheck = 3 // Every 3 days
  }

  return new Date(now.getTime() + daysUntilNextCheck * 24 * 60 * 60 * 1000).toISOString()
}

/**
 * Extract key terms from prediction title
 */
function extractKeyTerms(title: string): string[] {
  // Remove common words and extract key terms
  const commonWords = ['will', 'likely', 'expected', 'to', 'the', 'a', 'an', 'in', 'within']
  return title
    .toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 3 && !commonWords.includes(word))
}

/**
 * Check if event matches key terms
 */
function matchesKeyTerms(event: any, keywords: string[]): boolean {
  const text = `${event.title} ${event.content || ''}`.toLowerCase()
  return keywords.filter(kw => text.includes(kw)).length >= Math.min(keywords.length * 0.5, 3)
}
