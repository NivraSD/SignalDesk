import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

/**
 * MCP Social Intelligence
 *
 * Provides comprehensive social media intelligence across all major platforms:
 * - Twitter/X (direct API)
 * - Reddit (direct API)
 * - LinkedIn, Instagram, TikTok (via niv-fireplexity scraping)
 *
 * Tools:
 * - monitor_twitter: Track Twitter mentions and trends
 * - monitor_reddit: Monitor Reddit discussions
 * - search_linkedin_posts: Search LinkedIn via Fireplexity
 * - search_instagram_public: Search Instagram via Fireplexity
 * - search_tiktok_trend: Search TikTok via Fireplexity
 * - search_social_mentions: Search all platforms for brand mentions
 * - analyze_sentiment: Analyze sentiment across signals
 * - get_social_context: Get summarized context for content creation
 * - monitor_all_platforms: Monitor all platforms simultaneously
 */

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!
const TWITTER_BEARER_TOKEN = Deno.env.get('TWITTER_BEARER_TOKEN')

// MCP Tool Definitions
export const TOOLS = [
  {
    name: 'monitor_twitter',
    description: 'Monitor Twitter/X for brand mentions, trends, and conversations. Returns tweets with engagement metrics.',
    parameters: {
      type: 'object',
      properties: {
        organization_id: {
          type: 'string',
          description: 'Organization name or brand to monitor'
        },
        query: {
          type: 'string',
          description: 'Search query (supports Twitter operators like OR, AND, #hashtag)'
        },
        time_range: {
          type: 'string',
          enum: ['1h', '24h', '7d'],
          description: 'Time range to search'
        },
        max_results: {
          type: 'number',
          description: 'Maximum number of results (default: 50)',
          default: 50
        }
      },
      required: ['query']
    }
  },
  {
    name: 'monitor_reddit',
    description: 'Monitor Reddit for brand discussions and sentiment. Searches across specified subreddits.',
    parameters: {
      type: 'object',
      properties: {
        organization_id: {
          type: 'string',
          description: 'Organization name to search for'
        },
        subreddits: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of subreddits to monitor (default: technology, business, news)',
          default: ['technology', 'business', 'news']
        },
        time_range: {
          type: 'string',
          enum: ['hour', 'day', 'week', 'month'],
          description: 'Time range to search'
        }
      },
      required: ['organization_id']
    }
  },
  {
    name: 'search_linkedin_posts',
    description: 'Search LinkedIn for public posts and discussions using intelligent scraping. Good for B2B intelligence.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query'
        },
        time_range: {
          type: 'string',
          enum: ['24h', '7d', '30d'],
          description: 'Time range to search'
        },
        organization_id: {
          type: 'string',
          description: 'Organization context for relevance filtering'
        }
      },
      required: ['query']
    }
  },
  {
    name: 'search_instagram_public',
    description: 'Search Instagram for public posts and hashtags using intelligent scraping.',
    parameters: {
      type: 'object',
      properties: {
        hashtag: {
          type: 'string',
          description: 'Hashtag to search (without #)'
        },
        query: {
          type: 'string',
          description: 'General search query'
        },
        time_range: {
          type: 'string',
          enum: ['24h', '7d', '30d'],
          description: 'Time range to search'
        }
      }
    }
  },
  {
    name: 'search_tiktok_trend',
    description: 'Search TikTok for trending content and hashtags using intelligent scraping.',
    parameters: {
      type: 'object',
      properties: {
        keyword: {
          type: 'string',
          description: 'Keyword or hashtag to search'
        },
        time_range: {
          type: 'string',
          enum: ['24h', '7d', '30d'],
          description: 'Time range to search'
        }
      },
      required: ['keyword']
    }
  },
  {
    name: 'search_social_mentions',
    description: 'Search across multiple social platforms for brand mentions simultaneously.',
    parameters: {
      type: 'object',
      properties: {
        brand: {
          type: 'string',
          description: 'Brand or organization name to search for'
        },
        platforms: {
          type: 'array',
          items: { type: 'string', enum: ['twitter', 'reddit', 'linkedin', 'instagram', 'tiktok'] },
          description: 'Platforms to search (default: all)'
        },
        time_range: {
          type: 'string',
          enum: ['1h', '24h', '7d', '30d'],
          description: 'Time range to search'
        }
      },
      required: ['brand']
    }
  },
  {
    name: 'analyze_sentiment',
    description: 'Analyze sentiment across social signals using Claude AI.',
    parameters: {
      type: 'object',
      properties: {
        signals: {
          type: 'array',
          description: 'Array of social signals to analyze'
        }
      },
      required: ['signals']
    }
  },
  {
    name: 'get_social_context',
    description: 'Get comprehensive social context summary for content creation. Returns trending topics, sentiment, competitor activity.',
    parameters: {
      type: 'object',
      properties: {
        organization_id: {
          type: 'string',
          description: 'Organization to get context for'
        },
        time_range: {
          type: 'string',
          enum: ['24h', '7d', '30d'],
          description: 'Time range for context'
        }
      },
      required: ['organization_id']
    }
  },
  {
    name: 'monitor_all_platforms',
    description: 'Monitor all social platforms simultaneously. Aggregates results from Twitter, Reddit, LinkedIn, Instagram, and TikTok.',
    parameters: {
      type: 'object',
      properties: {
        organization_id: {
          type: 'string',
          description: 'Organization to monitor'
        },
        time_range: {
          type: 'string',
          enum: ['1h', '24h', '7d'],
          description: 'Time range to monitor'
        },
        platforms: {
          type: 'array',
          items: { type: 'string' },
          description: 'Platforms to monitor (default: all)',
          default: ['twitter', 'reddit', 'linkedin', 'instagram', 'tiktok']
        },
        include_sentiment: {
          type: 'boolean',
          description: 'Include sentiment analysis (default: true)',
          default: true
        }
      },
      required: ['organization_id']
    }
  }
]

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { tool, arguments: args } = body

    console.log(`🔧 Social Intelligence MCP - Tool: ${tool}`)
    console.log(`📊 Args:`, args)

    let result

    switch (tool) {
      case 'monitor_twitter':
        result = await monitorTwitter(args)
        break

      case 'monitor_reddit':
        result = await monitorReddit(args)
        break

      case 'search_linkedin_posts':
        result = await searchViaNivFireplexity('linkedin', args)
        break

      case 'search_instagram_public':
        result = await searchViaNivFireplexity('instagram', args)
        break

      case 'search_tiktok_trend':
        result = await searchViaNivFireplexity('tiktok', args)
        break

      case 'search_social_mentions':
        result = await searchAllPlatforms(args)
        break

      case 'analyze_sentiment':
        result = await analyzeSentiment(args.signals)
        break

      case 'get_social_context':
        result = await getSocialContext(args)
        break

      case 'monitor_all_platforms':
        result = await monitorAllPlatforms(args)
        break

      default:
        throw new Error(`Unknown tool: ${tool}`)
    }

    return new Response(
      JSON.stringify({ success: true, tool, results: result }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('❌ Social Intelligence MCP Error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})

/**
 * Monitor Twitter using direct Twitter API v2
 */
async function monitorTwitter(args: any) {
  if (!TWITTER_BEARER_TOKEN) {
    console.warn('⚠️ Twitter API token not configured, skipping Twitter monitoring')
    return []
  }

  try {
    const { query, time_range = '24h', max_results = 50 } = args

    // Convert time_range to Twitter's start_time format
    const now = new Date()
    const startTimeMap = {
      '1h': new Date(now.getTime() - 60 * 60 * 1000),
      '24h': new Date(now.getTime() - 24 * 60 * 60 * 1000),
      '7d': new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    }
    const startTime = startTimeMap[time_range] || startTimeMap['24h']

    console.log(`🐦 Searching Twitter: "${query}" since ${startTime.toISOString()}`)

    const url = new URL('https://api.twitter.com/2/tweets/search/recent')
    url.searchParams.set('query', query)
    url.searchParams.set('max_results', String(Math.min(max_results, 100)))
    url.searchParams.set('start_time', startTime.toISOString())
    url.searchParams.set('tweet.fields', 'created_at,public_metrics,author_id,context_annotations')
    url.searchParams.set('expansions', 'author_id')
    url.searchParams.set('user.fields', 'username,name,verified')

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${TWITTER_BEARER_TOKEN}`
      }
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Twitter API Error:', error)
      throw new Error(`Twitter API failed: ${response.status}`)
    }

    const data = await response.json()

    if (!data.data || data.data.length === 0) {
      console.log('📭 No Twitter results found')
      return []
    }

    // Map users for easier lookup
    const users = {}
    if (data.includes?.users) {
      for (const user of data.includes.users) {
        users[user.id] = user
      }
    }

    console.log(`✅ Found ${data.data.length} tweets`)

    return data.data.map(tweet => {
      const author = users[tweet.author_id]
      return {
        platform: 'twitter',
        type: 'mention',
        content: tweet.text,
        author: author?.username || tweet.author_id,
        author_name: author?.name || 'Unknown',
        author_verified: author?.verified || false,
        engagement: (tweet.public_metrics?.like_count || 0) +
                   (tweet.public_metrics?.retweet_count || 0) * 2 +
                   (tweet.public_metrics?.reply_count || 0),
        metrics: {
          likes: tweet.public_metrics?.like_count || 0,
          retweets: tweet.public_metrics?.retweet_count || 0,
          replies: tweet.public_metrics?.reply_count || 0,
          quotes: tweet.public_metrics?.quote_count || 0
        },
        url: `https://twitter.com/${author?.username || 'i'}/status/${tweet.id}`,
        timestamp: tweet.created_at,
        raw: tweet
      }
    })

  } catch (error) {
    console.error('Twitter monitoring error:', error)
    return []
  }
}

