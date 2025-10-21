import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Niv PR Strategist - Autonomous AI PR Agent
 * 20 years of PR expertise encoded into an intelligent system
 * Converted from NivPRStrategist.js to Deno/Edge Function
 */

interface Intent {
  type: 'strategy' | 'media' | 'crisis' | 'campaign' | 'content' | 'general'
  urgency: 'immediate' | 'high' | 'medium' | 'low'
  key_topics: string[]
  suggested_approach: string
}

interface Context {
  organization?: string
  industry?: string
  situation?: string
  competitors?: string[]
  topics?: string[]
  [key: string]: any
}

class NivPRStrategist {
  private name = "Niv"
  private role = "Senior PR Strategist"
  private experience = "20 years"

  private personality = {
    style: "Direct but warm",
    approach: "Strategic and proactive",
    strengths: [
      "Relationship building",
      "Crisis management",
      "Story development",
      "Media strategy",
      "Campaign orchestration"
    ],
    principles: [
      "Always think 3 steps ahead",
      "Relationships before transactions",
      "Truth builds trust",
      "Timing is everything",
      "Every crisis is an opportunity"
    ]
  }

  private expertise = {
    media: {
      journalists: new Map(),
      outlets: new Map(),
      beats: new Map(),
      preferences: new Map()
    },
    campaigns: {
      strategies: [],
      templates: [],
      playbooks: []
    },
    timing: {
      newsCycles: this.getNewsCycleKnowledge(),
      embargoRules: this.getEmbargoRules(),
      optimalTiming: this.getTimingStrategy()
    }
  }

  private memory = {
    shortTerm: [] as any[],
    longTerm: new Map(),
    relationships: new Map(),
    campaigns: new Map()
  }

  /**
   * Niv's main interaction point
   */
  async chat(message: string, context: Context = {}): Promise<string> {
    // Add to memory
    this.memory.shortTerm.push({
      role: 'user',
      content: message,
      timestamp: new Date()
    })

    // Analyze intent
    const intent = await this.analyzeIntent(message, context)

    // Route to appropriate handler
    let response: string
    switch (intent.type) {
      case 'strategy':
        response = await this.handleStrategyRequest(intent, context)
        break
      case 'media':
        response = await this.handleMediaRequest(intent, context)
        break
      case 'crisis':
        response = await this.handleCrisisRequest(intent, context)
        break
      case 'campaign':
        response = await this.handleCampaignRequest(intent, context)
        break
      case 'content':
        response = await this.handleContentRequest(intent, context)
        break
      default:
        response = await this.handleGeneralRequest(message, context)
    }

    // Add response to memory
    this.memory.shortTerm.push({
      role: 'assistant',
      content: response,
      timestamp: new Date()
    })

    return response
  }

  /**
   * Analyze user intent to route appropriately
   */
  private async analyzeIntent(message: string, context: Context): Promise<Intent> {
    const prompt = `As a senior PR strategist, analyze this message and determine the intent:

Message: "${message}"
Context: ${JSON.stringify(context)}

Return a JSON object with:
- type: one of [strategy, media, crisis, campaign, content, general]
- urgency: [immediate, high, medium, low]
- key_topics: array of main topics
- suggested_approach: brief strategic recommendation`

    try {
      const response = await callClaude(prompt, 0.7)
      return response as Intent
    } catch {
      return {
        type: 'general',
        urgency: 'medium',
        key_topics: [],
        suggested_approach: 'Provide strategic PR guidance'
      }
    }
  }

  /**
   * Handle strategy-related requests
   */
  private async handleStrategyRequest(intent: Intent, context: Context): Promise<string> {
    const prompt = `You are Niv, a senior PR strategist with 20 years of experience.

Your personality: ${JSON.stringify(this.personality)}
Current context: ${JSON.stringify(context)}
User's request relates to: ${intent.key_topics.join(', ')}

Provide strategic PR advice that is:
1. Direct but warm
2. Actionable and specific
3. Based on PR best practices
4. Forward-thinking (3 steps ahead)

Remember to:
- Draw on your experience
- Consider timing and relationships
- Suggest concrete next steps
- Anticipate potential challenges`

    const response = await callClaude(prompt, 0.8)
    return typeof response === 'string' ? response : response.advice || 'Let me help you develop a strategic PR approach.'
  }

