// Claude Intelligence Synthesizer V4 - Analytical Intelligence Focus
// Purpose: Analyze and organize raw data into intelligence insights
// NOT strategic recommendations - pure analytical intelligence

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400'
}

// const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')

// Single analytical persona - focused on organizing and analyzing data
const INTELLIGENCE_ANALYST = {
  name: "Intelligence Analyst",
  role: "Analyze raw data and organize into structured intelligence",
  system_prompt: `You are an intelligence analyst. Your job is to analyze raw data and organize it into structured intelligence insights. You DO NOT make strategic recommendations or tell companies what to do. You present facts, patterns, and analytical observations.

Your analysis principles:
1. Present what IS happening, not what SHOULD be done
2. Identify patterns and trends in the data
3. Surface key facts and developments
4. Organize intelligence by relevance to different stakeholders
5. Provide analytical context without prescriptive advice

Focus on:
- What competitors are actually doing
- What stakeholders are actually saying
- What topics are actually trending
- What patterns suggest about future developments

Avoid:
- Strategic recommendations
- Prescriptive advice
- Telling the company what to do
- Making assumptions beyond the data`,

  analysis_prompt: (mcpData: any, organization: any) => `
ORGANIZATION: ${organization.name}
INDUSTRY: ${organization.industry}
COMPETITORS: ${organization.competitors?.join(', ') || 'Unknown'}

RAW INTELLIGENCE DATA:
${JSON.stringify(mcpData, null, 2)}

Analyze this data and create structured intelligence for each area. Focus on what the data actually shows.

Return a JSON object with this structure:
{
  "overview": {
    "data_summary": "What data we have and key patterns observed",
    "key_developments": ["Actual developments from the data"],
    "notable_patterns": ["Patterns observed in the data"],
    "data_gaps": ["What information is missing"]
  },
  "competition": {
    "competitor_activity": ["What competitors are actually doing based on news/PR"],
    "market_movements": ["Observable market changes"],
    "competitive_developments": ["New products, partnerships, announcements"],
    "relative_positioning": "How competitors are positioned based on coverage"
  },
  "stakeholders": {
    "sentiment_observed": "What sentiment we can actually see in discussions",
    "key_discussions": ["Main topics being discussed"],
    "stakeholder_concerns": ["Actual concerns expressed"],
    "engagement_levels": "Volume and intensity of stakeholder discussions"
  },
  "topics": {
    "trending_topics": ["What topics are actually trending in the data"],
    "media_coverage": ["Key themes in media coverage"],
    "narrative_themes": ["Recurring narratives in the data"],
    "coverage_analysis": "Patterns in how topics are being covered"
  },
  "predictions": {
    "trend_analysis": "Based on current data patterns",
    "emerging_patterns": ["Patterns that suggest future developments"],
    "momentum_indicators": ["What's gaining or losing momentum"],
    "timeline_observations": "When developments are likely based on patterns"
  }
}

IMPORTANT: Only include insights that are directly supported by the data provided. If data is missing for a section, acknowledge the gap rather than making assumptions.`
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
        temperature: 0.3, // Lower temperature for more factual analysis
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

// Main analytical synthesis
async function performAnalyticalSynthesis(
  mcpData: any,
  organization: any,
  discoveryContext: any
) {
  console.log('📊 Starting Analytical Intelligence Synthesis')
  
  try {
    // Prepare the data for analysis
    const enrichedOrg = {
      name: organization.name,
      industry: discoveryContext?.primary_category || organization.industry,
      competitors: discoveryContext?.competitors || organization.competitors || [],
      keywords: discoveryContext?.search_keywords || []
    }
    
    // Count actual data points
    const dataStats = {
      newsArticles: mcpData['news-intelligence']?.totalArticles || 0,
      pressReleases: mcpData['pr-intelligence']?.pressReleases?.length || 0,
      websites: mcpData['scraper-intelligence']?.websites?.length || 0,
      discussions: mcpData['reddit-intelligence']?.discussions?.length || 0
    }
    
    console.log('📈 Data points:', dataStats)
    
    // Only proceed if we have actual data
    if (Object.values(dataStats).reduce((a, b) => a + b, 0) === 0) {
      console.log('⚠️ No data to analyze')
      return {
        success: false,
        error: 'No data available for analysis',
        analysis: null
      }
    }
    
    // Call Claude for analytical synthesis
    console.log('🔍 Performing analytical synthesis...')
    const analysisPrompt = INTELLIGENCE_ANALYST.analysis_prompt(mcpData, enrichedOrg)
    const analysisResult = await callClaude(
      analysisPrompt,
      INTELLIGENCE_ANALYST.system_prompt
    )
    
    let analysis
    try {
      analysis = JSON.parse(analysisResult)
      console.log('✅ Analysis complete')
    } catch (e) {
      console.error('Failed to parse analysis:', e)
      // Return structured error response
      return {
        success: false,
        error: 'Analysis parsing failed',
        analysis: null
      }
    }
    
    return {
      success: true,
      analysis: analysis,
      metadata: {
        data_points: dataStats,
        analysis_complete: true,
        organization: organization.name,
        timestamp: new Date().toISOString()
      }
    }
    
  } catch (error) {
    console.error('❌ Synthesis error:', error)
    return {
      success: false,
      error: error.message,
      analysis: null
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
      discovery_context
    } = body
    
    if (!mcp_data || !organization) {
      throw new Error('Missing required parameters: mcp_data and organization')
    }
    
    console.log('📥 Synthesis request:', {
      organization: organization.name,
      hasDiscoveryContext: !!discovery_context,
      dataSources: Object.keys(mcp_data || {})
    })
    
    const result = await performAnalyticalSynthesis(
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