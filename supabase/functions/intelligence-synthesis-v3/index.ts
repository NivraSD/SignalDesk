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
  
  const prompt = `You are a strategic intelligence analyst for ${organization.name} in the ${organization.industry || 'business'} industry.

Analyze ALL intelligence using this formula for each segment:
1. What's Happening (the events/intelligence)
2. What It Means For Us (strategic implications for ${organization.name})
3. PR Response (communications actions and messaging)

IMPORTANT: Include ALL intelligence - don't filter or focus only on PR. Show everything, then explain what it means and how to respond.

Analyze the following real-time intelligence:

ENTITY ACTIONS (${entityActions.length} total movements detected):
${JSON.stringify(entityActions, null, 2)}

TOPIC TRENDS (${topicTrends.length} market trends monitored):
${JSON.stringify(topicTrends, null, 2)}

Provide comprehensive analysis in this EXACT JSON structure:

{
  "executive_summary": {
    "headline": "One-line comprehensive summary of ALL intelligence",
    "overview": "2-3 sentence overview touching on competitive, market, regulatory, and media landscapes",
    "competitive_highlight": "Most important competitive development",
    "market_highlight": "Most important market trend or opportunity",
    "regulatory_highlight": "Most important regulatory development",
    "media_highlight": "Most important media/sentiment trend",
    "immediate_actions": [
      "Top PR action needed #1",
      "Top PR action needed #2",
      "Top PR action needed #3"
    ]
  },
  
  "competitive_landscape": {
    "competitor_actions": [
      {
        "competitor": "Company name",
        "action": "What they did",
        "details": "Additional context"
      }
    ],
    "competitive_implications": [
      {
        "impact": "How this affects ${organization.name}",
        "severity": "high/medium/low"
      }
    ],
    "pr_strategy": "Overall PR approach to competitive developments",
    "key_messages": [
      "Key message to emphasize",
      "Another key message"
    ],
    "do_not_say": [
      "Messages to avoid"
    ]
  },
  
  "market_dynamics": {
    "market_trends": [
      {
        "trend": "Trend name",
        "description": "What's happening",
        "momentum": "accelerating/stable/declining"
      }
    ],
    "opportunities": [
      {
        "opportunity": "Opportunity name",
        "description": "Details"
      }
    ],
    "market_implications": [
      {
        "implication": "What this means for ${organization.name}",
        "opportunity": "Opportunity if positive",
        "risk": "Risk if negative"
      }
    ],
    "market_narrative": "How to talk about market position",
    "thought_leadership": [
      "Topic where we can lead"
    ]
  },
  
  "regulatory_policy": {
    "regulatory_developments": [
      {
        "regulator": "Agency/Official",
        "development": "What's happening",
        "timeline": "When"
      }
    ],
    "compliance_requirements": [
      {
        "requirement": "What we need to comply with",
        "action": "What we need to do"
      }
    ],
    "regulatory_stance": "Our public position on regulatory matters",
    "stakeholder_messages": [
      {
        "audience": "Regulators",
        "message": "Key message"
      },
      {
        "audience": "Investors",
        "message": "Key message"
      }
    ]
  },
  
  "media_sentiment": {
    "media_coverage": [
      {
        "outlet": "Media name",
        "topic": "What they're covering",
        "sentiment": "positive/neutral/negative"
      }
    ],
    "social_trends": [
      {
        "platform": "Twitter/LinkedIn/etc",
        "trend": "What's trending",
        "volume": "high/medium/low"
      }
    ],
    "reputation_impact": "Overall impact on reputation",
    "sentiment_trend": "improving/stable/declining",
    "narrative_risks": [
      "Negative narrative to counter"
    ],
    "media_strategy": "How to engage with media",
    "media_outreach": [
      "Proactive media action"
    ],
    "social_response": "Social media approach"
  },
  
  "forward_look": {
    "predictions": [
      {
        "timeframe": "Next 30 days",
        "prediction": "What's likely to happen",
        "probability": 70
      }
    ],
    "preparation_needed": [
      {
        "scenario": "Potential scenario",
        "impact": "Impact on ${organization.name}"
      }
    ],
    "proactive_strategy": "How to get ahead of developments",
    "prepared_statements": [
      {
        "scenario": "If X happens",
        "statement": "Our response"
      }
    ]
  },
  
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
    // Return structured fallback matching new comprehensive structure
    return {
      executive_summary: {
        headline: `Strategic Intelligence Update for ${organization.name}`,
        overview: `Currently monitoring ${entityActions.length} entity movements and ${topicTrends.length} market trends across competitive, regulatory, and media landscapes.`,
        competitive_highlight: entityActions.find(a => a.entity_type === 'competitor')?.headline || "Monitoring competitor movements",
        market_highlight: topicTrends.find(t => t.momentum === 'increasing')?.topic || "Tracking market dynamics",
        regulatory_highlight: entityActions.find(a => a.entity_type === 'regulator')?.headline || "No regulatory changes",
        media_highlight: "Media sentiment stable",
        immediate_actions: [
          "Monitor competitor developments",
          "Assess market opportunities",
          "Maintain stakeholder communications"
        ]
      },
      competitive_landscape: {
        competitor_actions: entityActions.filter(a => a.entity_type === 'competitor').map(a => ({
          competitor: a.entity,
          action: a.action,
          details: a.headline
        })),
        competitive_implications: [{
          impact: "Competitive landscape evolving",
          severity: "medium"
        }],
        pr_strategy: "Maintain thought leadership position",
        key_messages: ["Innovation leadership", "Customer focus"],
        do_not_say: ["Direct competitor comparisons"]
      },
      market_dynamics: {
        market_trends: topicTrends.map(t => ({
          trend: t.topic,
          description: t.sample_headlines?.[0] || t.topic,
          momentum: t.momentum
        })),
        opportunities: [],
        market_implications: [],
        market_narrative: "Positioned for growth",
        thought_leadership: ["Industry innovation"]
      },
      regulatory_policy: {
        regulatory_developments: entityActions.filter(a => a.entity_type === 'regulator').map(a => ({
          regulator: a.entity,
          development: a.headline,
          timeline: "Ongoing"
        })),
        compliance_requirements: [],
        regulatory_stance: "Full compliance and engagement",
        stakeholder_messages: []
      },
      media_sentiment: {
        media_coverage: [],
        social_trends: [],
        reputation_impact: "Neutral",
        sentiment_trend: "stable",
        narrative_risks: [],
        media_strategy: "Proactive engagement",
        media_outreach: [],
        social_response: "Monitor and engage as needed"
      },
      forward_look: {
        predictions: [],
        preparation_needed: [],
        proactive_strategy: "Stay ahead of market trends",
        prepared_statements: []
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
      
      // Direct tab structure for frontend - comprehensive with PR focus
      tabs: {
        executive: analysis.executive_summary,
        competitive: analysis.competitive_landscape,
        market: analysis.market_dynamics,
        regulatory: analysis.regulatory_policy,
        media: analysis.media_sentiment,
        forward: analysis.forward_look,
        
        // Keep PR-focused structure as additional data with safe defaults
        narrative: analysis.narrative_control || { dominant_narratives: [], narrative_threats: [] },
        response: analysis.response_priorities || { immediate_responses: [], monitor_only: [] },
        messaging: analysis.messaging_opportunities || { opportunities: [] },
        stakeholders: analysis.stakeholder_sentiment || { stakeholder_groups: [] },
        tomorrow: analysis.tomorrows_headlines || { anticipated_headlines: [] }
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
        error: error.message,
        tabs: {
          executive: {
            headline: "Intelligence synthesis temporarily unavailable",
            overview: error.message,
            competitive_highlight: "No data available",
            market_highlight: "No data available",
            regulatory_highlight: "No data available",
            media_highlight: "No data available",
            immediate_actions: []
          },
          competitive: { competitor_actions: [], competitive_implications: [], pr_strategy: "", key_messages: [], do_not_say: [] },
          market: { market_trends: [], opportunities: [], market_implications: [], market_narrative: "", thought_leadership: [] },
          regulatory: { regulatory_developments: [], compliance_requirements: [], regulatory_stance: "", stakeholder_messages: [] },
          media: { media_coverage: [], social_trends: [], reputation_impact: "", sentiment_trend: "", narrative_risks: [], media_strategy: "", media_outreach: [], social_response: "" },
          forward: { predictions: [], preparation_needed: [], proactive_strategy: "", prepared_statements: [] }
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  }
})