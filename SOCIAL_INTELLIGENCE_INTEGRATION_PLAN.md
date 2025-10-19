# Social Intelligence MCP Integration Plan

## Executive Summary

This plan details how to integrate the **signaldesk-social-intelligence** MCP into SignalDesk v3, leveraging your existing niv-fireplexity (Firecrawl-based search) and direct Twitter/Reddit APIs to provide comprehensive social media intelligence across all major platforms.

---

## Current Platform Architecture

### **5 Core Modules:**
1. **Intelligence** - Monitoring & data collection (Monitor Stage 1/2)
2. **Opportunities** - AI-detected PR opportunities
3. **Plan** - Strategic planning module
4. **Execute** - Content generation (NIV)
5. **MemoryVault** - Historical context & learnings

### **Current Data Flow:**
```
Monitor Stage 1 (RSS/News)
  → Monitor Stage 2 (Relevance Filter)
  → Intelligence Synthesis
  → Opportunity Detection
  → Opportunities Module UI
```

---

## Integration Points for Social Intelligence MCP

### **1. Intelligence Module - Real-Time Social Monitoring**

**Location:** `src/components/modules/IntelligenceModule.tsx`

**Current State:**
- Shows RSS feed articles
- Displays intelligence synthesis
- No social media data

**Integration:**
```typescript
// Add new "Social Signals" section to Intelligence Module

interface SocialSignal {
  platform: 'twitter' | 'reddit' | 'linkedin' | 'instagram' | 'tiktok'
  type: 'mention' | 'trend' | 'sentiment_shift' | 'influencer_post'
  content: string
  author: string
  engagement: number
  sentiment: 'positive' | 'negative' | 'neutral'
  url: string
  timestamp: string
  relevance_score: number
}

// New API endpoint to call MCP
async function fetchSocialIntelligence(orgId: string, timeRange: '1h' | '24h' | '7d') {
  const response = await fetch('/api/social-intelligence', {
    method: 'POST',
    body: JSON.stringify({
      organization_id: orgId,
      time_range: timeRange,
      platforms: ['twitter', 'reddit', 'linkedin', 'instagram', 'tiktok'],
      query_types: ['mentions', 'trends', 'sentiment']
    })
  })
  return response.json()
}
```

**UI Enhancement:**
```tsx
// Add to IntelligenceModule.tsx
<div className="social-signals-panel">
  <h3>Social Intelligence (Past 24h)</h3>

  <div className="platform-tabs">
    {['All', 'Twitter', 'LinkedIn', 'Instagram', 'TikTok', 'Reddit'].map(platform => (
      <button onClick={() => filterByPlatform(platform)}>{platform}</button>
    ))}
  </div>

  <div className="signals-grid">
    {socialSignals.map(signal => (
      <SocialSignalCard
        signal={signal}
        onExecute={() => createOpportunityFromSignal(signal)}
      />
    ))}
  </div>
</div>
```

**Business Value:**
- See brand mentions across ALL platforms in real-time
- Detect sentiment shifts before they become crises
- Track competitor social activity
- Identify trending topics your org should comment on

---

### **2. Monitor Stage 1 - Add Social Sources**

**Location:** `supabase/functions/monitor-stage-1/index.ts`

**Current Sources:**
- RSS feeds from master-source-registry
- News API

**Integration:**
```typescript
// Add social monitoring to existing pipeline

async function collectSocialSources(orgId: string) {
  // Call social-intelligence MCP
  const socialResponse = await fetch(
    `${SUPABASE_URL}/functions/v1/mcp-social-intelligence`,
    {
      method: 'POST',
      body: JSON.stringify({
        tool: 'monitor_all_platforms',
        arguments: {
          organization_id: orgId,
          time_range: '24h',
          include_competitors: true
        }
      })
    }
  )

  const socialData = await socialResponse.json()

  // Convert to article format for existing pipeline
  return socialData.signals.map(signal => ({
    title: `${signal.platform}: ${signal.content.substring(0, 100)}`,
    url: signal.url,
    source: signal.platform,
    published_at: signal.timestamp,
    content: signal.content,
    engagement_score: signal.engagement,
    sentiment: signal.sentiment,
    type: 'social_signal'
  }))
}

// Merge with existing RSS/News collection
const allSources = [
  ...rssArticles,
  ...newsApiArticles,
  ...await collectSocialSources(organizationId)  // NEW
]
```

**Business Value:**
- Social signals flow into same intelligence pipeline
- Opportunities can be detected from social trends
- Unified view of ALL signal sources

