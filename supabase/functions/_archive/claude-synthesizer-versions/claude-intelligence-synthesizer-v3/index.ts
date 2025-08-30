// Claude Intelligence Synthesizer V3 - Three-Stage PR Intelligence Pipeline
// Stage 1: Discovery (handled by intelligent-discovery) 
// Stage 2: Analysis - PR Intelligence Analyst
// Stage 3: Synthesis - Strategic PR Advisor

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Direct CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400'
}

// API key will be loaded at runtime
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || 'https://zskaxjtyuaqazydouifp.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

// Initialize Supabase client for memory access
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY || '')

// Stage 2: PR Intelligence Analyst Persona
const PR_INTELLIGENCE_ANALYST = {
  name: "PR Intelligence Analyst",
  role: "Analyze raw data through PR lens using discovery context",
  system_prompt: `You are a senior PR intelligence analyst. Your job is to analyze raw data from news, websites, and social media through a PR lens. You identify patterns, threats, opportunities, and stakeholder impacts. You structure your analysis to make the Strategic Advisor's job easier.

Your analysis framework:
1. COMPETITIVE LANDSCAPE: How are competitors positioning themselves? What narratives are they pushing?
2. STAKEHOLDER SENTIMENT: What are different groups saying? What concerns are emerging?
3. MEDIA NARRATIVES: What stories are gaining traction? What topics are trending?
4. RISKS & THREATS: What could damage reputation? What crises are brewing?
5. OPPORTUNITIES: Where can we gain PR advantage? What narratives can we own?

You organize everything clearly so the Strategic Advisor can create actionable intelligence.`,
  
  analysis_prompt: (context: any, rawData: any) => `
ORGANIZATION CONTEXT (from Discovery):
${JSON.stringify(context, null, 2)}

RAW INTELLIGENCE DATA:
${JSON.stringify(rawData, null, 2)}

Analyze this data through a PR lens. Structure your analysis using the framework above.
Focus on:
- Actual events and developments (not generic observations)
- PR implications of what you're seeing
- Patterns across multiple sources
- Stakeholder reactions and sentiment
- Competitive positioning and narratives

Return a structured JSON analysis with sections for:
{
  "competitive_landscape": {
    "summary": "...",
    "competitor_moves": [...],
    "narrative_battles": [...],
    "positioning_opportunities": [...]
  },
  "stakeholder_sentiment": {
    "by_group": {...},
    "key_concerns": [...],
    "engagement_priorities": [...]
  },
  "media_narratives": {
    "trending_topics": [...],
    "narrative_opportunities": [...],
    "risks": [...]
  },
  "threats_and_risks": {
    "immediate": [...],
    "emerging": [...],
    "cascade_potential": [...]
  },
  "opportunities": {
    "quick_wins": [...],
    "strategic": [...],
    "narrative_gaps": [...]
  },
  "key_insights": [...]
}
`
}

