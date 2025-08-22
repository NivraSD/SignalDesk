// Trends Intelligence MCP - Monitors broader topics and industry trends
// Not tied to specific entities, focuses on movements and patterns

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"

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

// Track trending topics using Google News search for each topic
async function fetchTrendingTopics(topics: string[]) {
  const trends = []
  
  for (const topic of topics.slice(0, 5)) {
    try {
      // Search Google News for the topic to gauge trending status
      const searchQuery = `"${topic}" when:7d`
      const url = `https://news.google.com/rss/search?q=${encodeURIComponent(searchQuery)}&hl=en-US&gl=US&ceid=US:en`
      const response = await fetchWithTimeout(url, {}, 3000)
      
      if (response.ok) {
        const xmlText = await response.text()
        const items = xmlText.match(/<item>([\s\S]*?)<\/item>/gi) || []
        
        // Count articles as a proxy for trending
        const articleCount = items.length
        
        if (articleCount > 0) {
          // Extract some sample headlines
          const sampleHeadlines = []
          for (const item of items.slice(0, 3)) {
            const title = item.match(/<title>(.*?)<\/title>/)?.[1] || ''
            if (title) {
              sampleHeadlines.push(title.replace(/<!\[CDATA\[|\]\]>/g, '').replace(/&amp;/g, '&'))
            }
          }
          
          trends.push({
            topic: topic,
            article_count: articleCount,
            trend: articleCount > 20 ? 'hot' : articleCount > 10 ? 'rising' : 'steady',
            relevance: articleCount > 15 ? 'high' : articleCount > 5 ? 'medium' : 'low',
            sample_headlines: sampleHeadlines,
            source: 'Google News Analysis'
          })
        }
      }
    } catch (error) {
      console.log(`Trends fetch error for ${topic}: ${error.message}`)
    }
  }
  
  return trends
}

// Track industry metrics and statistics using Google News
async function fetchIndustryMetrics(topics: string[]) {
  const metrics = []
  
  // Keywords that indicate metrics/statistics in headlines
  const metricKeywords = ['percent', '%', 'billion', 'million', 'growth', 'decline', 'surge', 'drop', 'rise', 'fall', 'record', 'new high', 'new low']
  
  for (const topic of topics.slice(0, 5)) {
    try {
      // Search for topic + metrics/numbers
      const searchQuery = `"${topic}" (percent OR billion OR million OR growth OR surge)`
      const url = `https://news.google.com/rss/search?q=${encodeURIComponent(searchQuery)}&hl=en-US&gl=US&ceid=US:en`
      
      const response = await fetchWithTimeout(url, {}, 3000)
      if (response.ok) {
        const xmlText = await response.text()
        const items = xmlText.match(/<item>([\s\S]*?)<\/item>/gi) || []
        
        for (const item of items.slice(0, 3)) {
          const title = item.match(/<title>(.*?)<\/title>/)?.[1] || ''
          const source = item.match(/<source.*?>(.*?)<\/source>/)?.[1] || 'Unknown'
          
          // Check if title contains metric keywords
          const hasMetric = metricKeywords.some(keyword => 
            title.toLowerCase().includes(keyword.toLowerCase())
          )
          
          if (hasMetric) {
            // Extract the metric from the title
            const numberMatch = title.match(/(\d+\.?\d*)\s*(%|percent|billion|million)/i)
            const metricValue = numberMatch ? numberMatch[0] : 'Data point'
            
            metrics.push({
              topic,
              metric: metricValue,
              headline: title.replace(/<!\[CDATA\[|\]\]>/g, '').replace(/&amp;/g, '&'),
              trend: title.toLowerCase().includes('surge') || title.toLowerCase().includes('rise') ? 'up' :
                     title.toLowerCase().includes('drop') || title.toLowerCase().includes('fall') ? 'down' : 'stable',
              source: source.replace(/<!\[CDATA\[|\]\]>/g, ''),
              timestamp: new Date().toISOString()
            })
          }
        }
      }
    } catch (error) {
      console.log(`Metric fetch error for ${topic}: ${error.message}`)
    }
  }
  
  return metrics
}

