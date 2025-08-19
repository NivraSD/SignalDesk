// Media Intelligence MCP - Real Twitter/X and Reddit API Integration
// Provides actual social media data instead of fallback responses

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MediaRequest {
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

const TWITTER_BEARER_TOKEN = Deno.env.get('TWITTER_BEARER_TOKEN')
const REDDIT_CLIENT_ID = Deno.env.get('REDDIT_CLIENT_ID')
const REDDIT_CLIENT_SECRET = Deno.env.get('REDDIT_CLIENT_SECRET')

async function callTwitterAPI(endpoint: string, params?: Record<string, string>) {
  if (!TWITTER_BEARER_TOKEN) {
    throw new Error('Twitter API token not configured')
  }

  const url = new URL(`https://api.twitter.com/2${endpoint}`)
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value)
    })
  }

  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${TWITTER_BEARER_TOKEN}`,
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    throw new Error(`Twitter API error: ${response.status} ${response.statusText}`)
  }

  return await response.json()
}

async function callRedditAPI(endpoint: string) {
  if (!REDDIT_CLIENT_ID || !REDDIT_CLIENT_SECRET) {
    throw new Error('Reddit API credentials not configured')
  }

  // Get Reddit OAuth token
  const auth = btoa(`${REDDIT_CLIENT_ID}:${REDDIT_CLIENT_SECRET}`)
  const tokenResponse = await fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'SignalDesk/1.0'
    },
    body: 'grant_type=client_credentials'
  })

  if (!tokenResponse.ok) {
    throw new Error(`Reddit OAuth error: ${tokenResponse.status}`)
  }

  const tokenData = await tokenResponse.json()
  
  // Make API call
  const response = await fetch(`https://oauth.reddit.com${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${tokenData.access_token}`,
      'User-Agent': 'SignalDesk/1.0'
    }
  })

  if (!response.ok) {
    throw new Error(`Reddit API error: ${response.status} ${response.statusText}`)
  }

  return await response.json()
}

async function discoverJournalists(params: any) {
  const journalists = []
  
  try {
    // Search for tech journalists and media personalities on Twitter
    const keywords = params.keywords || ['tech journalist', 'reporter', 'news']
    const searchQuery = keywords.join(' OR ')
    
    const twitterSearch = await callTwitterAPI('/tweets/search/recent', {
      'query': `${searchQuery} -is:retweet`,
      'tweet.fields': 'author_id,created_at,public_metrics,context_annotations',
      'user.fields': 'name,username,description,public_metrics,verified',
      'expansions': 'author_id',
      'max_results': '20'
    })

    // Process Twitter results
    const users = twitterSearch.includes?.users || []
    const tweets = twitterSearch.data || []

    for (const user of users) {
      if (user.description?.toLowerCase().includes('journalist') || 
          user.description?.toLowerCase().includes('reporter') ||
          user.description?.toLowerCase().includes('writer')) {
        
        const userTweets = tweets.filter(t => t.author_id === user.id)
        
        journalists.push({
          name: user.name,
          outlet: user.username,
          platform: 'Twitter/X',
          beat: extractBeat(user.description),
          followers: user.public_metrics?.followers_count || 0,
          engagement: calculateEngagement(userTweets),
          recentTweets: userTweets.length,
          verified: user.verified,
          relevance: user.public_metrics?.followers_count > 10000 ? 'high' : 'medium',
          contact: `@${user.username}`,
          url: `https://twitter.com/${user.username}`,
          lastActive: userTweets[0]?.created_at || new Date().toISOString()
        })
      }
    }

  } catch (error) {
    console.error('Twitter API error:', error)
    // Don't throw - continue with partial data
  }

  return journalists
}