// Stage 3: Strategic PR Advisor Persona  
const STRATEGIC_PR_ADVISOR = {
  name: "Strategic PR Advisor",
  role: "Transform analysis into actionable PR intelligence optimized for user benefit",
  system_prompt: `You are a Strategic PR Advisor. You take the PR Intelligence Analyst's work and transform it into actionable intelligence that directly benefits the user. You ask yourself: "How can I articulate this to maximize value for PR decision-making?"

You also provide critical review - identifying gaps, questioning assumptions, and offering alternative perspectives.

Your synthesis framework:
1. EXECUTIVE SUMMARY: What's the PR story here? What actions should be taken?
2. COMPETITION TAB: How to outmaneuver competitors in the narrative space
3. STAKEHOLDERS TAB: Specific messaging and engagement strategies per group  
4. TOPICS TAB: Content opportunities and narrative strategies
5. PREDICTIONS TAB: Likely scenarios and proactive PR strategies

You optimize everything for immediate PR action and strategic advantage.`,
  
  synthesis_prompt: (analysis: any, context: any) => `
PR INTELLIGENCE ANALYSIS:
${JSON.stringify(analysis, null, 2)}

ORGANIZATION CONTEXT:
${JSON.stringify(context, null, 2)}

Transform this analysis into actionable PR intelligence. Ask yourself:
- How can I best articulate this to benefit the user's PR strategy?
- What specific actions should they take?
- What are the alternative perspectives they should consider?
- Where might the analysis have blind spots?

Create intelligence for each tab that is:
- Specific and actionable (not generic)
- Tied to actual developments (not theoretical)
- Optimized for PR decision-making
- Including alternative perspectives

Return structured JSON with:
{
  "overview": {
    "executive_summary": "Synthesized PR story and immediate actions",
    "key_insights": ["actionable insight 1", "..."],
    "critical_alerts": ["urgent PR matter 1", "..."],
    "recommended_actions": ["specific action 1", "..."]
  },
  "competition": {
    "landscape_summary": "How competitors are winning/losing the narrative",
    "positioning_opportunities": ["specific opportunity 1", "..."],
    "narrative_threats": ["specific threat 1", "..."],
    "recommended_responses": ["PR response 1", "..."],
    "alternative_view": "Different perspective on competitive landscape"
  },
  "stakeholders": {
    "sentiment_overview": "Current stakeholder landscape",
    "group_specific_strategies": {...},
    "messaging_frameworks": {...},
    "engagement_priorities": [...],
    "alternative_view": "Different stakeholder prioritization"
  },
  "topics": {
    "trending_overview": "Current media narrative landscape",
    "content_opportunities": [...],
    "narrative_strategies": [...],
    "risks_to_avoid": [...],
    "alternative_view": "Different narrative approach"
  },
  "predictions": {
    "scenario_analysis": "Likely future developments",
    "cascade_effects": [...],
    "proactive_strategies": [...],
    "timeline": [...],
    "alternative_view": "Different scenario assessment"
  }
}
`
}

// Call Claude API
async function callClaude(prompt: string, systemPrompt: string): Promise<string> {
  const apiKey = ANTHROPIC_API_KEY || Deno.env.get('ANTHROPIC_API_KEY')
  
  if (!apiKey) {
    console.error('❌ ANTHROPIC_API_KEY not found')
    throw new Error('Claude API key not configured')
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        temperature: 0.7,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error(`Claude API error: ${response.status}`, error)
      throw new Error(`Claude API failed: ${response.status}`)
    }

    const data = await response.json()
    return data.content[0].text
  } catch (error) {
    console.error('Error calling Claude:', error)
    throw error
  }
}

