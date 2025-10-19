import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Topic Momentum Agent Network
 * Converted from topicMomentumAgents.js to Deno/Edge Function
 */

interface Topic {
  name: string
  keywords?: string[]
  context?: string
}

interface CompetitorData {
  name: string
  industry?: string
  strengths?: string[]
}

interface MomentumAnalysis {
  topic: string
  momentum_score: number
  trending_direction: 'up' | 'down' | 'stable'
  competitive_advantage: string
  opportunity_window: string
  recommended_actions: string[]
  evidence: any[]
}

class TopicMomentumCoordinator {
  private agents: {
    competitiveAnalyst: CompetitivePositioningAgent
    trendAnalyst: TrendAnalysisAgent
    marketDynamics: MarketDynamicsAgent
    synthesizer: SynthesisAgent
  }

  constructor() {
    this.agents = {
      competitiveAnalyst: new CompetitivePositioningAgent(),
      trendAnalyst: new TrendAnalysisAgent(),
      marketDynamics: new MarketDynamicsAgent(),
      synthesizer: new SynthesisAgent()
    }
  }

  async analyzeTopicMomentum(
    organizationName: string,
    topics: Topic[],
    competitors: CompetitorData[]
  ): Promise<MomentumAnalysis[]> {
    console.log(`[Coordinator] Starting momentum analysis for ${topics.length} topics`)

    const analyses: MomentumAnalysis[] = []

    for (const topic of topics) {
      console.log(`[Coordinator] Analyzing topic: ${topic.name}`)

      // Deploy agents in parallel for efficiency
      const [competitiveAnalysis, trendAnalysis, marketAnalysis] = await Promise.all([
        this.agents.competitiveAnalyst.analyze(topic, competitors),
        this.agents.trendAnalyst.analyze(topic, organizationName),
        this.agents.marketDynamics.analyze(topic, organizationName)
      ])

      // Synthesize all analyses
      const synthesizedAnalysis = await this.agents.synthesizer.synthesize({
        topic,
        competitiveAnalysis,
        trendAnalysis,
        marketAnalysis,
        organizationName
      })

      analyses.push(synthesizedAnalysis)
    }

    return analyses
  }
}

class CompetitivePositioningAgent {
  private knowledgeBase: Record<string, Record<string, any>> = {
    // Tech industry competitors
    'OpenAI': {
      'AI Safety': { strength: 'strong', evidence: 'Leading voice in AI alignment research' },
      'LLM Development': { strength: 'strong', evidence: 'GPT series, ChatGPT market leader' },
      'Enterprise AI': { strength: 'moderate', evidence: 'Growing enterprise offerings' }
    },
    'Google': {
      'AI Safety': { strength: 'moderate', evidence: 'DeepMind safety research' },
      'LLM Development': { strength: 'strong', evidence: 'Gemini, PaLM, Bard' },
      'Enterprise AI': { strength: 'strong', evidence: 'Cloud AI platform, Vertex AI' }
    },
    'Microsoft': {
      'AI Safety': { strength: 'moderate', evidence: 'Responsible AI initiatives' },
      'LLM Development': { strength: 'strong', evidence: 'Partnership with OpenAI, Copilot' },
      'Enterprise AI': { strength: 'strong', evidence: 'Azure AI, Office integration' }
    }
  }

  async analyze(topic: Topic, competitors: CompetitorData[]) {
    const analysis = {
      topic: topic.name,
      competitive_landscape: [] as any[],
      market_gaps: [] as string[],
      differentiation_opportunities: [] as string[]
    }

    // Check knowledge base for known competitor data
    for (const competitor of competitors) {
      const competitorData = this.knowledgeBase[competitor.name]
      if (competitorData && competitorData[topic.name]) {
        analysis.competitive_landscape.push({
          name: competitor.name,
          ...competitorData[topic.name]
        })
      } else {
        // Generate analysis using AI for unknown competitors
        const aiAnalysis = await this.generateCompetitorAnalysis(topic, competitor)
        analysis.competitive_landscape.push(aiAnalysis)
      }
    }

    // Identify market gaps
    analysis.market_gaps = this.identifyMarketGaps(analysis.competitive_landscape)
    analysis.differentiation_opportunities = this.findDifferentiation(topic, analysis.competitive_landscape)

    return analysis
  }

