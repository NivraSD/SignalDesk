import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

/**
 * POSITIVE COVERAGE SCRAPER
 *
 * Searches for positive coverage (awards, achievements, recognition, industry leadership)
 * using niv-fireplexity. Returns raw article data for compilation.
 *
 * Pattern: Similar to monitor-stage-1-fireplexity
 *
 * Flow:
 * 1. Generate positive coverage search queries
 * 2. Search with niv-fireplexity for each query
 * 3. Collect and deduplicate results
 * 4. Return raw articles for compiler
 */

interface ScraperRequest {
  organization_id: string
  organization_name: string
  recency_window?: string // '7days', '30days', '90days'
  max_results_per_query?: number
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const {
      organization_id,
      organization_name,
      recency_window = '2years', // Look back 2 years for positive coverage (we only take 5 anyway)
      max_results_per_query = 5
    }: ScraperRequest = await req.json()

    if (!organization_id || !organization_name) {
      throw new Error('organization_id and organization_name required')
    }

    console.log('🏆 Positive Coverage Scraper Starting:', {
      organization_name,
      recency_window,
      max_results_per_query
    })

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // STEP 1: Generate positive coverage search queries
    console.log('🔍 Step 1: Generating positive coverage queries...')
    const queries = generatePositiveCoverageQueries(organization_name)
    console.log(`   ✓ Generated ${queries.length} search queries`)

    // STEP 2: Search with niv-fireplexity (IN PARALLEL)
    console.log('🌐 Step 2: Searching with niv-fireplexity (parallel)...')

    const searchPromises = queries.map(async (query) => {
      try {
        console.log(`   🔍 Searching: "${query.query}"`)

        const searchResponse = await fetch(
          `${supabaseUrl}/functions/v1/niv-fireplexity`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              query: query.query,
              searchMode: 'quick', // Quick mode for faster results
              organizationId: organization_id,
              useCache: false
            })
          }
        )

        if (!searchResponse.ok) {
          console.error(`   ✗ Search failed for "${query.query}"`)
          return []
        }

        const searchData = await searchResponse.json()
        const results = searchData.results || []

        console.log(`   ✓ Found ${results.length} results for "${query.query}"`)

        // Tag results with query context
        results.forEach((result: any) => {
          result.search_query = query.query
          result.query_intent = query.intent
          result.query_type = query.type
        })

        return results.slice(0, max_results_per_query)

      } catch (error) {
        console.error(`   ✗ Error searching "${query.query}":`, error)
        return []
      }
    })

    const searchResults = await Promise.all(searchPromises)
    const allArticles = searchResults.flat()

    console.log(`   ✓ Total articles found: ${allArticles.length}`)

    // STEP 3: Deduplicate by URL
    console.log('🔍 Step 3: Deduplicating articles...')
    const uniqueArticles = deduplicateByUrl(allArticles)
    console.log(`   ✓ Deduplicated: ${allArticles.length} → ${uniqueArticles.length} unique articles`)

    // STEP 4: Filter by recency
    console.log('🕒 Step 4: Filtering by recency...')
    const recentArticles = filterByRecency(uniqueArticles, recency_window)
    console.log(`   ✓ Filtered: ${uniqueArticles.length} → ${recentArticles.length} articles within ${recency_window}`)

    // STEP 5: Limit to 5 most recent articles (for schema generation we don't need more)
    const limitedArticles = recentArticles.slice(0, 5)
    if (limitedArticles.length < recentArticles.length) {
      console.log(`   ✓ Limited to 5 most recent: ${recentArticles.length} → ${limitedArticles.length}`)
    }

    // STEP 6: Return for compilation
    const summary = {
      total_searches: queries.length,
      raw_articles_found: allArticles.length,
      unique_articles: uniqueArticles.length,
      recent_articles: recentArticles.length,
      final_articles: limitedArticles.length,
      recency_window,
      queries_executed: queries.map(q => q.query)
    }

    console.log('✅ Positive Coverage Scraper Complete:', summary)

    return new Response(
      JSON.stringify({
        success: true,
        articles: limitedArticles, // Return only 5 articles
        summary
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('❌ Positive Coverage Scraper Error:', error)
    return new Response(
      JSON.stringify({
        error: error.message,
        details: error.toString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

/**
 * Generate targeted positive coverage search queries
 */
function generatePositiveCoverageQueries(organizationName: string): Array<{
  query: string
  intent: string
  type: string
}> {
  return [
    {
      query: `"${organizationName}" awards won`,
      intent: 'awards',
      type: 'recognition'
    },
    {
      query: `"${organizationName}" achievements`,
      intent: 'achievements',
      type: 'accomplishment'
    },
    {
      query: `"${organizationName}" industry recognition`,
      intent: 'recognition',
      type: 'industry_leadership'
    },
    {
      query: `"${organizationName}" industry leader`,
      intent: 'leadership',
      type: 'positioning'
    },
    {
      query: `"${organizationName}" named best`,
      intent: 'ranking',
      type: 'recognition'
    },
    {
      query: `"${organizationName}" innovation award`,
      intent: 'innovation',
      type: 'recognition'
    }
  ]
}

/**
 * Deduplicate articles by URL
 */
function deduplicateByUrl(articles: any[]): any[] {
  const seen = new Set<string>()
  return articles.filter(article => {
    const url = article.url || article.link
    if (!url || seen.has(url)) {
      return false
    }
    seen.add(url)
    return true
  })
}

/**
 * Filter articles by recency window
 */
function filterByRecency(articles: any[], recencyWindow: string): any[] {
  const windowMap: Record<string, number> = {
    '7days': 7 * 24 * 60 * 60 * 1000,
    '30days': 30 * 24 * 60 * 60 * 1000,
    '90days': 90 * 24 * 60 * 60 * 1000,
    '180days': 180 * 24 * 60 * 60 * 1000,
    '1year': 365 * 24 * 60 * 60 * 1000,
    '2years': 730 * 24 * 60 * 60 * 1000
  }

  const windowMs = windowMap[recencyWindow] || windowMap['90days']
  const cutoffDate = new Date(Date.now() - windowMs)

  return articles.filter(article => {
    const publishDate = article.publishedAt || article.publishDate || article.date
    if (!publishDate) {
      return false // Exclude articles without dates
    }

    const articleDate = new Date(publishDate)
    return articleDate > cutoffDate
  })
}
