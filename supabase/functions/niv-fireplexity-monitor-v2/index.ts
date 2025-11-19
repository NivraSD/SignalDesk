/**
 * NIV Fireplexity Monitor V2 - Real-time Intelligence with Firecrawl
 *
 * Hybrid approach combining:
 * - Firecrawl search (finds articles RSS misses)
 * - Master-source-registry (100+ curated sources)
 * - Real-time recency filtering (1hr/6hr/24hr windows)
 * - Intelligent relevance scoring
 *
 * Replaces RSS-only monitoring with more comprehensive search-based approach
 * while maintaining same output format for downstream detectors.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MonitorRequest {
  organization_id: string
  organization_name?: string
  recency_window?: string // '1hour', '6hours', '24hours'
  max_results?: number
  skip_deduplication?: boolean // For testing, default false
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const {
      organization_id,
      organization_name,
      recency_window = '6hours',
      max_results = 50,
      skip_deduplication = false
    }: MonitorRequest = await req.json()

    // CRITICAL: Limit articles to prevent timeout (Edge Functions have 150s limit)
    // 100 articles = 5 batches of 20 = ~75-100s for AI filtering alone
    // 50 articles = 2-3 batches = ~30-45s for AI filtering (leaves room for Firecrawl searches)
    const ARTICLE_LIMIT = 50 // Process max 50 articles to stay under timeout

    console.log('🔍 Real-Time Monitor V2 (Firecrawl) Starting:', {
      organization_id,
      recency_window,
      max_results,
      deduplication: skip_deduplication ? 'DISABLED' : 'ENABLED'
    })

    const startTime = Date.now()
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // STEP 1: Get organization profile
    console.log('\n📋 Step 1: Loading organization profile...')

    // Use organization_name for profile lookup (organization_id is UUID for intelligence_targets)
    const orgName = organization_name || organization_id

    const { data: profileData, error: profileError } = await supabase
      .from('organization_profiles')
      .select('profile_data')
      .eq('organization_name', orgName)
      .single()

    if (profileError || !profileData) {
      return new Response(JSON.stringify({
        success: false,
        error: `No organization profile found for "${orgName}". Please run mcp-discovery first.`
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const profile = profileData.profile_data

    console.log(`   ✓ Organization: ${orgName}`)
    console.log(`   ✓ Industry: ${profile.industry || 'Unknown'}`)
    console.log(`   ✓ Competitors: ${profile.competition?.direct_competitors?.length || 0}`)
    console.log(`   ✓ Sources: ${profile.sources?.source_priorities?.total_sources || 0}`)

    // STEP 1.5: Load intelligence targets from database (not from stale profile)
    console.log('\n🎯 Step 1.5: Loading intelligence targets from database...')

    const { data: targetsData } = await supabase
      .from('intelligence_targets')
      .select('*')
      .eq('organization_id', organization_id)

    // Store targets with priority info for smart query generation
    const discoveryTargets = {
      competitors: new Set<string>(),
      stakeholders: new Set<string>(),
      topics: new Set<string>()
    }

    // NEW: Store full target data with priority for context-aware queries
    const targetsByPriority = {
      competitors: { high: [] as string[], medium: [] as string[], low: [] as string[] },
      stakeholders: { high: [] as string[], medium: [] as string[], low: [] as string[] },
      topics: { high: [] as string[], medium: [] as string[], low: [] as string[] }
    }

    // NEW: Store full target objects with monitoring context for relevance filtering
    const targetsWithContext = {
      competitors: new Map<string, any>(),
      stakeholders: new Map<string, any>(),
      topics: new Map<string, any>()
    }

    if (targetsData && targetsData.length > 0) {
      targetsData.forEach((target: any) => {
        const priority = (target.priority && ['high', 'medium', 'low'].includes(target.priority))
          ? target.priority
          : 'medium'

        if (target.type === 'competitor' && target.name) {
          discoveryTargets.competitors.add(target.name)
          targetsByPriority.competitors[priority].push(target.name)
          targetsWithContext.competitors.set(target.name, {
            name: target.name,
            monitoring_context: target.monitoring_context,
            relevance_filter: target.relevance_filter,
            industry_context: target.industry_context,
            priority: target.priority
          })
        } else if ((target.type === 'stakeholder' || target.type === 'influencer') && target.name) {
          // Handle both 'stakeholder' and 'influencer' types (UI uses 'influencer')
          discoveryTargets.stakeholders.add(target.name)
          targetsByPriority.stakeholders[priority].push(target.name)
          targetsWithContext.stakeholders.set(target.name, {
            name: target.name,
            monitoring_context: target.monitoring_context,
            relevance_filter: target.relevance_filter,
            industry_context: target.industry_context,
            priority: target.priority
          })
        } else if (target.type === 'topic' && target.name) {
          discoveryTargets.topics.add(target.name)
          targetsByPriority.topics[priority].push(target.name)
          targetsWithContext.topics.set(target.name, {
            name: target.name,
            monitoring_context: target.monitoring_context,
            relevance_filter: target.relevance_filter,
            industry_context: target.industry_context,
            priority: target.priority
          })
        }
      })
      console.log(`   ✓ Loaded ${discoveryTargets.competitors.size} competitors, ${discoveryTargets.stakeholders.size} stakeholders, ${discoveryTargets.topics.size} topics from intelligence_targets`)
      console.log(`   📊 Priority breakdown:`)
      console.log(`      - High priority: ${targetsByPriority.stakeholders.high.length} stakeholders, ${targetsByPriority.competitors.high.length} competitors`)
      console.log(`      - Medium priority: ${targetsByPriority.stakeholders.medium.length} stakeholders, ${targetsByPriority.competitors.medium.length} competitors`)
    } else {
      // Fallback to profile if no targets set (all default to medium priority)
      console.log(`   ⚠️ No intelligence_targets found, using profile data`)

      // Helper to extract name and context from items that could be strings or objects
      const extractTarget = (item: any) => {
        if (typeof item === 'string') {
          return { name: item, monitoring_context: null, relevance_filter: null, industry_context: null }
        }
        return {
          name: item.name,
          monitoring_context: item.monitoring_context,
          relevance_filter: item.relevance_filter,
          industry_context: item.industry_context
        }
      }

      ;(profile.competition?.direct_competitors || []).forEach((c: any) => {
        const target = extractTarget(c)
        discoveryTargets.competitors.add(target.name)
        targetsByPriority.competitors.medium.push(target.name)
        targetsWithContext.competitors.set(target.name, { ...target, priority: 'medium' })
      })
      ;(profile.competition?.indirect_competitors || []).forEach((c: any) => {
        const target = extractTarget(c)
        discoveryTargets.competitors.add(target.name)
        targetsByPriority.competitors.low.push(target.name)
        targetsWithContext.competitors.set(target.name, { ...target, priority: 'low' })
      })
      ;(profile.stakeholders?.regulators || []).forEach((s: any) => {
        const target = extractTarget(s)
        discoveryTargets.stakeholders.add(target.name)
        targetsByPriority.stakeholders.medium.push(target.name)
        targetsWithContext.stakeholders.set(target.name, { ...target, priority: 'medium' })
      })
      ;(profile.stakeholders?.major_investors || []).forEach((s: any) => {
        const target = extractTarget(s)
        discoveryTargets.stakeholders.add(target.name)
        targetsByPriority.stakeholders.medium.push(target.name)
        targetsWithContext.stakeholders.set(target.name, { ...target, priority: 'medium' })
      })
      ;(profile.trending?.hot_topics || []).forEach((t: any) => {
        const target = extractTarget(t)
        discoveryTargets.topics.add(target.name)
        targetsByPriority.topics.medium.push(target.name)
        targetsWithContext.topics.set(target.name, { ...target, priority: 'medium' })
      })
    }

    // STEP 2: Generate real-time monitoring queries
    console.log('\n🔍 Step 2: Generating real-time queries...')

    const queries = generateRealtimeQueries(profile, orgName, recency_window, discoveryTargets, targetsByPriority, targetsWithContext)
    console.log(`   ✓ Generated ${queries.length} queries for real-time monitoring`)
    console.log(`   📋 Sample queries (first 5):`, queries.slice(0, 5))

    // STEP 2.5: Fetch articles from master-source-registry RSS feeds
    console.log('\n📡 Step 2.5: Fetching from curated RSS sources...')

    let rssArticles: any[] = []
    try {
      const industry = profile.industry || 'general'
      console.log(`   Fetching sources for industry: ${industry}`)

      const sourceResponse = await fetch(`${supabaseUrl}/functions/v1/master-source-registry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({ industry })
      })

      if (sourceResponse.ok) {
        const sourceData = await sourceResponse.json()

        // Collect all RSS sources from different categories
        const allRssSources = [
          ...(sourceData.competitive || []),
          ...(sourceData.market || []),
          ...(sourceData.regulatory || []),
          ...(sourceData.media || []),
          ...(sourceData.forward || []),
          ...(sourceData.specialized || [])
        ].filter((s: any) => s.type === 'rss' || !s.type)

        console.log(`   ✓ Found ${allRssSources.length} RSS sources`)

        // Prioritize: fetch critical first, then high, then medium (limit to 30 total)
        const criticalSources = allRssSources.filter((s: any) => s.priority === 'critical')
        const highSources = allRssSources.filter((s: any) => s.priority === 'high')
        const mediumSources = allRssSources.filter((s: any) => s.priority === 'medium')

        const sourcesToFetch = [
          ...criticalSources,
          ...highSources.slice(0, 15),
          ...mediumSources.slice(0, 10)
        ].slice(0, 30)

        console.log(`   📰 Fetching from ${sourcesToFetch.length} prioritized sources (${criticalSources.length} critical, ${Math.min(15, highSources.length)} high, ${Math.min(10, mediumSources.length)} medium)`)

        // Fetch RSS feeds in parallel
        const rssPromises = sourcesToFetch.map(async (source: any) => {
          try {
            const rssResponse = await fetch(`${supabaseUrl}/functions/v1/rss-proxy`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseKey}`
              },
              body: JSON.stringify({ url: source.url })
            })

            if (!rssResponse.ok) return []

            const rssData = await rssResponse.json()
            const items = rssData.articles || rssData.items || []

            return items.map((item: any) => ({
              title: item.title,
              url: item.url || item.link,
              description: item.description || item.content || '',
              publishDate: item.publishedAt || item.pubDate || new Date().toISOString(),
              source: source.name,
              source_priority: source.priority,
              from_rss: true
            }))
          } catch (err) {
            console.log(`   ⚠️ Failed to fetch ${source.name}: ${err.message}`)
            return []
          }
        })

        const rssResults = await Promise.all(rssPromises)
        rssArticles = rssResults.flat()

        console.log(`   ✓ Collected ${rssArticles.length} articles from RSS feeds`)
      } else {
        console.log(`   ⚠️ Source registry unavailable, skipping RSS fetch`)
      }
    } catch (err) {
      console.error(`   ❌ RSS fetch error: ${err.message}`)
    }

    // STEP 3: Execute Firecrawl searches
    console.log('\n🌐 Step 3: Executing Firecrawl searches...')

    const firecrawlArticles = await fetchRealtimeArticles(
      queries,
      profile,
      recency_window,
      max_results,
      supabaseUrl,
      supabaseKey
    )

    console.log(`   ✓ Found ${firecrawlArticles.length} articles from Firecrawl`)

    // STEP 3.5: Combine RSS and Firecrawl results
    console.log('\n🔗 Step 3.5: Combining RSS and Firecrawl results...')

    // Combine all articles
    const allArticles = [...rssArticles, ...firecrawlArticles]
    console.log(`   Combined: ${rssArticles.length} RSS + ${firecrawlArticles.length} Firecrawl = ${allArticles.length} total`)

    // Deduplicate by URL (prefer RSS articles since they're from curated sources)
    const seenUrls = new Set<string>()
    const deduplicatedArticles = allArticles.filter(article => {
      const url = article.url
      if (!url || seenUrls.has(url)) return false
      seenUrls.add(url)
      return true
    })

    console.log(`   ✓ After deduplication: ${deduplicatedArticles.length} unique articles`)

    // STEP 3.6: CRITICAL DATE FILTERING - Remove old articles
    console.log('\n🕒 Step 3.6: Filtering articles by recency...')

    const recencyLimits: Record<string, number> = {
      '1hour': 1,
      '6hours': 6,
      '24hours': 48 // Allow up to 48 hours for executive synthesis (not just 24)
    }
    const maxHoursOld = recencyLimits[recency_window] || 6
    const cutoffTime = new Date(Date.now() - maxHoursOld * 60 * 60 * 1000)

    const filteredArticles = deduplicatedArticles.filter(article => {
      const publishedDate = new Date(article.publishDate || article.published_at || 0)
      const isRecent = publishedDate >= cutoffTime

      if (!isRecent) {
        const hoursAgo = Math.floor((Date.now() - publishedDate.getTime()) / (1000 * 60 * 60))
        console.log(`   🚫 Filtered out OLD article (${hoursAgo}h ago, limit ${maxHoursOld}h): "${article.title?.substring(0, 60)}..."`)
      }

      return isRecent
    })

    console.log(`   ✓ Date filtering: ${deduplicatedArticles.length} articles → ${filteredArticles.length} recent articles (last ${maxHoursOld} hours)`)
    if (filteredArticles.length < deduplicatedArticles.length) {
      console.log(`   🗑️ Removed ${deduplicatedArticles.length - filteredArticles.length} old articles`)
    }

    // STEP 4: Return articles (relevance filtering happens downstream in enrichment)
    console.log('\n🎯 Step 4: Preparing articles for downstream processing...')
    console.log(`   Collected ${filteredArticles.length} recent articles`)

    // Limit to prevent overwhelming downstream functions
    const articlesToReturn = filteredArticles.slice(0, 100)
    if (filteredArticles.length > 100) {
      console.log(`   ⚠️ Limited from ${filteredArticles.length} to 100 articles`)
    }

    const relevantArticles = articlesToReturn

    // STEP 5: Deduplicate against previously processed articles
    console.log('\n🔍 Step 5: Checking for previously processed articles...')

    let newArticles = relevantArticles
    let skippedCount = 0

    if (!skip_deduplication) {
      const deduplicationResult = await deduplicateArticles(relevantArticles, organization_id, supabase)
      newArticles = deduplicationResult.newArticles
      skippedCount = deduplicationResult.skippedCount

      console.log(`   ✓ Filtered: ${relevantArticles.length} relevant → ${newArticles.length} new (${skippedCount} already processed)`)
    } else {
      console.log(`   ⚠️ Deduplication skipped`)
    }

    // STEP 6: Sort and limit to top results
    newArticles.sort((a, b) => (b.relevance_score || 0) - (a.relevance_score || 0))
    const topResults = newArticles.slice(0, max_results)

    // STEP 7: Mark articles as processed
    if (!skip_deduplication && topResults.length > 0) {
      console.log('\n💾 Step 7: Marking articles as processed...')
      await markArticlesAsProcessed(topResults, organization_id, supabase)
      console.log(`   ✓ Marked ${topResults.length} articles as processed`)
    }

    const executionTime = Date.now() - startTime
    console.log(`\n⏱️  Total execution time: ${executionTime}ms`)
    console.log(`✅ Returning ${topResults.length} articles to detectors`)

    // Calculate discovery coverage
    const discoveryCoverage = {
      competitors_covered: new Set(topResults.flatMap(a => a.discovery_coverage?.competitors || [])).size,
      stakeholders_covered: new Set(topResults.flatMap(a => a.discovery_coverage?.stakeholders || [])).size,
      topics_covered: new Set(topResults.flatMap(a => a.discovery_coverage?.topics || [])).size,
      total_competitors: discoveryTargets.competitors.size,
      total_stakeholders: discoveryTargets.stakeholders.size,
      total_topics: discoveryTargets.topics.size
    }

    // Calculate entity coverage
    const entityCoverage: Record<string, number> = {}
    topResults.forEach(article => {
      ;(article.discovery_coverage?.competitors || []).forEach((entity: string) => {
        entityCoverage[entity] = (entityCoverage[entity] || 0) + 1
      })
      ;(article.discovery_coverage?.stakeholders || []).forEach((entity: string) => {
        entityCoverage[entity] = (entityCoverage[entity] || 0) + 1
      })
    })

    console.log(`📈 Discovery coverage:`, discoveryCoverage)
    console.log(`🎯 Entity coverage:`, entityCoverage)

    // Save monitoring results
    await supabase
      .from('fireplexity_monitoring')
      .insert({
        organization_id,
        query: 'Firecrawl real-time search with master-source-registry',
        search_mode: 'firecrawl',
        recency_window,
        results: topResults,
        results_count: topResults.length,
        relevance_threshold: 0,
        relevant_results_count: topResults.length,
        alerts_triggered: 0, // Detectors will create alerts
        executed_at: new Date().toISOString(),
        execution_time_ms: executionTime
      })

    // Return monitoring report in same format as monitor-stage-1
    return new Response(JSON.stringify({
      success: true,
      stage: 1,
      articles: topResults,
      total_articles: topResults.length,
      social_signals: [], // NIV v2 doesn't collect social signals (can be added later)
      social_sentiment: null,
      metadata: {
        organization: orgName,
        total_collected: topResults.length,
        competitors_tracked: discoveryTargets.competitors.size,
        entity_coverage: entityCoverage,
        discovery_coverage: discoveryCoverage,
        discovery_targets: {
          competitors: Array.from(discoveryTargets.competitors),
          stakeholders: Array.from(discoveryTargets.stakeholders),
          topics: Array.from(discoveryTargets.topics)
        },
        sources_used: {
          firecrawl: topResults.length,
          rss: 0,
          api: 0
        },
        search_mode: 'firecrawl',
        recency_window,
        execution_time_ms: executionTime,
        deduplication: {
          enabled: !skip_deduplication,
          total_relevant: relevantArticles.length,
          already_processed: skippedCount,
          new_articles: topResults.length
        }
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error: any) {
    console.error('❌ Real-time monitor error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

/**
 * Deduplicate articles against previously processed ones
 * Returns only articles that haven't been processed recently
 */