async function gatherMediaTrends(params: any) {
  const trends = []
  
  try {
    // Get trending topics from Twitter
    const trendingResponse = await callTwitterAPI('/tweets/search/recent', {
      'query': `${params.organization?.industry || 'technology'} -is:retweet`,
      'tweet.fields': 'created_at,public_metrics,context_annotations',
      'max_results': '50'
    })

    // Analyze trending topics
    const topicCounts = new Map()
    const tweets = trendingResponse.data || []

    for (const tweet of tweets) {
      if (tweet.context_annotations) {
        for (const annotation of tweet.context_annotations) {
          const topic = annotation.entity?.name
          if (topic) {
            topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1)
          }
        }
      }
    }

    // Convert to trends
    for (const [topic, count] of topicCounts.entries()) {
      if (count >= 3) { // Only include topics mentioned multiple times
        trends.push({
          topic,
          mentions: count,
          relevance: count > 10 ? 'high' : 'medium',
          platform: 'Twitter/X',
          timeframe: 'recent',
          suggestedAction: `Monitor ${topic} for PR opportunities`,
          timestamp: new Date().toISOString()
        })
      }
    }

  } catch (error) {
    console.error('Twitter trends error:', error)
  }

  try {
    // Get trending posts from relevant subreddits
    const subreddits = ['technology', 'business', 'news', params.organization?.industry]
      .filter(Boolean)
      .slice(0, 3)

    for (const subreddit of subreddits) {
      const redditData = await callRedditAPI(`/r/${subreddit}/hot.json?limit=10`)
      
      for (const post of redditData.data?.children || []) {
        const postData = post.data
        if (postData.score > 100) { // Only high-engagement posts
          trends.push({
            topic: postData.title,
            mentions: postData.score,
            relevance: postData.score > 1000 ? 'high' : 'medium',
            platform: 'Reddit',
            subreddit: postData.subreddit,
            timeframe: 'trending',
            url: `https://reddit.com${postData.permalink}`,
            suggestedAction: `Engage with ${postData.subreddit} community discussion`,
            timestamp: new Date(postData.created_utc * 1000).toISOString()
          })
        }
      }
    }

  } catch (error) {
    console.error('Reddit API error:', error)
  }

  return trends
}

function extractBeat(description: string): string {
  const beats = ['tech', 'business', 'finance', 'startup', 'AI', 'crypto', 'science']
  const desc = description.toLowerCase()
  
  for (const beat of beats) {
    if (desc.includes(beat)) return beat
  }
  
  return 'general'
}

function calculateEngagement(tweets: any[]): number {
  if (!tweets.length) return 0
  
  const totalEngagement = tweets.reduce((sum, tweet) => {
    const metrics = tweet.public_metrics
    return sum + (metrics?.like_count || 0) + (metrics?.retweet_count || 0) + (metrics?.reply_count || 0)
  }, 0)
  
  return Math.round(totalEngagement / tweets.length)
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  try {
    const request: MediaRequest = await req.json()
    const { method, params } = request

    console.log(`📰 Media Intelligence: ${method} request for ${params.stakeholder}`)

    let data: any = {}

    switch (method) {
      case 'discover':
        // Discover journalists and media opportunities
        const [journalists, trends] = await Promise.all([
          discoverJournalists(params),
          gatherMediaTrends(params)
        ])
        
        data = {
          journalists,
          trends,
          totalJournalists: journalists.length,
          totalTrends: trends.length,
          platforms: ['Twitter/X', 'Reddit'],
          timestamp: new Date().toISOString()
        }
        break

      case 'trends':
        const trendData = await gatherMediaTrends(params)
        data = {
          trends: trendData,
          totalTrends: trendData.length,
          focus: 'trending_topics',
          timestamp: new Date().toISOString()
        }
        break

      case 'journalists':
        const journalistData = await discoverJournalists(params)
        data = {
          journalists: journalistData,
          totalJournalists: journalistData.length,
          focus: 'media_contacts',
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
        source: 'Twitter/X & Reddit APIs',
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('❌ Media Intelligence error:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        service: 'Media Intelligence MCP',
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 503  // Service unavailable when APIs fail
      }
    )
  }
})