  /**
   * Handle media-related requests
   */
  private async handleMediaRequest(intent: Intent, context: Context): Promise<string> {
    // Check journalist database
    const relevantJournalists = await this.findRelevantJournalists(intent.key_topics)

    const prompt = `You are Niv, a senior PR strategist managing media relations.

Topic: ${intent.key_topics.join(', ')}
Relevant journalists: ${JSON.stringify(relevantJournalists)}
Context: ${JSON.stringify(context)}

Provide media strategy that includes:
1. Which journalists to target and why
2. Pitch angle and approach for each
3. Timing considerations
4. Exclusive vs broad distribution strategy
5. Follow-up plan

Be specific about journalist preferences and pet peeves.`

    const response = await callClaude(prompt, 0.8)
    return typeof response === 'string' ? response : response.strategy || 'Let me craft a targeted media strategy for you.'
  }

  /**
   * Handle crisis communications
   */
  private async handleCrisisRequest(intent: Intent, context: Context): Promise<string> {
    const prompt = `You are Niv, a senior PR strategist handling a crisis situation.

Situation: ${intent.key_topics.join(', ')}
Urgency: ${intent.urgency}
Context: ${JSON.stringify(context)}

Provide immediate crisis response strategy:
1. Immediate actions (first hour)
2. Key messages and holding statements
3. Stakeholder communication order
4. Media response strategy
5. Long-term reputation recovery plan

Apply crisis management best practices:
- Speed and accuracy balance
- Transparency and accountability
- Stakeholder prioritization
- Message consistency`

    const response = await callClaude(prompt, 0.7)
    return typeof response === 'string' ? response : response.plan || 'Here\'s your crisis response plan.'
  }

  /**
   * Handle campaign planning
   */
  private async handleCampaignRequest(intent: Intent, context: Context): Promise<string> {
    const prompt = `You are Niv, a senior PR strategist planning a campaign.

Campaign focus: ${intent.key_topics.join(', ')}
Context: ${JSON.stringify(context)}

Develop a comprehensive campaign strategy:
1. Campaign objectives and KPIs
2. Target audiences and messages
3. Media strategy and timeline
4. Content calendar
5. Budget allocation
6. Risk mitigation
7. Success metrics

Think strategically about:
- Multi-channel integration
- Story arc development
- Momentum building
- Measurement and optimization`

    const response = await callClaude(prompt, 0.8)
    return typeof response === 'string' ? response : response.campaign || 'Let me develop a comprehensive campaign strategy.'
  }

  /**
   * Handle content creation requests
   */
  private async handleContentRequest(intent: Intent, context: Context): Promise<string> {
    const prompt = `You are Niv, a senior PR strategist crafting strategic content.

Content needed: ${intent.key_topics.join(', ')}
Context: ${JSON.stringify(context)}

Create content that:
1. Aligns with PR strategy
2. Resonates with target media
3. Includes newsworthy angles
4. Follows AP style guidelines
5. Optimizes for journalist needs

Remember:
- Lead with the news
- Include quotable quotes
- Provide supporting data
- Make it easy for journalists`

    const response = await callClaude(prompt, 0.8)
    return typeof response === 'string' ? response : response.content || 'Here\'s your strategic content.'
  }

  /**
   * Handle general PR requests
   */
  private async handleGeneralRequest(message: string, context: Context): Promise<string> {
    const prompt = `You are Niv, a senior PR strategist with 20 years of experience.

Personality: Direct but warm, always thinking 3 steps ahead
Expertise: Media relations, crisis management, campaign strategy
Principles: ${this.personality.principles.join(', ')}

User message: "${message}"
Context: ${JSON.stringify(context)}

Respond as Niv would - strategic, experienced, and helpful.`

    const response = await callClaude(prompt, 0.8)
    return typeof response === 'string' ? response : 'Let me help you with that PR challenge.'
  }

  /**
   * Find relevant journalists for topics
   */
  private async findRelevantJournalists(topics: string[]) {
    // This would connect to your database
    // For now, return mock data based on topics
    const journalists = []

    if (topics.some(t => t.toLowerCase().includes('tech') || t.toLowerCase().includes('ai'))) {
      journalists.push({
        name: "Sarah Chen",
        outlet: "TechCrunch",
        beat: "AI & Enterprise",
        preferences: "Exclusive data, founder access",
        pet_peeves: "PR speak, mass pitches",
        best_time: "Tues-Thurs, 10am-12pm EST"
      })
    }

    if (topics.some(t => t.toLowerCase().includes('business') || t.toLowerCase().includes('enterprise'))) {
      journalists.push({
        name: "Michael Johnson",
        outlet: "Wall Street Journal",
        beat: "Enterprise Technology",
        preferences: "Financial impact, customer stories",
        pet_peeves: "Vague claims, no data",
        best_time: "Mon-Wed, 9am-11am EST"
      })
    }

    return journalists
  }

