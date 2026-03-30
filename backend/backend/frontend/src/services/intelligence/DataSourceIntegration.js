class DataSourceIntegration {
  constructor() {
    this.apiConfigs = {
      meltwater: {
        name: 'Meltwater',
        baseUrl: 'https://api.meltwater.com/v2',
        authType: 'bearer',
        rateLimit: 100,
        enabled: false
      },
      brandwatch: {
        name: 'Brandwatch',
        baseUrl: 'https://api.brandwatch.com/v1',
        authType: 'oauth2',
        rateLimit: 60,
        enabled: false
      },
      lexisnexis: {
        name: 'LexisNexis',
        baseUrl: 'https://services.lexisnexis.com/api',
        authType: 'apikey',
        rateLimit: 50,
        enabled: false
      },
      newsapi: {
        name: 'NewsAPI',
        baseUrl: 'https://newsapi.org/v2',
        authType: 'apikey',
        rateLimit: 500,
        enabled: false
      },
      reddit: {
        name: 'Reddit',
        baseUrl: 'https://www.reddit.com',
        authType: 'oauth2',
        rateLimit: 60,
        enabled: true
      },
      twitter: {
        name: 'Twitter/X',
        baseUrl: 'https://api.twitter.com/2',
        authType: 'oauth2',
        rateLimit: 300,
        enabled: false
      },
      linkedin: {
        name: 'LinkedIn',
        baseUrl: 'https://api.linkedin.com/v2',
        authType: 'oauth2',
        rateLimit: 100,
        enabled: false
      }
    };

    this.credentials = this.loadCredentials();
  }

  loadCredentials() {
    // Load API credentials from environment variables or secure storage
    return {
      meltwater: {
        apiKey: process.env.REACT_APP_MELTWATER_API_KEY,
        clientId: process.env.REACT_APP_MELTWATER_CLIENT_ID
      },
      brandwatch: {
        username: process.env.REACT_APP_BRANDWATCH_USERNAME,
        password: process.env.REACT_APP_BRANDWATCH_PASSWORD,
        projectId: process.env.REACT_APP_BRANDWATCH_PROJECT_ID
      },
      newsapi: {
        apiKey: process.env.REACT_APP_NEWSAPI_KEY
      },
      reddit: {
        clientId: process.env.REACT_APP_REDDIT_CLIENT_ID,
        clientSecret: process.env.REACT_APP_REDDIT_CLIENT_SECRET
      },
      twitter: {
        bearerToken: process.env.REACT_APP_TWITTER_BEARER_TOKEN
      },
      linkedin: {
        clientId: process.env.REACT_APP_LINKEDIN_CLIENT_ID,
        clientSecret: process.env.REACT_APP_LINKEDIN_CLIENT_SECRET
      }
    };
  }

  async checkAPIStatus() {
    const status = {};
    
    for (const [api, config] of Object.entries(this.apiConfigs)) {
      status[api] = {
        name: config.name,
        available: this.isAPIConfigured(api),
        enabled: config.enabled,
        rateLimit: config.rateLimit
      };
    }
    
    return status;
  }

  isAPIConfigured(apiName) {
    const creds = this.credentials[apiName];
    if (!creds) return false;
    
    // Check if required credentials are present
    switch (apiName) {
      case 'meltwater':
        return !!(creds.apiKey && creds.clientId);
      case 'newsapi':
        return !!creds.apiKey;
      case 'reddit':
        return !!(creds.clientId && creds.clientSecret);
      case 'twitter':
        return !!creds.bearerToken;
      default:
        return false;
    }
  }

  // Meltwater Integration
  async fetchFromMeltwater(keywords, options = {}) {
    if (!this.isAPIConfigured('meltwater')) {
      throw new Error('Meltwater API not configured');
    }

    // const { apiKey, clientId } = this.credentials.meltwater;
    // const endpoint = `${this.apiConfigs.meltwater.baseUrl}/searches`;
    
    try {
      // This is a mock implementation - actual Meltwater API requires proper authentication
      const mockData = {
        documents: [
          {
            id: 'mw-1',
            title: `Industry Analysis: ${keywords.join(', ')}`,
            content: 'Comprehensive media monitoring results...',
            source: 'Industry Publication',
            publishDate: new Date(),
            sentiment: 0.7,
            reach: 50000
          }
        ]
      };
      
      return this.transformMeltwaterData(mockData);
    } catch (error) {
      console.error('Meltwater API error:', error);
      throw error;
    }
  }

  transformMeltwaterData(data) {
    return data.documents.map(doc => ({
      id: doc.id,
      title: doc.title,
      content: doc.content,
      source: {
        name: doc.source,
        type: 'media-monitoring'
      },
      publishedAt: doc.publishDate,
      sentiment: this.normalizeSentiment(doc.sentiment),
      metrics: {
        reach: doc.reach,
        engagement: doc.engagement || 0
      }
    }));
  }

  // NewsAPI Integration
  async fetchFromNewsAPI(query, options = {}) {
    if (!this.isAPIConfigured('newsapi')) {
      throw new Error('NewsAPI not configured');
    }

    const { apiKey } = this.credentials.newsapi;
    const endpoint = `${this.apiConfigs.newsapi.baseUrl}/everything`;
    
    const params = new URLSearchParams({
      q: query,
      apiKey: apiKey,
      sortBy: options.sortBy || 'relevancy',
      language: options.language || 'en',
      pageSize: options.pageSize || 20
    });

    try {
      const response = await fetch(`${endpoint}?${params}`);
      const data = await response.json();
      
      if (data.status === 'error') {
        throw new Error(data.message);
      }
      
      return this.transformNewsAPIData(data);
    } catch (error) {
      console.error('NewsAPI error:', error);
      // Return mock data for demo
      return this.getMockNewsData(query);
    }
  }

  transformNewsAPIData(data) {
    return data.articles.map(article => ({
      id: article.url,
      title: article.title,
      content: article.content || article.description,
      source: {
        name: article.source.name,
        type: 'news'
      },
      author: article.author,
      publishedAt: new Date(article.publishedAt),
      url: article.url,
      imageUrl: article.urlToImage
    }));
  }

  getMockNewsData(query) {
    return [
      {
        id: 'news-1',
        title: `Breaking: ${query} Announces Major Development`,
        content: 'In a significant move that could reshape the industry...',
        source: { name: 'Tech News Daily', type: 'news' },
        publishedAt: new Date(),
        sentiment: 'positive'
      },
      {
        id: 'news-2',
        title: `Analysis: What ${query} Means for the Market`,
        content: 'Industry experts weigh in on the implications...',
        source: { name: 'Business Weekly', type: 'news' },
        publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        sentiment: 'neutral'
      }
    ];
  }

  // Reddit Integration
  async fetchFromReddit(subreddit, query, options = {}) {
    // Note: Reddit API requires authentication for CORS requests
    // In production, this should be proxied through your backend
    // For now, returning mock data to prevent CORS errors
    
    console.log(`Reddit search simulated: ${query} in r/${subreddit}`);
    return this.getMockRedditData(query);
  }

  transformRedditData(data) {
    return data.data.children.map(post => ({
      id: post.data.id,
      title: post.data.title,
      content: post.data.selftext,
      source: {
        name: `r/${post.data.subreddit}`,
        type: 'social-forum'
      },
      author: post.data.author,
      publishedAt: new Date(post.data.created_utc * 1000),
      url: `https://reddit.com${post.data.permalink}`,
      metrics: {
        upvotes: post.data.ups,
        comments: post.data.num_comments,
        score: post.data.score
      }
    }));
  }

  getMockRedditData(query) {
    return [
      {
        id: 'reddit-1',
        title: `Discussion: ${query} - What are your thoughts?`,
        content: 'Community discussion about recent developments...',
        source: { name: 'r/technology', type: 'social-forum' },
        publishedAt: new Date(),
        metrics: { upvotes: 1234, comments: 89, score: 1145 }
      }
    ];
  }

  // Twitter/X Integration
  async fetchFromTwitter(query, options = {}) {
    if (!this.isAPIConfigured('twitter')) {
      return this.getMockTwitterData(query);
    }

    const { bearerToken } = this.credentials.twitter;
    const endpoint = `${this.apiConfigs.twitter.baseUrl}/tweets/search/recent`;
    
    try {
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${bearerToken}`,
          'Content-Type': 'application/json'
        },
        params: {
          query: query,
          max_results: options.maxResults || 10,
          'tweet.fields': 'created_at,author_id,public_metrics,context_annotations'
        }
      });
      
      const data = await response.json();
      return this.transformTwitterData(data);
    } catch (error) {
      console.error('Twitter API error:', error);
      return this.getMockTwitterData(query);
    }
  }

  transformTwitterData(data) {
    return data.data.map(tweet => ({
      id: tweet.id,
      content: tweet.text,
      source: {
        name: 'Twitter/X',
        type: 'social-media'
      },
      author: tweet.author_id,
      publishedAt: new Date(tweet.created_at),
      metrics: tweet.public_metrics
    }));
  }

  getMockTwitterData(query) {
    return [
      {
        id: 'tweet-1',
        content: `Just heard about ${query} - this could be game-changing! #innovation #tech`,
        source: { name: 'Twitter/X', type: 'social-media' },
        author: '@techinfluencer',
        publishedAt: new Date(),
        metrics: { retweet_count: 45, reply_count: 12, like_count: 234 }
      }
    ];
  }

  // LinkedIn Integration
  async fetchFromLinkedIn(query, options = {}) {
    if (!this.isAPIConfigured('linkedin')) {
      return this.getMockLinkedInData(query);
    }

    // LinkedIn API requires OAuth2 flow - this is a placeholder
    return this.getMockLinkedInData(query);
  }

  getMockLinkedInData(query) {
    return [
      {
        id: 'linkedin-1',
        title: `Thought Leadership: The Future of ${query}`,
        content: 'As industry professionals, we must consider...',
        source: { name: 'LinkedIn', type: 'professional-network' },
        author: 'Industry Expert',
        publishedAt: new Date(),
        metrics: { likes: 567, comments: 34, shares: 89 }
      }
    ];
  }

  // Unified search across all configured APIs
  async searchAllSources(query, stakeholder) {
    const results = {
      meltwater: [],
      newsapi: [],
      reddit: [],
      twitter: [],
      linkedin: []
    };

    const promises = [];

    // Meltwater
    if (this.isAPIConfigured('meltwater') && this.apiConfigs.meltwater.enabled) {
      promises.push(
        this.fetchFromMeltwater([query])
          .then(data => { results.meltwater = data; })
          .catch(err => console.error('Meltwater error:', err))
      );
    }

    // NewsAPI
    if (this.apiConfigs.newsapi.enabled) {
      promises.push(
        this.fetchFromNewsAPI(query)
          .then(data => { results.newsapi = data; })
          .catch(err => console.error('NewsAPI error:', err))
      );
    }

    // Reddit
    if (this.apiConfigs.reddit.enabled) {
      const subreddit = this.getRelevantSubreddit(stakeholder);
      promises.push(
        this.fetchFromReddit(subreddit, query)
          .then(data => { results.reddit = data; })
          .catch(err => console.error('Reddit error:', err))
      );
    }

    // Twitter
    if (this.apiConfigs.twitter.enabled) {
      promises.push(
        this.fetchFromTwitter(query)
          .then(data => { results.twitter = data; })
          .catch(err => console.error('Twitter error:', err))
      );
    }

    // LinkedIn
    if (this.apiConfigs.linkedin.enabled) {
      promises.push(
        this.fetchFromLinkedIn(query)
          .then(data => { results.linkedin = data; })
          .catch(err => console.error('LinkedIn error:', err))
      );
    }

    await Promise.all(promises);
    
    // Flatten and combine results
    const allResults = [];
    Object.values(results).forEach(sourceResults => {
      allResults.push(...sourceResults);
    });

    return this.rankResultsByRelevance(allResults, stakeholder);
  }

  getRelevantSubreddit(stakeholder) {
    const industrySubreddits = {
      technology: 'technology',
      finance: 'finance',
      healthcare: 'medicine',
      retail: 'retail',
      manufacturing: 'manufacturing'
    };

    return industrySubreddits[stakeholder.industry?.toLowerCase()] || 'business';
  }

  rankResultsByRelevance(results, stakeholder) {
    // Score each result based on relevance to stakeholder
    const scored = results.map(result => {
      let score = 0;

      // Title/content contains stakeholder name
      if (result.title?.toLowerCase().includes(stakeholder.name.toLowerCase()) ||
          result.content?.toLowerCase().includes(stakeholder.name.toLowerCase())) {
        score += 10;
      }

      // Recency bonus
      const age = Date.now() - new Date(result.publishedAt).getTime();
      const days = age / (1000 * 60 * 60 * 24);
      if (days < 1) score += 5;
      else if (days < 7) score += 3;
      else if (days < 30) score += 1;

      // Source credibility
      const credibleSources = ['meltwater', 'newsapi', 'linkedin'];
      if (credibleSources.includes(result.source.type)) {
        score += 3;
      }

      // Engagement metrics
      if (result.metrics) {
        if (result.metrics.reach > 10000) score += 2;
        if (result.metrics.upvotes > 100) score += 2;
        if (result.metrics.likes > 100) score += 1;
      }

      return { ...result, relevanceScore: score };
    });

    // Sort by relevance score
    return scored.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  normalizeSentiment(sentiment) {
    // Normalize sentiment to -1 to 1 scale
    if (typeof sentiment === 'number') {
      return Math.max(-1, Math.min(1, sentiment));
    }
    
    const sentimentMap = {
      'positive': 0.7,
      'negative': -0.7,
      'neutral': 0,
      'mixed': 0
    };
    
    return sentimentMap[sentiment?.toLowerCase()] || 0;
  }

  // Rate limiting
  async enforceRateLimit(apiName) {
    const config = this.apiConfigs[apiName];
    if (!config) return;
    
    // Simple rate limiting - in production use a proper rate limiter
    const key = `rateLimit_${apiName}`;
    const now = Date.now();
    const window = 60000; // 1 minute window
    
    const calls = JSON.parse(localStorage.getItem(key) || '[]');
    const recentCalls = calls.filter(time => now - time < window);
    
    if (recentCalls.length >= config.rateLimit) {
      const oldestCall = Math.min(...recentCalls);
      const waitTime = window - (now - oldestCall);
      throw new Error(`Rate limit exceeded. Wait ${Math.ceil(waitTime / 1000)}s`);
    }
    
    recentCalls.push(now);
    localStorage.setItem(key, JSON.stringify(recentCalls));
  }
}

const dataSourceIntegration = new DataSourceIntegration();
export default dataSourceIntegration;