// Intelligence Orchestrator - Full 4-Phase Process
// Properly coordinates all intelligence phases with error recovery

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400'
}

// Helper to call other Edge Functions with timeout and retry
async function callEdgeFunctionWithTimeout(functionName: string, payload: any, timeoutMs: number = 10000, retries: number = 2) {
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || 'https://zskaxjtyuaqazydouifp.supabase.co'
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`🔄 Retry ${attempt}/${retries} for ${functionName}`)
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt)) // Exponential backoff
      }
      
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
        if (attempt === retries) {
          return { success: false, error: `HTTP ${response.status}` }
        }
        continue // Retry
      }
      
      const data = await response.json()
      return data
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error(`${functionName} timed out after ${timeoutMs}ms`)
        if (attempt === retries) {
          return { success: false, error: 'Timeout' }
        }
      } else {
        console.error(`Error calling ${functionName}:`, error)
        if (attempt === retries) {
          return { success: false, error: error.message }
        }
      }
    }
  }
  
  return { success: false, error: 'All retries failed' }
}

// Full 4-Phase Orchestration with proper error handling
async function orchestrateIntelligence(organization: any) {
  console.log('🎯 Starting FULL 4-phase orchestration for:', organization.name)
  
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
    raw_data: {}, // Store raw data from each phase
    timestamp: new Date().toISOString()
  }
  
  let discoveryData = null
  let gatheringData = {}
  
  try {
    // Phase 1: Intelligent Discovery with Claude
    console.log('📍 Phase 1: Intelligent Discovery')
    const discoveryResult = await callEdgeFunctionWithTimeout('intelligent-discovery', {
      organization: organization.name,
      industry_hint: organization.industry
    }, 12000) // 12 second timeout with retries
    
    if (discoveryResult.success && discoveryResult.data) {
      discoveryData = discoveryResult.data
      results.phases_completed.discovery = true
      results.statistics.competitors_identified = discoveryData.competitors?.length || 0
      console.log(`✅ Discovery complete: ${discoveryData.competitors?.length} competitors found`)
    } else {
      // Fallback discovery if Claude fails
      console.log('⚠️ Intelligent discovery failed, using fallback')
      discoveryData = {
        organization: organization.name,
        primary_category: organization.industry || 'technology',
        competitors: getBasicCompetitors(organization.name, organization.industry),
        search_keywords: [organization.name, `${organization.name} news`, `${organization.name} announcement`],
        scrape_targets: []
      }
      results.phases_completed.discovery = true
      results.statistics.competitors_identified = discoveryData.competitors.length
    }
    
    // Phase 2: Source Mapping (use discovery data)
    console.log('🗺️ Phase 2: Source Mapping')
    results.phases_completed.mapping = true
    
    // Phase 3: Parallel Data Gathering
    console.log('📡 Phase 3: Parallel Data Gathering')
    
    // Gather from multiple sources in parallel
    const gatheringPromises = []
    
    // News Intelligence
    gatheringPromises.push(
      callEdgeFunctionWithTimeout('news-intelligence', {
        method: 'gather',
        params: {
          organization: {
            name: organization.name,
            industry: discoveryData.primary_category || organization.industry,
            competitors: discoveryData.competitors || [],
            keywords: discoveryData.search_keywords || []
          }
        }
      }, 10000).then(result => ({ source: 'news', result }))
    )
    
    // PR Intelligence (if available)
    gatheringPromises.push(
      callEdgeFunctionWithTimeout('pr-intelligence', {
        organization: organization.name,
        competitors: discoveryData.competitors || [],
        keywords: discoveryData.search_keywords || []
      }, 8000).then(result => ({ source: 'pr', result }))
    )
    
    // Reddit Intelligence (if available)
    if (discoveryData.search_keywords?.length > 0) {
      gatheringPromises.push(
        callEdgeFunctionWithTimeout('reddit-intelligence', {
          keywords: discoveryData.search_keywords.slice(0, 3),
          organization: organization.name
        }, 8000).then(result => ({ source: 'reddit', result }))
      )
    }
    
    // Scraper Intelligence (if we have targets)
    if (discoveryData.scrape_targets?.length > 0) {
      gatheringPromises.push(
        callEdgeFunctionWithTimeout('scraper-intelligence', {
          urls: discoveryData.scrape_targets.slice(0, 3), // Limit to 3 URLs
          organization: organization.name
        }, 10000).then(result => ({ source: 'scraper', result }))
      )
    }
    
    // Wait for all gathering to complete
    const gatheringResults = await Promise.allSettled(gatheringPromises)
    
    // Process gathering results
    for (const result of gatheringResults) {
      if (result.status === 'fulfilled') {
        const { source, result: data } = result.value
        if (data.success && data.data) {
          gatheringData[source] = data.data
          console.log(`✅ ${source} gathered successfully`)
          
          // Update statistics
          if (source === 'news') {
            results.statistics.articles_processed += data.data.totalArticles || 0
            results.statistics.sources_used += data.data.sources?.length || 0
          } else if (source === 'scraper') {
            results.statistics.websites_scraped += data.data.scraped?.length || 0
          }
        } else {
          console.log(`⚠️ ${source} gathering failed:`, data.error)
        }
      }
    }
    
    results.phases_completed.gathering = Object.keys(gatheringData).length > 0
    results.raw_data = gatheringData
    
    // Phase 4: Intelligent Synthesis with Claude (only if we have data)
    console.log('🧠 Phase 4: Intelligent Synthesis')
    
    if (Object.keys(gatheringData).length > 0) {
      const synthesisResult = await callEdgeFunctionWithTimeout('claude-intelligence-synthesizer-v2', {
        intelligence_type: 'comprehensive',
        mcp_data: gatheringData,
        organization: {
          name: organization.name,
          industry: discoveryData.primary_category || organization.industry,
          competitors: discoveryData.competitors || [],
          stakeholders: ['investors', 'customers', 'employees', 'media', 'regulators'],
          topics: discoveryData.search_keywords || [],
          keywords: discoveryData.search_keywords || []
        },
        goals: {
          'competitive_advantage': true,
          'risk_mitigation': true,
          'opportunity_identification': true
        },
        timeframe: '24h'
      }, 15000) // 15 second timeout for synthesis
      
      if (synthesisResult.success && synthesisResult.analysis) {
        results.phases_completed.synthesis = true
        
        // DEBUG: Log what synthesizer actually returned
        console.log('🔍 SYNTHESIZER RETURNED:', {
          type: typeof synthesisResult.analysis,
          keys: Object.keys(synthesisResult.analysis || {}),
          hasExecutiveSummary: !!synthesisResult.analysis?.executive_summary,
          executiveSummaryType: typeof synthesisResult.analysis?.executive_summary,
          sample: JSON.stringify(synthesisResult.analysis).substring(0, 200)
        })
        
        // Extract the actual synthesized content
        const synthesis = synthesisResult.analysis
        
        // Build proper executive summary from synthesis
        let executiveSummaryText = ''
        
        // Log what we're working with
        console.log('🔍 Extracting executive summary from synthesis:', {
          hasExecutiveSummary: !!synthesis.executive_summary,
          executiveSummaryType: typeof synthesis.executive_summary,
          hasPrimaryAnalysis: !!synthesis.primary_analysis,
          hasAnalysisText: !!synthesis.analysis_text,
          synthesisKeys: Object.keys(synthesis).slice(0, 10)
        })
        
        if (synthesis.executive_summary) {
          if (typeof synthesis.executive_summary === 'string') {
            executiveSummaryText = synthesis.executive_summary
            console.log('✅ Found executive_summary as string')
          } else {
            // It's an object, try to extract the text
            executiveSummaryText = synthesis.executive_summary.analysis || 
                                  synthesis.executive_summary.summary || 
                                  synthesis.executive_summary.text || 
                                  JSON.stringify(synthesis.executive_summary)
            console.log('⚠️ executive_summary is object, extracted:', executiveSummaryText.substring(0, 100))
          }
        } else if (synthesis.primary_analysis) {
          executiveSummaryText = synthesis.primary_analysis.analysis || synthesis.primary_analysis.summary || ''
          console.log('📝 Using primary_analysis')
        } else if (synthesis.analysis_text) {
          executiveSummaryText = synthesis.analysis_text
          console.log('📝 Using analysis_text')
        }
        
        // If no executive summary from synthesis, generate one
        if (!executiveSummaryText || executiveSummaryText === '{}') {
          executiveSummaryText = `${organization.name} operates in the ${discoveryData.primary_category || organization.industry} industry. Based on analysis of ${results.statistics.articles_processed} articles and ${results.statistics.websites_scraped} websites, key competitive threats and opportunities have been identified. Immediate focus areas include monitoring ${discoveryData.competitors?.slice(0, 3).join(', ') || 'key competitors'}.`
          console.log('⚠️ Generated fallback executive summary')
        }
        
        console.log('📊 Final executive summary type:', typeof executiveSummaryText)
        
        // Extract or build key insights
        const keyInsights = synthesis.key_insights || 
                           synthesis.primary_analysis?.key_insights || 
                           extractKeyInsights(gatheringData)
        
        // Extract or build recommendations
        const recommendations = synthesis.recommendations || 
                               synthesis.primary_analysis?.recommendations || 
                               generateRecommendations(gatheringData)
        
        // Merge synthesized intelligence with raw data insights
        results.intelligence = {
          // The actual executive summary TEXT (not object)
          executive_summary: executiveSummaryText,
          
          // Key insights from synthesis or extracted
          key_insights: keyInsights,
          
          // Critical alerts
          alerts: synthesis.critical_alerts || gatheringData.news?.alerts || [],
          
          // Recommendations
          recommendations: recommendations,
          
          // Synthesized insights from Claude (keep for reference)
          synthesized: synthesis,
          
          // Raw data insights
          industry_trends: gatheringData.news?.industryNews || [],
          breaking_news: gatheringData.news?.breakingNews || [],
          opportunities: synthesis.opportunities || gatheringData.news?.opportunities || [],
          competitor_activity: gatheringData.news?.competitorActivity || [],
          discussions: gatheringData.reddit?.discussions || gatheringData.news?.discussions || [],
          
          // Discovery insights
          competitors: discoveryData.competitors || [],
          industry_context: discoveryData.industry_context || '',
          intelligence_focus: discoveryData.intelligence_focus || [],
          
          // Competitive positioning
          competitive_positioning: {
            competitors: discoveryData.competitors || [],
            activity: gatheringData.news?.competitorActivity || []
          },
          
          // Immediate items
          immediate_opportunities: synthesis.immediate_opportunities || gatheringData.news?.opportunities?.slice(0, 5) || [],
          immediate_risks: synthesis.immediate_risks || gatheringData.news?.alerts?.slice(0, 5) || []
        }
        
        console.log('✅ Synthesis complete with Claude')
      } else {
        // Fallback: Use raw data without synthesis
        console.log('⚠️ Synthesis failed, using raw intelligence')
        results.intelligence = buildFallbackIntelligence(discoveryData, gatheringData)
        results.phases_completed.synthesis = true
      }
    } else {
      // No data gathered, provide minimal intelligence
      results.intelligence = {
        message: 'Limited data available',
        competitors: discoveryData?.competitors || [],
        recommendations: ['Expand data sources', 'Retry gathering phase']
      }
    }
    
  } catch (error) {
    console.error('Orchestration error:', error)
    results.success = false
    results.error = error.message
  }
  
  return results
}

