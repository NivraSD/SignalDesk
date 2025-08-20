// News Intelligence MCP - REAL multi-source news scanning
// Uses IntelligenceCore for unified intelligence gathering
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { intelligenceCore } from "../_shared/IntelligenceCore.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400'
}

// API Keys - using environment variables with fallbacks
const NEWS_API_KEY = Deno.env.get('NEWS_API_KEY') || '44466831285e41dfa4c1fb4bf6f1a92f'
const BING_API_KEY = Deno.env.get('BING_API_KEY') || 'YOUR_BING_KEY'

// Helper function for parallel API calls with timeout
async function fetchWithTimeout(url: string, options: any = {}, timeoutMs: number = 3000) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    })
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    throw error
  }
}

// 1. NewsAPI - Main news source
async function fetchNewsAPI(query: string, category: string = 'technology') {
  const articles = []
  
  try {
    // Try everything endpoint first
    const everythingUrl = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=en&sortBy=publishedAt&pageSize=10&apiKey=${NEWS_API_KEY}`
    const response = await fetchWithTimeout(everythingUrl)
    
    if (response.ok) {
      const data = await response.json()
      if (data.articles) {
        articles.push(...data.articles.map((article: any) => ({
          title: article.title,
          description: article.description,
          url: article.url,
          source: article.source?.name || 'NewsAPI',
          publishedAt: article.publishedAt,
          author: article.author,
          image: article.urlToImage,
          type: 'industry_news'
        })))
      }
    }
  } catch (error) {
    console.log('NewsAPI everything endpoint error:', error.message)
  }
  
  // Also try top headlines
  try {
    const headlinesUrl = `https://newsapi.org/v2/top-headlines?category=${category}&language=en&pageSize=5&apiKey=${NEWS_API_KEY}`
    const response = await fetchWithTimeout(headlinesUrl)
    
    if (response.ok) {
      const data = await response.json()
      if (data.articles) {
        articles.push(...data.articles.map((article: any) => ({
          title: article.title,
          description: article.description,
          url: article.url,
          source: article.source?.name || 'NewsAPI Headlines',
          publishedAt: article.publishedAt,
          author: article.author,
          image: article.urlToImage,
          type: 'breaking_news'
        })))
      }
    }
  } catch (error) {
    console.log('NewsAPI headlines endpoint error:', error.message)
  }
  
  return articles
}

// 2. Google News RSS - Free and reliable
async function fetchGoogleNewsRSS(query: string) {
  const articles = []
  
  try {
    const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`
    const response = await fetchWithTimeout(rssUrl)
    
    if (response.ok) {
      const xmlText = await response.text()
      
      // Parse RSS XML
      const items = xmlText.match(/<item>([\s\S]*?)<\/item>/gi) || []
      
      for (const item of items.slice(0, 10)) {
        const title = item.match(/<title>(.*?)<\/title>/)?.[1] || ''
        const link = item.match(/<link>(.*?)<\/link>/)?.[1] || ''
        const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || ''
        const description = item.match(/<description>(.*?)<\/description>/)?.[1] || ''
        
        if (title && link) {
          articles.push({
            title: title.replace(/<!\[CDATA\[|\]\]>/g, ''),
            description: description.replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<[^>]*>/g, ''),
            url: link,
            source: 'Google News',
            publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
            type: 'trending_news'
          })
        }
      }
    }
  } catch (error) {
    console.log('Google News RSS error:', error.message)
  }
  
  return articles
}

// 3. Bing News Search (if API key available)
async function fetchBingNews(query: string) {
  const articles = []
  
  if (!BING_API_KEY || BING_API_KEY === 'YOUR_BING_KEY') {
    return articles // Skip if no valid key
  }
  
  try {
    const url = `https://api.bing.microsoft.com/v7.0/news/search?q=${encodeURIComponent(query)}&count=10&mkt=en-US`
    const response = await fetchWithTimeout(url, {
      headers: {
        'Ocp-Apim-Subscription-Key': BING_API_KEY
      }
    })
    
    if (response.ok) {
      const data = await response.json()
      if (data.value) {
        articles.push(...data.value.map((article: any) => ({
          title: article.name,
          description: article.description,
          url: article.url,
          source: article.provider?.[0]?.name || 'Bing News',
          publishedAt: article.datePublished,
          image: article.image?.thumbnail?.contentUrl,
          type: 'search_result'
        })))
      }
    }
  } catch (error) {
    console.log('Bing News error:', error.message)
  }
  
  return articles
}

// 4. Reddit - For trend detection
async function fetchRedditTrends(query: string) {
  const articles = []
  
  try {
    const subreddits = ['technology', 'business', 'news']
    
    for (const subreddit of subreddits) {
      try {
        const url = `https://www.reddit.com/r/${subreddit}/search.json?q=${encodeURIComponent(query)}&sort=new&limit=5&restrict_sr=on`
        const response = await fetchWithTimeout(url, {
          headers: {
            'User-Agent': 'SignalDesk/1.0'
          }
        }, 2000)
        
        if (response.ok) {
          const data = await response.json()
          if (data.data?.children) {
            articles.push(...data.data.children.map((post: any) => ({
              title: post.data.title,
              description: post.data.selftext?.slice(0, 200) || '',
              url: `https://reddit.com${post.data.permalink}`,
              source: `Reddit r/${subreddit}`,
              publishedAt: new Date(post.data.created_utc * 1000).toISOString(),
              score: post.data.score,
              comments: post.data.num_comments,
              type: 'social_trend'
            })))
          }
        }
      } catch (error) {
        console.log(`Reddit r/${subreddit} error:`, error.message)
      }
    }
  } catch (error) {
    console.log('Reddit API error:', error.message)
  }
  
  return articles
}

