// Supabase Edge Function: Opportunity Assessment
// Integrates with MCP servers to discover and score opportunities

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface OpportunityConfig {
  trending: { enabled: boolean; weight: number }
  news_hook: { enabled: boolean; weight: number }
  competitor_gap: { enabled: boolean; weight: number }
  journalist_interest: { enabled: boolean; weight: number }
  editorial_calendar: { enabled: boolean; weight: number }
  award: { enabled: boolean; weight: number }
  speaking: { enabled: boolean; weight: number }
  cascadeMonitoring: boolean
  cascadeTypes: string[]
  responseTime: string
  minimumScore: number
}

interface Opportunity {
  id?: string
  organization_id: string
  opportunity_type: string
  title: string
  description: string
  base_score: number
  adjusted_score?: number
  urgency: 'critical' | 'high' | 'medium' | 'low'
  window_end: string
  keywords: string[]
  relevant_journalists?: string[]
  suggested_action?: string
  cascade_effects?: any
  metadata: any
  status: string
  created_at?: string
}

// Cascade prediction based on event type
function predictCascadeEffects(eventType: string, eventData: any) {
  const cascadePatterns: Record<string, any> = {
    'regulatory_change': {
      firstOrder: [
        { effect: 'Competitors scramble to comply', probability: 0.9, timing: '1-3 days' },
        { effect: 'Media seeks expert commentary', probability: 0.85, timing: '24 hours' }
      ],
      secondOrder: [
        { effect: 'Other jurisdictions follow', probability: 0.6, timing: '1-2 weeks' },
        { effect: 'Industry associations respond', probability: 0.8, timing: '3-5 days' }
      ]
    },
    'competitor_crisis': {
      firstOrder: [
        { effect: 'Customers seek alternatives', probability: 0.8, timing: '24-48 hours' },
        { effect: 'Media compares to other players', probability: 0.9, timing: '6-12 hours' }
      ],
      secondOrder: [
        { effect: 'Market share redistribution', probability: 0.6, timing: '1-4 weeks' }
      ]
    },
    'technology_breakthrough': {
      firstOrder: [
        { effect: 'Competitors rush to respond', probability: 0.95, timing: '24 hours' },
        { effect: 'VC funding flows shift', probability: 0.7, timing: '1 week' }
      ],
      secondOrder: [
        { effect: 'Adjacent industries affected', probability: 0.6, timing: '1-2 months' }
      ]
    }
  }

  return cascadePatterns[eventType] || null
}

// Calculate adjusted score based on organization's configuration
function calculateAdjustedScore(
  opportunity: Opportunity,
  config: OpportunityConfig
): number {
  const typeConfig = config[opportunity.opportunity_type as keyof OpportunityConfig]
  
  if (!typeConfig || typeof typeConfig !== 'object' || !('enabled' in typeConfig)) {
    return opportunity.base_score
  }

  if (!typeConfig.enabled) {
    return 0
  }

  // Apply weight multiplier (weight is 0-100, convert to 0.5-1.5 multiplier)
  const weightMultiplier = 0.5 + (typeConfig.weight / 100)
  return Math.round(opportunity.base_score * weightMultiplier)
}

