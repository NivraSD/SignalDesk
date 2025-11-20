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

    // STEP 1: Get organization profile (comprehensive intelligence context)
    console.log('\n📋 Step 1: Loading organization profile...')

    // Use organization_name for profile lookup
    const orgName = organization_name || organization_id

    // Fetch from organizations table (single source of truth)
    const { data: orgData, error: profileError } = await supabase
      .from('organizations')
      .select('id, name, industry, company_profile')
      .eq('id', organization_id)
      .single()

    if (profileError || !orgData) {
      return new Response(JSON.stringify({
        success: false,
        error: `No organization found for ID "${organization_id}".`
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const profile = orgData.company_profile || {}

    // CRITICAL FIX: Parse nested JSON strings in company_profile
    // MCP Discovery saves many fields as JSON strings, not objects
    const parseIfString = (field: any) => {
      if (field && typeof field === 'string') {
        try {
          return JSON.parse(field)
        } catch {
          return field
        }
      }
      return field
    }

    // Parse all potentially-stringified fields
    profile.sources = parseIfString(profile.sources)
    profile.intelligence_context = parseIfString(profile.intelligence_context)
    profile.monitoring_config = parseIfString(profile.monitoring_config)
    profile.competition = parseIfString(profile.competition)
    profile.strategic_goals = parseIfString(profile.strategic_goals)

    console.log(`   ✓ Organization: ${orgData.name}`)
    console.log(`   ✓ Industry: ${orgData.industry || profile.industry || 'Unknown'}`)
    console.log(`   ✓ Intelligence Context: ${profile.intelligence_context ? 'YES' : 'NO'}`)
    console.log(`   ✓ Key Questions: ${profile.intelligence_context?.key_questions?.length || 0}`)
    console.log(`   ✓ Sources: ${profile.sources ? Object.keys(profile.sources).length + ' categories' : 'NO'}`)
    console.log(`   ✓ Strategic Goals: ${profile.strategic_goals?.length || 0}`)
    console.log(`   ✓ Intelligence Focus: ${profile.intelligence_focus?.priority_signals?.length || 0} signals`)
    console.log(`   ✓ Competitive Priorities: ${profile.competitive_intelligence_priorities?.focus_areas?.length || 0} areas`)

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

    // STEP 2: Generate intelligent monitoring queries using AI
    console.log('\n🔍 Step 2: Generating intelligent queries using AI...')

    // Try AI-driven query generation first (now with industry-aware prompt)
    let queries = await generateIntelligentQueries(profile, orgName, discoveryTargets, targetsByPriority)
    console.log(`   AI query generation returned: ${queries.length} queries`)

    // Fallback to static queries if AI fails
    if (queries.length === 0) {
      console.log('   ⚠️ AI returned empty, using fallback static query generation')
      queries = generateRealtimeQueries(profile, orgName, recency_window, discoveryTargets, targetsByPriority, targetsWithContext)
      console.log(`   Static query generation returned: ${queries.length} queries`)
    }

    // Strategic queries are now generated inside generateRealtimeQueries
    // No more dumb keyword additions - everything is intelligence-driven

    console.log(`   ✓ FINAL: Generated ${queries.length} strategic intelligence questions`)
    console.log(`   📋 Sample questions (first 5):`, queries.slice(0, 5))

    // CRITICAL: If still no queries, something is very wrong
    if (queries.length === 0) {
      console.error('   ❌ CRITICAL: No queries generated! Check intelligence_context and competitors.')
      console.error(`   Intelligence context available: ${!!profile.intelligence_context}`)
      console.error(`   Key questions: ${profile.intelligence_context?.key_questions?.length || 0}`)
      console.error(`   Competitors: ${discoveryTargets.competitors.size}`)
      console.error(`   Industry: ${profile.industry}`)
    }

    // STEP 2.5: Fetch articles from Yahoo Finance (company + competitor news)
    console.log('\n📡 Step 2.5: Fetching from Yahoo Finance...')

    let yahooArticles: any[] = []
    try {
      // Get list of companies to track: organization + competitors
      const companiesToTrack = [
        orgName,
        ...(profile.competition?.direct_competitors || []).slice(0, 9) // Top 10 total
      ]

      console.log(`   Tracking news for ${companiesToTrack.length} companies: ${companiesToTrack.slice(0, 3).join(', ')}...`)

      // NEW APPROACH: Get general Latest News from Yahoo Finance
      // This is broader than company-specific search
      const yahooPromises = [
        // Get general latest business/trading news
        fetch('https://finance.yahoo.com/news/', {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SignalDesk/1.0)' }
        }).then(async (res) => {
          if (!res.ok) return []
          // Yahoo Finance latest news - broader industry coverage
          // Note: We'll need to parse HTML or use their RSS feed
          return []
        }).catch(() => []),

        // Also get company-specific news but use simpler endpoint
        ...companiesToTrack.slice(0, 5).map(async (company: string) => {
          try {
            // Yahoo Finance RSS feed for company news (more reliable for latest)
            const rssUrl = `https://finance.yahoo.com/rss/headline?s=${encodeURIComponent(company)}`

            // Try RSS first, fallback to search
            const searchUrl = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(company)}&quotesCount=1&newsCount=15&newsRange=1d`

            const response = await fetch(searchUrl, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; SignalDesk/1.0)'
              }
            })

            if (!response.ok) return []

            const data = await response.json()
            const news = data?.news || []

            // FILTER: Only include articles from last 48 hours at fetch time
            const twoDaysAgo = Date.now() - (48 * 60 * 60 * 1000)

            return news
              .filter((item: any) => {
                const pubTime = item.providerPublishTime * 1000
                return pubTime >= twoDaysAgo
              })
              .map((item: any) => ({
                title: item.title,
                url: item.link,
                description: item.summary || '',
                publishDate: new Date(item.providerPublishTime * 1000).toISOString(),
                source: item.publisher,
                source_priority: 'high',
                from_yahoo: true,
                company_tracked: company
              }))
          } catch (err) {
            console.log(`   ⚠️ Failed to fetch Yahoo news for ${company}: ${err.message}`)
            return []
          }
        })
      ]

      const yahooResults = await Promise.all(yahooPromises)
      yahooArticles = yahooResults.flat()

      console.log(`   ✓ Collected ${yahooArticles.length} articles from Yahoo Finance`)
    } catch (err) {
      console.error(`   ❌ Yahoo Finance fetch error: ${err.message}`)
    }

    // STEP 3: Execute Firecrawl searches
    console.log('\n🌐 Step 3: Executing Firecrawl searches...')

    // Build strategic context for Firecrawl searches
    const intelligenceContext = profile?.intelligence_context
    const strategicContext = {
      organization: orgName,
      industry: profile.industry || '',
      analysis_goal: "Strategic positioning analysis for executive intelligence",
      key_focus: [
        "Competitive positioning shifts",
        "Emerging opportunities and risks",
        "Market narrative changes",
        "Critical developments affecting business strategy"
      ],
      perspective: intelligenceContext?.analysis_perspective || `${orgName} executive team making strategic decisions`,
      monitoring_prompt: intelligenceContext?.monitoring_prompt || ''
    }

    const firecrawlArticles = await fetchRealtimeArticles(
      queries,
      profile,
      recency_window,
      strategicContext,
      max_results,
      supabaseUrl,
      supabaseKey
    )

    console.log(`   ✓ Found ${firecrawlArticles.length} articles from Firecrawl`)

    // STEP 3.5: Combine Yahoo Finance and Firecrawl results
    console.log('\n🔗 Step 3.5: Combining Yahoo Finance and Firecrawl results...')

    // Combine all articles
    const allArticles = [...yahooArticles, ...firecrawlArticles]
    console.log(`   Combined: ${yahooArticles.length} Yahoo Finance + ${firecrawlArticles.length} Firecrawl = ${allArticles.length} total`)

    // Deduplicate by URL (prefer Yahoo articles since they're company-specific)
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
      '24hours': 24 // Strict 24 hour limit for fresh news
    }
    const maxHoursOld = recencyLimits[recency_window] || 6
    const cutoffTime = new Date(Date.now() - maxHoursOld * 60 * 60 * 1000)

    const filteredArticles = deduplicatedArticles.filter(article => {
      const publishedDate = new Date(article.publishDate || article.published_at || 0)
      const isRecent = publishedDate >= cutoffTime

      if (!isRecent) {
        const hoursAgo = Math.floor((Date.now() - publishedDate.getTime()) / (1000 * 60 * 60))
        const hadRealDate = article.had_published_time !== false
        console.log(`   🚫 Filtered out OLD article (${hoursAgo}h ago, limit ${maxHoursOld}h): "${article.title?.substring(0, 60)}..." [had_date: ${hadRealDate}, date: ${article.publishDate || article.published_at}]`)
      }

      return isRecent
    })

    // DEBUG: Check how many articles had real publish dates vs defaulted to "now"
    const articlesWithRealDates = deduplicatedArticles.filter(a => a.had_published_time !== false).length
    const articlesDefaultedToNow = deduplicatedArticles.length - articlesWithRealDates
    console.log(`   📊 Date source breakdown:`)
    console.log(`      - Articles with real publishedTime from Firecrawl: ${articlesWithRealDates}`)
    console.log(`      - Articles defaulted to "now" (missing date): ${articlesDefaultedToNow}`)
    if (articlesDefaultedToNow > articlesWithRealDates) {
      console.log(`   ⚠️ WARNING: Most articles have NO publish date from Firecrawl!`)
      console.log(`      This means old articles are passing date filter by defaulting to "now"`)
    }

    console.log(`   ✓ Date filtering: ${deduplicatedArticles.length} articles → ${filteredArticles.length} recent articles (last ${maxHoursOld} hours)`)
    if (filteredArticles.length < deduplicatedArticles.length) {
      console.log(`   🗑️ Removed ${deduplicatedArticles.length - filteredArticles.length} old articles`)
    }

    // STEP 4: Score articles by relevance (source tier + recency + target mentions)
    console.log('\n🎯 Step 4: Scoring articles for relevance...')
    console.log(`   Scoring ${filteredArticles.length} articles by source quality, recency, and target mentions`)

    const scoredArticles = scoreArticlesRelevance(
      filteredArticles,
      profile,
      orgName,
      discoveryTargets,
      targetsWithContext
    )

    // Sort by relevance score and take top articles
    scoredArticles.sort((a, b) => (b.relevance_score || 0) - (a.relevance_score || 0))

    console.log(`   ✅ Scored and sorted ${scoredArticles.length} articles`)
    console.log(`   Top article score: ${scoredArticles[0]?.relevance_score || 0}`)
    console.log(`   Median article score: ${scoredArticles[Math.floor(scoredArticles.length / 2)]?.relevance_score || 0}`)

    // Limit to prevent overwhelming downstream functions
    const articlesToReturn = scoredArticles.slice(0, 100)
    if (scoredArticles.length > 100) {
      console.log(`   ⚠️ Limited from ${scoredArticles.length} to top 100 articles by relevance score`)
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

    // STEP 6: Re-sort after deduplication and limit to top results
    // (Deduplication may have removed high-scoring articles, so re-sort to get best remaining)
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
/**
 * Use AI to generate intelligent search queries based on company context
 * This is the "Fireplexity approach" - let AI understand what matters and formulate smart queries
 */
async function generateIntelligentQueries(
  profile: any,
  orgName: string,
  discoveryTargets: { competitors: Set<string>, stakeholders: Set<string>, topics: Set<string> },
  targetsByPriority: any
): Promise<string[]> {
  const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!

  const competitors = Array.from(discoveryTargets.competitors).slice(0, 10)
  const stakeholders = Array.from(discoveryTargets.stakeholders).slice(0, 5)

  const prompt = `You are a strategic intelligence analyst generating search queries for ${orgName}.

COMPANY CONTEXT:
Industry: ${profile.industry || 'Unknown'}
Business Model: ${profile.business_model || 'Not specified'}
${profile.strategic_goals?.length ? `
Strategic Goals:
${profile.strategic_goals.slice(0, 3).map((g: any) => `- ${g.goal}`).join('\n')}
` : ''}
${profile.competitive_intelligence_priorities ? `
Focus Areas: ${profile.competitive_intelligence_priorities.focus_areas?.join(', ') || 'Not specified'}
Competitor Threats: ${profile.competitive_intelligence_priorities.competitor_threats?.join(', ') || 'Not specified'}
` : ''}
${profile.intelligence_focus ? `
Priority Signals: ${profile.intelligence_focus.priority_signals?.slice(0, 5).join(', ') || 'Not specified'}
` : ''}

COMPETITORS TO MONITOR:
${competitors.join(', ')}

STAKEHOLDERS TO MONITOR:
${stakeholders.join(', ')}

YOUR TASK: Generate 18-25 INDUSTRY-SPECIFIC search queries that will find relevant news about this industry.

CRITICAL RULES:
1. Queries must be SPECIFIC to the "${profile.industry || 'Unknown'}" industry
2. DO NOT use generic templates like "commodity markets" or "war crimes" - adapt to the actual industry
3. Balance BROAD industry trends with SPECIFIC competitor activity
4. Include crisis, opportunity, and regulatory queries relevant to this specific industry

QUERY STRUCTURE:

A. INDUSTRY-SPECIFIC NEWS (6-8 queries):
   Examples for different industries:
   - Public Relations: "PR agency acquisition", "communications firm expansion", "corporate communications trends", "reputation management news", "media relations developments", "PR executive hire", "agency wins account"
   - Trading: "commodity market developments", "supply chain partnerships", "trading company expansion", "trader appointment", "trading desk launch"
   - Technology: "tech company acquisition", "software partnership", "cloud computing trends", "CTO appointment", "product launch"
   - Healthcare: "hospital merger", "pharmaceutical partnership", "medical device approval", "chief medical officer hire", "clinical trial results"

   Generate 6-8 queries that make sense for "${profile.industry || 'Unknown'}" including hires, announcements, wins, expansions

B. REGULATORY & LEGAL (4-5 queries):
   Examples:
   - Public Relations: "PR ethics violation", "FTC advertising investigation", "lobbying disclosure", "client conflict investigation"
   - Trading: "commodity trading violation", "sanctions investigation", "price manipulation", "war crimes investigation"
   - Technology: "antitrust investigation tech", "data privacy violation", "patent lawsuit"

   Generate 4-5 queries relevant to "${profile.industry || 'Unknown'}" regulatory landscape

C. CORPORATE ACTIVITY (4-6 queries):
   Examples:
   - Public Relations: "PR agency merger", "communications firm acquisition", "PR executive appointment", "agency wins client", "creative director hired", "account director promoted"
   - Trading: "trading company acquisition", "commodity supplier partnership", "head of trading appointed", "trading desk expansion"
   - Technology: "tech company merger", "software partnership", "CTO hired", "VP engineering joins", "product manager promoted"

   Generate 4-6 queries for M&A, partnerships, hires, promotions, and client wins in "${profile.industry || 'Unknown'}"

D. CRISIS & OPPORTUNITY (3-4 queries):
   - Include industry-specific crisis types
   - Include growth opportunities

IMPORTANT:
- Make queries BROAD enough to cast a wide net (e.g., "PR agency" not "Weber Shandwick")
- Relevance filter will narrow down to specific competitors later
- Focus on RECENT events, not analysis of old news
- Adapt all examples to "${profile.industry || 'Unknown'}" - do NOT use templates from other industries

Return ONLY a JSON array of 18-25 query strings, no other text. Include queries about hires, appointments, client wins, awards, office openings, and other corporate announcements.`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        temperature: 0.7,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    })

    if (!response.ok) {
      console.log('⚠️ AI query generation failed, falling back to static queries')
      return []
    }

    const data = await response.json()
    const claudeResponse = data.content[0].text

    // Parse JSON array from response
    const jsonMatch = claudeResponse.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      const queries = JSON.parse(jsonMatch[0])
      console.log(`   ✅ AI generated ${queries.length} intelligent queries`)
      return queries
    }
  } catch (error: any) {
    console.log(`   ⚠️ AI query generation error: ${error.message}`)
  }

  return [] // Return empty if AI fails, fallback will be used
}

/**
 * Generate strategic intelligence questions using MCP Discovery context
 * This replaces dumb keyword queries with intelligent, goal-oriented questions
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
  const intelligenceContext = profile?.intelligence_context

  console.log(`   🎯 Intelligence-driven query generation for ${orgName}`)

  // Extract strategic context from MCP Discovery
  const monitoringPrompt = intelligenceContext?.monitoring_prompt || ''
  const keyQuestions = intelligenceContext?.key_questions || []
  const extractionFocus = intelligenceContext?.extraction_focus || []
  const analysisPerspective = intelligenceContext?.analysis_perspective || `Analyze from ${orgName}'s executive perspective`

  console.log(`   Strategic context available:`, {
    hasMonitoringPrompt: !!monitoringPrompt,
    keyQuestions: keyQuestions.length,
    extractionFocus: extractionFocus.length,
    hasAnalysisPerspective: !!analysisPerspective
  })

  // STRATEGY: Generate strategic questions focused on positioning, opportunities, risks, narratives
  const strategicQueries: string[] = []

  // 1. Use MCP Discovery key questions as foundation (if available)
  if (keyQuestions.length > 0) {
    console.log(`   ✅ Using ${keyQuestions.length} strategic questions from MCP Discovery`)
    strategicQueries.push(...keyQuestions)
  }

  // 2. Generate competitor positioning questions
  const topCompetitors = Array.from(discoveryTargets.competitors).slice(0, 5)
  if (topCompetitors.length > 0) {
    topCompetitors.forEach(competitor => {
      strategicQueries.push(
        `What recent strategic moves or positioning changes has ${competitor} made in the ${industry} market that could affect ${orgName}?`
      )
      strategicQueries.push(
        `What vulnerabilities or opportunities has ${competitor} created through recent announcements or market activities?`
      )
    })
  }

  // 3. Industry dynamics and narrative shifts
  if (industry) {
    strategicQueries.push(
      `What critical developments or narrative shifts are happening in the ${industry} industry that ${orgName} should be aware of?`
    )
    strategicQueries.push(
      `What emerging opportunities or risks are appearing in the ${industry} market landscape?`
    )
  }

  // 4. Stakeholder and regulatory questions (if we have high-priority stakeholders)
  const topStakeholders = targetsByPriority.stakeholders.high.slice(0, 3)
  if (topStakeholders.length > 0) {
    topStakeholders.forEach(stakeholder => {
      strategicQueries.push(
        `What positions or actions is ${stakeholder} taking that could impact ${orgName}'s business or market positioning?`
      )
    })
  }

  console.log(`   📋 Generated ${strategicQueries.length} strategic intelligence questions`)
  console.log(`   Sample questions:`, strategicQueries.slice(0, 3))

  // If we generated strategic questions, return them
  if (strategicQueries.length > 0) {
    return strategicQueries
  }

  // If no strategic questions could be generated (no competitors, no industry), fall through to old approach
  console.log(`   ⚠️ Could not generate strategic questions - falling back to context queries`)

  // OLD FALLBACK: Keep for organizations without intelligence_context
  // TODO: Remove once all orgs have run MCP Discovery
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

    // CRITICAL: Add ALL competitor queries (not just high-priority) with comprehensive coverage
    // Context queries are too generic and miss specific competitor news
    const allCompetitors = Array.from(discoveryTargets.competitors).slice(0, 9) // All 9 competitors
    allCompetitors.forEach(competitor => {
      // COMPREHENSIVE COVERAGE: Include positive AND negative events
      // Positive: launches, partnerships, acquisitions
      queries.push(`${competitor} (announced OR launches OR unveils OR acquires OR partners)`)
      // Negative: lawsuits, investigations, scandals, regulatory issues
      queries.push(`${competitor} (lawsuit OR investigation OR scandal OR regulatory OR violation OR accused)`)
    })
    console.log(`   Added ${allCompetitors.length * 2} comprehensive competitor queries (${allCompetitors.length} competitors × 2 query types)`)

    // Add crisis/opportunity detection queries - BROADER to catch more stories
    if (industry) {
      // Crisis detection - removed "announced" to catch ongoing stories too
      queries.push(`${industry} company (lawsuit OR investigation OR violation)`)
      queries.push(`${industry} company (scandal OR accused OR regulatory action)`)
      queries.push(`${industry} (fine OR penalty OR settlement OR enforcement)`)

      // Opportunity detection
      queries.push(`${industry} (partnership OR acquisition OR merger) announced`)
      queries.push(`${industry} company expansion`)
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

  // Add regulatory/partnership queries with breaking news focus
  if (industry) {
    queries.push(`${industry} (partnership OR deal) announced`)
    queries.push(`${industry} (regulation OR ruling OR policy) announced`)
  }

  // Crisis and opportunity detection with breaking news modifiers
  queries.push(`${orgName} (investigation OR lawsuit OR recall) announced`)
  queries.push(`${orgName} (partnership OR acquisition OR launches) announced`)

  console.log(`   ⚠️ Using basic fallback: ${queries.length} queries generated`)

  return queries
}

// OLD APPROACH REMOVED:
// - Previously generated 50+ queries, one per target ("Bill Ackman news", "JPMorgan news")
// - New approach uses ~12 context queries from profile + relevance filtering via targets
// - This is faster, cheaper, and finds more strategic intelligence

/**
 * Extract domains from master-source-registry sources for domain-restricted searches
 */
function extractDomainsFromSources(sources: any): string[] {
  const domains = new Set<string>()

  // Helper to extract domain from URL
  const getDomain = (url: string): string | null => {
    try {
      const hostname = new URL(url).hostname
      return hostname.replace(/^www\./, '') // Remove www. prefix
    } catch {
      return null
    }
  }

  // Extract from all source categories
  const processSourceList = (sourceList: any[]) => {
    if (!sourceList) return
    sourceList.forEach(source => {
      const domain = getDomain(source.url)
      if (domain) domains.add(domain)
    })
  }

  // Process TIER1 and industry-specific sources
  if (sources.media) processSourceList(sources.media)
  if (sources.regulatory) processSourceList(sources.regulatory)
  if (sources.market) processSourceList(sources.market)
  if (sources.competitive) processSourceList(sources.competitive)
  if (sources.specialized) processSourceList(sources.specialized)

  return Array.from(domains)
}

/**
 * Fetch articles using DIRECT Firecrawl API with TWO-TIER SEARCH STRATEGY:
 * TIER 1: Domain-restricted search (trusted sources only)
 * TIER 2: Open web search (strict quality filtering)
 */
async function fetchRealtimeArticles(
  queries: string[],
  profile: any,
  recencyWindow: string,
  strategicContext: any,
  maxResults: number,
  supabaseUrl: string,
  supabaseKey: string
): Promise<any[]> {
  const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY') || 'fc-3048810124b640eb99293880a4ab25d0'
  const FIRECRAWL_BASE_URL = 'https://api.firecrawl.dev/v2'

  const allArticles: any[] = []
  const seenUrls = new Set<string>()

  // Get approved domains from company_profile.sources (set by MCP Discovery)
  let approvedDomains: string[] = []

  console.log(`   📋 Checking for sources in company_profile...`)
  console.log(`   Profile keys: ${Object.keys(profile).join(', ')}`)

  // MCP Discovery stores sources in multiple places - check all
  let sourcesFromProfile = profile.sources || profile.monitoring_config?.sources_by_category

  // CRITICAL FIX: sources might be a JSON string, not an object
  if (sourcesFromProfile && typeof sourcesFromProfile === 'string') {
    try {
      console.log(`   🔧 Sources stored as string, parsing JSON...`)
      sourcesFromProfile = JSON.parse(sourcesFromProfile)
      console.log(`   ✅ Successfully parsed sources JSON`)
    } catch (err) {
      console.error(`   ❌ Failed to parse sources JSON: ${err.message}`)
      sourcesFromProfile = null
    }
  }

  if (sourcesFromProfile) {
    console.log(`   ✓ Found sources, extracting domains...`)
    console.log(`   Source categories: ${Object.keys(sourcesFromProfile).join(', ')}`)

    // Count sources in each category for debugging
    Object.entries(sourcesFromProfile).forEach(([category, sources]) => {
      if (Array.isArray(sources)) {
        console.log(`     - ${category}: ${sources.length} sources`)
      }
    })

    approvedDomains = extractDomainsFromSources(sourcesFromProfile)
    console.log(`   ✅ Extracted ${approvedDomains.length} approved domains`)
    if (approvedDomains.length > 0) {
      console.log(`   Sample domains: ${approvedDomains.slice(0, 5).join(', ')}`)
    }
  } else {
    console.log(`   ⚠️ No sources found in company_profile`)
    console.log(`   This organization may not have run MCP Discovery yet`)
    console.log(`   Falling back to TIER 2 (open web) search only`)
  }

  // Map recency window to Firecrawl tbs parameter
  // IMPORTANT: Niche industry queries need broader time windows to find content
  const tbsMap: Record<string, string> = {
    '1hour': 'qdr:d',   // Last day (even 1hr queries need broader search for industry content)
    '6hours': 'qdr:w',  // Last week (PR industry content is less frequent)
    '24hours': 'qdr:w'  // Last week (executive synthesis)
  }
  const tbs = tbsMap[recencyWindow] || 'qdr:w' // Default to week for industry searches

  console.log(`   Executing ${queries.length} strategic intelligence searches with TWO-TIER strategy`)
  console.log(`   🎯 Strategic Context:`, {
    organization: strategicContext.organization,
    goal: strategicContext.analysis_goal,
    key_focus: strategicContext.key_focus
  })
  console.log(`   📋 First 3 strategic questions:`, queries.slice(0, 3))
  console.log(`   TIER 1: Domain-restricted (${approvedDomains.length} trusted sources)`)
  console.log(`   TIER 1 targeting top 15 domains: ${approvedDomains.slice(0, 15).join(', ')}`)
  console.log(`   TIER 2: Open web with strict filtering (score >70)`)
  console.log(`   Time filter: ${tbs} (${recencyWindow})`)

  // TWO-TIER SEARCH LIMITS
  const tier1Limit = 15  // More results from trusted sources
  const tier2Limit = 5   // Fewer results from open web (strict quality threshold)

  console.log(`   TIER 1 limit: ${tier1Limit} results per query`)
  console.log(`   TIER 2 limit: ${tier2Limit} results per query (filtered to score >70)`)
  console.log(`   Cache strategy: No cache (fresh data to prevent old articles)`)

  // Execute searches in parallel (larger batch for speed - all at once)
  const batchSize = 15 // Process all queries in one batch
  for (let i = 0; i < queries.length; i += batchSize) {
    const batch = queries.slice(i, i + batchSize)

    const batchPromises = batch.map(async (query) => {
      const queryResults: any[] = []

      // TIER 1: High-quality search with strategic queries (NO domain restriction - Firecrawl doesn't support site: operators)
      // Instead, use highly specific queries that naturally find industry-relevant content
      if (approvedDomains.length > 0) {
        // Log first query to verify structure
        if (i === 0 && batch.indexOf(query) === 0) {
          console.log(`   📍 Example TIER 1 strategic query:`)
          console.log(`      Question: ${query}`)
          console.log(`      Context: Strategic intelligence for ${strategicContext.organization}`)
          console.log(`      Industry: ${strategicContext.industry}`)
          console.log(`      Approved domains for post-filtering: ${approvedDomains.slice(0, 5).join(', ')}`)
        }

        try {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 45000)

          const searchResponse = await fetch(`${FIRECRAWL_BASE_URL}/search`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              query,  // Use clean strategic query - Firecrawl doesn't support site: operators
              sources: ['web', 'news'],
              limit: tier1Limit,
              tbs,
              timeout: 40000,
              ignoreInvalidURLs: true,
              scrapeOptions: {
                formats: ['markdown'],
                onlyMainContent: true,
                maxAge: 0
              }
            }),
            signal: controller.signal
          })

          clearTimeout(timeoutId)

          if (searchResponse.ok) {
            const searchData = await searchResponse.json()
            const webResults = searchData.data?.web || []
            const newsResults = searchData.data?.news || []

            console.log(`   ✓ TIER 1 query "${query.substring(0, 50)}..." returned ${webResults.length + newsResults.length} results`)

            // Results should already be from trusted domains, but verify
            const tier1Results = [...webResults, ...newsResults].filter(result => {
              const domain = extractDomain(result.url)
              return approvedDomains.includes(domain)
            })

            console.log(`   ✓ After domain filtering: ${tier1Results.length} articles from trusted sources`)

            // Convert to standard format
            tier1Results.forEach((result, idx) => {
              const fullMarkdown = result.markdown || ''
              const relevantContent = fullMarkdown ? selectRelevantContent(fullMarkdown, query, 1000) : ''

              // DEBUG: Log first article to see what Firecrawl returns
              if (idx === 0 && i === 0) {
                console.log(`   🔍 TIER 1 Sample article from Firecrawl:`, {
                  title: result.title?.substring(0, 60),
                  url: result.url,
                  publishedTime: result.publishedTime,
                  hasPublishedTime: !!result.publishedTime,
                  score: result.score
                })
              }

              const publishDate = result.publishedTime || new Date().toISOString()

              // WARN if no publish date
              if (!result.publishedTime && idx < 2) {
                console.log(`   ⚠️ TIER 1 article has NO publishedTime, defaulting to now: "${result.title?.substring(0, 60)}..."`)
              }

              queryResults.push({
                title: result.title || 'Untitled',
                url: result.url,
                content: relevantContent,
                description: result.description || '',
                published_at: publishDate,
                source: result.source || extractDomain(result.url),
                relevance_score: result.score || 50,
                full_markdown: fullMarkdown.substring(0, 5000),
                search_tier: 'TIER1', // Mark as trusted source
                had_published_time: !!result.publishedTime // Track if date was real or defaulted
              })
            })
          } else {
            const errorText = await searchResponse.text()
            console.log(`   ❌ TIER 1 search HTTP error ${searchResponse.status} for "${query}": ${errorText.substring(0, 200)}`)
          }
        } catch (err: any) {
          if (err.name === 'AbortError') {
            console.log(`   ⏱️ TIER 1 search timed out for "${query.substring(0, 50)}..."`)
          } else {
            console.log(`   ⚠️ TIER 1 search failed for "${query.substring(0, 50)}...": ${err.message}`)
          }
        }
      }

      // TIER 2: Open web search with strict quality filtering
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 45000)

        const searchResponse = await fetch(`${FIRECRAWL_BASE_URL}/search`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            query,
            sources: ['web', 'news'],
            limit: tier2Limit,
            tbs,
            timeout: 40000,
            ignoreInvalidURLs: true,
            scrapeOptions: {
              formats: ['markdown'],
              onlyMainContent: true,
              maxAge: 0
            }
          }),
          signal: controller.signal
        })

        clearTimeout(timeoutId)

        if (searchResponse.ok) {
          const searchData = await searchResponse.json()
          const webResults = searchData.data?.web || []
          const newsResults = searchData.data?.news || []

          // Filter to high-quality results NOT from approved domains (avoid duplicates)
          const tier2Results = [...webResults, ...newsResults].filter(result => {
            const domain = extractDomain(result.url)
            const score = result.score || 0
            return score > 70 && !approvedDomains.includes(domain) // Strict quality threshold
          })

          // Convert to standard format
          tier2Results.forEach(result => {
            const fullMarkdown = result.markdown || ''
            const relevantContent = fullMarkdown ? selectRelevantContent(fullMarkdown, query, 1000) : ''

            queryResults.push({
              title: result.title || 'Untitled',
              url: result.url,
              content: relevantContent,
              description: result.description || '',
              published_at: result.publishedTime || new Date().toISOString(),
              source: result.source || extractDomain(result.url),
              relevance_score: result.score || 50,
              full_markdown: fullMarkdown.substring(0, 5000),
              search_tier: 'TIER2' // Mark as open web (high quality)
            })
          })
        }
      } catch (err: any) {
        if (err.name === 'AbortError') {
          console.log(`   ⏱️ TIER 2 search timed out for "${query}"`)
        } else {
          console.log(`   ⚠️ TIER 2 search failed for "${query}": ${err.message}`)
        }
      }

      return queryResults
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

  // Log tier statistics
  const tier1Count = allArticles.filter(a => a.search_tier === 'TIER1').length
  const tier2Count = allArticles.filter(a => a.search_tier === 'TIER2').length
  console.log(`   📊 Search tier breakdown:`)
  console.log(`      TIER 1 (trusted sources): ${tier1Count} articles`)
  console.log(`      TIER 2 (open web >70 score): ${tier2Count} articles`)
  console.log(`      Total unique articles: ${allArticles.length}`)

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

    // ALWAYS apply source tier and recency bonuses (not conditional on target mentions)
    // High-quality sources publish relevant industry news even without specific target mentions
    const sourceName = typeof article.source === 'object' ? article.source.name : article.source
    const sourceTier = getSourceTier(sourceName, profile)

    // Source tier bonus (critical sources are valuable even without target mentions)
    if (sourceTier === 'critical') score += 15
    else if (sourceTier === 'high') score += 10
    else score += 5 // Medium sources get baseline score

    // Recency bonus (recent news is valuable)
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
  })
  // Don't filter here - let ALL articles through to be ranked by score
  // The AI relevance filter downstream will do the intelligent filtering
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

