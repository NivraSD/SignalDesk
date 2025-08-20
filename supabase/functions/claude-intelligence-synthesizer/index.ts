// Claude Intelligence Synthesizer
// Takes raw MCP data and synthesizes it into goal-aligned insights

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400'
}

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')

async function analyzeWithClaude(prompt: string) {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1500,
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

    const data = await response.json()
    return data.content[0].text
  } catch (error) {
    console.error('Claude analysis error:', error)
    return null
  }
}

function buildGoalContext(goals: any) {
  const goalDescriptions = {
    thought_leadership: "Establish authority and expertise in the industry",
    media_coverage: "Maximize positive media presence and reach",
    competitive_positioning: "Differentiate from competitors and highlight unique value",
    investor_relations: "Attract investment and maintain investor confidence",
    market_expansion: "Identify and capitalize on new market opportunities",
    crisis_preparedness: "Anticipate and mitigate potential risks",
    brand_building: "Strengthen brand recognition and reputation",
    customer_acquisition: "Attract and convert new customers",
    talent_acquisition: "Attract top talent to the organization",
    product_launch: "Successfully launch new products/services",
    regulatory_compliance: "Ensure compliance and navigate regulations",
    social_impact: "Demonstrate ESG commitment and social responsibility"
  }

  const activeGoals = Object.entries(goals)
    .filter(([key, value]) => value === true)
    .map(([key]) => goalDescriptions[key] || key)

  return activeGoals.length > 0 ? activeGoals : ['General business growth and success']
}

async function synthesizeCompetitorIntelligence(mcpData: any, organization: any, goals: any) {
  const goalContext = buildGoalContext(goals)
  
  const prompt = `You are analyzing competitive intelligence for ${organization.name} in the ${organization.industry} industry.

ORGANIZATION GOALS:
${goalContext.map(g => `- ${g}`).join('\n')}

RAW COMPETITIVE INTELLIGENCE:
${JSON.stringify(mcpData, null, 2)}

Provide a strategic analysis that:
1. Identifies the 3 most important competitor movements relevant to our goals
2. Assesses threat level and opportunity for each movement
3. Recommends specific actions aligned with our strategic goals
4. Highlights any patterns or trends across competitors
5. Identifies strategic advantages we can leverage

Format your response as structured JSON with these sections:
- key_movements (array of 3 items with: competitor, action, impact_on_goals, threat_level, opportunity)
- strategic_patterns (2-3 observed patterns)
- recommended_actions (3-5 specific actions tied to our goals)
- competitive_advantage (unique position or opportunity)
- priority_focus (single most important thing to address now)`

  const analysis = await analyzeWithClaude(prompt)
  
  try {
    return JSON.parse(analysis)
  } catch {
    return {
      key_movements: [],
      strategic_patterns: [],
      recommended_actions: [analysis],
      competitive_advantage: "Analysis in progress",
      priority_focus: "Review competitive landscape"
    }
  }
}

async function synthesizeStakeholderIntelligence(mcpData: any, organization: any, goals: any) {
  const goalContext = buildGoalContext(goals)
  
  const prompt = `You are analyzing stakeholder intelligence for ${organization.name} in the ${organization.industry} industry.

ORGANIZATION GOALS:
${goalContext.map(g => `- ${g}`).join('\n')}

STAKEHOLDER INTELLIGENCE:
${JSON.stringify(mcpData, null, 2)}

Provide strategic stakeholder analysis that:
1. Maps stakeholder sentiment and influence to our specific goals
2. Identifies coalition opportunities that advance our objectives
3. Highlights risks from negative stakeholders
4. Recommends engagement strategies for each key group
5. Prioritizes stakeholder actions by goal impact

Format your response as structured JSON with:
- stakeholder_map (array with: group, sentiment, influence_level, goal_alignment, engagement_priority)
- coalition_opportunities (potential alliances that support our goals)
- risk_stakeholders (groups that could hinder our goals)
- engagement_strategies (specific actions for top 3 stakeholder groups)
- immediate_actions (2-3 things to do this week)`

  const analysis = await analyzeWithClaude(prompt)
  
  try {
    return JSON.parse(analysis)
  } catch {
    return {
      stakeholder_map: [],
      coalition_opportunities: [],
      risk_stakeholders: [],
      engagement_strategies: [],
      immediate_actions: [analysis]
    }
  }
}

async function synthesizeNarrativeIntelligence(mcpData: any, organization: any, goals: any) {
  const goalContext = buildGoalContext(goals)
  
  const prompt = `You are analyzing narrative and market intelligence for ${organization.name} in the ${organization.industry} industry.

ORGANIZATION GOALS:
${goalContext.map(g => `- ${g}`).join('\n')}

NARRATIVE & MARKET DATA:
${JSON.stringify(mcpData, null, 2)}

Provide narrative analysis that:
1. Identifies narratives that support or hinder our specific goals
2. Finds whitespace opportunities aligned with our objectives
3. Recommends messaging strategies for each goal
4. Spots emerging trends we should leverage or avoid
5. Calculates our narrative strength relative to goals

Format your response as structured JSON with:
- goal_narrative_alignment (how current narratives support each active goal)
- whitespace_opportunities (uncovered angles that advance our goals)
- messaging_recommendations (key messages for top 3 goals)
- emerging_narratives (trends to leverage or counter)
- narrative_strategy (overall approach to achieve our goals)`

  const analysis = await analyzeWithClaude(prompt)
  
  try {
    return JSON.parse(analysis)
  } catch {
    return {
      goal_narrative_alignment: {},
      whitespace_opportunities: [],
      messaging_recommendations: [],
      emerging_narratives: [],
      narrative_strategy: analysis
    }
  }
}

