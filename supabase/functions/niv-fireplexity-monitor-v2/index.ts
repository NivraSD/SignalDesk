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

    const discoveryTargets = {
      competitors: new Set<string>(),
      stakeholders: new Set<string>(),
      topics: new Set<string>()
    }

    if (targetsData && targetsData.length > 0) {
      targetsData.forEach((target: any) => {
        if (target.type === 'competitor' && target.name) {
          discoveryTargets.competitors.add(target.name)
        } else if (target.type === 'stakeholder' && target.name) {
          discoveryTargets.stakeholders.add(target.name)
        } else if (target.type === 'topic' && target.name) {
          discoveryTargets.topics.add(target.name)
        }
      })
      console.log(`   ✓ Loaded ${discoveryTargets.competitors.size} competitors, ${discoveryTargets.stakeholders.size} stakeholders, ${discoveryTargets.topics.size} topics from intelligence_targets`)
    } else {
      // Fallback to profile if no targets set
      console.log(`   ⚠️ No intelligence_targets found, using profile data`)
      ;(profile.competition?.direct_competitors || []).forEach((c: string) => discoveryTargets.competitors.add(c))
      ;(profile.competition?.indirect_competitors || []).forEach((c: string) => discoveryTargets.competitors.add(c))
      ;(profile.stakeholders?.regulators || []).forEach((s: string) => discoveryTargets.stakeholders.add(s))
      ;(profile.stakeholders?.major_investors || []).forEach((s: string) => discoveryTargets.stakeholders.add(s))
      ;(profile.trending?.hot_topics || []).forEach((t: string) => discoveryTargets.topics.add(t))
    }

    // STEP 2: Generate real-time monitoring queries
    console.log('\n🔍 Step 2: Generating real-time queries...')

    const queries = generateRealtimeQueries(profile, orgName, recency_window, discoveryTargets)
    console.log(`   ✓ Generated ${queries.length} queries for real-time monitoring`)

    // STEP 3: Execute Firecrawl searches
    console.log('\n🌐 Step 3: Executing Firecrawl searches...')

    const articles = await fetchRealtimeArticles(
      queries,
      profile,
      recency_window,
      max_results,
      supabaseUrl,
      supabaseKey
    )

    console.log(`   ✓ Found ${articles.length} articles`)

    // STEP 4: Filter and score by relevance
    console.log('\n🎯 Step 4: Scoring article relevance...')

    const scoredArticles = scoreArticlesRelevance(articles, profile, orgName, discoveryTargets)
    console.log(`   ✓ Scored ${scoredArticles.length} relevant articles`)

    // STEP 5: Deduplicate against previously processed articles
    console.log('\n🔍 Step 5: Checking for previously processed articles...')

    let newArticles = scoredArticles
    let skippedCount = 0

    if (!skip_deduplication) {
      const deduplicationResult = await deduplicateArticles(scoredArticles, organization_id, supabase)
      newArticles = deduplicationResult.newArticles
      skippedCount = deduplicationResult.skippedCount

      console.log(`   ✓ Filtered: ${scoredArticles.length} scored → ${newArticles.length} new (${skippedCount} already processed)`)
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
          total_scored: scoredArticles.length,
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
 * Generate queries for comprehensive monitoring of ALL intelligence targets
 * 24-hour mode: Search for ALL competitors, ALL topics, ALL stakeholders
 * 6-hour mode: Top 5 competitors + all topics (for realtime)
 * 1-hour mode: Top 3 competitors + crisis only (ultra-focused)
 */
function generateRealtimeQueries(
  profile: any,
  orgName: string,
  recencyWindow: string,
  discoveryTargets: { competitors: Set<string>, stakeholders: Set<string>, topics: Set<string> }
): string[] {
  const queries: string[] = []

  // Query 1: Organization news (always included)
  queries.push(`${orgName} news`)

  if (recencyWindow === '24hours') {
    // 24-HOUR MODE: COMPREHENSIVE - Search ALL intelligence targets

    // ALL competitors (user set these up intentionally)
    const allCompetitors = Array.from(discoveryTargets.competitors)
    allCompetitors.forEach((comp: string) => {
      queries.push(`${comp} news`)
    })

    // ALL topics (user set these up intentionally)
    const allTopics = Array.from(discoveryTargets.topics)
    allTopics.forEach((topic: string) => {
      queries.push(`${topic}`)
    })

    // ALL stakeholders (user set these up intentionally)
    const allStakeholders = Array.from(discoveryTargets.stakeholders)
    allStakeholders.forEach((stakeholder: string) => {
      queries.push(`${stakeholder} news`)
    })

    // Crisis detection
    queries.push(`${orgName} investigation OR lawsuit OR scandal`)
    queries.push(`${orgName} recall OR breach OR security`)

    // Opportunity detection
    queries.push(`${orgName} partnership OR acquisition OR merger`)
    queries.push(`${orgName} funding OR investment OR expansion`)

    // Industry news
    if (profile.industry) {
      queries.push(`${profile.industry} news`)
    }

  } else if (recencyWindow === '6hours') {
    // 6-HOUR MODE: Top competitors + all topics (balanced for realtime)

    // Top 5 competitors
    const topCompetitors = Array.from(discoveryTargets.competitors).slice(0, 5)
    topCompetitors.forEach((comp: string) => {
      queries.push(`${comp} news`)
    })

    // ALL topics (topics are usually fewer, keep all)
    const allTopics = Array.from(discoveryTargets.topics)
    allTopics.forEach((topic: string) => {
      queries.push(`${topic}`)
    })

    // Crisis detection
    queries.push(`${orgName} investigation OR lawsuit OR scandal`)
    queries.push(`${orgName} recall OR breach`)

    // Opportunity detection
    queries.push(`${orgName} partnership OR acquisition`)
    queries.push(`${orgName} funding OR investment`)

    // Industry breaking news
    if (profile.industry) {
      queries.push(`${profile.industry} breaking news`)
    }

  } else {
    // 1-HOUR MODE: Ultra-focused for breaking news only

    // Top 3 competitors only
    const topCompetitors = Array.from(discoveryTargets.competitors).slice(0, 3)
    topCompetitors.forEach((comp: string) => {
      queries.push(`${comp} news`)
    })

    // Most critical crisis detection
    queries.push(`${orgName} investigation OR lawsuit`)
    queries.push(`${orgName} recall OR breach`)

    // Breaking industry news
    if (profile.industry) {
      queries.push(`${profile.industry} breaking`)
    }
  }

  return queries
}

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
    '1hour': 'qdr:h',
    '6hours': 'qdr:h', // Firecrawl doesn't have 6hr, use 1hr for freshest
    '24hours': 'qdr:d'
  }
  const tbs = tbsMap[recencyWindow] || 'qdr:h' // Default 1 hour for real-time

  console.log(`   Executing ${queries.length} real-time Firecrawl searches with time filter: ${tbs}`)

  // Execute searches in parallel (larger batch for speed - all at once)
  const batchSize = 15 // Increased from 5 to process all queries in one batch
  for (let i = 0; i < queries.length; i += batchSize) {
    const batch = queries.slice(i, i + batchSize)

    const batchPromises = batch.map(async (query) => {
      try {
        // Add 20-second timeout to prevent long-running searches from blocking
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 20000) // 20 second timeout

        const searchResponse = await fetch(`${FIRECRAWL_BASE_URL}/search`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            query,
            sources: ['web', 'news'],
            limit: 4, // 4 per query for real-time (4 * 10 queries = ~40 articles)
            tbs, // CRITICAL: Time-based search filter for real-time freshness
            scrapeOptions: {
              formats: ['markdown'],
              onlyMainContent: true
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
        return [...webResults, ...newsResults].map(result => ({
          title: result.title || 'Untitled',
          url: result.url,
          content: result.markdown || result.description || '',
          description: result.description || '',
          published_at: result.publishedTime || new Date().toISOString(),
          source: result.source || extractDomain(result.url),
          relevance_score: result.score || 50
        }))
      } catch (err: any) {
        if (err.name === 'AbortError') {
          console.log(`   ⏱️ Search timed out for "${query}" (20s limit)`)
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
 */
function scoreArticlesRelevance(
  articles: any[],
  profile: any,
  orgName: string,
  discoveryTargets: { competitors: Set<string>, stakeholders: Set<string>, topics: Set<string> }
): any[] {
  const competitors = Array.from(discoveryTargets.competitors)
  const stakeholders = Array.from(discoveryTargets.stakeholders)
  const topics = Array.from(discoveryTargets.topics)
  const keywords = profile.monitoring_config?.keywords || []

  return articles.map(article => {
    const title = (article.title || '').toLowerCase()
    const content = (article.content || article.description || '').toLowerCase()
    const text = `${title} ${content}`

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

    // Check each competitor
    competitors.forEach(comp => {
      if (comp && text.includes(comp.toLowerCase())) {
        coveredCompetitors.push(comp)
        if (title.includes(comp.toLowerCase())) {
          score += 40 // In title
        } else {
          score += 15 // In content
        }
      }
    })

    // Check each stakeholder
    stakeholders.forEach(sh => {
      if (sh && text.includes(sh.toLowerCase())) {
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

    // Source tier bonus
    const sourceName = typeof article.source === 'object' ? article.source.name : article.source
    const sourceTier = getSourceTier(sourceName, profile)
    if (sourceTier === 'critical') score += 15
    else if (sourceTier === 'high') score += 10

    // Recency bonus (more recent = higher score)
    const publishedDate = new Date(article.publishDate || article.published_at || Date.now())
    const hoursAgo = (Date.now() - publishedDate.getTime()) / (1000 * 60 * 60)
    if (hoursAgo < 1) score += 20 // Within 1 hour
    else if (hoursAgo < 6) score += 10 // Within 6 hours
    else if (hoursAgo < 24) score += 5 // Within 24 hours

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
