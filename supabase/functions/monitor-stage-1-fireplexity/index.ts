/**
 * Monitor Stage 1 - Fireplexity Edition
 *
 * Replaces traditional RSS monitoring with Firecrawl-powered search
 * while maintaining full compatibility with downstream pipeline stages.
 *
 * Key improvements over traditional monitor-stage-1:
 * - Uses Firecrawl search instead of RSS (finds articles RSS misses)
 * - Leverages master-source-registry (100+ curated sources)
 * - More comprehensive coverage (not limited by RSS feed windows)
 * - Fresher results (search engines index faster than RSS)
 * - Profile-driven queries (intelligent search based on competitors/stakeholders)
 *
 * Output schema matches monitor-stage-1 for pipeline compatibility
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MonitorRequest {
  organization?: string
  organization_name?: string
  profile?: any
  recency_window?: string // '24hours', '48hours', '7days'
  skip_deduplication?: boolean // For testing, default false
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const {
      organization,
      organization_name,
      profile: providedProfile,
      recency_window = '24hours', // Default 24 hours for daily runs
      skip_deduplication = false
    }: MonitorRequest = await req.json()

    const orgName = organization || organization_name
    if (!orgName) {
      throw new Error('organization or organization_name is required')
    }

    console.log('🚀 Monitor Stage 1 (Fireplexity Edition) starting...')
    console.log(`   Organization: ${orgName}`)
    console.log(`   Recency window: ${recency_window}`)
    console.log(`   Deduplication: ${skip_deduplication ? 'DISABLED' : 'ENABLED'}`)

    const startTime = Date.now()
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // STEP 1: Get organization profile from mcp-discovery
    console.log('\n📋 Step 1: Fetching organization profile...')

    let profile = providedProfile
    if (!profile) {
      const { data: profileData } = await supabase
        .from('organization_profiles')
        .select('profile_data')
        .eq('organization_name', orgName)
        .single()

      if (!profileData) {
        throw new Error(`No profile found for ${orgName}. Please run mcp-discovery first.`)
      }

      profile = profileData.profile_data
    }

    console.log(`   ✓ Profile loaded: ${profile.industry || 'Unknown'} industry`)
    console.log(`   ✓ Competitors: ${profile.competition?.direct_competitors?.length || 0}`)
    // Note: Sources are fetched dynamically by niv-fireplexity from master-source-registry
    // Not stored in profile, so we can't count them here

    // STEP 2: Generate intelligent search queries from profile
    console.log('\n🔍 Step 2: Generating search queries from profile...')

    const queries = generateSearchQueries(profile, orgName)
    console.log(`   ✓ Generated ${queries.length} search queries`)

    // STEP 3: Call niv-fireplexity for each query (with master-source-registry sources)
    console.log('\n🌐 Step 3: Executing Firecrawl searches...')

    const allArticles = await fetchArticlesWithFireplexity(
      queries,
      profile,
      recency_window,
      supabaseUrl,
      supabaseKey
    )

    console.log(`   ✓ Found ${allArticles.length} total articles`)

    // STEP 4: Deduplicate against previously processed articles
    console.log('\n🔍 Step 4: Checking for previously processed articles...')

    let newArticles = allArticles
    let skippedCount = 0

    if (!skip_deduplication) {
      const deduplicationResult = await deduplicateArticles(allArticles, orgName, supabase)
      newArticles = deduplicationResult.newArticles
      skippedCount = deduplicationResult.skippedCount

      console.log(`   ✓ Filtered: ${allArticles.length} found → ${newArticles.length} new (${skippedCount} already processed)`)
    } else {
      console.log(`   ⚠️ Deduplication skipped`)
    }

    // STEP 5: Transform schema to match monitor-stage-1 output
    console.log('\n🔄 Step 5: Transforming schema for pipeline compatibility...')

    // CRITICAL: Filter to last 48 hours to prevent old cached articles from Firecrawl
    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000)
    const recentArticles = newArticles.filter(article => {
      const articleDate = new Date(article.publishDate || article.published_at || article.publishedTime || 0)
      const isRecent = articleDate > twoDaysAgo

      if (!isRecent) {
        console.log(`   🕒 Filtered out old article from ${articleDate.toISOString()}: "${article.title?.substring(0, 60)}..."`)
      }

      return isRecent
    })

    console.log(`   🕒 Date filtering: ${newArticles.length} articles → ${recentArticles.length} articles (last 48 hours)`)

    if (recentArticles.length < newArticles.length) {
      console.log(`   ⚠️ ${newArticles.length - recentArticles.length} old articles filtered out`)
    }

    const normalizedArticles = normalizeArticlesSchema(recentArticles, profile)
    console.log(`   ✓ Normalized ${normalizedArticles.length} articles`)

    // STEP 6: Create coverage report (like monitor-stage-1 does)
    console.log('\n📊 Step 6: Generating coverage report...')

    const coverageReport = generateCoverageReport(normalizedArticles, profile, orgName)
    console.log(`   ✓ Coverage: ${coverageReport.found.competitors.length} competitors, ${coverageReport.found.stakeholders.length} stakeholders`)

    // STEP 7: Mark articles as processed (for future deduplication)
    if (!skip_deduplication && normalizedArticles.length > 0) {
      console.log('\n💾 Step 7: Marking articles as processed...')
      await markArticlesAsProcessed(normalizedArticles, orgName, supabase)
      console.log(`   ✓ Marked ${normalizedArticles.length} articles as processed`)
    }

    // STEP 8: Return compatible response
    const executionTime = Date.now() - startTime

    const response = {
      success: true,
      stage: 1,
      source: 'fireplexity',
      articles: normalizedArticles,
      total_articles: normalizedArticles.length,
      social_signals: [], // Optional for now
      social_sentiment: null, // Optional for now
      metadata: {
        organization: orgName,
        industry: profile.industry,
        competitors_tracked: profile.competition?.direct_competitors?.length || 0,
        stakeholders_tracked: profile.stakeholders?.regulators?.length || 0,
        keywords_used: queries.length,
        source_type: 'firecrawl_search',
        priority_sources_used: profile.sources?.source_priorities?.total_sources || 0,
        coverage_report: coverageReport,
        recency_window,
        execution_time_ms: executionTime,
        timestamp: new Date().toISOString(),
        deduplication: {
          enabled: !skip_deduplication,
          total_found: allArticles.length,
          already_processed: skippedCount,
          new_articles: normalizedArticles.length
        }
      }
    }

    console.log(`\n✅ Monitor Stage 1 complete in ${executionTime}ms`)
    console.log(`   Articles: ${normalizedArticles.length}`)
    console.log(`   Entity coverage: ${coverageReport.found.competitors.length} competitors, ${coverageReport.found.stakeholders.length} stakeholders, ${coverageReport.found.topics.length} topics`)

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error: any) {
    console.error('❌ Monitor Stage 1 error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      stage: 1
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

/**
 * Deduplicate articles against previously processed ones
 * Returns only articles that haven't been processed in the last 7 days
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
  const { data: processedArticles } = await supabase
    .from('processed_articles')
    .select('article_url')
    .eq('organization_id', organizationId)
    .in('article_url', articleUrls)
    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days

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
    stage: 'monitor-stage-1-fireplexity',
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
 * Extract smart queries from mcp-discovery profile
 * Uses mcp-discovery's curated queries instead of regenerating
 */