async function synthesizePredictiveIntelligence(mcpData: any, organization: any, goals: any) {
  const goalContext = buildGoalContext(goals)
  
  const prompt = `You are creating predictive intelligence for ${organization.name} in the ${organization.industry} industry.

ORGANIZATION GOALS:
${goalContext.map(g => `- ${g}`).join('\n')}

INTELLIGENCE DATA:
${JSON.stringify(mcpData, null, 2)}

Provide predictive analysis that:
1. Forecasts how current trends will impact each of our goals
2. Predicts competitor actions that could affect our objectives
3. Identifies cascade effects from current events
4. Assesses vulnerability to our goal achievement
5. Recommends proactive moves to secure our goals

Format your response as structured JSON with:
- goal_impact_forecast (30/60/90 day outlook for each goal)
- predicted_competitor_moves (likely actions and impact on our goals)
- cascade_risks (events that could trigger chain reactions)
- goal_vulnerabilities (what could prevent achieving each goal)
- proactive_recommendations (actions to take now to ensure future success)`

  const analysis = await analyzeWithClaude(prompt)
  
  try {
    return JSON.parse(analysis)
  } catch {
    return {
      goal_impact_forecast: {},
      predicted_competitor_moves: [],
      cascade_risks: [],
      goal_vulnerabilities: [],
      proactive_recommendations: [analysis]
    }
  }
}

async function generateExecutiveSummary(allAnalysis: any, organization: any, goals: any) {
  const goalContext = buildGoalContext(goals)
  
  const prompt = `Create an executive intelligence summary for ${organization.name}.

STRATEGIC GOALS:
${goalContext.map(g => `- ${g}`).join('\n')}

ANALYZED INTELLIGENCE:
${JSON.stringify(allAnalysis, null, 2)}

Create a concise executive summary that:
1. Highlights the single most important insight for achieving our goals
2. Lists 3 immediate priorities based on our objectives
3. Identifies the biggest opportunity and biggest risk
4. Recommends resource allocation across goals
5. Provides a strategic recommendation for the next 30 days

Format as structured JSON with:
- key_insight (single most important finding)
- immediate_priorities (3 actions ranked by goal impact)
- biggest_opportunity (aligned with our goals)
- biggest_risk (threat to our goals)
- resource_allocation (how to distribute effort across goals)
- thirty_day_strategy (focused plan to advance our objectives)`

  const analysis = await analyzeWithClaude(prompt)
  
  try {
    return JSON.parse(analysis)
  } catch {
    return {
      key_insight: "Strategic analysis in progress",
      immediate_priorities: [],
      biggest_opportunity: "",
      biggest_risk: "",
      resource_allocation: {},
      thirty_day_strategy: analysis
    }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { 
      intelligence_type, 
      mcp_data, 
      organization, 
      goals,
      timeframe = '24h'
    } = await req.json()

    console.log(`🧠 Claude synthesizing ${intelligence_type} intelligence for ${organization?.name}`)
    console.log(`📊 Active goals: ${Object.entries(goals || {}).filter(([k,v]) => v).map(([k]) => k).join(', ')}`)

    let synthesizedIntelligence = {}

    switch (intelligence_type) {
      case 'competitor':
        synthesizedIntelligence = await synthesizeCompetitorIntelligence(mcp_data, organization, goals)
        break
        
      case 'stakeholder':
        synthesizedIntelligence = await synthesizeStakeholderIntelligence(mcp_data, organization, goals)
        break
        
      case 'narrative':
        synthesizedIntelligence = await synthesizeNarrativeIntelligence(mcp_data, organization, goals)
        break
        
      case 'predictive':
        synthesizedIntelligence = await synthesizePredictiveIntelligence(mcp_data, organization, goals)
        break
        
      case 'executive_summary':
        synthesizedIntelligence = await generateExecutiveSummary(mcp_data, organization, goals)
        break
        
      default:
        // Full analysis across all areas
        const competitorAnalysis = await synthesizeCompetitorIntelligence(
          mcp_data.competitive || {}, organization, goals
        )
        const stakeholderAnalysis = await synthesizeStakeholderIntelligence(
          mcp_data.stakeholder || {}, organization, goals
        )
        const narrativeAnalysis = await synthesizeNarrativeIntelligence(
          mcp_data.narrative || {}, organization, goals
        )
        const predictiveAnalysis = await synthesizePredictiveIntelligence(
          mcp_data.predictive || {}, organization, goals
        )
        
        synthesizedIntelligence = {
          competitor: competitorAnalysis,
          stakeholder: stakeholderAnalysis,
          narrative: narrativeAnalysis,
          predictive: predictiveAnalysis,
          executive_summary: await generateExecutiveSummary(
            { competitorAnalysis, stakeholderAnalysis, narrativeAnalysis, predictiveAnalysis },
            organization, goals
          )
        }
    }

    return new Response(
      JSON.stringify({
        success: true,
        intelligence_type,
        organization: organization?.name,
        active_goals: Object.entries(goals || {}).filter(([k,v]) => v).map(([k]) => k),
        timeframe,
        analysis: synthesizedIntelligence,
        analyzed_at: new Date().toISOString()
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('❌ Claude synthesis error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to synthesize intelligence'
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
        status: 500
      }
    )
  }
})