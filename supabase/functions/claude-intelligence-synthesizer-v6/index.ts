// Claude Intelligence Synthesizer V6 - PR Impact Analysis
// Analyzes all intelligence through the lens of PR impact on YOUR organization

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')

// PR Impact Analyst - focuses on how everything affects YOUR organization's PR
const PR_IMPACT_ANALYST = {
  name: "PR Impact Analyst",
  role: "Analyze all intelligence through PR impact lens",
  system_prompt: `You are a PR impact analyst for the user's organization. Your job is to analyze ALL intelligence through the lens of how it impacts THEIR PR strategy, narrative control, and media positioning.

CRITICAL INSTRUCTIONS:
1. Return ONLY valid JSON, no explanatory text
2. Your response must start with { and end with }
3. Analyze everything from the perspective of PR impact on the user's organization
4. Be specific about whether impacts are positive or negative for them
5. Identify PR opportunities and threats

For every piece of intelligence, consider:
- How does this affect our narrative?
- Does this create PR opportunities we can leverage?
- Does this pose PR threats we need to counter?
- How does this shift media attention (toward or away from us)?
- What PR actions does this suggest (but don't make recommendations)?`
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
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        temperature: 0.3,
        system: PR_IMPACT_ANALYST.system_prompt,
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
      return getFallbackStructure()
    }
  } catch (error) {
    console.error('Claude analysis error:', error)
    throw error
  }
}

function getFallbackStructure() {
  return {
    narrative_landscape: {
      current_position: "Unable to analyze",
      narrative_control: "unknown",
      attention_flow: "neutral",
      key_developments: []
    },
    competitive_dynamics: {
      pr_positioning: "Unable to analyze",
      narrative_threats: [],
      narrative_opportunities: []
    },
    stakeholder_sentiment: {
      overall_trajectory: "neutral",
      pr_implications: "Unable to analyze",
      sentiment_drivers: []
    },
    media_momentum: {
      coverage_trajectory: "neutral",
      narrative_alignment: "unknown",
      pr_leverage_points: []
    },
    strategic_signals: {
      regulatory_implications: "Unable to analyze",
      industry_narrative_shifts: [],
      pr_action_triggers: []
    }
  }
}

