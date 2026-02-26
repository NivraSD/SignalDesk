import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MonitorRequest {
  organization_id: string
  organization_name?: string
  recency_window?: string
}

// ==================== RSS FETCHERS ====================

// Timeout wrapper for fetch operations
async function fetchWithTimeout(promise: Promise<any>, timeoutMs: number) {
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Fetch timeout')), timeoutMs)
  )
  return Promise.race([promise, timeoutPromise])
}

async function fetchFromRSS(feedUrl: string, sourceName = 'RSS Feed', authToken: string) {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Add 10 second timeout per RSS feed
    const fetchPromise = fetch(`${supabaseUrl}/functions/v1/rss-proxy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({
        url: feedUrl
      })
    })

    const response = await fetchWithTimeout(fetchPromise, 10000) as Response

    if (!response.ok) {
      console.log(`   ⚠️ RSS proxy returned ${response.status} for ${sourceName}`);
      return [];
    }

    const data = await response.json();
    const articles = data.articles || data.items || [];
    console.log(`   ✓ Fetched ${articles.length} articles from ${sourceName}`);

    return articles.map((item: any) => ({
      title: item.title,
      url: item.url || item.link,
      content: item.description || item.content || '',
      published_at: item.publishedAt || item.pubDate || new Date().toISOString(),
      source: sourceName,
      source_url: feedUrl
    }));
  } catch (error) {
    console.error(`   ❌ RSS error for ${sourceName}: ${error.message}`);
    return [];
  }
}

// Get industry sources from registry
async function getIndustrySources(industry: string) {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    console.log(`📚 Fetching sources for industry: ${industry}`);
    const response = await fetch(`${supabaseUrl}/functions/v1/master-source-registry`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({
        industry: industry
      })
    });

    if (!response.ok) {
      console.log('   ⚠️ Source registry unavailable');
      return { competitive: [], market: [], regulatory: [], media: [] };
    }

    const result = await response.json();
    const sources = result.data || result;
    console.log(`   ✓ Got ${sources.competitive?.length || 0} competitive, ${sources.market?.length || 0} market, ${sources.regulatory?.length || 0} regulatory, ${sources.media?.length || 0} media sources`);
    return sources;
  } catch (error) {
    console.error('   ❌ Registry error:', error.message);
    return { competitive: [], market: [], regulatory: [], media: [] };
  }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const {
      organization_id,
      organization_name,
      recency_window = '6hours'
    }: MonitorRequest = await req.json()

    console.log('🔍 Real-Time RSS Monitor Starting:', {
      organization_id,
      recency_window
    })

    const startTime = Date.now()

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get organization profile from mcp-discovery
    const { data: profileData, error: profileError } = await supabase
      .from('organization_profiles')
      .select('profile_data')
      .eq('organization_name', organization_id)
      .single()

    if (profileError || !profileData) {
      console.error('❌ No organization profile found for:', organization_id)
      return new Response(JSON.stringify({
        success: false,
        error: 'No organization profile found. Please run mcp-discovery first to create a profile.'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const profile = profileData.profile_data
    const orgName = organization_name || profile.organization_name || organization_id

    console.log(`📌 Organization: ${orgName}`)
    console.log(`🏭 Industry: ${profile.industry || 'Unknown'}`)

    // Extract entities from profile for relevance filtering
    const competitors = [
      ...(profile.competition?.direct_competitors || []),
      ...(profile.competition?.indirect_competitors || [])
    ].filter(Boolean)

    const stakeholders = [
      ...(profile.stakeholders?.regulators || []),
      ...(profile.stakeholders?.major_investors || []),
      ...(profile.stakeholders?.executives || [])
    ].filter(Boolean)

    const keywords = [
      ...(profile.monitoring_config?.keywords || []),
      ...(profile.keywords || []),
      orgName
    ].filter(Boolean)

    console.log(`⚔️ Competitors: ${competitors.slice(0, 5).join(', ')}${competitors.length > 5 ? ` +${competitors.length - 5} more` : ''}`)
    console.log(`👥 Stakeholders: ${stakeholders.slice(0, 3).join(', ')}${stakeholders.length > 3 ? ` +${stakeholders.length - 3} more` : ''}`)

    // ==================== FETCH RSS FEEDS ====================
    console.log('\n📡 Fetching RSS feeds from master-source-registry...')

    const articlesMap = new Map()
    const titleMap = new Map()

    // Get sources from master-source-registry
    const industrySources = await getIndustrySources(profile.industry || 'general')

    let allSources = [
      ...(industrySources.competitive || []),
      ...(industrySources.market || []),
      ...(industrySources.regulatory || []),
      ...(industrySources.media || [])
    ]

    // LIMIT to top 20 sources to avoid timeout
    // Prioritize sources with higher priority
    allSources.sort((a, b) => {
      const priorityMap = { high: 3, medium: 2, low: 1 }
      const aPriority = priorityMap[a.priority as keyof typeof priorityMap] || 1
      const bPriority = priorityMap[b.priority as keyof typeof priorityMap] || 1
      return bPriority - aPriority
    })

    const sourcesToFetch = allSources.slice(0, 20) // Top 20 only

    console.log(`📚 Processing ${sourcesToFetch.length} RSS sources (from ${allSources.length} total) in parallel...`)

    // Fetch sources in parallel with timeout protection
    const fetchPromises = sourcesToFetch.map(source =>
      fetchFromRSS(source.url, source.name, supabaseKey)
        .then(articles => ({ source, articles }))
        .catch(err => {
          console.log(`   ❌ Failed to fetch ${source.name}: ${err.message}`)
          return { source, articles: [] }
        })
    )

    const results = await Promise.all(fetchPromises)

    // Process and filter articles
    for (const { source, articles } of results) {
      articles.forEach((article: any) => {
        // Skip duplicates
        if (article.url && articlesMap.has(article.url)) return

        const normalizedTitle = article.title?.toLowerCase().replace(/[^a-z0-9]/g, '') || ''
        if (titleMap.has(normalizedTitle)) return

        // Clean HTML from description
        if (article.content) {
          article.content = article.content.replace(/<[^>]*>/g, '').substring(0, 500)
        }

        articlesMap.set(article.url, {
          ...article,
          source_tier: source.priority || 'medium',
          source_category: source.category || 'competitive'
        })
        titleMap.set(normalizedTitle, article.url)
      })
    }

    let allArticles = Array.from(articlesMap.values())
    console.log(`\n📊 Total articles collected: ${allArticles.length}`)

    // ==================== FILTER BY RECENCY ====================
    const timeWindowMs = recency_window === '1hour' ? 60 * 60 * 1000 :
                        recency_window === '6hours' ? 6 * 60 * 60 * 1000 :
                        recency_window === '24hours' ? 24 * 60 * 60 * 1000 :
                        6 * 60 * 60 * 1000 // default 6 hours

    const cutoffTime = new Date(Date.now() - timeWindowMs)

    const beforeFilter = allArticles.length
    allArticles = allArticles.filter(article => {
      const articleDate = new Date(article.published_at || 0)
      return articleDate > cutoffTime
    })

    console.log(`🕐 Filtered by recency (${recency_window}): ${beforeFilter} → ${allArticles.length} articles`)

    // ==================== FILTER BY RELEVANCE ====================
    // Check if article mentions org, competitors, stakeholders, or keywords
    const relevantArticles = allArticles.filter(article => {
      const text = `${article.title || ''} ${article.content || ''}`.toLowerCase()

      const orgMentioned = text.includes(orgName.toLowerCase())
      const competitorMentioned = competitors.some(comp => comp && text.includes(comp.toLowerCase()))
      const stakeholderMentioned = stakeholders.some(sh => sh && text.includes(sh.toLowerCase()))
      const keywordMentioned = keywords.some(kw => kw && text.includes(kw.toLowerCase()))

      return orgMentioned || competitorMentioned || stakeholderMentioned || keywordMentioned
    })

    console.log(`🎯 Filtered by relevance: ${allArticles.length} → ${relevantArticles.length} articles`)

    // Score each article for prioritization
    const scoredArticles = relevantArticles.map(article => {
      const title = (article.title || '').toLowerCase()
      const content = (article.content || '').toLowerCase()
      const text = `${title} ${content}`

      let score = 0

      // Organization in title: +40
      if (title.includes(orgName.toLowerCase())) score += 40

      // Competitor in title: +30
      if (competitors.some(comp => comp && title.includes(comp.toLowerCase()))) score += 30

      // Stakeholder mentioned: +20
      if (stakeholders.some(sh => sh && text.includes(sh.toLowerCase()))) score += 20

      // Keywords: +10
      if (keywords.some(kw => kw && text.includes(kw.toLowerCase()))) score += 10

      return {
        ...article,
        relevance_score: score
      }
    })

    // Sort by relevance and take top results
    scoredArticles.sort((a, b) => (b.relevance_score || 0) - (a.relevance_score || 0))
    const topResults = scoredArticles.slice(0, 50) // Top 50 for detectors

    const executionTime = Date.now() - startTime
    console.log(`\n⏱️  Total execution time: ${executionTime}ms`)
    console.log(`✅ Returning ${topResults.length} articles to detectors`)

    // Save monitoring results to database
    await supabase
      .from('fireplexity_monitoring')
      .insert({
        organization_id,
        query: 'RSS feeds from master-source-registry',
        search_mode: 'rss',
        recency_window,
        results: topResults,
        results_count: topResults.length,
        relevance_threshold: 0,
        relevant_results_count: topResults.length,
        alerts_triggered: 0, // Detectors will create alerts
        executed_at: new Date().toISOString(),
        execution_time_ms: executionTime
      })

    return new Response(JSON.stringify({
      success: true,
      results_found: topResults.length,
      execution_time_ms: executionTime,
      source: 'rss_master_registry',
      articles: topResults
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('❌ RSS monitor error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
