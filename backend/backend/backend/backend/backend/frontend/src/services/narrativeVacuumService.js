import axios from 'axios';

/**
 * Narrative Vacuum Score (NVS) Service
 * Discovers PR opportunities by finding gaps where media wants stories but no one's providing them
 * This finds opportunities clients didn't know existed
 */
class NarrativeVacuumService {
  constructor() {
    // Thresholds for opportunity detection
    this.thresholds = {
      immediate: 80,  // Alert CEO/CMO immediately
      high: 60,       // Alert PR team today
      medium: 40,     // Include in weekly digest
      low: 20         // Monitor only
    };

    // Topic half-life in days (how quickly opportunities expire)
    this.topicHalfLife = {
      breaking_news: 0.5,      // 12 hours
      trending_topic: 2,       // 2 days
      industry_news: 7,        // 1 week
      thought_leadership: 30,  // 1 month
      evergreen: 90           // 3 months
    };

    // Category importance weights
    this.categoryWeights = {
      crisis_response: 1.5,
      funding_news: 1.3,
      product_launch: 1.2,
      thought_leadership: 1.0,
      industry_trend: 0.9,
      company_update: 0.8
    };
  }

  /**
   * Main formula: Calculate Narrative Vacuum Score
   * NVS = (MediaDemand × CompetitorAbsence × ClientStrength × TimeDecay) / MarketSaturation
   */
  async calculateNVS(topic, client, context = {}) {
    try {
      // Get all components
      const mediaDemand = await this.calculateMediaDemand(topic);
      const competitorAbsence = await this.calculateCompetitorAbsence(topic, client.competitors);
      const clientStrength = this.assessClientStrength(topic, client);
      const timeDecay = this.calculateTimeDecay(topic, context.daysSinceEmerged || 0);
      const marketSaturation = await this.calculateMarketSaturation(topic);

      // Calculate raw score
      const rawScore = (mediaDemand * competitorAbsence * clientStrength * timeDecay) / (marketSaturation || 1);
      
      // Apply category weight
      const categoryWeight = this.categoryWeights[context.category] || 1.0;
      const finalScore = Math.min(100, rawScore * categoryWeight);

      return {
        score: finalScore,
        components: {
          mediaDemand,
          competitorAbsence,
          clientStrength,
          timeDecay,
          marketSaturation
        },
        action: this.getRecommendedAction(finalScore),
        urgency: this.getUrgencyLevel(finalScore),
        explanation: this.explainScore(finalScore, { mediaDemand, competitorAbsence, clientStrength })
      };
    } catch (error) {
      console.error('Error calculating NVS:', error);
      return { score: 0, error: error.message };
    }
  }

  /**
   * Calculate Media Demand - How badly does media want this story?
   */
  async calculateMediaDemand(topic) {
    const signals = {
      haroRequests: await this.getHARORequests(topic),
      journalistQueries: await this.getJournalistQueries(topic),
      googleTrends: await this.getGoogleTrendsScore(topic),
      newsRepetition: await this.getNewsRepetitionRate(topic),
      socialBuzz: await this.getSocialBuzzScore(topic)
    };

    // Weight different demand signals
    const demand = 
      (signals.haroRequests * 30) +        // Direct journalist requests (highest weight)
      (signals.journalistQueries * 25) +    // Journalists asking on social
      (signals.googleTrends * 20) +         // Public search interest
      (signals.newsRepetition * 15) +       // Media covering repeatedly
      (signals.socialBuzz * 10);            // Social media discussion

    return Math.min(100, demand);
  }

  /**
   * Calculate Competitor Absence - Are competitors missing this opportunity?
   */
  async calculateCompetitorAbsence(topic, competitors = []) {
    if (!competitors || competitors.length === 0) {
      return 80; // High opportunity if no competitors defined
    }

    const absenceSignals = await Promise.all(
      competitors.map(async competitor => {
        const signals = {
          pressReleases: await this.checkCompetitorPressReleases(competitor, topic),
          executiveQuotes: await this.checkCompetitorQuotes(competitor, topic),
          socialActivity: await this.checkCompetitorSocial(competitor, topic),
          contentPublished: await this.checkCompetitorContent(competitor, topic)
        };

        // Calculate how absent this competitor is (0-100)
        const absence = 100 - (
          signals.pressReleases * 40 +
          signals.executiveQuotes * 30 +
          signals.socialActivity * 20 +
          signals.contentPublished * 10
        );

        return Math.max(0, absence);
      })
    );

    // Average absence across all competitors
    return absenceSignals.reduce((a, b) => a + b, 0) / absenceSignals.length;
  }

