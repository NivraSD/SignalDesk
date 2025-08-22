// Intelligence Synthesis V3 - Clean Entity-Focused Analysis
// Uses Claude Sonnet 4 to analyze WHO did WHAT and provide strategic insights

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')

console.log('🔑 Synthesis V3 - ANTHROPIC_API_KEY exists:', !!ANTHROPIC_API_KEY)
console.log('🔑 API Key length:', ANTHROPIC_API_KEY?.length || 0)

async function synthesizeWithClaude(intelligence: any, organization: any) {
  console.log(`🧠 V3 Synthesis: Analyzing intelligence for ${organization.name}`)
  console.log(`📊 Data to synthesize: ${intelligence.entity_actions?.all?.length || 0} actions, ${intelligence.topic_trends?.all?.length || 0} trends`)
  
  const entityActions = intelligence.entity_actions?.all?.slice(0, 15) || []  // Top 15 for richer analysis
  const topicTrends = intelligence.topic_trends?.all?.slice(0, 15) || []  // Top 15 for better patterns
  
  console.log('🔍 Entity Actions (top 15):', entityActions.length)
  console.log('📈 Topic Trends (top 15):', topicTrends.length)
  
  if (entityActions.length === 0 && topicTrends.length === 0) {
    console.log('⚠️ No intelligence data to synthesize')
    throw new Error('No intelligence data available for synthesis')
  }
  
  // Make 2 parallel calls for better completion
  const [offensiveIntel, defensiveIntel] = await Promise.all([
    synthesizeOffensiveIntel(entityActions, topicTrends, organization),
    synthesizeDefensiveIntel(entityActions, topicTrends, organization)
  ])
  
  console.log('🎯 Offensive Intel Keys:', Object.keys(offensiveIntel))
  console.log('🛡️ Defensive Intel Keys:', Object.keys(defensiveIntel))
  
  // Combine both responses
  return {
    ...offensiveIntel,
    ...defensiveIntel
  }
}

async function synthesizeOffensiveIntel(entityActions: any[], topicTrends: any[], organization: any) {
  const prompt = `You are an elite narrative intelligence analyst for ${organization.name}. Analyze how these developments affect reputation, perception, and narrative positioning.

ENTITY ACTIONS (${entityActions.length} captured):
${JSON.stringify(entityActions, null, 2)}

TOPIC TRENDS (${topicTrends.length} monitored):
${JSON.stringify(topicTrends, null, 2)}

Provide EXPANSIVE NARRATIVE INTELLIGENCE. We're monitoring ${entityActions.length} entity movements and ${topicTrends.length} trends. 
Show the SCALE of what's happening. Focus on REPUTATION, NARRATIVE, and PERCEPTION implications - NOT business strategy.

Write DETAILED NARRATIVES for each section. 
Think: "How does this reshape the narrative landscape? What perceptions are being created?"

Return this JSON with EXPANSIVE NARRATIVE ANALYSIS:
{
  "executive_summary": {
    "headline": "The dominant narrative emerging from all this activity - be specific with names and numbers",
    "overview": "Tell the complete story in 4-6 sentences. What narratives are competing for dominance? Who's winning the perception battle and why? What story will stakeholders remember?",
    "competitive_highlight": "Most significant competitor move and how it positions them in public perception",
    "market_highlight": "The trend that's reshaping how the market is perceived",
    "regulatory_highlight": "Regulatory development affecting industry reputation",
    "media_highlight": "The narrative that's gaining the most traction",
    "narrative_watch_points": [
      "Critical narrative development to monitor",
      "Another perception shift to track",
      "Third reputational consideration"
    ]
  },
  "competitive_landscape": {
    "competitor_positioning": [
      // List EVERY significant competitor move - show narrative positioning
      {"competitor": "Name", "action": "What they did", "narrative_impact": "EXPANSIVE analysis of how this positions them in public perception, what story they're telling, how stakeholders will interpret this, what reputation they're building"}
    ],
    "narrative_implications": "DETAILED NARRATIVE (500+ words): How are competitors reshaping the narrative landscape? What stories are they telling? How does this affect ${organization.name}'s perceived position? What new perceptions are being created about the industry and its players?",
    "perception_dynamics": "How public perception and stakeholder sentiment is shifting based on these moves",
    "reputation_considerations": "What these competitor moves mean for industry reputation and ${organization.name}'s standing",
    "narrative_positions": [
      "Position 1: How ${organization.name} could be perceived given these developments",
      "Position 2: Alternative narrative positioning",
      "Position 3: Another reputational consideration"
    ]
  },
  "market_dynamics": {
    "trend_narratives": [
      // Show ALL ${topicTrends.length} trends and their narrative impact
      {"trend": "Trend name", "narrative": "EXPANSIVE analysis of the story this trend tells, who's involved, what perceptions it creates", "momentum": "accelerating/stable/declining", "attention_level": "How much mindshare this has"}
    ],
    "narrative_analysis": "DETAILED NARRATIVE (500+ words): What story do these ${topicTrends.length} trends tell together? How is the market narrative evolving? What new perceptions are taking hold? How does this affect ${organization.name}'s narrative position?",
    "perception_opportunities": "EXPANSIVE analysis of how ${organization.name} could be perceived given these narrative trends",
    "narrative_evolution": "Where the market narrative is heading in 6-12 months based on current momentum",
    "reputation_landscape": "How the reputational landscape is shifting for ${organization.name} and the industry"
  }
}`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
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
    const content = result.content[0].text
    const parsed = JSON.parse(content.match(/\{[\s\S]*\}/)?.[0] || '{}')
    console.log('✅ Offensive intel synthesized')
    return parsed
  } catch (error) {
    console.error('Offensive synthesis error:', error)
    return {}
  }
}