/**
 * Monitor Reddit using Reddit JSON API
 */
async function monitorReddit(args: any) {
  try {
    const {
      organization_id,
      subreddits = ['technology', 'business', 'news'],
      time_range = 'day'
    } = args

    const subredditList = subreddits.join('+')
    const url = `https://www.reddit.com/r/${subredditList}/search.json?q=${encodeURIComponent(organization_id)}&sort=new&t=${time_range}&limit=100`

    console.log(`🔴 Searching Reddit: ${url}`)

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'SignalDesk Social Intelligence Bot'
      }
    })

    if (!response.ok) {
      console.error('Reddit API Error:', response.status)
      return []
    }

    const data = await response.json()

    if (!data.data?.children || data.data.children.length === 0) {
      console.log('📭 No Reddit results found')
      return []
    }

    console.log(`✅ Found ${data.data.children.length} Reddit posts`)

    return data.data.children.map(post => {
      const p = post.data
      return {
        platform: 'reddit',
        type: 'mention',
        content: `${p.title}\n\n${p.selftext}`,
        author: p.author,
        subreddit: p.subreddit,
        engagement: p.score + (p.num_comments * 2),
        metrics: {
          score: p.score,
          upvote_ratio: p.upvote_ratio,
          comments: p.num_comments
        },
        url: `https://reddit.com${p.permalink}`,
        timestamp: new Date(p.created_utc * 1000).toISOString(),
        raw: p
      }
    })

  } catch (error) {
    console.error('Reddit monitoring error:', error)
    return []
  }
}