async function deduplicateArticles(
  articles: any[],
  organizationId: string,
  supabase: any
): Promise<{ newArticles: any[], skippedCount: number }> {
  if (articles.length === 0) {
    return { newArticles: [], skippedCount: 0 }
  }

  // Get all article URLs from this batch
  const articleUrls = articles.map(a => a.url).filter(Boolean)

  // Query processed_articles table to find which URLs we've seen before
  // For real-time, check last 24 hours only (shorter window than batch)
  const { data: processedArticles } = await supabase
    .from('processed_articles')
    .select('article_url')
    .eq('organization_id', organizationId)
    .in('article_url', articleUrls)
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours

  const processedUrls = new Set(
    (processedArticles || []).map((p: any) => p.article_url)
  )

  // Filter out already processed articles
  const newArticles = articles.filter(article => !processedUrls.has(article.url))
  const skippedCount = articles.length - newArticles.length

  return { newArticles, skippedCount }
}

/**
 * Mark articles as processed in the database
 * Prevents reprocessing in future runs
 */
async function markArticlesAsProcessed(
  articles: any[],
  organizationId: string,
  supabase: any
): Promise<void> {
  if (articles.length === 0) return

  const records = articles.map(article => ({
    organization_id: organizationId,
    article_url: article.url,
    article_title: article.title,
    source: article.source,
    stage: 'niv-fireplexity-monitor-v2',
    processed_at: new Date().toISOString()
  })).filter(r => r.article_url) // Only records with valid URLs

  if (records.length === 0) return

  // Insert in batches of 100 to avoid query size limits
  const batchSize = 100
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize)

    const { error } = await supabase
      .from('processed_articles')
      .upsert(batch, {
        onConflict: 'organization_id,article_url',
        ignoreDuplicates: true
      })

    if (error) {
      console.error(`   ⚠️ Failed to mark batch ${Math.floor(i / batchSize) + 1} as processed:`, error.message)
    }
  }
}