  /**
   * Assess Client Strength - Can the client credibly own this narrative?
   */
  assessClientStrength(topic, client) {
    const strengths = {
      expertise: this.getClientExpertise(topic, client),
      previousSuccess: this.getClientTrackRecord(topic, client),
      executiveCredibility: this.getExecutiveCredibility(topic, client),
      contentAssets: this.getClientContent(topic, client),
      uniqueAngle: this.getClientUniqueness(topic, client)
    };

    // Calculate weighted strength
    const strength = 
      (strengths.expertise * 30) +
      (strengths.previousSuccess * 25) +
      (strengths.executiveCredibility * 20) +
      (strengths.contentAssets * 15) +
      (strengths.uniqueAngle * 10);

    return Math.min(100, strength);
  }

  /**
   * Calculate Time Decay - How fresh is this opportunity?
   */
  calculateTimeDecay(topic, daysSinceEmerged) {
    const halfLife = this.topicHalfLife[topic.type] || this.topicHalfLife.industry_news;
    
    // Exponential decay formula
    const decay = Math.exp(-daysSinceEmerged / halfLife);
    
    return decay * 100; // Convert to 0-100 scale
  }

  /**
   * Calculate Market Saturation - How crowded is this narrative space?
   */
  async calculateMarketSaturation(topic) {
    const saturationSignals = {
      totalCoverage: await this.getTotalMediaCoverage(topic),
      uniqueVoices: await this.getUniqueVoicesCount(topic),
      messageRepetition: await this.getMessageRepetitionRate(topic),
      audienceFatigue: await this.getAudienceFatigueScore(topic)
    };

    // Higher saturation = less opportunity
    const saturation = 
      (saturationSignals.totalCoverage * 0.3) +
      (saturationSignals.uniqueVoices * 0.3) +
      (saturationSignals.messageRepetition * 0.2) +
      (saturationSignals.audienceFatigue * 0.2);

    return Math.max(1, saturation); // Never divide by zero
  }

  /**
   * Mock data fetchers - Replace with real API calls
   */
  async getHARORequests(topic) {
    // In production: Query HARO API or email digest
    const mockRequests = {
      'AI': 0.8,
      'sustainability': 0.7,
      'remote work': 0.6,
      'cybersecurity': 0.9,
      'supply chain': 0.5
    };
    
    // Fuzzy match topic to requests
    const topicLower = topic.toLowerCase();
    for (const [key, value] of Object.entries(mockRequests)) {
      if (topicLower.includes(key) || key.includes(topicLower)) {
        return value;
      }
    }
    return Math.random() * 0.3; // Low random value if no match
  }

  async getJournalistQueries(topic) {
    // In production: Monitor Twitter API for journalist requests
    // Search for patterns like "looking for sources", "need expert", "seeking comment"
    const mockActivity = Math.random() * 0.8 + 0.2;
    return mockActivity;
  }

  async getGoogleTrendsScore(topic) {
    // In production: Use Google Trends API
    try {
      // Simulate trending topics
      const trendingTopics = ['AI', 'climate', 'recession', 'crypto', 'layoffs'];
      const isHot = trendingTopics.some(t => topic.toLowerCase().includes(t));
      return isHot ? 0.7 + Math.random() * 0.3 : Math.random() * 0.5;
    } catch (error) {
      return 0.5; // Default middle value
    }
  }

  async getNewsRepetitionRate(topic) {
    // Count how many times this topic appears in recent news
    // Higher repetition = higher demand
    return Math.random() * 0.7 + 0.3;
  }

  async getSocialBuzzScore(topic) {
    // Measure social media volume and engagement
    return Math.random() * 0.6 + 0.2;
  }

  async checkCompetitorPressReleases(competitor, topic) {
    // Check if competitor has issued press releases on this topic
    // In production: Query PR Newswire, Business Wire APIs
    return Math.random() * 0.3; // Assume low activity
  }

