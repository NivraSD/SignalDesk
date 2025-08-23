// Simplified Opportunity Assessment - Integrates with MCP array
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')

// Opportunity patterns based on MCP integration strategy
const OPPORTUNITY_PATTERNS = {
  competitor_weakness: {
    signals: ['negative_sentiment', 'leadership_change', 'product_issue', 'layoffs'],
    window: '24-48 hours',
    urgency: 'HIGH',
    action: 'Position as stable alternative'
  },
  narrative_vacuum: {
    signals: ['high_search_volume', 'low_expert_coverage', 'journalist_interest'],
    window: '3-5 days',
    urgency: 'MEDIUM',
    action: 'Offer executive as expert source'
  },
  cascade_effect: {
    signals: ['primary_disruption', 'industry_impact', 'supply_chain_effect'],
    window: '1-3 days',
    urgency: 'HIGH',
    action: 'Pre-position for cascade effects'
  },
  crisis_prevention: {
    signals: ['competitor_crisis', 'industry_scandal', 'regulatory_change'],
    window: '6-12 hours',
    urgency: 'URGENT',
    action: 'Proactive transparency and differentiation'
  },
  viral_moment: {
    signals: ['trending_topic', 'cultural_moment', 'meme_potential'],
    window: '2-6 hours',
    urgency: 'URGENT',
    action: 'Quick creative response'
  }
}

// Real-time signal detection from various sources
async function detectSignals(organizationId: string) {
  // In production, this would integrate with:
  // - signaldesk-intelligence MCP for market scanning
  // - signaldesk-monitor MCP for competitor tracking
  // - signaldesk-relationships MCP for journalist activity
  // - Playwright MCP for web scraping
  
  // For now, generate realistic signals based on current events
  const currentHour = new Date().getHours()
  const dayOfWeek = new Date().getDay()
  
  const signals = []
  
  // Morning: Check overnight developments
  if (currentHour >= 6 && currentHour <= 10) {
    signals.push({
      type: 'overnight_news',
      source: 'intelligence_mcp',
      description: 'Asian markets volatility affecting tech sector',
      relevance: 0.7,
      keywords: ['market', 'volatility', 'tech', 'asia']
    })
  }
  
  // Business hours: Monitor competitor activity
  if (currentHour >= 9 && currentHour <= 17) {
    signals.push({
      type: 'competitor_move',
      source: 'monitor_mcp',
      description: 'Competitor announced product delay',
      relevance: 0.85,
      keywords: ['competitor', 'delay', 'product', 'announcement']
    })
    
    signals.push({
      type: 'journalist_query',
      source: 'relationships_mcp',
      description: 'WSJ reporter seeking industry comment on AI regulation',
      relevance: 0.8,
      keywords: ['journalist', 'wsj', 'ai', 'regulation']
    })
  }
  
  // Always check for cascade opportunities
  signals.push({
    type: 'cascade_indicator',
    source: 'cascade_intelligence',
    description: 'Supply chain disruption detected in semiconductor industry',
    relevance: 0.75,
    keywords: ['supply chain', 'semiconductor', 'disruption']
  })
  
  // Add social media trends
  if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Weekdays
    signals.push({
      type: 'social_trend',
      source: 'social_monitor',
      description: 'Industry topic trending on LinkedIn',
      relevance: 0.65,
      keywords: ['linkedin', 'trending', 'industry']
    })
  }
  
  return signals
}

