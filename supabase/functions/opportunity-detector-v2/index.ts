// Opportunity Detector V2 - Transform Intelligence into Action
// Identifies opportunities from patterns, surprises, and narrative vacuums

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')

// Opportunity Types with different action templates
const OPPORTUNITY_TYPES = {
  COMPETITOR_WEAKNESS: {
    urgency: 'HIGH',
    window: '24-48 hours',
    actions: ['counter-narrative', 'press-release', 'thought-leadership']
  },
  NARRATIVE_VACUUM: {
    urgency: 'MEDIUM',
    window: '3-5 days',
    actions: ['exclusive-pitch', 'expert-positioning', 'content-series']
  },
  CASCADE_EFFECT: {
    urgency: 'STRATEGIC',
    window: '1-2 weeks',
    actions: ['multi-market-campaign', 'proactive-announcement', 'stakeholder-briefing']
  },
  CRISIS_PREVENTION: {
    urgency: 'URGENT',
    window: '6-12 hours',
    actions: ['rapid-response', 'stakeholder-alert', 'narrative-framing']
  },
  ALLIANCE_OPENING: {
    urgency: 'MEDIUM',
    window: '1 week',
    actions: ['partnership-exploration', 'joint-announcement', 'collaborative-narrative']
  },
  REGULATORY_SHIFT: {
    urgency: 'HIGH',
    window: '48-72 hours',
    actions: ['policy-position', 'industry-leadership', 'stakeholder-education']
  }
}

async function detectOpportunities(intelligence: any, organization: any) {
  const opportunities = []
  
  // 1. COMPETITOR WEAKNESS DETECTION
  const competitorWeaknesses = findCompetitorWeaknesses(intelligence)
  for (const weakness of competitorWeaknesses) {
    opportunities.push({
      type: 'COMPETITOR_WEAKNESS',
      title: `${weakness.competitor} Shows Vulnerability`,
      description: weakness.signal,
      confidence: weakness.confidence,
      window: '24-48 hours',
      urgency: 'HIGH',
      actions: generateCompetitorActions(weakness, organization),
      context: weakness
    })
  }
  
  // 2. NARRATIVE VACUUM DETECTION
  const narrativeVacuums = findNarrativeVacuums(intelligence)
  for (const vacuum of narrativeVacuums) {
    opportunities.push({
      type: 'NARRATIVE_VACUUM',
      title: `Unclaimed Narrative: ${vacuum.topic}`,
      description: vacuum.description,
      confidence: vacuum.potential,
      window: '3-5 days',
      urgency: 'MEDIUM',
      actions: generateVacuumActions(vacuum, organization),
      context: vacuum
    })
  }
  
  // 3. CASCADE EFFECT PREDICTION
  const cascadeEffects = predictCascadeEffects(intelligence)
  for (const cascade of cascadeEffects) {
    opportunities.push({
      type: 'CASCADE_EFFECT',
      title: `Cascade Opportunity: ${cascade.trigger}`,
      description: cascade.prediction,
      confidence: cascade.likelihood,
      window: cascade.timeline,
      urgency: 'STRATEGIC',
      actions: generateCascadeActions(cascade, organization),
      context: cascade
    })
  }
  
  // 4. PATTERN BREAKS AS OPPORTUNITIES
  const patternBreaks = findPatternBreaks(intelligence)
  for (const pattern of patternBreaks) {
    opportunities.push({
      type: 'PATTERN_BREAK',
      title: `Unusual Activity: ${pattern.entity}`,
      description: pattern.anomaly,
      confidence: pattern.significance,
      window: 'Immediate',
      urgency: pattern.urgency,
      actions: generatePatternActions(pattern, organization),
      context: pattern
    })
  }
  
  return opportunities
}

function findCompetitorWeaknesses(intelligence: any) {
  const weaknesses = []
  const entityActions = intelligence.entity_actions?.all || []
  
  // Look for weakness signals
  const weaknessKeywords = ['departed', 'resigned', 'lawsuit', 'criticized', 'delayed', 'cancelled', 'failed', 'struggling']
  
  for (const action of entityActions) {
    if (action.entity_type === 'competitors') {
      const hasWeaknessSignal = weaknessKeywords.some(keyword => 
        action.headline?.toLowerCase().includes(keyword))
      
      if (hasWeaknessSignal) {
        weaknesses.push({
          competitor: action.entity,
          signal: action.headline,
          timestamp: action.timestamp,
          confidence: calculateWeaknessConfidence(action),
          vulnerability_type: identifyVulnerabilityType(action.headline)
        })
      }
    }
  }
  
  return weaknesses
}

