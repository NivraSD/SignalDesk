// Source Registry - RSS Feed Aggregator for Real-Time Intelligence
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"

// RSS Feed Parser
async function parseRSSFeed(url: string) {
  try {
    const response = await fetch(url)
    if (!response.ok) return []
    
    const text = await response.text()
    const items = []
    
    // Simple RSS parsing - extract items
    const itemMatches = text.matchAll(/<item>([\s\S]*?)<\/item>/gi)
    for (const match of itemMatches) {
      const itemContent = match[1]
      
      const title = itemContent.match(/<title><!?\[CDATA\[(.*?)\]\]>|<title>(.*?)<\/title>/)?.[1] || 
                   itemContent.match(/<title>(.*?)<\/title>/)?.[1] || ''
      
      const description = itemContent.match(/<description><!?\[CDATA\[(.*?)\]\]>|<description>(.*?)<\/description>/)?.[1] ||
                         itemContent.match(/<description>(.*?)<\/description>/)?.[1] || ''
      
      const link = itemContent.match(/<link>(.*?)<\/link>/)?.[1] || ''
      const pubDate = itemContent.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || ''
      
      if (title && link) {
        items.push({
          title: title.replace(/<!\[CDATA\[|\]\]>/g, '').trim(),
          description: description.replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<[^>]*>/g, '').trim(),
          url: link.trim(),
          published: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
          source: new URL(url).hostname
        })
      }
    }
    
    return items.slice(0, 5) // Return top 5 items per feed
  } catch (error) {
    console.error(`Failed to parse RSS feed ${url}:`, error)
    return []
  }
}

// Industry-specific RSS feeds (subset of MasterSourceRegistry)
const RSS_FEEDS = {
  technology: [
    'https://feeds.arstechnica.com/arstechnica/index',
    'https://www.wired.com/feed/rss',
    'https://feeds.feedburner.com/TechCrunch/',
    'https://www.theverge.com/rss/index.xml',
    'https://www.techmeme.com/feed.xml'
  ],
  business: [
    'https://feeds.bloomberg.com/markets/news.rss',
    'https://feeds.a.dj.com/rss/RSSMarketsMain.xml',
    'https://fortune.com/feed/',
    'https://www.forbes.com/real-time/feed2/',
    'https://www.businessinsider.com/rss'
  ],
  ai: [
    'https://www.artificialintelligence-news.com/feed/',
    'https://feeds.feedburner.com/venturebeat/SZYF',
    'https://www.marktechpost.com/feed/',
    'https://www.unite.ai/feed/'
  ],
  marketing: [
    'https://feeds.feedburner.com/moz/uJxy',
    'https://contentmarketinginstitute.com/feed/',
    'https://blog.hubspot.com/marketing/rss.xml',
    'https://feeds.feedburner.com/copyblogger'
  ],
  finance: [
    'https://www.ft.com/?format=rss',
    'https://feeds.content.dowjones.io/public/rss/mw_topstories',
    'https://www.cnbc.com/id/100003114/device/rss/rss.html',
    'https://feeds.bloomberg.com/markets/news.rss'
  ]
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // Allow public access without auth for RSS feeds
  try {
    const { searchParams } = new URL(req.url)
    const industry = searchParams.get('industry') || 'technology'
    const query = searchParams.get('query') || ''
    const limit = parseInt(searchParams.get('limit') || '20')
    
    console.log(`📡 Fetching RSS feeds for industry: ${industry}, query: ${query}`)
    
    // Get relevant feeds for the industry
    const feeds = RSS_FEEDS[industry.toLowerCase()] || RSS_FEEDS.technology
    
    // Fetch all feeds in parallel
    const feedPromises = feeds.map(feed => parseRSSFeed(feed))
    const allResults = await Promise.all(feedPromises)
    
    // Flatten and combine all results
    let articles = allResults.flat()
    
    // Filter by query if provided
    if (query) {
      const queryLower = query.toLowerCase()
      articles = articles.filter(article => 
        article.title.toLowerCase().includes(queryLower) ||
        article.description.toLowerCase().includes(queryLower)
      )
    }
    
    // Sort by date (newest first)
    articles.sort((a, b) => new Date(b.published).getTime() - new Date(a.published).getTime())
    
    // Limit results
    articles = articles.slice(0, limit)
    
    console.log(`✅ Returning ${articles.length} RSS articles`)
    
    return new Response(
      JSON.stringify({
        success: true,
        industry,
        query,
        count: articles.length,
        articles
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    )
  } catch (error) {
    console.error('Source Registry error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    )
  }
})