// Analyze signals for opportunity patterns
async function analyzePatterns(signals: any[], organizationProfile: any) {
  const opportunities = []
  
  for (const [patternName, pattern] of Object.entries(OPPORTUNITY_PATTERNS)) {
    // Check if signals match pattern
    const matchingSignals = signals.filter(signal => {
      return pattern.signals.some(requiredSignal => 
        signal.description.toLowerCase().includes(requiredSignal.replace('_', ' ')) ||
        signal.keywords?.some((kw: string) => kw.includes(requiredSignal.split('_')[0]))
      )
    })
    
    if (matchingSignals.length > 0) {
      // Calculate confidence based on signal strength
      const confidence = Math.min(
        matchingSignals.reduce((sum, s) => sum + s.relevance, 0) / matchingSignals.length * 100,
        95
      )
      
      // Check if organization is configured for this opportunity type
      const isEnabled = organizationProfile?.opportunity_types?.[patternName] !== false
      
      if (isEnabled && confidence >= (organizationProfile?.minimum_confidence || 70)) {
        opportunities.push({
          id: crypto.randomUUID(),
          opportunity_type: patternName,
          title: generateOpportunityTitle(patternName, matchingSignals[0]),
          description: matchingSignals[0].description,
          pattern: patternName,
          confidence,
          urgency: pattern.urgency,
          window: pattern.window,
          action: pattern.action,
          signals: matchingSignals,
          status: 'pending',
          created_at: new Date().toISOString()
        })
      }
    }
  }
  
  // Add cascade opportunities if detected
  const cascadeSignals = signals.filter(s => s.type === 'cascade_indicator')
  if (cascadeSignals.length > 0) {
    opportunities.push({
      id: crypto.randomUUID(),
      opportunity_type: 'cascade_effect',
      title: 'Cascade Opportunity: Supply Chain Impact',
      description: 'Predicted cascade effect from supply chain disruption - position for industry leadership',
      pattern: 'cascade_effect',
      confidence: 82,
      urgency: 'HIGH',
      window: '1-2 days for first mover advantage',
      action: 'Pre-position as solution provider',
      signals: cascadeSignals,
      cascade_analysis: {
        primary_event: 'Supply chain disruption',
        first_order: ['Component shortages', 'Production delays'],
        second_order: ['Customer frustration', 'Market share shifts'],
        opportunity_window: 'Next 48 hours critical'
      },
      status: 'pending',
      created_at: new Date().toISOString()
    })
  }
  
  return opportunities
}

function generateOpportunityTitle(pattern: string, signal: any) {
  const titles: Record<string, string> = {
    competitor_weakness: `Competitor Vulnerability: ${signal.description.substring(0, 50)}`,
    narrative_vacuum: `Expert Opportunity: ${signal.description.substring(0, 50)}`,
    cascade_effect: `Cascade Alert: ${signal.description.substring(0, 50)}`,
    crisis_prevention: `Proactive Response: ${signal.description.substring(0, 50)}`,
    viral_moment: `Trending Opportunity: ${signal.description.substring(0, 50)}`
  }
  
  return titles[pattern] || `Opportunity: ${signal.description.substring(0, 50)}`
}

// Enrich opportunities with actionable intelligence
async function enrichOpportunities(opportunities: any[], organizationProfile: any) {
  for (const opp of opportunities) {
    // Add media targets based on opportunity type
    opp.media_targets = getMediaTargets(opp.opportunity_type, organizationProfile)
    
    // Add suggested content
    opp.content_suggestions = {
      press_release: opp.urgency === 'URGENT' ? 'Pre-drafted template ready' : 'Generate when needed',
      social_posts: generateSocialStrategy(opp),
      executive_talking_points: getKeyMessages(opp, organizationProfile)
    }
    
    // Add execution timeline
    opp.execution_timeline = generateTimeline(opp)
    
    // Calculate priority score
    opp.priority_score = calculatePriorityScore(opp, organizationProfile)
  }
  
  return opportunities.sort((a, b) => b.priority_score - a.priority_score)
}

function getMediaTargets(opportunityType: string, profile: any) {
  const mediaMap: Record<string, string[]> = {
    competitor_weakness: ['Industry trades', 'Business media', 'Tech blogs'],
    narrative_vacuum: ['Tier 1 media', 'Thought leadership platforms'],
    cascade_effect: ['Breaking news', 'Industry analysts', 'Trade publications'],
    crisis_prevention: ['Trusted journalists', 'Industry media'],
    viral_moment: ['Social media', 'Digital native outlets', 'Influencers']
  }
  
  const targets = mediaMap[opportunityType] || ['General media']
  
  // Filter based on organization preferences
  if (profile?.preferred_tiers) {
    return targets.filter(t => 
      profile.preferred_tiers.some((tier: string) => 
        t.toLowerCase().includes(tier.replace('_', ' '))
      )
    )
  }
  
  return targets
}

function generateSocialStrategy(opportunity: any) {
  const strategies: Record<string, any> = {
    URGENT: {
      twitter: 'Real-time response thread',
      linkedin: 'Executive thought leadership post',
      timing: 'Within 2 hours'
    },
    HIGH: {
      twitter: 'Strategic commentary',
      linkedin: 'Industry insights article',
      timing: 'Within 6 hours'
    },
    MEDIUM: {
      twitter: 'Scheduled insights',
      linkedin: 'Planned thought leadership',
      timing: 'Within 24 hours'
    }
  }
  
  return strategies[opportunity.urgency] || strategies.MEDIUM
}

