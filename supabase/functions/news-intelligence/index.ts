// News Intelligence MCP - Real news data with proper error handling
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400'
}

const NEWS_API_KEY = '44466831285e41dfa4c1fb4bf6f1a92f'

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204, 
      headers: corsHeaders 
    })
  }

  try {
    const { method, params } = await req.json()
    console.log(`News Intelligence: ${method} request received`)

    // Fetch real news data
    const organization = params?.organization?.name || 'technology'
    const industry = params?.organization?.industry || 'technology'
    const query = `${organization} OR ${industry}`

    // Simple NewsAPI call with proper error handling
    let articles = []
    try {
      const newsUrl = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=en&sortBy=publishedAt&pageSize=5&apiKey=${NEWS_API_KEY}`
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 2000) // 2 second timeout
      
      const response = await fetch(newsUrl, { signal: controller.signal })
      clearTimeout(timeoutId)
      
      if (response.ok) {
        const data = await response.json()
        articles = data.articles || []
      }
    } catch (error) {
      console.log('NewsAPI fetch failed:', error.message)
    }

    // Format the response
    const formattedNews = articles.slice(0, 3).map(article => ({
      title: article.title,
      description: article.description || '',
      url: article.url,
      source: article.source?.name || 'Unknown',
      publishedAt: article.publishedAt,
      relevance: 'high',
      category: 'industry_news'
    }))

    const responseData = {
      industryNews: formattedNews,
      breakingNews: formattedNews.slice(0, 1).map(n => ({ ...n, category: 'breaking_news', urgency: 'high' })),
      opportunities: [],
      totalArticles: formattedNews.length,
      totalBreaking: Math.min(1, formattedNews.length),
      totalOpportunities: 0,
      sources: ["NewsAPI"],
      timestamp: new Date().toISOString()
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: responseData,
        source: 'News Intelligence MCP',
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        }
      }
    )

  } catch (error) {
    console.error('News Intelligence error:', error)
    
    // Return error response
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error',
        service: 'News Intelligence MCP',
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        }
      }
    )
  }
})