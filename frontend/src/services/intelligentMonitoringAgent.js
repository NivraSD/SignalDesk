/**
 * Intelligent Monitoring Agent Service
 * Uses AI agents to monitor, analyze, and provide insights about stakeholders
 */

import stakeholderIntelligenceService from './stakeholderIntelligenceService';
import API_BASE_URL from '../config/api';

class IntelligentMonitoringAgent {
  constructor() {
    this.monitoringAgents = new Map();
    this.insights = new Map();
    this.isMonitoring = false;
    this.updateCallbacks = new Set();
  }

  /**
   * Start intelligent monitoring for all stakeholders
   */
  async startMonitoring(stakeholders, sources) {
    if (this.isMonitoring) return;
    
    console.log('🤖 Starting Intelligent Monitoring Agents...');
    this.isMonitoring = true;

    // Create an agent for each stakeholder
    for (const stakeholder of stakeholders) {
      await this.deployAgent(stakeholder, sources);
    }

    // Run initial monitoring immediately
    await this.runMonitoringCycle(stakeholders, sources);
    
    // Run continuous monitoring every 2 minutes (more frequent for demo)
    this.monitoringInterval = setInterval(() => {
      this.runMonitoringCycle(stakeholders, sources);
    }, 2 * 60 * 1000); // 2 minutes
  }

  /**
   * Deploy an agent for a specific stakeholder
   */
  async deployAgent(stakeholder, sources) {
    const agentId = stakeholder.id || stakeholder.name;
    
    const agent = {
      id: agentId,
      stakeholderName: stakeholder.name,
      type: stakeholder.type,
      topics: stakeholder.topics || stakeholder.monitoringTopics || [],
      sources: sources.filter(s => s.stakeholderId === agentId),
      status: 'active',
      lastRun: null,
      insights: []
    };

    this.monitoringAgents.set(agentId, agent);
    console.log(`🕵️ Agent deployed for ${stakeholder.name}`);
  }

  /**
   * Run a complete monitoring cycle
   */
  async runMonitoringCycle(stakeholders, sources) {
    console.log('🔄 Running monitoring cycle...');
    
    for (const stakeholder of stakeholders) {
      const agentId = stakeholder.id || stakeholder.name;
      const agent = this.monitoringAgents.get(agentId);
      
      if (!agent) continue;

      try {
        // Step 1: Gather intelligence
        const rawData = await this.gatherIntelligence(stakeholder, agent.sources);
        
        // Step 2: Analyze with AI
        const analysis = await this.analyzeWithAI(stakeholder, rawData);
        
        // Step 3: Extract insights
        const insights = await this.extractInsights(stakeholder, analysis);
        
        // Step 4: Generate predictions
        const predictions = await this.generatePredictions(stakeholder, insights);
        
        // Step 5: Update stakeholder intelligence
        const updatedIntelligence = {
          stakeholderId: agentId,
          stakeholderName: stakeholder.name,
          lastUpdated: new Date().toISOString(),
          findings: rawData,
          insights: insights,
          predictions: predictions,
          sentiment: this.calculateOverallSentiment(analysis),
          riskLevel: this.assessRiskLevel(analysis),
          opportunityScore: this.calculateOpportunityScore(analysis),
          keyDevelopments: this.identifyKeyDevelopments(analysis),
          recommendedActions: this.generateRecommendations(stakeholder, analysis)
        };

        // Store insights
        this.insights.set(agentId, updatedIntelligence);
        
        // Update agent status
        agent.lastRun = new Date().toISOString();
        agent.insights = insights;
        
        console.log(`✅ Agent ${agentId} completed:`, {
          findings: rawData.length,
          insights: insights.length,
          predictions: predictions.length,
          sentiment: updatedIntelligence.sentiment,
          riskLevel: updatedIntelligence.riskLevel
        });
        
        // Notify listeners
        this.notifyListeners(agentId, updatedIntelligence);
        
      } catch (error) {
        console.error(`Error in agent monitoring for ${stakeholder.name}:`, error);
      }
    }

    console.log('✅ Monitoring cycle complete');
  }