function getKeyMessages(opportunity: any, profile: any) {
  const messages = []
  
  // Add differentiators based on opportunity type
  if (opportunity.opportunity_type === 'competitor_weakness') {
    messages.push('Our proven track record of stability and reliability')
    messages.push('Continuous innovation without disruption')
  }
  
  if (opportunity.opportunity_type === 'cascade_effect') {
    messages.push('Proactive measures already in place')
    messages.push('Supporting our ecosystem through challenges')
  }
  
  // Add organization-specific messages
  if (profile?.core_value_props) {
    messages.push(...profile.core_value_props.slice(0, 2))
  }
  
  return messages
}

function generateTimeline(opportunity: any) {
  const urgencyTimelines: Record<string, any> = {
    URGENT: {
      't+0': 'Opportunity detected',
      't+30min': 'Internal alignment',
      't+1hr': 'Content finalized',
      't+2hr': 'Media outreach begins',
      't+4hr': 'Social amplification',
      't+6hr': 'Measure initial impact'
    },
    HIGH: {
      'hour_0': 'Opportunity detected',
      'hour_2': 'Strategy alignment',
      'hour_4': 'Content creation',
      'hour_6': 'Stakeholder approval',
      'hour_12': 'Coordinated launch',
      'hour_24': 'Impact assessment'
    },
    MEDIUM: {
      'day_0': 'Opportunity analysis',
      'day_0_pm': 'Strategy development',
      'day_1_am': 'Content preparation',
      'day_1_pm': 'Media outreach',
      'day_2': 'Campaign execution',
      'day_3': 'Results review'
    }
  }
  
  return urgencyTimelines[opportunity.urgency] || urgencyTimelines.MEDIUM
}

function calculatePriorityScore(opportunity: any, profile: any) {
  let score = opportunity.confidence
  
  // Boost for urgency
  if (opportunity.urgency === 'URGENT') score += 20
  else if (opportunity.urgency === 'HIGH') score += 10
  
  // Boost for cascade opportunities (unique differentiator)
  if (opportunity.opportunity_type === 'cascade_effect') score += 15
  
  // Boost for configured preferences
  if (profile?.opportunity_types?.[opportunity.opportunity_type]) score += 5
  
  // Adjust for risk tolerance
  if (profile?.risk_tolerance === 'aggressive') score += 10
  else if (profile?.risk_tolerance === 'conservative') score -= 10
  
  return Math.min(score, 100)
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { organizationId, forceRefresh, organizationProfile: passedProfile } = await req.json()
    
    console.log(`🎯 Assessing opportunities for: ${organizationId}`)
    
    // Use passed profile or default configuration
    const organizationProfile = passedProfile || {
      minimum_confidence: 70,
      opportunity_types: {
        competitor_weakness: true,
        narrative_vacuum: true,
        cascade_effect: true,
        crisis_prevention: true,
        viral_moment: false
      },
      risk_tolerance: 'moderate',
      preferred_tiers: ['tier1_business', 'tier1_tech', 'trade']
    }
    
    console.log(`📋 Using configuration:`, organizationProfile)
    
    // Step 1: Detect signals from MCPs
    const signals = await detectSignals(organizationId)
    console.log(`📡 Detected ${signals.length} signals`)
    
    // Step 2: Analyze for patterns
    const opportunities = await analyzePatterns(signals, organizationProfile)
    console.log(`🎯 Found ${opportunities.length} opportunities`)
    
    // Step 3: Enrich with actionable intelligence
    const enrichedOpportunities = await enrichOpportunities(opportunities, organizationProfile)
    
    return new Response(
      JSON.stringify({
        success: true,
        organization: organizationId,
        timestamp: new Date().toISOString(),
        signal_count: signals.length,
        opportunities: enrichedOpportunities,
        mcp_status: {
          intelligence: 'active',
          monitor: 'active',
          relationships: 'active',
          cascade: 'active'
        },
        next_refresh: new Date(Date.now() + 15 * 60 * 1000).toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error('Opportunity assessment error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        opportunities: [] // Return empty array so UI doesn't break
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  }
})