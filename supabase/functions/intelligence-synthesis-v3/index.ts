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
  
  const entityActions = intelligence.entity_actions?.all?.slice(0, 5) || []  // Top 5 only
  const topicTrends = intelligence.topic_trends?.all?.slice(0, 5) || []  // Top 5 only
  
  console.log('🔍 Entity Actions (top 5):', entityActions.length)
  console.log('📈 Topic Trends (top 5):', topicTrends.length)
  
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
  const prompt = `You are an elite intelligence analyst for ${organization.name}. Create NON-OBVIOUS, SURPRISING insights.

Look for:
- PATTERNS: What are 3+ entities doing that reveals a hidden trend?
- MISDIRECTION: What's the real story while everyone looks elsewhere?
- TIMING: Why are these things happening NOW?
- OPPORTUNITIES: What gap does chaos create?

ENTITY ACTIONS (top 5): ${JSON.stringify(entityActions, null, 2)}
TOPIC TRENDS (top 5): ${JSON.stringify(topicTrends, null, 2)}

Return ONLY this JSON:
{
  "executive_summary": {
    "headline": "The ONE non-obvious insight that changes everything",
    "overview": "Connect 3+ data points to reveal hidden pattern. What's REALLY happening?",
    "competitive_highlight": "The competitor move that's actually about something else",
    "market_highlight": "The opportunity hiding in plain sight",
    "regulatory_highlight": "How to turn regulation into advantage",
    "media_highlight": "The narrative shift that predicts next 90 days",
    "immediate_actions": [
      "Do X before competitors realize Y",
      "Say Z to position for coming change",
      "Stop doing A because B makes it irrelevant"
    ]
  },
  "competitive_landscape": {
    "competitor_actions": [{"competitor": "Name", "action": "What they did", "details": "The REAL reason - what are they preparing for?"}],
    "competitive_implications": [{"impact": "Non-obvious consequence", "severity": "Why this matters more/less than appears"}],
    "pr_strategy": "How to use their move against them - judo strategy",
    "key_messages": ["Counter-narrative that reframes conversation", "Proof point that changes perception"],
    "do_not_say": ["The trap they're setting for you"]
  },
  "market_dynamics": {
    "market_trends": [{"trend": "Specific trend", "description": "What's REALLY driving this - follow money/power/fear", "momentum": "accelerating/stable/declining"}],
    "opportunities": [{"opportunity": "The gap everyone else is missing", "description": "Why this works specifically for ${organization.name}"}],
    "market_implications": [{"implication": "Second-order effect that changes everything", "what_it_means_for_us": "How ${organization.name} uniquely benefits", "pr_response": "Position as the solution"}],
    "market_narrative": "Story that makes ${organization.name} inevitable winner",
    "thought_leadership": ["Contrarian position that becomes consensus in 6 months", "Framework that makes competitors obsolete"]
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
  const prompt = `You are an elite intelligence analyst for ${organization.name}. Create NON-OBVIOUS, SURPRISING insights.

Look for:
- REGULATORY ANGLES: How to turn compliance into competitive advantage?
- MEDIA NARRATIVES: What story kills us if we don't act in 48 hours?
- CASCADE EFFECTS: If X happens, what's the non-obvious Y and Z?
- PREPARATION: What are competitors/regulators about to do that we should prepare for?

ENTITY ACTIONS (top 5): ${JSON.stringify(entityActions, null, 2)}
TOPIC TRENDS (top 5): ${JSON.stringify(topicTrends, null, 2)}

Return ONLY this JSON:
{
  "regulatory_policy": {
    "regulatory_developments": [{"regulator": "Specific agency/official", "development": "What they're REALLY trying to achieve", "timeline": "Real vs stated deadline", "what_it_means_for_us": "How this changes ${organization.name}'s game", "pr_response": "Proactive stance that makes us look good"}],
    "compliance_requirements": [{"requirement": "Letter of law vs spirit", "action": "How to exceed and gain favor"}],
    "regulatory_stance": "Position that makes ${organization.name} regulator's favorite",
    "stakeholder_messages": [{"audience": "Regulators", "message": "We're solving problem they haven't articulated"}, {"audience": "Market", "message": "Our standards become regulations"}]
  },
  "media_sentiment": {
    "media_coverage": [{"outlet": "Specific outlet", "topic": "Angle they're missing", "sentiment": "positive/neutral/negative", "influence": "Who they influence"}],
    "social_trends": [{"platform": "Where narrative forming", "trend": "Undercurrent becoming mainstream", "volume": "Velocity matters more than volume"}],
    "reputation_impact": "How perception becomes reality in 30 days",
    "sentiment_trend": "Inflection point approaching",
    "narrative_risks": ["Story that sticks if we don't act", "Comparison that kills us"],
    "what_it_means_for_us": "Window to shape narrative closing - act now",
    "pr_response": "Launch preemptive narrative others must respond to",
    "media_strategy": "Create story others must cover",
    "media_outreach": ["Plant story to redirect attention", "Give exclusive to create ally"],
    "social_response": "Response that goes viral for RIGHT reasons"
  },
  "forward_look": {
    "predictions": [{"timeframe": "Next 30 days", "prediction": "[Competitor] will do [action] because [pattern]", "probability": 70, "early_indicators": "Watch for X in Y department", "what_it_means_for_us": "Creates opportunity/threat", "pr_response": "Position ahead of curve"}],
    "preparation_needed": [{"scenario": "When [event] happens", "impact": "Creates 40% discount opportunity"}],
    "proactive_strategy": "Start rumors about Q3 to force competitor reaction",
    "prepared_statements": [{"scenario": "Competitor announces X", "statement": "We've been working on this 18 months - here's why different"}]
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