---

### **3. Opportunity Detection - Social-Specific Patterns**

**Location:** `supabase/functions/mcp-opportunity-detector/index.ts`

**Current State:**
- Detects opportunities from news articles
- Pattern matching for announcements, trends, crises

**Enhancement:**
```typescript
// Add social-specific opportunity patterns

const SOCIAL_OPPORTUNITY_PATTERNS = [
  {
    name: 'viral_moment',
    trigger: 'High engagement on competitor content',
    description: 'Competitor post going viral - opportunity to counter-program',
    action: 'Create responding content within 2 hours'
  },
  {
    name: 'sentiment_shift',
    trigger: 'Rapid negative sentiment increase',
    description: 'Potential crisis emerging on social media',
    action: 'Prepare crisis response and monitoring'
  },
  {
    name: 'influencer_mention',
    trigger: 'Industry influencer mentions your space',
    description: 'Influencer talking about your industry - engage opportunity',
    action: 'Comment/engage within 1 hour'
  },
  {
    name: 'trending_hashtag',
    trigger: 'Relevant hashtag trending',
    description: 'Hashtag aligned with your narrative is trending',
    action: 'Join conversation with branded content'
  },
  {
    name: 'competitor_crisis',
    trigger: 'Competitor facing social backlash',
    description: 'Competitor experiencing negative social moment',
    action: 'Highlight your differences tactfully'
  }
]

// Enhanced opportunity detection with social data
function detectSocialOpportunities(socialSignals: SocialSignal[], orgProfile: any) {
  const opportunities = []

  // Viral moment detection
  const competitorPosts = socialSignals.filter(s =>
    s.type === 'competitor_post' && s.engagement > 10000
  )
  if (competitorPosts.length > 0) {
    opportunities.push({
      title: `Competitor viral moment: ${competitorPosts[0].content.substring(0, 50)}`,
      score: 85,
      urgency: 'high',
      time_window: '2 hours',
      pattern_matched: 'viral_moment',
      recommended_action: {
        what: {
          primary_action: 'Create counter-narrative content',
          specific_tasks: [
            'Draft social posts highlighting your advantage',
            'Create supporting visual content',
            'Engage with conversations in replies'
          ]
        },
        when: { start_immediately: true }
      }
    })
  }

  // Sentiment shift detection
  const recentSentiment = calculateSentimentTrend(socialSignals, '24h')
  if (recentSentiment.negative_increase > 30) {
    opportunities.push({
      title: 'Negative sentiment spike detected',
      score: 95,
      urgency: 'high',
      time_window: '1 hour',
      pattern_matched: 'sentiment_shift',
      recommended_action: {
        what: {
          primary_action: 'Activate crisis monitoring',
          specific_tasks: [
            'Identify root cause of sentiment shift',
            'Prepare holding statement',
            'Alert executive team'
          ]
        }
      }
    })
  }

  return opportunities
}
```

**Business Value:**
- Real-time social opportunities detected automatically
- Crisis early warning system
- Competitive intelligence from social activity

---

### **4. NIV Content Creation - Social-Aware**

**Location:** `supabase/functions/niv-content-robust/index.ts`

**Current State:**
- Generates content based on user requests
- No social context awareness

**Enhancement:**
```typescript
// Add social context to NIV's understanding

async function enrichContextWithSocial(context: any, orgId: string) {
  // Get recent social intelligence
  const socialContext = await fetch(
    `${SUPABASE_URL}/functions/v1/mcp-social-intelligence`,
    {
      method: 'POST',
      body: JSON.stringify({
        tool: 'get_social_context',
        arguments: {
          organization_id: orgId,
          time_range: '7d'
        }
      })
    }
  )

  const socialData = await socialContext.json()

  return {
    ...context,
    social_intelligence: {
      trending_topics: socialData.trending_topics,
      recent_sentiment: socialData.sentiment_summary,
      competitor_activity: socialData.competitor_highlights,
      influencer_conversations: socialData.influencer_activity
    }
  }
}

// Use in content generation
async function generateSocialPost(userMessage: string, context: any) {
  // Enrich with social context
  const enrichedContext = await enrichContextWithSocial(context, context.organization_id)

  // Pass to Claude with social awareness
  const prompt = `Generate a social post about: ${userMessage}

Social Context:
- Trending: ${enrichedContext.social_intelligence.trending_topics.join(', ')}
- Sentiment: ${enrichedContext.social_intelligence.recent_sentiment}
- Competitors are: ${enrichedContext.social_intelligence.competitor_activity}