/**
 * NEW APPROACH: Generate CONTEXT-DRIVEN queries (industry/market/service, NOT targets)
 *
 * OLD APPROACH (removed):
 * - Generated 50+ queries, one per target ("Bill Ackman news", "JPMorgan news")
 * - Fetched 3-5 results per query
 * - Very expensive, many irrelevant results
 *
 * NEW APPROACH:
 * - Generate 10-15 CONTEXT queries from company profile (industry, services, markets)
 * - Fetch 10-15 results per query (cast wider net)
 * - Use intelligence targets as RELEVANCE FILTER in monitor-stage-2-relevance
 *
 * Benefits:
 * - Fewer queries = faster, cheaper
 * - Context-based = finds unexpected connections
 * - Targets filter relevance = only see what matters to YOU
 */
function generateRealtimeQueries(
  profile: any,
  orgName: string,
  recencyWindow: string,
  discoveryTargets: { competitors: Set<string>, stakeholders: Set<string>, topics: Set<string> },
  targetsByPriority: {
    competitors: { high: string[], medium: string[], low: string[] },
    stakeholders: { high: string[], medium: string[], low: string[] },
    topics: { high: string[], medium: string[], low: string[] }
  },
  targetsWithContext?: {
    competitors: Map<string, any>,
    stakeholders: Map<string, any>,
    topics: Map<string, any>
  }
): string[] {
  const queries: string[] = []
  const industry = profile.industry || ''

  // Check if profile has context queries from mcp-discovery
  const contextQueries = profile.monitoring_config?.context_queries

  if (contextQueries && contextQueries.all && contextQueries.all.length > 0) {
    // NEW APPROACH: Use pre-generated context queries from discovery
    console.log(`   Using ${contextQueries.all.length} context queries from profile`)

    // ALWAYS include organization query (disambiguated)
    if (industry) {
      queries.push(`${orgName} ${industry} news`)
    } else {
      queries.push(`${orgName} news`)
    }

    // Add all context queries (industry, service lines, markets, strategic priorities)
    queries.push(...contextQueries.all)

    // Add crisis/opportunity detection queries
    if (industry) {
      queries.push(`${industry} crisis OR scandal OR investigation`)
      queries.push(`${industry} partnership OR acquisition OR merger`)
    }

    return queries
  }

  // FALLBACK: If no context queries, use minimal org-focused approach
  console.log(`   ⚠️ No context queries in profile, using fallback approach`)

  // Organization news with industry disambiguation
  if (industry) {
    queries.push(`${orgName} ${industry} news`)
  } else {
    queries.push(`${orgName} news`)
  }

  // FALLBACK APPROACH: Simple industry monitoring if no context queries
  // This only runs for old profiles that don't have context_queries

  // SMART INDUSTRY QUERIES: Use sub_industry and service_lines for specificity
  // Generic industry names like "Public Relations" match too broadly
  // Use more specific terms from the profile to disambiguate

  const subIndustry = profile.sub_industry
  const serviceLines = profile.service_lines || []

  if (subIndustry && subIndustry !== industry) {
    // Sub-industry is more specific - use it
    queries.push(`${subIndustry} news`)
    queries.push(`${subIndustry} trends`)
  } else if (industry) {
    // Use industry but try to make it more specific
    queries.push(`${industry} news`)
    queries.push(`${industry} trends`)
  }

  // Add service line queries for even more specificity
  serviceLines.slice(0, 2).forEach((service: string) => {
    queries.push(`${service} market news`)
  })

  // Add regulatory/partnership queries
  if (industry) {
    queries.push(`${industry} partnerships`)
    queries.push(`${industry} regulatory`)
  }

  // Crisis and opportunity detection
  queries.push(`${orgName} crisis OR scandal OR investigation`)
  queries.push(`${orgName} partnership OR acquisition OR merger`)

  console.log(`   ⚠️ Using basic fallback: ${queries.length} queries generated`)

  return queries
}