function generateSearchQueries(profile: any, orgName: string): string[] {
  const queries: string[] = []

  // Option 1: Use mcp-discovery's smart search_queries if available
  const searchQueries = profile.monitoring_config?.search_queries
  if (searchQueries) {
    // Take top queries from each category (limit for speed)
    const competitorQueries = searchQueries.competitor_queries?.slice(0, 5) || []
    const crisisQueries = searchQueries.crisis_queries?.slice(0, 3) || []
    const opportunityQueries = searchQueries.opportunity_queries?.slice(0, 3) || []
    const regulatoryQueries = searchQueries.regulatory_queries?.slice(0, 2) || []

    queries.push(...competitorQueries)
    queries.push(...crisisQueries)
    queries.push(...opportunityQueries)
    queries.push(...regulatoryQueries)

    console.log(`   Using ${queries.length} queries from mcp-discovery`)
  }

  // Fallback: If no smart queries, generate basic ones
  if (queries.length === 0) {
    console.log(`   ⚠️ No smart queries from mcp-discovery, generating basic queries`)
    queries.push(orgName)
    queries.push(`${orgName} ${profile.industry || ''}`.trim())

    const topCompetitors = (profile.competition?.direct_competitors || []).slice(0, 3)
    topCompetitors.forEach(comp => queries.push(comp))

    if (profile.industry) queries.push(`${profile.industry} news trends`)
  }

  // Remove duplicates and empty queries
  return [...new Set(queries.filter(q => q && q.trim()))]
}

/**
 * Fetch articles using DIRECT Firecrawl API (bypasses niv-fireplexity for speed + time filtering)
 */