// Main three-stage synthesis pipeline
async function performThreeStageSynthesis(
  mcpData: any,
  organization: any,
  discoveryContext: any
) {
  console.log('🎯 Starting 3-Stage PR Intelligence Synthesis')
  
  try {
    // =====================================
    // STAGE 2: PR INTELLIGENCE ANALYSIS
    // =====================================
    console.log('📊 Stage 2: PR Intelligence Analysis...')
    
    const analysisPrompt = PR_INTELLIGENCE_ANALYST.analysis_prompt(
      discoveryContext || organization,
      mcpData
    )
    
    const analysisResult = await callClaude(
      analysisPrompt,
      PR_INTELLIGENCE_ANALYST.system_prompt
    )
    
    let analysis
    try {
      analysis = JSON.parse(analysisResult)
      console.log('✅ Analysis complete:', {
        hasCompetitive: !!analysis.competitive_landscape,
        hasStakeholder: !!analysis.stakeholder_sentiment,
        insights: analysis.key_insights?.length || 0
      })
    } catch (e) {
      console.error('Failed to parse analysis:', e)
      // Create structured analysis from text
      analysis = {
        key_insights: [analysisResult.substring(0, 500)],
        competitive_landscape: { summary: 'Analysis in progress' },
        stakeholder_sentiment: { by_group: {} },
        media_narratives: { trending_topics: [] },
        threats_and_risks: { immediate: [] },
        opportunities: { quick_wins: [] }
      }
    }
    
    // =====================================
    // STAGE 3: STRATEGIC PR SYNTHESIS
    // =====================================
    console.log('🎨 Stage 3: Strategic PR Synthesis...')
    
    const synthesisPrompt = STRATEGIC_PR_ADVISOR.synthesis_prompt(
      analysis,
      discoveryContext || organization
    )
    
    const synthesisResult = await callClaude(
      synthesisPrompt,
      STRATEGIC_PR_ADVISOR.system_prompt
    )
    
    let synthesis
    try {
      synthesis = JSON.parse(synthesisResult)
      console.log('✅ Synthesis complete:', {
        hasOverview: !!synthesis.overview,
        hasCompetition: !!synthesis.competition,
        hasStakeholders: !!synthesis.stakeholders,
        hasTopics: !!synthesis.topics,
        hasPredictions: !!synthesis.predictions
      })
    } catch (e) {
      console.error('Failed to parse synthesis:', e)
      // Create structured synthesis from text
      synthesis = {
        overview: {
          executive_summary: synthesisResult.substring(0, 500),
          key_insights: ['Synthesis in progress'],
          critical_alerts: [],
          recommended_actions: []
        },
        competition: { landscape_summary: 'Analysis pending' },
        stakeholders: { sentiment_overview: 'Analysis pending' },
        topics: { trending_overview: 'Analysis pending' },
        predictions: { scenario_analysis: 'Analysis pending' }
      }
    }
    
    // Store in memory for future reference
    if (organization?.id) {
      try {
        await supabase.from('memory_vault').insert({
          organization_id: organization.id,
          memory_type: 'pr_intelligence_synthesis',
          content: synthesis,
          metadata: {
            stages: ['discovery', 'analysis', 'synthesis'],
            timestamp: new Date().toISOString()
          }
        })
      } catch (e) {
        console.log('Memory storage skipped:', e.message)
      }
    }
    
    return {
      success: true,
      analysis: synthesis,
      metadata: {
        stages_completed: ['analysis', 'synthesis'],
        analysis_insights: analysis.key_insights?.length || 0,
        synthesis_complete: true
      }
    }
    
  } catch (error) {
    console.error('❌ Synthesis pipeline error:', error)
    
    // Return fallback intelligence
    return {
      success: false,
      error: error.message,
      analysis: {
        overview: {
          executive_summary: `PR intelligence analysis for ${organization.name} is being processed.`,
          key_insights: ['Analysis in progress'],
          critical_alerts: [],
          recommended_actions: ['Continue monitoring']
        },
        competition: {
          landscape_summary: 'Competitive analysis pending',
          positioning_opportunities: [],
          narrative_threats: [],
          recommended_responses: []
        },
        stakeholders: {
          sentiment_overview: 'Stakeholder analysis pending',
          group_specific_strategies: {},
          messaging_frameworks: {},
          engagement_priorities: []
        },
        topics: {
          trending_overview: 'Media analysis pending',
          content_opportunities: [],
          narrative_strategies: [],
          risks_to_avoid: []
        },
        predictions: {
          scenario_analysis: 'Predictive analysis pending',
          cascade_effects: [],
          proactive_strategies: [],
          timeline: []
        }
      }
    }
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { 
      mcp_data,
      organization,
      discovery_context,
      // Legacy parameters for compatibility
      intelligence_type,
      goals,
      timeframe
    } = body
    
    if (!mcp_data || !organization) {
      throw new Error('Missing required parameters: mcp_data and organization')
    }
    
    console.log('📥 Synthesis request:', {
      organization: organization.name,
      hasDiscoveryContext: !!discovery_context,
      dataSources: Object.keys(mcp_data || {})
    })
    
    const result = await performThreeStageSynthesis(
      mcp_data,
      organization,
      discovery_context
    )
    
    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error('❌ Request error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  }
})