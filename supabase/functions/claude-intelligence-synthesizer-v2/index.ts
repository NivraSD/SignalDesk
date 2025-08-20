// Claude Intelligence Synthesizer V2 - With Specialized Personas and Second Opinion Pattern
// Each persona has specific expertise and perspective for analyzing intelligence

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400'
}

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || 'https://zskaxjtyuaqazydouifp.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

// Log API key status for debugging
console.log('🔑 ANTHROPIC_API_KEY exists:', !!ANTHROPIC_API_KEY)
console.log('🔑 API Key length:', ANTHROPIC_API_KEY?.length || 0)

// Initialize Supabase client for memory access
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY || '')

// Define specialized analysis personas
const ANALYSIS_PERSONAS = {
  competitive_strategist: {
    name: "Strategic Competitive Analyst",
    expertise: "Competitive dynamics, market positioning, strategic moves",
    perspective: "Focus on competitive advantages, market share implications, and strategic responses",
    tone: "Analytical, strategic, forward-looking",
    prompts: {
      system: `You are a senior competitive intelligence strategist with 20 years of experience analyzing market dynamics and competitor strategies. You specialize in identifying strategic patterns, predicting competitor moves, and recommending counter-strategies. You think in terms of game theory, market positioning, and sustainable competitive advantages.`,
      analysis_framework: `Analyze through these lenses:
1. Strategic Intent - What are competitors really trying to achieve?
2. Capability Gaps - Where are they strong/weak relative to us?
3. Market Impact - How will their moves affect market dynamics?
4. Response Options - What strategic responses should we consider?
5. Time Horizons - Immediate threats vs long-term positioning`
    }
  },
  
  stakeholder_psychologist: {
    name: "Stakeholder Relations Expert",
    expertise: "Behavioral psychology, relationship dynamics, influence mapping",
    perspective: "Understanding motivations, predicting reactions, building coalitions",
    tone: "Empathetic, insightful, relationship-focused",
    prompts: {
      system: `You are a stakeholder psychology expert who specializes in understanding motivations, predicting behaviors, and building strategic relationships. You have deep expertise in organizational psychology, influence dynamics, and coalition building. You see stakeholders as complex actors with multiple motivations.`,
      analysis_framework: `Analyze stakeholders through:
1. Motivation Mapping - What drives each stakeholder group?
2. Influence Networks - Who influences whom?
3. Sentiment Triggers - What causes sentiment shifts?
4. Coalition Potential - Which groups could align?
5. Engagement Psychology - How to effectively engage each group`
    }
  },
  
  narrative_architect: {
    name: "Narrative Strategy Architect",
    expertise: "Media dynamics, narrative construction, message resonance",
    perspective: "Building compelling narratives that advance strategic goals",
    tone: "Creative, persuasive, narrative-focused",
    prompts: {
      system: `You are a master narrative strategist who understands how stories shape perception and drive action. You specialize in crafting narratives that resonate with target audiences, counter opposing narratives, and advance strategic objectives. You think in terms of story arcs, emotional resonance, and narrative momentum.`,
      analysis_framework: `Analyze narratives through:
1. Narrative Power - Which stories are gaining traction?
2. Emotional Resonance - What emotions do narratives evoke?
3. Narrative Gaps - What stories aren't being told?
4. Counter-Narratives - How to reshape unfavorable narratives?
5. Amplification Strategies - How to strengthen our narratives`
    }
  },
  
  risk_prophet: {
    name: "Predictive Risk Analyst",
    expertise: "Risk assessment, predictive modeling, cascade analysis",
    perspective: "Identifying hidden risks and predicting cascade effects",
    tone: "Cautious, thorough, probabilistic",
    prompts: {
      system: `You are a predictive risk analyst who specializes in identifying hidden risks, predicting cascade effects, and developing mitigation strategies. You think in terms of probabilities, interconnected systems, and non-linear effects. You excel at spotting weak signals that could become major issues.`,
      analysis_framework: `Analyze risks through:
1. Weak Signals - Early indicators of potential issues
2. Cascade Scenarios - How could small events trigger larger crises?
3. Vulnerability Assessment - Where are we most exposed?
4. Black Swan Potential - Low probability, high impact events
5. Mitigation Strategies - How to reduce risk exposure`
    }
  },
  
  opportunity_hunter: {
    name: "Strategic Opportunity Scout",
    expertise: "Opportunity identification, market gaps, timing analysis",
    perspective: "Finding hidden opportunities and optimal timing",
    tone: "Optimistic, opportunistic, action-oriented",
    prompts: {
      system: `You are a strategic opportunity scout who excels at identifying hidden opportunities, market gaps, and optimal timing for strategic moves. You think in terms of market inefficiencies, unmet needs, and strategic windows. You balance boldness with pragmatism.`,
      analysis_framework: `Identify opportunities through:
1. Market Gaps - What needs aren't being met?
2. Timing Windows - When is the optimal time to act?
3. Resource Leverage - How can we maximize our advantages?
4. Partnership Potential - Who could amplify our impact?
5. First-Mover Advantages - Where can we lead the market?`
    }
  },
  
  executive_synthesizer: {
    name: "Executive Intelligence Synthesizer",
    expertise: "Strategic synthesis, decision support, executive communication",
    perspective: "C-suite perspective focusing on strategic implications",
    tone: "Concise, strategic, decision-focused",
    prompts: {
      system: `You are an executive intelligence advisor who synthesizes complex intelligence into clear, actionable insights for C-suite decision-making. You focus on strategic implications, resource allocation, and key decisions. You think in terms of ROI, strategic priorities, and organizational capabilities.`,
      analysis_framework: `Synthesize for executives through:
1. Strategic Implications - What does this mean for our strategy?
2. Decision Points - What decisions need to be made?
3. Resource Requirements - What resources are needed?
4. Success Metrics - How will we measure success?
5. Action Priorities - What should we do first?`
    }
  }
}