// OLD APPROACH REMOVED:
// - Previously generated 50+ queries, one per target ("Bill Ackman news", "JPMorgan news")
// - New approach uses ~12 context queries from profile + relevance filtering via targets
// - This is faster, cheaper, and finds more strategic intelligence

/**
 * Fetch articles using DIRECT Firecrawl API (bypasses niv-fireplexity for speed + time filtering)
 */
async function fetchRealtimeArticles(
  queries: string[],
  profile: any,
  recencyWindow: string,
  maxResults: number,
  supabaseUrl: string,
  supabaseKey: string
): Promise<any[]> {
  const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY') || 'fc-3048810124b640eb99293880a4ab25d0'
  const FIRECRAWL_BASE_URL = 'https://api.firecrawl.dev/v2'

  const allArticles: any[] = []
  const seenUrls = new Set<string>()

  // Map recency window to Firecrawl tbs parameter
  const tbsMap: Record<string, string> = {
    '1hour': 'qdr:h',   // Last 1 hour (production: hourly autonomous monitoring)
    '6hours': 'qdr:d',  // Last day, filter to 6hr client-side (testing only)
    '24hours': 'qdr:d'  // Last day (executive synthesis)
  }
  const tbs = tbsMap[recencyWindow] || 'qdr:h' // Default 1 hour for real-time

  console.log(`   Executing ${queries.length} real-time Firecrawl searches with time filter: ${tbs}`)

  // INCREASED LIMITS: With fewer context queries (~12 instead of 50+), we fetch MORE per query
  const limitMap: Record<string, number> = {
    '1hour': 10,   // Production: 10 results per query (cast wider net with context queries)
    '6hours': 12,  // Testing: 12 results per query
    '24hours': 15  // Executive synthesis: 15 results per query (comprehensive coverage)
  }
  const searchLimit = limitMap[recencyWindow] || 10

  console.log(`   Using dynamic limit: ${searchLimit} results per query (recency: ${recencyWindow})`)
  console.log(`   Cache strategy: No cache (fresh data to prevent old articles)`)

  // Execute searches in parallel (larger batch for speed - all at once)
  const batchSize = 15 // Increased from 5 to process all queries in one batch
  for (let i = 0; i < queries.length; i += batchSize) {
    const batch = queries.slice(i, i + batchSize)

    const batchPromises = batch.map(async (query) => {
      try {
        // Add 45-second timeout per search (gives Firecrawl more time for complex queries)
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 45000) // 45 second timeout

        const searchResponse = await fetch(`${FIRECRAWL_BASE_URL}/search`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            query,
            sources: ['web', 'news'],
            limit: searchLimit, // Dynamic based on recency window
            tbs, // CRITICAL: Time-based search filter for real-time freshness
            timeout: 40000, // Tell Firecrawl to timeout at 40s (before our 45s client timeout)
            ignoreInvalidURLs: true, // Exclude problematic URLs that cause failures
            scrapeOptions: {
              formats: ['markdown'],
              onlyMainContent: true,
              maxAge: 0 // No cache - always fetch fresh results to prevent old articles from slipping through
            }
          }),
          signal: controller.signal
        })

        clearTimeout(timeoutId)

        if (!searchResponse.ok) {
          console.log(`   ⚠️ Search failed for "${query}": ${searchResponse.status}`)
          return []
        }

        const searchData = await searchResponse.json()
        const webResults = searchData.data?.web || []
        const newsResults = searchData.data?.news || []

        // Convert to standard article format
        // CRITICAL: Don't use result.markdown as content - it's just a snippet with garbage
        // Let enrichment use title + description which are clean
        return [...webResults, ...newsResults].map(result => ({
          title: result.title || 'Untitled',
          url: result.url,
          content: '', // Don't use markdown snippet - it has cookie consent garbage
          description: result.description || result.markdown?.substring(0, 300) || '', // Use description, fallback to first 300 chars of markdown
          published_at: result.publishedTime || new Date().toISOString(),
          source: result.source || extractDomain(result.url),
          relevance_score: result.score || 50
        }))
      } catch (err: any) {
        if (err.name === 'AbortError') {
          console.log(`   ⏱️ Search timed out for "${query}" (40s Firecrawl + 5s buffer)`)
        } else {
          console.log(`   ⚠️ Search failed for "${query}": ${err.message}`)
        }
        return []
      }
    })

    const batchResults = await Promise.all(batchPromises)

    // Merge and deduplicate
    batchResults.forEach(results => {
      results.forEach((article: any) => {
        if (article.url && !seenUrls.has(article.url)) {
          seenUrls.add(article.url)
          allArticles.push(article)
        }
      })
    })

    console.log(`   ✓ Batch ${Math.floor(i / batchSize) + 1}: ${allArticles.length} unique articles`)

    // Early exit if we have enough results
    if (allArticles.length >= maxResults * 2) {
      console.log(`   ⏩ Stopping early - enough articles collected`)
      break
    }
  }

  return allArticles
}

