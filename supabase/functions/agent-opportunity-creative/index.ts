import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Creative Opportunity Generation Agent
 * Converted from opportunityCreativeAgent.js to Deno/Edge Function
 */
class OpportunityCreativeAgent {
  creativeTechniques = {
    'thought_leadership': {
      approaches: [
        'Contrarian perspective on industry assumptions',
        'Future state vision (3-5 years out)',
        'Cross-industry innovation applications',
        'Research-backed controversial insights',
        'Technology disruption implications'
      ],
      formats: [
        'Executive manifesto series',
        'Industry transformation report',
        'Innovation lab findings',
        'Future of X whitepaper series',
        'Contrarian viewpoint campaign'
      ]
    },
    'competitive_disruption': {
      approaches: [
        'Category redefinition strategy',
        'David vs Goliath narrative',
        'New metric/standard introduction',
        'Customer advocacy uprising',
        'Industry practice challenge'
      ],
      formats: [
        'Comparison campaign',
        'Customer migration program',
        'Industry benchmark study',
        'Competitive switching guide',
        'Market education initiative'
      ]
    },
    'market_creation': {
      approaches: [
        'Blue ocean strategy',
        'Problem reframing',
        'Unserved segment focus',
        'New use case development',
        'Adjacent market entry'
      ],
      formats: [
        'Category creation campaign',
        'Market education series',
        'Use case showcase',
        'Partnership ecosystem launch',
        'Innovation challenge'
      ]
    },
    'crisis_response': {
      approaches: [
        'Proactive transparency strategy',
        'Industry leadership stance',
        'Solution-focused narrative',
        'Stakeholder reassurance',
        'Competitive differentiation in crisis'
      ],
      formats: [
        'CEO statement series',
        'Customer commitment campaign',
        'Industry coalition leadership',
        'Innovation acceleration announcement',
        'Trust-building initiative'
      ]
    },
    'viral_moment': {
      approaches: [
        'Real-time newsjacking',
        'Meme-worthy positioning',
        'Cultural moment alignment',
        'Unexpected brand voice',
        'Community-driven narrative'
      ],
      formats: [
        'Social media takeover',
        'Real-time response campaign',
        'User-generated content drive',
        'Influencer collaboration',
        'Viral challenge creation'
      ]
    }
  }

  async generateCreativeOpportunities(context: any) {
    const { organizationName, strengths, competitorGaps, topicMomentum, industryContext, events } = context

    console.log(`[CreativeAgent] Generating opportunities for ${organizationName}`)

    const opportunities: any[] = []

    // Generate multiple creative approaches
    const thoughtLeadershipOpp = await this.generateThoughtLeadership(context)
    opportunities.push(...thoughtLeadershipOpp)

    const disruptionOpp = await this.generateCompetitiveDisruption(context)
    opportunities.push(...disruptionOpp)

    const marketCreationOpp = await this.generateMarketCreation(context)
    opportunities.push(...marketCreationOpp)

    const trendingOpp = await this.generateTrendingOpportunities(context)
    opportunities.push(...trendingOpp)

    // Rank by impact potential
    return this.rankOpportunities(opportunities)
  }

  async generateThoughtLeadership(context: any) {
    const prompt = `As a creative strategist, generate 2 innovative thought leadership opportunities for ${context.organizationName}.

Context:
- Strengths: ${context.strengths?.join(', ') || 'Not specified'}
- Industry: ${context.industryContext || 'Technology'}
- Competitor Gaps: ${context.competitorGaps?.join(', ') || 'Not specified'}

For each opportunity create:
1. A provocative campaign name that stands out
2. A contrarian or forward-thinking angle that challenges conventional wisdom
3. Content strategy with unexpected formats
4. Specific actions for the next 48 hours
5. Expected impact and metrics

Return as JSON array with this structure:
[
  {
    "title": "Campaign headline",
    "campaign_name": "Memorable campaign name",
    "creative_approach": "The unconventional angle",
    "description": "Why this matters now",
    "urgency": "high",
    "score": 85,
    "formats": ["format1", "format2"],
    "actions": ["action1", "action2"],
    "metrics": ["metric1", "metric2"]
  }
]`

    try {
      const response = await this.callClaude(prompt)
      return response || []
    } catch (error) {
      console.error('Error generating thought leadership:', error)
      return []
    }
  }

  async generateCompetitiveDisruption(context: any) {
    const prompt = `Generate 2 competitive disruption opportunities for ${context.organizationName}.

Competitor Gaps Identified: ${context.competitorGaps?.join(', ') || 'General market'}
Industry Context: ${context.industryContext || 'Technology'}

Create opportunities that:
1. Exploit specific competitor weaknesses
2. Redefine market categories
3. Create David vs Goliath narratives
4. Include viral potential elements

Return as JSON array with campaign_name and creative_approach for each.`

    try {
      const response = await this.callClaude(prompt)
      return response || []
    } catch (error) {
      console.error('Error generating competitive disruption:', error)
      return []
    }
  }