  /**
   * Gather intelligence from various sources
   */
  async gatherIntelligence(stakeholder, sources) {
    const findings = [];
    console.log(`📡 Gathering intelligence for ${stakeholder.name}...`);

    // Use backend to fetch from multiple sources
    try {
      // Google News
      console.log(`  Fetching from Google News for "${stakeholder.name}"...`);
      const newsResponse = await fetch(`${API_BASE_URL}/proxy/google-news`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: stakeholder.name })
      });
      
      if (newsResponse.ok) {
        const newsData = await newsResponse.json();
        console.log(`  ✓ Found ${newsData.articles?.length || 0} news articles`);
        if (newsData.articles) {
          findings.push(...newsData.articles.slice(0, 5).map(article => ({
            type: 'news',
            title: article.title,
            content: article.snippet || article.description,
            url: article.link,
            date: article.pubDate,
            source: 'Google News'
          })));
        }
      } else {
        console.log(`  ✗ Google News request failed with status ${newsResponse.status}`);
      }

      // Reddit discussions
      console.log(`  Fetching from Reddit for "${stakeholder.name}"...`);
      const redditResponse = await fetch(`${API_BASE_URL}/proxy/reddit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: stakeholder.name })
      });
      
      if (redditResponse.ok) {
        const redditData = await redditResponse.json();
        console.log(`  ✓ Found ${redditData.posts?.length || 0} Reddit posts`);
        if (redditData.posts) {
          findings.push(...redditData.posts.slice(0, 3).map(post => ({
            type: 'social',
            title: post.title,
            content: post.selftext,
            url: post.url,
            date: new Date(post.created_utc * 1000).toISOString(),
            source: 'Reddit',
            engagement: {
              score: post.score,
              comments: post.num_comments
            }
          })));
        }
      }
    } catch (error) {
      console.error('Error gathering intelligence:', error);
    }

    return findings;
  }

  /**
   * Analyze data with AI (using Claude via backend)
   */
  async analyzeWithAI(stakeholder, rawData) {
    if (!rawData || rawData.length === 0) {
      return {
        summary: 'No recent activity detected',
        sentiment: 'neutral',
        keyThemes: [],
        risks: [],
        opportunities: []
      };
    }

    // Prepare context for AI analysis
    const context = {
      stakeholderName: stakeholder.name,
      stakeholderType: stakeholder.type,
      topics: stakeholder.topics || [],
      dataPoints: rawData.map(d => ({
        title: d.title,
        content: d.content,
        date: d.date,
        source: d.source
      }))
    };

    try {
      // Use backend AI service to analyze
      const response = await stakeholderIntelligenceService.analyzeWithAI(context);
      
      if (response && response.analysis) {
        return response.analysis;
      }
    } catch (error) {
      console.error('AI analysis error:', error);
    }

    // Fallback to basic analysis
    return this.performBasicAnalysis(rawData);
  }

  /**
   * Perform basic analysis without AI
   */
  performBasicAnalysis(rawData) {
    console.log(`  📊 Analyzing ${rawData.length} data points...`);
    
    const analysis = {
      summary: `Found ${rawData.length} recent mentions across news and social media`,
      sentiment: 'neutral',
      keyThemes: [],
      risks: [],
      opportunities: []
    };

    // Extract themes from titles
    const words = rawData.flatMap(d => 
      (d.title + ' ' + (d.content || '')).toLowerCase().split(/\s+/)
    );
    
    // Common theme detection
    const themeKeywords = {
      'growth': ['growth', 'expansion', 'increase', 'rise'],
      'innovation': ['innovation', 'new', 'launch', 'introduce'],
      'partnership': ['partner', 'collaboration', 'joint', 'alliance'],
      'challenge': ['challenge', 'issue', 'problem', 'concern'],
      'success': ['success', 'achievement', 'milestone', 'win']
    };

    for (const [theme, keywords] of Object.entries(themeKeywords)) {
      if (keywords.some(keyword => words.includes(keyword))) {
        analysis.keyThemes.push(theme);
      }
    }

    // Sentiment analysis
    const positiveWords = ['good', 'great', 'excellent', 'positive', 'success', 'growth'];
    const negativeWords = ['bad', 'poor', 'negative', 'fail', 'decline', 'issue'];
    
    const positiveCount = words.filter(w => positiveWords.includes(w)).length;
    const negativeCount = words.filter(w => negativeWords.includes(w)).length;
    
    if (positiveCount > negativeCount * 2) {
      analysis.sentiment = 'positive';
    } else if (negativeCount > positiveCount * 2) {
      analysis.sentiment = 'negative';
    }

    // Identify risks and opportunities
    if (analysis.keyThemes.includes('challenge')) {
      analysis.risks.push('Potential challenges mentioned in recent coverage');
    }
    if (analysis.keyThemes.includes('growth') || analysis.keyThemes.includes('innovation')) {
      analysis.opportunities.push('Positive momentum detected');
    }

    return analysis;
  }

  /**
   * Extract actionable insights
   */
  async extractInsights(stakeholder, analysis) {
    const insights = [];

    // Key themes insight
    if (analysis.keyThemes && analysis.keyThemes.length > 0) {
      insights.push({
        type: 'theme',
        title: `Key Themes: ${analysis.keyThemes.join(', ')}`,
        description: `Recent discussions focus on ${analysis.keyThemes.join(', ')}`,
        importance: 'medium'
      });
    }

    // Sentiment insight
    if (analysis.sentiment !== 'neutral') {
      insights.push({
        type: 'sentiment',
        title: `${analysis.sentiment === 'positive' ? 'Positive' : 'Negative'} Sentiment Detected`,
        description: analysis.summary,
        importance: analysis.sentiment === 'negative' ? 'high' : 'medium'
      });
    }

    // Risk insights
    if (analysis.risks && analysis.risks.length > 0) {
      analysis.risks.forEach(risk => {
        insights.push({
          type: 'risk',
          title: 'Risk Alert',
          description: risk,
          importance: 'high'
        });
      });
    }

    // Opportunity insights
    if (analysis.opportunities && analysis.opportunities.length > 0) {
      analysis.opportunities.forEach(opportunity => {
        insights.push({
          type: 'opportunity',
          title: 'Opportunity Identified',
          description: opportunity,
          importance: 'medium'
        });
      });
    }

    return insights;
  }

  /**
   * Generate predictions based on insights
   */
  async generatePredictions(stakeholder, insights) {
    const predictions = [];

    // Based on sentiment trends
    const sentimentInsight = insights.find(i => i.type === 'sentiment');
    if (sentimentInsight) {
      if (sentimentInsight.title.includes('Positive')) {
        predictions.push({
          text: 'Continued positive momentum expected in next 30 days',
          confidence: 0.7,
          timeframe: '30 days'
        });
      } else if (sentimentInsight.title.includes('Negative')) {
        predictions.push({
          text: 'May require intervention to address negative sentiment',
          confidence: 0.8,
          timeframe: 'Immediate'
        });
      }
    }

    // Based on themes
    const themeInsight = insights.find(i => i.type === 'theme');
    if (themeInsight && themeInsight.title.includes('growth')) {
      predictions.push({
        text: 'Expansion or announcement likely in coming weeks',
        confidence: 0.6,
        timeframe: '2-4 weeks'
      });
    }

    return predictions;
  }

  /**
   * Calculate overall sentiment
   */
  calculateOverallSentiment(analysis) {
    const sentimentMap = {
      'positive': 8,
      'neutral': 5,
      'negative': 2
    };
    return sentimentMap[analysis.sentiment] || 5;
  }

  /**
   * Assess risk level
   */
  assessRiskLevel(analysis) {
    if (analysis.risks && analysis.risks.length > 2) return 'high';
    if (analysis.risks && analysis.risks.length > 0) return 'medium';
    if (analysis.sentiment === 'negative') return 'medium';
    return 'low';
  }

  /**
   * Calculate opportunity score
   */
  calculateOpportunityScore(analysis) {
    if (analysis.opportunities && analysis.opportunities.length > 2) return 'high';
    if (analysis.opportunities && analysis.opportunities.length > 0) return 'medium';
    if (analysis.sentiment === 'positive') return 'medium';
    return 'low';
  }

  /**
   * Identify key developments
   */
  identifyKeyDevelopments(analysis) {
    const developments = [];
    
    if (analysis.keyThemes && analysis.keyThemes.length > 0) {
      developments.push(`Trending topics: ${analysis.keyThemes.join(', ')}`);
    }
    
    if (analysis.sentiment === 'positive') {
      developments.push('Positive media coverage');
    } else if (analysis.sentiment === 'negative') {
      developments.push('Negative sentiment detected');
    }
    
    return developments;
  }

  /**
   * Generate recommended actions
   */
  generateRecommendations(stakeholder, analysis) {
    const recommendations = [];

    if (analysis.sentiment === 'positive') {
      recommendations.push({
        action: 'Amplify positive momentum',
        priority: 'medium',
        description: 'Consider press release or social media campaign'
      });
    }

    if (analysis.sentiment === 'negative') {
      recommendations.push({
        action: 'Address negative sentiment',
        priority: 'high',
        description: 'Develop response strategy or clarification'
      });
    }

    if (analysis.opportunities && analysis.opportunities.length > 0) {
      recommendations.push({
        action: 'Pursue identified opportunities',
        priority: 'medium',
        description: 'Engage with stakeholder while interest is high'
      });
    }

    if (analysis.risks && analysis.risks.length > 0) {
      recommendations.push({
        action: 'Mitigate identified risks',
        priority: 'high',
        description: 'Develop contingency plan for potential issues'
      });
    }

    return recommendations;
  }

  /**
   * Subscribe to monitoring updates
   */
  subscribe(callback) {
    this.updateCallbacks.add(callback);
    return () => this.updateCallbacks.delete(callback);
  }

  /**
   * Notify listeners of updates
   */
  notifyListeners(stakeholderId, intelligence) {
    this.updateCallbacks.forEach(callback => {
      try {
        callback(stakeholderId, intelligence);
      } catch (error) {
        console.error('Error in monitoring callback:', error);
      }
    });
  }

  /**
   * Get insights for a specific stakeholder
   */
  getStakeholderInsights(stakeholderId) {
    return this.insights.get(stakeholderId) || null;
  }

  /**
   * Get all insights
   */
  getAllInsights() {
    const allInsights = {};
    this.insights.forEach((value, key) => {
      allInsights[key] = value;
    });
    return allInsights;
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    this.isMonitoring = false;
    this.monitoringAgents.clear();
    console.log('🛑 Monitoring agents stopped');
  }
}

export default new IntelligentMonitoringAgent();