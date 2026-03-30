/**
 * Niv PR Strategist - Autonomous AI PR Agent
 * 20 years of PR expertise encoded into an intelligent system
 */

import Anthropic from '@anthropic-ai/sdk';

class NivPRStrategist {
  constructor(config = {}) {
    this.name = "Niv";
    this.role = "Senior PR Strategist";
    this.experience = "20 years";
    
    // Initialize Claude connection
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });
    
    // Niv's personality traits
    this.personality = {
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
    };

    // Niv's knowledge domains
    this.expertise = {
      media: {
        journalists: new Map(), // Will be populated from database
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
    };

    // Conversation memory
    this.memory = {
      shortTerm: [], // Current conversation
      longTerm: new Map(), // Historical context
      relationships: new Map(), // People and org relationships
      campaigns: new Map() // Campaign history
    };

    // Strategic decision framework
    this.decisionFramework = {
      assess: this.assessSituation.bind(this),
      strategize: this.developStrategy.bind(this),
      execute: this.executeStrategy.bind(this),
      measure: this.measureImpact.bind(this)
    };
  }

  /**
   * Niv's main interaction point
   */
  async chat(message, context = {}) {
    // Add to memory
    this.memory.shortTerm.push({
      role: 'user',
      content: message,
      timestamp: new Date()
    });

    // Analyze intent
    const intent = await this.analyzeIntent(message, context);
    
    // Route to appropriate handler
    let response;
    switch (intent.type) {
      case 'strategy':
        response = await this.handleStrategyRequest(intent, context);
        break;
      case 'media':
        response = await this.handleMediaRequest(intent, context);
        break;
      case 'crisis':
        response = await this.handleCrisisRequest(intent, context);
        break;
      case 'campaign':
        response = await this.handleCampaignRequest(intent, context);
        break;
      case 'content':
        response = await this.handleContentRequest(intent, context);
        break;
      default:
        response = await this.handleGeneralRequest(message, context);
    }

    // Add response to memory
    this.memory.shortTerm.push({
      role: 'assistant',
      content: response,
      timestamp: new Date()
    });

    return response;
  }

  /**
   * Analyze user intent to route appropriately
   */
  async analyzeIntent(message, context) {
    const analysis = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: `As a senior PR strategist, analyze this message and determine the intent:
        
Message: "${message}"
Context: ${JSON.stringify(context)}

Return a JSON object with:
- type: one of [strategy, media, crisis, campaign, content, general]
- urgency: [immediate, high, medium, low]
- key_topics: array of main topics
- suggested_approach: brief strategic recommendation`
      }]
    });

    try {
      return JSON.parse(analysis.content[0].text);
    } catch {
      return {
        type: 'general',
        urgency: 'medium',
        key_topics: [],
        suggested_approach: 'Provide strategic PR guidance'
      };
    }
  }

  /**
   * Handle strategy-related requests
   */
  async handleStrategyRequest(intent, context) {
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
- Anticipate potential challenges`;

    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [
        { role: 'user', content: prompt },
        ...this.memory.shortTerm.slice(-5) // Include recent context
      ]
    });

    return response.content[0].text;
  }

  /**
   * Handle media-related requests
   */
  async handleMediaRequest(intent, context) {
    // Check journalist database
    const relevantJournalists = await this.findRelevantJournalists(intent.key_topics);
    
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

Be specific about journalist preferences and pet peeves.`;

    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }]
    });

    return response.content[0].text;
  }

  /**
   * Handle crisis communications
   */
  async handleCrisisRequest(intent, context) {
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
- Message consistency`;

    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }]
    });

    return response.content[0].text;
  }

  /**
   * Handle campaign planning
   */
  async handleCampaignRequest(intent, context) {
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
- Measurement and optimization`;

    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }]
    });

    return response.content[0].text;
  }

  /**
   * Handle content creation requests
   */
  async handleContentRequest(intent, context) {
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
- Make it easy for journalists`;

    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }]
    });

    return response.content[0].text;
  }

  /**
   * Handle general PR requests
   */
  async handleGeneralRequest(message, context) {
    const prompt = `You are Niv, a senior PR strategist with 20 years of experience.
    
Personality: Direct but warm, always thinking 3 steps ahead
Expertise: Media relations, crisis management, campaign strategy
Principles: ${this.personality.principles.join(', ')}

User message: "${message}"
Context: ${JSON.stringify(context)}

Respond as Niv would - strategic, experienced, and helpful.`;

    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }]
    });

    return response.content[0].text;
  }

  /**
   * Strategic assessment framework
   */
  async assessSituation(situation) {
    return {
      opportunities: [],
      risks: [],
      stakeholders: [],
      timing: {},
      resources: {},
      recommendation: ''
    };
  }

  /**
   * Strategy development
   */
  async developStrategy(assessment) {
    return {
      objectives: [],
      tactics: [],
      timeline: {},
      budget: {},
      success_metrics: []
    };
  }

  /**
   * Strategy execution
   */
  async executeStrategy(strategy) {
    return {
      immediate_actions: [],
      delegated_tasks: [],
      monitoring_plan: {},
      contingencies: []
    };
  }

  /**
   * Impact measurement
   */
  async measureImpact(execution) {
    return {
      reach: {},
      engagement: {},
      sentiment: {},
      business_impact: {},
      lessons_learned: []
    };
  }

  /**
   * Find relevant journalists for topics
   */
  async findRelevantJournalists(topics) {
    // This will connect to your database
    // For now, return mock data
    return [
      {
        name: "Sarah Chen",
        outlet: "TechCrunch", 
        beat: "AI & Enterprise",
        preferences: "Exclusive data, founder access",
        pet_peeves: "PR speak, mass pitches",
        best_time: "Tues-Thurs, 10am-12pm EST"
      }
    ];
  }

  /**
   * News cycle knowledge
   */
  getNewsCycleKnowledge() {
    return {
      monday: "Slow news day, good for feature pitches",
      tuesday: "Best for major announcements",
      wednesday: "Peak news day, high competition",
      thursday: "Good for business news",
      friday: "Avoid unless breaking news",
      embargoLift: "6am EST for East Coast, 6am PST for West Coast"
    };
  }

  /**
   * Embargo rules
   */
  getEmbargoRules() {
    return {
      standard: "24-48 hours advance notice",
      exclusive: "3-5 days for deep dive",
      breaking: "No embargo, coordinate timing",
      briefing: "Under embargo until specified time"
    };
  }

  /**
   * Timing strategy
   */
  getTimingStrategy() {
    return {
      product_launch: "Tuesday/Wednesday, avoid Mondays and Fridays",
      crisis_response: "Within 1 hour for breaking, 4 hours for developing",
      earnings: "Before market open or after close",
      executive_announcement: "Tuesday morning for maximum coverage"
    };
  }

  /**
   * Save conversation to long-term memory
   */
  saveToMemory(conversationId) {
    if (this.memory.shortTerm.length > 0) {
      this.memory.longTerm.set(conversationId, [...this.memory.shortTerm]);
      // Keep only last 10 messages in short-term
      this.memory.shortTerm = this.memory.shortTerm.slice(-10);
    }
  }

  /**
   * Load previous conversation context
   */
  loadMemory(conversationId) {
    if (this.memory.longTerm.has(conversationId)) {
      const history = this.memory.longTerm.get(conversationId);
      this.memory.shortTerm = [...history.slice(-5)]; // Load last 5 messages
      return true;
    }
    return false;
  }
}

export default NivPRStrategist;