// Get organizational memory and context with fallbacks
async function getOrganizationalContext(organizationId: string) {
  try {
    // Basic organization context - use fallback if table doesn't exist
    let org = null
    try {
      const { data } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', organizationId)
        .single()
      org = data
    } catch (err) {
      console.log('Organizations table not available, using default context')
      org = {
        id: organizationId,
        name: 'Organization',
        industry: 'Technology',
        size: 'Medium'
      }
    }
    
    // Get historical patterns if available
    let memories = []
    try {
      const { data } = await supabase
        .from('memory_vault')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(10)
      memories = data || []
    } catch (err) {
      console.log('Memory vault not available')
    }
    
    // Get previous intelligence reports if available
    let reports = []
    try {
      const { data } = await supabase
        .from('intelligence_reports')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(5)
      reports = data || []
    } catch (err) {
      console.log('Intelligence reports table not available')
    }
    
    // Get active campaigns if available
    let campaigns = []
    try {
      const { data } = await supabase
        .from('campaigns')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('status', 'active')
      campaigns = data || []
    } catch (err) {
      console.log('Campaigns table not available')
    }
    
    return {
      organization: org,
      historical_patterns: memories.map(m => ({
        type: m.memory_type || 'general',
        insight: m.content || 'No specific patterns available',
        learned_at: m.created_at || new Date().toISOString()
      })),
      recent_intelligence: reports.map(r => ({
        type: r.report_type || 'general',
        key_findings: r.key_findings || 'No recent findings',
        date: r.created_at || new Date().toISOString()
      })),
      active_initiatives: campaigns.map(c => ({
        name: c.name || 'Active Initiative',
        objective: c.objective || 'Strategic objective',
        status: c.status || 'active'
      }))
    }
  } catch (error) {
    console.error('Error fetching organizational context:', error)
    // Return minimal fallback context
    return {
      organization: {
        id: organizationId,
        name: 'Organization',
        industry: 'Technology',
        size: 'Medium'
      },
      historical_patterns: [],
      recent_intelligence: [],
      active_initiatives: []
    }
  }
}

// Analyze with specific persona
async function analyzeWithPersona(
  persona: any,
  prompt: string,
  context: any,
  requiresSecondOpinion: boolean = false
) {
  const fullPrompt = `${persona.prompts.system}

ORGANIZATIONAL CONTEXT:
${JSON.stringify(context, null, 2)}

${persona.prompts.analysis_framework}

ANALYSIS REQUEST:
${prompt}

Provide analysis in JSON format with clear structure and actionable insights.`

  try {
    // Primary analysis
    const primaryAnalysis = await callClaude(fullPrompt, 'claude-sonnet-4-20250514')
    
    // Second opinion for critical insights
    if (requiresSecondOpinion) {
      try {
        const secondOpinionPrompt = `You are providing a second opinion on this analysis:

PRIMARY ANALYSIS:
${primaryAnalysis}

Please:
1. Identify any blind spots or overlooked aspects
2. Challenge key assumptions
3. Suggest alternative interpretations
4. Highlight additional risks or opportunities
5. Provide confidence level (0-100) for the primary analysis

Format as JSON with your assessment including a "confidence_level" field.`
        
        const secondOpinion = await callClaude(secondOpinionPrompt, 'claude-sonnet-4-20250514')
        
        const primaryData = JSON.parse(primaryAnalysis)
        const secondaryData = JSON.parse(secondOpinion)
        
        return {
          primary_analysis: primaryData,
          second_opinion: secondaryData,
          consensus_level: calculateConsensus(primaryAnalysis, secondOpinion)
        }
      } catch (error) {
        console.error('Second opinion processing failed:', error)
        // Return primary analysis only if second opinion fails
        return JSON.parse(primaryAnalysis)
      }
    }
    
    return JSON.parse(primaryAnalysis)
  } catch (error) {
    console.error(`Analysis error with persona ${persona.name}:`, error)
    // Return fallback analysis structure
    return getFallbackAnalysis(persona.name, prompt, context)
  }
}

