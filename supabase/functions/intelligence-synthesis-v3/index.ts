// Intelligence Synthesis V3 - Clean Entity-Focused Analysis
// Uses Claude Sonnet 4 to analyze WHO did WHAT and provide strategic insights

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')

async function synthesizeWithClaude(intelligence: any, organization: any) {
  console.log(`🧠 V3 Synthesis: Analyzing intelligence for ${organization.name}`)
  
  const entityActions = intelligence.entity_actions?.all || []
  const topicTrends = intelligence.topic_trends?.all || []
  
  const prompt = `You are a strategic intelligence analyst for ${organization.name} in the ${organization.industry || 'business'} industry.

Analyze the following real-time intelligence about entity movements and market trends:

ENTITY ACTIONS (WHO did WHAT):
${JSON.stringify(entityActions, null, 2)}

TOPIC TRENDS (Market movements):
${JSON.stringify(topicTrends, null, 2)}

Provide strategic analysis in this EXACT JSON structure:

{
  "executive_briefing": {
    "headline": "One-line summary of the most important development",
    "summary": "2-3 sentence executive summary of key movements and implications",
    "requires_action": true/false,
    "urgency_level": "immediate/high/medium/low"
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
        model: 'claude-sonnet-4-20250514',
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
        headline: `${entityActions.length} entity actions tracked for ${organization.name}`,
        summary: `Monitoring ${entityActions.length} entity movements and ${topicTrends.length} market trends.`,
        requires_action: entityActions.some(a => a.importance === 'critical'),
        urgency_level: entityActions.some(a => a.importance === 'critical') ? 'high' : 'medium'
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
      }
    }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { intelligence, organization } = await req.json()
    
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
      
      // Direct tab structure for frontend
      tabs: {
        executive: {
          ...analysis.executive_briefing,
          key_numbers: {
            entity_actions: intelligence.entity_actions?.total_count || 0,
            critical_items: intelligence.entity_actions?.critical?.length || 0,
            hot_topics: intelligence.topic_trends?.hot_topics?.length || 0
          }
        },
        entities: analysis.entity_movements,
        market: analysis.market_dynamics,
        strategy: {
          recommendations: analysis.strategic_recommendations,
          positioning: analysis.competitive_positioning
        },
        raw_intelligence: {
          actions: intelligence.entity_actions?.all || [],
          trends: intelligence.topic_trends?.all || []
        }
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
    console.error('Synthesis error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        tabs: {
          executive: {
            headline: "Intelligence synthesis failed",
            summary: error.message,
            requires_action: false,
            urgency_level: "low"
          }
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  }
})