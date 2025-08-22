// Intelligence Synthesis - Phase 4 (Claude Analysis with 5 Personas)
// Takes raw gathered data and produces rich, insightful analysis

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"

// Helper to call Claude synthesizer
async function callClaudeSynthesizer(data: any, organization: any) {
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 50000) // 50 seconds for Claude (needs 38+ to complete)
    
    const response = await fetch(`${SUPABASE_URL}/functions/v1/claude-intelligence-synthesizer-v6`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({
        intelligence: {
          raw_intelligence: data,
          discovered_context: organization,
          organization: organization.name,
          industry: organization.industry,
          timestamp: new Date().toISOString()
        }
      }),
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)
    
    if (!response.ok) {
      console.error(`Claude synthesizer failed with status ${response.status}`)
      return { success: false, error: `HTTP ${response.status}` }
    }
    
    const result = await response.json()
    return { success: true, analysis: result.analysis || result }
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('Claude synthesis timed out')
      return { success: false, error: 'Timeout' }
    }
    console.error('Claude synthesis error:', error)
    return { success: false, error: error.message }
  }
}

async function synthesizeIntelligence(gatheringData: any, organization: any) {
  console.log(`🧠 Starting Intelligence Synthesis for ${organization.name}`)
  
  const result = {
    success: true,
    organization: organization.name,
    industry: gatheringData.discovered_context?.primary_category || organization.industry || 'unknown',
    timestamp: new Date().toISOString(),
    synthesis_complete: false,
    intelligence: {},
    statistics: {
      total_sources: Object.keys(gatheringData.raw_intelligence || {}).length,
      total_insights: 0,
      personas_engaged: 0,
      second_opinions: 0
    }
  }
  
  try {
    // Prepare the data for synthesis
    const mcpData = gatheringData.raw_intelligence || {}
    const discoveryContext = gatheringData.discovered_context || {}
    
    // Build comprehensive organization context
    const fullOrganization = {
      name: organization.name,
      industry: discoveryContext.primary_category || organization.industry,
      competitors: discoveryContext.competitors || [],
      stakeholders: ['investors', 'customers', 'employees', 'media', 'regulators'],
      topics: discoveryContext.search_keywords || [],
      keywords: discoveryContext.search_keywords || [],
      intelligence_focus: discoveryContext.intelligence_focus || []
    }
    
    console.log('📊 Synthesis context:')
    console.log(`   Sources: ${result.statistics.total_sources}`)
    console.log(`   Competitors: ${fullOrganization.competitors.length}`)
    console.log(`   Keywords: ${fullOrganization.keywords.length}`)
    
    // Call Claude for comprehensive synthesis
    const synthesisResult = await callClaudeSynthesizer(mcpData, fullOrganization)
    
    if (synthesisResult.success && synthesisResult.analysis) {
      console.log('✅ Claude synthesis successful')
      
      const synthesis = synthesisResult.analysis
      
      // V5 returns pure analytical intelligence organized by category
      result.intelligence = {
        // Store the full V5 analysis for display
        synthesized: synthesis,
        
        // CRITICAL FIX: tabs should reference the same V5 structure
        // This ensures dataFormatter can detect V5 structure properly
        tabs: synthesis,
        
        // Executive summary from market activity
        executive_summary: synthesis.market_activity?.summary || `Intelligence analysis for ${organization.name}`,
        
        // Key statistics
        statistics: {
          total_articles: synthesis.market_activity?.statistics?.total_articles || 0,
          competitors_tracked: synthesis.competitor_intelligence?.competitors_tracked?.length || 0,
          social_posts: synthesis.social_pulse?.total_posts || 0,
          media_sources: synthesis.media_coverage?.source_count || 0
        },
        
        // Metadata
        organization: organization.name,
        industry: fullOrganization.industry,
        timestamp: new Date().toISOString(),
        
        // Raw data preserved for drill-down
        raw_data: {
          news: mcpData['news-intelligence'] || {},
          reddit: mcpData['reddit-intelligence'] || {},
          twitter: mcpData['twitter-intelligence'] || {},
          google: mcpData['google-intelligence'] || {},
          pr: mcpData['pr-intelligence'] || {},
          scraper: mcpData['scraper-intelligence'] || {}
        }
      }
      
      // Update statistics
      result.statistics.total_insights = 
        (synthesis.market_activity?.key_findings?.length || 0) +
        (synthesis.competitor_intelligence?.movements?.length || 0) +
        (synthesis.industry_signals?.indicators?.length || 0)
      result.statistics.personas_engaged = 1 // V5 uses single analytical persona
      result.statistics.second_opinions = 0 // V5 doesn't provide alternative perspectives
      
      result.synthesis_complete = true
      
      console.log('📊 Synthesis complete:')
      console.log(`   Insights: ${result.statistics.total_insights}`)
      console.log(`   Personas: ${result.statistics.personas_engaged}`)
      console.log(`   Second opinions: ${result.statistics.second_opinions}`)
      
    } else {
      console.error('❌ Claude synthesis failed:', synthesisResult.error)
      
      // Build basic intelligence from raw data
      result.intelligence = buildBasicIntelligence(mcpData, fullOrganization)
      result.synthesis_complete = false
    }
    
  } catch (error) {
    console.error('❌ Synthesis error:', error)
    result.success = false
    result.error = error.message
  }
  
  return result
}

// Fallback function to build basic intelligence if Claude fails
function buildBasicIntelligence(mcpData: any, organization: any) {
  const news = mcpData['news-intelligence'] || {}
  const pr = mcpData['pr-intelligence'] || {}
  const reddit = mcpData['reddit-intelligence'] || {}
  
  return {
    executive_summary: `Analysis for ${organization.name} based on available data sources.`,
    key_insights: [
      news.totalArticles && `${news.totalArticles} news articles analyzed`,
      news.breakingNews?.length && `${news.breakingNews.length} breaking news items`,
      news.opportunities?.length && `${news.opportunities.length} opportunities identified`
    ].filter(Boolean),
    critical_alerts: news.alerts || [],
    recommendations: ['Continue monitoring for developments'],
    
    competitors: organization.competitors || [],
    competitive_landscape_summary: 'Competitive analysis pending',
    competitor_activity: news.competitorActivity || [],
    
    industry_trends: news.industryNews || [],
    breaking_news: news.breakingNews || [],
    opportunities: news.opportunities || [],
    discussions: reddit.discussions || [],
    press_releases: pr.pressReleases || [],
    
    alternative_perspectives: []
  }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }
  
  try {
    const { gathering_data, organization } = await req.json()
    
    if (!gathering_data || !organization?.name) {
      throw new Error('Gathering data and organization name are required')
    }
    
    const result = await synthesizeIntelligence(gathering_data, organization)
    
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