// Intelligence Synthesis V4 - Clean, structured, no repetition
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')

async function synthesizeCleanIntelligence(intelligence: any, organization: any) {
  const entityActions = intelligence.entity_actions?.all || []
  const topicTrends = intelligence.topic_trends?.all || []
  
  // Group actions by type for cleaner organization
  const actionsByType = {
    competitor: entityActions.filter(a => a.type === 'competitor' || (!a.type && a.relevance > 0.7)),
    media: entityActions.filter(a => a.type === 'media'),
    regulatory: entityActions.filter(a => a.type === 'regulator'),
    market: entityActions.filter(a => a.type === 'general' || a.entity === 'Industry')
  }
  
  // Extract unique, high-value opportunities
  const opportunities = []
  const seenOpportunities = new Set()
  
  // Competitor response opportunities
  actionsByType.competitor.slice(0, 3).forEach(action => {
    const key = `${action.entity}-response`
    if (!seenOpportunities.has(key)) {
      seenOpportunities.add(key)
      opportunities.push({
        id: `opp-${Date.now()}-${Math.random()}`,
        type: 'competitive_response',
        title: `Counter ${action.entity}'s move`,
        description: action.action,
        urgency: action.impact === 'high' ? 'critical' : 'high',
        score: 85,
        action_plan: [
          'Analyze competitive announcement',
          'Identify differentiation angle',
          'Draft response messaging',
          'Execute media outreach'
        ],
        deadline: '48 hours',
        source: action.source
      })
    }
  })
  
  // Trending topic opportunities
  topicTrends.filter(t => t.mentions > 5).slice(0, 2).forEach(trend => {
    const key = `${trend.topic}-trend`
    if (!seenOpportunities.has(key)) {
      seenOpportunities.add(key)
      opportunities.push({
        id: `opp-${Date.now()}-${Math.random()}`,
        type: 'thought_leadership',
        title: `Lead on ${trend.topic}`,
        description: `${trend.topic} trending with ${trend.mentions} mentions`,
        urgency: 'high',
        score: 75,
        action_plan: [
          'Develop unique perspective',
          'Create thought leadership content',
          'Pitch to tier-1 media',
          'Amplify across channels'
        ],
        deadline: '72 hours',
        keywords: [trend.topic]
      })
    }
  })
  
  // Create clean, structured tabs without repetition
  const tabs = {
    // Executive Summary - Just the facts
    executive: {
      headline: `${entityActions.length} Actions | ${topicTrends.length} Trends | ${opportunities.length} Opportunities`,
      overview: generateCleanExecutiveSummary(actionsByType, topicTrends, organization),
      key_metrics: {
        entities_tracked: new Set(entityActions.map(a => a.entity)).size,
        actions_captured: entityActions.length,
        trends_identified: topicTrends.length,
        opportunities: opportunities.length
      },
      top_actions: actionsByType.competitor.slice(0, 3).map(a => ({
        entity: a.entity,
        action: a.action,
        impact: a.impact
      }))
    },
    
    // Competitive Intelligence - Structured data only
    competitive: {
      competitor_actions: actionsByType.competitor.map(a => ({
        entity: a.entity,
        action: a.action,
        source: a.source,
        url: a.url,
        timestamp: a.timestamp,
        impact: a.impact
      })),
      summary: actionsByType.competitor.length > 0 ? 
        `Tracking ${actionsByType.competitor.length} competitive moves` : 
        'No competitive activity detected'
    },
    
    // Market Trends - Clean trend data
    market: {
      market_trends: topicTrends.map(t => ({
        topic: t.topic,
        trend: t.trend,
        mentions: t.mentions,
        sentiment: 'neutral'
      })),
      summary: topicTrends.length > 0 ?
        `${topicTrends.length} trends identified` :
        'No significant trends detected'
    },
    
    // Positioning - Your competitive position
    positioning: {
      strengths: ['Market presence', 'Brand recognition', 'Innovation'],
      vulnerabilities: ['Response time', 'Media coverage'],
      opportunities: opportunities.slice(0, 3).map(o => o.title),
      threats: actionsByType.competitor.slice(0, 2).map(a => `${a.entity}: ${a.action}`)
    },
    
    // Between the Lines - Hidden insights
    between: {
      patterns: extractPatterns(entityActions),
      implications: deriveImplications(actionsByType),
      hidden_risks: identifyRisks(entityActions)
    },
    
    // Regulatory
    regulatory: {
      developments: actionsByType.regulatory.map(a => ({
        regulator: a.entity,
        action: a.action,
        impact: a.impact
      })),
      compliance_status: 'No immediate concerns'
    },
    
    // Thought Leadership
    thought: {
      topics: topicTrends.slice(0, 5).map(t => ({
        topic: t.topic,
        opportunity: `Lead conversation on ${t.topic}`
      })),
      recommended_angles: topicTrends.slice(0, 3).map(t => t.topic)
    },
    
    // Forward Looking
    forward: {
      next_24h: 'Monitor competitor responses',
      next_7d: 'Execute on identified opportunities',
      next_30d: 'Establish thought leadership position',
      key_dates: []
    }
  }
  
  return { tabs, opportunities, alerts: [], statistics: tabs.executive.key_metrics }
}