Create content that:
1. Aligns with current trending topics
2. Responds to competitive narrative
3. Leverages positive sentiment moments
4. Avoids topics with negative sentiment`

  // Generate content...
}
```

**Business Value:**
- NIV creates socially-aware content
- References current trends and conversations
- Avoids tone-deaf posts during crises
- Competitive positioning based on real-time data

---

### **5. New "Social Intelligence Dashboard" Component**

**Location:** `src/components/modules/SocialIntelligenceModule.tsx` (NEW)

**Purpose:** Dedicated social media intelligence center

**Features:**
```tsx
export default function SocialIntelligenceModule() {
  return (
    <div className="social-intelligence-dashboard">
      {/* Real-time feed of all platforms */}
      <section className="live-feed">
        <h2>Live Social Feed</h2>
        <SocialFeedStream platforms={['twitter', 'linkedin', 'instagram']} />
      </section>

      {/* Sentiment analysis */}
      <section className="sentiment-tracker">
        <h2>Sentiment Analysis</h2>
        <SentimentChart timeRange="7d" />
        <SentimentAlerts />
      </section>

      {/* Competitor tracking */}
      <section className="competitor-watch">
        <h2>Competitor Activity</h2>
        <CompetitorSocialGrid />
      </section>

      {/* Influencer monitoring */}
      <section className="influencer-radar">
        <h2>Influencer Conversations</h2>
        <InfluencerActivityFeed />
      </section>

      {/* Trending topics */}
      <section className="trending-topics">
        <h2>Trending in Your Industry</h2>
        <TrendingTopicsGrid />
      </section>

      {/* Quick actions */}
      <section className="quick-actions">
        <button onClick={() => createSocialOpportunity()}>
          Create Opportunity from Signal
        </button>
        <button onClick={() => openNIVWithSocialContext()}>
          Generate Social Content
        </button>
      </section>
    </div>
  )
}
```

**Add to main navigation:**
```typescript
// src/app/page.tsx
const tabs = [
  { id: 'intelligence', name: 'Intelligence', icon: Brain },
  { id: 'social', name: 'Social Intelligence', icon: Share2 }, // NEW
  { id: 'opportunities', name: 'Opportunities', icon: Target },
  { id: 'plan', name: 'Plan', icon: FileText },
  { id: 'execute', name: 'Execute', icon: Rocket },
  { id: 'memoryvault', name: 'MemoryVault', icon: Database },
]
```

---

## API Routes to Create

### **`/api/social-intelligence` (NEW)**

```typescript
// src/app/api/social-intelligence/route.ts

import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  const body = await req.json()
  const { organization_id, time_range, platforms, query_types } = body

  // Call MCP via edge function
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await supabase.functions.invoke(
    'mcp-social-intelligence',
    {
      body: {
        tool: 'monitor_all_platforms',
        arguments: {
          organization_id,
          time_range,
          platforms,
          query_types
        }
      }
    }
  )

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ signals: data.results })
}
```

---

## MCP Architecture

### **Edge Function: `mcp-social-intelligence`**

