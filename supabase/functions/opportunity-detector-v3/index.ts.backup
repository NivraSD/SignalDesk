// Opportunity Detector V3 - Consumes Intelligence Hub data to detect real opportunities
// NO FALLBACKS, NO TEMPLATES - Only real opportunities from actual stakeholder signals

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')

// Analyze stakeholder actions to find opportunities
async function detectOpportunitiesFromIntelligence(intelligence: any, organization: any) {
  console.log('🔍 Analyzing intelligence for opportunities...')
  
  const opportunities = []
  const { entity_actions, topic_trends } = intelligence
  
  if (!entity_actions?.all || entity_actions.all.length === 0) {
    console.log('⚠️ No stakeholder actions to analyze')
    return []
  }
  
  // Group actions by stakeholder type
  const stakeholderActions = {
    competitors: [],
    regulators: [],
    activists: [],
    media: [],
    investors: [],
    partners: [],
    other: []
  }
  
  // Categorize all actions
  for (const action of entity_actions.all) {
    const category = stakeholderActions[action.entity_type] || stakeholderActions.other
    category.push(action)
  }
  
  console.log('📊 Stakeholder actions breakdown:', {
    competitors: stakeholderActions.competitors.length,
    regulators: stakeholderActions.regulators.length,
    activists: stakeholderActions.activists.length,
    media: stakeholderActions.media.length,
    investors: stakeholderActions.investors.length
  })
  
  // 1. COMPETITIVE OPPORTUNITIES - From actual competitor weaknesses
  for (const action of stakeholderActions.competitors) {
    const weaknessSignals = ['lawsuit', 'breach', 'outage', 'decline', 'loss', 'struggle', 'delay', 'issue', 'problem', 'layoff']
    const hasWeakness = weaknessSignals.some(signal => 
      action.headline?.toLowerCase().includes(signal) ||
      action.action?.toLowerCase().includes(signal)
    )
    
    if (hasWeakness) {
      opportunities.push({
        id: crypto.randomUUID(),
        type: 'competitive_advantage',
        title: `Competitor Vulnerability: ${action.entity}`,
        description: `${action.entity} is experiencing challenges: "${action.headline}". This creates an opportunity to position ${organization.name} as the stable, reliable alternative.`,
        source: {
          stakeholder: action.entity,
          stakeholder_type: 'competitor',
          signal: action.headline,
          url: action.url,
          timestamp: action.timestamp
        },
        urgency: 'HIGH',
        window: '48-72 hours',
        confidence: 85,
        actions: [
          `Draft messaging highlighting ${organization.name}'s stability and reliability`,
          `Reach out to ${action.entity}'s key customers with targeted offers`,
          `Prepare sales team with competitive battle cards`,
          `Monitor social media for customer complaints about ${action.entity}`
        ]
      })
    }
  }
  
  // 2. REGULATORY OPPORTUNITIES - From regulatory movements
  for (const action of stakeholderActions.regulators) {
    const opportunitySignals = ['new regulation', 'policy change', 'investigation', 'ruling', 'guidance']
    const isOpportunity = opportunitySignals.some(signal =>
      action.headline?.toLowerCase().includes(signal)
    )
    
    if (isOpportunity) {
      opportunities.push({
        id: crypto.randomUUID(),
        type: 'regulatory_positioning',
        title: `Regulatory Development: ${action.entity}`,
        description: `${action.entity} has made a regulatory move: "${action.headline}". Early compliance or thought leadership can position ${organization.name} as an industry leader.`,
        source: {
          stakeholder: action.entity,
          stakeholder_type: 'regulator',
          signal: action.headline,
          url: action.url,
          timestamp: action.timestamp
        },
        urgency: 'MEDIUM',
        window: '1-2 weeks',
        confidence: 75,
        actions: [
          `Analyze the regulatory change and its implications`,
          `Prepare a public statement on ${organization.name}'s position`,
          `Brief executive team on compliance requirements`,
          `Consider thought leadership opportunity on this topic`
        ]
      })
    }
  }
  
  // 3. ACTIVIST OPPORTUNITIES - From activist campaigns
  for (const action of stakeholderActions.activists) {
    opportunities.push({
      id: crypto.randomUUID(),
      type: 'reputation_management',
      title: `Activist Focus: ${action.entity}`,
      description: `${action.entity} is active: "${action.headline}". Proactive engagement or response needed to protect ${organization.name}'s reputation.`,
      source: {
        stakeholder: action.entity,
        stakeholder_type: 'activist',
        signal: action.headline,
        url: action.url,
        timestamp: action.timestamp
      },
      urgency: action.headline?.toLowerCase().includes(organization.name.toLowerCase()) ? 'CRITICAL' : 'MEDIUM',
      window: '24-48 hours',
      confidence: 80,
      actions: [
        `Monitor the campaign's demands and public response`,
        `Prepare Q&A for potential media inquiries`,
        `Review ${organization.name}'s practices related to the campaign focus`,
        `Consider proactive transparency measures`
      ]
    })
  }
  
  // 4. MEDIA OPPORTUNITIES - From media coverage gaps
  for (const action of stakeholderActions.media.slice(0, 3)) {
    opportunities.push({
      id: crypto.randomUUID(),
      type: 'media_engagement',
      title: `Media Opportunity: ${action.entity}`,
      description: `${action.entity} is covering: "${action.headline}". Opportunity to provide expert commentary or exclusive insights.`,
      source: {
        stakeholder: action.entity,
        stakeholder_type: 'media',
        signal: action.headline,
        url: action.url,
        timestamp: action.timestamp
      },
      urgency: 'MEDIUM',
      window: '2-3 days',
      confidence: 70,
      actions: [
        `Identify relevant ${organization.name} executive for commentary`,
        `Prepare talking points on the topic`,
        `Reach out to journalist with exclusive angle`,
        `Prepare supporting data and case studies`
      ]
    })
  }
  
  // 5. TRENDING TOPIC OPPORTUNITIES - From topic momentum
  if (topic_trends?.all) {
    for (const trend of topic_trends.all.slice(0, 2)) {
      if (trend.momentum === 'accelerating' || trend.momentum === 'growing') {
        opportunities.push({
          id: crypto.randomUUID(),
          type: 'narrative_leadership',
          title: `Trending Topic: ${trend.topic}`,
          description: `"${trend.topic}" is gaining momentum with ${trend.article_count} articles. Opportunity for ${organization.name} to lead the narrative.`,
          source: {
            topic: trend.topic,
            momentum: trend.momentum,
            article_count: trend.article_count,
            sample_headlines: trend.sample_headlines
          },
          urgency: trend.momentum === 'accelerating' ? 'HIGH' : 'MEDIUM',
          window: '3-5 days',
          confidence: 75,
          actions: [
            `Develop ${organization.name}'s position on ${trend.topic}`,
            `Create thought leadership content (blog, whitepaper, video)`,
            `Brief spokespeople on key messages`,
            `Identify speaking opportunities at relevant events`
          ]
        })
      }
    }
  }
  
  // Sort by confidence and urgency
  return opportunities.sort((a, b) => {
    const urgencyWeight = { 'CRITICAL': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 }
    const aScore = (a.confidence * urgencyWeight[a.urgency]) || 0
    const bScore = (b.confidence * urgencyWeight[b.urgency]) || 0
    return bScore - aScore
  })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { intelligence, organization } = await req.json()
    
    if (!intelligence || !organization) {
      throw new Error('Intelligence data and organization are required')
    }
    
    console.log(`🎯 Opportunity Detection for ${organization.name}`)
    console.log(`📊 Analyzing ${intelligence.entity_actions?.total_count || 0} stakeholder actions`)
    console.log(`📈 Analyzing ${intelligence.topic_trends?.total_monitored || 0} trending topics`)
    
    // Detect opportunities from actual intelligence
    const opportunities = await detectOpportunitiesFromIntelligence(intelligence, organization)
    
    console.log(`✅ Detected ${opportunities.length} real opportunities`)
    
    return new Response(
      JSON.stringify({
        success: true,
        organization: organization.name,
        timestamp: new Date().toISOString(),
        opportunities,
        summary: {
          total: opportunities.length,
          by_type: opportunities.reduce((acc, opp) => {
            acc[opp.type] = (acc[opp.type] || 0) + 1
            return acc
          }, {}),
          high_urgency: opportunities.filter(o => o.urgency === 'HIGH' || o.urgency === 'CRITICAL').length
        },
        message: opportunities.length > 0 
          ? `Found ${opportunities.length} actionable opportunities from stakeholder intelligence`
          : 'No immediate opportunities detected from current intelligence'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error('❌ Opportunity detection error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        opportunities: [] // Return empty array, no fallbacks
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  }
})