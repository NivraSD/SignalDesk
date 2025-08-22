// Twitter/X Intelligence Edge Function
// Gathers real-time social sentiment and trends from Twitter/X

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

const TWITTER_BEARER_TOKEN = Deno.env.get('TWITTER_BEARER_TOKEN')

// Search Twitter for recent tweets
async function searchTwitter(query: string, maxResults = 50) {
  try {
    // Twitter API v2 search endpoint
    const url = `https://api.twitter.com/2/tweets/search/recent?query=${encodeURIComponent(query)}&max_results=${maxResults}&tweet.fields=created_at,author_id,public_metrics,context_annotations&expansions=author_id`
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${TWITTER_BEARER_TOKEN}`,
        'User-Agent': 'SignalDesk/1.0'
      }
    })
    
    if (!response.ok) {
      console.error(`Twitter API error: ${response.status}`)
      return []
    }
    
    const data = await response.json()
    
    if (!data.data) return []
    
    return data.data.map((tweet: any) => ({
      text: tweet.text,
      created_at: tweet.created_at,
      author_id: tweet.author_id,
      metrics: tweet.public_metrics || {},
      retweet_count: tweet.public_metrics?.retweet_count || 0,
      like_count: tweet.public_metrics?.like_count || 0,
      reply_count: tweet.public_metrics?.reply_count || 0,
      engagement: (tweet.public_metrics?.retweet_count || 0) + 
                  (tweet.public_metrics?.like_count || 0) + 
                  (tweet.public_metrics?.reply_count || 0),
      sentiment: analyzeSentiment(tweet.text)
    }))
  } catch (error) {
    console.error('Twitter search error:', error)
    return []
  }
}

// Basic sentiment analysis
function analyzeSentiment(text: string): string {
  const positive = ['good', 'great', 'excellent', 'amazing', 'love', 'best', 'awesome', 'fantastic', '🎉', '👍', '✨', '💪']
  const negative = ['bad', 'terrible', 'worst', 'hate', 'awful', 'horrible', 'disaster', 'fail', '😡', '👎', '😤', '💔']
  
  const lowerText = text.toLowerCase()
  const positiveCount = positive.filter(word => lowerText.includes(word)).length
  const negativeCount = negative.filter(word => lowerText.includes(word)).length
  
  if (positiveCount > negativeCount) return 'positive'
  if (negativeCount > positiveCount) return 'negative'
  return 'neutral'
}

// Main gather function
async function gatherTwitterIntelligence(params: any) {
  const { organization } = params
  const keywords = organization.keywords || [organization.name]
  
  console.log(`🐦 Gathering Twitter/X intelligence for ${organization.name}`)
  
  // Build search query (Twitter has specific query syntax)
  const searchQuery = keywords.slice(0, 3).join(' OR ')
  
  const tweets = await searchTwitter(searchQuery)
  
  // Analyze sentiment distribution
  const sentimentBreakdown = {
    positive: tweets.filter(t => t.sentiment === 'positive').length,
    negative: tweets.filter(t => t.sentiment === 'negative').length,
    neutral: tweets.filter(t => t.sentiment === 'neutral').length
  }
  
  // Find most engaged tweets
  const topTweets = tweets
    .sort((a, b) => b.engagement - a.engagement)
    .slice(0, 10)
  
  // Calculate average engagement
  const avgEngagement = tweets.length > 0 
    ? tweets.reduce((sum, t) => sum + t.engagement, 0) / tweets.length 
    : 0
  
  return {
    success: true,
    data: {
      tweets: tweets,
      topTweets: topTweets,
      sentiment: sentimentBreakdown,
      totalTweets: tweets.length,
      averageEngagement: Math.round(avgEngagement),
      timeframe: 'last_7_days',
      keywords: keywords
    },
    source: 'twitter-intelligence',
    timestamp: new Date().toISOString()
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  try {
    const { method, params } = await req.json()
    
    console.log(`🐦 Twitter Intelligence: ${method} request`)
    
    let result
    switch (method) {
      case 'gather':
        result = await gatherTwitterIntelligence(params)
        break
      default:
        throw new Error(`Unknown method: ${method}`)
    }
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Twitter Intelligence error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        source: 'twitter-intelligence'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  }
})