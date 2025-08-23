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
  const prompt = `You are a real-time intelligence analyst for ${organization.name}. Focus on WHAT JUST HAPPENED in the last 48 hours and WHAT IT MEANS RIGHT NOW.

RECENT ENTITY ACTIONS (Last 48 hours):
${JSON.stringify(entityActions, null, 2)}

EMERGING TOPICS (Last 48 hours):
${JSON.stringify(topicTrends, null, 2)}

YOUR MISSION: Analyze these SPECIFIC RECENT EVENTS, not industry trends. Tell me:
1. What literally just happened (be specific - names, dates, actions)
2. Why it matters TODAY (not in general)
3. What ${organization.name} should watch for TOMORROW
4. The hidden story in these specific events

Focus on the NEWS, not the NARRATIVE. Be a reporter, not a consultant.

Return this JSON with REAL-TIME EVENT ANALYSIS:
{
  "executive_summary": {
    "headline": "The BIGGEST thing that happened in the last 48 hours - be VERY specific with WHO did WHAT WHEN",
    "overview": "In 4-6 sentences, explain these SPECIFIC recent events. Not trends - actual things that happened. Name names, cite specific actions, quote actual statements.",
    "competitive_highlight": "EXACTLY what [competitor name] did [specific action] on [date] and immediate impact",
    "market_highlight": "The specific event/announcement that just shifted market dynamics",
    "regulatory_highlight": "What regulator/government just did/said specifically",
    "media_highlight": "The specific story/article that's driving conversation right now",
    "immediate_watch_points": [
      "What to watch for in next 24 hours based on these events",
      "Expected reactions/responses to these specific events",
      "Potential escalation of these specific situations"
    ]
  },
  "competitive_positioning": {
    "your_position": "Based on THESE SPECIFIC EVENTS from the last 48 hours, what's ${organization.name}'s immediate position? Not general strategy - where you stand RIGHT NOW given what just happened",
    "competitor_moves": [
      {"competitor": "Specific name", "action": "EXACTLY what they did (date, specifics)", "timing": "Why they did it NOW", "immediate_impact": "What changed because of this", "your_response_window": "How long ${organization.name} has to respond"}
    ],
    "immediate_opportunities": "What ${organization.name} could do TODAY/TOMORROW based on these specific events",
    "response_options": "Specific actions ${organization.name} could take in response to these events",
    "timing_considerations": "Why timing matters for these specific situations"
  },
  "between_the_lines": {
    "hidden_signals": [
      {"signal": "Subtle development", "source": "Executive comment/personnel move/small announcement", "why_it_matters": "What this really indicates", "strategic_implication": "How ${organization.name} should interpret this"}
    ],
    "executive_tea_leaves": "What key executives and thought leaders are signaling through their comments, posts, and appearances",
    "connecting_dots": "Non-obvious connections between seemingly unrelated developments",
    "early_warnings": "Weak signals that could become major narratives",
    "contrarian_view": "What if the conventional wisdom is wrong? Alternative interpretation of events"
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
  const prompt = `You are a real-time threat analyst for ${organization.name}. Focus on SPECIFIC EVENTS from the last 48 hours that pose risks or create urgency.

RECENT ENTITY ACTIONS (Last 48 hours):
${JSON.stringify(entityActions, null, 2)}

EMERGING TOPICS (Last 48 hours):
${JSON.stringify(topicTrends, null, 2)}

Analyze THESE SPECIFIC RECENT EVENTS for:
- What activist/critic/regulator just did SPECIFICALLY
- What announcement/leak/rumor just emerged
- What alliance/partnership just formed
- What investigation/lawsuit just launched
- What social media storm just started

Return this JSON with REAL-TIME RISK ANALYSIS:
{
  "regulatory_policy": {
    "breaking_developments": "What JUST happened in regulatory/policy space in last 48 hours - be SPECIFIC",
    "regulatory_developments": [
      {"regulator": "Specific agency/official", "action": "EXACTLY what they did/said/filed", "date": "When this happened", "immediate_impact": "What changes NOW", "response_deadline": "When ${organization.name} needs to respond by"}
    ],
    "enforcement_actions": "Any fines/sanctions/investigations launched in last 48 hours",
    "policy_signals": "What officials are signaling through recent statements/actions"
  },
  "thought_leadership": {
    "influencer_signals": [
      {"influencer": "Name/Role", "signal": "What they said/did", "platform": "Conference/podcast/social", "subtext": "What they're really signaling", "impact": "How this shapes industry narrative"}
    ],
    "executive_commentary": "Key quotes and remarks from executives that reveal strategic thinking - focus on informal comments, not press releases",
    "thought_leader_consensus": "What opinion leaders agree on vs where they diverge",
    "narrative_momentum": "Which ideas are gaining traction among influencers",
    "contrarian_voices": "Important dissenting opinions that could reshape the narrative"
  },
  "forward_look": {
    "next_48_hours": "Based on THESE SPECIFIC EVENTS, what's likely to happen in next 48 hours?",
    "expected_responses": [
      {"who": "Specific entity", "likely_action": "What they'll probably do", "when": "Expected timing", "why": "Based on what just happened", "impact": "How this affects ${organization.name}"}
    ],
    "developing_situations": "Which of today's events will escalate? Be specific",
    "decision_points": "What ${organization.name} needs to decide in next 24-48 hours based on these events",
    "watch_list": "Specific things to monitor closely given what just happened"
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
        positioning: analysis.competitive_positioning || {},
        between: analysis.between_the_lines || {},
        thought: analysis.thought_leadership || {},
        market: analysis.market_dynamics || {},
        regulatory: analysis.regulatory_policy || {},
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