  async checkCompetitorQuotes(competitor, topic) {
    // Check if competitor executives are quoted on this topic
    return Math.random() * 0.2;
  }

  async checkCompetitorSocial(competitor, topic) {
    // Check competitor social media activity on topic
    return Math.random() * 0.25;
  }

  async checkCompetitorContent(competitor, topic) {
    // Check if competitor has published content on topic
    return Math.random() * 0.2;
  }

  getClientExpertise(topic, client) {
    // Assess client's domain expertise
    const expertiseMap = client.expertiseAreas || {};
    
    // Check for keyword matches
    const topicLower = topic.toLowerCase();
    for (const [area, score] of Object.entries(expertiseMap)) {
      if (topicLower.includes(area.toLowerCase())) {
        return score;
      }
    }
    return 0.3; // Low default expertise
  }

  getClientTrackRecord(topic, client) {
    // Look at past media wins on similar topics
    const history = client.mediaWins || [];
    const relevantWins = history.filter(win => 
      win.topic && win.topic.toLowerCase().includes(topic.toLowerCase())
    );
    
    return Math.min(1, relevantWins.length * 0.2);
  }

  getExecutiveCredibility(topic, client) {
    // Assess if client has credible spokespersons for this topic
    return client.executiveMediaScore || 0.5;
  }

  getClientContent(topic, client) {
    // Check if client has existing content assets
    const content = client.contentLibrary || [];
    const relevantContent = content.filter(item =>
      item.topics && item.topics.some(t => t.toLowerCase().includes(topic.toLowerCase()))
    );
    
    return Math.min(1, relevantContent.length * 0.15);
  }

  getClientUniqueness(topic, client) {
    // Assess if client has unique angle or data
    return client.proprietaryData ? 0.8 : 0.4;
  }

  async getTotalMediaCoverage(topic) {
    // Measure how much this topic is already covered
    return Math.random() * 60 + 20;
  }

  async getUniqueVoicesCount(topic) {
    // Count distinct sources talking about this
    return Math.random() * 50 + 10;
  }

  async getMessageRepetitionRate(topic) {
    // How repetitive are the messages
    return Math.random() * 40 + 30;
  }

  async getAudienceFatigueScore(topic) {
    // Measure if audience is tired of this topic
    return Math.random() * 30 + 10;
  }

  /**
   * Get recommended action based on score
   */
  getRecommendedAction(score) {
    if (score >= this.thresholds.immediate) {
      return {
        action: 'IMMEDIATE_ACTION',
        description: 'Brief CEO/CMO immediately and prepare rapid response',
        timeframe: '0-2 hours',
        priority: 'CRITICAL'
      };
    } else if (score >= this.thresholds.high) {
      return {
        action: 'PRIORITY_RESPONSE',
        description: 'Prepare comprehensive response within 24 hours',
        timeframe: '24 hours',
        priority: 'HIGH'
      };
    } else if (score >= this.thresholds.medium) {
      return {
        action: 'PLANNED_ENGAGEMENT',
        description: 'Develop content and outreach plan this week',
        timeframe: '2-5 days',
        priority: 'MEDIUM'
      };
    } else {
      return {
        action: 'MONITOR',
        description: 'Continue monitoring, no immediate action needed',
        timeframe: 'Ongoing',
        priority: 'LOW'
      };
    }
  }

  /**
   * Get urgency level
   */
  getUrgencyLevel(score) {
    if (score >= 80) return 'IMMEDIATE';
    if (score >= 60) return 'TODAY';
    if (score >= 40) return 'THIS_WEEK';
    return 'MONITOR';
  }

