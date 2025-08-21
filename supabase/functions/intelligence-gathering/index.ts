// Intelligence Gathering - Phases 1-3 (Discovery, Mapping, Gathering)
// This function focuses on collecting raw data from all sources efficiently

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"

// Helper to call Edge Functions with proper timeout handling
async function callEdgeFunction(functionName: string, payload: any, timeoutMs: number = 8000) {
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
    
    const response = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
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
      console.error(`${functionName} failed with status ${response.status}`)
      return { success: false, error: `HTTP ${response.status}`, source: functionName }
    }
    
    const data = await response.json()
    return { success: true, data, source: functionName }
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error(`${functionName} timed out after ${timeoutMs}ms`)
      return { success: false, error: 'Timeout', source: functionName }
    }
    console.error(`${functionName} error:`, error)
    return { success: false, error: error.message, source: functionName }
  }
}

async function gatherIntelligence(organization: any) {
  console.log(`🎯 Starting Intelligence Gathering for ${organization.name}`)
  
  const result = {
    success: true,
    organization: organization.name,
    industry: organization.industry,
    timestamp: new Date().toISOString(),
    phases: {
      discovery: false,
      mapping: false,
      gathering: false
    },
    statistics: {
      competitors_identified: 0,
      sources_attempted: 0,
      sources_succeeded: 0,
      total_articles: 0,
      total_websites: 0
    },
    discovered_context: {},
    raw_intelligence: {}
  }
  
  try {
    // =====================================
    // PHASE 1: INTELLIGENT DISCOVERY
    // =====================================
    console.log('📍 Phase 1: Intelligent Discovery with Claude')
    
    const discoveryResult = await callEdgeFunction('intelligent-discovery', {
      organization: organization.name,
      industry_hint: organization.industry || null
    }, 10000) // 10 second timeout for Claude
    
    if (discoveryResult.success && discoveryResult.data) {
      result.discovered_context = discoveryResult.data.data || discoveryResult.data
      result.phases.discovery = true
      result.statistics.competitors_identified = result.discovered_context.competitors?.length || 0
      
      console.log(`✅ Discovery complete: Found ${result.statistics.competitors_identified} competitors`)
      console.log(`   Industry: ${result.discovered_context.primary_category}`)
      console.log(`   Keywords: ${result.discovered_context.search_keywords?.length || 0}`)
    } else {
      console.warn('⚠️ Discovery failed, using basic context')
      result.discovered_context = {
        organization: organization.name,
        primary_category: organization.industry || 'unknown',
        competitors: [],
        search_keywords: [organization.name],
        scrape_targets: []
      }
    }
    
    // =====================================
    // PHASE 2: SOURCE MAPPING
    // =====================================
    console.log('🗺️ Phase 2: Source Mapping')
    result.phases.mapping = true
    
    // Determine which sources to query based on discovery
    const sources = []
    
    // Always try news
    sources.push('news-intelligence')
    result.statistics.sources_attempted++
    
    // Add PR intelligence
    sources.push('pr-intelligence')
    result.statistics.sources_attempted++
    
    // Add Reddit if we have keywords
    if (result.discovered_context.search_keywords?.length > 0) {
      sources.push('reddit-intelligence')
      result.statistics.sources_attempted++
    }
    
    // Add scraper if we have targets
    if (result.discovered_context.scrape_targets?.length > 0) {
      sources.push('scraper-intelligence')
      result.statistics.sources_attempted++
    }
    
    console.log(`📊 Will gather from ${sources.length} sources`)
    
    // =====================================
    // PHASE 3: PARALLEL DATA GATHERING
    // =====================================
    console.log('📡 Phase 3: Parallel Data Gathering')
    
    const gatheringPromises = []
    
    // News Intelligence
    gatheringPromises.push(
      callEdgeFunction('news-intelligence', {
        method: 'gather',
        params: {
          organization: {
            name: organization.name,
            industry: result.discovered_context.primary_category || organization.industry,
            competitors: result.discovered_context.competitors || [],
            keywords: result.discovered_context.search_keywords || []
          }
        }
      }, 8000)
    )
    
    // PR Intelligence
    gatheringPromises.push(
      callEdgeFunction('pr-intelligence', {
        organization: organization.name,
        competitors: result.discovered_context.competitors || [],
        keywords: result.discovered_context.search_keywords || []
      }, 6000)
    )
    
    // Reddit Intelligence (if applicable)
    if (result.discovered_context.search_keywords?.length > 0) {
      gatheringPromises.push(
        callEdgeFunction('reddit-intelligence', {
          keywords: result.discovered_context.search_keywords.slice(0, 3),
          organization: organization.name
        }, 6000)
      )
    }
    
    // Scraper Intelligence (if applicable)
    if (result.discovered_context.scrape_targets?.length > 0) {
      gatheringPromises.push(
        callEdgeFunction('scraper-intelligence', {
          urls: result.discovered_context.scrape_targets.slice(0, 5),
          organization: organization.name
        }, 8000)
      )
    }
    
    // Wait for all gathering to complete (with timeout protection)
    const gatheringResults = await Promise.allSettled(gatheringPromises)
    
    // Process results
    for (const promiseResult of gatheringResults) {
      if (promiseResult.status === 'fulfilled') {
        const { success, data, source, error } = promiseResult.value
        
        if (success && data) {
          // Store the raw data
          result.raw_intelligence[source] = data.data || data
          result.statistics.sources_succeeded++
          
          // Update statistics based on source
          if (source === 'news-intelligence') {
            result.statistics.total_articles += data.data?.totalArticles || 0
          } else if (source === 'scraper-intelligence') {
            result.statistics.total_websites += data.data?.scraped?.length || 0
          }
          
          console.log(`✅ ${source}: Success`)
        } else {
          console.log(`⚠️ ${source}: Failed - ${error}`)
        }
      } else {
        console.log(`❌ Promise rejected:`, promiseResult.reason)
      }
    }
    
    result.phases.gathering = result.statistics.sources_succeeded > 0
    
    console.log(`📊 Gathering complete: ${result.statistics.sources_succeeded}/${result.statistics.sources_attempted} sources`)
    console.log(`   Articles: ${result.statistics.total_articles}`)
    console.log(`   Websites: ${result.statistics.total_websites}`)
    
  } catch (error) {
    console.error('❌ Gathering error:', error)
    result.success = false
    result.error = error.message
  }
  
  return result
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }
  
  try {
    const { organization } = await req.json()
    
    if (!organization?.name) {
      throw new Error('Organization name is required')
    }
    
    const result = await gatherIntelligence(organization)
    
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