async function synthesizeIntelligence(intelligenceData: any) {
  console.log('🎯 Starting V6 PR Impact Analysis')
  
  const orgName = intelligenceData.organization || 'the organization'
  
  const prompt = `Analyze this intelligence data specifically for how it impacts ${orgName}'s PR position and narrative control.

CRITICAL: Return ONLY valid JSON. Focus on PR impact for ${orgName}.

For EVERY piece of intelligence, analyze:
1. How it affects ${orgName}'s narrative position
2. Whether it's a PR opportunity or threat for ${orgName}
3. How it shifts media attention (toward or away from ${orgName})
4. What narrative dynamics are changing for ${orgName}

Structure your analysis into these PR-focused categories:

1. NARRATIVE LANDSCAPE - How ${orgName}'s story fits in current environment
   - Where does ${orgName} stand in the current narrative?
   - Who controls the dominant narrative?
   - Is attention flowing toward or away from ${orgName}?

2. COMPETITIVE DYNAMICS - PR positioning vs competitors
   - How are competitors' PR moves affecting ${orgName}?
   - What narrative space are competitors claiming?
   - Where are the PR opportunities from competitor actions?

3. STAKEHOLDER SENTIMENT - How key audiences are moving
   - What's the sentiment trajectory for ${orgName}?
   - What's driving positive/negative sentiment?
   - Which stakeholder groups need PR attention?

4. MEDIA MOMENTUM - Coverage patterns and opportunities
   - Is media coverage favorable or unfavorable for ${orgName}?
   - What topics beneficial to ${orgName} are gaining traction?
   - Where are the PR amplification opportunities?

5. STRATEGIC SIGNALS - Regulatory/industry shifts affecting PR
   - How do regulatory movements impact ${orgName}'s narrative?
   - What industry trends create PR opportunities/threats?
   - What early signals suggest future PR challenges?

Return ONLY this JSON structure:
{
  "narrative_landscape": {
    "current_position": "Where org stands in current narrative environment",
    "narrative_control": "strong/contested/weak",
    "attention_flow": "toward_us/neutral/away_from_us",
    "key_developments": [
      {
        "development": "What happened",
        "pr_impact": "positive/negative/neutral",
        "impact_description": "How this affects our PR position",
        "source": "Where this came from"
      }
    ]
  },
  "competitive_dynamics": {
    "pr_positioning": "How we compare in PR terms",
    "narrative_threats": [
      {
        "competitor": "Who",
        "threat": "What they're doing",
        "pr_impact": "How it affects our narrative",
        "urgency": "high/medium/low"
      }
    ],
    "narrative_opportunities": [
      {
        "opportunity": "What we can leverage",
        "trigger": "What created this opportunity",
        "pr_value": "high/medium/low",
        "timing": "immediate/short-term/long-term"
      }
    ]
  },
  "stakeholder_sentiment": {
    "overall_trajectory": "improving/stable/declining",
    "pr_implications": "What this means for our PR",
    "sentiment_drivers": [
      {
        "stakeholder_group": "Who",
        "sentiment": "positive/neutral/negative",
        "trending": "up/stable/down",
        "pr_priority": "high/medium/low",
        "key_concerns": ["concern1", "concern2"]
      }
    ]
  },
  "media_momentum": {
    "coverage_trajectory": "increasing_positive/stable/increasing_negative",
    "narrative_alignment": "aligned/mixed/misaligned",
    "pr_leverage_points": [
      {
        "topic": "What's trending",
        "relevance_to_us": "How it connects to our narrative",
        "momentum": "building/peak/declining",
        "pr_opportunity": "How we can use this"
      }
    ]
  },
  "strategic_signals": {
    "regulatory_implications": "How regulatory trends affect our PR",
    "industry_narrative_shifts": [
      {
        "shift": "What's changing",
        "pr_impact": "positive/negative",
        "preparation_needed": "What PR prep this requires"
      }
    ],
    "pr_action_triggers": [
      {
        "signal": "What we're seeing",
        "pr_implication": "What this means for PR",
        "response_urgency": "immediate/monitor/future"
      }
    ]
  }
}`

  try {
    const analysis = await analyzeWithClaude(prompt, intelligenceData)
    
    // Ensure we have all required sections with proper defaults
    const result = {
      narrative_landscape: analysis.narrative_landscape || {
        current_position: "Analyzing narrative position",
        narrative_control: "contested",
        attention_flow: "neutral",
        key_developments: []
      },
      competitive_dynamics: analysis.competitive_dynamics || {
        pr_positioning: "Competitive analysis in progress",
        narrative_threats: [],
        narrative_opportunities: []
      },
      stakeholder_sentiment: analysis.stakeholder_sentiment || {
        overall_trajectory: "stable",
        pr_implications: "Monitoring stakeholder sentiment",
        sentiment_drivers: []
      },
      media_momentum: analysis.media_momentum || {
        coverage_trajectory: "stable",
        narrative_alignment: "mixed",
        pr_leverage_points: []
      },
      strategic_signals: analysis.strategic_signals || {
        regulatory_implications: "Monitoring regulatory environment",
        industry_narrative_shifts: [],
        pr_action_triggers: []
      }
    }
    
    return {
      success: true,
      analysis: result,
      metadata: {
        version: 'v6-pr-impact',
        organization: orgName,
        timestamp: new Date().toISOString(),
        focus: 'PR impact on your organization',
        data_sources: countDataSources(intelligenceData)
      }
    }
  } catch (error) {
    console.error('Synthesis error:', error)
    return {
      success: false,
      error: error.message,
      analysis: getFallbackStructure()
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
    
    console.log('🎯 Processing intelligence for V6 PR Impact Analysis')
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
    console.error('❌ V6 Synthesis error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        analysis: getFallbackStructure()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  }
})