/**
 * Search platforms - LinkedIn/Instagram/TikTok not currently supported by Firecrawl
 * Returning empty results until proper API access is configured
 */
async function searchViaNivFireplexity(platform: string, args: any) {
  console.log(`⚠️ ${platform} scraping not currently supported - Firecrawl blocks these platforms`)
  console.log(`   To enable, contact help@firecrawl.com or use platform APIs directly`)
  return []
}

/**
 * Search all platforms for brand mentions
 */
async function searchAllPlatforms(args: any) {
  const { brand, platforms = ['twitter', 'reddit', 'linkedin'], time_range = '24h' } = args

  console.log(`🌐 Searching all platforms for: ${brand}`)

  const results = []

  // Twitter
  if (platforms.includes('twitter')) {
    const twitterResults = await monitorTwitter({
      query: brand,
      time_range
    })
    results.push(...twitterResults)
  }

  // Reddit
  if (platforms.includes('reddit')) {
    const redditResults = await monitorReddit({
      organization_id: brand,
      time_range: time_range === '1h' ? 'hour' : time_range === '24h' ? 'day' : 'week'
    })
    results.push(...redditResults)
  }

  // LinkedIn
  if (platforms.includes('linkedin')) {
    const linkedinResults = await searchViaNivFireplexity('linkedin', {
      query: brand,
      time_range,
      organization_id: brand
    })
    results.push(...linkedinResults)
  }

  // Instagram
  if (platforms.includes('instagram')) {
    const instagramResults = await searchViaNivFireplexity('instagram', {
      query: brand,
      time_range
    })
    results.push(...instagramResults)
  }

  // TikTok
  if (platforms.includes('tiktok')) {
    const tiktokResults = await searchViaNivFireplexity('tiktok', {
      keyword: brand,
      time_range
    })
    results.push(...tiktokResults)
  }

  // Sort by timestamp (most recent first)
  results.sort((a, b) => {
    const timeA = new Date(a.timestamp).getTime()
    const timeB = new Date(b.timestamp).getTime()
    return timeB - timeA
  })

  console.log(`✅ Total results across all platforms: ${results.length}`)

  return results
}

/**
 * Monitor all platforms simultaneously
 */
async function monitorAllPlatforms(args: any) {
  const {
    organization_id,
    time_range = '24h',
    platforms = ['twitter', 'reddit', 'linkedin', 'instagram', 'tiktok'],
    include_sentiment = true
  } = args

  console.log(`🚀 Monitoring all platforms for: ${organization_id}`)

  // Use searchAllPlatforms which already does this
  const signals = await searchAllPlatforms({
    brand: organization_id,
    platforms,
    time_range
  })

  let result: any = {
    organization_id,
    time_range,
    platforms,
    total_signals: signals.length,
    signals,
    platform_breakdown: {}
  }

  // Count by platform
  for (const signal of signals) {
    if (!result.platform_breakdown[signal.platform]) {
      result.platform_breakdown[signal.platform] = 0
    }
    result.platform_breakdown[signal.platform]++
  }

  // Add sentiment analysis if requested
  if (include_sentiment && signals.length > 0) {
    console.log('🧠 Analyzing sentiment...')
    const sentiment = await analyzeSentiment(signals)
    result.sentiment_analysis = sentiment
  }

  return result
}