  private async generateCompetitorAnalysis(topic: Topic, competitor: CompetitorData) {
    const prompt = `Analyze ${competitor.name}'s position on ${topic.name}:
1. Current strength (weak/moderate/strong)
2. Recent activities or announcements
3. Key vulnerabilities
Return as JSON with fields: strength, evidence, vulnerabilities`

    try {
      const response = await callClaude(prompt, 0.7)
      return {
        name: competitor.name,
        ...response
      }
    } catch {
      return {
        name: competitor.name,
        strength: 'unknown',
        evidence: 'Analysis unavailable'
      }
    }
  }

  private identifyMarketGaps(landscape: any[]): string[] {
    const gaps = []

    // Look for areas where all competitors are weak
    const weakAreas = landscape.filter(c => c.strength === 'weak' || c.strength === 'unknown')
    if (weakAreas.length > landscape.length * 0.5) {
      gaps.push('Market leadership opportunity - most competitors weak')
    }

    // Look for unaddressed segments
    if (!landscape.some(c => c.evidence?.includes('consumer'))) {
      gaps.push('Consumer market potentially underserved')
    }

    if (!landscape.some(c => c.evidence?.includes('SMB'))) {
      gaps.push('SMB segment opportunity')
    }

    return gaps
  }

  private findDifferentiation(topic: Topic, landscape: any[]): string[] {
    const opportunities = []

    // Speed to market
    if (landscape.every(c => c.strength !== 'strong')) {
      opportunities.push('First-mover advantage possible')
    }

    // Unique angle
    opportunities.push('Focus on ethical/responsible approach')
    opportunities.push('Open-source alternative positioning')
    opportunities.push('Community-driven development')

    return opportunities
  }
}

class TrendAnalysisAgent {
  async analyze(topic: Topic, organizationName: string) {
    const prompt = `Analyze momentum trends for "${topic.name}" in context of ${organizationName}:

1. Current trend direction (rising/stable/declining)
2. Momentum score (1-100)
3. Key drivers of momentum
4. Time window for action (urgent/medium/long-term)
5. Media attention level

Return as JSON with fields: direction, momentum_score, drivers, time_window, media_attention`

    try {
      const response = await callClaude(prompt, 0.7)
      return {
        topic: topic.name,
        ...response,
        analysis_timestamp: new Date().toISOString()
      }
    } catch {
      return {
        topic: topic.name,
        direction: 'stable',
        momentum_score: 50,
        drivers: ['General market interest'],
        time_window: 'medium',
        media_attention: 'moderate'
      }
    }
  }
}

class MarketDynamicsAgent {
  async analyze(topic: Topic, organizationName: string) {
    const prompt = `Analyze market dynamics for "${topic.name}" relevant to ${organizationName}:

1. Market size and growth potential
2. Customer demand signals
3. Regulatory environment
4. Investment activity
5. Partnership opportunities

Return as JSON with fields: market_size, growth_rate, demand_signals, regulatory_status, investment_level, partnerships`

    try {
      const response = await callClaude(prompt, 0.7)
      return {
        topic: topic.name,
        ...response
      }
    } catch {
      return {
        topic: topic.name,
        market_size: 'unknown',
        growth_rate: 'moderate',
        demand_signals: ['General interest'],
        regulatory_status: 'stable',
        investment_level: 'moderate',
        partnerships: []
      }
    }
  }
}

class SynthesisAgent {
  async synthesize(data: any): Promise<MomentumAnalysis> {
    const { topic, competitiveAnalysis, trendAnalysis, marketAnalysis, organizationName } = data

    // Calculate overall momentum score
    const momentumScore = this.calculateMomentumScore(trendAnalysis, marketAnalysis)

    // Determine trending direction
    const trendingDirection = trendAnalysis.direction || 'stable'

    // Identify competitive advantage
    const competitiveAdvantage = this.identifyAdvantage(competitiveAnalysis, organizationName)

    // Determine opportunity window
    const opportunityWindow = this.determineWindow(trendAnalysis, marketAnalysis)

    // Generate recommended actions
    const recommendedActions = this.generateActions(
      competitiveAnalysis,
      trendAnalysis,
      marketAnalysis,
      organizationName
    )

    return {
      topic: topic.name,
      momentum_score: momentumScore,
      trending_direction: trendingDirection as 'up' | 'down' | 'stable',
      competitive_advantage: competitiveAdvantage,
      opportunity_window: opportunityWindow,
      recommended_actions: recommendedActions,
      evidence: [
        competitiveAnalysis,
        trendAnalysis,
        marketAnalysis
      ]
    }
  }

  private calculateMomentumScore(trend: any, market: any): number {
    let score = trend.momentum_score || 50

    // Adjust based on market signals
    if (market.growth_rate === 'high') score += 15
    if (market.growth_rate === 'low') score -= 15

    if (market.investment_level === 'high') score += 10
    if (market.demand_signals?.length > 2) score += 10

    return Math.min(100, Math.max(0, score))
  }