// Provide fallback analysis when Claude API fails
function getFallbackAnalysis(personaName: string, prompt: string, context: any) {
  const timestamp = new Date().toISOString()
  
  return {
    analysis_type: personaName.toLowerCase().replace(' ', '_'),
    status: 'fallback_analysis',
    key_insights: [
      `Intelligence data gathered from MCP sources`,
      `Analysis pending due to service interruption`,
      `Will retry synthesis when service is restored`
    ],
    recommendations: [
      `Continue monitoring with MCP agents`,
      `Review data manually if urgent decisions needed`,
      `Schedule follow-up analysis when services are available`
    ],
    confidence_level: 50,
    generated_at: timestamp,
    note: `Fallback analysis generated due to ${personaName} synthesis service interruption`
  }
}

// Call Claude API
async function callClaude(prompt: string, model: string = 'claude-sonnet-4-20250514') {
  if (!ANTHROPIC_API_KEY) {
    console.error('❌ ANTHROPIC_API_KEY is not set!')
    throw new Error('API key not configured')
  }
  
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model,
        max_tokens: 2000,
        temperature: 0.3,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Claude API error:', response.status, errorText)
      throw new Error(`Claude API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    
    if (!data.content || !data.content[0] || !data.content[0].text) {
      console.error('Invalid Claude API response structure:', data)
      throw new Error('Invalid Claude API response structure')
    }
    
    return data.content[0].text
  } catch (error) {
    console.error('Claude API call failed:', error)
    throw error
  }
}

// Calculate consensus between analyses
function calculateConsensus(primary: string, secondary: string): number {
  // Simple consensus calculation - can be enhanced
  try {
    if (!primary || !secondary) {
      return 70 // Default if either analysis is missing
    }
    
    const primaryData = JSON.parse(primary)
    const secondaryData = JSON.parse(secondary)
    
    // Extract confidence level from secondary opinion
    const confidence = secondaryData?.confidence_level || 
                      secondaryData?.assessment?.confidence_level || 
                      75
    
    return Math.min(Math.max(confidence, 0), 100) // Ensure 0-100 range
  } catch (error) {
    console.error('Consensus calculation error:', error)
    return 70 // Default fallback
  }
}

// Store analysis in memory for future reference
async function storeInMemory(
  organizationId: string,
  analysisType: string,
  analysis: any,
  metadata: any
) {
  try {
    await supabase.from('memory_vault').insert({
      organization_id: organizationId,
      memory_type: `intelligence_${analysisType}`,
      content: analysis,
      metadata: {
        ...metadata,
        stored_at: new Date().toISOString(),
        personas_used: metadata.personas
      }
    })
    console.log(`✅ Stored ${analysisType} analysis in memory vault`)
  } catch (error) {
    console.log(`⚠️ Memory vault not available, analysis will not be stored: ${error.message}`)
  }
}

// Main analysis orchestrator
async function orchestrateAnalysis(
  intelligenceType: string,
  mcpData: any,
  organization: any,
  goals: any,
  timeframe: string
) {
  // Get full organizational context
  const context = await getOrganizationalContext(organization.id)
  
  // Determine which personas to use
  let personasToUse = []
  let requiresSecondOpinion = false
  
  switch (intelligenceType) {
    case 'competitor':
      personasToUse = [ANALYSIS_PERSONAS.competitive_strategist]
      requiresSecondOpinion = true // Critical for strategic decisions
      break
      
    case 'stakeholder':
      personasToUse = [ANALYSIS_PERSONAS.stakeholder_psychologist]
      break
      
    case 'narrative':
      personasToUse = [ANALYSIS_PERSONAS.narrative_architect]
      break
      
    case 'predictive':
      personasToUse = [ANALYSIS_PERSONAS.risk_prophet, ANALYSIS_PERSONAS.opportunity_hunter]
      requiresSecondOpinion = true // Critical for risk assessment
      break
      
    case 'executive_summary':
      personasToUse = [ANALYSIS_PERSONAS.executive_synthesizer]
      requiresSecondOpinion = true // Executive decisions need validation
      break
      
    default:
      personasToUse = [
        ANALYSIS_PERSONAS.competitive_strategist,
        ANALYSIS_PERSONAS.stakeholder_psychologist
      ]
  }
  
  // Build analysis prompt with goals and context
  const analysisPrompt = `
ANALYSIS TYPE: ${intelligenceType}
TIMEFRAME: ${timeframe}

ORGANIZATION:
Name: ${organization.name}
Industry: ${organization.industry}
Size: ${organization.size}

STRATEGIC GOALS:
${Object.entries(goals || {})
  .filter(([_, enabled]) => enabled)
  .map(([goal]) => `- ${goal}`)
  .join('\n')}

RAW INTELLIGENCE DATA:
${JSON.stringify(mcpData, null, 2)}

Analyze this intelligence data through the lens of our strategic goals and provide actionable insights.`

  // Perform analysis with each persona
  const analyses = await Promise.all(
    personasToUse.map(persona => 
      analyzeWithPersona(persona, analysisPrompt, context, requiresSecondOpinion)
    )
  )
  
  // Combine analyses if multiple personas used
  const combinedAnalysis = personasToUse.length > 1 
    ? combineAnalyses(analyses, personasToUse)
    : analyses[0]
  
  // Store in memory for future reference
  await storeInMemory(
    organization.id,
    intelligenceType,
    combinedAnalysis,
    {
      personas: personasToUse.map(p => p.name),
      timeframe,
      goals: Object.keys(goals).filter(g => goals[g])
    }
  )
  
  return combinedAnalysis
}

// Combine multiple persona analyses
function combineAnalyses(analyses: any[], personas: any[]) {
  const combined = {
    multi_perspective_analysis: {},
    consensus_insights: [],
    divergent_views: [],
    combined_recommendations: [],
    overall_confidence: 0
  }
  
  let confidenceSum = 0
  let confidenceCount = 0
  
  // Aggregate insights from each persona
  analyses.forEach((analysis, index) => {
    if (!analysis) return // Skip null analyses
    
    const personaName = personas[index]?.name || `Persona_${index}`
    combined.multi_perspective_analysis[personaName] = analysis
    
    // Extract consensus and divergent views
    if (analysis.second_opinion && analysis.consensus_level) {
      confidenceSum += analysis.consensus_level
      confidenceCount++
    } else if (analysis.primary_analysis || analysis.key_insights) {
      // Default confidence for primary analysis without second opinion
      confidenceSum += 75
      confidenceCount++
    }
  })
  
  // Calculate average confidence
  combined.overall_confidence = confidenceCount > 0 ? 
    Math.round(confidenceSum / confidenceCount) : 70
  
  return combined
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { 
      intelligence_type, 
      mcp_data, 
      organization, 
      goals,
      timeframe = '24h'
    } = body

    console.log(`🧠 Claude V2 synthesizing ${intelligence_type} for ${organization?.name || 'Unknown Organization'}`)
    console.log(`📊 Using specialized personas with organizational context`)
    console.log(`📝 Request data:`, {
      intelligence_type,
      has_mcp_data: !!mcp_data,
      organization_name: organization?.name,
      goals_count: Object.keys(goals || {}).length
    })

    if (!intelligence_type || !mcp_data) {
      throw new Error('Missing required fields: intelligence_type and mcp_data are required')
    }

    const synthesizedIntelligence = await orchestrateAnalysis(
      intelligence_type,
      mcp_data,
      organization || { id: 'default', name: 'Default Organization' },
      goals || {},
      timeframe
    )

    return new Response(
      JSON.stringify({
        success: true,
        intelligence_type,
        organization: organization?.name,
        analysis: synthesizedIntelligence,
        personas_used: Object.keys(ANALYSIS_PERSONAS).filter(p => 
          intelligence_type === 'executive_summary' ? p === 'executive_synthesizer' :
          intelligence_type === 'competitor' ? p === 'competitive_strategist' :
          intelligence_type === 'stakeholder' ? p === 'stakeholder_psychologist' :
          intelligence_type === 'narrative' ? p === 'narrative_architect' :
          intelligence_type === 'predictive' ? ['risk_prophet', 'opportunity_hunter'].includes(p) :
          false
        ),
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
    console.error('❌ Claude V2 synthesis error:', error)
    
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