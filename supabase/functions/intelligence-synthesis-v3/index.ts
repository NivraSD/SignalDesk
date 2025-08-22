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
  const prompt = `You are an elite intelligence analyst for ${organization.name}. Analyze this intelligence to uncover what's REALLY happening.

ENTITY ACTIONS (${entityActions.length} captured):
${JSON.stringify(entityActions, null, 2)}

TOPIC TRENDS (${topicTrends.length} monitored):
${JSON.stringify(topicTrends, null, 2)}

Provide EXPANSIVE NARRATIVE ANALYSIS. We're monitoring ${entityActions.length} entity movements and ${topicTrends.length} market trends. 
Show the SCALE of what's happening. Focus on STRATEGIC IMPLICATIONS for ${organization.name}, not PR tactics.

Write DETAILED NARRATIVES for each section - don't constrain yourself to short fields. 
Think: "What does all this MEAN for ${organization.name}'s future?"

Return this JSON with EXPANSIVE, DETAILED analysis:
{
  "executive_summary": {
    "headline": "The big story that connects all the pieces - be specific with names and numbers",
    "overview": "Tell the complete narrative in 4-6 sentences. What's the chess game being played? Who's winning and why? What moves are coming next?",
    "competitive_highlight": "Most significant competitor development and what it reveals about their strategy",
    "market_highlight": "The market shift that changes the game",
    "regulatory_highlight": "Regulatory angle that affects everyone",
    "media_highlight": "The narrative that's gaining momentum",
    "immediate_actions": [
      "Specific action based on the intelligence",
      "Another specific action",
      "Third specific action"
    ]
  },
  "competitive_landscape": {
    "competitor_actions": [
      // List EVERY significant competitor move - show the VOLUME of activity
      {"competitor": "Name", "action": "What they did", "details": "EXPANSIVE analysis of strategic intent, capabilities revealed, market positioning, and what this signals about their next moves"}
    ],
    "strategic_implications": "DETAILED NARRATIVE (500+ words): What does all this competitor activity mean for ${organization.name}? How is the competitive landscape reshaping? Where are the opportunities and threats? What capabilities does ${organization.name} need to develop? What strategic moves should we consider?",
    "competitive_dynamics": "How power is shifting in the market and what it means for ${organization.name}'s position",
    "capability_gaps": "What competitor moves reveal about capabilities ${organization.name} needs",
    "strategic_options": [
      "Option 1: Detailed strategic response option",
      "Option 2: Another strategic path",
      "Option 3: Alternative approach"
    ]
  },
  "market_dynamics": {
    "market_trends": [
      // Show ALL ${topicTrends.length} trends we're tracking
      {"trend": "Trend name", "description": "EXPANSIVE analysis of what's driving this, who's involved, where it's heading", "momentum": "accelerating/stable/declining", "volume": "How much activity"}
    ],
    "market_analysis": "DETAILED NARRATIVE (500+ words): Connect all these trends. What's the bigger picture? How are these ${topicTrends.length} trends interconnected? What fundamental shifts are occurring? What does this mean for ${organization.name}'s market position?",
    "strategic_opportunities": "EXPANSIVE analysis of opportunities emerging from these trends for ${organization.name}",
    "market_evolution": "Where the market is heading in 6-12 months based on current momentum",
    "positioning_strategy": "How ${organization.name} should position itself given these market dynamics"
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
  const prompt = `You are an elite intelligence analyst for ${organization.name}. Analyze regulatory, media, and future risks/opportunities.

ENTITY ACTIONS (${entityActions.length} captured):
${JSON.stringify(entityActions, null, 2)}

TOPIC TRENDS (${topicTrends.length} monitored):
${JSON.stringify(topicTrends, null, 2)}

Provide EXPANSIVE STRATEGIC ANALYSIS. We're tracking ${entityActions.length} entity actions and ${topicTrends.length} trends.
Focus on IMPLICATIONS and STRATEGIC MEANING for ${organization.name}, not tactical PR responses.

Return this JSON with EXPANSIVE NARRATIVES and STRATEGIC INSIGHTS:
{
  "regulatory_policy": {
    "regulatory_landscape": "EXPANSIVE NARRATIVE (300+ words): What's happening in the regulatory space based on the ${entityActions.length} actions we're tracking? Connect the dots between different regulatory moves.",
    "regulatory_developments": [
      // Every regulatory signal matters
      {"regulator": "Entity", "development": "DETAILED analysis of what's happening, motivations, and trajectory", "timeline": "Key milestones", "strategic_impact": "How this reshapes ${organization.name}'s operating environment"}
    ],
    "strategic_implications": "What does the regulatory environment mean for ${organization.name}'s strategy? What capabilities become advantages? What business models are at risk?",
    "regulatory_positioning": "How ${organization.name} should position itself in this evolving regulatory landscape"
  },
  "media_sentiment": {
    "narrative_landscape": "EXPANSIVE ANALYSIS (400+ words): What narratives are dominating? How are they evolving? What's driving media attention across the ${topicTrends.length} trends we're tracking?",
    "media_coverage": [
      // Show the SCALE of coverage
      {"outlet": "Source", "topic": "What they're covering", "sentiment": "positive/neutral/negative", "narrative": "The story they're telling", "reach": "Influence and audience"}
    ],
    "sentiment_analysis": "Deep dive into how ${organization.name} and the industry are being perceived. What's driving sentiment? How is it evolving?",
    "narrative_implications": "What do these narratives mean for ${organization.name}'s strategic position? How do they affect stakeholder perceptions?",
    "strategic_communications": "How ${organization.name} should think about communications given this landscape - focus on strategic positioning, not tactics"
  },
  "forward_look": {
    "future_landscape": "EXPANSIVE NARRATIVE (400+ words): Based on the ${entityActions.length} entity actions and ${topicTrends.length} trends, paint the picture of what's coming. Connect the dots between current movements and future state.",
    "predictions": [
      // Multiple detailed predictions
      {"timeframe": "Timeframe", "prediction": "DETAILED prediction with evidence from current intelligence", "probability": 70, "indicators": "What signals this is coming", "strategic_implications": "What this means for ${organization.name}'s strategy and positioning"}
    ],
    "scenario_analysis": "Multiple future scenarios and their implications for ${organization.name}",
    "strategic_preparation": "What capabilities, relationships, and positions ${organization.name} needs to develop now for the future we see coming",
    "windows_of_opportunity": "Time-sensitive opportunities ${organization.name} should consider based on predicted developments"
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