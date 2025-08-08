/**
 * Simplified Monitoring Service
 * Focuses on trending topics and competitor tracking
 */

import industryKeywordService from './industryKeywordDatabase';
import API_BASE_URL from '../config/api';

class SimplifiedMonitoringService {
  constructor() {
    this.monitoringData = new Map();
    this.isMonitoring = false;
    this.updateCallbacks = new Set();
    this.currentConfig = null;
  }

  /**
   * Start monitoring for a company
   */
  async startMonitoring(companyProfile, userConfig = null) {
    const { company, industry, objectives } = companyProfile;
    
    console.log(`🎯 Starting simplified monitoring for ${company} in ${industry}`);
    
    let config;
    
    if (userConfig && userConfig.topics && userConfig.competitors) {
      // Use user-selected configuration
      console.log('Using user-selected topics and competitors');
      config = {
        company,
        industry,
        competitors: userConfig.competitors,
        topics: userConfig.topics,
        searchQueries: [...userConfig.topics, ...userConfig.competitors.map(c => `${c} news`)],
        lastUpdated: new Date().toISOString()
      };
    } else {
      // Get monitoring strategy from database
      const strategy = industryKeywordService.getSuggestedStrategy(company, industry);
      
      config = {
        company,
        industry,
        competitors: strategy.competitors,
        topics: strategy.topicsToTrack,
        searchQueries: strategy.searchQueries,
        lastUpdated: new Date().toISOString()
      };
    }
    
    // Store the config for later use
    this.currentConfig = config;
    this.isMonitoring = true;
    
    // Fetch initial data
    await this.fetchTrendingTopics(config);
    await this.fetchCompetitorUpdates(config);
    
    // Set up periodic updates (every 5 minutes for demo)
    this.monitoringInterval = setInterval(() => {
      this.fetchTrendingTopics(config);
      this.fetchCompetitorUpdates(config);
    }, 5 * 60 * 1000);
    
    return config;
  }

