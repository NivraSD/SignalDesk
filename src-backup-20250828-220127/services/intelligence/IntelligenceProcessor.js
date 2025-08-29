class IntelligenceProcessor {
  constructor() {
    this.entityTypes = {
      PERSON: 'person',
      ORGANIZATION: 'organization',
      LOCATION: 'location',
      PRODUCT: 'product',
      EVENT: 'event',
      MONEY: 'money',
      DATE: 'date',
      TECHNOLOGY: 'technology'
    };

    this.sentimentLabels = {
      POSITIVE: 'positive',
      NEGATIVE: 'negative',
      NEUTRAL: 'neutral',
      MIXED: 'mixed'
    };

    this.credibilityFactors = {
      SOURCE_REPUTATION: 0.3,
      CORROBORATION: 0.25,
      AUTHOR_EXPERTISE: 0.2,
      FACT_CHECKING: 0.15,
      RECENCY: 0.1
    };
  }

  async processRawIntelligence(rawData, stakeholder) {
    // Step 1: Clean and normalize data
    const cleaned = await this.cleanAndNormalize(rawData);
    
    // Step 2: Extract entities
    const entities = await this.extractEntities(cleaned);
    
    // Step 3: Map relationships
    const relationships = await this.mapRelationships(entities, stakeholder);
    
    // Step 4: Analyze sentiment with context
    const sentimentAnalysis = await this.analyzeWithContext(cleaned, {
      stakeholder,
      industry: stakeholder.industry,
      historicalContext: await this.getHistoricalContext(stakeholder)
    });
    
    // Step 5: Assess credibility
    const credibility = await this.assessCredibility({
      source: rawData.source,
      author: rawData.author,
      content: cleaned,
      corroboration: await this.findCorroboratingSources(cleaned)
    });
    
    // Step 6: Score strategic relevance
    const relevance = await this.scoreStrategicRelevance(cleaned, {
      stakeholderGoals: stakeholder.goals,
      currentCampaigns: stakeholder.activeCampaigns,
      riskFactors: stakeholder.risks
    });
    
    // Step 7: Generate actionable insights
    const insights = await this.generateActionableInsights({
      content: cleaned,
      entities,
      relationships,
      sentiment: sentimentAnalysis,
      credibility,
      relevance
    });
    
    return {
      processed: cleaned,
      entities,
      relationships,
      sentiment: sentimentAnalysis,
      credibility,
      relevance,
      insights,
      metadata: {
        processedAt: new Date(),
        processingVersion: '1.0',
        stakeholderId: stakeholder.id
      }
    };
  }

  async cleanAndNormalize(rawData) {
    let content = '';
    
    // Extract content based on data type
    if (typeof rawData === 'string') {
      content = rawData;
    } else if (Array.isArray(rawData)) {
      content = rawData.map(item => this.extractTextContent(item)).join('\n\n');
    } else if (typeof rawData === 'object') {
      content = this.extractTextContent(rawData);
    }
    
    // Clean the content
    content = this.removeHtmlTags(content);
    content = this.normalizeWhitespace(content);
    content = this.fixEncoding(content);
    content = this.removeSpecialCharacters(content);
    
    return {
      original: rawData,
      cleaned: content,
      wordCount: content.split(/\s+/).length,
      language: this.detectLanguage(content)
    };
  }

  extractTextContent(data) {
    const textParts = [];
    
    if (data.title) textParts.push(data.title);
    if (data.content) textParts.push(data.content);
    if (data.text) textParts.push(data.text);
    if (data.snippet) textParts.push(data.snippet);
    if (data.summary) textParts.push(data.summary);
    if (data.abstract) textParts.push(data.abstract);
    if (data.description) textParts.push(data.description);
    
    return textParts.join(' ');
  }

  removeHtmlTags(text) {
    return text.replace(/<[^>]*>/g, '');
  }

  normalizeWhitespace(text) {
    return text.replace(/\s+/g, ' ').trim();
  }

  fixEncoding(text) {
    // Fix common encoding issues
    return text
      .replace(/â€™/g, "'")
      .replace(/â€œ/g, '"')
      .replace(/â€/g, '"')
      .replace(/â€"/g, '-')
      .replace(/â€¦/g, '...');
  }

  removeSpecialCharacters(text) {
    // Keep alphanumeric, spaces, and common punctuation
    return text.replace(/[^\w\s.,!?;:'"()-]/g, '');
  }

  detectLanguage(text) {
    // Simple language detection based on common words
    // In production, use a proper language detection library
    const englishWords = ['the', 'is', 'at', 'which', 'on', 'and', 'a', 'to'];
    const words = text.toLowerCase().split(/\s+/);
    const englishCount = words.filter(w => englishWords.includes(w)).length;
    
    return englishCount > words.length * 0.02 ? 'en' : 'unknown';
  }

  async extractEntities(cleanedData) {
    const entities = {
      people: [],
      organizations: [],
      locations: [],
      products: [],
      events: [],
      monetary: [],
      dates: [],
      technologies: []
    };
    
    const text = cleanedData.cleaned;
    
    // Extract people (simple pattern matching - in production use NER)
    const personPatterns = [
      /(?:Mr\.|Mrs\.|Ms\.|Dr\.|Prof\.)?\s*([A-Z][a-z]+\s+[A-Z][a-z]+)/g,
      /CEO\s+([A-Z][a-z]+\s+[A-Z][a-z]+)/g,
      /([A-Z][a-z]+\s+[A-Z][a-z]+),?\s+(?:CEO|CTO|CFO|President|Director)/g
    ];
    
    personPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        entities.people.push({
          name: match[1].trim(),
          type: this.entityTypes.PERSON,
          position: text.indexOf(match[0]),
          context: this.getContextWindow(text, text.indexOf(match[0]), 50)
        });
      }
    });
    
    // Extract organizations
    const orgPatterns = [
      /(?:Company|Corporation|Inc\.|LLC|Ltd\.|Corp\.)\s*:?\s*([A-Z][A-Za-z\s&]+)/g,
      /([A-Z][A-Za-z\s&]+)\s+(?:Company|Corporation|Inc\.|LLC|Ltd\.|Corp\.)/g
    ];
    
    orgPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        entities.organizations.push({
          name: match[1].trim(),
          type: this.entityTypes.ORGANIZATION,
          position: text.indexOf(match[0]),
          context: this.getContextWindow(text, text.indexOf(match[0]), 50)
        });
      }
    });
    
    // Extract monetary values
    const moneyPattern = /\$[\d,]+\.?\d*[MBK]?|\d+\.?\d*\s*(?:million|billion|thousand)/gi;
    let moneyMatch;
    while ((moneyMatch = moneyPattern.exec(text)) !== null) {
      entities.monetary.push({
        value: moneyMatch[0],
        type: this.entityTypes.MONEY,
        position: moneyMatch.index,
        context: this.getContextWindow(text, moneyMatch.index, 50)
      });
    }
    
    // Extract dates
    const datePatterns = [
      /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g,
      /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/gi,
      /\b\d{4}-\d{2}-\d{2}\b/g
    ];
    
    datePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        entities.dates.push({
          value: match[0],
          type: this.entityTypes.DATE,
          position: match.index,
          context: this.getContextWindow(text, match.index, 30)
        });
      }
    });
    
    // Deduplicate entities
    Object.keys(entities).forEach(key => {
      entities[key] = this.deduplicateEntities(entities[key]);
    });
    
    return entities;
  }

  getContextWindow(text, position, windowSize) {
    const start = Math.max(0, position - windowSize);
    const end = Math.min(text.length, position + windowSize);
    return text.substring(start, end);
  }

  deduplicateEntities(entities) {
    const seen = new Set();
    return entities.filter(entity => {
      const key = `${entity.type}:${entity.name || entity.value}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  async mapRelationships(entities, stakeholder) {
    const relationships = [];
    
    // Map people to organizations
    entities.people.forEach(person => {
      entities.organizations.forEach(org => {
        if (Math.abs(person.position - org.position) < 100) {
          relationships.push({
            type: 'WORKS_FOR',
            source: person,
            target: org,
            confidence: 0.7
          });
        }
      });
    });
    
    // Map stakeholder to mentioned entities
    entities.organizations.forEach(org => {
      if (org.name.toLowerCase().includes(stakeholder.name.toLowerCase())) {
        relationships.push({
          type: 'IS_MENTIONED',
          source: stakeholder,
          target: org,
          confidence: 0.95
        });
      }
    });
    
    // Map monetary values to organizations
    entities.monetary.forEach(money => {
      const nearestOrg = this.findNearestEntity(money, entities.organizations);
      if (nearestOrg && Math.abs(money.position - nearestOrg.position) < 50) {
        relationships.push({
          type: 'HAS_VALUE',
          source: nearestOrg,
          target: money,
          confidence: 0.6
        });
      }
    });
    
    return relationships;
  }

  findNearestEntity(targetEntity, entityList) {
    let nearest = null;
    let minDistance = Infinity;
    
    entityList.forEach(entity => {
      const distance = Math.abs(entity.position - targetEntity.position);
      if (distance < minDistance) {
        minDistance = distance;
        nearest = entity;
      }
    });
    
    return nearest;
  }

  async analyzeWithContext(cleanedData, context) {
    const text = cleanedData.cleaned;
    
    // Simple sentiment analysis
    const sentimentScores = this.calculateSentimentScores(text);
    
    // Context-aware adjustments
    const industryContext = await this.getIndustryContext(context.industry);
    const adjustedScores = this.adjustSentimentForContext(sentimentScores, industryContext);
    
    // Historical comparison
    const historicalSentiment = context.historicalContext?.averageSentiment || 0.5;
    const trend = this.calculateSentimentTrend(adjustedScores.overall, historicalSentiment);
    
    // Topic-based sentiment
    const topicSentiments = await this.analyzeTopicSentiments(text, context.stakeholder);
    
    return {
      overall: adjustedScores.overall,
      label: this.getSentimentLabel(adjustedScores.overall),
      breakdown: adjustedScores,
      trend: trend,
      topics: topicSentiments,
      confidence: this.calculateConfidence(text)
    };
  }

  calculateSentimentScores(text) {
    // Simple keyword-based sentiment (in production use ML models)
    const positiveWords = ['success', 'growth', 'innovative', 'leading', 'excellent', 'positive', 'strong', 'improved', 'breakthrough', 'achievement'];
    const negativeWords = ['failure', 'decline', 'problem', 'issue', 'concern', 'risk', 'negative', 'weak', 'controversy', 'scandal'];
    
    const words = text.toLowerCase().split(/\s+/);
    let positiveCount = 0;
    let negativeCount = 0;
    
    words.forEach(word => {
      if (positiveWords.includes(word)) positiveCount++;
      if (negativeWords.includes(word)) negativeCount++;
    });
    
    const total = positiveCount + negativeCount || 1;
    
    return {
      positive: positiveCount / total,
      negative: negativeCount / total,
      neutral: 1 - (positiveCount + negativeCount) / words.length,
      overall: (positiveCount - negativeCount) / total
    };
  }

  async getIndustryContext(industry) {
    // Industry-specific context
    const contexts = {
      technology: { volatility: 0.7, sentimentBias: 0.1 },
      finance: { volatility: 0.8, sentimentBias: -0.1 },
      healthcare: { volatility: 0.5, sentimentBias: 0.05 }
    };
    
    return contexts[industry?.toLowerCase()] || { volatility: 0.5, sentimentBias: 0 };
  }

  adjustSentimentForContext(scores, industryContext) {
    return {
      ...scores,
      overall: scores.overall + industryContext.sentimentBias
    };
  }

  calculateSentimentTrend(current, historical) {
    const difference = current - historical;
    
    if (difference > 0.1) return 'improving';
    if (difference < -0.1) return 'declining';
    return 'stable';
  }

  async analyzeTopicSentiments(text, stakeholder) {
    // Analyze sentiment for specific topics
    const topics = ['product', 'leadership', 'financial', 'innovation', 'competition'];
    const topicSentiments = [];
    
    topics.forEach(topic => {
      const topicMentions = this.findTopicMentions(text, topic);
      if (topicMentions.length > 0) {
        const sentiment = this.calculateTopicSentiment(topicMentions);
        topicSentiments.push({
          topic,
          sentiment: sentiment.label,
          score: sentiment.score,
          mentions: topicMentions.length
        });
      }
    });
    
    return topicSentiments;
  }

  findTopicMentions(text, topic) {
    const topicKeywords = {
      product: ['product', 'service', 'offering', 'solution'],
      leadership: ['CEO', 'leadership', 'management', 'executive'],
      financial: ['revenue', 'profit', 'earnings', 'financial'],
      innovation: ['innovation', 'technology', 'research', 'development'],
      competition: ['competitor', 'market share', 'competition', 'rival']
    };
    
    const keywords = topicKeywords[topic] || [topic];
    const mentions = [];
    
    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      let match;
      while ((match = regex.exec(text)) !== null) {
        mentions.push({
          keyword,
          position: match.index,
          context: this.getContextWindow(text, match.index, 50)
        });
      }
    });
    
    return mentions;
  }

  calculateTopicSentiment(mentions) {
    // Calculate sentiment for topic mentions
    let totalScore = 0;
    
    mentions.forEach(mention => {
      const contextSentiment = this.calculateSentimentScores(mention.context);
      totalScore += contextSentiment.overall;
    });
    
    const averageScore = totalScore / mentions.length;
    
    return {
      score: averageScore,
      label: this.getSentimentLabel(averageScore)
    };
  }

  getSentimentLabel(score) {
    if (score > 0.3) return this.sentimentLabels.POSITIVE;
    if (score < -0.3) return this.sentimentLabels.NEGATIVE;
    return this.sentimentLabels.NEUTRAL;
  }

  calculateConfidence(text) {
    // Calculate confidence based on text length and quality
    const wordCount = text.split(/\s+/).length;
    
    if (wordCount < 50) return 0.3;
    if (wordCount < 200) return 0.6;
    if (wordCount < 500) return 0.8;
    return 0.9;
  }

  async assessCredibility(data) {
    const scores = {
      sourceReputation: await this.assessSourceReputation(data.source),
      corroboration: await this.assessCorroboration(data.corroboration),
      authorExpertise: await this.assessAuthorExpertise(data.author),
      factChecking: await this.performFactChecking(data.content),
      recency: this.assessRecency(data.source)
    };
    
    // Calculate weighted credibility score
    let totalScore = 0;
    Object.entries(this.credibilityFactors).forEach(([factor, weight]) => {
      const factorKey = factor.toLowerCase().replace(/_/g, '');
      totalScore += (scores[factorKey] || 0) * weight;
    });
    
    return {
      overall: totalScore,
      factors: scores,
      level: this.getCredibilityLevel(totalScore),
      warnings: this.getCredibilityWarnings(scores)
    };
  }

  async assessSourceReputation(source) {
    // Assess source reputation
    const trustedSources = {
      'SEC': 0.95,
      'Reuters': 0.9,
      'Bloomberg': 0.9,
      'Wall Street Journal': 0.85,
      'Financial Times': 0.85,
      'TechCrunch': 0.75,
      'Reddit': 0.5,
      'Twitter': 0.4
    };
    
    if (typeof source === 'string') {
      for (const [name, score] of Object.entries(trustedSources)) {
        if (source.toLowerCase().includes(name.toLowerCase())) {
          return score;
        }
      }
    }
    
    return 0.5; // Default medium credibility
  }

  async assessCorroboration(corroboratingSources) {
    if (!corroboratingSources || corroboratingSources.length === 0) return 0.3;
    if (corroboratingSources.length === 1) return 0.5;
    if (corroboratingSources.length === 2) return 0.7;
    return 0.9;
  }

  async assessAuthorExpertise(author) {
    if (!author) return 0.5;
    
    // Check for credentials
    const credentials = ['PhD', 'Dr.', 'Professor', 'CFA', 'MBA', 'Expert', 'Analyst'];
    const hasCredential = credentials.some(cred => 
      author.toLowerCase().includes(cred.toLowerCase())
    );
    
    return hasCredential ? 0.8 : 0.5;
  }

  async performFactChecking(content) {
    // Simple fact checking (in production use fact-checking APIs)
    const suspiciousPatterns = [
      /allegedly/gi,
      /rumor/gi,
      /unconfirmed/gi,
      /anonymous source/gi
    ];
    
    let suspiciousCount = 0;
    suspiciousPatterns.forEach(pattern => {
      const matches = content.cleaned.match(pattern);
      if (matches) suspiciousCount += matches.length;
    });
    
    if (suspiciousCount === 0) return 0.9;
    if (suspiciousCount < 3) return 0.7;
    return 0.4;
  }

  assessRecency(source) {
    // Assess how recent the information is
    if (source.timestamp) {
      const age = Date.now() - new Date(source.timestamp).getTime();
      const days = age / (1000 * 60 * 60 * 24);
      
      if (days < 1) return 1.0;
      if (days < 7) return 0.8;
      if (days < 30) return 0.6;
      if (days < 90) return 0.4;
      return 0.2;
    }
    
    return 0.5;
  }

  getCredibilityLevel(score) {
    if (score > 0.8) return 'high';
    if (score > 0.6) return 'medium';
    if (score > 0.4) return 'low';
    return 'very low';
  }

  getCredibilityWarnings(scores) {
    const warnings = [];
    
    if (scores.sourceReputation < 0.5) {
      warnings.push('Source has low reputation');
    }
    if (scores.corroboration < 0.5) {
      warnings.push('Limited corroboration from other sources');
    }
    if (scores.factChecking < 0.6) {
      warnings.push('Contains unverified claims');
    }
    if (scores.recency < 0.4) {
      warnings.push('Information may be outdated');
    }
    
    return warnings;
  }

  async findCorroboratingSources(content) {
    // Mock corroboration check
    // In production, search for similar content across sources
    return [
      { source: 'Reuters', similarity: 0.85 },
      { source: 'Bloomberg', similarity: 0.72 }
    ];
  }

  async scoreStrategicRelevance(content, context) {
    const relevanceFactors = {
      goalAlignment: await this.assessGoalAlignment(content, context.stakeholderGoals),
      campaignRelevance: await this.assessCampaignRelevance(content, context.currentCampaigns),
      riskIndicators: await this.assessRiskIndicators(content, context.riskFactors),
      timelinessScore: this.assessTimeliness(content),
      actionability: this.assessActionability(content)
    };
    
    // Calculate weighted relevance score
    const weights = {
      goalAlignment: 0.3,
      campaignRelevance: 0.25,
      riskIndicators: 0.2,
      timelinessScore: 0.15,
      actionability: 0.1
    };
    
    let totalScore = 0;
    Object.entries(weights).forEach(([factor, weight]) => {
      totalScore += (relevanceFactors[factor] || 0) * weight;
    });
    
    return {
      overall: totalScore,
      factors: relevanceFactors,
      level: this.getRelevanceLevel(totalScore),
      priority: this.calculatePriority(totalScore, relevanceFactors)
    };
  }

  async assessGoalAlignment(content, goals) {
    if (!goals || goals.length === 0) return 0.5;
    
    let alignmentScore = 0;
    goals.forEach(goal => {
      if (content.cleaned.toLowerCase().includes(goal.toLowerCase())) {
        alignmentScore += 1;
      }
    });
    
    return Math.min(alignmentScore / goals.length, 1.0);
  }

  async assessCampaignRelevance(content, campaigns) {
    if (!campaigns || campaigns.length === 0) return 0.5;
    
    let relevanceScore = 0;
    campaigns.forEach(campaign => {
      if (content.cleaned.toLowerCase().includes(campaign.toLowerCase())) {
        relevanceScore += 1;
      }
    });
    
    return Math.min(relevanceScore / campaigns.length, 1.0);
  }

  async assessRiskIndicators(content, riskFactors) {
    if (!riskFactors || riskFactors.length === 0) return 0.5;
    
    let riskScore = 0;
    riskFactors.forEach(risk => {
      if (content.cleaned.toLowerCase().includes(risk.toLowerCase())) {
        riskScore += 1;
      }
    });
    
    return Math.min(riskScore / riskFactors.length, 1.0);
  }

  assessTimeliness(content) {
    // Check for time-sensitive keywords
    const timeKeywords = ['urgent', 'immediate', 'deadline', 'today', 'tomorrow', 'this week'];
    const hasTimeKeyword = timeKeywords.some(keyword => 
      content.cleaned.toLowerCase().includes(keyword)
    );
    
    return hasTimeKeyword ? 0.9 : 0.5;
  }

  assessActionability(content) {
    // Check for actionable content
    const actionKeywords = ['announce', 'launch', 'release', 'partner', 'acquire', 'invest'];
    const actionCount = actionKeywords.filter(keyword => 
      content.cleaned.toLowerCase().includes(keyword)
    ).length;
    
    return Math.min(actionCount / 3, 1.0);
  }

  getRelevanceLevel(score) {
    if (score > 0.8) return 'critical';
    if (score > 0.6) return 'high';
    if (score > 0.4) return 'medium';
    return 'low';
  }

  calculatePriority(overallScore, factors) {
    if (factors.riskIndicators > 0.7) return 'urgent';
    if (overallScore > 0.8) return 'high';
    if (overallScore > 0.6) return 'medium';
    return 'low';
  }

  async generateActionableInsights(data) {
    const insights = [];
    
    // Sentiment-based insights
    if (data.sentiment.label === 'negative' && data.sentiment.confidence > 0.7) {
      insights.push({
        type: 'sentiment_alert',
        title: 'Negative Sentiment Detected',
        description: 'Strong negative sentiment requires immediate attention',
        action: 'Review and prepare response strategy',
        priority: 'high'
      });
    }
    
    // Entity-based insights
    if (data.entities.people.length > 0) {
      const keyPeople = data.entities.people.slice(0, 3).map(p => p.name);
      insights.push({
        type: 'key_people',
        title: 'Key People Mentioned',
        description: `Important individuals: ${keyPeople.join(', ')}`,
        action: 'Monitor these individuals for further developments',
        priority: 'medium'
      });
    }
    
    // Financial insights
    if (data.entities.monetary.length > 0) {
      insights.push({
        type: 'financial',
        title: 'Financial Information Detected',
        description: `Monetary values mentioned: ${data.entities.monetary.map(m => m.value).join(', ')}`,
        action: 'Analyze financial implications',
        priority: 'medium'
      });
    }
    
    // Credibility insights
    if (data.credibility.level === 'low' || data.credibility.level === 'very low') {
      insights.push({
        type: 'credibility_warning',
        title: 'Low Credibility Source',
        description: `Credibility concerns: ${data.credibility.warnings.join(', ')}`,
        action: 'Verify information from additional sources',
        priority: 'high'
      });
    }
    
    // Strategic insights
    if (data.relevance.level === 'critical') {
      insights.push({
        type: 'strategic',
        title: 'Critical Strategic Intelligence',
        description: 'This information has high strategic relevance',
        action: 'Share with decision makers immediately',
        priority: 'urgent'
      });
    }
    
    return insights;
  }

  async getHistoricalContext(stakeholder) {
    // Mock historical context
    return {
      averageSentiment: 0.6,
      historicalEvents: [
        { date: '2023-01-15', event: 'Product launch', sentiment: 0.8 },
        { date: '2023-06-20', event: 'Leadership change', sentiment: 0.4 }
      ],
      trendDirection: 'improving'
    };
  }
}

const intelligenceProcessor = new IntelligenceProcessor();
export default intelligenceProcessor;