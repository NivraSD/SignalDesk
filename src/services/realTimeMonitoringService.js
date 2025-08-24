/**
 * Real-Time Monitoring Service
 * Fetches actual data from various sources for stakeholder analysis
 */

import stakeholderIntelligenceService from './stakeholderIntelligenceService';
import API_BASE_URL from '../config/api';

class RealTimeMonitoringService {
  constructor() {
    this.monitoringIntervals = new Map();
    this.cachedData = new Map();
    this.updateCallbacks = new Set();
  }

  /**
   * Start monitoring for a specific stakeholder with configured sources
   */
  async startMonitoring(stakeholderId, stakeholderName, sources) {
    console.log(`Starting real-time monitoring for ${stakeholderName}`);
    
    // Clear any existing monitoring for this stakeholder
    this.stopMonitoring(stakeholderId);
    
    // Set up monitoring interval (every 60 seconds)
    const intervalId = setInterval(async () => {
      await this.fetchStakeholderData(stakeholderId, stakeholderName, sources);
    }, 60000);
    
    this.monitoringIntervals.set(stakeholderId, intervalId);
    
    // Fetch initial data immediately
    await this.fetchStakeholderData(stakeholderId, stakeholderName, sources);
  }

  /**
   * Stop monitoring for a specific stakeholder
   */
  stopMonitoring(stakeholderId) {
    const intervalId = this.monitoringIntervals.get(stakeholderId);
    if (intervalId) {
      clearInterval(intervalId);
      this.monitoringIntervals.delete(stakeholderId);
    }
  }

  /**
   * Fetch data from all sources for a stakeholder
   */
  async fetchStakeholderData(stakeholderId, stakeholderName, sources) {
    const findings = [];
    
    for (const source of sources) {
      if (!source.active) continue;
      
      try {
        let data = null;
        
        // Route to appropriate fetcher based on source type
        switch (source.type) {
          case 'rss':
            data = await this.fetchRSSFeed(source.url, stakeholderName);
            break;
          case 'news':
            data = await this.fetchNewsAPI(stakeholderName, source);
            break;
          case 'social':
            if (source.url.includes('reddit')) {
              data = await this.fetchRedditData(stakeholderName);
            } else if (source.url.includes('twitter')) {
              data = await this.fetchTwitterData(stakeholderName);
            }
            break;
          case 'financial':
            data = await this.fetchFinancialData(stakeholderName, source);
            break;
          default:
            // Try Google News as fallback
            data = await this.fetchGoogleNews(stakeholderName);
        }
        
        if (data && data.length > 0) {
          findings.push(...data.map(item => ({
            ...item,
            stakeholderId,
            stakeholderName,
            source: source.name,
            sourceType: source.type,
            timestamp: new Date().toISOString()
          })));
        }
      } catch (error) {
        console.error(`Error fetching from ${source.name}:`, error);
      }
    }
    
    // Cache the findings
    this.cachedData.set(stakeholderId, findings);
    
    // Notify listeners
    this.notifyListeners(stakeholderId, findings);
    
    return findings;
  }

