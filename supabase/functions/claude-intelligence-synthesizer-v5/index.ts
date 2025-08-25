// Claude Intelligence Synthesizer V5 - Pure Analytical Intelligence
// No recommendations, just analysis of what IS happening

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')

// Single analytical persona - no recommendations
const INTELLIGENCE_ANALYST = {
  name: "Intelligence Analyst",
  role: "Analyze and categorize intelligence data into structured insights",
  system_prompt: `You are an intelligence analyst that outputs ONLY valid JSON.

CRITICAL INSTRUCTIONS:
1. Return ONLY a valid JSON object
2. Do NOT include any text before or after the JSON
3. Do NOT start with "Here is" or "Based on" or any explanatory text
4. Your response must start with { and end with }
5. The JSON must be valid and parseable

You DO NOT make strategic recommendations or tell companies what to do.
You ONLY analyze what IS happening based on the data provided.

Your analysis should be:
- Factual and data-driven
- Temporally organized (what happened when)
- Source-attributed (where did this information come from)
- Quantitative where possible (counts, percentages, trends)
- Comparative (how does this compare to competitors or baseline)`
}

async function analyzeWithClaude(prompt: string, data: any) {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 3000,
        temperature: 0.3,
        system: INTELLIGENCE_ANALYST.system_prompt,
        messages: [{
          role: 'user',
          content: prompt + '\n\nData to analyze:\n' + JSON.stringify(data, null, 2)
        }]
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Claude API error:', response.status, errorText)
      throw new Error(`Claude API error: ${response.status}`)
    }

    const result = await response.json()
    let content = result.content[0].text
    
    // Clean up Claude's response to extract JSON
    content = content.trim()
    
    // Remove common prefixes
    const prefixes = ['Here is', 'Here\'s', 'Based on', 'The analysis', 'Below is']
    for (const prefix of prefixes) {
      if (content.toLowerCase().startsWith(prefix.toLowerCase())) {
        const jsonStart = content.indexOf('{')
        if (jsonStart !== -1) {
          content = content.substring(jsonStart)
        }
      }
    }
    
    // Remove markdown code blocks
    if (content.includes('```json')) {
      content = content.replace(/```json\s*/g, '').replace(/```/g, '')
    } else if (content.includes('```')) {
      content = content.replace(/```\s*/g, '')
    }
    
    // Find JSON boundaries
    const firstBrace = content.indexOf('{')
    const lastBrace = content.lastIndexOf('}')
    if (firstBrace !== -1 && lastBrace !== -1) {
      content = content.substring(firstBrace, lastBrace + 1)
    }
    
    try {
      return JSON.parse(content)
    } catch (parseError) {
      console.error('Failed to parse Claude response:', content.substring(0, 500))
      // Return a fallback structure
      return {
        market_activity: {
          summary: "Unable to parse intelligence data",
          statistics: { total_articles: 0, sources: 0, time_range: "N/A" },
          key_findings: []
        },
        competitor_intelligence: {
          summary: "Unable to parse intelligence data",
          competitors_tracked: [],
          total_actions: 0,
          movements: []
        },
        social_pulse: {
          summary: "Unable to parse intelligence data",
          sentiment_breakdown: { positive: 0, neutral: 0, negative: 0 },
          total_posts: 0,
          trending_topics: [],
          key_discussions: []
        },
        industry_signals: {
          summary: "Unable to parse intelligence data",
          indicators: [],
          hiring_activity: { total_postings: 0, growth_rate: "N/A" }
        },
        media_coverage: {
          summary: "Unable to parse intelligence data",
          coverage_volume: 0,
          source_count: 0,
          sentiment_trend: "neutral",
          top_narratives: []
        }
      }
    }
  } catch (error) {
    console.error('Claude analysis error:', error)
    throw error
  }
}

async function synthesizeIntelligence(intelligenceData: any) {
  console.log('🧠 Starting V5 Analytical Intelligence Synthesis')
  
  const prompt = `Analyze the provided intelligence data and organize it into these 5 analytical categories.

REMEMBER: Return ONLY valid JSON, no text before or after.

1. MARKET ACTIVITY - What's happening in the market right now
   - Recent news and announcements
   - Market movements and events
   - Breaking developments

2. COMPETITOR INTELLIGENCE - Specific competitor actions
   - Competitor announcements and moves
   - Product launches
   - Leadership changes
   - Partnerships

3. SOCIAL PULSE - Public sentiment and discussions
   - Reddit sentiment breakdown
   - Twitter engagement metrics
   - Trending topics and discussions
   - Community feedback themes

4. INDUSTRY SIGNALS - Broader industry patterns
   - Hiring trends
   - Technology adoption patterns
   - Investment activities
   - Regulatory changes

5. MEDIA COVERAGE - How organization is being covered
   - Press coverage volume
   - Coverage sentiment
   - Key narratives in media
   - Share of voice vs competitors

Return ONLY this JSON structure (no other text):
{
  "market_activity": {
    "summary": "Brief factual summary of market activity",
    "statistics": {
      "total_articles": 0,
      "sources": 0,
      "time_range": "last 7 days"
    },
    "key_findings": [
      {
        "finding": "What happened",
        "source": "Where it came from",
        "timestamp": "When it happened",
        "category": "Type of event"
      }
    ]
  },
  "competitor_intelligence": {
    "summary": "Brief summary of competitor activities",
    "competitors_tracked": ["Company1", "Company2"],
    "total_actions": 0,
    "movements": [
      {
        "competitor": "Company name",
        "action": "What they did",
        "source": "Where reported",
        "timestamp": "When"
      }
    ]
  },
  "social_pulse": {
    "summary": "Brief summary of social sentiment",
    "sentiment_breakdown": {
      "positive": 0,
      "neutral": 0,
      "negative": 0
    },
    "total_posts": 0,
    "trending_topics": ["topic1", "topic2"],
    "key_discussions": [
      {
        "topic": "Discussion topic",
        "sentiment": "positive/neutral/negative",
        "engagement": 0,
        "platform": "reddit/twitter"
      }
    ]
  },
  "industry_signals": {
    "summary": "Brief summary of industry trends",
    "indicators": [
      {
        "signal": "What's happening",
        "metric": "Quantitative measure",
        "trend": "up/down/stable",
        "source": "Data source"
      }
    ],
    "hiring_activity": {
      "total_postings": 0,
      "growth_rate": "percentage or N/A"
    }
  },
  "media_coverage": {
    "summary": "Brief summary of media coverage",
    "coverage_volume": 0,
    "source_count": 0,
    "sentiment_trend": "positive/neutral/negative",
    "top_narratives": [
      {
        "narrative": "Key story theme",
        "frequency": 0,
        "sources": ["source1", "source2"]
      }
    ]
  }
}`

  try {
    const analysis = await analyzeWithClaude(prompt, intelligenceData)
    
    // Ensure we have all required sections with proper defaults
    const result = {
      market_activity: analysis.market_activity || {
        summary: "No market activity data available",
        statistics: { total_articles: 0, sources: 0, time_range: "N/A" },
        key_findings: []
      },
      competitor_intelligence: analysis.competitor_intelligence || {
        summary: "No competitor data available",
        competitors_tracked: [],
        total_actions: 0,
        movements: []
      },
      social_pulse: analysis.social_pulse || {
        summary: "No social media data available",
        sentiment_breakdown: { positive: 0, neutral: 0, negative: 0 },
        total_posts: 0,
        trending_topics: [],
        key_discussions: []
      },
      industry_signals: analysis.industry_signals || {
        summary: "No industry signals detected",
        indicators: [],
        hiring_activity: { total_postings: 0, growth_rate: "N/A" }
      },
      media_coverage: analysis.media_coverage || {
        summary: "No media coverage data available",
        coverage_volume: 0,
        source_count: 0,
        sentiment_trend: "neutral",
        top_narratives: []
      }
    }
    
    return {
      success: true,
      analysis: result,
      metadata: {
        version: 'v5-analytical',
        timestamp: new Date().toISOString(),
        data_sources: countDataSources(intelligenceData)
      }
    }
  } catch (error) {
    console.error('Synthesis error:', error)
    return {
      success: false,
      error: error.message,
      analysis: null
    }
  }
}

function countDataSources(data: any): any {
  const sources = {
    news: 0,
    reddit: 0,
    twitter: 0,
    google: 0,
    pr: 0,
    scraper: 0,
    rss: 0,
    yahoo_finance: 0
  }
  
  // Count sources from the raw intelligence data
  if (data.raw_intelligence) {
    if (data.raw_intelligence['news-intelligence']) sources.news = 1
    if (data.raw_intelligence['reddit-intelligence']) sources.reddit = 1
    if (data.raw_intelligence['twitter-intelligence']) sources.twitter = 1
    if (data.raw_intelligence['google-intelligence']) sources.google = 1
    if (data.raw_intelligence['pr-intelligence']) sources.pr = 1
    if (data.raw_intelligence['scraper-intelligence']) sources.scraper = 1
    if (data.raw_intelligence['rss-proxy']) sources.rss = 1
    if (data.raw_intelligence['yahoo-finance-intelligence']) sources.yahoo_finance = 1
  }
  
  return sources
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { intelligence } = await req.json()
    
    if (!intelligence) {
      throw new Error('Intelligence data is required')
    }
    
    console.log('📊 Processing intelligence for V5 synthesis')
    console.log(`   Organization: ${intelligence.organization}`)
    console.log(`   Data sources: ${Object.keys(intelligence.raw_intelligence || {}).length}`)
    
    const result = await synthesizeIntelligence(intelligence)
    
    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error('❌ V5 Synthesis error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        analysis: null
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  }
})