// Track sentiment based on news coverage tone
async function fetchTrendSentiment(topics: string[]) {
  const sentiments = []
  
  // Sentiment keywords
  const positiveWords = ['breakthrough', 'success', 'growth', 'surge', 'record', 'innovative', 'leading', 'wins', 'gains']
  const negativeWords = ['crisis', 'failure', 'decline', 'drop', 'concern', 'risk', 'threat', 'loses', 'struggles']
  
  for (const topic of topics.slice(0, 3)) {
    try {
      const url = `https://news.google.com/rss/search?q=${encodeURIComponent(topic)}&hl=en-US&gl=US&ceid=US:en`
      const response = await fetchWithTimeout(url, {}, 3000)
      
      if (response.ok) {
        const xmlText = await response.text()
        const items = xmlText.match(/<item>([\s\S]*?)<\/item>/gi) || []
        
        let positiveCount = 0
        let negativeCount = 0
        let neutralCount = 0
        
        for (const item of items.slice(0, 10)) {
          const title = item.match(/<title>(.*?)<\/title>/)?.[1] || ''
          const titleLower = title.toLowerCase()
          
          const hasPositive = positiveWords.some(word => titleLower.includes(word))
          const hasNegative = negativeWords.some(word => titleLower.includes(word))
          
          if (hasPositive && !hasNegative) {
            positiveCount++
          } else if (hasNegative && !hasPositive) {
            negativeCount++
          } else {
            neutralCount++
          }
        }
        
        const total = positiveCount + negativeCount + neutralCount
        if (total > 0) {
          sentiments.push({
            topic,
            platform: 'News Sentiment',
            sentiment: positiveCount > negativeCount ? 'positive' : 
                      negativeCount > positiveCount ? 'negative' : 'neutral',
            breakdown: {
              positive: Math.round((positiveCount / total) * 100),
              negative: Math.round((negativeCount / total) * 100),
              neutral: Math.round((neutralCount / total) * 100)
            },
            sample_size: total
          })
        }
      }
    } catch (error) {
      console.log(`Sentiment fetch error: ${error.message}`)
    }
  }
  
  return sentiments
}

// Main analysis function
async function analyzeTrends(topics: string[], context: any) {
  console.log(`📈 Analyzing trends for topics:`, topics)
  
  // Parallel fetch all trend data
  const [trending, metrics, sentiment] = await Promise.all([
    fetchTrendingTopics(topics),
    fetchIndustryMetrics(topics),
    fetchTrendSentiment(topics)
  ])
  
  // Compile trend intelligence
  const trendIntelligence = {
    trending_topics: trending,
    industry_metrics: metrics,
    sentiment_analysis: sentiment,
    
    summary: {
      hot_topics: trending.filter(t => t.relevance === 'high').map(t => t.topic),
      rising_trends: trending.filter(t => t.trend === 'rising').map(t => t.topic),
      sentiment_overview: sentiment.length > 0 ? 
        sentiment.reduce((acc, s) => {
          acc[s.sentiment] = (acc[s.sentiment] || 0) + 1
          return acc
        }, {}) : { neutral: 1 }
    },
    
    implications: {
      opportunities: trending.filter(t => t.relevance === 'high').map(t => ({
        topic: t.topic,
        action: `Consider content/positioning around ${t.topic}`,
        urgency: 'medium'
      })),
      risks: sentiment.filter(s => s.sentiment === 'negative').map(s => ({
        topic: s.topic,
        risk: `Negative sentiment building around ${s.topic}`,
        action: 'Monitor and prepare response'
      }))
    },
    
    metadata: {
      analyzed_topics: topics,
      timestamp: new Date().toISOString(),
      data_points: trending.length + metrics.length + sentiment.length
    }
  }
  
  return trendIntelligence
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { topics, organization } = await req.json()
    
    if (!topics || topics.length === 0) {
      throw new Error('Topics are required for trend analysis')
    }
    
    console.log(`🔍 Monitoring trends for ${organization?.name || 'organization'}`)
    console.log(`📊 Topics:`, topics)
    
    const trendData = await analyzeTrends(topics, { organization })
    
    return new Response(
      JSON.stringify({
        success: true,
        intelligence: trendData,
        message: `Analyzed ${trendData.metadata.data_points} trend data points`
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error('Trends analysis error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        intelligence: {
          trending_topics: [],
          industry_metrics: [],
          sentiment_analysis: [],
          summary: {},
          implications: {}
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  }
})