// News Intelligence MCP - Real NewsAPI and Google News Integration
// Provides actual news data instead of fallback responses

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NewsRequest {
  method: string
  params: {
    organization?: {
      name: string
      industry?: string
    }
    keywords?: string[]
    stakeholder?: string
  }
}

const NEWS_API_KEY = Deno.env.get('NEWS_API_KEY')
const GOOGLE_API_KEY = Deno.env.get('GOOGLE_API_KEY')

async function callNewsAPI(endpoint: string, params: Record<string, string>) {
  if (!NEWS_API_KEY) {
    throw new Error('NewsAPI key not configured')
  }

  const url = new URL(`https://newsapi.org/v2${endpoint}`)
  url.searchParams.append('apiKey', NEWS_API_KEY)
  
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value)
  })

  const response = await fetch(url.toString())

  if (!response.ok) {
    throw new Error(`NewsAPI error: ${response.status} ${response.statusText}`)
  }

  return await response.json()
}

async function callGoogleNewsAPI(query: string) {
  if (!GOOGLE_API_KEY) {
    throw new Error('Google API key not configured')
  }

  const url = new URL('https://www.googleapis.com/customsearch/v1')
  url.searchParams.append('key', GOOGLE_API_KEY)
  url.searchParams.append('cx', '017576662512468239146:omuauf_lfve') // News search engine ID
  url.searchParams.append('q', query)
  url.searchParams.append('num', '10')
  url.searchParams.append('sort', 'date')

  const response = await fetch(url.toString())

  if (!response.ok) {
    throw new Error(`Google News API error: ${response.status} ${response.statusText}`)
  }

  return await response.json()
}

async function parseRSSFeed(url: string) {
  try {
    const response = await fetch(url)
    if (!response.ok) throw new Error(`RSS fetch failed: ${response.status}`)
    
    const xmlText = await response.text()
    
    // Simple XML parsing for RSS (avoiding DOMParser dependency)
    const feedItems = []
    const itemMatches = xmlText.match(/<item[\s\S]*?<\/item>/gi) || []
    
    for (let i = 0; i < Math.min(itemMatches.length, 10); i++) {
      const itemXml = itemMatches[i]
      
      const titleMatch = itemXml.match(/<title(?:[^>]*)?>([\s\S]*?)<\/title>/i)
      const descMatch = itemXml.match(/<description(?:[^>]*)?>([\s\S]*?)<\/description>/i)
      const linkMatch = itemXml.match(/<link(?:[^>]*)?>([\s\S]*?)<\/link>/i)
      const pubDateMatch = itemXml.match(/<pubDate(?:[^>]*)?>([\s\S]*?)<\/pubDate>/i)
      
      feedItems.push({
        title: titleMatch ? titleMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim() : '',
        description: descMatch ? descMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').replace(/<[^>]*>/g, '').trim() : '',
        url: linkMatch ? linkMatch[1].trim() : '',
        publishedAt: pubDateMatch ? pubDateMatch[1].trim() : new Date().toISOString(),
        source: 'RSS Feed'
      })
    }
    
    return feedItems
  } catch (error) {
    console.error('RSS parsing error:', error)
    return []
  }
}

async function gatherIndustryNews(params: any) {
  const news = []
  
  try {
    // Get industry-specific news from NewsAPI
    const industry = params.organization?.industry || 'technology'
    const keywords = params.keywords?.join(' OR ') || industry
    
    const newsResponse = await callNewsAPI('/everything', {
      'q': keywords,
      'language': 'en',
      'sortBy': 'publishedAt',
      'pageSize': '20',
      'domains': 'techcrunch.com,venturebeat.com,theverge.com,wired.com,arstechnica.com,reuters.com,bloomberg.com'
    })

    for (const article of newsResponse.articles || []) {
      news.push({
        title: article.title,
        description: article.description,
        url: article.url,
        source: article.source.name,
        publishedAt: article.publishedAt,
        author: article.author,
        relevance: calculateRelevance(article, keywords),
        category: 'industry_news',
        suggestedAction: 'Monitor for PR opportunities or competitive intelligence'
      })
    }

  } catch (error) {
    console.error('NewsAPI error:', error)
  }

  try {
    // Get additional news from Google News
    const googleQuery = `${params.organization?.industry || 'technology'} ${params.organization?.name || ''}`
    const googleResponse = await callGoogleNewsAPI(googleQuery)

    for (const item of googleResponse.items || []) {
      news.push({
        title: item.title,
        description: item.snippet,
        url: item.link,
        source: 'Google News',
        publishedAt: new Date().toISOString(),
        relevance: 'medium',
        category: 'related_news',
        suggestedAction: 'Review for potential PR angles'
      })
    }

  } catch (error) {
    console.error('Google News API error:', error)
  }

  try {
    // Get news from RSS feeds (Real-time feeds you configured)
    const organizationName = params.organization?.name || ''
    const searchQuery = encodeURIComponent(`${industry} ${organizationName}`)
    
    const rssFeeds = [
      `https://news.google.com/rss/search?q="${searchQuery}"&hl=en-US&gl=US&ceid=US:en`,
      `https://www.bing.com/news/search?q=${searchQuery}&format=rss`,
      // Add more RSS feeds as needed
    ]

    for (const feedUrl of rssFeeds) {
      const rssItems = await parseRSSFeed(feedUrl)
      
      for (const item of rssItems) {
        news.push({
          title: item.title,
          description: item.description,
          url: item.url,
          source: `RSS - ${feedUrl.includes('google') ? 'Google News' : 'Bing News'}`,
          publishedAt: item.publishedAt,
          relevance: calculateRelevance(item, keywords),
          category: 'rss_news',
          suggestedAction: 'Monitor RSS feed content for timely opportunities'
        })
      }
    }

  } catch (error) {
    console.error('RSS feed error:', error)
  }

  return news
}