**Location:** `supabase/functions/mcp-social-intelligence/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

// MCP Tool Definitions
const TOOLS = [
  {
    name: 'monitor_twitter',
    description: 'Monitor Twitter/X for brand mentions and trends',
    parameters: {
      organization_id: 'string',
      query: 'string',
      time_range: 'enum: 1h, 24h, 7d, 30d'
    }
  },
  {
    name: 'monitor_reddit',
    description: 'Monitor Reddit for brand discussions',
    parameters: {
      organization_id: 'string',
      subreddits: 'string[]',
      time_range: 'enum: 1h, 24h, 7d, 30d'
    }
  },
  {
    name: 'search_linkedin_posts',
    description: 'Search LinkedIn for public posts and discussions',
    parameters: {
      query: 'string',
      time_range: 'enum: 24h, 7d, 30d'
    }
  },
  {
    name: 'search_instagram_public',
    description: 'Search Instagram for public posts and hashtags',
    parameters: {
      hashtag: 'string',
      time_range: 'enum: 24h, 7d, 30d'
    }
  },
  {
    name: 'search_tiktok_trend',
    description: 'Search TikTok for trending content',
    parameters: {
      keyword: 'string',
      time_range: 'enum: 24h, 7d, 30d'
    }
  },
  {
    name: 'search_social_mentions',
    description: 'Search across all platforms for brand mentions',
    parameters: {
      brand: 'string',
      platforms: 'string[]',
      time_range: 'enum: 1h, 24h, 7d, 30d'
    }
  },
  {
    name: 'analyze_sentiment',
    description: 'Analyze sentiment across social signals',
    parameters: {
      signals: 'array'
    }
  },
  {
    name: 'get_social_context',
    description: 'Get summarized social context for content creation',
    parameters: {
      organization_id: 'string',
      time_range: 'enum: 24h, 7d, 30d'
    }
  },
  {
    name: 'monitor_all_platforms',
    description: 'Monitor all platforms simultaneously',
    parameters: {
      organization_id: 'string',
      time_range: 'enum: 1h, 24h, 7d',
      platforms: 'string[]',
      query_types: 'string[]'
    }
  }
]

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { tool, arguments: args } = await req.json()

    console.log(`🔧 Social Intelligence MCP Tool: ${tool}`)

    let result

    switch (tool) {
      case 'monitor_twitter':
        result = await monitorTwitter(args)
        break

      case 'monitor_reddit':
        result = await monitorReddit(args)
        break

      case 'search_linkedin_posts':
      case 'search_instagram_public':
      case 'search_tiktok_trend':
        // All use niv-fireplexity with site-specific search
        result = await searchViaNivFireplexity(tool, args)
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
      JSON.stringify({ success: true, results: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Social Intelligence MCP Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})

// Direct Twitter API
async function monitorTwitter(args: any) {
  const TWITTER_BEARER_TOKEN = Deno.env.get('TWITTER_BEARER_TOKEN')

  const response = await fetch(
    `https://api.twitter.com/2/tweets/search/recent?query=${args.query}`,
    {
      headers: {
        'Authorization': `Bearer ${TWITTER_BEARER_TOKEN}`
      }
    }
  )

  const data = await response.json()

  return data.data.map(tweet => ({
    platform: 'twitter',
    type: 'mention',
    content: tweet.text,
    author: tweet.author_id,
    engagement: tweet.public_metrics?.like_count || 0,
    url: `https://twitter.com/i/web/status/${tweet.id}`,
    timestamp: tweet.created_at
  }))
}

// Direct Reddit API
async function monitorReddit(args: any) {
  const subreddits = args.subreddits.join('+')
  const response = await fetch(
    `https://www.reddit.com/r/${subreddits}/search.json?q=${args.organization_id}&sort=new&t=${args.time_range}`
  )

  const data = await response.json()

  return data.data.children.map(post => ({
    platform: 'reddit',
    type: 'mention',
    content: post.data.title + ' ' + post.data.selftext,
    author: post.data.author,
    engagement: post.data.score,
    url: `https://reddit.com${post.data.permalink}`,
    timestamp: new Date(post.data.created_utc * 1000).toISOString()
  }))
}

