import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') || Deno.env.get('CLAUDE_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface Prediction {
  title: string
  description: string
  category: 'competitive' | 'regulatory' | 'market' | 'technology' | 'partnership' | 'crisis'
  confidence: number // 0-100
  time_horizon: '1-week' | '1-month' | '3-months' | '6-months' | '1-year'
  impact: 'high' | 'medium' | 'low'
  evidence: string[]
  implications: string[]
  recommended_actions: string[]
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const {
      organization_id,
      organization_name,
      articles = [],
      profile = {},
      trigger_event_id = null,
      trigger_event_summary = null
    } = await req.json()

    console.log(`🔮 Real-Time Prediction Generator - ${organization_name}`)
    console.log(`📰 Analyzing ${articles.length} current articles`)

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    // ==================== STEP 1: GET HISTORICAL DATA ====================
    console.log('📊 Fetching historical intelligence data (last 30 days)...')

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Get recent opportunities (contain strategic insights)
    console.log(`   Looking for recent opportunities for context...`)

    const { data: opportunitiesData, error: oppError } = await supabase
      .from('opportunities')
      .select('title, description, strategic_context, created_at')
      .eq('organization_id', organization_id)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(10)

    const executiveSyntheses = []
    if (!oppError && opportunitiesData && opportunitiesData.length > 0) {
      console.log(`   ✓ Found ${opportunitiesData.length} recent opportunities with strategic context`)
      opportunitiesData.forEach(opp => {
        if (opp.strategic_context) {
          executiveSyntheses.push({
            summary: `${opp.title}: ${opp.description}`,
            context: opp.strategic_context,
            date: opp.created_at
          })
        }
      })
    } else {
      console.log(`   ℹ️  No recent opportunities found for strategic context`)
    }

    // Get historical monitoring data (RSS articles)
    const { data: historicalData, error: histError } = await supabase
      .from('fireplexity_monitoring')
      .select('results, executed_at')
      .eq('organization_id', organization_id)
      .gte('executed_at', thirtyDaysAgo.toISOString())
      .order('executed_at', { ascending: false })
      .limit(20)

    if (histError) {
      console.error('Error fetching historical data:', histError)
    }

    const historicalArticles = []
    if (historicalData) {
      historicalData.forEach(record => {
        if (record.results && Array.isArray(record.results)) {
          historicalArticles.push(...record.results.map(r => ({
            ...r,
            collected_at: record.executed_at
          })))
        }
      })
    }

    console.log(`📚 Total historical data: ${historicalArticles.length} articles, ${executiveSyntheses.length} strategic insights from opportunities`)

    // ==================== STEP 2: ANALYZE WITH CLAUDE ====================
    // Prepare data for Claude
    const currentArticleSummaries = articles.slice(0, 15).map(a => ({
      title: a.title,
      source: a.source,
      published: a.published_at || a.published,
      snippet: a.content?.substring(0, 300) || a.description?.substring(0, 300) || ''
    }))

    const historicalTrends = extractTrends(historicalArticles)

    const currentDate = new Date().toISOString().split('T')[0]
    const currentDateTime = new Date()
    const currentYear = currentDateTime.getFullYear()
    const currentMonth = currentDateTime.getMonth() + 1
    const futureMonths = {
      '1-week': new Date(currentDateTime.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      '1-month': new Date(currentDateTime.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      '3-months': new Date(currentDateTime.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      '6-months': new Date(currentDateTime.getTime() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      '1-year': new Date(currentDateTime.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    }

    const prompt = `You are a PATTERN-RECOGNITION STRATEGIST who sees second-order effects and non-obvious connections that others miss.

# ⚠️ CRITICAL: TEMPORAL CONTEXT - READ THIS FIRST ⚠️

**CURRENT DATE AND TIME:**
- TODAY IS: ${currentDate}
- CURRENT YEAR: ${currentYear}
- CURRENT MONTH: ${currentMonth}/${currentYear}

**FUTURE DATE REFERENCE POINTS:**
- 1-week from now: ${futureMonths['1-week']}
- 1-month from now: ${futureMonths['1-month']}
- 3-months from now: ${futureMonths['3-months']}
- 6-months from now: ${futureMonths['6-months']}
- 1-year from now: ${futureMonths['1-year']}

**ABSOLUTE RULES:**
1. ALL predictions must be about FUTURE events (after ${currentDate})
2. NEVER predict events that already occurred before ${currentDate}
3. When you see historical articles, recognize they are PAST EVENTS - use them as context, not prediction targets
4. Your time horizons should look FORWARD from ${currentDate}, not backward

**Additional Context:**
- Your Knowledge Cutoff: January 2025
- Critical: DO NOT assume current office holders, executives, or leadership positions without evidence in the provided articles
- If you reference a person, use ONLY information from the current articles, not your training data
- When specifying time horizons, calculate dates FORWARD from ${currentDate}

# YOUR MISSION
Generate 3-5 SPECULATIVE, PATTERN-BASED predictions about future developments starting from ${currentDate}. Think like a strategic futurist, not a conservative analyst.

# CRITICAL THINKING FRAMEWORK

**Look for DEEPER PATTERNS, not surface-level news:**
- Example: "Microsoft margin pressure" → Don't stop there! Xbox business model (low-margin hardware) ≠ AI business model (high-margin cloud). Which division is actually struggling? What does this signal about resource allocation?
- Example: "AI regulation increasing" → Second-order effect: Which companies benefit from compliance burden? Who gets squeezed out?
- Example: "3 competitors raising prices" → Pattern: Industry-wide cost pressure or coordinated signaling? What's the root cause?

**Connect dots across unrelated events:**
- Regulation + Product launch + Executive departure = ???
- Market trend + Competitor struggle + Technology shift = ???
- Look for convergence patterns, timing coincidences, strategic moves that only make sense together

**Think in business units, not monoliths:**
- Microsoft ≠ Microsoft. Azure, Office, Xbox, AI - different economics, different pressures
- Google ≠ Google. Search, Cloud, YouTube, Hardware - different trajectories
- Don't treat companies as single entities - predict at division/product level

**BE SPECULATIVE and TAKE RISK:**
- These are THEORETICAL predictions about what MIGHT happen
- You're pattern-matching and extrapolating - that's the job!
- Bold, surprising predictions > safe, obvious ones
- 70-80% confidence is fine if the insight is valuable

# DATA TO ANALYZE

## Current Articles (Today)
${JSON.stringify(currentArticleSummaries, null, 2)}

## Emerging Trends (Last 30 days)
${JSON.stringify(historicalTrends, null, 2)}

${executiveSyntheses.length > 0 ? `## Recent Strategic Opportunities
These contain deep competitive intelligence and market insights:
${JSON.stringify(executiveSyntheses, null, 2)}
` : ''}

## Organization Context
${JSON.stringify({
  name: organization_name,
  industry: profile.industry || 'Technology',
  competitors: profile.competition?.direct_competitors?.slice(0, 5) || [],
  key_stakeholders: [
    ...(profile.stakeholders?.major_investors?.slice(0, 3) || []),
    ...(profile.stakeholders?.regulators?.slice(0, 2) || [])
  ]
}, null, 2)}

# PREDICTION MANDATE

**PREDICT EXTERNAL DYNAMICS, NOT INTERNAL PLANS:**
- ✅ "Microsoft will spin off Xbox as regulatory pressure mounts on gaming acquisitions"
- ❌ "Microsoft will improve Xbox performance"
- ✅ "OpenAI will face executive exodus as DeepMind poaches talent with equity packages"
- ❌ "OpenAI will hire more engineers"

**LOOK FOR NON-OBVIOUS PATTERNS:**
- Timing patterns: Why are 3 things happening simultaneously?
- Resource patterns: Where is money/talent/attention flowing?
- Regulatory patterns: What's coming 6 months before it arrives?
- Technology patterns: What's possible now that wasn't 6 months ago?
- Market structure patterns: Is consolidation/fragmentation accelerating?

# PREDICTION CATEGORIES
- competitive: Specific competitor moves, market share shifts, strategic pivots
- regulatory: Government actions, compliance shifts, enforcement patterns
- market: Market structure changes, economic forces, industry consolidation
- technology: Tech breakthroughs, platform shifts, capability unlocks
- partnership: M&A moves, alliance formation, ecosystem restructuring
- crisis: Emerging risks, vulnerability exploitation, reputation threats

# OUTPUT FORMAT
Return ONLY a JSON array of predictions. Each prediction MUST:
{
  "stakeholder": "Specific entity - ONLY use names/titles explicitly mentioned in the provided articles. Use organizational names (e.g. 'FTC', 'Microsoft Gaming Division') rather than assuming specific people in roles unless they are named in the articles.",
  "title": "Bold, specific FUTURE prediction using future tense - e.g. 'Microsoft WILL divest Xbox by ${futureMonths['3-months']}' NOT 'Microsoft divested Xbox'",
  "description": "2-3 sentences on: (1) WHAT will happen IN THE FUTURE, (2) WHY (the pattern/logic), (3) WHEN approximately (use future dates like ${futureMonths['1-month']}, ${futureMonths['3-months']}, etc.)",
  "category": "competitive|regulatory|market|technology|partnership|crisis",
  "confidence": 75, // 70-85% is GOOD for speculative predictions - this is pattern-matching, not certainty
  "time_horizon": "1-week|1-month|3-months|6-months|1-year", // MUST align with future dates: 1-week = by ${futureMonths['1-week']}, 1-month = by ${futureMonths['1-month']}, etc.

  "impact": "high|medium|low", // Impact on ${organization_name}
  "evidence": ["Specific articles/trends that reveal the pattern - cite what you saw (these are PAST/CURRENT events that inform FUTURE predictions)"],
  "implications": ["What this WILL mean for ${organization_name} in the future - opportunities or threats that WILL emerge"],
  "recommended_actions": ["Specific tactical responses - what should ${organization_name} DO NOW to prepare for this FUTURE event?"]
}

⚠️ REMINDER: All predictions must use FUTURE TENSE ("will happen", "expected to", "likely to") and reference dates AFTER ${currentDate}

# QUALITY CHECKLIST
✅ Prediction is about EXTERNAL entity (competitor/regulator/market), not ${organization_name}
✅ Prediction identifies a PATTERN or SECOND-ORDER EFFECT, not just restating news
✅ Prediction is SPECIFIC (names, divisions, timeframes, concrete outcomes)
✅ Prediction is BOLD enough to be interesting (safe/obvious predictions are useless)
✅ Evidence clearly connects to the prediction (show your reasoning)
✅ Implications are ACTIONABLE for ${organization_name}

# GENERATE NOW
Create 3-5 pattern-based predictions. Prioritize:
1. HIGH-IMPACT predictions (game-changing for ${organization_name})
2. NON-OBVIOUS connections (what others would miss)
3. SPECULATIVE but LOGICAL (connect the dots, even if risky)

Return ONLY the JSON array, no other text.`

    console.log('🤖 Calling Claude for prediction generation...')

    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        temperature: 0.7,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    })

    if (!claudeResponse.ok) {
      throw new Error(`Claude API error: ${claudeResponse.status}`)
    }

    const claudeData = await claudeResponse.json()
    const claudeText = claudeData.content[0].text

    console.log('📝 Claude response received')

    // Parse predictions from Claude
    let predictions: Prediction[] = []
    try {
      // Extract JSON from Claude's response
      const jsonMatch = claudeText.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        predictions = JSON.parse(jsonMatch[0])
      } else {
        console.warn('Could not find JSON array in Claude response')
        predictions = []
      }
    } catch (parseError) {
      console.error('Error parsing Claude predictions:', parseError)
      console.error('Claude text:', claudeText)
      predictions = []
    }

    console.log(`✅ Generated ${predictions.length} predictions`)

    // ==================== STEP 3: MATCH PREDICTIONS TO TARGETS ====================
    console.log('🎯 Matching predictions to intelligence targets...')

    // Get organization's targets
    const { data: targets, error: targetsError } = await supabase
      .from('intelligence_targets')
      .select('*')
      .eq('organization_id', organization_id)
      .eq('active', true)

    if (targetsError) {
      console.error('Error fetching targets:', targetsError)
    }

    // Match each prediction to a target
    const enhancedPredictions = predictions.map(pred => {
      const stakeholder = (pred.stakeholder || '').toLowerCase()
      const title = pred.title.toLowerCase()

      // Find matching target
      const matchedTarget = targets?.find(target => {
        const targetName = target.name.toLowerCase()

        // Check if stakeholder or title mentions target name
        if (stakeholder.includes(targetName) || title.includes(targetName)) {
          return true
        }

        // Check if any keywords match
        if (target.keywords && Array.isArray(target.keywords)) {
          return target.keywords.some(keyword =>
            stakeholder.includes(keyword.toLowerCase()) ||
            title.includes(keyword.toLowerCase())
          )
        }

        return false
      })

      if (matchedTarget) {
        console.log(`   ✓ Matched "${pred.title}" to target: ${matchedTarget.name} (${matchedTarget.type})`)
      }

      return {
        ...pred,
        target_id: matchedTarget?.id || null,
        target_name: matchedTarget?.name || pred.stakeholder,
        target_type: matchedTarget?.type || null
      }
    })

    console.log(`🎯 Matched ${enhancedPredictions.filter(p => p.target_id).length}/${enhancedPredictions.length} predictions to targets`)

    // ==================== STEP 4: SAVE TO DATABASE ====================
    if (enhancedPredictions.length > 0) {
      console.log('💾 Saving predictions to database...')

      // Clear existing predictions for this organization
      await supabase
        .from('predictions')
        .delete()
        .eq('organization_id', organization_id)

      // Insert new predictions with target and trigger data
      const predictionRecords = enhancedPredictions.map(pred => ({
        organization_id,
        title: pred.title,
        description: pred.description,
        category: pred.category,
        confidence_score: pred.confidence,
        time_horizon: pred.time_horizon,
        impact_level: pred.impact,
        // Target integration
        target_id: pred.target_id,
        target_name: pred.target_name,
        target_type: pred.target_type,
        // Trigger event tracking
        trigger_event_id: trigger_event_id,
        trigger_event_summary: trigger_event_summary,
        pattern_confidence: pred.confidence, // How well the pattern matched
        data: {
          stakeholder: pred.stakeholder,
          evidence: pred.evidence,
          implications: pred.implications,
          recommended_actions: pred.recommended_actions,
          generated_from: {
            current_articles_count: articles.length,
            historical_articles_count: historicalArticles.length,
            strategic_insights_count: executiveSyntheses.length,
            generation_method: 'claude-pattern-analysis-v2',
            trigger_event_provided: !!trigger_event_id
          }
        },
        status: 'active',
        created_at: new Date().toISOString()
      }))

      const { error: insertError, data: insertedData } = await supabase
        .from('predictions')
        .insert(predictionRecords)
        .select()

      if (insertError) {
        console.error('❌ ERROR saving predictions:', JSON.stringify(insertError, null, 2))
        console.error('   organization_id value:', organization_id)
        console.error('   organization_id type:', typeof organization_id)
      } else {
        console.log(`✅ Saved ${insertedData?.length || predictionRecords.length} predictions`)
        console.log(`   organization_id: ${organization_id}`)

        // Create monitoring records for each prediction
        if (insertedData && insertedData.length > 0) {
          console.log('📊 Creating monitoring records...')

          const monitoringRecords = insertedData.map(pred => {
            // Calculate next check time based on time horizon
            const nextCheck = calculateNextCheckTime(pred.time_horizon)

            return {
              prediction_id: pred.id,
              monitoring_status: 'watching',
              last_checked_at: new Date().toISOString(),
              next_check_at: nextCheck,
              supporting_signals_count: 0,
              contradicting_signals_count: 0,
              confidence_trend: 'stable',
              alert_threshold_met: false
            }
          })

          const { error: monitoringError } = await supabase
            .from('prediction_monitoring')
            .insert(monitoringRecords)

          if (monitoringError) {
            console.error('Warning: Failed to create monitoring records:', monitoringError)
          } else {
            console.log(`✅ Created ${monitoringRecords.length} monitoring records`)
          }
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      predictions_generated: predictions.length,
      predictions: predictions,
      data_analyzed: {
        current_articles: articles.length,
        historical_articles: historicalArticles.length,
        strategic_insights: executiveSyntheses.length,
        trends_identified: historicalTrends.length
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('❌ Prediction generator error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

// ==================== HELPER FUNCTIONS ====================

/**
 * Extract emerging trends from historical articles
 */
function extractTrends(articles: any[]): any[] {
  if (!articles || articles.length === 0) return []

  // Group articles by week
  const weeklyGroups = new Map<string, any[]>()

  articles.forEach(article => {
    const date = new Date(article.collected_at || article.published_at || 0)
    const weekKey = `${date.getFullYear()}-W${getWeekNumber(date)}`

    if (!weeklyGroups.has(weekKey)) {
      weeklyGroups.set(weekKey, [])
    }
    weeklyGroups.get(weekKey)!.push(article)
  })

  // Extract trends
  const trends = []

  // Trend 1: Volume changes
  const weeksArray = Array.from(weeklyGroups.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  if (weeksArray.length >= 2) {
    const lastWeek = weeksArray[weeksArray.length - 1]
    const prevWeek = weeksArray[weeksArray.length - 2]
    const volumeChange = ((lastWeek[1].length - prevWeek[1].length) / prevWeek[1].length) * 100

    if (Math.abs(volumeChange) > 20) {
      trends.push({
        type: 'volume_change',
        description: `Article volume ${volumeChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(volumeChange).toFixed(0)}% this week`,
        data: {
          last_week_count: lastWeek[1].length,
          prev_week_count: prevWeek[1].length
        }
      })
    }
  }

  // Trend 2: Recurring topics
  const topicFrequency = new Map<string, number>()
  articles.forEach(article => {
    const text = `${article.title || ''} ${article.content || ''}`.toLowerCase()

    // Simple keyword extraction
    const keywords = ['partnership', 'acquisition', 'regulatory', 'lawsuit', 'funding', 'launch', 'ai', 'model', 'investment']
    keywords.forEach(kw => {
      if (text.includes(kw)) {
        topicFrequency.set(kw, (topicFrequency.get(kw) || 0) + 1)
      }
    })
  })

  // Find top recurring topics
  const topTopics = Array.from(topicFrequency.entries())
    .filter(([_, count]) => count >= 3)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)

  topTopics.forEach(([topic, count]) => {
    trends.push({
      type: 'recurring_topic',
      description: `"${topic}" mentioned in ${count} articles over 30 days`,
      topic,
      frequency: count
    })
  })

  return trends.slice(0, 5) // Top 5 trends
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

/**
 * Calculate when to next check a prediction based on its time horizon
 * Check more frequently as deadline approaches
 */
function calculateNextCheckTime(timeHorizon: string): string {
  const now = new Date()
  let daysUntilCheck = 7 // Default: weekly

  switch (timeHorizon) {
    case '1-week':
      daysUntilCheck = 1 // Check daily for short-term predictions
      break
    case '1-month':
      daysUntilCheck = 3 // Every 3 days
      break
    case '3-months':
      daysUntilCheck = 7 // Weekly
      break
    case '6-months':
    case '1-year':
      daysUntilCheck = 14 // Bi-weekly
      break
  }

  return new Date(now.getTime() + daysUntilCheck * 24 * 60 * 60 * 1000).toISOString()
}
