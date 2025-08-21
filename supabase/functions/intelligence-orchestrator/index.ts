// Intelligence Orchestrator - Manages the complete 4-phase intelligence flow
// Coordinates: Discovery → Source Mapping → Parallel Gathering → Synthesis

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// Helper to call other Edge Functions
async function callEdgeFunction(functionName: string, payload: any) {
  try {
    const url = `${SUPABASE_URL}/functions/v1/${functionName}`
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify(payload)
    })
    
    if (!response.ok) {
      throw new Error(`${functionName} returned ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error(`Error calling ${functionName}:`, error)
    return { success: false, error: error.message }
  }
}

// PHASE 1: Intelligent Discovery
async function phase1Discovery(organization: any) {
  console.log('🔍 PHASE 1: Intelligent Discovery')
  
  const discovery = await callEdgeFunction('intelligent-discovery', {
    organization: organization.name,
    industry_hint: organization.industry
  })
  
  if (!discovery.success) {
    console.error('Discovery failed:', discovery.error)
    // Fallback to basic config
    return {
      organization: organization.name,
      primary_category: organization.industry || 'default',
      competitors: [],
      search_keywords: [organization.name],
      scrape_targets: []
    }
  }
  
  console.log(`✅ Discovery complete: ${discovery.data.primary_category}, ${discovery.data.competitors?.length || 0} competitors`)
  return discovery.data
}

// PHASE 2: Source Mapping (embedded in gathering functions)
function phase2SourceMapping(discovery: any) {
  console.log('🗺️ PHASE 2: Source Mapping')
  
  // Map discovery data to source execution plan
  const sourcePlan = {
    organization: discovery.organization,
    industry: discovery.primary_category,
    competitors: discovery.competitors || [],
    keywords: discovery.search_keywords || [],
    scrape_urls: discovery.scrape_targets || [],
    sub_categories: discovery.sub_categories || [],
    intelligence_focus: discovery.intelligence_focus || []
  }
  
  console.log(`✅ Source plan: ${sourcePlan.scrape_urls.length} websites, ${sourcePlan.keywords.length} keywords`)
  return sourcePlan
}

// PHASE 3: Parallel Data Gathering
async function phase3ParallelGathering(sourcePlan: any) {
  console.log('📡 PHASE 3: Parallel Data Gathering')
  
  // Execute all gathering functions in parallel
  const gatheringPromises = []
  
  // 1. News Intelligence (Google News + RSS)
  gatheringPromises.push(
    callEdgeFunction('news-intelligence', {
      method: 'gather',
      params: {
        organization: {
          name: sourcePlan.organization,
          industry: sourcePlan.industry,
          competitors: sourcePlan.competitors,
          keywords: sourcePlan.keywords
        }
      }
    })
  )
  
  // 2. Scraper Intelligence (multiple websites)
  if (sourcePlan.scrape_urls.length > 0) {
    // Scrape each URL in parallel
    for (const url of sourcePlan.scrape_urls.slice(0, 5)) { // Limit to 5 for performance
      gatheringPromises.push(
        callEdgeFunction('scraper-intelligence', {
          method: 'scrape',
          params: {
            url: url,
            organization: sourcePlan.organization
          }
        })
      )
    }
  }
  
  // 3. PR Intelligence (press releases)
  gatheringPromises.push(
    callEdgeFunction('pr-intelligence', {
      method: 'gather',
      params: {
        organization: {
          name: sourcePlan.organization,
          industry: sourcePlan.industry
        }
      }
    })
  )
  
  // Wait for all gathering to complete
  const results = await Promise.all(gatheringPromises)
  
  // Organize results
  const gatheredData = {
    news: results[0]?.data || {},
    scraped_websites: [],
    press_releases: results[results.length - 1]?.data || {},
    totalSources: 0,
    totalArticles: 0,
    totalCompetitorData: 0
  }
  
  // Process scraper results (if any)
  if (sourcePlan.scrape_urls.length > 0) {
    for (let i = 1; i < results.length - 1; i++) {
      if (results[i]?.success && results[i]?.data) {
        gatheredData.scraped_websites.push({
          url: sourcePlan.scrape_urls[i - 1],
          data: results[i].data
        })
      }
    }
  }
  
  // Calculate totals
  gatheredData.totalArticles = (gatheredData.news.totalArticles || 0) + 
                               (gatheredData.press_releases.totalReleases || 0)
  gatheredData.totalSources = gatheredData.scraped_websites.length + 
                             (gatheredData.news.sources?.length || 0) + 1
  gatheredData.totalCompetitorData = gatheredData.scraped_websites.filter(w => 
    sourcePlan.competitors.some(c => w.url.includes(c.toLowerCase().replace(/\s+/g, '')))
  ).length
  
  console.log(`✅ Gathered data from ${gatheredData.totalSources} sources, ${gatheredData.totalArticles} articles`)
  return gatheredData
}

// PHASE 4: Intelligent Synthesis
async function phase4Synthesis(discovery: any, gatheredData: any) {
  console.log('🧠 PHASE 4: Intelligent Synthesis')
  
  // Prepare comprehensive data package for Claude
  const synthesisPackage = {
    organization: discovery.organization,
    industry: discovery.primary_category,
    sub_categories: discovery.sub_categories,
    competitors: discovery.competitors,
    intelligence_focus: discovery.intelligence_focus,
    
    // All gathered data
    news_data: {
      articles: gatheredData.news.industryNews || [],
      breaking: gatheredData.news.breakingNews || [],
      opportunities: gatheredData.news.opportunities || [],
      competitor_activity: gatheredData.news.competitorActivity || [],
      alerts: gatheredData.news.alerts || []
    },
    
    scraped_data: gatheredData.scraped_websites.map(site => ({
      url: site.url,
      leadership: site.data.leadership || [],
      press: site.data.press_releases || [],
      jobs: site.data.jobs || {},
      patterns: site.data.patterns || []
    })),
    
    press_releases: gatheredData.press_releases.releases || [],
    
    statistics: {
      total_sources: gatheredData.totalSources,
      total_articles: gatheredData.totalArticles,
      competitor_websites_scraped: gatheredData.totalCompetitorData,
      data_freshness: new Date().toISOString()
    }
  }
  
  // Call Claude synthesis
  const synthesis = await callEdgeFunction('claude-intelligence-synthesizer-v2', {
    method: 'synthesize',
    params: synthesisPackage
  })
  
  if (!synthesis.success) {
    console.error('Synthesis failed:', synthesis.error)
    return {
      success: false,
      error: 'Synthesis failed',
      raw_data: synthesisPackage
    }
  }
  
  console.log('✅ Synthesis complete')
  return synthesis.data
}

// Main orchestration function
async function orchestrateIntelligence(organization: any) {
  console.log('🎯 STARTING MASTER INTELLIGENCE FLOW')
  console.log(`   Organization: ${organization.name}`)
  console.log(`   Industry: ${organization.industry || 'Unknown'}`)
  
  try {
    // PHASE 1: Discovery
    const discovery = await phase1Discovery(organization)
    
    // PHASE 2: Source Mapping
    const sourcePlan = phase2SourceMapping(discovery)
    
    // PHASE 3: Parallel Gathering
    const gatheredData = await phase3ParallelGathering(sourcePlan)
    
    // PHASE 4: Synthesis
    const intelligence = await phase4Synthesis(discovery, gatheredData)
    
    // Store the complete intelligence report
    if (intelligence && !intelligence.error) {
      await supabase
        .from('intelligence_reports')
        .upsert({
          organization_name: organization.name,
          industry: discovery.primary_category,
          competitors: discovery.competitors,
          intelligence_data: intelligence,
          sources_used: gatheredData.totalSources,
          articles_processed: gatheredData.totalArticles,
          created_at: new Date().toISOString()
        })
    }
    
    return {
      success: true,
      organization: organization.name,
      industry: discovery.primary_category,
      phases_completed: {
        discovery: true,
        mapping: true,
        gathering: true,
        synthesis: !!intelligence && !intelligence.error
      },
      statistics: {
        competitors_identified: discovery.competitors?.length || 0,
        websites_scraped: gatheredData.scraped_websites.length,
        articles_processed: gatheredData.totalArticles,
        sources_used: gatheredData.totalSources
      },
      intelligence: intelligence,
      timestamp: new Date().toISOString()
    }
    
  } catch (error) {
    console.error('❌ Orchestration error:', error)
    return {
      success: false,
      error: error.message,
      organization: organization.name,
      timestamp: new Date().toISOString()
    }
  }
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
    
    console.log(`🎯 Intelligence Orchestrator: ${method || 'full'} flow for ${organization.name}`)
    
    let result
    
    switch (method) {
      case 'discovery':
        // Just run discovery phase
        result = await phase1Discovery(organization)
        break
        
      case 'gather':
        // Run discovery + gathering (no synthesis)
        const discovery = await phase1Discovery(organization)
        const sourcePlan = phase2SourceMapping(discovery)
        const gatheredData = await phase3ParallelGathering(sourcePlan)
        result = {
          discovery,
          gathered_data: gatheredData
        }
        break
        
      case 'full':
      default:
        // Run complete orchestration
        result = await orchestrateIntelligence(organization)
        break
    }
    
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
        status: 500
      }
    )
  }
})