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
  const prompt = `You are an elite strategic intelligence analyst for ${organization.name}. Your job is to find differentiation opportunities and strategic positioning gaps, not just monitor news.

ENTITY ACTIONS (${entityActions.length} captured):
${JSON.stringify(entityActions, null, 2)}

TOPIC TRENDS (${topicTrends.length} monitored):
${JSON.stringify(topicTrends, null, 2)}

CRITICAL: Look for:
- Executive comments and thought leader statements (not just company announcements)
- Subtle shifts in messaging and positioning
- What competitors AREN'T talking about (narrative gaps)
- Early signals and weak signals that others might miss
- Personnel moves and what they signal about strategy
- Conference remarks, podcast quotes, social media hints

Your analysis should help ${organization.name} DIFFERENTIATE, not just monitor.

Return this JSON with STRATEGIC DIFFERENTIATION ANALYSIS:
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
  "competitive_positioning": {
    "your_position": "CRITICAL ANALYSIS (300+ words): Where does ${organization.name} currently sit in the competitive narrative? What's your unique position? What narratives are you owning vs missing?",
    "competitor_moves": [
      {"competitor": "Name", "action": "What they did", "personnel_signals": "Key executive quotes, thought leader comments, informal remarks", "what_theyre_not_saying": "Notable omissions or avoided topics", "differentiation_opportunity": "How ${organization.name} could position differently"}
    ],
    "narrative_gaps": "What stories NO ONE is telling that ${organization.name} could own?",
    "positioning_opportunities": "Specific ways ${organization.name} could differentiate based on what others are/aren't doing",
    "strategic_white_space": "Unclaimed narrative territory ${organization.name} could occupy"
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
  const prompt = `You are an elite strategic intelligence analyst for ${organization.name}. Find unique insights that others miss - focus on personnel signals, thought leader opinions, and reading between the lines.

ENTITY ACTIONS (${entityActions.length} captured):
${JSON.stringify(entityActions, null, 2)}

TOPIC TRENDS (${topicTrends.length} monitored):
${JSON.stringify(topicTrends, null, 2)}

CRITICAL: Don't just report what happened. Look for:
- What thought leaders and executives are really saying (and not saying)
- Personnel moves and what they signal
- Conference side comments and podcast remarks
- Social media hints and LinkedIn activity
- The stories behind the stories

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