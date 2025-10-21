import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')

/**
 * Stakeholder Profiler
 *
 * Builds detailed behavioral profiles of stakeholders using Claude
 * to analyze historical intelligence data.
 *
 * Flow:
 * 1. Get stakeholder from database
 * 2. Search intelligence history for mentions
 * 3. Extract actions, quotes, and patterns
 * 4. Use Claude to synthesize behavioral profile
 * 5. Calculate predictability metrics
 * 6. Update stakeholder profile in database
 */

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { stakeholderId, organizationId, stakeholderName, forceUpdate = false } = await req.json()

    if ((!stakeholderId && !stakeholderName) || !organizationId) {
      throw new Error('stakeholderId or stakeholderName AND organizationId required')
    }

    console.log('👤 Stakeholder Profiling Starting:', {
      stakeholderId,
      stakeholderName,
      organizationId,
      timestamp: new Date().toISOString()
    })

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Step 1: Get or create stakeholder profile
    let stakeholder
    if (stakeholderId) {
      const { data, error } = await supabase
        .from('stakeholder_profiles')
        .select('*')
        .eq('id', stakeholderId)
        .single()

      if (error) throw error
      stakeholder = data
    } else {
      // Try to find by name
      const { data, error } = await supabase
        .from('stakeholder_profiles')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('stakeholder_name', stakeholderName)
        .single()

      if (data) {
        stakeholder = data
      } else {
        // Create new profile
        const { data: newProfile, error: insertError } = await supabase
          .from('stakeholder_profiles')
          .insert({
            organization_id: organizationId,
            stakeholder_name: stakeholderName,
            stakeholder_type: 'unknown',
            influence_score: 0.50,
            predictability_score: 0.50,
            data_quality: 'low'
          })
          .select()
          .single()

        if (insertError) throw insertError
        stakeholder = newProfile
      }
    }

    console.log(`✅ Stakeholder loaded: ${stakeholder.stakeholder_name}`)

    // Skip if recently updated (unless forceUpdate)
    if (!forceUpdate && stakeholder.updated_at) {
      const lastUpdate = new Date(stakeholder.updated_at)
      const hoursSinceUpdate = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60)

      if (hoursSinceUpdate < 24) {
        console.log(`⏭️ Profile updated ${hoursSinceUpdate.toFixed(1)}h ago, skipping`)
        return new Response(
          JSON.stringify({
            success: true,
            message: 'Profile recently updated',
            profile: stakeholder
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Step 2: Search for stakeholder mentions in intelligence
    console.log('🔍 Step 2: Searching intelligence history...')
    const { data: intelligence, error: intelligenceError } = await supabase
      .from('real_time_intelligence')
      .select('events, entities, quotes, insights, created_at')
      .eq('organization_id', organizationId)
      .gte('created_at', new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString()) // Last 6 months
      .order('created_at', { ascending: false })

    if (intelligenceError) throw intelligenceError

    // Filter for mentions of this stakeholder
    const mentions = intelligence?.filter(record => {
      const text = JSON.stringify(record).toLowerCase()
      return text.includes(stakeholder.stakeholder_name.toLowerCase())
    }) || []

    console.log(`📊 Found ${mentions.length} intelligence records mentioning ${stakeholder.stakeholder_name}`)

    if (mentions.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No intelligence data found for stakeholder',
          profile: stakeholder
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Step 3: Extract structured data
    console.log('📈 Step 3: Extracting structured data...')
    const extracted = extractStructuredData(mentions, stakeholder.stakeholder_name)

    console.log(`Extracted: ${extracted.actions.length} actions, ${extracted.quotes.length} quotes`)

    // Step 4: Use Claude to synthesize behavioral profile
    console.log('🧠 Step 4: Synthesizing behavioral profile with Claude...')
    const behavioralProfile = await synthesizeBehavioralProfile(
      stakeholder,
      extracted
    )

    // Step 5: Calculate metrics
    console.log('📊 Step 5: Calculating predictability metrics...')
    const metrics = calculateMetrics(extracted, behavioralProfile)

    // Step 6: Update profile in database
    console.log('💾 Step 6: Updating profile...')
    const { data: updatedProfile, error: updateError } = await supabase
      .from('stakeholder_profiles')
      .update({
        behavioral_profile: behavioralProfile,
        historical_actions: extracted.actions,
        trigger_patterns: extracted.triggers,
        communication_style: extracted.communicationStyle,
        network_connections: extracted.connections,
        influence_score: metrics.influenceScore,
        predictability_score: metrics.predictabilityScore,
        typical_response_time_days: metrics.avgResponseDays,
        data_quality: metrics.dataQuality,
        last_action_date: extracted.lastActionDate,
        updated_at: new Date().toISOString()
      })
      .eq('id', stakeholder.id)
      .select()
      .single()

    if (updateError) throw updateError

    console.log('✅ Profile updated successfully')

    return new Response(
      JSON.stringify({
        success: true,
        profile: updatedProfile,
        metrics,
        data_points: {
          actions: extracted.actions.length,
          quotes: extracted.quotes.length,
          mentions: mentions.length,
          timespan_days: 180
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Stakeholder Profiling Error:', error)
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
 * Extract structured data from intelligence mentions
 */
function extractStructuredData(mentions: any[], stakeholderName: string) {
  const actions: any[] = []
  const quotes: any[] = []
  const triggers: string[] = []
  const connections: string[] = []
  let lastActionDate = null

  const stakeholderLower = stakeholderName.toLowerCase()

  for (const mention of mentions) {
    const date = mention.created_at

    // Extract actions
    if (mention.events && Array.isArray(mention.events)) {
      for (const event of mention.events) {
        if (event.entity?.toLowerCase().includes(stakeholderLower) ||
            event.description?.toLowerCase().includes(stakeholderLower)) {
          actions.push({
            type: event.type,
            description: event.description,
            date: date,
            category: event.category
          })

          // Update last action date
          if (!lastActionDate || new Date(date) > new Date(lastActionDate)) {
            lastActionDate = date
          }
        }
      }
    }

    // Extract quotes
    if (mention.quotes && Array.isArray(mention.quotes)) {
      for (const quote of mention.quotes) {
        if (quote.text?.toLowerCase().includes(stakeholderLower) ||
            quote.source?.toLowerCase().includes(stakeholderLower)) {
          quotes.push({
            text: quote.text,
            source: quote.source,
            date: date
          })
        }
      }
    }

    // Extract connections (entities mentioned together)
    if (mention.entities && Array.isArray(mention.entities)) {
      for (const entity of mention.entities) {
        if (entity.name && !entity.name.toLowerCase().includes(stakeholderLower)) {
          if (!connections.includes(entity.name)) {
            connections.push(entity.name)
          }
        }
      }
    }
  }

  // Analyze triggers (what events preceded actions)
  const triggerSet = new Set<string>()
  for (let i = 0; i < actions.length; i++) {
    const action = actions[i]
    const actionDate = new Date(action.date)

    // Look for events 7-30 days before this action
    const precedingEvents = actions.filter(e => {
      const eventDate = new Date(e.date)
      const daysBefore = (actionDate.getTime() - eventDate.getTime()) / (1000 * 60 * 60 * 24)
      return daysBefore > 7 && daysBefore < 30
    })

    precedingEvents.forEach(e => {
      if (e.type) triggerSet.add(e.type)
    })
  }

  const communicationStyle = analyzeCommunicationStyle(quotes)

  return {
    actions,
    quotes,
    triggers: Array.from(triggerSet),
    connections: connections.slice(0, 20), // Top 20 connections
    communicationStyle,
    lastActionDate
  }
}

/**
 * Analyze communication style from quotes
 */
function analyzeCommunicationStyle(quotes: any[]) {
  if (quotes.length === 0) return {}

  // Simple heuristics
  const totalWords = quotes.reduce((sum, q) => sum + (q.text?.split(' ').length || 0), 0)
  const avgLength = totalWords / quotes.length

  return {
    avg_statement_length: Math.round(avgLength),
    total_quotes: quotes.length,
    communication_frequency: quotes.length > 10 ? 'high' : quotes.length > 5 ? 'medium' : 'low'
  }
}

/**
 * Use Claude to synthesize behavioral profile
 */
async function synthesizeBehavioralProfile(stakeholder: any, extracted: any) {
  if (!ANTHROPIC_API_KEY) {
    console.log('⚠️ No Anthropic API key, using basic profile')
    return {
      analysis: 'Basic profile - API key not configured',
      patterns: extracted.triggers,
      predictability: 'medium'
    }
  }

  const prompt = `Analyze this stakeholder's behavioral patterns and provide a predictive profile.

Stakeholder: ${stakeholder.stakeholder_name}
Type: ${stakeholder.stakeholder_type}

Historical Actions (${extracted.actions.length} total):
${extracted.actions.slice(0, 10).map(a => `- [${a.type}] ${a.description} (${a.date})`).join('\n')}

Quotes (${extracted.quotes.length} total):
${extracted.quotes.slice(0, 5).map(q => `- "${q.text}" - ${q.source}`).join('\n')}

Common Triggers: ${extracted.triggers.join(', ')}
Network Connections: ${extracted.connections.slice(0, 10).join(', ')}

Provide a JSON object with:
{
  "behavioral_summary": "2-3 sentence summary of typical behavior",
  "response_patterns": ["pattern 1", "pattern 2", "pattern 3"],
  "predictability_assessment": "high|medium|low with reasoning",
  "typical_triggers": ["trigger 1", "trigger 2"],
  "typical_response_time": "estimate in days",
  "influence_level": "high|medium|low with reasoning",
  "risk_factors": ["factor 1", "factor 2"]
}`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1500,
        temperature: 0.3,
        messages: [{ role: 'user', content: prompt }]
      })
    })

    if (response.ok) {
      const data = await response.json()
      const text = data.content[0].text

      // Try to parse JSON
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }

      return { analysis: text }
    }
  } catch (error) {
    console.error('Claude API error:', error)
  }

  return {
    analysis: 'Profile analysis unavailable',
    patterns: extracted.triggers,
    predictability: 'medium'
  }
}

/**
 * Calculate predictability metrics
 */
function calculateMetrics(extracted: any, behavioralProfile: any) {
  // Influence score based on actions and connections
  const actionCount = extracted.actions.length
  const connectionCount = extracted.connections.length
  const quoteCount = extracted.quotes.length

  let influenceScore = 0.50 // Default
  if (actionCount > 20 || connectionCount > 30) {
    influenceScore = 0.85
  } else if (actionCount > 10 || connectionCount > 15) {
    influenceScore = 0.70
  } else if (actionCount > 5) {
    influenceScore = 0.60
  }

  // Predictability score based on consistency
  let predictabilityScore = 0.50 // Default
  if (behavioralProfile.predictability_assessment?.includes('high')) {
    predictabilityScore = 0.80
  } else if (behavioralProfile.predictability_assessment?.includes('low')) {
    predictabilityScore = 0.30
  }

  // Calculate average response time
  let avgResponseDays = 30 // Default
  if (behavioralProfile.typical_response_time) {
    const match = behavioralProfile.typical_response_time.match(/(\d+)/)
    if (match) {
      avgResponseDays = parseInt(match[1])
    }
  }

  // Data quality based on data points
  let dataQuality = 'low'
  if (actionCount > 20 && quoteCount > 10) {
    dataQuality = 'high'
  } else if (actionCount > 10 || quoteCount > 5) {
    dataQuality = 'medium'
  }

  return {
    influenceScore,
    predictabilityScore,
    avgResponseDays,
    dataQuality
  }
}
