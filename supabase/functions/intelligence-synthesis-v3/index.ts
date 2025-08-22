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

Create a comprehensive analysis that tells the FULL STORY. Don't just list - SYNTHESIZE and CONNECT.

Return this JSON with RICH, DETAILED content:
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
      // List ALL significant competitor moves from the data
      {"competitor": "Actual name from data", "action": "What they actually did", "details": "Deep analysis of why this matters and what they're really trying to achieve"}
    ],
    "competitive_implications": [
      // Multiple implications - be comprehensive
      {"impact": "First-order effect", "severity": "Why this fundamentally changes competitive dynamics"},
      {"impact": "Second-order effect", "severity": "The cascade this triggers"}
    ],
    "pr_strategy": "Detailed strategy for positioning ${organization.name} given all these competitor moves",
    "key_messages": [
      "Specific message that counters competitor narrative",
      "Another key message based on the intelligence"
    ],
    "do_not_say": ["What to avoid saying given current dynamics"]
  },
  "market_dynamics": {
    "market_trends": [
      // Analyze ALL significant trends from the data
      {"trend": "Specific trend from data", "description": "Rich analysis of drivers, stakeholders, and trajectory", "momentum": "accelerating/stable/declining"}
    ],
    "opportunities": [
      // Multiple opportunities based on the trends
      {"opportunity": "Specific opportunity", "description": "Detailed explanation of how ${organization.name} can capitalize"}
    ],
    "market_implications": [
      // Several implications
      {"implication": "How market is restructuring", "what_it_means_for_us": "Specific impact on ${organization.name}", "pr_response": "How to message this"}
    ],
    "market_narrative": "The story of where the market is heading and ${organization.name}'s role",
    "thought_leadership": [
      "Specific contrarian position ${organization.name} should take",
      "Another thought leadership opportunity"
    ]
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
        max_tokens: 3500,
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

Provide COMPREHENSIVE analysis of defensive positioning and future preparation.

Return this JSON with DETAILED, NARRATIVE content:
{
  "regulatory_policy": {
    "regulatory_developments": [
      // Analyze ALL regulatory signals in the data
      {"regulator": "Specific entity from data", "development": "Full story of what's happening and hidden agenda", "timeline": "Realistic timeline with key milestones", "what_it_means_for_us": "Detailed impact analysis for ${organization.name}", "pr_response": "Complete messaging strategy"}
    ],
    "compliance_requirements": [
      // Multiple requirements emerging
      {"requirement": "Detailed requirement", "action": "Specific steps ${organization.name} should take"}
    ],
    "regulatory_stance": "Comprehensive position ${organization.name} should take given the landscape",
    "stakeholder_messages": [
      // Messages for each key stakeholder group
      {"audience": "Specific group", "message": "Tailored message based on intelligence"}
    ]
  },
  "media_sentiment": {
    "media_coverage": [
      // Analyze patterns in media coverage
      {"outlet": "Key outlets covering the space", "topic": "What they're focusing on", "sentiment": "positive/neutral/negative", "influence": "Their reach and impact"}
    ],
    "social_trends": [
      // Multiple social trends from the data
      {"platform": "Where conversation is happening", "trend": "What's gaining traction", "volume": "Quantify the momentum"}
    ],
    "reputation_impact": "Detailed analysis of how current coverage affects ${organization.name}'s reputation",
    "sentiment_trend": "Where sentiment is heading and why",
    "narrative_risks": [
      "Specific narrative that could damage ${organization.name}",
      "Another risk narrative emerging"
    ],
    "what_it_means_for_us": "Complete analysis of media landscape impact on ${organization.name}",
    "pr_response": "Comprehensive PR strategy to shape narrative",
    "media_strategy": "Detailed approach to media engagement",
    "media_outreach": [
      "Specific story to pitch",
      "Another media opportunity"
    ],
    "social_response": "How to engage on social platforms"
  },
  "forward_look": {
    "predictions": [
      // Multiple predictions based on patterns
      {"timeframe": "Next 30 days", "prediction": "Specific prediction based on current intelligence", "probability": 70, "early_indicators": "What to watch for", "what_it_means_for_us": "Impact on ${organization.name}", "pr_response": "How to message if this happens"},
      {"timeframe": "Next 90 days", "prediction": "Another prediction", "probability": 60, "early_indicators": "Leading indicators", "what_it_means_for_us": "Strategic implications", "pr_response": "Positioning strategy"}
    ],
    "preparation_needed": [
      // Multiple scenarios to prepare for
      {"scenario": "Specific scenario from intelligence", "impact": "Detailed impact analysis"}
    ],
    "proactive_strategy": "Comprehensive strategy for getting ahead of developments",
    "prepared_statements": [
      // Multiple prepared responses
      {"scenario": "When X happens", "statement": "Complete statement ready to go"}
    ]
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
        max_tokens: 3500,
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