  /**
   * News cycle knowledge
   */
  private getNewsCycleKnowledge() {
    return {
      monday: "Slow news day, good for feature pitches",
      tuesday: "Best for major announcements",
      wednesday: "Peak news day, high competition",
      thursday: "Good for business news",
      friday: "Avoid unless breaking news",
      embargoLift: "6am EST for East Coast, 6am PST for West Coast"
    }
  }

  /**
   * Embargo rules
   */
  private getEmbargoRules() {
    return {
      standard: "24-48 hours advance notice",
      exclusive: "3-5 days for deep dive",
      breaking: "No embargo, coordinate timing",
      briefing: "Under embargo until specified time"
    }
  }

  /**
   * Timing strategy
   */
  private getTimingStrategy() {
    return {
      product_launch: "Tuesday/Wednesday, avoid Mondays and Fridays",
      crisis_response: "Within 1 hour for breaking, 4 hours for developing",
      earnings: "Before market open or after close",
      executive_announcement: "Tuesday morning for maximum coverage"
    }
  }

  /**
   * Generate PR strategy based on context
   */
  async generateStrategy(context: Context) {
    const prompt = `As Niv, a senior PR strategist, create a comprehensive PR strategy for:

Organization: ${context.organization}
Industry: ${context.industry}
Topics: ${context.topics?.join(', ')}
Competitors: ${context.competitors?.join(', ')}

Provide:
1. Strategic positioning
2. Key messages and narratives
3. Target media and journalists
4. Campaign ideas
5. Timeline and milestones
6. Success metrics

Be specific, actionable, and strategic.`

    const response = await callClaude(prompt, 0.8)
    return response
  }

  /**
   * Assess PR opportunities
   */
  async assessOpportunities(opportunities: any[], context: Context) {
    const prompt = `As Niv, evaluate these PR opportunities:

${JSON.stringify(opportunities, null, 2)}

Context: ${JSON.stringify(context)}

For each opportunity, provide:
1. PR potential (1-10)
2. Media appeal
3. Timing recommendation
4. Key messages
5. Target journalists/outlets
6. Execution strategy

Prioritize by impact and feasibility.`

    const response = await callClaude(prompt, 0.7)
    return response
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
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
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

  // Try to parse as JSON if it looks like JSON
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/s)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
  } catch {
    // Return as string if not JSON
    return content
  }

  return content
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const {
      action = 'chat', // 'chat', 'strategy', 'assess', 'media', 'crisis', 'campaign'
      message,
      context = {},
      opportunities,
      topics
    } = body

    const niv = new NivPRStrategist()

    let result: any

    switch(action) {
      case 'chat':
        // Interactive chat with Niv
        if (!message) {
          throw new Error('Message is required for chat action')
        }
        result = await niv.chat(message, context)
        break

      case 'strategy':
        // Generate comprehensive PR strategy
        result = await niv.generateStrategy({
          ...context,
          topics: topics || context.topics
        })
        break

      case 'assess':
        // Assess PR opportunities
        if (!opportunities || !Array.isArray(opportunities)) {
          throw new Error('Opportunities array is required for assess action')
        }
        result = await niv.assessOpportunities(opportunities, context)
        break

      case 'media':
        // Get media strategy
        result = await niv.handleMediaRequest(
          { type: 'media', urgency: 'medium', key_topics: topics || [], suggested_approach: '' },
          context
        )
        break

      case 'crisis':
        // Crisis management
        result = await niv.handleCrisisRequest(
          { type: 'crisis', urgency: 'high', key_topics: topics || [], suggested_approach: '' },
          context
        )
        break

      case 'campaign':
        // Campaign planning
        result = await niv.handleCampaignRequest(
          { type: 'campaign', urgency: 'medium', key_topics: topics || [], suggested_approach: '' },
          context
        )
        break

      default:
        throw new Error(`Unknown action: ${action}`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        action,
        result,
        metadata: {
          agent: 'Niv PR Strategist',
          timestamp: new Date().toISOString()
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Niv PR Strategist error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        result: null
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})