  async generateMarketCreation(context: any) {
    const prompt = `Generate 2 market creation opportunities for ${context.organizationName}.

Strengths: ${context.strengths?.join(', ') || 'Not specified'}
Topic Momentum: ${context.topicMomentum?.map((t: any) => t.topic).join(', ') || 'Current trends'}

Focus on:
1. Blue ocean strategies
2. New category creation
3. Unserved market segments
4. Adjacent market opportunities

Return as JSON array with campaign_name and creative_approach.`

    try {
      const response = await this.callClaude(prompt)
      return response || []
    } catch (error) {
      console.error('Error generating market creation:', error)
      return []
    }
  }

  async generateTrendingOpportunities(context: any) {
    const prompt = `Generate 2 viral/trending opportunities for ${context.organizationName}.

Current Events: ${context.events?.slice(0, 5).map((e: any) => e.description).join('; ') || 'Recent news'}
Topic Momentum: ${context.topicMomentum?.map((t: any) => `${t.topic} (${t.momentum_score})`).join(', ') || 'Trending topics'}

Create opportunities that:
1. Can be executed within 24-48 hours
2. Have viral/meme potential
3. Hijack current conversations
4. Generate immediate buzz

Return as JSON array with campaign_name, creative_approach, and urgency="high".`

    try {
      const response = await this.callClaude(prompt)
      return response || []
    } catch (error) {
      console.error('Error generating trending opportunities:', error)
      return []
    }
  }

  async callClaude(prompt: string) {
    if (!ANTHROPIC_API_KEY) {
      console.error('No Anthropic API key available')
      return []
    }

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 2000,
          temperature: 0.9, // High creativity
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        })
      })

      if (!response.ok) {
        console.error('Claude API error:', response.status)
        return []
      }

      const data = await response.json()
      const content = data.content[0].text

      // Parse JSON from response
      try {
        const jsonMatch = content.match(/\[[^\]]*\]/s)
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0])
        }
      } catch (e) {
        console.error('Failed to parse Claude response as JSON')
      }

      return []
    } catch (error) {
      console.error('Error calling Claude:', error)
      return []
    }
  }

  rankOpportunities(opportunities: any[]) {
    return opportunities.sort((a, b) => {
      // Prioritize by urgency and score
      const urgencyWeight = { high: 3, medium: 2, low: 1 }
      const aWeight = (urgencyWeight[a.urgency as keyof typeof urgencyWeight] || 1) * (a.score || 50)
      const bWeight = (urgencyWeight[b.urgency as keyof typeof urgencyWeight] || 1) * (b.score || 50)
      return bWeight - aWeight
    })
  }

  async generatePureCreativeOpportunities(organizationName: string, industryContext: string) {
    const prompt = `As a visionary PR strategist, generate 5 breakthrough creative opportunities for ${organizationName} in ${industryContext}.

Generate BOLD, UNEXPECTED opportunities that:
1. Challenge industry conventions
2. Create new narratives
3. Have viral potential
4. Position as innovator
5. Can be executed within 30 days

For each provide:
- Campaign name (memorable, trendy)
- Creative approach (unconventional strategy)
- Urgency level
- Expected impact

Return as JSON array.`

    try {
      const response = await this.callClaude(prompt)
      return response || []
    } catch (error) {
      console.error('Error generating pure creative:', error)
      return []
    }
  }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const {
      organizationName,
      strengths,
      competitorGaps,
      topicMomentum,
      industryContext,
      events,
      mode = 'full' // 'full', 'thought_leadership', 'competitive', 'trending', 'pure_creative'
    } = await req.json()

    const agent = new OpportunityCreativeAgent()

    let opportunities = []

    switch(mode) {
      case 'thought_leadership':
        opportunities = await agent.generateThoughtLeadership({
          organizationName, strengths, industryContext, competitorGaps
        })
        break

      case 'competitive':
        opportunities = await agent.generateCompetitiveDisruption({
          organizationName, competitorGaps, industryContext
        })
        break

      case 'trending':
        opportunities = await agent.generateTrendingOpportunities({
          organizationName, events, topicMomentum
        })
        break

      case 'pure_creative':
        opportunities = await agent.generatePureCreativeOpportunities(
          organizationName, industryContext
        )
        break

      default: // 'full'
        opportunities = await agent.generateCreativeOpportunities({
          organizationName,
          strengths,
          competitorGaps,
          topicMomentum,
          industryContext,
          events
        })
    }

    return new Response(
      JSON.stringify({
        success: true,
        opportunities,
        metadata: {
          total: opportunities.length,
          organization: organizationName,
          mode,
          timestamp: new Date().toISOString()
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Agent error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        opportunities: []
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})