// 5. Hacker News - Tech trends
async function fetchHackerNews(query: string) {
  const articles = []
  
  try {
    const searchUrl = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(query)}&tags=story&hitsPerPage=10`
    const response = await fetchWithTimeout(searchUrl, {}, 2000)
    
    if (response.ok) {
      const data = await response.json()
      if (data.hits) {
        articles.push(...data.hits.map((hit: any) => ({
          title: hit.title,
          description: hit.story_text?.slice(0, 200) || '',
          url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
          source: 'Hacker News',
          publishedAt: hit.created_at,
          points: hit.points,
          comments: hit.num_comments,
          type: 'tech_trend'
        })))
      }
    }
  } catch (error) {
    console.log('Hacker News error:', error.message)
  }
  
  return articles
}

// Main aggregation function
async function gatherAllNews(params: any) {
  const organization = params?.organization || {}
  const orgName = organization.name || ''
  
  // Use IntelligenceCore to get unified configuration
  const config = await intelligenceCore.getOrganizationConfig(organization)
  console.log(`Using IntelligenceCore config: ${config.industry}, ${config.keywords.length} keywords`)
  
  // Gather intelligence from IntelligenceCore sources (RSS feeds)
  const coreIntelligence = await intelligenceCore.gatherIntelligence(config)
  
  // Build enhanced search query using IntelligenceCore config
  const searchTerms = [
    orgName,
    ...config.keywords.slice(0, 5),
    ...config.competitors.slice(0, 3)
  ].filter(Boolean)
  const query = searchTerms.join(' OR ')
  
  console.log(`Enhanced news query: ${query}`)
  
  // Fetch from all sources in parallel
  const [newsApiArticles, googleArticles, bingArticles, redditArticles, hnArticles] = await Promise.all([
    fetchNewsAPI(query, config.industry),
    fetchGoogleNewsRSS(query),
    fetchBingNews(query),
    fetchRedditTrends(query),
    fetchHackerNews(query)
  ])
  
  // Combine and deduplicate - include IntelligenceCore news
  const allArticles = [
    ...coreIntelligence.news || [],
    ...newsApiArticles,
    ...googleArticles,
    ...bingArticles,
    ...redditArticles,
    ...hnArticles
  ]
  
  // Sort by date
  allArticles.sort((a, b) => {
    const dateA = new Date(a.publishedAt).getTime()
    const dateB = new Date(b.publishedAt).getTime()
    return dateB - dateA // Newest first
  })
  
  // Categorize articles
  const industryNews = allArticles.filter(a => a.type === 'industry_news' || !a.type)
  const breakingNews = allArticles.filter(a => a.type === 'breaking_news')
  const trends = allArticles.filter(a => a.type === 'social_trend' || a.type === 'tech_trend')
  
  // Combine opportunities from IntelligenceCore and our own detection
  const opportunities = [
    ...coreIntelligence.opportunities || [],
    ...allArticles
      .filter(a => a.score > 100 || a.comments > 50 || a.points > 100)
      .map(a => ({
        ...a,
        opportunity_type: 'trending_topic',
        suggested_action: 'Consider creating content or commentary on this trending topic'
      }))
  ]
  
  return {
    industryNews: industryNews.slice(0, 20),
    breakingNews: breakingNews.slice(0, 10),
    opportunities: opportunities.slice(0, 15),
    trends: trends.slice(0, 15),
    alerts: coreIntelligence.alerts || [],
    competitorActivity: coreIntelligence.competitors || [],
    totalArticles: allArticles.length,
    totalBreaking: breakingNews.length,
    totalOpportunities: opportunities.length,
    industry: config.industry,
    monitoredCompetitors: config.competitors.slice(0, 10),
    monitoredKeywords: config.keywords.slice(0, 10),
    sources: [
      coreIntelligence.news?.length > 0 && 'Industry RSS Feeds',
      newsApiArticles.length > 0 && 'NewsAPI',
      googleArticles.length > 0 && 'Google News',
      bingArticles.length > 0 && 'Bing News',
      redditArticles.length > 0 && 'Reddit',
      hnArticles.length > 0 && 'Hacker News'
    ].filter(Boolean),
    timestamp: new Date().toISOString()
  }
}

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
    console.log(`📰 News Intelligence: ${method} request`)

    let data = {}

    switch (method) {
      case 'gather':
      case 'industry':
      case 'analyze':
      default:
        // Full news gathering from all sources
        data = await gatherAllNews(params)
        break
        
      case 'breaking':
        // Focus on breaking news
        const breakingData = await gatherAllNews(params)
        data = {
          breakingNews: breakingData.breakingNews,
          totalBreaking: breakingData.totalBreaking,
          sources: breakingData.sources,
          timestamp: breakingData.timestamp
        }
        break
        
      case 'opportunities':
        // Focus on opportunities
        const oppData = await gatherAllNews(params)
        data = {
          opportunities: oppData.opportunities,
          trends: oppData.trends,
          totalOpportunities: oppData.totalOpportunities,
          sources: oppData.sources,
          timestamp: oppData.timestamp
        }
        break
    }

    return new Response(
      JSON.stringify({
        success: true,
        data,
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
    console.error('❌ News Intelligence error:', error)
    
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