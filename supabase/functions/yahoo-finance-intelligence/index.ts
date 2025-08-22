// Yahoo Finance Intelligence Edge Function
// Provides comprehensive financial data and business news from Yahoo Finance

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

// Yahoo Finance RSS feeds and data sources
const YAHOO_FINANCE_SOURCES = {
  general_news: 'https://finance.yahoo.com/rss/',
  business_news: 'https://finance.yahoo.com/news/rssindex',
  markets: 'https://feeds.finance.yahoo.com/rss/2.0/headline',
  earnings: 'https://finance.yahoo.com/rss/earnings',
  analyst_opinion: 'https://finance.yahoo.com/rss/analyst-opinion'
}

// Fetch and parse Yahoo Finance RSS feed
async function fetchYahooFinanceNews(feedUrl: string, maxItems = 20) {
  try {
    const response = await fetch(feedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SignalDesk/1.0)'
      }
    })
    
    if (!response.ok) {
      console.error(`Yahoo Finance feed error: ${response.status}`)
      return []
    }
    
    const xmlText = await response.text()
    
    // Parse RSS XML (basic extraction)
    const items = []
    const itemMatches = xmlText.match(/<item>(.*?)<\/item>/gs) || []
    
    for (const itemMatch of itemMatches.slice(0, maxItems)) {
      const titleMatch = itemMatch.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || itemMatch.match(/<title>(.*?)<\/title>/)
      const linkMatch = itemMatch.match(/<link>(.*?)<\/link>/)
      const descMatch = itemMatch.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/) || itemMatch.match(/<description>(.*?)<\/description>/)
      const pubDateMatch = itemMatch.match(/<pubDate>(.*?)<\/pubDate>/)
      
      if (titleMatch && linkMatch) {
        items.push({
          title: titleMatch[1].trim(),
          link: linkMatch[1].trim(),
          description: descMatch ? descMatch[1].replace(/<[^>]*>/g, '').trim() : '',
          publishedAt: pubDateMatch ? new Date(pubDateMatch[1]).toISOString() : new Date().toISOString(),
          source: 'Yahoo Finance',
          category: categorizeFinanceNews(titleMatch[1])
        })
      }
    }
    
    return items
  } catch (error) {
    console.error('Yahoo Finance fetch error:', error)
    return []
  }
}

// Categorize financial news
function categorizeFinanceNews(title: string): string {
  const lowerTitle = title.toLowerCase()
  
  if (lowerTitle.includes('earnings') || lowerTitle.includes('revenue') || lowerTitle.includes('profit')) {
    return 'earnings'
  }
  if (lowerTitle.includes('merger') || lowerTitle.includes('acquisition') || lowerTitle.includes('deal')) {
    return 'mergers_acquisitions'
  }
  if (lowerTitle.includes('stock') || lowerTitle.includes('shares') || lowerTitle.includes('market')) {
    return 'markets'
  }
  if (lowerTitle.includes('fed') || lowerTitle.includes('interest') || lowerTitle.includes('rate')) {
    return 'monetary_policy'
  }
  if (lowerTitle.includes('crypto') || lowerTitle.includes('bitcoin') || lowerTitle.includes('ethereum')) {
    return 'cryptocurrency'
  }
  if (lowerTitle.includes('ipo') || lowerTitle.includes('listing')) {
    return 'public_offerings'
  }
  if (lowerTitle.includes('analyst') || lowerTitle.includes('upgrade') || lowerTitle.includes('downgrade')) {
    return 'analyst_opinion'
  }
  
  return 'business_news'
}

// Get stock information for organization and competitors
async function getStockInfo(symbols: string[]) {
  const stockData = []
  
  // Yahoo Finance doesn't have a free API, but we can try to extract basic info
  // For production, consider using Alpha Vantage, IEX Cloud, or similar services
  for (const symbol of symbols.slice(0, 5)) {
    try {
      // This is a simplified approach - in production you'd want a proper financial API
      stockData.push({
        symbol: symbol,
        note: 'Stock data available via Yahoo Finance website',
        link: `https://finance.yahoo.com/quote/${symbol}`
      })
    } catch (error) {
      console.error(`Error fetching stock data for ${symbol}:`, error)
    }
  }
  
  return stockData
}

// Main gather function
async function gatherYahooFinanceIntelligence(params: any) {
  const { organization } = params
  const organizationName = organization.name || organization
  
  console.log(`💰 Gathering Yahoo Finance intelligence for ${organizationName}`)
  
  // Gather news from multiple Yahoo Finance feeds
  const newsPromises = Object.entries(YAHOO_FINANCE_SOURCES).map(async ([category, url]) => {
    const articles = await fetchYahooFinanceNews(url, 10)
    return { category, articles }
  })
  
  const newsResults = await Promise.all(newsPromises)
  const allArticles = newsResults.flatMap(result => 
    result.articles.map(article => ({
      ...article,
      feed_category: result.category
    }))
  )
  
  // Filter articles relevant to organization and competitors
  const relevantArticles = allArticles.filter(article => {
    const content = (article.title + ' ' + article.description).toLowerCase()
    const orgName = organizationName.toLowerCase()
    
    // Check if article mentions organization
    if (content.includes(orgName)) return true
    
    // Check if article mentions competitors
    if (organization.competitors) {
      for (const competitor of organization.competitors) {
        if (content.includes(competitor.toLowerCase())) return true
      }
    }
    
    // Include general market/industry news
    if (organization.industry) {
      const industry = organization.industry.toLowerCase()
      if (content.includes(industry)) return true
    }
    
    return false
  })
  
  // Get stock symbols if available
  const stockSymbols = []
  if (organization.stock_symbol) {
    stockSymbols.push(organization.stock_symbol)
  }
  
  const stockInfo = await getStockInfo(stockSymbols)
  
  // Categorize articles
  const categorized = {
    earnings: relevantArticles.filter(a => a.category === 'earnings'),
    markets: relevantArticles.filter(a => a.category === 'markets'),
    mergers_acquisitions: relevantArticles.filter(a => a.category === 'mergers_acquisitions'),
    analyst_opinion: relevantArticles.filter(a => a.category === 'analyst_opinion'),
    general: relevantArticles.filter(a => a.category === 'business_news')
  }
  
  return {
    success: true,
    data: {
      articles: relevantArticles,
      categorized: categorized,
      stock_info: stockInfo,
      total_articles: allArticles.length,
      relevant_articles: relevantArticles.length,
      organization: organizationName,
      feeds_checked: Object.keys(YAHOO_FINANCE_SOURCES).length,
      sources: YAHOO_FINANCE_SOURCES
    },
    source: 'yahoo-finance-intelligence',
    timestamp: new Date().toISOString()
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  try {
    const { method, params } = await req.json()
    
    console.log(`💰 Yahoo Finance Intelligence: ${method} request`)
    
    let result
    switch (method) {
      case 'gather':
        result = await gatherYahooFinanceIntelligence(params)
        break
      default:
        throw new Error(`Unknown method: ${method}`)
    }
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Yahoo Finance Intelligence error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        source: 'yahoo-finance-intelligence'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  }
})