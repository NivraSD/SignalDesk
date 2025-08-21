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
    const timeoutId = setTimeout(() => controller.abort(), 20000) // 20 seconds for Claude
    
    const response = await fetch(`${SUPABASE_URL}/functions/v1/claude-intelligence-synthesizer-v3`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({
        mcp_data: data,
        organization: organization,
        discovery_context: {
          ...organization,
          discovered_industry: organization.industry,
          competitors: organization.competitors || [],
          keywords: organization.keywords || [],
          intelligence_focus: organization.intelligence_focus || []
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
      
      // V3 returns structured tab data directly
      // Build comprehensive intelligence structure from v3 output
      result.intelligence = {
        // Overview tab data
        executive_summary: synthesis.overview?.executive_summary || `Strategic analysis for ${organization.name}`,
        key_insights: synthesis.overview?.key_insights || [],
        critical_alerts: synthesis.overview?.critical_alerts || [],
        recommendations: synthesis.overview?.recommended_actions || [],
        
        // Full synthesized analysis for reference
        synthesized: synthesis,
        
        // Competitive intelligence (from competition tab)
        competitors: fullOrganization.competitors,
        competitive_landscape_summary: synthesis.competition?.landscape_summary || '',
        competitive_opportunities: synthesis.competition?.positioning_opportunities || [],
        competitive_threats: synthesis.competition?.narrative_threats || [],
        competitor_activity: mcpData['news-intelligence']?.competitorActivity || [],
        
        // Stakeholder intelligence (from stakeholders tab)
        stakeholder_sentiment: synthesis.stakeholders?.group_specific_strategies || {},
        stakeholder_concerns: synthesis.stakeholders?.engagement_priorities || [],
        engagement_strategy: synthesis.stakeholders?.engagement_priorities || [],
        messaging_frameworks: synthesis.stakeholders?.messaging_frameworks || {},
        
        // Narrative and media intelligence (from topics tab)
        trending_topics: synthesis.topics?.content_opportunities || mcpData['news-intelligence']?.industryNews || [],
        media_coverage: mcpData['news-intelligence']?.breakingNews || [],
        narrative_opportunities: synthesis.topics?.narrative_strategies || [],
        content_angles: synthesis.topics?.content_opportunities || [],
        media_risks: synthesis.topics?.risks_to_avoid || [],
        
        // Predictive intelligence (from predictions tab)
        likely_scenarios: synthesis.predictions?.cascade_effects || [],
        cascade_effects: synthesis.predictions?.cascade_effects || [],
        proactive_strategies: synthesis.predictions?.proactive_strategies || [],
        emerging_trends: synthesis.predictions?.timeline || [],
        
        // Risk and opportunity
        immediate_risks: synthesis.risk_analysis?.immediate_risks || [],
        emerging_risks: synthesis.risk_analysis?.emerging_risks || [],
        immediate_opportunities: synthesis.opportunity_analysis?.immediate || [],
        strategic_opportunities: synthesis.opportunity_analysis?.strategic || [],
        
        // Raw data insights (preserved)
        industry_trends: mcpData['news-intelligence']?.industryNews || [],
        breaking_news: mcpData['news-intelligence']?.breakingNews || [],
        discussions: mcpData['reddit-intelligence']?.discussions || [],
        press_releases: mcpData['pr-intelligence']?.pressReleases || [],
        
        // Alternative perspectives from each tab
        alternative_perspectives: [
          synthesis.competition?.alternative_view,
          synthesis.stakeholders?.alternative_view,
          synthesis.topics?.alternative_view,
          synthesis.predictions?.alternative_view
        ].filter(Boolean)
      }
      
      // Update statistics
      result.statistics.total_insights = result.intelligence.key_insights.length
      result.statistics.personas_engaged = synthesis.personas_used?.length || 5
      result.statistics.second_opinions = result.intelligence.alternative_perspectives.length
      
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