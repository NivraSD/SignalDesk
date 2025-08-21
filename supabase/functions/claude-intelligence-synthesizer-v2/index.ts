// Claude Intelligence Synthesizer V2 - With Specialized Personas and Second Opinion Pattern
// Each persona has specific expertise and perspective for analyzing intelligence

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, withCors, jsonResponse, errorResponse } from '../_shared/cors.ts'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || 'https://zskaxjtyuaqazydouifp.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

// Log API key status for debugging
console.log('🔑 ANTHROPIC_API_KEY exists:', !!ANTHROPIC_API_KEY)
console.log('🔑 API Key length:', ANTHROPIC_API_KEY?.length || 0)
console.log('🔑 API Key starts with:', ANTHROPIC_API_KEY?.substring(0, 10))
console.log('🔑 All env vars:', Object.keys(Deno.env.toObject()))

// Initialize Supabase client for memory access
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY || '')

// Define specialized PR analysis personas
const ANALYSIS_PERSONAS = {
  competitive_strategist: {
    name: "Competitive PR Strategist",
    expertise: "Competitive PR positioning, media narrative control, thought leadership differentiation",
    perspective: "Focus on PR competitive advantages, share of voice, media positioning, and narrative dominance",
    tone: "Strategic, media-focused, narrative-driven",
    prompts: {
      system: `You are a senior competitive PR strategist specializing in media positioning and narrative control. You analyze competitor PR strategies, media coverage patterns, and identify opportunities for narrative dominance. You think in terms of share of voice, media sentiment, thought leadership positioning, and PR campaign effectiveness.`,
      analysis_framework: `Analyze through PR-focused lenses:
1. Media Positioning - How are competitors controlling the narrative?
2. Share of Voice - Who dominates media coverage and why?
3. PR Vulnerabilities - Where can we outmaneuver their messaging?
4. Media Response Strategies - What PR campaigns should we launch?
5. Thought Leadership Gaps - What stories aren't being told?`
    }
  },
  
  stakeholder_psychologist: {
    name: "Stakeholder Communications Expert",
    expertise: "Stakeholder messaging, influencer relations, community management",
    perspective: "Building PR coalitions, managing stakeholder narratives, crisis prevention",
    tone: "Empathetic, strategic, communications-focused",
    prompts: {
      system: `You are a stakeholder communications expert specializing in targeted messaging, influencer relations, and community narrative management. You excel at crafting messages that resonate with different audiences, building media coalitions, and preventing PR crises through proactive stakeholder engagement.`,
      analysis_framework: `Analyze stakeholder communications through:
1. Message Resonance - What PR messages work for each group?
2. Influencer Mapping - Which voices shape public opinion?
3. Narrative Alignment - How to align stakeholder communications?
4. Crisis Prevention - What stakeholder issues could become PR crises?
5. Engagement Campaigns - What PR campaigns for each stakeholder?`
    }
  },
  
  narrative_architect: {
    name: "Media Narrative Strategist",
    expertise: "Media storytelling, journalist relations, viral content strategy",
    perspective: "Crafting PR narratives that dominate news cycles and shape public opinion",
    tone: "Creative, media-savvy, newsworthy",
    prompts: {
      system: `You are a media narrative strategist who specializes in crafting stories that journalists want to cover. You understand news cycles, viral content mechanics, and how to position stories for maximum media pickup. You excel at creating PR narratives that dominate headlines and shape public discourse.`,
      analysis_framework: `Analyze media narratives through:
1. News Value - What makes our story newsworthy?
2. Journalist Angles - What angles will media cover?
3. Viral Potential - How can we create shareable PR content?
4. News Cycle Timing - When to launch PR campaigns?
5. Media Domination - How to own the narrative?`
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
async function getOrganizationalContext(organizationId: string | undefined) {
  try {
    // Basic organization context - use fallback if table doesn't exist or no ID
    let org = null
    
    if (organizationId) {
      try {
        const { data } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', organizationId)
          .single()
        org = data
      } catch (err) {
        console.log('Organizations table not available, using default context')
      }
    }
    
    // Always provide a default organization if none found
    if (!org) {
      org = {
        id: organizationId || 'default',
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

// Enhance organization data with built-in industry knowledge + Claude's intelligence
async function enhanceOrganizationData(organization: any, goals: any, enhancementPrompt: string) {
  // Built-in competitor data for key industries
  const COMPETITOR_DATA = {
    conglomerate: ['Mitsubishi Corporation', 'Sumitomo Corporation', 'Itochu Corporation', 'Marubeni Corporation', 
                   'Sojitz', 'Toyota Tsusho', 'Berkshire Hathaway', 'General Electric', 'Siemens', '3M'],
    trading: ['Mitsubishi Corporation', 'Mitsui & Co.', 'Sumitomo Corporation', 'Itochu Corporation', 
              'Marubeni', 'Sojitz', 'Glencore', 'Trafigura', 'Vitol', 'Cargill'],
    automotive: ['Toyota', 'Volkswagen', 'Tesla', 'General Motors', 'Ford', 'Stellantis', 'BMW', 'Mercedes-Benz'],
    technology: ['Microsoft', 'Google', 'Apple', 'Amazon', 'Meta', 'Oracle', 'Salesforce', 'Adobe'],
    finance: ['JPMorgan Chase', 'Bank of America', 'Wells Fargo', 'Goldman Sachs', 'Morgan Stanley', 'Citigroup']
  }
  
  // Detect industry from organization name or industry field
  const orgName = (organization.name || '').toLowerCase()
  const industry = (organization.industry || '').toLowerCase()
  
  let competitors = []
  let detectedIndustry = 'general'
  
  // Check for Japanese trading companies
  if (orgName.includes('mitsui') || orgName.includes('mitsubishi') || orgName.includes('sumitomo') || 
      orgName.includes('itochu') || orgName.includes('marubeni') || 
      industry.includes('conglomerate') || industry.includes('diversified') || industry.includes('trading')) {
    competitors = COMPETITOR_DATA.conglomerate
    detectedIndustry = 'conglomerate'
    console.log(`🎯 Detected Japanese trading company/conglomerate: ${organization.name}`)
  } else if (industry.includes('auto') || industry.includes('car') || industry.includes('vehicle')) {
    competitors = COMPETITOR_DATA.automotive
    detectedIndustry = 'automotive'
  } else if (industry.includes('tech') || industry.includes('software')) {
    competitors = COMPETITOR_DATA.technology
    detectedIndustry = 'technology'
  } else if (industry.includes('finance') || industry.includes('bank')) {
    competitors = COMPETITOR_DATA.finance
    detectedIndustry = 'finance'
  }
  
  console.log(`📊 Industry detected: ${detectedIndustry}, ${competitors.length} competitors identified`)
  
  // Start with real competitor data
  const baseData = {
    competitors: competitors,
    stakeholders: ['investors', 'employees', 'customers', 'regulators', 'partners'],
    topics: ['market trends', 'competitive positioning', 'industry news', 'strategic initiatives'],
    keywords: [organization.name, ...competitors.slice(0, 5)],
    industryInsights: {
      industry: detectedIndustry,
      competitive_landscape: `${organization.name} operates in the ${detectedIndustry} industry with ${competitors.length} major competitors`,
      key_trends: ['digital transformation', 'sustainability', 'market consolidation']
    }
  }
  
  // Try to get the key again in case it wasn't available at startup
  const apiKey = ANTHROPIC_API_KEY || Deno.env.get('ANTHROPIC_API_KEY')
  
  if (!apiKey) {
    console.error('❌ ANTHROPIC_API_KEY not configured, returning built-in data')
    console.error('Available env vars:', Object.keys(Deno.env.toObject()))
    return baseData
  }

  try {
    const systemPrompt = `You are an industry expert specializing in ${organization.industry || 'business'} intelligence.
Your task is to enhance organization data with industry-specific insights.

Focus on the ${organization.industry} industry specifically.
DO NOT suggest generic tech companies unless they are direct competitors in the ${organization.industry} space.

Return your response as a valid JSON object with this exact structure:
{
  "competitors": ["competitor1", "competitor2", "..."],
  "stakeholders": ["stakeholder_group1", "stakeholder_group2", "..."],
  "topics": ["topic1", "topic2", "..."],
  "keywords": ["keyword1", "keyword2", "..."],
  "industryInsights": {
    "key_trends": ["trend1", "trend2"],
    "market_dynamics": "brief description",
    "competitive_landscape": "brief description"
  }
}

For automotive industry, focus on car manufacturers, EV companies, and automotive suppliers.
For healthcare, focus on pharma, medical devices, and healthcare providers.
For finance, focus on banks, fintech, and financial services.

Output ONLY the JSON object, no markdown, no explanations.`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1000,
        temperature: 0.3,
        system: systemPrompt,
        messages: [{
          role: 'user',
          content: enhancementPrompt
        }]
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Claude API error:', errorText)
      throw new Error(`Claude API error: ${response.status}`)
    }

    const result = await response.json()
    const content = result.content[0].text
    
    // Parse the JSON response
    try {
      const enhanced = JSON.parse(content)
      console.log('✨ Organization enhanced with Claude')
      // IMPORTANT: Merge Claude's response with our base data, keeping our competitors
      return {
        ...enhanced,
        competitors: baseData.competitors.length > 0 ? baseData.competitors : enhanced.competitors,
        industryInsights: {
          ...enhanced.industryInsights,
          industry: detectedIndustry
        }
      }
    } catch (parseError) {
      console.error('Failed to parse Claude response:', content)
      // Return our base data if parsing fails
      return baseData
    }
  } catch (error) {
    console.error('Enhancement error:', error)
    // Return our base data on any error
    return baseData
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

CRITICAL: Return your analysis as a valid JSON object with this structure:
{
  "key_insights": ["insight1", "insight2", "insight3"],
  "recommendations": ["action1", "action2", "action3"],
  "analysis": "Detailed analysis text here",
  "confidence_level": 85,
  "risks": ["risk1", "risk2"],
  "opportunities": ["opp1", "opp2"]
}
Output ONLY the JSON object, no markdown, no explanations.`

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
        
        // Safely parse JSON responses
        let primaryData, secondaryData
        try {
          primaryData = JSON.parse(primaryAnalysis)
        } catch (e) {
          console.error('Failed to parse primary analysis:', e)
          primaryData = { analysis_text: primaryAnalysis, status: 'text_response' }
        }
        
        try {
          secondaryData = JSON.parse(secondOpinion)
        } catch (e) {
          console.error('Failed to parse second opinion:', e)
          secondaryData = { assessment: secondOpinion, confidence_level: 70 }
        }
        
        return {
          primary_analysis: primaryData,
          second_opinion: secondaryData,
          consensus_level: calculateConsensus(primaryAnalysis, secondOpinion)
        }
      } catch (error) {
        console.error('Second opinion processing failed:', error)
        // Return primary analysis only if second opinion fails
        // Try to parse the analysis, handle potential formatting issues
    try {
      return JSON.parse(primaryAnalysis)
    } catch (parseError) {
      console.error('Failed to parse primary analysis as JSON:', parseError)
      // Return a structured response with the raw text
      return {
        analysis_text: primaryAnalysis,
        status: 'text_response',
        note: 'Claude returned text instead of JSON'
      }
    }
      }
    }
    
    // Try to parse the analysis, handle potential formatting issues
    try {
      return JSON.parse(primaryAnalysis)
    } catch (parseError) {
      console.error('Failed to parse primary analysis as JSON:', parseError)
      // Return a structured response with the raw text
      return {
        analysis_text: primaryAnalysis,
        status: 'text_response',
        note: 'Claude returned text instead of JSON'
      }
    }
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

// Helper function for exponential backoff delay
async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Call Claude API with retry logic for 529 errors
async function callClaude(prompt: string, model: string = 'claude-sonnet-4-20250514', retryCount: number = 0): Promise<string> {
  // Try to get the key again in case it wasn't available at startup
  const apiKey = ANTHROPIC_API_KEY || Deno.env.get('ANTHROPIC_API_KEY')
  
  if (!apiKey) {
    console.error('❌ ANTHROPIC_API_KEY is not set!')
    throw new Error('API key not configured')
  }
  
  // Add delay if this is a retry (exponential backoff)
  if (retryCount > 0) {
    const waitTime = Math.min(1000 * Math.pow(2, retryCount - 1), 10000) // Max 10 seconds
    console.log(`⏱️ Waiting ${waitTime}ms before retry ${retryCount}/3...`)
    await delay(waitTime)
  }
  
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
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
      console.error(`Claude API error ${response.status}:`, errorText)
      
      // Handle 529 (overloaded) with retry
      if (response.status === 529 && retryCount < 3) {
        console.log(`🔄 Claude overloaded, retrying (${retryCount + 1}/3)...`)
        return callClaude(prompt, model, retryCount + 1)
      }
      
      // Handle 503 (service unavailable) with retry
      if (response.status === 503 && retryCount < 3) {
        console.log(`🔄 Claude unavailable, retrying (${retryCount + 1}/3)...`)
        return callClaude(prompt, model, retryCount + 1)
      }
      
      throw new Error(`Claude API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    
    if (!data.content || !data.content[0] || !data.content[0].text) {
      console.error('Invalid Claude API response structure:', data)
      throw new Error('Invalid Claude API response structure')
    }
    
    if (retryCount > 0) {
      console.log('✅ Claude API call successful after retry')
    }
    
    return data.content[0].text
  } catch (error) {
    console.error('Claude API call failed:', error)
    
    // If it's a network error and we haven't retried too much, retry
    if (retryCount < 3 && (error.message.includes('fetch') || error.message.includes('network'))) {
      console.log(`🔄 Network error, retrying (${retryCount + 1}/3)...`)
      return callClaude(prompt, model, retryCount + 1)
    }
    
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
  // Get full organizational context - handle missing organization safely
  const orgId = organization?.id || organization?.name?.toLowerCase().replace(/\s+/g, '_') || 'default'
  const context = await getOrganizationalContext(orgId)
  
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
      
    case 'comprehensive':
      // For comprehensive analysis, use all key personas
      personasToUse = [
        ANALYSIS_PERSONAS.executive_synthesizer,
        ANALYSIS_PERSONAS.competitive_strategist,
        ANALYSIS_PERSONAS.stakeholder_psychologist
      ]
      requiresSecondOpinion = false // Already using multiple perspectives
      break
      
    default:
      personasToUse = [
        ANALYSIS_PERSONAS.competitive_strategist,
        ANALYSIS_PERSONAS.stakeholder_psychologist
      ]
  }
  
  // Build analysis prompt with FULL context
  const analysisPrompt = `
ANALYSIS TYPE: ${intelligenceType}
TIMEFRAME: ${timeframe}

ORGANIZATION:
Name: ${organization?.name || 'Unknown Organization'}
Industry: ${organization?.industry || 'Unknown'}
Website: ${organization?.website || 'Not provided'}
Size: ${organization?.size || 'Not specified'}

COMPETITORS BEING TRACKED:
${organization.competitors?.length > 0 ? organization.competitors.join(', ') : 'No competitors specified'}

STAKEHOLDERS:
${organization.stakeholders ? JSON.stringify(organization.stakeholders, null, 2) : 'None specified'}

TOPICS/KEYWORDS:
Topics: ${organization.topics?.join(', ') || 'None'}
Keywords: ${organization.keywords?.join(', ') || 'None'}

STRATEGIC GOALS:
${Object.entries(goals || {})
  .filter(([_, enabled]) => enabled)
  .map(([goal]) => `- ${goal}`)
  .join('\n') || 'No goals specified'}

RAW INTELLIGENCE DATA:
${JSON.stringify(mcpData, null, 2)}

IMPORTANT CONTEXT:
- Focus on the specified competitors above, not generic tech companies
- Consider the industry context (${organization.industry})
- Align insights with the strategic goals listed
- Use stakeholder groups to frame recommendations

Analyze this intelligence data through the lens of our strategic goals and provide actionable PR insights.`

  // Perform analysis with each persona SEQUENTIALLY to avoid overload
  const analyses = []
  for (let i = 0; i < personasToUse.length; i++) {
    const persona = personasToUse[i]
    console.log(`🎭 Analyzing with persona ${i + 1}/${personasToUse.length}: ${persona.name}`)
    
    // Add delay between personas to avoid overloading Claude
    if (i > 0) {
      console.log('⏱️ Waiting 2 seconds before next persona...')
      await delay(2000)
    }
    
    try {
      const analysis = await analyzeWithPersona(persona, analysisPrompt, context, requiresSecondOpinion)
      analyses.push(analysis)
    } catch (error) {
      console.error(`Failed to analyze with ${persona.name}:`, error.message)
      // Continue with other personas even if one fails
      analyses.push(null)
    }
  }
  
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
  // For comprehensive analysis, we need to return a structure that matches what the frontend expects
  const combined = {
    // Executive summary as a STRING (not object)
    executive_summary: '',
    key_insights: [],
    recommendations: [],
    critical_alerts: [],
    competitors: [],
    opportunities: [],
    risks: [],
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
    
    // Extract executive summary from executive synthesizer
    if (personaName.includes('Executive')) {
      if (typeof analysis === 'string') {
        combined.executive_summary = analysis
      } else if (analysis.analysis) {
        combined.executive_summary = analysis.analysis
      } else if (analysis.primary_analysis?.analysis) {
        combined.executive_summary = analysis.primary_analysis.analysis
      } else if (analysis.executive_summary) {
        combined.executive_summary = analysis.executive_summary
      }
    }
    
    // Extract key insights
    if (analysis.key_insights && Array.isArray(analysis.key_insights)) {
      combined.key_insights.push(...analysis.key_insights)
    } else if (analysis.primary_analysis?.key_insights) {
      combined.key_insights.push(...analysis.primary_analysis.key_insights)
    }
    
    // Extract recommendations
    if (analysis.recommendations && Array.isArray(analysis.recommendations)) {
      combined.recommendations.push(...analysis.recommendations)
      combined.combined_recommendations.push(...analysis.recommendations)
    } else if (analysis.primary_analysis?.recommendations) {
      combined.recommendations.push(...analysis.primary_analysis.recommendations)
      combined.combined_recommendations.push(...analysis.primary_analysis.recommendations)
    }
    
    // Extract alerts/risks
    if (analysis.critical_alerts) {
      combined.critical_alerts.push(...analysis.critical_alerts)
    }
    if (analysis.risks) {
      combined.risks.push(...analysis.risks)
    }
    
    // Extract competitors
    if (analysis.competitors) {
      combined.competitors.push(...analysis.competitors)
    }
    
    // Extract opportunities
    if (analysis.opportunities) {
      combined.opportunities.push(...analysis.opportunities)
    }
    
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
  
  // Deduplicate arrays
  combined.key_insights = [...new Set(combined.key_insights)]
  combined.recommendations = [...new Set(combined.recommendations)]
  combined.combined_recommendations = [...new Set(combined.combined_recommendations)]
  
  // If no executive summary was extracted, create one from insights
  if (!combined.executive_summary && combined.key_insights.length > 0) {
    combined.executive_summary = `Analysis reveals ${combined.key_insights.length} key insights. ${combined.key_insights.slice(0, 2).join('. ')}. ${combined.recommendations.length} strategic recommendations have been identified.`
  }
  
  // Calculate average confidence
  combined.overall_confidence = confidenceCount > 0 ? 
    Math.round(confidenceSum / confidenceCount) : 70
  
  return combined
}

serve(withCors(async (req) => {
  try {
    const body = await req.json()
    const { 
      intelligence_type, 
      mcp_data, 
      organization, 
      goals,
      timeframe = '24h',
      prompt
    } = body

    console.log(`🧠 Claude V2 synthesizing ${intelligence_type} for ${organization?.name || 'Unknown Organization'}`)
    console.log(`📊 Using specialized personas with organizational context`)
    console.log(`📝 Request data:`, {
      intelligence_type,
      has_mcp_data: !!mcp_data,
      organization_name: organization?.name,
      goals_count: Object.keys(goals || {}).length
    })

    // Handle organization enhancement request
    if (intelligence_type === 'enhance_organization') {
      console.log('🔮 Enhancing organization data')
      
      const enhancedData = await enhanceOrganizationData(organization, goals, prompt)
      
      return jsonResponse(enhancedData)
    }
    
    // Handle company analysis for intelligent discovery
    if (intelligence_type === 'company_analysis') {
      console.log('🏢 Processing company analysis for intelligent discovery')
      
      // Use the enhance organization function for company analysis
      const analysisData = await enhanceOrganizationData(organization, goals || {}, prompt)
      
      return jsonResponse({
        success: true,
        intelligence_type,
        organization: organization?.name,
        analysis: analysisData,
        analyzed_at: new Date().toISOString()
      })
    }
    
    // Handle competitor discovery
    if (intelligence_type === 'competitor_discovery') {
      console.log('🎯 Processing competitor discovery')
      
      // Use the enhance organization function to discover competitors
      const analysisData = await enhanceOrganizationData(organization, goals || {}, prompt)
      
      return jsonResponse({
        success: true,
        intelligence_type,
        organization: organization?.name,
        analysis: analysisData,
        analyzed_at: new Date().toISOString()
      })
    }

    // For other intelligence types, mcp_data is required
    if (!intelligence_type) {
      throw new Error('Missing required field: intelligence_type')
    }
    
    if (!mcp_data && intelligence_type !== 'enhance_organization') {
      throw new Error('Missing required field: mcp_data is required for synthesis')
    }

    // Ensure organization has at least basic structure
    const safeOrganization = organization || { 
      id: 'default', 
      name: 'Default Organization',
      industry: 'general'
    }
    
    const synthesizedIntelligence = await orchestrateAnalysis(
      intelligence_type,
      mcp_data,
      safeOrganization,
      goals || {},
      timeframe
    )

    return jsonResponse({
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
    })

  } catch (error) {
    console.error('❌ Claude V2 synthesis error:', error)
    
    return errorResponse(
      error.message || 'Failed to synthesize intelligence',
      500
    )
  }
}))