  /**
   * Fetch trending topics for the industry
   */
  async fetchTrendingTopics(config) {
    console.log(`📊 Fetching trending topics for ${config.industry}...`);
    
    const trendingData = {
      type: 'trending',
      industry: config.industry,
      topics: [],
      timestamp: new Date().toISOString()
    };
    
    // Fetch from Google News for each search query
    for (const query of config.searchQueries.slice(0, 3)) {
      try {
        const response = await fetch(`${API_BASE_URL}/proxy/google-news`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query })
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.articles && data.articles.length > 0) {
            // Extract top trending topic from this query
            const topArticles = data.articles.slice(0, 3);
            topArticles.forEach(article => {
              trendingData.topics.push({
                title: article.title,
                source: article.source || 'Google News',
                url: article.link,
                snippet: article.snippet || article.description,
                query: query,
                pubDate: article.pubDate
              });
            });
          }
        }
      } catch (error) {
        console.error(`Error fetching trending topics for "${query}":`, error);
      }
    }
    
    // Store and notify
    this.monitoringData.set('trending', trendingData);
    this.notifyListeners('trending', trendingData);
    
    console.log(`✅ Found ${trendingData.topics.length} trending topics`);
    return trendingData;
  }

  /**
   * Fetch competitor updates
   */
  async fetchCompetitorUpdates(config) {
    console.log(`🏢 Fetching competitor updates...`);
    
    const competitorData = {
      type: 'competitors',
      competitors: [],
      timestamp: new Date().toISOString()
    };
    
    // Fetch news for each competitor
    for (const competitor of config.competitors.slice(0, 3)) {
      try {
        const response = await fetch(`${API_BASE_URL}/proxy/google-news`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: `${competitor} latest news` })
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.articles && data.articles.length > 0) {
            const topArticles = data.articles.slice(0, 2);
            competitorData.competitors.push({
              name: competitor,
              updates: topArticles.map(article => ({
                title: article.title,
                url: article.link,
                snippet: article.snippet || article.description,
                pubDate: article.pubDate,
                sentiment: this.analyzeSentiment(article.title + ' ' + (article.snippet || ''))
              }))
            });
          }
        }
      } catch (error) {
        console.error(`Error fetching updates for ${competitor}:`, error);
      }
    }
    
    // Store and notify
    this.monitoringData.set('competitors', competitorData);
    this.notifyListeners('competitors', competitorData);
    
    console.log(`✅ Found updates for ${competitorData.competitors.length} competitors`);
    return competitorData;
  }

  /**
   * Simple sentiment analysis
   */
  analyzeSentiment(text) {
    const textLower = text.toLowerCase();
    
    const positiveWords = [
      'growth', 'success', 'profit', 'win', 'gain', 'positive', 'increase',
      'innovation', 'breakthrough', 'leading', 'strong', 'record'
    ];
    
    const negativeWords = [
      'loss', 'decline', 'fall', 'drop', 'negative', 'concern', 'issue',
      'problem', 'lawsuit', 'investigation', 'layoff', 'cut'
    ];
    
    let sentiment = 'neutral';
    let score = 0;
    
    positiveWords.forEach(word => {
      if (textLower.includes(word)) score++;
    });
    
    negativeWords.forEach(word => {
      if (textLower.includes(word)) score--;
    });
    
    if (score > 1) sentiment = 'positive';
    else if (score < -1) sentiment = 'negative';
    
    return sentiment;
  }

  /**
   * Get actionable insights
   */
  generateInsights(config) {
    const insights = [];
    const trendingData = this.monitoringData.get('trending');
    const competitorData = this.monitoringData.get('competitors');
    
    // Check if config exists and has required properties
    if (!config || !config.company) {
      console.warn('generateInsights called without proper config');
      return insights;
    }
    
    if (trendingData && trendingData.topics && trendingData.topics.length > 0) {
      // Find topics mentioning the company
      const companyMentions = trendingData.topics.filter(
        topic => topic.title && topic.title.toLowerCase().includes(config.company.toLowerCase())
      );
      
      if (companyMentions.length > 0) {
        insights.push({
          type: 'company_mention',
          priority: 'high',
          title: `${config.company} in the news`,
          description: `Found ${companyMentions.length} recent mentions`,
          action: 'Review and potentially amplify positive coverage',
          articles: companyMentions
        });
      }
      
      // Industry trends
      const industryTrends = trendingData.topics.filter(
        topic => topic.title && !topic.title.toLowerCase().includes(config.company.toLowerCase())
      );
      
      if (industryTrends.length > 0) {
        insights.push({
          type: 'industry_trend',
          priority: 'medium',
          title: 'Industry trending topics',
          description: `${industryTrends.length} trending topics in ${config.industry}`,
          action: 'Consider creating content or commentary on these trends',
          topics: industryTrends.slice(0, 3)
        });
      }
    }
    
    if (competitorData && competitorData.competitors.length > 0) {
      // Competitor activities
      competitorData.competitors.forEach(competitor => {
        if (competitor.updates.length > 0) {
          const hasNegative = competitor.updates.some(u => u.sentiment === 'negative');
          const hasPositive = competitor.updates.some(u => u.sentiment === 'positive');
          
          if (hasNegative) {
            insights.push({
              type: 'competitor_issue',
              priority: 'medium',
              title: `${competitor.name} facing challenges`,
              description: 'Competitor experiencing negative coverage',
              action: 'Opportunity to highlight your strengths',
              updates: competitor.updates.filter(u => u.sentiment === 'negative')
            });
          }
          
          if (hasPositive) {
            insights.push({
              type: 'competitor_success',
              priority: 'high',
              title: `${competitor.name} positive developments`,
              description: 'Competitor receiving positive coverage',
              action: 'Monitor and consider response strategy',
              updates: competitor.updates.filter(u => u.sentiment === 'positive')
            });
          }
        }
      });
    }
    
    return insights;
  }

  /**
   * Get current monitoring data
   */
  getCurrentData() {
    return {
      trending: this.monitoringData.get('trending'),
      competitors: this.monitoringData.get('competitors'),
      insights: this.generateInsights(this.currentConfig)
    };
  }

  /**
   * Subscribe to updates
   */
  subscribe(callback) {
    this.updateCallbacks.add(callback);
    return () => this.updateCallbacks.delete(callback);
  }

  /**
   * Notify listeners
   */
  notifyListeners(type, data) {
    this.updateCallbacks.forEach(callback => {
      try {
        callback(type, data);
      } catch (error) {
        console.error('Error in monitoring callback:', error);
      }
    });
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    this.isMonitoring = false;
    this.monitoringData.clear();
    this.currentConfig = null;
    console.log('🛑 Monitoring stopped');
  }
}

export default new SimplifiedMonitoringService();