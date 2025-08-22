// Google Intelligence Edge Function
// Uses Google Custom Search API for comprehensive web intelligence

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

const GOOGLE_API_KEY = Deno.env.get('GOOGLE_API_KEY')
const GOOGLE_CX = Deno.env.get('GOOGLE_SEARCH_ENGINE_ID') || 'a4e6b8c4a4e6b8c4a'

// Search Google for recent content
async function searchGoogle(query: string, dateRestrict = 'w1') { // w1 = past week
  try {
    // Google Custom Search API
    const url = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(query)}&key=${GOOGLE_API_KEY}&cx=${GOOGLE_CX}&dateRestrict=${dateRestrict}&num=10`
    
    const response = await fetch(url)
    
    if (!response.ok) {
      console.error(`Google API error: ${response.status}`)
      return []
    }
    
    const data = await response.json()
    
    if (!data.items) return []
    
    return data.items.map((item: any) => ({
      title: item.title,
      url: item.link,
      snippet: item.snippet,
      source: new URL(item.link).hostname,
      publishedAt: item.pagemap?.metatags?.[0]?.['article:published_time'] || new Date().toISOString(),
      type: determineContentType(item)
    }))
  } catch (error) {
    console.error('Google search error:', error)
    return []
  }
}

// Determine content type from Google result
function determineContentType(item: any): string {
  const url = item.link.toLowerCase()
  const title = item.title.toLowerCase()
  
  if (url.includes('news') || url.includes('reuters') || url.includes('bloomberg')) return 'news'
  if (url.includes('blog') || url.includes('medium')) return 'blog'
  if (url.includes('linkedin')) return 'professional'
  if (url.includes('youtube') || url.includes('video')) return 'video'
  if (title.includes('pdf')) return 'document'
  
  return 'web'
}

// Main gather function
async function gatherGoogleIntelligence(params: any) {
  const { organization } = params
  const keywords = organization.keywords || [organization.name]
  
  console.log(`🔍 Gathering Google intelligence for ${organization.name}`)
  
  // Build multiple search queries for comprehensive coverage
  const searches = [
    `"${organization.name}" news`,
    `"${organization.name}" announcement`,
    ...organization.competitors?.slice(0, 2).map(c => `"${c}" vs "${organization.name}"`) || []
  ]
  
  const allResults = []
  
  for (const searchQuery of searches) {
    const results = await searchGoogle(searchQuery)
    allResults.push(...results)
  }
  
  // Deduplicate by URL
  const uniqueResults = Array.from(
    new Map(allResults.map(item => [item.url, item])).values()
  )
  
  // Group by content type
  const contentTypes = {}
  for (const result of uniqueResults) {
    if (!contentTypes[result.type]) contentTypes[result.type] = []
    contentTypes[result.type].push(result)
  }
  
  return {
    success: true,
    data: {
      results: uniqueResults,
      byType: contentTypes,
      totalResults: uniqueResults.length,
      sources: [...new Set(uniqueResults.map(r => r.source))],
      timeframe: 'last_7_days',
      queries: searches
    },
    source: 'google-intelligence',
    timestamp: new Date().toISOString()
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  try {
    const { method, params } = await req.json()
    
    console.log(`🔍 Google Intelligence: ${method} request`)
    
    let result
    switch (method) {
      case 'gather':
        result = await gatherGoogleIntelligence(params)
        break
      default:
        throw new Error(`Unknown method: ${method}`)
    }
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Google Intelligence error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        source: 'google-intelligence'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  }
})