async function synthesizeDefensiveIntel(entityActions: any[], topicTrends: any[], organization: any) {
  const prompt = `You are an elite narrative intelligence analyst for ${organization.name}. Analyze how regulatory, media, and future developments affect reputation and narrative positioning.

ENTITY ACTIONS (${entityActions.length} captured):
${JSON.stringify(entityActions, null, 2)}

TOPIC TRENDS (${topicTrends.length} monitored):
${JSON.stringify(topicTrends, null, 2)}

Provide EXPANSIVE NARRATIVE ANALYSIS. We're tracking ${entityActions.length} entity actions and ${topicTrends.length} trends.
Focus on REPUTATION, PERCEPTION, and NARRATIVE IMPLICATIONS for ${organization.name}, not business recommendations.

Return this JSON with EXPANSIVE NARRATIVE INTELLIGENCE:
{
  "regulatory_policy": {
    "regulatory_narrative": "EXPANSIVE NARRATIVE (300+ words): What story is emerging from regulatory developments? How are regulators positioning themselves and the industry? What narrative are they creating through the ${entityActions.length} actions we're tracking?",
    "regulatory_developments": [
      // Every regulatory signal affects perception
      {"regulator": "Entity", "development": "DETAILED analysis of what's happening and the narrative being created", "perception_impact": "How this affects public perception of the industry", "reputation_effect": "Impact on ${organization.name}'s reputation and standing"}
    ],
    "narrative_implications": "How does the regulatory narrative affect ${organization.name}'s reputation? What perceptions are being created about compliance, responsibility, and industry leadership?",
    "perception_landscape": "How ${organization.name} is likely to be perceived in this evolving regulatory narrative"
  },
  "media_sentiment": {
    "narrative_landscape": "EXPANSIVE ANALYSIS (400+ words): What stories are dominating media coverage? How are narratives evolving? What's capturing attention across the ${topicTrends.length} trends we're tracking? Who's controlling the narrative?",
    "media_coverage": [
      // Show the SCALE and diversity of narratives
      {"outlet": "Source", "topic": "What they're covering", "sentiment": "positive/neutral/negative", "narrative": "The specific story they're telling", "influence": "How this shapes public perception"}
    ],
    "perception_analysis": "Deep dive into how ${organization.name} and the industry are being portrayed. What narratives are sticking? How is public perception evolving?",
    "reputation_implications": "What do these media narratives mean for ${organization.name}'s reputation? How do they affect stakeholder trust and confidence?",
    "narrative_considerations": "Key narrative dynamics ${organization.name} should understand about how the story is being told"
  },
  "forward_look": {
    "future_narratives": "EXPANSIVE NARRATIVE (400+ words): Based on the ${entityActions.length} entity actions and ${topicTrends.length} trends, what narratives will dominate tomorrow? How will reputations evolve? What stories will shape perception?",
    "narrative_predictions": [
      // Multiple detailed narrative predictions
      {"timeframe": "Timeframe", "narrative_shift": "DETAILED prediction of how the narrative will evolve with evidence", "likelihood": 70, "signals": "What indicates this narrative shift", "reputation_impact": "How this affects ${organization.name}'s perceived position"}
    ],
    "perception_scenarios": "Multiple scenarios for how public perception and narrative could evolve, and what each means for ${organization.name}'s reputation",
    "narrative_preparation": "What narrative positions ${organization.name} should understand as the landscape evolves",
    "reputation_considerations": "Key reputational factors to monitor as these narratives develop"
  }
}`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
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
    const content = result.content[0].text
    const parsed = JSON.parse(content.match(/\{[\s\S]*\}/)?.[0] || '{}')
    console.log('✅ Defensive intel synthesized')
    return parsed
  } catch (error) {
    console.error('Defensive synthesis error:', error)
    return {}
  }
}

