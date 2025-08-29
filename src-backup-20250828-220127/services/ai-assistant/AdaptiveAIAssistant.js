// Adaptive AI Assistant - Core System
const Anthropic = require('@anthropic-ai/sdk');
const EventEmitter = require('events');

class AdaptiveAIAssistant extends EventEmitter {
  constructor() {
    super();
    
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });
    
    this.currentMode = 'default';
    this.context = new Map();
    this.conversationHistory = [];
    this.personality = this.initializePersonality();
    this.modes = this.initializeModes();
    this.morphTransitions = new Map();
  }

  initializePersonality() {
    return {
      core: {
        name: 'Signal',
        traits: ['helpful', 'proactive', 'knowledgeable', 'adaptive'],
        memory: 'persistent',
        voice: 'professional yet approachable'
      },
      adaptability: {
        contextAwareness: 0.9,
        proactivityLevel: 0.7,
        formalityLevel: 0.6,
        creativityLevel: 0.8
      }
    };
  }

  initializeModes() {
    return {
      default: {
        name: 'General Assistant',
        icon: '🤖',
        systemPrompt: `You are Signal, an AI assistant for SignalDesk. You're helpful, knowledgeable, and adaptive. Maintain a professional yet approachable tone.`,
        traits: {
          proactivity: 0.5,
          formality: 0.6,
          creativity: 0.7,
          analysis: 0.6
        }
      },

      intelligence: {
        name: 'Intelligence Analyst',
        icon: '📡',
        systemPrompt: `You are Signal in Intelligence Analyst mode. You excel at pattern detection, competitive analysis, and strategic insights. You're proactive about identifying opportunities and threats. Focus on data-driven insights and actionable intelligence.`,
        traits: {
          proactivity: 0.9,
          formality: 0.7,
          creativity: 0.5,
          analysis: 0.95
        },
        specialCapabilities: [
          'pattern_detection',
          'competitive_analysis',
          'trend_identification',
          'risk_assessment'
        ],
        proactiveMessages: [
          "I've detected unusual activity in your competitor's media coverage.",
          "Your share of voice has changed significantly in the last 24 hours.",
          "There's a trending topic that aligns with your messaging strategy.",
          "I've identified a potential crisis indicator that needs attention."
        ]
      },

      campaign: {
        name: 'Campaign Strategist',
        icon: '🎯',
        systemPrompt: `You are Signal in Campaign Strategist mode. You're a strategic advisor focused on campaign planning, narrative development, and execution strategy. Be creative yet practical, always considering ROI and measurable outcomes.`,
        traits: {
          proactivity: 0.7,
          formality: 0.5,
          creativity: 0.9,
          analysis: 0.7
        },
        specialCapabilities: [
          'campaign_planning',
          'narrative_development',
          'timeline_optimization',
          'resource_allocation'
        ],
        proactiveMessages: [
          "Based on your timeline, we should start media outreach in 3 days.",
          "I've identified a narrative gap we can exploit.",
          "Your campaign brief is missing key performance indicators.",
          "Similar campaigns in your industry averaged 45% higher engagement with this approach."
        ]
      },

      media: {
        name: 'Media Relations Expert',
        icon: '📰',
        systemPrompt: `You are Signal in Media Relations Expert mode. You understand journalist preferences, news cycles, and pitch optimization. Help build relationships and craft compelling stories that get coverage.`,
        traits: {
          proactivity: 0.6,
          formality: 0.4,
          creativity: 0.8,
          analysis: 0.6
        },
        specialCapabilities: [
          'journalist_matching',
          'pitch_optimization',
          'relationship_insights',
          'coverage_prediction'
        ],
        proactiveMessages: [
          "This journalist just covered a similar story - perfect timing for your pitch.",
          "The news cycle suggests Tuesday morning for maximum impact.",
          "You have a warm connection with this reporter through a mutual contact.",
          "This angle has a 73% higher chance of coverage based on recent trends."
        ]
      },

      content: {
        name: 'Content Creator',
        icon: '✏️',
        systemPrompt: `You are Signal in Content Creator mode. You're an expert writer who crafts compelling content across all formats. Focus on clarity, impact, and audience engagement while maintaining brand voice.`,
        traits: {
          proactivity: 0.5,
          formality: 0.5,
          creativity: 0.95,
          analysis: 0.5
        },
        specialCapabilities: [
          'content_generation',
          'tone_adaptation',
          'message_optimization',
          'seo_enhancement'
        ],
        proactiveMessages: [
          "This headline could be 40% more engaging with active voice.",
          "Adding a customer quote here would increase credibility.",
          "Your key message is buried - let's move it to the first paragraph.",
          "This content matches your brand voice at 92% consistency."
        ]
      },

      crisis: {
        name: 'Crisis Manager',
        icon: '🚨',
        systemPrompt: `You are Signal in Crisis Manager mode. You're calm, decisive, and strategic. Focus on rapid response, stakeholder management, and reputation protection. Time is critical - be concise and action-oriented.`,
        traits: {
          proactivity: 0.95,
          formality: 0.8,
          creativity: 0.4,
          analysis: 0.9
        },
        specialCapabilities: [
          'crisis_assessment',
          'response_strategy',
          'stakeholder_mapping',
          'message_control'
        ],
        proactiveMessages: [
          "🚨 Urgent: Negative sentiment spike detected - immediate response recommended.",
          "Crisis escalation risk: HIGH. Implement containment strategy now.",
          "Key stakeholders need updates in the next 30 minutes.",
          "Media is picking up the story - we have a 2-hour window to shape narrative."
        ]
      }
    };
  }

  async morphTo(newMode, context = {}) {
    if (!this.modes[newMode]) {
      console.warn(`Unknown mode: ${newMode}, staying in ${this.currentMode}`);
      return;
    }

    const previousMode = this.currentMode;
    this.currentMode = newMode;
    
    // Smooth transition with context preservation
    const transition = {
      from: previousMode,
      to: newMode,
      timestamp: new Date(),
      context: this.preserveContext(previousMode, newMode),
      message: this.generateTransitionMessage(previousMode, newMode)
    };

    this.morphTransitions.set(Date.now(), transition);
    
    // Emit transition event
    this.emit('mode:changed', {
      previousMode,
      newMode,
      transition
    });

    // Update personality traits
    await this.adjustPersonality(newMode);

    return transition;
  }

  preserveContext(fromMode, toMode) {
    // Preserve relevant context during mode switch
    const preserved = {
      conversationSummary: this.summarizeConversation(),
      keyTopics: this.extractKeyTopics(),
      userIntent: this.inferUserIntent(),
      relevantData: this.filterRelevantData(fromMode, toMode)
    };

    return preserved;
  }

  generateTransitionMessage(fromMode, toMode) {
    const transitions = {
      'default-intelligence': "Switching to Intelligence Analyst mode. I'll focus on data analysis and insights.",
      'default-campaign': "Switching to Campaign Strategist mode. Let's build something impactful.",
      'intelligence-campaign': "Moving from analysis to strategy. Let's turn these insights into action.",
      'campaign-media': "Transitioning to Media Relations. Let's get your story out there.",
      'default-crisis': "🚨 Crisis mode activated. I'm ready to help manage this situation."
    };

    const key = `${fromMode}-${toMode}`;
    return transitions[key] || `Switching to ${this.modes[toMode].name} mode.`;
  }

  async adjustPersonality(mode) {
    const modeConfig = this.modes[mode];
    
    this.personality.adaptability = {
      ...this.personality.adaptability,
      proactivityLevel: modeConfig.traits.proactivity,
      formalityLevel: modeConfig.traits.formality,
      creativityLevel: modeConfig.traits.creativity
    };
  }

  async detectRequiredMode(input, currentContext) {
    // Analyze input to determine best mode
    const modeScores = new Map();
    
    // Keywords and patterns for each mode
    const modeIndicators = {
      intelligence: ['competitor', 'monitor', 'track', 'analysis', 'trend', 'sentiment'],
      campaign: ['campaign', 'launch', 'strategy', 'plan', 'timeline', 'brief'],
      media: ['journalist', 'reporter', 'pitch', 'coverage', 'media', 'press'],
      content: ['write', 'draft', 'create', 'content', 'copy', 'message'],
      crisis: ['crisis', 'urgent', 'emergency', 'incident', 'response', 'damage']
    };

    // Score each mode based on input
    for (const [mode, indicators] of Object.entries(modeIndicators)) {
      let score = 0;
      const inputLower = input.toLowerCase();
      
      indicators.forEach(indicator => {
        if (inputLower.includes(indicator)) {
          score += 1;
        }
      });

      // Consider current context
      if (currentContext.feature === mode) {
        score += 2;
      }

      modeScores.set(mode, score);
    }

    // Find highest scoring mode
    let bestMode = 'default';
    let highestScore = 0;
    
    modeScores.forEach((score, mode) => {
      if (score > highestScore) {
        highestScore = score;
        bestMode = mode;
      }
    });

    return bestMode;
  }

  async processMessage(message, options = {}) {
    const {
      userId,
      projectId,
      feature,
      forceMode = null,
      stream = false
    } = options;

    try {
      // Detect and switch to appropriate mode
      const requiredMode = forceMode || await this.detectRequiredMode(message, { feature });
      if (requiredMode !== this.currentMode) {
        await this.morphTo(requiredMode, { feature });
      }

      // Add to conversation history
      this.conversationHistory.push({
        role: 'user',
        content: message,
        timestamp: new Date(),
        mode: this.currentMode
      });

      // Build context-aware prompt
      const systemPrompt = this.buildSystemPrompt();
      const contextualPrompt = await this.buildContextualPrompt(projectId);

      // Generate response
      const response = await this.generateResponse(
        message,
        systemPrompt,
        contextualPrompt,
        stream
      );

      // Add response to history
      this.conversationHistory.push({
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
        mode: this.currentMode
      });

      // Check for proactive suggestions
      const proactiveSuggestions = await this.generateProactiveSuggestions(response.content);

      return {
        content: response.content,
        mode: this.currentMode,
        modeInfo: this.modes[this.currentMode],
        suggestions: proactiveSuggestions,
        confidence: response.confidence || 0.9
      };

    } catch (error) {
      console.error('Error processing message:', error);
      throw error;
    }
  }

  buildSystemPrompt() {
    const mode = this.modes[this.currentMode];
    const personality = this.personality;
    
    return `${mode.systemPrompt}

Your personality traits:
- Proactivity: ${(mode.traits.proactivity * 100).toFixed(0)}%
- Formality: ${(mode.traits.formality * 100).toFixed(0)}%
- Creativity: ${(mode.traits.creativity * 100).toFixed(0)}%
- Analysis: ${(mode.traits.analysis * 100).toFixed(0)}%

Core identity: ${personality.core.name}
Voice: ${personality.core.voice}

Remember to:
1. Maintain conversation continuity
2. Be contextually aware
3. Provide actionable insights
4. Stay consistent with your mode's expertise`;
  }

  async buildContextualPrompt(projectId) {
    // Gather relevant context
    const memoryVaultContext = await this.getMemoryVaultContext(projectId);
    const recentActivity = this.getRecentActivity();
    const projectContext = await this.getProjectContext(projectId);

    return `
Current context:
- Project: ${projectContext.name}
- Recent topics: ${recentActivity.topics.join(', ')}
- Active features: ${recentActivity.features.join(', ')}
- Relevant documents: ${memoryVaultContext.documentCount} available

${memoryVaultContext.summary ? `Memory Vault context: ${memoryVaultContext.summary}` : ''}
`;
  }

  async generateResponse(message, systemPrompt, contextualPrompt, stream = false) {
    const messages = [
      { role: 'system', content: systemPrompt + '\n\n' + contextualPrompt },
      ...this.getRelevantHistory(),
      { role: 'user', content: message }
    ];

    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      temperature: this.personality.adaptability.creativityLevel,
      messages,
      stream
    });

    if (stream) {
      return this.handleStreamResponse(response);
    }

    return {
      content: response.content[0].text,
      confidence: this.calculateConfidence(response)
    };
  }

  async handleStreamResponse(stream) {
    const chunks = [];
    
    for await (const chunk of stream) {
      chunks.push(chunk);
      this.emit('stream:chunk', chunk);
    }

    const fullContent = chunks.map(c => c.content[0]?.text || '').join('');
    return {
      content: fullContent,
      confidence: 0.9
    };
  }

  async generateProactiveSuggestions(responseContent) {
    const mode = this.modes[this.currentMode];
    
    if (!mode.proactiveMessages || mode.traits.proactivity < 0.5) {
      return [];
    }

    // Generate contextual suggestions
    const suggestions = [];
    const randomThreshold = Math.random();
    
    if (randomThreshold < mode.traits.proactivity) {
      // Pick relevant proactive messages
      const relevantMessages = mode.proactiveMessages.filter(msg => 
        this.isRelevantToContext(msg)
      );
      
      if (relevantMessages.length > 0) {
        suggestions.push({
          type: 'proactive',
          message: relevantMessages[Math.floor(Math.random() * relevantMessages.length)],
          action: 'investigate',
          priority: this.calculatePriority()
        });
      }
    }

    return suggestions;
  }

  getRelevantHistory(limit = 10) {
    // Get recent conversation history relevant to current mode
    return this.conversationHistory
      .filter(msg => msg.mode === this.currentMode || msg.mode === 'default')
      .slice(-limit)
      .map(msg => ({
        role: msg.role,
        content: msg.content
      }));
  }

  async getMemoryVaultContext(projectId) {
    // Fetch relevant context from MemoryVault
    // This would connect to the MemoryVault service
    return {
      documentCount: 0,
      summary: null
    };
  }

  getRecentActivity() {
    // Analyze recent conversation for topics and features
    const topics = new Set();
    const features = new Set();
    
    this.conversationHistory.slice(-20).forEach(msg => {
      // Extract topics (simplified)
      const words = msg.content.toLowerCase().split(/\s+/);
      words.forEach(word => {
        if (word.length > 5) topics.add(word);
      });
    });

    return {
      topics: Array.from(topics).slice(0, 5),
      features: Array.from(features)
    };
  }

  async getProjectContext(projectId) {
    // Fetch project details
    // This would query the database
    return {
      name: 'Project',
      type: 'campaign'
    };
  }

  isRelevantToContext(message) {
    // Check if proactive message is relevant to current context
    const recentContent = this.conversationHistory
      .slice(-5)
      .map(m => m.content)
      .join(' ')
      .toLowerCase();

    const messageWords = message.toLowerCase().split(/\s+/);
    const relevanceScore = messageWords.filter(word => 
      recentContent.includes(word)
    ).length / messageWords.length;

    return relevanceScore > 0.3;
  }

  calculateConfidence(response) {
    // Calculate confidence based on response characteristics
    return 0.9; // Simplified
  }

  calculatePriority() {
    // Calculate priority for proactive suggestions
    const mode = this.modes[this.currentMode];
    
    if (mode.name === 'Crisis Manager') return 'high';
    if (mode.traits.proactivity > 0.8) return 'medium';
    return 'low';
  }

  summarizeConversation() {
    // Create summary of conversation
    if (this.conversationHistory.length === 0) return '';
    
    const topics = this.getRecentActivity().topics;
    return `Discussion about: ${topics.join(', ')}`;
  }

  extractKeyTopics() {
    return this.getRecentActivity().topics;
  }

  inferUserIntent() {
    // Infer what the user is trying to achieve
    const recentMessages = this.conversationHistory
      .filter(m => m.role === 'user')
      .slice(-3);
    
    if (recentMessages.length === 0) return 'general_inquiry';
    
    // Simplified intent detection
    const intents = {
      'question': ['what', 'how', 'why', 'when', 'where'],
      'action': ['create', 'build', 'make', 'generate', 'write'],
      'analysis': ['analyze', 'compare', 'evaluate', 'assess'],
      'help': ['help', 'assist', 'guide', 'support']
    };

    // Check recent messages for intent indicators
    for (const [intent, keywords] of Object.entries(intents)) {
      for (const msg of recentMessages) {
        const msgLower = msg.content.toLowerCase();
        if (keywords.some(keyword => msgLower.includes(keyword))) {
          return intent;
        }
      }
    }

    return 'general_inquiry';
  }

  filterRelevantData(fromMode, toMode) {
    // Filter data relevant to mode transition
    return {
      preservedTopics: this.extractKeyTopics(),
      intent: this.inferUserIntent()
    };
  }

  // Public API
  async reset() {
    this.currentMode = 'default';
    this.context.clear();
    this.conversationHistory = [];
    this.morphTransitions.clear();
  }

  getState() {
    return {
      currentMode: this.currentMode,
      modeInfo: this.modes[this.currentMode],
      conversationLength: this.conversationHistory.length,
      personality: this.personality,
      transitions: Array.from(this.morphTransitions.values())
    };
  }
}

module.exports = AdaptiveAIAssistant;