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
  
  const entityActions = intelligence.entity_actions?.all || []
  const topicTrends = intelligence.topic_trends?.all || []
  
  const prompt = `You are a PR and communications strategist for ${organization.name} in the ${organization.industry || 'business'} industry.

Your role is to analyze intelligence from a PUBLIC RELATIONS and COMMUNICATIONS perspective.

CRITICAL: Focus on narrative control, messaging opportunities, and PR response priorities.

Analyze the following real-time intelligence:

ENTITY ACTIONS (${entityActions.length} total movements detected):
${JSON.stringify(entityActions, null, 2)}

TOPIC TRENDS (${topicTrends.length} market trends monitored):
${JSON.stringify(topicTrends, null, 2)}

Provide PR-focused analysis in this EXACT JSON structure:

{
  "narrative_control": {
    "dominant_narratives": [
      {
        "theme": "Main narrative theme in the market",
        "drivers": ["Entity1", "Entity2"],
        "our_position": "leading/aligned/opposing/absent",
        "action_needed": true/false,
        "pr_response": "Specific PR action if needed"
      }
    ],
    "narrative_threats": [
      {
        "description": "Narrative that could harm ${organization.name}",
        "source": "Who's driving this narrative",
        "counter_narrative": "How to counter this narrative"
      }
    ]
  },
  
  "response_priorities": {
    "immediate_responses": [
      {
        "trigger": "What happened that needs response",
        "response": "Recommended PR response",
        "channels": ["press release", "social media", "executive statement"],
        "timeline": "within 24 hours"
      }
    ],
    "monitor_only": [
      {
        "description": "What we're watching",
        "reason": "Why monitor vs respond",
        "escalation_trigger": "What would make us respond"
      }
    ]
  },
  
  "messaging_opportunities": {
    "opportunities": [
      {
        "context": "Current event or trend we can leverage",
        "message": "Our key message to insert",
        "talking_points": [
          "Specific talking point 1",
          "Specific talking point 2"
        ],
        "timing": "When to deploy this message"
      }
    ]
  },
  
  "stakeholder_sentiment": {
    "stakeholder_groups": [
      {
        "name": "Customers/Investors/Media/Regulators",
        "sentiment": "positive/neutral/negative",
        "concerns": ["Main concern 1", "Main concern 2"],
        "messaging_approach": "How to communicate with this group"
      }
    ]
  },
  
  "tomorrows_headlines": {
    "anticipated_headlines": [
      {
        "headline": "Likely future headline about ${organization.name} or industry",
        "probability": 70,
        "preparation_steps": [
          "PR preparation step 1",
          "PR preparation step 2"
        ],
        "draft_statement": "Pre-drafted response statement"
      }
    ]
  },
  
  "executive_briefing": {
    "strategic_headline": "MUST be a comprehensive one-line summary of the OVERALL strategic situation across ALL entities and trends",
    "strategic_summary": "MUST be 4-5 sentences that mention AT LEAST 3 different entities/trends. Synthesize patterns across competitors, regulators, AND market movements. Explain what the COLLECTIVE intelligence means for ${organization.name}'s strategic position. NEVER focus on just one item.",
    "key_insights": [
      "Insight combining multiple competitor actions",
      "Insight about overall market momentum from trends",
      "Insight about regulatory/stakeholder landscape",
      "Insight about emerging opportunities or risks"
    ],
    "situation_assessment": {
      "position": "Strong/Challenged/Vulnerable",
      "momentum": "Gaining/Stable/Losing",
      "risk_level": "high/medium/low"
    },
    "immediate_priorities": [
      "Priority action 1",
      "Priority action 2",
      "Priority action 3"
    ]
  },
  
  "entity_movements": {
    "competitor_actions": [
      {
        "entity": "Company name",
        "action": "What they did",
        "strategic_impact": "How this affects ${organization.name}",
        "response_needed": "recommended response or 'monitor only'"
      }
    ],
    "regulatory_developments": [
      {
        "entity": "Regulator/Official",
        "development": "What happened",
        "compliance_impact": "Requirements for ${organization.name}",
        "timeline": "When action needed"
      }
    ],
    "stakeholder_positions": [
      {
        "entity": "Stakeholder name",
        "position": "Their stance/action",
        "influence_level": "high/medium/low",
        "engagement_strategy": "How to respond"
      }
    ]
  },
  
  "market_dynamics": {
    "trending_opportunities": [
      {
        "trend": "What's happening",
        "opportunity": "How ${organization.name} can capitalize",
        "timing": "immediate/short-term/long-term",
        "first_mover_advantage": true/false
      }
    ],
    "emerging_risks": [
      {
        "risk": "What threat is emerging",
        "probability": "high/medium/low",
        "impact": "potential impact on ${organization.name}",
        "mitigation": "Recommended action"
      }
    ]
  },
  
  "strategic_recommendations": [
    {
      "priority": 1,
      "action": "Specific action to take",
      "rationale": "Why this matters now",
      "owner": "Who should lead this",
      "timeline": "When to act"
    }
  ],
  
  "competitive_positioning": {
    "current_position": "Where ${organization.name} stands relative to movements",
    "narrative_control": "strong/contested/weak",
    "momentum": "gaining/maintaining/losing",
    "key_advantages": ["Advantages to leverage"],
    "vulnerabilities": ["Gaps to address"]
  },
  
  "predictions_and_cascades": {
    "cascades": [
      {
        "trigger": "If this current event/trend continues",
        "effects": [
          "First-order effect",
          "Second-order effect",
          "Third-order effect"
        ],
        "probability": "high/medium/low"
      }
    ],
    "predictions": [
      {
        "timeframe": "Next 30 days",
        "prediction": "What is likely to happen",
        "basis": "Based on which current intelligence",
        "confidence": 70
      },
      {
        "timeframe": "Next 90 days",
        "prediction": "What is likely to happen",
        "basis": "Based on which current intelligence",
        "confidence": 60
      }
    ],
    "second_order_effects": [
      {
        "primary_change": "Current change happening",
        "secondary_impact": "How this will affect other areas",
        "recommended_action": "What ${organization.name} should do"
      }
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
    let content = result.content[0].text
    
    // Clean and parse response
    if (content.includes('```json')) {
      content = content.replace(/```json\s*/g, '').replace(/```/g, '')
    }
    
    const firstBrace = content.indexOf('{')
    const lastBrace = content.lastIndexOf('}')
    if (firstBrace !== -1 && lastBrace !== -1) {
      content = content.substring(firstBrace, lastBrace + 1)
    }
    
    return JSON.parse(content)
  } catch (error) {
    console.error('Claude synthesis error:', error)
    // Return structured fallback
    return {
      executive_briefing: {
        strategic_headline: `Strategic situation for ${organization.name}`,
        strategic_summary: `Currently monitoring ${entityActions.length} entity movements and ${topicTrends.length} market trends. Analysis indicates multiple stakeholder actions requiring strategic assessment.`,
        key_insights: [
          `${entityActions.filter(a => a.entity_type === 'competitor').length} competitor actions detected`,
          `${topicTrends.filter(t => t.momentum === 'increasing').length} trending topics gaining momentum`,
          `Strategic position requires continuous monitoring`
        ],
        situation_assessment: {
          position: "Stable",
          momentum: "Stable",
          risk_level: entityActions.some(a => a.importance === 'critical') ? 'high' : 'medium'
        },
        immediate_priorities: [
          "Monitor competitor movements",
          "Assess regulatory changes",
          "Evaluate market trends"
        ]
      },
      entity_movements: {
        competitor_actions: [],
        regulatory_developments: [],
        stakeholder_positions: []
      },
      market_dynamics: {
        trending_opportunities: [],
        emerging_risks: []
      },
      strategic_recommendations: [],
      competitive_positioning: {
        current_position: "Monitoring market movements",
        narrative_control: "contested",
        momentum: "maintaining",
        key_advantages: [],
        vulnerabilities: []
      },
      predictions_and_cascades: {
        cascades: [],
        predictions: [],
        second_order_effects: []
      }
    }
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
    
    // Build the final response optimized for frontend display
    const response = {
      success: true,
      organization: organization.name,
      timestamp: new Date().toISOString(),
      
      // Direct tab structure for frontend - PR focused
      tabs: {
        narrative: analysis.narrative_control,
        response: analysis.response_priorities,
        messaging: analysis.messaging_opportunities,
        stakeholders: analysis.stakeholder_sentiment,
        tomorrow: analysis.tomorrows_headlines,
        
        // Keep old structure as fallback
        executive: analysis.executive_briefing,
        entities: analysis.entity_movements,
        market: analysis.market_dynamics,
        strategy: {
          recommendations: analysis.strategic_recommendations,
          positioning: analysis.competitive_positioning
        },
        predictions: analysis.predictions_and_cascades
      },
      
      // Quick access to critical items
      alerts: intelligence.entity_actions?.critical || [],
      requires_attention: analysis.executive_briefing.requires_action,
      
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
        error: error.message,
        tabs: {
          executive: {
            strategic_headline: "Intelligence synthesis temporarily unavailable",
            strategic_summary: error.message,
            key_insights: [],
            situation_assessment: {
              position: "Unknown",
              momentum: "Unknown",
              risk_level: "low"
            },
            immediate_priorities: []
          },
          entities: { competitor_actions: [], regulatory_developments: [], stakeholder_positions: [] },
          market: { trending_opportunities: [], emerging_risks: [] },
          strategy: { recommendations: [], positioning: null },
          predictions: { cascades: [], predictions: [], second_order_effects: [] }
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  }
})