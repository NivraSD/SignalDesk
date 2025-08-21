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
    
    const response = await fetch(`${SUPABASE_URL}/functions/v1/claude-intelligence-synthesizer-v2`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({
        intelligence_type: 'comprehensive', // Use all 5 personas
        mcp_data: data,
        organization: organization,
        goals: {
          competitive_advantage: true,
          risk_mitigation: true,
          opportunity_identification: true,
          stakeholder_analysis: true,
          narrative_control: true
        },
        timeframe: '24h',
        require_second_opinion: true // Enable second opinions
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
      
      // Extract executive summary (ensure it's a string)
      let executiveSummary = ''
      if (typeof synthesis.executive_summary === 'string') {
        executiveSummary = synthesis.executive_summary
      } else if (synthesis.primary_analysis?.executive_summary) {
        executiveSummary = synthesis.primary_analysis.executive_summary
      } else if (synthesis.synthesized?.pr_strategy_summary) {
        executiveSummary = synthesis.synthesized.pr_strategy_summary
      } else {
        // Build from components if needed
        executiveSummary = `Strategic analysis for ${organization.name} in the ${fullOrganization.industry} sector. `
        if (synthesis.key_insights?.length > 0) {
          executiveSummary += `Key findings: ${synthesis.key_insights[0]}. `
        }
        if (synthesis.recommendations?.length > 0) {
          executiveSummary += `Primary recommendation: ${synthesis.recommendations[0]}`
        }
      }
      
      // Build comprehensive intelligence structure
      result.intelligence = {
        // Core executive summary
        executive_summary: executiveSummary,
        
        // Key insights and alerts
        key_insights: synthesis.key_insights || synthesis.primary_analysis?.key_insights || [],
        critical_alerts: synthesis.critical_alerts || synthesis.alerts || [],
        recommendations: synthesis.recommendations || synthesis.primary_analysis?.recommendations || [],
        
        // Synthesized analysis from all personas
        synthesized: synthesis,
        
        // Competitive intelligence
        competitors: fullOrganization.competitors,
        competitive_landscape_summary: synthesis.competitive_analysis?.landscape_summary || '',
        competitive_opportunities: synthesis.competitive_analysis?.positioning_opportunities || [],
        competitive_threats: synthesis.competitive_analysis?.reputation_threats || [],
        competitor_activity: mcpData['news-intelligence']?.competitorActivity || [],
        
        // Stakeholder intelligence
        stakeholder_sentiment: synthesis.stakeholder_analysis?.sentiment || {},
        stakeholder_concerns: synthesis.stakeholder_analysis?.concerns || [],
        engagement_strategy: synthesis.stakeholder_analysis?.engagement_strategy || [],
        messaging_frameworks: synthesis.stakeholder_analysis?.messaging_frameworks || {},
        
        // Narrative and media intelligence
        trending_topics: synthesis.narrative_analysis?.trending_topics || mcpData['news-intelligence']?.industryNews || [],
        media_coverage: mcpData['news-intelligence']?.breakingNews || [],
        narrative_opportunities: synthesis.narrative_analysis?.narrative_opportunities || [],
        content_angles: synthesis.narrative_analysis?.content_angles || [],
        media_risks: synthesis.narrative_analysis?.media_risks || [],
        
        // Predictive intelligence
        likely_scenarios: synthesis.predictive_analysis?.likely_scenarios || [],
        cascade_effects: synthesis.predictive_analysis?.cascade_effects || [],
        proactive_strategies: synthesis.predictive_analysis?.proactive_strategies || [],
        emerging_trends: synthesis.predictive_analysis?.trends || [],
        
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
        
        // Second opinions (if available)
        alternative_perspectives: synthesis.divergent_views || synthesis.second_opinions || []
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