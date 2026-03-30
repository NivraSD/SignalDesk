import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

console.log("NIV Fireplexity function starting...")

// IMPORTANT: Add Firecrawl API key here or in Supabase secrets
const FIRECRAWL_API_KEY = 'fc-3048810124b640eb99293880a4ab25d0'

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { query, context = {}, useCache = true, module = 'general', timeWindow = '48h' } = await req.json()

    if (!query) {
      return new Response(
        JSON.stringify({ error: 'Query is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Generate cache key with time window
    const cacheKey = await generateCacheKey(query, module, timeWindow)

    // Check cache first (but only if cache is recent enough)
    if (useCache && timeWindow !== 'realtime') {
      const cached = await getCachedResult(supabase, cacheKey, timeWindow)
      if (cached) {
        console.log('🎯 Returning cached result for:', query)
        return new Response(
          JSON.stringify({
            ...cached,
            cached: true,
            cacheAge: getAgeInMinutes(cached.timestamp)
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Perform time-filtered search
    const searchResult = await performTimeFilteredSearch(query, context, timeWindow)

    // Apply relevance filtering if we have a profile
    if (context.profile) {
      searchResult.articles = applyRelevanceFiltering(searchResult.articles || [], context.profile)
    }

    // Cache the result
    if (useCache && searchResult) {
      await cacheResult(supabase, cacheKey, searchResult)
    }

    // Track usage
    await trackUsage(supabase, {
      query,
      module,
      strategy: 'time_filtered',
      cost: 0.002,
      timestamp: new Date().toISOString()
    })

    return new Response(
      JSON.stringify({
        ...searchResult,
        cached: false,
        timeWindow
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in NIV Fireplexity:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

// Perform time-filtered search
async function performTimeFilteredSearch(query: string, context: any, timeWindow: string) {
  const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY') || FIRECRAWL_API_KEY

  if (!firecrawlKey) {
    console.log('⚠️ No Firecrawl API key found')
    return { articles: [], summary: 'No search API configured' }
  }

  // Add time-specific keywords to ensure recent results
  const timeKeywords = {
    '24h': 'today latest breaking news',
    '48h': 'latest news today yesterday recent',
    '7d': 'this week latest recent news',
    'realtime': 'breaking now today urgent latest'
  }

  const enhancedQuery = `${query} ${timeKeywords[timeWindow] || timeKeywords['48h']}`

  console.log(`🔍 Searching with time window ${timeWindow}: "${enhancedQuery}"`)

  try {
    // Try Firecrawl v0 which has better response format
    const response = await fetch('https://api.firecrawl.dev/v0/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: enhancedQuery,
        pageOptions: {
          fetchPageContent: true
        },
        searchOptions: {
          limit: 20 // Get more results to filter
        }
      })
    })

    if (!response.ok) {
      console.log('Firecrawl error:', response.statusText)
      return { articles: [], summary: 'Search failed' }
    }

    const data = await response.json()
    const results = data.data || []

    // Process and clean results
    const articles = results.map((r: any) => ({
      title: cleanTitle(r.title || r.markdown),
      description: cleanDescription(r.description || r.snippet || r.markdown),
      url: r.url || '',
      content: r.markdown || r.content || '',
      publishedAt: extractDate(r, timeWindow) || new Date().toISOString(),
      source: extractSource(r.url)
    }))

    // Filter by actual time window
    const filteredArticles = filterByTimeWindow(articles, timeWindow)

    return {
      articles: filteredArticles,
      summary: `Found ${filteredArticles.length} articles in the last ${timeWindow}`,
      totalResults: filteredArticles.length,
      timestamp: new Date().toISOString()
    }

  } catch (error) {
    console.error('Search error:', error)
    return { articles: [], summary: 'Search error occurred' }
  }
}

// Clean up titles from markdown
function cleanTitle(text: string): string {
  if (!text) return ''

  // Remove markdown formatting
  let title = text.replace(/^#+\s*/, '') // Remove headers
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Remove links
    .replace(/^[\s\-\*]+/, '') // Remove bullets
    .replace(/^\s*Skip to.*/i, '') // Remove navigation
    .replace(/^\s*\[.*?\]\s*/, '') // Remove bracketed text at start
    .split('\n')[0] // Take first line only
    .trim()

  // If still no good title, extract from URL or use first sentence
  if (!title || title.length < 10 || title.match(/^(https?:|www\.|\/)/)) {
    const lines = text.split('\n').filter(l => l.trim().length > 20)
    title = lines[0]?.substring(0, 100) || 'Article'
  }

  return title.substring(0, 150)
}

// Clean description
function cleanDescription(text: string): string {
  if (!text) return ''

  let desc = text.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
    .replace(/^#+\s*/, '')
    .replace(/^\s*Skip to.*/i, '')
    .split('\n')
    .filter(l => l.trim().length > 20)
    .join(' ')
    .substring(0, 300)
    .trim()

  return desc || 'No description available'
}

// Extract date from content
function extractDate(result: any, timeWindow: string): string {
  const now = new Date()

  // Check for explicit date fields
  if (result.publishedDate || result.date || result.published_at) {
    return result.publishedDate || result.date || result.published_at
  }

  // Try to extract from content
  const content = (result.markdown || result.content || '').toLowerCase()

  if (content.includes('today') || content.includes('breaking')) {
    return now.toISOString()
  }

  if (content.includes('yesterday')) {
    return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
  }

  const hoursMatch = content.match(/(\d+)\s*hours?\s*ago/)
  if (hoursMatch) {
    const hoursAgo = parseInt(hoursMatch[1])
    return new Date(now.getTime() - hoursAgo * 60 * 60 * 1000).toISOString()
  }

  // Default based on time window
  const defaults = {
    '24h': now,
    '48h': new Date(now.getTime() - 24 * 60 * 60 * 1000),
    '7d': new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
    'realtime': now
  }

  return (defaults[timeWindow] || now).toISOString()
}

// Extract source from URL
function extractSource(url: string): any {
  if (!url) return { name: 'Unknown' }

  try {
    const domain = new URL(url).hostname.replace('www.', '')
    const sourceName = domain.split('.')[0]
    return {
      name: sourceName.charAt(0).toUpperCase() + sourceName.slice(1),
      domain
    }
  } catch {
    return { name: 'Unknown' }
  }
}

// Filter articles by time window
function filterByTimeWindow(articles: any[], timeWindow: string): any[] {
  const now = new Date()
  const cutoffs = {
    '24h': 24 * 60 * 60 * 1000,
    '48h': 48 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    'realtime': 6 * 60 * 60 * 1000 // Last 6 hours for realtime
  }

  const cutoffTime = cutoffs[timeWindow] || cutoffs['48h']

  return articles.filter(article => {
    if (!article.publishedAt) return true // Include if no date

    const articleTime = new Date(article.publishedAt).getTime()
    const age = now.getTime() - articleTime

    return age <= cutoffTime
  })
}

// Apply relevance filtering
function applyRelevanceFiltering(articles: any[], profile: any): any[] {
  const scoredArticles = articles.map(article => {
    const text = `${article.title || ''} ${article.description || ''} ${article.content || ''}`.toLowerCase()
    let score = 0
    const factors = []

    // Check for competitors
    const competitors = [
      ...(profile.competition?.direct_competitors || []),
      ...(profile.competition?.indirect_competitors || [])
    ]

    const competitorMentions = competitors.filter(c =>
      c && text.includes(c.toLowerCase())
    )

    if (competitorMentions.length > 0) {
      score += 40 * Math.min(competitorMentions.length, 3)
      factors.push(`COMPETITORS:${competitorMentions.slice(0, 3).join(',')}`)
    }

    // Check for keywords
    const keywords = profile.keywords || []
    const keywordMatches = keywords.filter(k =>
      k && text.includes(k.toLowerCase())
    )

    score += keywordMatches.length * 10
    if (keywordMatches.length > 0) {
      factors.push(`KEYWORDS:${keywordMatches.length}`)
    }

    // Check for action signals
    const actionSignals = [
      'launch', 'announce', 'release', 'funding', 'partnership',
      'acquisition', 'lawsuit', 'regulation', 'breakthrough'
    ]

    const actionMatches = actionSignals.filter(s => text.includes(s))
    score += actionMatches.length * 15
    if (actionMatches.length > 0) {
      factors.push(`ACTIONS:${actionMatches.length}`)
    }

    // Time bonus for very recent
    const now = new Date()
    const articleAge = (now.getTime() - new Date(article.publishedAt).getTime()) / (1000 * 60 * 60)

    if (articleAge < 6) {
      score += 25
      factors.push('BREAKING')
    } else if (articleAge < 24) {
      score += 15
      factors.push('RECENT')
    }

    return {
      ...article,
      relevance_score: Math.min(score, 100),
      relevance_factors: factors
    }
  })

  // Filter by threshold and sort
  return scoredArticles
    .filter(a => a.relevance_score >= 30)
    .sort((a, b) => b.relevance_score - a.relevance_score)
}

// Helper functions (keep existing ones)
async function generateCacheKey(query: string, module: string, timeWindow: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(`${query}-${module}-${timeWindow}`)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

async function getCachedResult(supabase: any, cacheKey: string, timeWindow: string) {
  const { data, error } = await supabase
    .from('fireplexity_cache')
    .select('*')
    .eq('cache_key', cacheKey)
    .single()

  if (error || !data) return null

  // Shorter cache for realtime, longer for historical
  const cacheHours = {
    'realtime': 0.5, // 30 minutes
    '24h': 1,        // 1 hour
    '48h': 2,        // 2 hours
    '7d': 6          // 6 hours
  }

  const maxAge = cacheHours[timeWindow] || 1
  const cacheExpiry = new Date(data.created_at).getTime() + (maxAge * 60 * 60 * 1000)

  if (Date.now() > cacheExpiry) {
    await supabase.from('fireplexity_cache').delete().eq('cache_key', cacheKey)
    return null
  }

  return data.result
}

async function cacheResult(supabase: any, cacheKey: string, result: any) {
  await supabase
    .from('fireplexity_cache')
    .upsert({
      cache_key: cacheKey,
      result,
      created_at: new Date().toISOString()
    })
}

async function trackUsage(supabase: any, usage: any) {
  try {
    await supabase
      .from('fireplexity_usage')
      .insert(usage)
  } catch (e) {
    console.log('Usage tracking failed:', e)
  }
}

function getAgeInMinutes(timestamp: string): number {
  return Math.floor((Date.now() - new Date(timestamp).getTime()) / 60000)
}