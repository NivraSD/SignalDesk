// Claude Intelligence Synthesizer V5 - Pure Analytical Intelligence
// Focuses on analyzing and categorizing data without recommendations

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')

// Single analytical persona - no recommendations
const INTELLIGENCE_ANALYST = {
  name: "Intelligence Analyst",
  role: "Analyze and categorize intelligence data into structured insights",
  system_prompt: `You are an intelligence analyst. Your job is to analyze raw data and organize it into structured analytical categories. 

You DO NOT make strategic recommendations or tell companies what to do.
You DO NOT provide advice or suggestions.
You ONLY analyze what IS happening based on the data provided.

Your analysis should be:
- Factual and data-driven
- Temporally organized (what happened when)
- Source-attributed (where did this information come from)
- Quantitative where possible (counts, percentages, trends)
- Comparative (how does this compare to competitors or baseline)

Focus on extracting:
- Key events and announcements
- Patterns in the data
- Sentiment analysis from social sources
- Competitive movements
- Industry trends
- Media coverage patterns`
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
      throw new Error(`Claude API error: ${response.status}`)
    }

    const result = await response.json()
    return JSON.parse(result.content[0].text)
  } catch (error) {
    console.error('Claude analysis error:', error)
    throw error
  }
}

async function synthesizeIntelligence(intelligenceData: any) {
  console.log('🧠 Starting V5 Analytical Intelligence Synthesis')
  
  const prompt = `Analyze the provided intelligence data and organize it into these 5 analytical categories:

1. MARKET ACTIVITY - What's happening in the market right now
   - Recent news and announcements
   - Market movements and events
   - Breaking developments
   - Include: total article count, time range, key events

2. COMPETITOR INTELLIGENCE - Specific competitor actions
   - Competitor announcements and moves
   - Product launches
   - Leadership changes
   - Partnerships
   - Include: competitors identified, number of actions tracked

3. SOCIAL PULSE - Public sentiment and discussions
   - Reddit sentiment breakdown (positive/neutral/negative counts)
   - Twitter engagement metrics
   - Trending topics and discussions
   - Community feedback themes
   - Include: total posts analyzed, sentiment percentages

4. INDUSTRY SIGNALS - Broader industry patterns
   - Hiring trends (job posting counts)
   - Technology adoption patterns
   - Investment activities
   - Regulatory changes
   - Include: quantitative indicators where available

5. MEDIA COVERAGE - How organization is being covered
   - Press coverage volume
   - Coverage sentiment
   - Key narratives in media
   - Share of voice vs competitors
   - Include: article count, source diversity

For each category, provide:
- A brief factual summary (1-2 sentences)
- Key findings (3-5 bullet points with source attribution)
- Relevant statistics and metrics
- Temporal context (when things happened)

Return a JSON object with this exact structure:
{
  "market_activity": {
    "summary": "string",
    "statistics": {
      "total_articles": number,
      "sources": number,
      "time_range": "string"
    },
    "key_findings": [
      {
        "finding": "string",
        "source": "string",
        "timestamp": "string",
        "category": "string"
      }
    ]
  },
  "competitor_intelligence": {
    "summary": "string",
    "competitors_tracked": ["string"],
    "total_actions": number,
    "movements": [
      {
        "competitor": "string",
        "action": "string",
        "source": "string",
        "timestamp": "string"
      }
    ]
  },
  "social_pulse": {
    "summary": "string",
    "sentiment_breakdown": {
      "positive": number,
      "neutral": number,
      "negative": number
    },
    "total_posts": number,
    "trending_topics": ["string"],
    "key_discussions": [
      {
        "topic": "string",
        "sentiment": "string",
        "engagement": number,
        "platform": "string"
      }
    ]
  },
  "industry_signals": {
    "summary": "string",
    "indicators": [
      {
        "signal": "string",
        "metric": "string",
        "trend": "string",
        "source": "string"
      }
    ],
    "hiring_activity": {
      "total_postings": number,
      "growth_rate": "string"
    }
  },
  "media_coverage": {
    "summary": "string",
    "coverage_volume": number,
    "source_count": number,
    "sentiment_trend": "string",
    "top_narratives": [
      {
        "narrative": "string",
        "frequency": number,
        "sources": ["string"]
      }
    ]
  }
}

IMPORTANT: 
- Do NOT include any recommendations or suggestions
- Do NOT tell the organization what they should do
- ONLY report what the data shows
- Use actual numbers from the data
- Attribute findings to specific sources`

  try {
    const analysis = await analyzeWithClaude(prompt, intelligenceData)
    
    // Ensure we have all required sections
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
        summary: "No social data available",
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
    rss: 0
  }
  
  if (data.raw_intelligence) {
    if (data.raw_intelligence['news-intelligence']?.totalArticles) {
      sources.news = data.raw_intelligence['news-intelligence'].totalArticles
    }
    if (data.raw_intelligence['reddit-intelligence']?.totalDiscussions) {
      sources.reddit = data.raw_intelligence['reddit-intelligence'].totalDiscussions
    }
    if (data.raw_intelligence['twitter-intelligence']?.totalTweets) {
      sources.twitter = data.raw_intelligence['twitter-intelligence'].totalTweets
    }
    if (data.raw_intelligence['google-intelligence']?.totalResults) {
      sources.google = data.raw_intelligence['google-intelligence'].totalResults
    }
    if (data.raw_intelligence['pr-intelligence']?.releases?.length) {
      sources.pr = data.raw_intelligence['pr-intelligence'].releases.length
    }
    if (data.raw_intelligence['scraper-intelligence']?.websites_scraped) {
      sources.scraper = data.raw_intelligence['scraper-intelligence'].websites_scraped
    }
  }
  
  return sources
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  try {
    const { intelligence } = await req.json()
    
    if (!intelligence) {
      throw new Error('No intelligence data provided')
    }
    
    console.log('📊 Received intelligence for V5 analytical synthesis')
    
    const result = await synthesizeIntelligence(intelligence)
    
    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error('V5 Synthesizer error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        analysis: null
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})