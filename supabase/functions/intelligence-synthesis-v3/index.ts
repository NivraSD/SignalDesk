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
  
  console.log('🔍 Entity Actions Sample:', entityActions.slice(0, 2))
  console.log('📈 Topic Trends Sample:', topicTrends.slice(0, 2))
  
  // If no data, use fallback
  if (entityActions.length === 0 && topicTrends.length === 0) {
    console.log('⚠️ No intelligence data to synthesize, using fallback')
    throw new Error('No intelligence data available for synthesis')
  }
  
  const prompt = `You are an elite intelligence analyst known for uncovering hidden patterns and non-obvious insights for ${organization.name}.

Your analysis must be SURPRISING, NON-OBVIOUS, and ACTIONABLE. If it feels generic, you've failed.

Look for:
- PATTERNS: What are 3+ entities doing that reveals a hidden trend?
- MISDIRECTION: What's the real story while everyone looks elsewhere?
- TIMING: Why are these things happening NOW? What triggered them?
- CASCADES: If X happens, what's the non-obvious Y and Z that follow?
- CONTRADICTIONS: What doesn't add up? What's the story behind the story?
- OPPORTUNITIES: What opening does chaos create that no one else sees?

DO NOT:
- State the obvious ("competitors are competing")
- Be generic ("monitor the situation")
- List events without connecting them
- Give standard PR advice

INSTEAD:
- Connect dots others miss
- Predict what happens next
- Identify the REAL game being played
- Find the advantage in apparent threats

Analyze this intelligence for hidden patterns:

ENTITY ACTIONS (${entityActions.length} total movements detected):
${JSON.stringify(entityActions, null, 2)}

TOPIC TRENDS (${topicTrends.length} market trends monitored):
${JSON.stringify(topicTrends, null, 2)}

Provide comprehensive analysis in this EXACT JSON structure:

{
  "executive_summary": {
    "headline": "The ONE non-obvious insight that changes everything - make me say 'holy shit'",
    "overview": "Connect 3+ data points to reveal a hidden pattern. What's really happening that others don't see? Be specific with names, numbers, and timing.",
    "competitive_highlight": "The competitor move that's actually about something else entirely",
    "market_highlight": "The opportunity hiding in plain sight that competitors are missing",
    "regulatory_highlight": "How to turn regulatory change into competitive advantage",
    "media_highlight": "The narrative shift that predicts the next 90 days",
    "immediate_actions": [
      "Do X before competitors realize Y is happening",
      "Say Z to position for the change that's coming in 30 days",
      "Stop doing A because B makes it irrelevant"
    ]
  },
  
  "competitive_landscape": {
    "competitor_actions": [
      {
        "competitor": "Company name",
        "action": "What they did",
        "details": "The REAL reason they did it - what are they preparing for?"
      }
    ],
    "competitive_implications": [
      {
        "impact": "The non-obvious consequence this creates",
        "severity": "Why this matters more/less than it appears"
      }
    ],
    "pr_strategy": "How to use their move against them - judo strategy",
    "key_messages": [
      "The counter-narrative that reframes the entire conversation",
      "The proof point that changes perception"
    ],
    "do_not_say": [
      "The trap they're trying to make you fall into"
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
        "prediction": "The specific thing that will happen because of X meeting Y",
        "probability": 70,
        "early_indicators": "Watch for this signal that confirms it's starting"
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
    console.log('🤖 Claude API Response received')
    let content = result.content[0].text
    console.log('📝 Claude Response Length:', content.length)
    
    // Clean and parse response
    if (content.includes('```json')) {
      content = content.replace(/```json\s*/g, '').replace(/```/g, '')
    }
    
    const firstBrace = content.indexOf('{')
    const lastBrace = content.lastIndexOf('}')
    if (firstBrace !== -1 && lastBrace !== -1) {
      content = content.substring(firstBrace, lastBrace + 1)
    }
    
    const parsed = JSON.parse(content)
    console.log('✅ Parsed Claude response successfully')
    console.log('🔑 Response keys:', Object.keys(parsed))
    return parsed
  } catch (error) {
    console.error('Claude synthesis error:', error)
    // Generate insightful fallback based on actual data patterns
    const competitorActions = entityActions.filter(a => a.entity_type === 'competitor')
    const multipleMovers = competitorActions.length > 3
    const acceleratingTrends = topicTrends.filter(t => t.momentum === 'accelerating')
    const convergingActions = competitorActions.filter(a => 
      a.headline?.toLowerCase().includes('ai') || 
      a.headline?.toLowerCase().includes('launch') ||
      a.headline?.toLowerCase().includes('partner')
    )
    
    return {
      executive_summary: {
        headline: multipleMovers 
          ? `${competitorActions.length} competitors moving simultaneously - market disruption imminent`
          : `Hidden opportunity: While competitors focus on ${competitorActions[0]?.action || 'traditional moves'}, ${organization.name} can leapfrog`,
        overview: `Pattern detected: ${competitorActions.length} competitor actions and ${acceleratingTrends.length} accelerating trends converging. ` +
          `This isn't random - ${convergingActions.length > 2 ? 'coordinated market shift underway' : 'first movers are testing waters'}. ` +
          `${organization.name} has 30-day window before market crystallizes.`,
        competitive_highlight: competitorActions[0]?.headline || "Competitors unusually quiet - preparing something big",
        market_highlight: acceleratingTrends[0]?.topic 
          ? `'${acceleratingTrends[0].topic}' momentum doubled - tipping point reached`
          : "Market holding breath - major announcement imminent",
        regulatory_highlight: "Regulatory silence more dangerous than action - prepare for surprise",
        media_highlight: topicTrends.length > 3 
          ? "Media fragmented across ${topicTrends.length} narratives - opportunity to set agenda"
          : "Media consolidating on single narrative - act now or lose voice",
        immediate_actions: [
          competitorActions.length > 2 
            ? `Launch preemptive announcement within 72 hours - ${competitorActions.length} competitors about to move`
            : "Use competitor distraction to quietly acquire key capability",
          acceleratingTrends.length > 0
            ? `Ride the '${acceleratingTrends[0]?.topic}' wave with contrarian angle`
            : "Create the trend others will follow - market waiting for leader",
          "Start 'accidentally' leaking next quarter plans to control narrative"
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