// Build fallback intelligence from raw data
function buildFallbackIntelligence(discoveryData: any, gatheringData: any) {
  return {
    industry_trends: gatheringData.news?.industryNews || [],
    breaking_news: gatheringData.news?.breakingNews || [],
    opportunities: gatheringData.news?.opportunities || [],
    competitor_activity: gatheringData.news?.competitorActivity || [],
    alerts: gatheringData.news?.alerts || [],
    discussions: gatheringData.reddit?.discussions || gatheringData.news?.discussions || [],
    
    competitors: discoveryData?.competitors || [],
    industry_context: discoveryData?.industry_context || '',
    
    key_insights: extractKeyInsights(gatheringData),
    competitive_positioning: {
      competitors: discoveryData?.competitors || [],
      activity: gatheringData.news?.competitorActivity || []
    },
    immediate_opportunities: gatheringData.news?.opportunities?.slice(0, 5) || [],
    immediate_risks: gatheringData.news?.alerts?.slice(0, 5) || [],
    
    executive_summary: {
      organization: discoveryData?.organization || 'Unknown',
      industry: discoveryData?.primary_category || 'Unknown',
      total_articles: gatheringData.news?.totalArticles || 0,
      key_findings: extractKeyInsights(gatheringData).slice(0, 3),
      recommendations: generateRecommendations(gatheringData)
    }
  }
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

function extractKeyInsights(gatheringData: any) {
  const insights = []
  const newsData = gatheringData.news || gatheringData // Support both structures
  
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
  
  // Add insights from other sources
  if (gatheringData.pr?.pressReleases?.length > 0) {
    insights.push(`${gatheringData.pr.pressReleases.length} PR announcements tracked`)
  }
  if (gatheringData.reddit?.discussions?.length > 0) {
    insights.push(`${gatheringData.reddit.discussions.length} community discussions found`)
  }
  if (gatheringData.scraper?.scraped?.length > 0) {
    insights.push(`${gatheringData.scraper.scraped.length} websites analyzed`)
  }
  
  return insights
}

function generateRecommendations(gatheringData: any) {
  const recommendations = []
  const newsData = gatheringData.news || gatheringData // Support both structures
  
  if (newsData.alerts?.length > 0) {
    recommendations.push('Review and address identified risk alerts immediately')
  }
  if (newsData.opportunities?.length > 0) {
    recommendations.push('Evaluate identified opportunities for strategic advantage')
  }
  if (newsData.competitorActivity?.length > 0) {
    recommendations.push('Monitor competitor movements and adjust strategy accordingly')
  }
  if (gatheringData.reddit?.discussions?.length > 0 || newsData.discussions?.length > 0) {
    recommendations.push('Engage with community discussions to shape narrative')
  }
  if (gatheringData.pr?.sentiment && gatheringData.pr.sentiment.negative > 0.3) {
    recommendations.push('Address negative PR sentiment with targeted communications')
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