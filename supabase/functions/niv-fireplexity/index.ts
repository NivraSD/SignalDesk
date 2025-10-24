import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'
import {
  createSearchStrategy,
  formatSearchQuery,
  scoreRelevance,
  type SearchStrategy
} from './enhanced-search.ts'
import {
  getOrganizationContext,
  enhanceQueryWithContext,
  getSearchDomains,
  type OrganizationContext
} from './organization-context.ts'

console.log("NIV Fireplexity - Enhanced Search Engine with Multi-Query Strategy starting...")

// IMPORTANT: Firecrawl API key for search and scraping
const FIRECRAWL_API_KEY = 'fc-3048810124b640eb99293880a4ab25d0'
const FIRECRAWL_BASE_URL = 'https://api.firecrawl.dev/v2'

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const {
      query,
      context = {},
      useCache = true,
      searchMode = 'comprehensive', // comprehensive | focused | quick
      organizationId = 'OpenAI',
      conversationId // For session persistence
    } = await req.json()

    if (!query) {
      return new Response(
        JSON.stringify({ error: 'Query is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    console.log(`🔍 NIV Fireplexity Search: "${query}" (mode: ${searchMode})`)
    console.log(`🏢 Organization: ${organizationId}`)

    // Get organization context
    const orgContext = await getOrganizationContext(organizationId, conversationId)
    console.log(`📋 Organization context loaded: ${orgContext.organizationName}`)
    if (orgContext.directCompetitors.length > 0) {
      console.log(`🎯 Tracking competitors: ${orgContext.directCompetitors.slice(0, 3).join(', ')}...`)
    }

    // Enhance query with organization context
    const enhancedQuery = enhanceQueryWithContext(query, orgContext)
    if (enhancedQuery !== query) {
      console.log(`✨ Query enhanced with org context`)
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Generate cache key
    const cacheKey = `niv_search_${searchMode}_${query.toLowerCase().replace(/\s+/g, '_').substring(0, 50)}`

    // Check cache for recent results (30 min TTL for comprehensive searches)
    if (useCache) {
      const { data: cached } = await supabase
        .from('niv_search_cache')
        .select('*')
        .eq('cache_key', cacheKey)
        .gte('created_at', new Date(Date.now() - 30 * 60 * 1000).toISOString())
        .single()

      if (cached) {
        console.log('🎯 Returning cached search result')
        return new Response(
          JSON.stringify({
            ...cached.result,
            cached: true,
            cacheAge: Math.round((Date.now() - new Date(cached.created_at).getTime()) / 60000)
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Perform Perplexity-style intelligent search
    const searchResult = await performIntelligentSearch(
      enhancedQuery,
      searchMode,
      { ...context, orgContext }, // Include org context
      organizationId
    )

    // Cache the result
    if (useCache && searchResult.success) {
      await supabase
        .from('niv_search_cache')
        .upsert({
          cache_key: cacheKey,
          result: searchResult,
          created_at: new Date().toISOString()
        })
        .select()
    }

    return new Response(
      JSON.stringify(searchResult),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ NIV Fireplexity error:', error)
    return new Response(
      JSON.stringify({
        error: error.message,
        success: false
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

// Perform intelligent Perplexity-style search
async function performIntelligentSearch(
  query: string,
  searchMode: string,
  context: any,
  organizationId: string
) {
  const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY') || FIRECRAWL_API_KEY

  if (!firecrawlKey) {
    throw new Error('No Firecrawl API key configured')
  }

  // Step 1: Create advanced search strategy with multiple queries
  const orgDomains = context.orgContext ? getSearchDomains(context.orgContext) : []
  const searchStrategy = createSearchStrategy(query, context, orgDomains)
  console.log(`🧠 Created search strategy with ${searchStrategy.queries.length} query variations`)
  console.log(`📝 Queries: ${searchStrategy.queries.slice(0, 3).map(q => q.substring(0, 50)).join(' | ')}...`)
  if (orgDomains.length > 0) {
    console.log(`📰 Using org-specific sources: ${orgDomains.slice(0, 5).join(', ')}...`)
  }

  if (searchStrategy.tbs) {
    const timeLabels = {
      'qdr:h': 'past hour (breaking news)',
      'qdr:d': 'past 24 hours',
      'qdr:d3': 'past 3 days',
      'qdr:w': 'past week (7 days)',
      'qdr:w2': 'past 2 weeks',
      'qdr:m': 'past month (30 days)',
      'qdr:m3': 'past 3 months',
      'qdr:m6': 'past 6 months',
      'qdr:y': 'past year'
    }
    console.log(`⏰ Time filter: ${timeLabels[searchStrategy.tbs] || searchStrategy.tbs}`)
  } else {
    console.log(`⏰ No time filter applied (searching all time)`)
  }

  // Step 2: Perform searches with multiple query variations for better coverage
  const searchLimit = searchMode === 'comprehensive' ? 15 : searchMode === 'focused' ? 10 : 5
  const allResults = []

  // Calculate maxAge based on time filter (in milliseconds)
  const maxAgeMap = {
    'qdr:h': 3600000,      // 1 hour
    'qdr:d': 86400000,     // 24 hours
    'qdr:d3': 259200000,   // 3 days
    'qdr:w': 604800000,    // 7 days
    'qdr:w2': 1209600000,  // 14 days
    'qdr:m': 2592000000,   // 30 days
    'qdr:m3': 7776000000,  // 90 days
    'qdr:m6': 15552000000, // 180 days
    'qdr:y': 31536000000   // 365 days
  }
  const maxAge = searchStrategy.tbs ? maxAgeMap[searchStrategy.tbs] : 1209600000 // Default to 2 weeks (matches new qdr:w2 default)

  // Try up to 3 query variations to ensure we get good coverage
  const queriesToTry = searchMode === 'comprehensive' ? 3 : 2

  for (let i = 0; i < Math.min(queriesToTry, searchStrategy.queries.length); i++) {
    const searchQuery = formatSearchQuery(searchStrategy, i)
    console.log(`🔍 Search ${i + 1}/${queriesToTry}: "${searchQuery.substring(0, 80)}..."`)

    try {
      // Intelligently select Firecrawl categories based on query content
      const categories = []
      const queryLower = searchQuery.toLowerCase()

      // Add 'research' category for academic/statistical queries
      if (queryLower.match(/statistic|study|research|data|report|survey|analysis|finding|trend|percent|rate/i)) {
        categories.push('research')
      }

      // Add 'pdf' category for whitepapers, reports, documentation
      if (queryLower.match(/whitepaper|report|document|guide|manual|specification|overview/i)) {
        categories.push('pdf')
      }

      // Add 'github' category for technical/API queries
      if (queryLower.match(/api|sdk|code|implementation|library|package|integration|github|developer/i)) {
        categories.push('github')
      }

      const searchBody: any = {
        query: searchQuery,
        sources: ['web', 'news'], // Add sources for multi-source search
        limit: searchLimit,
        ...(searchStrategy.tbs && { tbs: searchStrategy.tbs }), // Add time-based search if specified
        scrapeOptions: {
          formats: ['markdown'],
          onlyMainContent: true, // Filter out navigation and ads
          maxAge: maxAge // Dynamic maxAge based on time filter
        }
      }

      // Add categories if any were detected
      if (categories.length > 0) {
        searchBody.categories = categories
        console.log(`📚 Using categories: ${categories.join(', ')}`)
      }

      const searchResponse = await fetch(`${FIRECRAWL_BASE_URL}/search`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${firecrawlKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(searchBody)
      })

      if (!searchResponse.ok) {
        const errorText = await searchResponse.text()
        console.error(`Firecrawl search ${i + 1} failed:`, searchResponse.status, errorText)
        continue // Try next query variation
      }

      const searchData = await searchResponse.json()
      // Parse multi-source response structure
      const webResults = searchData.data?.web || []
      const newsResults = searchData.data?.news || []

      // Log first result to see what Firecrawl is returning
      if (webResults.length > 0) {
        const sample = webResults[0]
        console.log(`📋 Sample result structure: url=${!!sample.url}, markdown=${sample.markdown?.length || 0} chars, content=${sample.content?.length || 0} chars`)
        if (sample.markdown) {
          console.log(`📄 Markdown preview: ${sample.markdown.substring(0, 200)}...`)
        }
      }

      // Tag results with their source type
      const taggedWebResults = webResults.map(r => ({ ...r, sourceType: 'web' }))
      const taggedNewsResults = newsResults.map(r => ({ ...r, sourceType: 'news' }))

      const results = [...taggedWebResults, ...taggedNewsResults]
      console.log(`📊 Query ${i + 1} returned ${webResults.length} web + ${newsResults.length} news = ${results.length} total results`)

      // Add unique results (avoid duplicates)
      results.forEach(result => {
        if (!allResults.some(r => r.url === result.url)) {
          allResults.push(result)
        }
      })
    } catch (error) {
      console.error(`Search ${i + 1} error:`, error)
      continue // Try next query
    }

    // Stop if we have enough good results
    if (allResults.length >= searchLimit * 2) {
      break
    }
  }

  console.log(`📊 Total unique results collected: ${allResults.length}`)

  try {
    // Step 3: Process and score results with advanced relevance scoring
    const processedResults = await processSearchResults(allResults, query, searchStrategy, context)

    // Step 4: If comprehensive mode, enrich top results with full content extraction
    let enrichedResults = processedResults
    if (searchMode === 'comprehensive' && processedResults.length > 0) {
      enrichedResults = await enrichTopResults(processedResults.slice(0, 5), firecrawlKey)
    }

    // Step 5: Generate intelligent summary (Perplexity-style)
    const summary = await generateIntelligentSummary(enrichedResults, query)

    // Step 6: Extract key insights and entities
    const insights = extractKeyInsights(enrichedResults, query, context)

    return {
      success: true,
      query: query,
      enhancedQueries: searchStrategy.queries.slice(0, 3),
      mode: searchMode,
      results: enrichedResults,
      summary: summary,
      insights: insights,
      totalResults: enrichedResults.length,
      organizationContext: context.orgContext ? {
        organization: context.orgContext.organizationName,
        competitors: context.orgContext.directCompetitors.slice(0, 5),
        industry: context.orgContext.industry
      } : null,
      timestamp: new Date().toISOString(),
      cached: false
    }
  } catch (error) {
    console.error('Processing error:', error)

    // Fallback to basic results if processing fails
    return {
      success: false,
      query: query,
      error: error.message,
      results: [],
      summary: `Search processing failed: ${error.message}`,
      timestamp: new Date().toISOString()
    }
  }
}

// Enhance query with temporal context and better keywords
async function enhanceQuery(query: string, context: any): Promise<string> {
  const queryLower = query.toLowerCase()

  // Detect query intent
  const intents = {
    latest: /latest|recent|new|breaking|today|announcement/i,
    regulation: /regulation|policy|law|compliance|rules|governance/i,
    technical: /bug|issue|problem|error|vulnerability|security/i,
    competitive: /competitor|rival|versus|comparison|alternative/i,
    financial: /earnings|revenue|profit|stock|investment|funding/i
  }

  let enhanced = query

  // Add temporal context for "latest" queries
  if (intents.latest.test(queryLower)) {
    enhanced += ' 2024 2025 latest news announcement'
  }

  // Add specific terms for regulation queries
  if (intents.regulation.test(queryLower)) {
    // For AI regulation specifically
    if (queryLower.includes('ai')) {
      enhanced += ' EU Act Biden executive order FTC safety guardrails'
    } else {
      enhanced += ' policy compliance legislation government'
    }
  }

  // For chatbot-specific queries
  if (queryLower.includes('chatbot')) {
    enhanced += ' conversational AI assistant hallucination accuracy issues concerns'
  }

  // Remove overly specific terms that might limit results
  enhanced = enhanced
    .replace(/meta superintelligence/gi, '')
    .replace(/superintelligence/gi, 'artificial intelligence AI')

  return enhanced
}

// Process and score search results with advanced relevance scoring
async function processSearchResults(
  rawResults: any[],
  query: string,
  searchStrategy: SearchStrategy,
  context: any
): Promise<any[]> {
  return rawResults
    .map(result => {
      const url = result.url || ''
      const markdown = result.markdown || ''
      const content = result.content || markdown

      // Clean and extract title
      const title = extractCleanTitle(markdown, url)

      // Extract description
      const description = extractDescription(markdown, content)

      // Use advanced relevance scoring from search-specialist expertise
      const relevanceScore = scoreRelevance(
        title,
        description,
        content,
        url,
        query,
        searchStrategy,
        result.sourceType // Pass source type for better scoring
      )

      // Extract metadata
      const source = extractSourceFromUrl(url)
      const publishDate = extractPublishDate(content)

      return {
        title,
        description,
        url,
        content: content.substring(0, 15000), // Increased from 2000 to 15000 chars to preserve more context
        source,
        sourceType: result.sourceType || 'web', // Include source type (web/news)
        publishDate,
        relevanceScore,
        quality: assessContentQuality(content, title),
        matchedQuery: searchStrategy.queries.find(q =>
          content.toLowerCase().includes(q.toLowerCase().split(' ')[0])
        )
      }
    })
    .filter(result => {
      // Filter out junk results with stricter criteria
      return result.title.length > 10 &&
             result.relevanceScore > 0.15 && // Slightly lower threshold for diverse results
             !isNavigationJunk(result.title) &&
             result.quality !== 'poor'
    })
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 20) // Keep top 20 results
}

// Enrich top results with detailed extraction
async function enrichTopResults(results: any[], firecrawlKey: string): Promise<any[]> {
  console.log(`🔬 Enriching top ${results.length} results with detailed extraction`)

  const enrichmentPromises = results.map(async (result) => {
    try {
      // Skip if we already have good content
      if (result.content && result.content.length > 500) {
        return result
      }

      // Scrape the URL for full content
      const scrapeResponse = await fetch(`${FIRECRAWL_BASE_URL}/scrape`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${firecrawlKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: result.url,
          formats: ['markdown'],
          onlyMainContent: true  // This is correct for scrape endpoint
        })
      })

      if (scrapeResponse.ok) {
        const scrapeData = await scrapeResponse.json()
        if (scrapeData.success && scrapeData.data) {
          return {
            ...result,
            content: scrapeData.data.markdown || result.content,
            enriched: true
          }
        }
      }
    } catch (error) {
      console.log(`⚠️ Failed to enrich ${result.url}: ${error.message}`)
    }

    return result
  })

  return Promise.all(enrichmentPromises)
}

// Generate intelligent Perplexity-style summary
async function generateIntelligentSummary(results: any[], query: string): Promise<string> {
  if (results.length === 0) {
    return `No relevant results found for "${query}". Try rephrasing your query or using different keywords.`
  }

  // Group results by key themes
  const themes = identifyThemes(results, query)

  // Build summary
  let summary = `Based on ${results.length} sources, here's what I found about "${query}":\n\n`

  // Add key findings
  const topResults = results.slice(0, 3)
  topResults.forEach((result, index) => {
    summary += `• ${result.title} (${result.source.name}): ${result.description.substring(0, 150)}...\n`
  })

  // Add theme summary if multiple themes detected
  if (themes.length > 1) {
    summary += `\nKey themes identified: ${themes.join(', ')}`
  }

  return summary
}

// Extract key insights from results
function extractKeyInsights(results: any[], query: string, context: any): any {
  const insights = {
    topSources: [],
    keyEntities: [],
    dateRange: null,
    themes: [],
    sentiment: 'neutral'
  }

  // Extract top sources
  const sourceCounts = {}
  results.forEach(r => {
    const source = r.source?.name || 'Unknown'
    sourceCounts[source] = (sourceCounts[source] || 0) + 1
  })
  insights.topSources = Object.entries(sourceCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([source]) => source)

  // Identify themes
  insights.themes = identifyThemes(results, query)

  // Extract date range
  const dates = results
    .map(r => r.publishDate)
    .filter(d => d)
    .sort()

  if (dates.length > 0) {
    insights.dateRange = {
      earliest: dates[0],
      latest: dates[dates.length - 1]
    }
  }

  return insights
}

// Helper functions

function extractCleanTitle(markdown: string, url: string): string {
  if (!markdown) {
    // Extract from URL as fallback
    try {
      const urlObj = new URL(url)
      const pathParts = urlObj.pathname.split('/').filter(p => p)
      if (pathParts.length > 0) {
        return pathParts[pathParts.length - 1]
          .replace(/-/g, ' ')
          .replace(/\.html?$/i, '')
          .split(' ')
          .map(w => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ')
      }
    } catch {}
    return 'Untitled'
  }

  // Try to find a proper title in markdown
  const lines = markdown.split('\n')

  for (const line of lines) {
    const trimmed = line.trim()

    // Skip navigation and UI elements
    if (isNavigationJunk(trimmed)) continue

    // Check for markdown headers
    const headerMatch = trimmed.match(/^#{1,3}\s+(.+)/)
    if (headerMatch && headerMatch[1].length > 10) {
      return cleanText(headerMatch[1])
    }

    // Check for lines that look like titles
    if (trimmed.length > 15 && trimmed.length < 200 && !trimmed.includes('|')) {
      const cleaned = cleanText(trimmed)
      if (cleaned.length > 10) {
        return cleaned
      }
    }
  }

  return 'Article'
}

function extractDescription(markdown: string, content: string): string {
  const text = markdown || content || ''

  // Find first substantial paragraph
  const paragraphs = text
    .split('\n')
    .map(p => p.trim())
    .filter(p => p.length > 50 && !isNavigationJunk(p))

  if (paragraphs.length > 0) {
    return cleanText(paragraphs[0]).substring(0, 200)
  }

  return 'No description available'
}

function assessContentQuality(content: string, title: string): string {
  if (!content) return 'poor'

  const wordCount = content.split(/\s+/).length
  const hasStructure = content.includes('\n\n') || content.includes('##')
  const titleQuality = title && title.length > 10 && !isNavigationJunk(title)

  if (wordCount > 200 && hasStructure && titleQuality) {
    return 'high'
  } else if (wordCount > 100 && titleQuality) {
    return 'medium'
  }

  return 'low'
}

function isNavigationJunk(text: string): boolean {
  const junkPatterns = [
    /^(menu|navigation|skip to|search|sign in|log in|subscribe|cookie|privacy)/i,
    /^(home|about|contact|terms|footer|header)/i,
    /^\[.*?\]$/,
    /^https?:\/\//,
    /^www\./
  ]

  return junkPatterns.some(pattern => pattern.test(text))
}

function cleanText(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Remove markdown links
    .replace(/[*_~`]/g, '') // Remove markdown formatting
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
}

function extractSourceFromUrl(url: string): any {
  try {
    const urlObj = new URL(url)
    const domain = urlObj.hostname.replace('www.', '')
    const parts = domain.split('.')
    const name = parts[0].charAt(0).toUpperCase() + parts[0].slice(1)

    return { name, domain }
  } catch {
    return { name: 'Unknown', domain: '' }
  }
}

function extractPublishDate(content: string): string | null {
  // Look for date patterns in content
  const datePatterns = [
    /(\d{4}-\d{2}-\d{2})/,
    /(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}/i,
    /(\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4})/i
  ]

  for (const pattern of datePatterns) {
    const match = content.match(pattern)
    if (match) {
      try {
        const date = new Date(match[0])
        if (!isNaN(date.getTime())) {
          return date.toISOString()
        }
      } catch {}
    }
  }

  // Check for relative dates
  if (/today|(\d+)\s*hours?\s*ago/i.test(content)) {
    return new Date().toISOString()
  }

  return null
}

function identifyThemes(results: any[], query: string): string[] {
  const themes = new Set<string>()

  // Common theme patterns
  const themePatterns = {
    'Regulation & Policy': /regulation|policy|law|compliance|government|legislation/i,
    'Technical Issues': /bug|error|problem|vulnerability|security|issue/i,
    'Business & Finance': /earnings|revenue|profit|funding|investment|acquisition/i,
    'Product Updates': /launch|release|update|feature|announcement/i,
    'Research & Development': /research|study|paper|finding|discovery/i,
    'Competition': /competitor|rival|versus|comparison|alternative/i
  }

  results.forEach(result => {
    const text = `${result.title} ${result.description}`.toLowerCase()

    for (const [theme, pattern] of Object.entries(themePatterns)) {
      if (pattern.test(text)) {
        themes.add(theme)
      }
    }
  })

  return Array.from(themes).slice(0, 3)
}