function findNarrativeVacuums(intelligence: any) {
  const vacuums = []
  const trends = intelligence.topic_trends?.all || []
  
  // Find topics with high activity but no clear leader
  for (const trend of trends) {
    if (trend.momentum === 'accelerating' && trend.article_count > 5) {
      // Check if anyone is dominating this narrative
      const hasLeader = trend.sample_headlines?.some((headline: string) => 
        headline.includes('leads') || headline.includes('dominates'))
      
      if (!hasLeader) {
        vacuums.push({
          topic: trend.topic,
          description: `Rising topic with ${trend.article_count} articles but no clear voice`,
          search_volume_trend: trend.momentum,
          potential: calculateVacuumPotential(trend),
          entry_strategy: suggestEntryStrategy(trend)
        })
      }
    }
  }
  
  return vacuums
}

function predictCascadeEffects(intelligence: any) {
  const cascades = []
  const entityActions = intelligence.entity_actions?.all || []
  
  // Look for regulatory or market actions that typically cascade
  const cascadeTriggers = ['proposes', 'mandates', 'bans', 'approves', 'launches', 'enters']
  
  for (const action of entityActions) {
    const isCascadeTrigger = cascadeTriggers.some(trigger => 
      action.headline?.toLowerCase().includes(trigger))
    
    if (isCascadeTrigger) {
      cascades.push({
        trigger: action.headline,
        entity: action.entity,
        prediction: generateCascadePrediction(action),
        timeline: '1-2 weeks',
        likelihood: calculateCascadeLikelihood(action),
        markets_affected: identifyAffectedMarkets(action)
      })
    }
  }
  
  return cascades
}

function findPatternBreaks(intelligence: any) {
  const breaks = []
  
  // This would integrate with the memory system to detect anomalies
  // For now, we'll look for unusual timing and behavior
  const entityActions = intelligence.entity_actions?.all || []
  
  // Group actions by entity
  const entityBehavior: any = {}
  for (const action of entityActions) {
    if (!entityBehavior[action.entity]) {
      entityBehavior[action.entity] = []
    }
    entityBehavior[action.entity].push(action)
  }
  
  // Find entities with unusual activity levels
  for (const [entity, actions] of Object.entries(entityBehavior)) {
    if ((actions as any[]).length > 2) {
      breaks.push({
        entity,
        anomaly: `Unusually high activity: ${(actions as any[]).length} actions in 48 hours`,
        significance: 'HIGH',
        urgency: 'HIGH',
        pattern_type: 'activity_spike'
      })
    }
  }
  
  return breaks
}

function calculateWeaknessConfidence(action: any): number {
  let confidence = 60 // base
  
  // Executive departure = high confidence
  if (action.headline?.includes('CEO') || action.headline?.includes('CFO')) {
    confidence += 30
  }
  
  // Legal issues = high confidence
  if (action.headline?.includes('lawsuit') || action.headline?.includes('investigation')) {
    confidence += 20
  }
  
  return Math.min(95, confidence)
}

function calculateVacuumPotential(trend: any): number {
  let potential = 50 // base
  
  if (trend.momentum === 'accelerating') potential += 30
  if (trend.article_count > 10) potential += 20
  
  return Math.min(95, potential)
}

function calculateCascadeLikelihood(action: any): number {
  let likelihood = 40 // base
  
  // Regulatory actions cascade more
  if (action.entity_type === 'geopolitical' || action.entity_type === 'regulatory') {
    likelihood += 30
  }
  
  // Major market actions cascade
  if (action.headline?.includes('billion') || action.headline?.includes('major')) {
    likelihood += 20
  }
  
  return Math.min(90, likelihood)
}

function identifyVulnerabilityType(headline: string): string {
  if (headline.includes('resign') || headline.includes('depart')) return 'leadership_transition'
  if (headline.includes('lawsuit') || headline.includes('sue')) return 'legal_challenge'
  if (headline.includes('delay') || headline.includes('cancel')) return 'execution_failure'
  if (headline.includes('loss') || headline.includes('decline')) return 'financial_weakness'
  return 'general_vulnerability'
}

function suggestEntryStrategy(trend: any): string {
  if (trend.category === 'technology') return 'thought_leadership_piece'
  if (trend.category === 'regulatory') return 'policy_position_paper'
  if (trend.category === 'market') return 'exclusive_data_release'
  return 'expert_commentary'
}

function generateCascadePrediction(action: any): string {
  const predictions = {
    regulatory: 'Other jurisdictions likely to follow within 2 weeks',
    market: 'Competitors forced to respond within 48 hours',
    technology: 'Industry standards shift expected within month',
    social: 'Public sentiment cascade across platforms within days'
  }
  
  return predictions[action.entity_type as keyof typeof predictions] || 
    'Market dynamics shift expected'
}

