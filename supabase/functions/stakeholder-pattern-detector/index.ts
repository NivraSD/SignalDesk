import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

/**
 * Stakeholder Pattern Detector
 *
 * Analyzes recent intelligence to detect stakeholder action patterns
 * and generate predictions with confidence scores.
 *
 * Flow:
 * 1. Load stakeholder profiles for organization
 * 2. Get recent intelligence events (last 90 days)
 * 3. Load pattern library
 * 4. Match events to patterns
 * 5. Generate predictions with confidence scores
 * 6. Store predictions in database
 */

interface PatternSignals {
  [key: string]: string[] // T90, T60, T30, T14, T7
}

interface Pattern {
  pattern_name: string
  stakeholder_type: string
  early_signals: PatternSignals
  typical_actions: string[]
  avg_lead_time_days: number
  reliability_score: number
}

interface Event {
  type: string
  entity: string
  description: string
  date: string
  category?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { organizationId, runNow = false } = await req.json()

    if (!organizationId) {
      throw new Error('organizationId is required')
    }

    console.log('🎯 Stakeholder Pattern Detection Starting:', {
      organizationId,
      timestamp: new Date().toISOString()
    })

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Step 1: Get stakeholder profiles
    console.log('📋 Step 1: Loading stakeholder profiles...')
    const { data: stakeholderProfiles, error: profilesError } = await supabase
      .from('stakeholder_profiles')
      .select('*')
      .eq('organization_id', organizationId)

    if (profilesError) {
      console.error('Error loading stakeholder profiles:', profilesError)
      throw profilesError
    }

    console.log(`✅ Loaded ${stakeholderProfiles?.length || 0} stakeholder profiles`)