  /**
   * Explain the score in human terms
   */
  explainScore(score, components) {
    const { mediaDemand, competitorAbsence, clientStrength } = components;
    
    let explanation = '';
    
    if (score >= 80) {
      explanation = `🚨 MAJOR OPPORTUNITY: `;
    } else if (score >= 60) {
      explanation = `📍 Strong opportunity: `;
    } else if (score >= 40) {
      explanation = `💡 Potential opportunity: `;
    } else {
      explanation = `👀 Worth monitoring: `;
    }

    // Add specific insights
    if (mediaDemand > 70) {
      explanation += 'Media is actively seeking this story. ';
    }
    if (competitorAbsence > 80) {
      explanation += 'Competitors haven\'t claimed this narrative yet. ';
    }
    if (clientStrength > 70) {
      explanation += 'You have strong credibility in this area. ';
    }
    
    if (mediaDemand < 40) {
      explanation += 'Limited media interest currently. ';
    }
    if (competitorAbsence < 30) {
      explanation += 'Competitors are already active here. ';
    }
    if (clientStrength < 40) {
      explanation += 'Would need to build credibility first. ';
    }

    return explanation;
  }

  /**
   * Discover narrative vacuums across multiple topics
   */
  async discoverOpportunities(client, options = {}) {
    const opportunities = [];
    
    // Topics to scan - mix of trending and evergreen
    const topicsToScan = [
      // Current events
      { name: 'AI regulation', type: 'breaking_news', category: 'thought_leadership' },
      { name: 'sustainable technology', type: 'trending_topic', category: 'industry_trend' },
      { name: 'remote work evolution', type: 'industry_news', category: 'thought_leadership' },
      { name: 'supply chain resilience', type: 'industry_news', category: 'industry_trend' },
      { name: 'cybersecurity threats', type: 'breaking_news', category: 'crisis_response' },
      
      // Industry-specific (customize based on client)
      ...(client.industry ? this.getIndustryTopics(client.industry) : [])
    ];

    // Calculate NVS for each topic
    for (const topic of topicsToScan) {
      const nvsResult = await this.calculateNVS(topic.name, client, {
        daysSinceEmerged: topic.daysSinceEmerged || 0,
        category: topic.category
      });

      if (nvsResult.score >= (options.minScore || this.thresholds.low)) {
        opportunities.push({
          topic: topic.name,
          type: topic.type,
          category: topic.category,
          ...nvsResult,
          discoveredAt: new Date().toISOString()
        });
      }
    }

    // Sort by score descending
    opportunities.sort((a, b) => b.score - a.score);

    return {
      opportunities: opportunities.slice(0, options.limit || 10),
      summary: {
        total: opportunities.length,
        immediate: opportunities.filter(o => o.urgency === 'IMMEDIATE').length,
        high: opportunities.filter(o => o.urgency === 'TODAY').length,
        medium: opportunities.filter(o => o.urgency === 'THIS_WEEK').length
      }
    };
  }

  /**
   * Get industry-specific topics to monitor
   */
  getIndustryTopics(industry) {
    const industryTopics = {
      'technology': [
        { name: 'AI ethics', type: 'thought_leadership' },
        { name: 'data privacy regulations', type: 'industry_news' },
        { name: 'quantum computing', type: 'evergreen' }
      ],
      'healthcare': [
        { name: 'telemedicine adoption', type: 'trending_topic' },
        { name: 'drug pricing transparency', type: 'industry_news' },
        { name: 'mental health awareness', type: 'evergreen' }
      ],
      'finance': [
        { name: 'cryptocurrency regulation', type: 'breaking_news' },
        { name: 'ESG investing', type: 'trending_topic' },
        { name: 'digital banking transformation', type: 'industry_news' }
      ],
      'retail': [
        { name: 'supply chain innovation', type: 'industry_news' },
        { name: 'sustainable packaging', type: 'trending_topic' },
        { name: 'omnichannel experience', type: 'evergreen' }
      ]
    };

    return industryTopics[industry.toLowerCase()] || [];
  }

  /**
   * Monitor for emerging narrative vacuums in real-time
   */
  async startRealTimeMonitoring(client, callback) {
    // Check every 30 minutes for new opportunities
    const interval = setInterval(async () => {
      const opportunities = await this.discoverOpportunities(client, {
        minScore: this.thresholds.medium
      });

      // Notify about high-scoring opportunities
      const urgent = opportunities.opportunities.filter(o => o.score >= this.thresholds.high);
      
      if (urgent.length > 0 && callback) {
        callback(urgent);
      }
    }, 30 * 60 * 1000); // 30 minutes

    return {
      stop: () => clearInterval(interval)
    };
  }
}

export default new NarrativeVacuumService();