  private identifyAdvantage(competitive: any, org: string): string {
    const gaps = competitive.market_gaps || []
    const opportunities = competitive.differentiation_opportunities || []

    if (gaps.length > 0) {
      return `Market gap opportunity: ${gaps[0]}`
    }

    if (opportunities.length > 0) {
      return `Differentiation opportunity: ${opportunities[0]}`
    }

    return 'Competitive parity - focus on execution excellence'
  }

  private determineWindow(trend: any, market: any): string {
    if (trend.time_window === 'urgent' || trend.momentum_score > 80) {
      return '24-48 hours - immediate action required'
    }

    if (market.growth_rate === 'high') {
      return '1 week - capitalize on growth'
    }

    return '2-4 weeks - strategic positioning'
  }

  private generateActions(competitive: any, trend: any, market: any, org: string): string[] {
    const actions = []

    // High momentum actions
    if (trend.momentum_score > 70) {
      actions.push('Launch immediate PR campaign to ride momentum')
      actions.push('Publish thought leadership content within 48 hours')
    }

    // Competitive positioning actions
    if (competitive.market_gaps?.length > 0) {
      actions.push('Announce solution addressing market gap')
      actions.push('Create comparison content vs competitors')
    }

    // Market opportunity actions
    if (market.growth_rate === 'high') {
      actions.push('Accelerate product development in this area')
      actions.push('Form strategic partnerships')
    }

    // Always include measurement
    actions.push('Set up monitoring dashboard for ongoing tracking')

    return actions
  }
}

// Helper function to call Claude
async function callClaude(prompt: string, temperature: number = 0.8) {
  if (!ANTHROPIC_API_KEY) {
    throw new Error('No Anthropic API key')
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1500,
      temperature,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })
  })

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.status}`)
  }

  const data = await response.json()
  const content = data.content[0].text

  try {
    const jsonMatch = content.match(/\{[^}]*\}/s)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
  } catch {
    // Return raw content if not JSON
    return { raw_response: content }
  }

  return {}
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const {
      organizationName,
      topics = [],
      competitors = [],
      mode = 'full' // 'full', 'quick', 'competitive_only', 'trend_only'
    } = await req.json()

    if (!organizationName) {
      throw new Error('organizationName is required')
    }

    if (topics.length === 0) {
      throw new Error('At least one topic is required')
    }

    const coordinator = new TopicMomentumCoordinator()

    let analyses: MomentumAnalysis[] = []

    switch(mode) {
      case 'competitive_only':
        // Only run competitive analysis
        for (const topic of topics) {
          const competitive = await coordinator.agents.competitiveAnalyst.analyze(topic, competitors)
          analyses.push({
            topic: topic.name,
            momentum_score: 50,
            trending_direction: 'stable',
            competitive_advantage: competitive.differentiation_opportunities?.[0] || 'Analysis pending',
            opportunity_window: '1 week',
            recommended_actions: ['Monitor competitor moves', 'Prepare response strategy'],
            evidence: [competitive]
          })
        }
        break

      case 'trend_only':
        // Only run trend analysis
        for (const topic of topics) {
          const trend = await coordinator.agents.trendAnalyst.analyze(topic, organizationName)
          analyses.push({
            topic: topic.name,
            momentum_score: trend.momentum_score || 50,
            trending_direction: trend.direction || 'stable',
            competitive_advantage: 'Trend-based positioning',
            opportunity_window: trend.time_window || '1 week',
            recommended_actions: ['Capitalize on trend', 'Create content'],
            evidence: [trend]
          })
        }
        break

      case 'quick':
        // Run lightweight analysis
        const topic = topics[0]
        const trend = await coordinator.agents.trendAnalyst.analyze(topic, organizationName)
        analyses = [{
          topic: topic.name,
          momentum_score: trend.momentum_score || 50,
          trending_direction: trend.direction || 'stable',
          competitive_advantage: 'Quick analysis - full scan recommended',
          opportunity_window: trend.time_window || '48 hours',
          recommended_actions: ['Run full analysis', 'Monitor closely'],
          evidence: [trend]
        }]
        break

      default: // 'full'
        analyses = await coordinator.analyzeTopicMomentum(organizationName, topics, competitors)
    }

    return new Response(
      JSON.stringify({
        success: true,
        analyses,
        metadata: {
          organization: organizationName,
          topics_analyzed: topics.length,
          competitors_analyzed: competitors.length,
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
    console.error('Topic momentum error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        analyses: []
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})