    // If no profiles exist yet, create initial profiles from discovery
    if (!stakeholderProfiles || stakeholderProfiles.length === 0) {
      console.log('🔍 No profiles found, creating from discovery data...')
      await createInitialProfiles(supabase, organizationId)

      // Retry loading profiles
      const { data: newProfiles } = await supabase
        .from('stakeholder_profiles')
        .select('*')
        .eq('organization_id', organizationId)

      if (!newProfiles || newProfiles.length === 0) {
        return new Response(
          JSON.stringify({
            success: true,
            message: 'No stakeholders found in discovery profile. Run intelligence pipeline first.',
            predictions: []
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Step 2: Get recent intelligence events (last 90 days)
    console.log('📊 Step 2: Loading recent intelligence events...')
    const { data: recentIntelligence, error: intelligenceError } = await supabase
      .from('real_time_intelligence_briefs')
      .select('events, entities, created_at, organization_name')
      .eq('organization_id', organizationId)
      .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })

    if (intelligenceError) {
      console.error('Error loading intelligence:', intelligenceError)

      // If no intelligence data exists yet, return gracefully
      if (intelligenceError.code === 'PGRST116' || intelligenceError.message.includes('0 rows')) {
        return new Response(
          JSON.stringify({
            success: true,
            message: 'No real-time intelligence data available yet. Run the real-time monitor first.',
            predictions: [],
            predictions_generated: 0
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      throw intelligenceError
    }

    console.log(`✅ Loaded ${recentIntelligence?.length || 0} intelligence briefs`)

    // If no intelligence data exists, return gracefully
    if (!recentIntelligence || recentIntelligence.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No real-time intelligence data available yet. Run the real-time monitor first.',
          predictions: [],
          predictions_generated: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Flatten events from all intelligence records
    const allEvents: Event[] = []
    recentIntelligence?.forEach(record => {
      if (record.events && Array.isArray(record.events)) {
        allEvents.push(...record.events.map(e => ({
          ...e,
          date: record.created_at
        })))
      }
    })

    console.log(`📈 Total events extracted: ${allEvents.length}`)

    // Step 3: Load pattern library
    console.log('📚 Step 3: Loading pattern library...')
    const { data: patterns, error: patternsError } = await supabase
      .from('stakeholder_patterns')
      .select('*')
      .eq('is_active', true)

    if (patternsError) {
      console.error('Error loading patterns:', patternsError)
      throw patternsError
    }

    console.log(`✅ Loaded ${patterns?.length || 0} active patterns`)

    // Step 4: Match events to patterns for each stakeholder
    console.log('🔍 Step 4: Matching patterns to stakeholders...')
    const predictions = []

    for (const stakeholder of stakeholderProfiles || []) {
      // Get relevant patterns for this stakeholder type
      const relevantPatterns = patterns?.filter(
        p => p.stakeholder_type === stakeholder.stakeholder_type
      ) || []

      console.log(`Analyzing ${stakeholder.stakeholder_name} (${stakeholder.stakeholder_type}): ${relevantPatterns.length} patterns`)

      for (const pattern of relevantPatterns) {
        const matchResult = calculatePatternMatch(
          allEvents,
          pattern,
          stakeholder.stakeholder_name
        )

        console.log(`  Pattern "${pattern.pattern_name}": match score ${matchResult.matchScore.toFixed(2)}`)

        // Generate prediction if match score is high enough
        if (matchResult.matchScore >= 0.6) {
          const prediction = generatePrediction(
            stakeholder,
            pattern,
            matchResult
          )

          predictions.push(prediction)
          console.log(`  ✅ Generated prediction: ${prediction.predicted_action} (${(prediction.probability * 100).toFixed(0)}%)`)
        }
      }
    }

    console.log(`📊 Total predictions generated: ${predictions.length}`)

    // Step 5: Store predictions in database
    if (predictions.length > 0) {
      console.log('💾 Step 5: Storing predictions...')

      // First, expire old predictions for these stakeholders
      const stakeholderIds = [...new Set(predictions.map(p => p.stakeholder_id))]
      await supabase
        .from('stakeholder_predictions')
        .update({ status: 'superseded', updated_at: new Date().toISOString() })
        .eq('organization_id', organizationId)
        .in('stakeholder_id', stakeholderIds)
        .eq('status', 'active')

      // Insert new predictions
      const { data: insertedPredictions, error: insertError } = await supabase
        .from('stakeholder_predictions')
        .insert(predictions)
        .select()

      if (insertError) {
        console.error('Error storing predictions:', insertError)
        throw insertError
      }

      console.log(`✅ Stored ${insertedPredictions?.length || 0} predictions`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        predictions_generated: predictions.length,
        predictions: predictions.map(p => ({
          stakeholder: p.stakeholder_name,
          action: p.predicted_action,
          probability: p.probability,
          confidence: p.confidence_level,
          timeframe: p.expected_timeframe,
          signals: p.trigger_signals
        })),
        events_analyzed: allEvents.length,
        stakeholders_analyzed: stakeholderProfiles?.length || 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Pattern Detection Error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

/**
 * Calculate how well events match a pattern's signals
 */
function calculatePatternMatch(
  events: Event[],
  pattern: Pattern,
  stakeholderName: string
): { matchScore: number; matchedSignals: any; timelineData: any } {
  const now = new Date()
  let totalScore = 0
  let totalWeight = 0
  const matchedSignals: any = {}
  const timelineData: any = {}

  // Filter events related to this stakeholder
  const relevantEvents = events.filter(e =>
    e.entity?.toLowerCase().includes(stakeholderName.toLowerCase()) ||
    e.description?.toLowerCase().includes(stakeholderName.toLowerCase())
  )

  console.log(`    Found ${relevantEvents.length} events related to ${stakeholderName}`)

  // Check each time period (T90, T60, T30, T14, T7)
  for (const [period, expectedSignals] of Object.entries(pattern.early_signals)) {
    const periodDays = parseInt(period.replace('T', ''))
    const weight = periodDays < 30 ? 2.0 : 1.0 // Recent signals weighted more heavily

    // Get events within this time window
    const periodEvents = relevantEvents.filter(e => {
      const eventDate = new Date(e.date)
      const daysSince = Math.floor((now.getTime() - eventDate.getTime()) / (1000 * 60 * 60 * 24))
      return daysSince <= periodDays
    })

    // Check for signal matches
    const matches: string[] = []
    for (const signal of expectedSignals) {
      const signalFound = periodEvents.some(event =>
        event.description?.toLowerCase().includes(signal.toLowerCase()) ||
        event.type?.toLowerCase().includes(signal.toLowerCase())
      )

      if (signalFound) {
        matches.push(signal)
      }
    }

    const periodScore = matches.length / expectedSignals.length
    totalScore += periodScore * weight
    totalWeight += weight

    matchedSignals[period] = matches
    timelineData[period] = {
      expected: expectedSignals.length,
      found: matches.length,
      events: periodEvents.length
    }
  }

  const finalScore = totalWeight > 0 ? totalScore / totalWeight : 0

  return {
    matchScore: finalScore,
    matchedSignals,
    timelineData
  }
}

/**
 * Generate prediction object from pattern match
 */
function generatePrediction(
  stakeholder: any,
  pattern: Pattern,
  matchResult: any
) {
  const probability = matchResult.matchScore * pattern.reliability_score
  const confidence = probability >= 0.75 ? 'high' : probability >= 0.60 ? 'medium' : 'low'

  // Calculate expected dates
  const leadTimeDays = pattern.avg_lead_time_days
  const expectedDateMin = new Date()
  expectedDateMin.setDate(expectedDateMin.getDate() + Math.floor(leadTimeDays * 0.7))

  const expectedDateMax = new Date()
  expectedDateMax.setDate(expectedDateMax.getDate() + Math.floor(leadTimeDays * 1.3))

  // Select most likely action
  const predictedAction = pattern.typical_actions[0] || 'Undetermined action'

  // Extract trigger signals from matched signals
  const triggerSignals: string[] = []
  for (const [period, signals] of Object.entries(matchResult.matchedSignals)) {
    if (Array.isArray(signals)) {
      triggerSignals.push(...signals)
    }
  }

  return {
    stakeholder_id: stakeholder.id,
    stakeholder_name: stakeholder.stakeholder_name,
    organization_id: stakeholder.organization_id,
    predicted_action: predictedAction,
    action_category: pattern.stakeholder_type,
    probability: Math.min(probability, 0.99), // Cap at 99%
    expected_timeframe: `${leadTimeDays} days`,
    expected_date_min: expectedDateMin.toISOString().split('T')[0],
    expected_date_max: expectedDateMax.toISOString().split('T')[0],
    trigger_signals: triggerSignals,
    supporting_evidence: matchResult.timelineData,
    confidence_level: confidence,
    pattern_matched: pattern.pattern_name,
    match_score: matchResult.matchScore,
    status: 'active',
    expires_at: expectedDateMax.toISOString()
  }
}

/**
 * Create initial stakeholder profiles from discovery data
 */
async function createInitialProfiles(supabase: any, organizationId: string) {
  console.log('🔧 Creating initial stakeholder profiles from discovery...')

  // Get discovery profile
  const { data: discovery, error: discoveryError } = await supabase
    .from('mcp_discovery')
    .select('*')
    .eq('organization_id', organizationId)
    .single()

  if (discoveryError || !discovery) {
    console.error('No discovery profile found')
    return
  }

  const profiles: any[] = []

  // Extract stakeholders from discovery profile
  const stakeholderSources = [
    { type: 'regulator', data: discovery.stakeholders?.regulators || [] },
    { type: 'investor', data: discovery.stakeholders?.major_investors || [] },
    { type: 'competitor', data: discovery.competition?.direct_competitors || [] },
    { type: 'media', data: discovery.media?.key_journalists || [] }
  ]

  for (const source of stakeholderSources) {
    for (const stakeholder of source.data) {
      const name = typeof stakeholder === 'string' ? stakeholder : stakeholder.name

      if (name) {
        profiles.push({
          organization_id: organizationId,
          stakeholder_name: name,
          stakeholder_type: source.type,
          influence_score: 0.50, // Default medium influence
          predictability_score: 0.50, // Default medium predictability
          data_quality: 'low', // Will improve as we gather data
          behavioral_profile: {},
          historical_actions: [],
          trigger_patterns: [],
          communication_style: {},
          network_connections: []
        })
      }
    }
  }

  if (profiles.length > 0) {
    const { error: insertError } = await supabase
      .from('stakeholder_profiles')
      .insert(profiles)

    if (insertError) {
      console.error('Error creating initial profiles:', insertError)
    } else {
      console.log(`✅ Created ${profiles.length} initial stakeholder profiles`)
    }
  }
}