serve(async (req) => {
  console.log('🚀 Intelligence Synthesis V3 - Request received:', req.method)
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    if (!ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY not configured in environment')
    }
    
    const { intelligence, organization } = await req.json()
    console.log('📋 Synthesis V3 - Organization:', organization?.name)
    
    if (!intelligence || !organization?.name) {
      throw new Error('Intelligence data and organization are required')
    }
    
    console.log(`🔍 V3 Synthesis starting for ${organization.name}`)
    console.log(`📊 Processing ${intelligence.entity_actions?.total_count || 0} entity actions`)
    console.log(`📈 Processing ${intelligence.topic_trends?.total_monitored || 0} topic trends`)
    
    const analysis = await synthesizeWithClaude(intelligence, organization)
    console.log('🔑 Analysis keys:', Object.keys(analysis));
    
    // Build the final response optimized for frontend display
    const response = {
      success: true,
      organization: organization.name,
      timestamp: new Date().toISOString(),
      
      // Direct tab structure for frontend - ALL tabs from Claude's actual analysis
      tabs: {
        executive: analysis.executive_summary || {},
        competitive: analysis.competitive_landscape || {},
        market: analysis.market_dynamics || {},
        regulatory: analysis.regulatory_policy || {},
        media: analysis.media_sentiment || {},
        forward: analysis.forward_look || {},
        
        // Keep PR-focused structure as additional data
        narrative: { dominant_narratives: [], narrative_threats: [] },
        response: { immediate_responses: [], monitor_only: [] },
        messaging: { opportunities: [] },
        stakeholders: { stakeholder_groups: [] },
        tomorrow: { anticipated_headlines: [] }
      },
      
      // Quick access to critical items
      alerts: intelligence.entity_actions?.critical || [],
      
      // Statistics for display
      statistics: {
        entities_tracked: intelligence.statistics?.entities_tracked || 0,
        actions_captured: intelligence.statistics?.actions_captured || 0,
        topics_monitored: intelligence.statistics?.topics_monitored || 0,
        critical_items: intelligence.statistics?.critical_items || 0
      }
    }
    
    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error('❌ Synthesis V3 error:', error)
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      hasApiKey: !!ANTHROPIC_API_KEY
    })
    
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