async function fetchArticlesWithFireplexity(
  queries: string[],
  profile: any,
  recencyWindow: string,
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
    '24hours': 'qdr:d',
    '3days': 'qdr:d3',
    '7days': 'qdr:w',
    '14days': 'qdr:w2',
    '30days': 'qdr:m'
  }
  const tbs = tbsMap[recencyWindow] || 'qdr:d' // Default 24 hours

  console.log(`   Executing ${queries.length} Firecrawl searches with time filter: ${tbs}`)

  // Execute searches in parallel batches (6 concurrent for speed)
  const batchSize = 6
  for (let i = 0; i < queries.length; i += batchSize) {
    const batch = queries.slice(i, i + batchSize)

    const batchPromises = batch.map(async (query) => {
      try {
        const searchResponse = await fetch(`${FIRECRAWL_BASE_URL}/search`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            query,
            sources: ['web', 'news'],
            limit: 6, // Reduced for speed (6 * 13 queries = ~78 articles)
            tbs, // CRITICAL: Time-based search filter
            scrapeOptions: {
              formats: ['markdown'],
              onlyMainContent: true
            }
          })
        })

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
        console.log(`   ⚠️ Search failed for "${query}": ${err.message}`)
        return []
      }
    })

    const batchResults = await Promise.all(batchPromises)

    // Merge results and deduplicate
    batchResults.forEach(results => {
      results.forEach((article: any) => {
        if (article.url && !seenUrls.has(article.url)) {
          seenUrls.add(article.url)
          allArticles.push(article)
        }
      })
    })

    console.log(`   ✓ Batch ${Math.floor(i / batchSize) + 1}: ${allArticles.length} unique articles so far`)
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
 * Normalize Fireplexity results to match monitor-stage-1 schema
 * ENHANCED: Adds recency scoring to prioritize fresh news over stale content
 */
function normalizeArticlesSchema(articles: any[], profile: any): any[] {
  return articles.map((article, index) => {
    // Extract source name from source object or domain
    const sourceName = typeof article.source === 'object'
      ? article.source.name
      : article.source || extractSourceFromUrl(article.url)

    // Determine source tier from profile's source priorities
    const sourceTier = getSourceTier(sourceName, profile)

    // Determine source category
    const sourceCategory = categorizeSource(sourceName, profile)

    // Calculate base relevance score
    const baseScore = article.relevanceScore || article.relevance_score || 0.5

    // ADD RECENCY SCORING (like NIV V2) - prioritize fresh news
    const publishedDate = new Date(article.publishDate || article.published_at || Date.now())
    const hoursAgo = (Date.now() - publishedDate.getTime()) / (1000 * 60 * 60)

    let recencyBonus = 0
    if (hoursAgo < 1) recencyBonus = 0.25      // Within 1 hour: +25 points
    else if (hoursAgo < 6) recencyBonus = 0.15  // Within 6 hours: +15 points
    else if (hoursAgo < 12) recencyBonus = 0.10 // Within 12 hours: +10 points
    else if (hoursAgo < 24) recencyBonus = 0.05 // Within 24 hours: +5 points

    // Source tier bonus
    let tierBonus = 0
    if (sourceTier === 'critical') tierBonus = 0.15
    else if (sourceTier === 'high') tierBonus = 0.10

    // Final relevance score with recency and tier bonuses
    const finalScore = Math.min(baseScore + recencyBonus + tierBonus, 1.0)

    return {
      // Core fields (from Fireplexity)
      title: article.title,
      description: article.description || article.summary || '',
      url: article.url,
      content: article.content || article.description || '',

      // Renamed fields (fix schema incompatibilities)
      published_at: article.publishDate || article.published_at || new Date().toISOString(),
      relevance_score: finalScore, // NOW includes recency + tier bonuses

      // Source fields (flattened and categorized)
      source: sourceName,
      source_type: article.sourceType === 'search' ? 'api_search' : 'rss_primary',
      source_category: sourceCategory,
      source_tier: sourceTier,
      source_url: article.source_url || article.url,

      // Monitoring metadata (expected by downstream stages)
      claude_assessed: true, // Fireplexity uses AI
      is_priority: finalScore > 0.7, // Updated to use final score

      // Discovery coverage (what entities are mentioned)
      discovery_coverage: {
        competitors: findMentionedCompetitors(article, profile),
        stakeholders: findMentionedStakeholders(article, profile),
        topics: findMentionedTopics(article, profile),
        score: finalScore * 100 // Updated to use final score
      },

      // Metadata
      metadata: {
        search_query: article.searchQuery || '',
        firecrawl_processed: true,
        index: index,
        recency_hours: Math.round(hoursAgo * 10) / 10, // Track how old the article is
        recency_bonus: recencyBonus,
        base_score: baseScore
      }
    }
  })
}

/**
 * Generate coverage report showing what was found vs gaps
 */
