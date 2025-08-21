// News Intelligence MCP - Google News RSS + MasterSourceRegistry feeds
// Removed NewsAPI dependency due to free tier limitations
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { intelligenceCore } from "../_shared/IntelligenceCore.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400'
}

// Helper function for parallel API calls with timeout
async function fetchWithTimeout(url: string, options: any = {}, timeoutMs: number = 5000) {
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

// 1. Google News RSS - Primary news source (FREE & RELIABLE)
async function fetchGoogleNewsRSS(queries: string[]) {
  const allArticles = []
  
  // Process multiple queries in parallel
  const promises = queries.slice(0, 5).map(async (query) => {
    try {
      const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`
      const response = await fetchWithTimeout(rssUrl, {}, 3000) // 3 second timeout
      
      if (response.ok) {
        const xmlText = await response.text()
        
        // Parse RSS XML
        const items = xmlText.match(/<item>([\s\S]*?)<\/item>/gi) || []
        const articles = []
        
        for (const item of items.slice(0, 10)) { // 10 items per query
          const title = item.match(/<title>(.*?)<\/title>/)?.[1] || ''
          const link = item.match(/<link>(.*?)<\/link>/)?.[1] || ''
          const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || ''
          const source = item.match(/<source.*?>(.*?)<\/source>/)?.[1] || 'Google News'
          
          if (title && link) {
            articles.push({
              title: title.replace(/<!\[CDATA\[|\]\]>/g, '').replace(/&amp;/g, '&').replace(/&#39;/g, "'"),
              description: '',
              url: link,
              source: source.replace(/<!\[CDATA\[|\]\]>/g, ''),
              publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
              type: 'trending_news',
              query: query
            })
          }
        }
        
        return articles
      }
    } catch (error) {
      console.log(`Google News RSS error for "${query}": ${error.message}`)
    }
    
    return []
  })
  
  const results = await Promise.all(promises)
  results.forEach(articles => allArticles.push(...articles))
  
  return allArticles
}

// 2. Fetch RSS feeds from MasterSourceRegistry
async function fetchIndustryRSSFeeds(feedUrls: string[]) {
  const allArticles = []
  
  // Process feeds in parallel with timeout
  const promises = feedUrls.slice(0, 10).map(async (feedUrl) => {
    try {
      // Extract feed info
      const feedInfo = typeof feedUrl === 'string' ? { url: feedUrl, name: new URL(feedUrl).hostname } : feedUrl
      const response = await fetchWithTimeout(feedInfo.url || feedUrl, {}, 3000)
      
      if (response.ok) {
        const xmlText = await response.text()
        
        // Parse RSS/Atom XML
        const items = xmlText.match(/<item>([\s\S]*?)<\/item>/gi) || 
                     xmlText.match(/<entry>([\s\S]*?)<\/entry>/gi) || []
        const articles = []
        
        for (const item of items.slice(0, 5)) { // 5 items per feed
          const title = item.match(/<title.*?>(.*?)<\/title>/)?.[1] || ''
          const description = item.match(/<description>(.*?)<\/description>/)?.[1] || 
                            item.match(/<summary.*?>(.*?)<\/summary>/)?.[1] || ''
          const link = item.match(/<link.*?>(.*?)<\/link>/)?.[1] || 
                      item.match(/<link.*?href="(.*?)"/)?.[1] || ''
          const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || 
                         item.match(/<published>(.*?)<\/published>/)?.[1] || 
                         item.match(/<updated>(.*?)<\/updated>/)?.[1] || ''
          
          if (title && link) {
            articles.push({
              title: title.replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<[^>]*>/g, '').replace(/&amp;/g, '&'),
              description: description.replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<[^>]*>/g, '').substring(0, 300),
              url: link.replace(/<!\[CDATA\[|\]\]>/g, ''),
              source: feedInfo.name || new URL(feedInfo.url || feedUrl).hostname,
              publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
              type: 'industry_news',
              category: feedInfo.category || 'general'
            })
          }
        }
        
        return articles
      }
    } catch (error) {
      console.log(`RSS feed error for ${feedUrl}: ${error.message}`)
    }
    
    return []
  })
  
  const results = await Promise.all(promises)
  results.forEach(articles => allArticles.push(...articles))
  
  return allArticles
}

// 3. Reddit API - Tech/Industry discussions (Simple JSON API)
async function fetchRedditPosts(subreddits: string[], keywords: string[]) {
  const articles = []
  
  try {
    // Use relevant subreddits based on industry
    const relevantSubreddits = subreddits.length > 0 ? subreddits : 
      ['business', 'technology', 'finance', 'stocks', 'investing']
    
    for (const subreddit of relevantSubreddits.slice(0, 3)) {
      try {
        const url = `https://www.reddit.com/r/${subreddit}/hot.json?limit=10`
        const response = await fetchWithTimeout(url, {
          headers: { 'User-Agent': 'SignalDesk/1.0' }
        }, 2000)
        
        if (response.ok) {
          const data = await response.json()
          
          // Filter posts by keywords
          const relevantPosts = data.data.children.filter((post: any) => {
            const title = post.data.title.toLowerCase()
            const selftext = (post.data.selftext || '').toLowerCase()
            return keywords.some(keyword => 
              title.includes(keyword.toLowerCase()) || 
              selftext.includes(keyword.toLowerCase())
            )
          })
          
          for (const post of relevantPosts.slice(0, 3)) {
            articles.push({
              title: post.data.title,
              description: post.data.selftext?.substring(0, 200) || '',
              url: `https://reddit.com${post.data.permalink}`,
              source: `r/${subreddit}`,
              publishedAt: new Date(post.data.created_utc * 1000).toISOString(),
              type: 'social_discussion',
              score: post.data.score,
              comments: post.data.num_comments
            })
          }
        }
      } catch (error) {
        console.log(`Reddit error for r/${subreddit}: ${error.message}`)
      }
    }
  } catch (error) {
    console.log('Reddit API error:', error.message)
  }
  
  return articles
}

// Main aggregation function
async function gatherAllNews(params: any) {
  const organization = params?.organization || {}
  const orgName = organization.name || ''
  
  // Use IntelligenceCore to get unified configuration
  const config = await intelligenceCore.getOrganizationConfig(organization)
  console.log(`🔍 Using IntelligenceCore config:`)
  console.log(`   Industry: ${config.industry}`)
  console.log(`   Keywords: ${config.keywords.length}`)
  console.log(`   Competitors: ${config.competitors.length}`)
  console.log(`   RSS Feeds: ${config.sources.rss_feeds.length}`)
  
  // Build search queries for Google News
  const googleQueries = [
    orgName,
    `${orgName} news`,
    `${orgName} announcement`,
    ...config.keywords.slice(0, 3),
    ...config.competitors.slice(0, 3).map(c => `${c} ${config.industry}`)
  ].filter(Boolean)
  
  console.log(`📰 Google News queries: ${googleQueries.length}`)
  console.log(`📡 RSS feeds to fetch: ${config.sources.rss_feeds.length}`)
  
  // Determine relevant subreddits based on industry
  const industrySubreddits = {
    technology: ['technology', 'programming', 'artificial', 'MachineLearning'],
    finance: ['finance', 'investing', 'stocks', 'wallstreetbets', 'SecurityAnalysis'],
    healthcare: ['medicine', 'biotech', 'pharma', 'healthcare'],
    automotive: ['cars', 'electricvehicles', 'teslamotors', 'automotive'],
    energy: ['energy', 'renewable', 'oil', 'solar'],
    conglomerate: ['business', 'investing', 'stocks', 'japan'],
    default: ['business', 'technology', 'finance']
  }
  
  const subreddits = industrySubreddits[config.industry] || industrySubreddits.default
  
  // Fetch from all sources in parallel
  const [googleArticles, rssArticles, redditPosts] = await Promise.all([
    fetchGoogleNewsRSS(googleQueries),
    fetchIndustryRSSFeeds(config.sources.rss_feeds),
    fetchRedditPosts(subreddits, [orgName, ...config.keywords.slice(0, 5)])
  ])
  
  console.log(`✅ Gathered articles:`)
  console.log(`   Google News: ${googleArticles.length}`)
  console.log(`   RSS Feeds: ${rssArticles.length}`)
  console.log(`   Reddit: ${redditPosts.length}`)
  
  // Combine all articles
  const allArticles = [
    ...googleArticles,
    ...rssArticles,
    ...redditPosts
  ]
  
  // Deduplicate by title similarity
  const uniqueArticles = []
  const seenTitles = new Set()
  
  for (const article of allArticles) {
    const normalizedTitle = article.title.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 50)
    if (!seenTitles.has(normalizedTitle)) {
      seenTitles.add(normalizedTitle)
      uniqueArticles.push(article)
    }
  }
  
  // Sort by date (newest first)
  uniqueArticles.sort((a, b) => {
    const dateA = new Date(a.publishedAt).getTime()
    const dateB = new Date(b.publishedAt).getTime()
    return dateB - dateA
  })
  
  // Categorize articles
  const industryNews = uniqueArticles.filter(a => a.type === 'industry_news' || a.type === 'trending_news')
  const breakingNews = uniqueArticles.filter(a => {
    const hoursSincePublished = (Date.now() - new Date(a.publishedAt).getTime()) / (1000 * 60 * 60)
    return hoursSincePublished < 4 // Less than 4 hours old
  })
  const discussions = uniqueArticles.filter(a => a.type === 'social_discussion')
  
  // Identify competitor mentions
  const competitorActivity = []
  for (const competitor of config.competitors.slice(0, 10)) {
    const mentions = uniqueArticles.filter(article => 
      article.title?.includes(competitor) || 
      article.description?.includes(competitor)
    )
    if (mentions.length > 0) {
      competitorActivity.push({
        name: competitor,
        mentions: mentions.length,
        articles: mentions.slice(0, 3),
        lastSeen: mentions[0].publishedAt
      })
    }
  }
  
  // Identify opportunities (high-engagement or keyword-rich articles)
  const opportunities = uniqueArticles
    .filter(a => {
      const text = `${a.title} ${a.description}`.toLowerCase()
      const keywordMatches = config.keywords.filter(k => text.includes(k.toLowerCase())).length
      return keywordMatches >= 2 || a.score > 100 || a.comments > 50
    })
    .slice(0, 15)
    .map(a => ({
      ...a,
      opportunity_type: a.score > 100 ? 'trending_topic' : 'keyword_match',
      relevance_score: a.score || 0,
      suggested_action: 'Monitor for developments and consider strategic response'
    }))
  
  // Check for alerts
  const alertKeywords = ['crisis', 'lawsuit', 'breach', 'acquisition', 'merger', 'bankruptcy', 'investigation', 'recall', 'layoffs']
  const alerts = uniqueArticles
    .filter(article => {
      const text = `${article.title} ${article.description}`.toLowerCase()
      return alertKeywords.some(keyword => text.includes(keyword))
    })
    .map(article => ({
      type: 'news_alert',
      severity: 'high',
      title: article.title,
      source: article.source,
      url: article.url,
      timestamp: article.publishedAt,
      keywords_triggered: alertKeywords.filter(k => 
        `${article.title} ${article.description}`.toLowerCase().includes(k)
      )
    }))
  
  return {
    industryNews: industryNews.slice(0, 30),
    breakingNews: breakingNews.slice(0, 15),
    opportunities: opportunities,
    discussions: discussions.slice(0, 10),
    alerts: alerts.slice(0, 10),
    competitorActivity: competitorActivity,
    totalArticles: uniqueArticles.length,
    totalBreaking: breakingNews.length,
    totalOpportunities: opportunities.length,
    industry: config.industry,
    monitoredCompetitors: config.competitors.slice(0, 10),
    monitoredKeywords: config.keywords.slice(0, 15),
    sources: [
      googleArticles.length > 0 && 'Google News',
      rssArticles.length > 0 && 'Industry RSS Feeds',
      redditPosts.length > 0 && 'Reddit Discussions'
    ].filter(Boolean),
    rssFeedsUsed: config.sources.rss_feeds.length,
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
          alerts: breakingData.alerts,
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
          discussions: oppData.discussions,
          totalOpportunities: oppData.totalOpportunities,
          sources: oppData.sources,
          timestamp: oppData.timestamp
        }
        break
        
      case 'competitors':
        // Focus on competitor activity
        const compData = await gatherAllNews(params)
        data = {
          competitorActivity: compData.competitorActivity,
          industryNews: compData.industryNews.filter(a => 
            compData.competitors.some(c => a.title?.includes(c))
          ),
          monitoredCompetitors: compData.monitoredCompetitors,
          sources: compData.sources,
          timestamp: compData.timestamp
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