async function getBreakingNews(params: any) {
  const breaking = []
  
  try {
    // Get top breaking news
    const topResponse = await callNewsAPI('/top-headlines', {
      'category': 'technology',
      'language': 'en',
      'pageSize': '10'
    })

    for (const article of topResponse.articles || []) {
      // Check if it's relevant to the organization's industry
      const relevance = calculateRelevance(article, params.organization?.industry || 'technology')
      
      if (relevance !== 'low') {
        breaking.push({
          title: article.title,
          description: article.description,
          url: article.url,
          source: article.source.name,
          publishedAt: article.publishedAt,
          author: article.author,
          relevance,
          category: 'breaking_news',
          urgency: getUrgency(article),
          suggestedAction: getActionForBreakingNews(article, params.organization)
        })
      }
    }

  } catch (error) {
    console.error('Breaking news API error:', error)
  }

  return breaking
}

async function findMediaOpportunities(params: any) {
  const opportunities = []
  
  try {
    // Search for journalist queries and HARO-style opportunities
    const haroQuery = `${params.organization?.industry || 'technology'} expert source needed OR journalist seeking OR looking for sources`
    
    const opResponse = await callNewsAPI('/everything', {
      'q': haroQuery,
      'language': 'en',
      'sortBy': 'publishedAt',
      'pageSize': '15'
    })

    for (const article of opResponse.articles || []) {
      if (article.title?.toLowerCase().includes('source') || 
          article.description?.toLowerCase().includes('expert') ||
          article.description?.toLowerCase().includes('comment')) {
        
        opportunities.push({
          title: article.title,
          description: article.description,
          outlet: article.source.name,
          deadline: estimateDeadline(article.publishedAt),
          contact: extractContact(article),
          relevance: 'high',
          type: 'media_query',
          suggestedAction: `Respond to ${article.source.name} with expert commentary`,
          url: article.url,
          publishedAt: article.publishedAt
        })
      }
    }

  } catch (error) {
    console.error('Media opportunities API error:', error)
  }

  return opportunities
}

function calculateRelevance(article: any, keywords: string): string {
  const text = `${article.title} ${article.description}`.toLowerCase()
  const keywordList = keywords.toLowerCase().split(/\s+/)
  
  const matches = keywordList.filter(keyword => text.includes(keyword)).length
  
  if (matches >= 3) return 'high'
  if (matches >= 1) return 'medium'
  return 'low'
}

function getUrgency(article: any): string {
  const hoursOld = (Date.now() - new Date(article.publishedAt).getTime()) / (1000 * 60 * 60)
  
  if (hoursOld < 2) return 'urgent'
  if (hoursOld < 24) return 'high'
  return 'normal'
}

function getActionForBreakingNews(article: any, organization: any): string {
  const title = article.title?.toLowerCase() || ''
  
  if (title.includes('crisis') || title.includes('scandal')) {
    return 'Monitor for potential impact on industry reputation'
  }
  if (title.includes('funding') || title.includes('investment')) {
    return 'Consider positioning around funding trends'
  }
  if (title.includes('regulation') || title.includes('policy')) {
    return 'Prepare regulatory response if applicable'
  }
  
  return 'Evaluate for PR opportunity or competitive response'
}

function estimateDeadline(publishedAt: string): string {
  const pubDate = new Date(publishedAt)
  const deadlineDate = new Date(pubDate.getTime() + 24 * 60 * 60 * 1000) // +24 hours
  return deadlineDate.toISOString()
}

function extractContact(article: any): string {
  // Try to extract contact information from article
  const text = `${article.title} ${article.description}`
  
  // Look for email patterns
  const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/)
  if (emailMatch) return emailMatch[0]
  
  // Look for Twitter handles
  const twitterMatch = text.match(/@[\w]+/)
  if (twitterMatch) return twitterMatch[0]
  
  return `Contact via ${article.source.name}`
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  try {
    const request: NewsRequest = await req.json()
    const { method, params } = request

    console.log(`📰 News Intelligence: ${method} request for ${params.stakeholder}`)

    let data: any = {}

    switch (method) {
      case 'gather':
        // Comprehensive news gathering
        const [industryNews, breakingNews, opportunities] = await Promise.all([
          gatherIndustryNews(params),
          getBreakingNews(params),
          findMediaOpportunities(params)
        ])
        
        data = {
          industryNews,
          breakingNews,
          opportunities,
          totalArticles: industryNews.length,
          totalBreaking: breakingNews.length,
          totalOpportunities: opportunities.length,
          sources: ['NewsAPI', 'Google News'],
          timestamp: new Date().toISOString()
        }
        break

      case 'breaking':
        const breaking = await getBreakingNews(params)
        data = {
          breakingNews: breaking,
          totalBreaking: breaking.length,
          focus: 'breaking_news',
          timestamp: new Date().toISOString()
        }
        break

      case 'opportunities':
        const opps = await findMediaOpportunities(params)
        data = {
          opportunities: opps,
          totalOpportunities: opps.length,
          focus: 'media_opportunities',
          timestamp: new Date().toISOString()
        }
        break

      case 'industry':
        const industry = await gatherIndustryNews(params)
        data = {
          industryNews: industry,
          totalArticles: industry.length,
          focus: 'industry_news',
          timestamp: new Date().toISOString()
        }
        break

      default:
        throw new Error(`Unknown method: ${method}`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        data,
        source: 'NewsAPI & Google News',
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('❌ News Intelligence error:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        service: 'News Intelligence MCP',
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 503  // Service unavailable when APIs fail
      }
    )
  }
})