function generateCoverageReport(articles: any[], profile: any, orgName: string) {
  const mentionedCompetitors = new Set<string>()
  const mentionedStakeholders = new Set<string>()
  const mentionedTopics = new Set<string>()

  // Analyze what's covered
  articles.forEach(article => {
    if (article.discovery_coverage) {
      article.discovery_coverage.competitors.forEach((c: string) => mentionedCompetitors.add(c))
      article.discovery_coverage.stakeholders.forEach((s: string) => mentionedStakeholders.add(s))
      article.discovery_coverage.topics.forEach((t: string) => mentionedTopics.add(t))
    }
  })

  // Identify gaps
  const allCompetitors = profile.competition?.direct_competitors || []
  const allStakeholders = [
    ...(profile.stakeholders?.regulators || []),
    ...(profile.stakeholders?.major_investors || [])
  ]
  const allTopics = profile.trending?.hot_topics || []

  const gapCompetitors = allCompetitors.filter((c: string) => !mentionedCompetitors.has(c))
  const gapStakeholders = allStakeholders.filter((s: string) => !mentionedStakeholders.has(s))
  const gapTopics = allTopics.filter((t: string) => !mentionedTopics.has(t))

  return {
    found: {
      competitors: Array.from(mentionedCompetitors),
      stakeholders: Array.from(mentionedStakeholders),
      topics: Array.from(mentionedTopics)
    },
    gaps: {
      competitors: gapCompetitors,
      stakeholders: gapStakeholders,
      topics: gapTopics
    },
    coverage_percentage: {
      competitors: allCompetitors.length > 0
        ? Math.round((mentionedCompetitors.size / allCompetitors.length) * 100)
        : 0,
      stakeholders: allStakeholders.length > 0
        ? Math.round((mentionedStakeholders.size / allStakeholders.length) * 100)
        : 0,
      topics: allTopics.length > 0
        ? Math.round((mentionedTopics.size / allTopics.length) * 100)
        : 0
    },
    message_for_synthesis: `Fireplexity search found ${articles.length} articles covering ${mentionedCompetitors.size} competitors, ${mentionedStakeholders.size} stakeholders, and ${mentionedTopics.size} topics from ${profile.sources?.source_priorities?.total_sources || 0} priority sources.`,
    priorities: articles.map((_, idx) => idx).filter(idx => articles[idx].is_priority)
  }
}

// Helper functions

function extractSourceFromUrl(url: string): string {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname.replace('www.', '')
  } catch {
    return 'Unknown'
  }
}

function getSourceTier(sourceName: string, profile: any): string {
  const sourceNameLower = sourceName.toLowerCase()

  // Check critical sources
  const criticalSources = profile.sources?.source_priorities?.critical || []
  if (criticalSources.some((s: string) => s.toLowerCase().includes(sourceNameLower) || sourceNameLower.includes(s.toLowerCase()))) {
    return 'critical'
  }

  // Check high priority sources
  const highSources = profile.sources?.source_priorities?.high || []
  if (highSources.some((s: string) => s.toLowerCase().includes(sourceNameLower) || sourceNameLower.includes(s.toLowerCase()))) {
    return 'high'
  }

  return 'medium'
}

function categorizeSource(sourceName: string, profile: any): string {
  const sourceNameLower = sourceName.toLowerCase()

  // Check if it's a competitive source
  const competitiveSources = profile.sources?.competitive || []
  if (competitiveSources.some((s: any) => s.name?.toLowerCase().includes(sourceNameLower))) {
    return 'competitive'
  }

  // Check if regulatory
  if (sourceNameLower.includes('sec') || sourceNameLower.includes('ftc') || sourceNameLower.includes('fda')) {
    return 'regulatory'
  }

  // Check if market/financial
  if (sourceNameLower.includes('market') || sourceNameLower.includes('finance') || sourceNameLower.includes('stock')) {
    return 'market'
  }

  return 'media'
}

function findMentionedCompetitors(article: any, profile: any): string[] {
  const text = `${article.title || ''} ${article.content || ''}`.toLowerCase()
  const competitors = profile.competition?.direct_competitors || []

  return competitors.filter((comp: string) =>
    text.includes(comp.toLowerCase())
  )
}

function findMentionedStakeholders(article: any, profile: any): string[] {
  const text = `${article.title || ''} ${article.content || ''}`.toLowerCase()
  const stakeholders = [
    ...(profile.stakeholders?.regulators || []),
    ...(profile.stakeholders?.major_investors || []),
    ...(profile.stakeholders?.executives || [])
  ]

  return stakeholders.filter((stakeholder: string) =>
    stakeholder && text.includes(stakeholder.toLowerCase())
  )
}

function findMentionedTopics(article: any, profile: any): string[] {
  const text = `${article.title || ''} ${article.content || ''}`.toLowerCase()
  const topics = profile.trending?.hot_topics || []

  return topics.filter((topic: string) =>
    topic && text.includes(topic.toLowerCase())
  )
}