// Use niv-fireplexity for scraping-based search
async function searchViaNivFireplexity(tool: string, args: any) {
  const platformMap = {
    'search_linkedin_posts': 'site:linkedin.com',
    'search_instagram_public': 'site:instagram.com',
    'search_tiktok_trend': 'site:tiktok.com'
  }

  const siteFilter = platformMap[tool]
  const query = `${siteFilter} ${args.query || args.hashtag || args.keyword}`

  // Call niv-fireplexity
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
  const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/niv-fireplexity`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query,
        searchMode: 'focused',
        organizationId: args.organization_id || 'default'
      })
    }
  )

  const data = await response.json()

  // Convert to social signal format
  return data.results.map(result => ({
    platform: tool.replace('search_', '').replace('_posts', '').replace('_public', '').replace('_trend', ''),
    type: 'search_result',
    content: result.content,
    url: result.url,
    timestamp: result.published_at || new Date().toISOString(),
    relevance_score: result.relevance_score
  }))
}

// Monitor all platforms simultaneously
async function monitorAllPlatforms(args: any) {
  const { organization_id, time_range, platforms } = args

  const results = []

  // Twitter (if included)
  if (platforms.includes('twitter')) {
    const twitterResults = await monitorTwitter({
      query: organization_id,
      time_range
    })
    results.push(...twitterResults)
  }

  // Reddit (if included)
  if (platforms.includes('reddit')) {
    const redditResults = await monitorReddit({
      organization_id,
      subreddits: ['technology', 'business', 'news'],
      time_range
    })
    results.push(...redditResults)
  }

  // LinkedIn, Instagram, TikTok via Fireplexity
  const scrapePlatforms = platforms.filter(p =>
    ['linkedin', 'instagram', 'tiktok'].includes(p)
  )

  for (const platform of scrapePlatforms) {
    const tool = `search_${platform}_${platform === 'linkedin' ? 'posts' : platform === 'instagram' ? 'public' : 'trend'}`
    const scrapeResults = await searchViaNivFireplexity(tool, {
      query: organization_id,
      time_range,
      organization_id
    })
    results.push(...scrapeResults)
  }

  // Sort by timestamp
  results.sort((a, b) =>
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )

  return results
}

// Get social context for NIV content creation
async function getSocialContext(args: any) {
  const { organization_id, time_range } = args

  // Get all signals
  const signals = await monitorAllPlatforms({
    organization_id,
    time_range,
    platforms: ['twitter', 'reddit', 'linkedin', 'instagram', 'tiktok'],
    query_types: ['mentions', 'trends']
  })

  // Analyze with Claude
  const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')

  const analysisResponse = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: `Analyze these social media signals and provide context for content creation:

${JSON.stringify(signals, null, 2)}

Provide:
1. Trending topics (5 max)
2. Overall sentiment summary
3. Key competitor activity
4. Influencer conversations
5. Content recommendations`
      }]
    })
  })

  const analysis = await analysisResponse.json()

  return {
    trending_topics: extractTrendingTopics(analysis.content[0].text),
    sentiment_summary: extractSentiment(analysis.content[0].text),
    competitor_highlights: extractCompetitorActivity(analysis.content[0].text),
    influencer_activity: extractInfluencerActivity(analysis.content[0].text),
    recommendations: extractRecommendations(analysis.content[0].text)
  }
}
```

---

## Implementation Timeline

### **Week 1: Foundation**
- [ ] Create `mcp-social-intelligence` edge function
- [ ] Implement Twitter/Reddit direct API calls
- [ ] Implement Fireplexity integration for LinkedIn/Instagram/TikTok
- [ ] Test all platform searches

### **Week 2: Intelligence Module Integration**
- [ ] Add Social Signals panel to Intelligence Module
- [ ] Create `/api/social-intelligence` route
- [ ] Wire up real-time feed display
- [ ] Add platform filtering

### **Week 3: Opportunity Detection**
- [ ] Add social signals to Monitor Stage 1
- [ ] Implement social opportunity patterns
- [ ] Test end-to-end flow: Social signal → Opportunity
- [ ] Add social-specific opportunity cards

### **Week 4: NIV & Content Creation**
- [ ] Add social context enrichment to NIV
- [ ] Implement social-aware content generation
- [ ] Create SocialIntelligenceModule component
- [ ] Add to main navigation

### **Week 5: Polish & Launch**
- [ ] Sentiment analysis dashboard
- [ ] Competitor tracking views
- [ ] Influencer monitoring
- [ ] Documentation & training

---

## Success Metrics

**Technical:**
- [ ] All 5 platforms (Twitter, Reddit, LinkedIn, Instagram, TikTok) searchable
- [ ] <5 second response time for social queries
- [ ] 90%+ uptime for social monitoring
- [ ] Social signals appear in Intelligence Module within 1 minute

**Business:**
- [ ] Social opportunities detected daily
- [ ] Sentiment shifts caught within 1 hour
- [ ] Competitor activity tracked across all platforms
- [ ] NIV creates socially-aware content

**User Experience:**
- [ ] Users see real-time social feed
- [ ] One-click opportunity creation from social signals
- [ ] Social context automatically added to content
- [ ] Crisis alerts trigger within 15 minutes

---

## Cost Analysis

**Current Costs:**
- Firecrawl API: ~$399/month (existing)
- Twitter API: ~$100/month (existing)
- Reddit API: Free (existing)

**New Costs:**
- Additional Firecrawl usage: ~$100-200/month (for increased scraping)
- Claude API calls for sentiment analysis: ~$50/month

**Total: ~$550-650/month for comprehensive social intelligence**

**Alternative (Brandwatch): $10,000-50,000/year**

**Savings: ~$9,000-49,000/year** 🎯

---

## Risk Mitigation

1. **Rate Limits:** Implement caching and intelligent query batching
2. **Scraping Failures:** Fallback to Google search if Firecrawl fails
3. **API Changes:** Abstract platform APIs behind MCP interface
4. **Cost Overruns:** Set Firecrawl usage caps and alerts

---

## Next Steps

1. **Review this plan** - Any changes needed?
2. **Create MCP edge function** - Start with Week 1 foundation
3. **Test platform searches** - Verify Fireplexity + direct APIs work
4. **Build Intelligence Module UI** - Add Social Signals panel

**Ready to start implementation?**