function generateCleanExecutiveSummary(actionsByType: any, trends: any[], org: any) {
  const parts = []
  
  if (actionsByType.competitor.length > 0) {
    parts.push(`${actionsByType.competitor.length} competitor actions detected`)
  }
  
  if (trends.length > 0) {
    const topTrend = trends[0]
    parts.push(`${topTrend.topic} trending (${topTrend.mentions} mentions)`)
  }
  
  if (actionsByType.media.length > 0) {
    parts.push(`${actionsByType.media.length} media mentions`)
  }
  
  return parts.join('. ') || 'No significant activity detected.'
}

function extractPatterns(actions: any[]) {
  const patterns = []
  
  // Time-based patterns
  const recentActions = actions.filter(a => {
    const actionTime = new Date(a.timestamp).getTime()
    const hourAgo = Date.now() - (60 * 60 * 1000)
    return actionTime > hourAgo
  })
  
  if (recentActions.length > 5) {
    patterns.push('Surge in activity in past hour')
  }
  
  // Entity patterns
  const entityCounts = {}
  actions.forEach(a => {
    entityCounts[a.entity] = (entityCounts[a.entity] || 0) + 1
  })
  
  Object.entries(entityCounts).forEach(([entity, count]: [string, any]) => {
    if (count > 3) {
      patterns.push(`${entity} unusually active (${count} actions)`)
    }
  })
  
  return patterns.slice(0, 3)
}

function deriveImplications(actionsByType: any) {
  const implications = []
  
  if (actionsByType.competitor.length > 3) {
    implications.push('Competitive pressure increasing')
  }
  
  if (actionsByType.regulatory.length > 0) {
    implications.push('Regulatory attention required')
  }
  
  if (actionsByType.media.length < 2) {
    implications.push('Media visibility opportunity')
  }
  
  return implications
}

function identifyRisks(actions: any[]) {
  const risks = []
  
  const highImpact = actions.filter(a => a.impact === 'high' || a.impact === 'critical')
  if (highImpact.length > 0) {
    risks.push(`${highImpact.length} high-impact events require response`)
  }
  
  const competitors = actions.filter(a => a.type === 'competitor')
  if (competitors.length > 5) {
    risks.push('Coordinated competitive activity detected')
  }
  
  return risks
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { organization, intelligence } = await req.json()
    
    if (!intelligence || (!intelligence.entity_actions?.all?.length && !intelligence.topic_trends?.all?.length)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No intelligence data available for synthesis'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    const result = await synthesizeCleanIntelligence(intelligence, organization)
    
    return new Response(
      JSON.stringify({
        success: true,
        ...result,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    console.error('Synthesis error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})