function identifyAffectedMarkets(action: any): string[] {
  // Simplified - would use more sophisticated analysis
  if (action.headline?.includes('global')) return ['North America', 'Europe', 'Asia']
  if (action.headline?.includes('US') || action.headline?.includes('America')) return ['United States']
  if (action.headline?.includes('EU') || action.headline?.includes('Europe')) return ['European Union']
  return ['Primary market']
}

function generateCompetitorActions(weakness: any, organization: any) {
  return [
    {
      action: 'counter_narrative',
      template: `While ${weakness.competitor} faces ${weakness.vulnerability_type}, ${organization.name} continues to...`,
      timing: 'Within 24 hours',
      channels: ['press_release', 'executive_linkedin']
    },
    {
      action: 'journalist_pitch',
      template: `Exclusive: How ${organization.name}'s stability contrasts with industry turbulence`,
      timing: 'Within 12 hours',
      channels: ['targeted_media']
    }
  ]
}

function generateVacuumActions(vacuum: any, organization: any) {
  return [
    {
      action: 'thought_leadership',
      template: `${organization.name}'s perspective on ${vacuum.topic}`,
      timing: 'Within 48 hours',
      channels: ['blog', 'linkedin', 'media_exclusive']
    },
    {
      action: 'expert_positioning',
      template: `Position executive as go-to expert on ${vacuum.topic}`,
      timing: 'Within 72 hours',
      channels: ['speaker_bureaus', 'podcast_pitches']
    }
  ]
}

function generateCascadeActions(cascade: any, organization: any) {
  return [
    {
      action: 'proactive_announcement',
      template: `${organization.name} ahead of the curve on ${cascade.trigger}`,
      timing: 'Before cascade begins',
      channels: ['press_release', 'stakeholder_briefing']
    },
    {
      action: 'multi_market_preparation',
      template: `Localized responses for ${cascade.markets_affected.length} markets`,
      timing: 'Within 1 week',
      channels: ['regional_media', 'local_stakeholders']
    }
  ]
}

function generatePatternActions(pattern: any, organization: any) {
  return [
    {
      action: 'monitoring_alert',
      template: `Unusual activity detected: ${pattern.entity}`,
      timing: 'Immediate',
      channels: ['internal_alert']
    },
    {
      action: 'contingency_preparation',
      template: `Prepare response to potential ${pattern.pattern_type}`,
      timing: 'Within 6 hours',
      channels: ['crisis_team']
    }
  ]
}

async function analyzeWithClaude(opportunities: any[], organization: any) {
  const prompt = `You are a strategic opportunity analyst for ${organization.name}. 
  
Analyze these detected opportunities and provide ACTIONABLE insights:

OPPORTUNITIES DETECTED:
${JSON.stringify(opportunities, null, 2)}

Your mission:
1. Rank opportunities by potential impact
2. Identify which can be combined for maximum effect
3. Spot any risks in acting on these opportunities
4. Suggest specific first actions for top 3 opportunities
5. Find the BOLDEST move ${organization.name} could make

Return a JSON with strategic recommendations focused on ACTION, not analysis.`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
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

    const result = await response.json()
    return JSON.parse(result.content[0].text)
  } catch (error) {
    console.error('Claude analysis error:', error)
    return null
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { intelligence, organization } = await req.json()
    
    if (!intelligence || !organization?.name) {
      throw new Error('Intelligence data and organization required')
    }
    
    // Detect opportunities from intelligence
    const opportunities = await detectOpportunities(intelligence, organization)
    
    // Get Claude's strategic analysis
    const strategicAnalysis = await analyzeWithClaude(opportunities, organization)
    
    // Sort by urgency and confidence
    opportunities.sort((a, b) => {
      const urgencyScore = { URGENT: 4, HIGH: 3, MEDIUM: 2, STRATEGIC: 1 }
      const aScore = urgencyScore[a.urgency as keyof typeof urgencyScore] * a.confidence
      const bScore = urgencyScore[b.urgency as keyof typeof urgencyScore] * b.confidence
      return bScore - aScore
    })
    
    return new Response(
      JSON.stringify({
        success: true,
        organization: organization.name,
        timestamp: new Date().toISOString(),
        opportunities: opportunities.slice(0, 10), // Top 10
        strategic_analysis: strategicAnalysis,
        summary: {
          total_opportunities: opportunities.length,
          urgent_count: opportunities.filter(o => o.urgency === 'URGENT').length,
          high_value_count: opportunities.filter(o => o.confidence > 80).length,
          action_ready: opportunities.filter(o => o.actions?.length > 0).length
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error('Opportunity detection error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  }
})