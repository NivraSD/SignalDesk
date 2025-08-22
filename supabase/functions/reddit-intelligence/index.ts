// Reddit Intelligence Edge Function
// Gathers discussions, sentiment, and trends from Reddit

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

const REDDIT_CLIENT_ID = Deno.env.get('REDDIT_CLIENT_ID')
const REDDIT_CLIENT_SECRET = Deno.env.get('REDDIT_CLIENT_SECRET')

// Get Reddit access token
async function getRedditToken() {
  const auth = btoa(`${REDDIT_CLIENT_ID}:${REDDIT_CLIENT_SECRET}`)
  
  const response = await fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'SignalDesk/1.0'
    },
    body: 'grant_type=client_credentials'
  })
  
  if (!response.ok) {
    throw new Error(`Reddit auth failed: ${response.status}`)
  }
  
  const data = await response.json()
  return data.access_token
}

// Search Reddit for relevant discussions
async function searchReddit(keywords: string[], limit = 25) {
  try {
    const token = await getRedditToken()
    const searchQuery = keywords.join(' OR ')
    
    // Search relevant subreddits
    const subreddits = [
      'technology', 'business', 'news', 'worldnews', 
      'investing', 'stocks', 'startups', 'tech'
    ]
    
    const discussions = []
    
    // Search across multiple subreddits
    for (const subreddit of subreddits.slice(0, 3)) { // Limit to avoid rate limits
      const url = `https://oauth.reddit.com/r/${subreddit}/search.json?q=${encodeURIComponent(searchQuery)}&sort=relevance&time=week&limit=${limit}`
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'User-Agent': 'SignalDesk/1.0'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        
        for (const post of data.data.children) {
          discussions.push({
            title: post.data.title,
            url: `https://reddit.com${post.data.permalink}`,
            subreddit: post.data.subreddit,
            score: post.data.score,
            num_comments: post.data.num_comments,
            created: new Date(post.data.created_utc * 1000).toISOString(),
            text: post.data.selftext?.substring(0, 500) || '',
            sentiment: analyzeSentiment(post.data.title + ' ' + (post.data.selftext || ''))
          })
        }
      }
    }
    
    return discussions
  } catch (error) {
    console.error('Reddit search error:', error)
    return []
  }
}

// Basic sentiment analysis
function analyzeSentiment(text: string): string {
  const positive = ['good', 'great', 'excellent', 'amazing', 'positive', 'success', 'win', 'growth', 'innovation']
  const negative = ['bad', 'terrible', 'failure', 'loss', 'problem', 'issue', 'concern', 'risk', 'threat']
  
  const lowerText = text.toLowerCase()
  const positiveCount = positive.filter(word => lowerText.includes(word)).length
  const negativeCount = negative.filter(word => lowerText.includes(word)).length
  
  if (positiveCount > negativeCount) return 'positive'
  if (negativeCount > positiveCount) return 'negative'
  return 'neutral'
}

// Main gather function
async function gatherRedditIntelligence(params: any) {
  const { organization } = params
  const keywords = organization.keywords || [organization.name]
  
  console.log(`🔍 Gathering Reddit intelligence for ${organization.name}`)
  
  const discussions = await searchReddit(keywords)
  
  // Group by sentiment
  const sentimentBreakdown = {
    positive: discussions.filter(d => d.sentiment === 'positive').length,
    negative: discussions.filter(d => d.sentiment === 'negative').length,
    neutral: discussions.filter(d => d.sentiment === 'neutral').length
  }
  
  // Find trending topics
  const trendingTopics = discussions
    .filter(d => d.score > 10 || d.num_comments > 5)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
  
  return {
    success: true,
    data: {
      discussions: discussions,
      trending: trendingTopics,
      sentiment: sentimentBreakdown,
      totalDiscussions: discussions.length,
      timeframe: 'last_7_days',
      subreddits: [...new Set(discussions.map(d => d.subreddit))]
    },
    source: 'reddit-intelligence',
    timestamp: new Date().toISOString()
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  try {
    const { method, params } = await req.json()
    
    console.log(`🎯 Reddit Intelligence: ${method} request`)
    
    let result
    switch (method) {
      case 'gather':
        result = await gatherRedditIntelligence(params)
        break
      default:
        throw new Error(`Unknown method: ${method}`)
    }
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Reddit Intelligence error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        source: 'reddit-intelligence'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  }
})