/**
 * Analyze sentiment using Claude
 */
async function analyzeSentiment(signals: any[]) {
  if (!signals || signals.length === 0) {
    return {
      overall: 'neutral',
      positive_percentage: 0,
      negative_percentage: 0,
      neutral_percentage: 0,
      summary: 'No signals to analyze'
    }
  }

  try {
    console.log(`🧠 Analyzing sentiment for ${signals.length} signals`)

    // Sample signals if too many (to avoid token limits)
    const sampleSize = Math.min(signals.length, 50)
    const sampledSignals = signals.slice(0, sampleSize)

    const signalTexts = sampledSignals.map(s => ({
      platform: s.platform,
      content: s.content?.substring(0, 200) || s.title
    }))

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: `Analyze the sentiment of these social media signals and provide a summary:

${JSON.stringify(signalTexts, null, 2)}

Provide:
1. Overall sentiment (positive/negative/neutral/mixed)
2. Percentage breakdown (positive/negative/neutral)
3. Key themes (3-5 bullet points)
4. Notable concerns or opportunities

Format as JSON:
{
  "overall": "positive|negative|neutral|mixed",
  "positive_percentage": 0-100,
  "negative_percentage": 0-100,
  "neutral_percentage": 0-100,
  "themes": ["theme1", "theme2"],
  "concerns": ["concern1"],
  "opportunities": ["opportunity1"],
  "summary": "brief summary"
}`
        }]
      })
    })

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`)
    }

    const data = await response.json()
    const content = data.content[0].text

    // Try to parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }

    // Fallback: return the text response
    return {
      overall: 'neutral',
      summary: content,
      analyzed_count: sampleSize,
      total_count: signals.length
    }

  } catch (error) {
    console.error('Sentiment analysis error:', error)
    return {
      overall: 'neutral',
      error: error.message,
      analyzed_count: 0
    }
  }
}

/**
 * Get comprehensive social context for content creation
 */
async function getSocialContext(args: any) {
  const { organization_id, time_range = '7d' } = args

  console.log(`📊 Getting social context for ${organization_id}`)

  // Get all signals
  const monitorResult = await monitorAllPlatforms({
    organization_id,
    time_range,
    platforms: ['twitter', 'reddit', 'linkedin', 'instagram', 'tiktok'],
    include_sentiment: true
  })

  const signals = monitorResult.signals

  if (signals.length === 0) {
    return {
      organization_id,
      time_range,
      message: 'No social signals found',
      trending_topics: [],
      sentiment_summary: 'No data',
      recommendations: []
    }
  }

  try {
    // Ask Claude for comprehensive analysis
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: `Analyze these social media signals for ${organization_id} and provide context for content creation:

Platform breakdown: ${JSON.stringify(monitorResult.platform_breakdown)}
Total signals: ${signals.length}

Sample signals:
${JSON.stringify(signals.slice(0, 20), null, 2)}

Sentiment analysis:
${JSON.stringify(monitorResult.sentiment_analysis, null, 2)}

Provide:
1. Top 5 trending topics (what's being discussed most)
2. Sentiment summary (overall mood)
3. Key competitor activity (if any)
4. Influencer conversations (notable voices)
5. Content recommendations (what to post about)

Format as JSON:
{
  "trending_topics": ["topic1", "topic2", ...],
  "sentiment_summary": "brief summary",
  "competitor_activity": ["activity1", ...],
  "influencer_conversations": ["conversation1", ...],
  "recommendations": ["recommendation1", ...]
}`
        }]
      })
    })

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`)
    }

    const data = await response.json()
    const content = data.content[0].text

    // Try to parse JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const context = JSON.parse(jsonMatch[0])
      return {
        organization_id,
        time_range,
        total_signals: signals.length,
        platform_breakdown: monitorResult.platform_breakdown,
        ...context
      }
    }

    // Fallback
    return {
      organization_id,
      time_range,
      total_signals: signals.length,
      platform_breakdown: monitorResult.platform_breakdown,
      analysis: content
    }

  } catch (error) {
    console.error('Social context error:', error)
    return {
      organization_id,
      time_range,
      total_signals: signals.length,
      platform_breakdown: monitorResult.platform_breakdown,
      error: error.message
    }
  }
}