/**
 * Select relevant content from article markdown based on query keywords
 * Inspired by Fireplexity's intelligent content selection
 * Extracts ~maxLength characters of most relevant content for AI filtering
 */
function selectRelevantContent(content: string, query: string, maxLength: number = 1000): string {
  if (!content || content.length <= maxLength) {
    return content
  }

  // Split into paragraphs
  const paragraphs = content.split('\n\n').filter(p => p.trim().length > 0)

  if (paragraphs.length === 0) {
    return content.substring(0, maxLength) + '...'
  }

  // Extract keywords from query (words > 3 chars, excluding stopwords)
  const stopwords = ['what', 'when', 'where', 'which', 'who', 'how', 'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use']
  const keywords = query.toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopwords.includes(word))

  // Always preserve intro (first paragraph)
  const intro = paragraphs[0]

  // Score middle paragraphs by keyword density
  const scoredParagraphs = paragraphs.slice(1, -1).map((para, idx) => {
    const paraLower = para.toLowerCase()
    const score = keywords.reduce((sum, keyword) => {
      const matches = (paraLower.match(new RegExp(keyword, 'g')) || []).length
      return sum + matches
    }, 0)
    return { para, score, originalIndex: idx + 1 }
  }).filter(p => p.score > 0) // Only keep paragraphs with keyword matches

  // Sort by score and take top 3
  scoredParagraphs.sort((a, b) => b.score - a.score)
  const topParagraphs = scoredParagraphs.slice(0, 3)

  // Restore original order
  topParagraphs.sort((a, b) => a.originalIndex - b.originalIndex)

  // Always preserve conclusion (last paragraph)
  const conclusion = paragraphs.length > 1 ? paragraphs[paragraphs.length - 1] : ''

  // Combine: intro + relevant middle paragraphs + conclusion
  const selectedParagraphs = [intro, ...topParagraphs.map(p => p.para)]
  if (conclusion) {
    selectedParagraphs.push(conclusion)
  }

  const result = selectedParagraphs.join('\n\n')

  // Truncate if still too long
  if (result.length > maxLength) {
    return result.substring(0, maxLength) + '...'
  }

  return result
}