/**
 * Extract domain from URL
 */
function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '')
  } catch {
    return 'Unknown'
  }
}

/**
 * Score articles by relevance for real-time monitoring
 * Higher scores for: org mentions, competitor actions, crisis signals, breaking news
 * Adds discovery_coverage to track which targets each article covers
 * NOW WITH: Strategic relevance filtering using monitoring_context and relevance_filter
 */
function scoreArticlesRelevance(
  articles: any[],
  profile: any,
  orgName: string,
  discoveryTargets: { competitors: Set<string>, stakeholders: Set<string>, topics: Set<string> },
  targetsWithContext: { competitors: Map<string, any>, stakeholders: Map<string, any>, topics: Map<string, any> }
): any[] {
  const competitors = Array.from(discoveryTargets.competitors)
  const stakeholders = Array.from(discoveryTargets.stakeholders)
  const topics = Array.from(discoveryTargets.topics)
  const keywords = profile.monitoring_config?.keywords || []

  return articles.map(article => {
    const title = (article.title || '').toLowerCase()
    const content = (article.content || article.description || '').toLowerCase()
    const text = `${title} ${content}`

    // CRITICAL: Context disambiguation for organizations with ambiguous names
    // Filter out wrong context (e.g., KKR cricket team vs KKR & Co Inc private equity)
    const wrongContextKeywords = {
      'kkr': ['cricket', 'ipl', 'indian premier league', 'kolkata knight riders', 'head coach', 'batsman', 'bowler', 'wicket', 'match', 'tournament', 'team', 'player', 'squad'],
      'amplify': ['energy', 'oil', 'gas', 'petroleum', 'drilling', 'barrel', 'crude', 'offshore', 'natural gas', 'reserves', 'production', 'wells', 'exploration', 'divestiture', 'etf', 'dividend income', 'natural resources']
      // Add more organizations with name conflicts as needed
    }

    const orgNameLower = orgName.toLowerCase()
    const conflictKeywords = wrongContextKeywords[orgNameLower]

    if (conflictKeywords) {
      // Check if article mentions the organization name in wrong context
      const hasOrgMention = text.includes(orgNameLower)
      const hasWrongContext = conflictKeywords.some(kw => text.includes(kw))

      // If mentions org AND has wrong context keywords, check for right context
      if (hasOrgMention && hasWrongContext) {
        // Right context keywords for private equity/finance
        const rightContextKeywords = ['private equity', 'investment', 'portfolio', 'fund', 'acquisition', 'billion', 'stake', 'investor', 'capital', 'buyout', 'financial', 'asset management']
        const hasRightContext = rightContextKeywords.some(kw => text.includes(kw))

        // If NO right context but HAS wrong context, this is probably the wrong entity
        if (!hasRightContext) {
          console.log(`   ⚠️  Filtered out wrong context: "${title.substring(0, 100)}"`)
          return { ...article, relevance_score: 0 } // Filtered out
        }
      }
    }

    let score = 0

    // Track which targets this article covers
    const coveredCompetitors: string[] = []
    const coveredStakeholders: string[] = []
    const coveredTopics: string[] = []

    // Organization in title: +50 (very high priority for real-time)
    if (title.includes(orgName.toLowerCase())) {
      score += 50
    }

    // Organization in content: +20
    if (content.includes(orgName.toLowerCase())) {
      score += 20
    }

    // Check each competitor (with entity disambiguation)
    competitors.forEach(comp => {
      if (comp && text.includes(comp.toLowerCase())) {
        const compContext = targetsWithContext.competitors.get(comp)

        // Entity disambiguation using industry_context
        if (compContext?.industry_context) {
          // Check if article has wrong context (e.g., "Ketchum Idaho" vs "Ketchum PR firm")
          const contextLower = compContext.industry_context.toLowerCase()
          if (contextLower.includes('pr') || contextLower.includes('communications')) {
            // Look for PR/communications context in article
            const hasPRContext = /\b(pr firm|public relations|communications agency|strategic communications)\b/i.test(text)
            const hasCityContext = /\b(idaho|city council|municipal|town|mayor)\b/i.test(text)

            if (hasCityContext && !hasPRContext) {
              console.log(`   ⚠️  Entity disambiguation: "${comp}" in article is city, not PR firm - skipping`)
              return // Skip this competitor
            }
          }
        }

        coveredCompetitors.push(comp)
        if (title.includes(comp.toLowerCase())) {
          score += 40 // In title
        } else {
          score += 15 // In content
        }
      }
    })

    // Check each stakeholder (with strategic relevance filtering)
    stakeholders.forEach(sh => {
      if (sh && text.includes(sh.toLowerCase())) {
        const stakeholderContext = targetsWithContext.stakeholders.get(sh)

        // Apply relevance_filter if present
        if (stakeholderContext?.relevance_filter) {
          const filter = stakeholderContext.relevance_filter
          const includePatterns = filter.include_patterns || []
          const excludePatterns = filter.exclude_patterns || []

          // Check if article matches any exclude patterns (e.g., "broker-dealer", "AML violations")
          const hasExcludeMatch = excludePatterns.some((pattern: string) =>
            text.includes(pattern.toLowerCase())
          )

          if (hasExcludeMatch) {
            console.log(`   ⚠️  Stakeholder "${sh}" excluded: article matches exclude pattern (${excludePatterns.join(', ')})`)
            return // Skip this stakeholder mention
          }

          // Check if article matches any include patterns (e.g., "investor relations", "disclosure requirements")
          const hasIncludeMatch = includePatterns.length === 0 || includePatterns.some((pattern: string) =>
            text.includes(pattern.toLowerCase())
          )

          if (!hasIncludeMatch) {
            console.log(`   ⚠️  Stakeholder "${sh}" excluded: article doesn't match include patterns (${includePatterns.join(', ')})`)
            return // Skip this stakeholder mention
          }

          console.log(`   ✅ Stakeholder "${sh}" relevant: passed relevance filter`)
        }

        coveredStakeholders.push(sh)
        score += 20
      }
    })

    // Check each topic
    topics.forEach(topic => {
      if (topic && text.includes(topic.toLowerCase())) {
        coveredTopics.push(topic)
        score += 15
      }
    })

    // Crisis keywords: +30 (urgent)
    const crisisKeywords = ['lawsuit', 'recall', 'investigation', 'breach', 'scandal', 'fine', 'penalty']
    if (crisisKeywords.some(kw => text.includes(kw))) {
      score += 30
    }

    // Breaking/urgent indicators: +25
    const urgentKeywords = ['breaking', 'just in', 'urgent', 'alert', 'announced today']
    if (urgentKeywords.some(kw => text.includes(kw))) {
      score += 25
    }

    // Keywords: +10 each (cap at 30)
    const keywordMatches = keywords.filter((kw: string) => kw && text.includes(kw.toLowerCase())).length
    score += Math.min(keywordMatches * 10, 30)

    // Check if article has ANY base relevance (mentions org, competitor, stakeholder, topic, or keyword)
    const hasBaseRelevance = score > 0 ||
      coveredCompetitors.length > 0 ||
      coveredStakeholders.length > 0 ||
      coveredTopics.length > 0

    // ONLY apply recency and source bonuses if article has base relevance
    // This prevents generic recent articles from passing through
    const sourceName = typeof article.source === 'object' ? article.source.name : article.source
    const sourceTier = getSourceTier(sourceName, profile)

    if (hasBaseRelevance) {
      // Source tier bonus (only for relevant articles)
      if (sourceTier === 'critical') score += 15
      else if (sourceTier === 'high') score += 10

      // Recency bonus (only for relevant articles)
      const publishedDate = new Date(article.publishDate || article.published_at || Date.now())
      const hoursAgo = (Date.now() - publishedDate.getTime()) / (1000 * 60 * 60)
      if (hoursAgo < 1) score += 20 // Within 1 hour
      else if (hoursAgo < 6) score += 10 // Within 6 hours
      else if (hoursAgo < 24) score += 5 // Within 24 hours
    }

    // Discovery coverage score (how many targets covered)
    const coverageScore = coveredCompetitors.length * 10 + coveredStakeholders.length * 5 + coveredTopics.length * 5

    return {
      ...article,
      relevance_score: score,
      source: sourceName,
      source_tier: sourceTier,
      published_at: article.publishDate || article.published_at || new Date().toISOString(),
      discovery_coverage: {
        competitors: coveredCompetitors,
        stakeholders: coveredStakeholders,
        topics: coveredTopics,
        score: coverageScore
      }
    }
  }).filter(article => article.relevance_score > 0) // Only keep relevant articles
}

/**
 * Get source tier from profile
 */
function getSourceTier(sourceName: string, profile: any): string {
  if (!sourceName) return 'medium'

  const sourceNameLower = sourceName.toLowerCase()

  const criticalSources = profile.sources?.source_priorities?.critical || []
  if (criticalSources.some((s: string) => s.toLowerCase().includes(sourceNameLower) || sourceNameLower.includes(s.toLowerCase()))) {
    return 'critical'
  }

  const highSources = profile.sources?.source_priorities?.high || []
  if (highSources.some((s: string) => s.toLowerCase().includes(sourceNameLower) || sourceNameLower.includes(s.toLowerCase()))) {
    return 'high'
  }

  return 'medium'
}
