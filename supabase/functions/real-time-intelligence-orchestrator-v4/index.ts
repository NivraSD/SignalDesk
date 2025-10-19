// Real-Time Intelligence Orchestrator V4
// FAST REAL-TIME VERSION - Skips expensive enrichment for speed
// Flow: Discovery → Monitor Stage 1 → Quick Synthesis (no firecrawl, no deep enrichment)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { organization_name, time_window } = await req.json()

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('  Real-Time Intelligence Orchestrator V4')
    console.log('  (Fast Mode - No Deep Enrichment)')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`Organization: ${organization_name}`)
    console.log(`Time window: ${time_window}`)
    console.log()

    const startTime = Date.now()

    // Step 1: Get organization profile from mcp-discovery
    console.log('📡 Step 1: Calling mcp-discovery...')
    const discoveryResponse = await fetch(`${SUPABASE_URL}/functions/v1/mcp-discovery`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_KEY}`
      },
      body: JSON.stringify({ organization: organization_name })
    })

    if (!discoveryResponse.ok) {
      throw new Error(`mcp-discovery failed: ${discoveryResponse.status}`)
    }

    const discoveryData = await discoveryResponse.json()
    const profile = discoveryData.profile || discoveryData
    console.log(`✅ Discovery complete: ${profile.competitors?.length || 0} competitors, ${profile.key_stakeholders?.length || 0} stakeholders`)

    // Step 2: Get fresh articles from monitor-stage-1
    console.log('📡 Step 2: Calling monitor-stage-1 (RSS + basic scraping)...')
    const monitorResponse = await fetch(`${SUPABASE_URL}/functions/v1/monitor-stage-1`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_KEY}`
      },
      body: JSON.stringify({
        organization_name: organization_name,
        profile: profile
      })
    })

    if (!monitorResponse.ok) {
      throw new Error(`monitor-stage-1 failed: ${monitorResponse.status}`)
    }

    const monitorData = await monitorResponse.json()
    const articles = monitorData.articles || []
    console.log(`✅ Monitor complete: ${articles.length} articles found`)

    // Filter by time window if needed
    const timeWindowHours = time_window === '24hours' ? 24 :
                           time_window === '48hours' ? 48 :
                           time_window === '1week' ? 168 : 24

    const cutoffDate = new Date(Date.now() - timeWindowHours * 60 * 60 * 1000)
    const recentArticles = articles.filter(article => {
      const pubDate = new Date(article.published_at || article.publishedAt || Date.now())
      return pubDate >= cutoffDate
    })

    console.log(`📊 Filtered to ${recentArticles.length} articles in ${time_window}`)

    // Step 3: Quick summary (no expensive LLM calls)
    const executionTime = Date.now() - startTime

    // Generate breaking summary from article titles
    const topTitles = recentArticles.slice(0, 5).map(a => a.title).join('; ')
    const breakingSummary = recentArticles.length > 0
      ? `${recentArticles.length} new articles in the last ${time_window}. Top stories: ${topTitles.substring(0, 200)}...`
      : `No new articles found in the last ${time_window}.`

    return new Response(JSON.stringify({
      success: true,
      fast_mode: true,
      time_window,
      execution_time_ms: executionTime,

      // Article stats
      articles_analyzed: articles.length,
      articles_in_time_window: recentArticles.length,
      articles: recentArticles.slice(0, 20),  // Return top 20 for UI

      // Quick summary
      breaking_summary: breakingSummary,

      // Metadata
      profile_summary: {
        competitors: profile.competitors?.length || 0,
        stakeholders: profile.key_stakeholders?.length || 0,
        keywords: profile.keywords?.length || 0
      },

      // Placeholders for future features
      opportunities_count: 0,
      crises_count: 0,
      critical_alerts: [],
      watch_list: [],

      note: 'Fast mode: No deep enrichment or opportunity detection. For full analysis, use intelligence-orchestrator-v2.'

    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error: any) {
    console.error('Real-time orchestrator v4 error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
