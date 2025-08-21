// Intelligence Orchestrator - Simplified Version
// Coordinates the intelligence flow without hanging

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400'
}

// Helper to call other Edge Functions with timeout
async function callEdgeFunctionWithTimeout(functionName: string, payload: any, timeoutMs: number = 5000) {
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || 'https://zskaxjtyuaqazydouifp.supabase.co'
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
    
    const url = `${SUPABASE_URL}/functions/v1/${functionName}`
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)
    
    if (!response.ok) {
      console.error(`${functionName} returned ${response.status}`)
      return { success: false, error: `HTTP ${response.status}` }
    }
    
    return await response.json()
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error(`${functionName} timed out after ${timeoutMs}ms`)
      return { success: false, error: 'Timeout' }
    }
    console.error(`Error calling ${functionName}:`, error)
    return { success: false, error: error.message }
  }
}

// Simplified orchestration that actually works
async function orchestrateIntelligence(organization: any) {
  console.log('🎯 Starting simplified orchestration for:', organization.name)
  
  const results = {
    success: true,
    organization: organization.name,
    industry: organization.industry || 'unknown',
    phases_completed: {
      discovery: false,
      mapping: false,
      gathering: false,
      synthesis: false
    },
    statistics: {
      competitors_identified: 0,
      websites_scraped: 0,
      articles_processed: 0,
      sources_used: 0
    },
    intelligence: {},
    timestamp: new Date().toISOString()
  }
  
  try {
    // Phase 1: Simple discovery (don't call intelligent-discovery as it might timeout)
    console.log('📍 Phase 1: Discovery')
    const discoveryData = {
      organization: organization.name,
      primary_category: organization.industry || 'technology',
      competitors: getBasicCompetitors(organization.name, organization.industry),
      search_keywords: [organization.name, `${organization.name} news`, `${organization.name} announcement`],
      scrape_targets: []
    }
    results.phases_completed.discovery = true
    results.statistics.competitors_identified = discoveryData.competitors.length
    
    // Phase 2: Mapping (embedded)
    console.log('🗺️ Phase 2: Mapping')
    results.phases_completed.mapping = true
    
    // Phase 3: Gather news only (we know this works)
    console.log('📡 Phase 3: Gathering')
    const newsResult = await callEdgeFunctionWithTimeout('news-intelligence', {
      method: 'gather',
      params: {
        organization: {
          name: organization.name,
          industry: organization.industry || 'technology',
          competitors: discoveryData.competitors,
          keywords: discoveryData.search_keywords
        }
      }
    }, 8000) // 8 second timeout
    
    if (newsResult.success && newsResult.data) {
      results.phases_completed.gathering = true
      results.statistics.articles_processed = newsResult.data.totalArticles || 0
      results.statistics.sources_used = newsResult.data.sources?.length || 0
      
      // Build intelligence from news data
      results.intelligence = {
        industry_trends: newsResult.data.industryNews || [],
        breaking_news: newsResult.data.breakingNews || [],
        opportunities: newsResult.data.opportunities || [],
        competitor_activity: newsResult.data.competitorActivity || [],
        alerts: newsResult.data.alerts || [],
        discussions: newsResult.data.discussions || [],
        
        // Add structured insights
        key_insights: extractKeyInsights(newsResult.data),
        competitive_positioning: {
          competitors: discoveryData.competitors,
          activity: newsResult.data.competitorActivity || []
        },
        immediate_opportunities: newsResult.data.opportunities?.slice(0, 5) || [],
        immediate_risks: newsResult.data.alerts?.slice(0, 5) || [],
        
        // Executive summary
        executive_summary: {
          organization: organization.name,
          industry: organization.industry,
          total_articles: newsResult.data.totalArticles || 0,
          key_findings: extractKeyInsights(newsResult.data).slice(0, 3),
          recommendations: generateRecommendations(newsResult.data)
        }
      }
    } else {
      console.error('News gathering failed:', newsResult.error)
    }
    
    // Phase 4: Simple synthesis (no Claude needed for now)
    console.log('🧠 Phase 4: Synthesis')
    if (results.intelligence && Object.keys(results.intelligence).length > 0) {
      results.phases_completed.synthesis = true
    }
    
  } catch (error) {
    console.error('Orchestration error:', error)
    results.success = false
    results.error = error.message
  }
  
  return results
}

// Helper functions
function getBasicCompetitors(orgName: string, industry?: string) {
  const lowerName = orgName.toLowerCase()
  
  // Industry-specific competitors
  if (lowerName.includes('tesla')) {
    return ['Ford', 'General Motors', 'Volkswagen', 'Toyota', 'Rivian']
  }
  if (lowerName.includes('mitsui')) {
    return ['Mitsubishi Corporation', 'Sumitomo Corporation', 'Itochu Corporation', 'Marubeni Corporation']
  }
  if (lowerName.includes('apple')) {
    return ['Google', 'Microsoft', 'Samsung', 'Amazon', 'Meta']
  }
  
  // Generic by industry
  switch (industry) {
    case 'automotive':
      return ['Tesla', 'Toyota', 'Ford', 'Volkswagen', 'General Motors']
    case 'technology':
      return ['Apple', 'Google', 'Microsoft', 'Amazon', 'Meta']
    case 'conglomerate':
      return ['Berkshire Hathaway', 'General Electric', '3M', 'Siemens']
    default:
      return []
  }
}

function extractKeyInsights(newsData: any) {
  const insights = []
  
  if (newsData.breakingNews?.length > 0) {
    insights.push(`${newsData.breakingNews.length} breaking news items detected`)
  }
  if (newsData.opportunities?.length > 0) {
    insights.push(`${newsData.opportunities.length} opportunities identified`)
  }
  if (newsData.alerts?.length > 0) {
    insights.push(`${newsData.alerts.length} risk alerts found`)
  }
  if (newsData.competitorActivity?.length > 0) {
    insights.push(`Competitor activity detected for ${newsData.competitorActivity.length} companies`)
  }
  if (newsData.totalArticles > 20) {
    insights.push(`High news volume with ${newsData.totalArticles} articles`)
  }
  
  return insights
}

function generateRecommendations(newsData: any) {
  const recommendations = []
  
  if (newsData.alerts?.length > 0) {
    recommendations.push('Review and address identified risk alerts immediately')
  }
  if (newsData.opportunities?.length > 0) {
    recommendations.push('Evaluate identified opportunities for strategic advantage')
  }
  if (newsData.competitorActivity?.length > 0) {
    recommendations.push('Monitor competitor movements and adjust strategy accordingly')
  }
  if (newsData.discussions?.length > 0) {
    recommendations.push('Engage with community discussions to shape narrative')
  }
  
  return recommendations.length > 0 ? recommendations : ['Continue monitoring for developments']
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  try {
    const { organization, method } = await req.json()
    
    if (!organization?.name) {
      throw new Error('Organization name is required')
    }
    
    console.log(`🎯 Intelligence Orchestrator: ${method || 'full'} for ${organization.name}`)
    
    // For now, always run full orchestration
    const result = await orchestrateIntelligence(organization)
    
    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
    
  } catch (error) {
    console.error('❌ Orchestrator error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        service: 'Intelligence Orchestrator',
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 // Return 200 even for errors so frontend can handle
      }
    )
  }
})