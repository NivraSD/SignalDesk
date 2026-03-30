/**
 * LP Simple Search - Bare-bones web search for LP profile building
 *
 * No organization context, no query variations, no categories.
 * Just: query in → results out.
 *
 * Uses Firecrawl search API directly.
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { corsHeaders, jsonResponse, errorResponse } from '../_shared/cors.ts'

const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY') || 'fc-3048810124b640eb99293880a4ab25d0'

interface SearchRequest {
  query: string
  limit?: number
  timeframe?: string // '7d', '30d', '90d', '365d'
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  try {
    const { query, limit = 8, timeframe = '90d' }: SearchRequest = await req.json()

    if (!query) {
      return errorResponse('query is required', 400)
    }

    console.log(`🔍 LP Simple Search: "${query.substring(0, 50)}..." (limit: ${limit})`)

    // Map timeframe to Firecrawl tbs format
    const tbsMap: Record<string, string> = {
      '24h': 'qdr:d',
      '7d': 'qdr:w',
      '30d': 'qdr:m',
      '90d': 'qdr:m3',
      '365d': 'qdr:y'
    }

    const response = await fetch('https://api.firecrawl.dev/v2/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query,
        sources: ['web', 'news'],
        limit,
        tbs: tbsMap[timeframe] || 'qdr:m3',
        scrapeOptions: {
          formats: ['markdown'],
          onlyMainContent: true
        }
      })
    })

    if (!response.ok) {
      const text = await response.text()
      console.error(`❌ Firecrawl error ${response.status}: ${text.substring(0, 200)}`)
      return errorResponse(`Search failed: ${response.status}`, 500)
    }

    const data = await response.json()

    // Extract results from multi-source response
    const webResults = data.data?.web || []
    const newsResults = data.data?.news || []
    const allResults = [...webResults, ...newsResults]

    // Simplify to what we need
    const results = allResults.slice(0, limit).map((r: any) => ({
      title: r.title || '',
      url: r.url || '',
      snippet: r.description || r.markdown?.substring(0, 300) || '',
      date: r.publishedDate || r.date || null,
      source: r.sourceType || 'web'
    }))

    console.log(`✅ Found ${results.length} results`)

    return jsonResponse({
      success: true,
      results,
      query,
      count: results.length
    })

  } catch (err: any) {
    console.error('❌ LP Simple Search error:', err.message)
    return errorResponse(err.message, 500)
  }
})