  /**
   * Fetch RSS feed data
   */
  async fetchRSSFeed(feedUrl, stakeholderName) {
    try {
      // Use backend proxy to fetch RSS
      const response = await fetch(`${API_BASE_URL}/proxy/rss`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: feedUrl })
      });
      
      if (!response.ok) throw new Error('RSS fetch failed');
      
      const data = await response.json();
      
      // Filter for stakeholder mentions
      return data.items
        .filter(item => {
          const content = `${item.title} ${item.description}`.toLowerCase();
          return content.includes(stakeholderName.toLowerCase());
        })
        .map(item => ({
          title: item.title,
          description: item.description,
          url: item.link,
          publishedDate: item.pubDate,
          relevance: this.calculateRelevance(item, stakeholderName)
        }));
    } catch (error) {
      console.error('RSS fetch error:', error);
      return [];
    }
  }

  /**
   * Fetch from News API
   */
  async fetchNewsAPI(stakeholderName, source) {
    try {
      // Use NewsAPI.org or similar service
      const apiKey = process.env.REACT_APP_NEWS_API_KEY;
      if (!apiKey) {
        console.warn('News API key not configured');
        return [];
      }
      
      const query = encodeURIComponent(stakeholderName);
      const response = await fetch(
        `https://newsapi.org/v2/everything?q=${query}&sortBy=publishedAt&pageSize=10&apiKey=${apiKey}`
      );
      
      if (!response.ok) throw new Error('News API fetch failed');
      
      const data = await response.json();
      
      return data.articles.map(article => ({
        title: article.title,
        description: article.description,
        url: article.url,
        publishedDate: article.publishedAt,
        source: article.source.name,
        sentiment: this.analyzeSentiment(article.title + ' ' + article.description),
        relevance: this.calculateRelevance(article, stakeholderName)
      }));
    } catch (error) {
      console.error('News API error:', error);
      return [];
    }
  }

  /**
   * Fetch Reddit data
   */
  async fetchRedditData(stakeholderName) {
    try {
      const query = encodeURIComponent(stakeholderName);
      const response = await fetch(
        `https://www.reddit.com/search.json?q=${query}&sort=new&limit=10`
      );
      
      if (!response.ok) throw new Error('Reddit fetch failed');
      
      const data = await response.json();
      
      return data.data.children.map(post => ({
        title: post.data.title,
        description: post.data.selftext?.substring(0, 200),
        url: `https://reddit.com${post.data.permalink}`,
        publishedDate: new Date(post.data.created_utc * 1000).toISOString(),
        subreddit: post.data.subreddit,
        score: post.data.score,
        comments: post.data.num_comments,
        sentiment: this.analyzeSentiment(post.data.title + ' ' + post.data.selftext)
      }));
    } catch (error) {
      console.error('Reddit fetch error:', error);
      return [];
    }
  }

  /**
   * Fetch Twitter/X data (placeholder - requires API key)
   */
  async fetchTwitterData(stakeholderName) {
    try {
      // Twitter API v2 requires authentication
      const bearerToken = process.env.REACT_APP_TWITTER_BEARER_TOKEN;
      if (!bearerToken) {
        console.warn('Twitter API token not configured');
        return [];
      }
      
      const query = encodeURIComponent(stakeholderName);
      const response = await fetch(
        `https://api.twitter.com/2/tweets/search/recent?query=${query}&max_results=10`,
        {
          headers: {
            'Authorization': `Bearer ${bearerToken}`
          }
        }
      );
      
      if (!response.ok) throw new Error('Twitter fetch failed');
      
      const data = await response.json();
      
      return data.data?.map(tweet => ({
        title: `Tweet from ${tweet.author_id}`,
        description: tweet.text,
        url: `https://twitter.com/i/web/status/${tweet.id}`,
        publishedDate: tweet.created_at,
        metrics: tweet.public_metrics,
        sentiment: this.analyzeSentiment(tweet.text)
      })) || [];
    } catch (error) {
      console.error('Twitter fetch error:', error);
      return [];
    }
  }

  /**
   * Fetch financial data
   */
  async fetchFinancialData(stakeholderName, source) {
    try {
      // For Crunchbase, SEC filings, etc.
      if (source.url.includes('crunchbase')) {
        return await this.fetchCrunchbaseData(stakeholderName);
      }
      
      // Default financial news search
      return await this.fetchNewsAPI(stakeholderName + ' funding investment', source);
    } catch (error) {
      console.error('Financial data fetch error:', error);
      return [];
    }
  }

  /**
   * Fetch Crunchbase data (requires API key)
   */
  async fetchCrunchbaseData(stakeholderName) {
    try {
      const apiKey = process.env.REACT_APP_CRUNCHBASE_API_KEY;
      if (!apiKey) {
        console.warn('Crunchbase API key not configured');
        return [];
      }
      
      // Crunchbase API implementation
      const response = await fetch(
        `https://api.crunchbase.com/v4/entities/organizations?user_key=${apiKey}&name=${encodeURIComponent(stakeholderName)}`
      );
      
      if (!response.ok) throw new Error('Crunchbase fetch failed');
      
      const data = await response.json();
      
      // Parse Crunchbase data format
      return data.entities?.map(entity => ({
        title: `${entity.properties.name} - ${entity.properties.short_description}`,
        description: `Last funding: ${entity.properties.last_funding_type} (${entity.properties.last_funding_at})`,
        url: entity.properties.web_path,
        fundingTotal: entity.properties.funding_total,
        lastFundingAmount: entity.properties.last_funding_amount,
        investors: entity.properties.investors,
        type: 'funding'
      })) || [];
    } catch (error) {
      console.error('Crunchbase fetch error:', error);
      return [];
    }
  }

  /**
   * Fetch Google News (via backend proxy to avoid CORS)
   */
  async fetchGoogleNews(stakeholderName) {
    try {
      // Use backend proxy to fetch Google News
      const response = await fetch(`${API_BASE_URL}/proxy/google-news`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: stakeholderName })
      });
      
      if (!response.ok) throw new Error('Google News fetch failed');
      
      const data = await response.json();
      
      if (data && data.articles) {
        return data.articles.map(article => ({
          title: article.title,
          description: article.snippet,
          url: article.link,
          publishedDate: article.date,
          source: article.source,
          sentiment: this.analyzeSentiment(article.title + ' ' + article.snippet)
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Google News fetch error:', error);
      return [];
    }
  }

  /**
   * Simple sentiment analysis
   */
  analyzeSentiment(text) {
    if (!text) return 'neutral';
    
    const positive = ['good', 'great', 'excellent', 'positive', 'success', 'win', 'growth', 'increase', 'improve', 'benefit'];
    const negative = ['bad', 'poor', 'negative', 'fail', 'loss', 'decline', 'decrease', 'problem', 'issue', 'concern'];
    
    const textLower = text.toLowerCase();
    const positiveCount = positive.filter(word => textLower.includes(word)).length;
    const negativeCount = negative.filter(word => textLower.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  /**
   * Calculate relevance score
   */
  calculateRelevance(item, stakeholderName) {
    const text = `${item.title || ''} ${item.description || ''}`.toLowerCase();
    const nameLower = stakeholderName.toLowerCase();
    
    // Count mentions
    const mentions = (text.match(new RegExp(nameLower, 'g')) || []).length;
    
    // Check if name is in title
    const inTitle = (item.title || '').toLowerCase().includes(nameLower);
    
    // Calculate score (0-1)
    let score = Math.min(1, mentions * 0.2);
    if (inTitle) score += 0.3;
    
    // Boost for recent items
    const date = new Date(item.publishedDate || item.pubDate);
    const hoursSincePublished = (Date.now() - date.getTime()) / (1000 * 60 * 60);
    if (hoursSincePublished < 24) score += 0.2;
    if (hoursSincePublished < 6) score += 0.1;
    
    return Math.min(1, score);
  }

  /**
   * Subscribe to monitoring updates
   */
  subscribe(callback) {
    this.updateCallbacks.add(callback);
    return () => this.updateCallbacks.delete(callback);
  }

  /**
   * Notify all listeners of new data
   */
  notifyListeners(stakeholderId, findings) {
    this.updateCallbacks.forEach(callback => {
      try {
        callback(stakeholderId, findings);
      } catch (error) {
        console.error('Error in monitoring callback:', error);
      }
    });
  }

  /**
   * Get cached data for a stakeholder
   */
  getCachedData(stakeholderId) {
    return this.cachedData.get(stakeholderId) || [];
  }

  /**
   * Get all cached data
   */
  getAllCachedData() {
    const allData = [];
    this.cachedData.forEach((findings) => {
      allData.push(...findings);
    });
    return allData;
  }

  /**
   * Clear all monitoring
   */
  stopAllMonitoring() {
    this.monitoringIntervals.forEach((intervalId) => {
      clearInterval(intervalId);
    });
    this.monitoringIntervals.clear();
    this.cachedData.clear();
  }
}

export default new RealTimeMonitoringService();