// Generate opportunities based on intelligence findings
async function generateOpportunities(
  organizationId: string,
  config: OpportunityConfig,
  supabase: any
): Promise<Opportunity[]> {
  const opportunities: Opportunity[] = []

  try {
    // Get recent intelligence findings
    const { data: findings, error } = await supabase
      .from('intelligence_findings')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('processed', false)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw error

    // Process findings to identify opportunities
    for (const finding of findings || []) {
      let opportunityType: string | null = null
      let baseScore = 50
      let urgency: 'critical' | 'high' | 'medium' | 'low' = 'medium'

      // Determine opportunity type based on finding
      if (finding.finding_type === 'competitor_news' && config.competitor_gap.enabled) {
        opportunityType = 'competitor_gap'
        baseScore = 75
        urgency = 'high'
      } else if (finding.finding_type === 'topic_trend' && config.trending.enabled) {
        opportunityType = 'trending'
        baseScore = 70
        urgency = finding.relevance_score > 0.8 ? 'high' : 'medium'
      } else if (finding.finding_type === 'stakeholder_activity' && config.journalist_interest.enabled) {
        opportunityType = 'journalist_interest'
        baseScore = 65
        urgency = 'medium'
      }

      if (opportunityType) {
        const opportunity: Opportunity = {
          organization_id: organizationId,
          opportunity_type: opportunityType,
          title: finding.title || 'Untitled Opportunity',
          description: finding.content || finding.ai_analysis || '',
          base_score: baseScore,
          urgency: urgency,
          window_end: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(), // 72 hours default
          keywords: finding.metadata?.keywords || [],
          suggested_action: finding.ai_analysis,
          metadata: {
            finding_id: finding.id,
            source: finding.source_url,
            ...finding.metadata
          },
          status: 'active'
        }

        // Calculate adjusted score
        opportunity.adjusted_score = calculateAdjustedScore(opportunity, config)

        // Add cascade effects if monitoring is enabled
        if (config.cascadeMonitoring && config.cascadeTypes.includes(finding.finding_type)) {
          opportunity.cascade_effects = predictCascadeEffects(finding.finding_type, finding)
        }

        // Only add if meets minimum score threshold
        if (opportunity.adjusted_score >= config.minimumScore) {
          opportunities.push(opportunity)
        }

        // Mark finding as processed
        await supabase
          .from('intelligence_findings')
          .update({ processed: true })
          .eq('id', finding.id)
      }
    }

    // Generate proactive opportunities based on calendar and patterns
    if (config.editorial_calendar.enabled) {
      opportunities.push({
        organization_id: organizationId,
        opportunity_type: 'editorial_calendar',
        title: 'Q2 Industry Trends Feature',
        description: 'Major publications planning Q2 roundups - opportunity for thought leadership',
        base_score: 68,
        adjusted_score: calculateAdjustedScore({
          base_score: 68,
          opportunity_type: 'editorial_calendar'
        } as Opportunity, config),
        urgency: 'medium',
        window_end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        keywords: ['trends', 'q2', 'predictions'],
        suggested_action: 'Prepare industry predictions and reach out to editors',
        metadata: { source: 'calendar_analysis' },
        status: 'active'
      })
    }

    if (config.award.enabled) {
      opportunities.push({
        organization_id: organizationId,
        opportunity_type: 'award',
        title: 'Tech Innovation Awards - Nominations Open',
        description: 'Annual tech innovation awards accepting nominations',
        base_score: 65,
        adjusted_score: calculateAdjustedScore({
          base_score: 65,
          opportunity_type: 'award'
        } as Opportunity, config),
        urgency: 'low',
        window_end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        keywords: ['awards', 'innovation', 'recognition'],
        suggested_action: 'Prepare nomination materials highlighting recent innovations',
        metadata: { source: 'award_calendar' },
        status: 'active'
      })
    }

  } catch (error) {
    console.error('Error generating opportunities:', error)
  }

  // Sort by adjusted score
  opportunities.sort((a, b) => (b.adjusted_score || 0) - (a.adjusted_score || 0))

  return opportunities
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { organizationId, forceRefresh = false } = await req.json()

    if (!organizationId) {
      throw new Error('organizationId is required')
    }

    console.log(`🎯 Assessing opportunities for organization: ${organizationId}`)

    // Get organization's opportunity configuration
    const { data: orgConfig, error: configError } = await supabase
      .from('opportunity_config')
      .select('*')
      .eq('organization_id', organizationId)
      .single()

    if (configError || !orgConfig) {
      return new Response(
        JSON.stringify({ 
          error: 'Organization configuration not found. Please complete onboarding.' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    // Build opportunity configuration from stored data
    const config: OpportunityConfig = {
      trending: orgConfig.opportunity_weights?.trending || { enabled: true, weight: 70 },
      news_hook: orgConfig.opportunity_weights?.news_hook || { enabled: true, weight: 80 },
      competitor_gap: orgConfig.opportunity_weights?.competitor_gap || { enabled: true, weight: 75 },
      journalist_interest: orgConfig.opportunity_weights?.journalist_interest || { enabled: true, weight: 65 },
      editorial_calendar: orgConfig.opportunity_weights?.editorial_calendar || { enabled: false, weight: 60 },
      award: orgConfig.opportunity_weights?.award || { enabled: false, weight: 55 },
      speaking: orgConfig.opportunity_weights?.speaking || { enabled: false, weight: 60 },
      cascadeMonitoring: orgConfig.cascade_monitoring || false,
      cascadeTypes: orgConfig.cascade_types || [],
      responseTime: orgConfig.response_time || '< 4 hours',
      minimumScore: orgConfig.minimum_score || 70
    }

    // Check if we need to refresh opportunities
    if (!forceRefresh) {
      // Get recent opportunities (less than 1 hour old)
      const { data: recentOpps, error: recentError } = await supabase
        .from('opportunity_queue')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('status', 'active')
        .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())
        .order('adjusted_score', { ascending: false })

      if (!recentError && recentOpps && recentOpps.length > 0) {
        return new Response(
          JSON.stringify({
            success: true,
            opportunities: recentOpps,
            fromCache: true,
            message: `Found ${recentOpps.length} recent opportunities`
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
          }
        )
      }
    }

    // Generate new opportunities
    const opportunities = await generateOpportunities(organizationId, config, supabase)

    // Store opportunities in database
    if (opportunities.length > 0) {
      // Clear old opportunities
      await supabase
        .from('opportunity_queue')
        .update({ status: 'archived' })
        .eq('organization_id', organizationId)
        .eq('status', 'active')

      // Insert new opportunities
      const { error: insertError } = await supabase
        .from('opportunity_queue')
        .insert(opportunities.map(opp => ({
          ...opp,
          score: opp.adjusted_score || opp.base_score
        })))

      if (insertError) {
        console.error('Error storing opportunities:', insertError)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        opportunities: opportunities,
        config: config,
        message: `Assessed and found ${opportunities.length} opportunities`
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('❌ Error in assess-opportunities function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})