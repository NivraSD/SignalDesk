// PR-Focused Synthesis - Actionable Intelligence for PR Professionals
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"

interface PRDashboard {
  now: {
    urgent_actions: any[]
    active_conversations: any[]
    response_needed: any[]
    monitoring: any[]
  }
  opportunities: {
    media_pitches: any[]
    thought_leadership: any[]
    newsjacking: any[]
  }
  intel: {
    competitor_activity: any[]
    market_dynamics: any[]
    stakeholder_sentiment: any[]
  }
  execute: {
    action_items: any[]
    talking_points: any[]
    media_targets: any[]
  }
}

async function synthesizePRIntelligence(intelligence: any, organization: any): Promise<PRDashboard> {
  const dashboard: PRDashboard = {
    now: {
      urgent_actions: [],
      active_conversations: [],
      response_needed: [],
      monitoring: []
    },
    opportunities: {
      media_pitches: [],
      thought_leadership: [],
      newsjacking: []
    },
    intel: {
      competitor_activity: [],
      market_dynamics: [],
      stakeholder_sentiment: []
    },
    execute: {
      action_items: [],
      talking_points: [],
      media_targets: []
    }
  }
  
  // Process competitor moves into urgent actions
  if (intelligence.competitor_moves) {
    intelligence.competitor_moves.forEach((move: any) => {
      // Add to urgent actions if recent
      if (move.response_urgency === 'high') {
        dashboard.now.urgent_actions.push({
          type: 'Competitive Response',
          competitor: move.competitor,
          their_move: move.headline,
          our_angle: move.pr_angle,
          action: `Draft response emphasizing ${organization.name}'s differentiation`,
          deadline: '48 hours',
          priority: 'HIGH'
        })
        
        dashboard.now.response_needed.push({
          trigger: `${move.competitor}: ${move.type}`,
          response: move.pr_angle,
          channels: ['Media statement', 'Blog post', 'Social media']
        })
      }
      
      // Add to competitor intel
      dashboard.intel.competitor_activity.push({
        competitor: move.competitor,
        activity: move.headline,
        publication: move.publication,
        journalist: move.journalist,
        url: move.url,
        implications: `${move.competitor} gaining media attention for ${move.type}`
      })
      
      // Create media pitch opportunity
      if (move.journalist) {
        dashboard.opportunities.media_pitches.push({
          journalist: move.journalist,
          publication: move.publication,
          recent_coverage: move.headline,
          pitch_angle: `${organization.name}'s perspective on ${move.type}`,
          talking_points: [
            `Our differentiated approach to ${move.type}`,
            `Why customers choose ${organization.name}`,
            `Market validation of our strategy`
          ],
          urgency: 'Strike while topic is hot'
        })
      }
    })
  }
  
  // Process trending narratives into opportunities
  if (intelligence.trending_narratives) {
    intelligence.trending_narratives.forEach((narrative: any) => {
      dashboard.opportunities.thought_leadership.push({
        topic: narrative.topics[0],
        angle: narrative.opportunity,
        action: narrative.action,
        why_now: 'Topic gaining media traction',
        content_ideas: [
          `Op-ed: "${organization.name}'s View on ${narrative.topics[0]}"`,
          `Data report on ${narrative.topics[0]} trends`,
          `Executive interview on ${narrative.topics[0]}`
        ]
      })
      
      dashboard.now.active_conversations.push({
        topic: narrative.topics[0],
        momentum: 'Growing',
        our_position: 'Opportunity to lead',
        action: 'Develop and pitch perspective'
      })
    })
  }
  
  // Process media opportunities
  if (intelligence.media_opportunities) {
    intelligence.media_opportunities.forEach((opp: any) => {
      if (opp.type === 'competitive_response') {
        dashboard.opportunities.newsjacking.push({
          opportunity: opp.headline,
          angle: opp.angle,
          urgency: opp.urgency,
          action: opp.action,
          deadline: opp.deadline
        })
      }
      
      dashboard.execute.action_items.push({
        task: opp.action,
        deadline: opp.deadline,
        priority: opp.urgency === 'high' ? 'TODAY' : 'THIS WEEK',
        owner: 'PR Team',
        status: 'TODO'
      })
    })
  }
  
  // Process journalist activity into media targets
  if (intelligence.journalist_activity) {
    const journalistMap = new Map()
    
    intelligence.journalist_activity.forEach((activity: any) => {
      if (!journalistMap.has(activity.name)) {
        journalistMap.set(activity.name, {
          name: activity.name,
          publication: activity.publication,
          recent_articles: [],
          topics: new Set(),
          pitch_readiness: 'HIGH'
        })
      }
      
      const journalist = journalistMap.get(activity.name)
      journalist.recent_articles.push(activity.recent_article)
      journalist.topics.add(activity.topic)
    })
    
    dashboard.execute.media_targets = Array.from(journalistMap.values()).map(j => ({
      ...j,
      topics: Array.from(j.topics),
      pitch_angle: `Similar to their ${j.topics[0]} coverage but with ${organization.name} perspective`
    }))
  }
  
  // Process crisis signals
  if (intelligence.crisis_signals && intelligence.crisis_signals.length > 0) {
    intelligence.crisis_signals.forEach((signal: any) => {
      dashboard.now.monitoring.push({
        type: 'Crisis Signal',
        entity: signal.entity,
        issue: signal.issue,
        opportunity: signal.opportunity,
        action: signal.action,
        status: 'MONITORING'
      })
    })
  }
  
  // Generate talking points
  dashboard.execute.talking_points = [
    {
      topic: 'Competitive Differentiation',
      points: [
        `${organization.name} focuses on customer outcomes, not just features`,
        'Our proven track record speaks for itself',
        'We innovate based on real customer needs'
      ]
    },
    {
      topic: 'Market Leadership',
      points: [
        `${organization.name} sets the standard in ${organization.industry}`,
        'Our vision aligns with where the market is heading',
        'Customers trust us for mission-critical needs'
      ]
    }
  ]
  
  // Add market dynamics
  const marketThemes = new Set()
  intelligence.trending_narratives?.forEach((n: any) => {
    n.topics?.forEach((t: string) => marketThemes.add(t))
  })
  
  dashboard.intel.market_dynamics = Array.from(marketThemes).slice(0, 5).map(theme => ({
    theme,
    relevance: 'HIGH',
    opportunity: `Position ${organization.name} as leader in ${theme}`,
    risk: `Competitors may claim ${theme} narrative first`
  }))
  
  return dashboard
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { organization, intelligence } = await req.json()
    
    if (!intelligence) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No intelligence data provided'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    const dashboard = await synthesizePRIntelligence(intelligence, organization)
    
    // Calculate statistics
    const stats = {
      urgent_actions: dashboard.now.urgent_actions.length,
      opportunities: dashboard.opportunities.media_pitches.length + 
                    dashboard.opportunities.thought_leadership.length +
                    dashboard.opportunities.newsjacking.length,
      competitors_tracked: dashboard.intel.competitor_activity.length,
      journalists_identified: dashboard.execute.media_targets.length
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        dashboard,
        stats,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    console.error('PR Synthesis error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})