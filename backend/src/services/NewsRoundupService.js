/**
 * NEWS ROUNDUP SERVICE
 * Gathers and organizes actual news articles into a comprehensive daily briefing
 */

const Parser = require('rss-parser');
const axios = require('axios');
const pool = require('../config/db');
const IntelligentIndexingAgent = require('./IntelligentIndexingAgent');

class NewsRoundupService {
  constructor() {
    this.parser = new Parser();
    this.indexingAgent = new IntelligentIndexingAgent();
    this.newsCache = new Map();
  }

  /**
   * Generate comprehensive news roundup for organization
   */
  async generateNewsRoundup(organizationId, config) {
    console.log('📰 GENERATING NEWS ROUNDUP');
    
    const roundup = {
      generated: new Date().toISOString(),
      organization: config.organization?.name || organizationId,
      sections: {
        topStories: [],
        organizationNews: [],
        competitorNews: [],
        industryNews: [],
        marketTrends: [],
        regulatoryUpdates: [],
        technicalDevelopments: []
      },
      sources: {
        total: 0,
        indexed: 0,
        realtime: 0
      },
      summary: null
    };

    // 1. Get all available news sources
    const sources = await this.getAllNewsSources(config);
    roundup.sources.total = sources.length;
    
    // 2. Fetch news from all sources
    const allArticles = await this.fetchAllNews(sources, config);
    
    // 3. Categorize and rank articles
    const categorizedNews = await this.categorizeNews(allArticles, config);
    
    // 4. Build roundup sections
    roundup.sections = {
      topStories: categorizedNews.topStories.slice(0, 5),
      organizationNews: categorizedNews.organization.slice(0, 10),
      competitorNews: categorizedNews.competitors.slice(0, 10),
      industryNews: categorizedNews.industry.slice(0, 10),
      marketTrends: categorizedNews.market.slice(0, 5),
      regulatoryUpdates: categorizedNews.regulatory.slice(0, 5),
      technicalDevelopments: categorizedNews.technical.slice(0, 5)
    };
    
    // 5. Generate executive summary
    roundup.summary = this.generateSummary(roundup.sections);
    
    return roundup;
  }

  /**
   * Get all available news sources
   */
  async getAllNewsSources(config) {
    const sources = [];
    
    // 1. INDEXED SOURCES (highest quality)
    const indexedSources = await this.getIndexedNewsSources(config);
    sources.push(...indexedSources);
    
    // 2. MAJOR NEWS OUTLETS
    const majorOutlets = this.getMajorNewsOutlets();
    sources.push(...majorOutlets);
    
    // 3. GOOGLE NEWS FEEDS (dynamic)
    const googleFeeds = this.buildGoogleNewsFeeds(config);
    sources.push(...googleFeeds);
    
    // 4. INDUSTRY PUBLICATIONS
    const industryFeeds = this.getIndustryFeeds(config.organization?.industry);
    sources.push(...industryFeeds);
    
    // 5. FINANCIAL NEWS
    const financialFeeds = this.getFinancialFeeds();
    sources.push(...financialFeeds);
    
    // 6. TECH NEWS
    const techFeeds = this.getTechFeeds();
    sources.push(...techFeeds);
    
    // 7. REDDIT & SOCIAL
    const socialFeeds = this.getSocialFeeds(config);
    sources.push(...socialFeeds);
    
    // Deduplicate
    const uniqueSources = Array.from(
      new Map(sources.map(s => [s.url, s])).values()
    );
    
    console.log(`📡 Using ${uniqueSources.length} news sources`);
    return uniqueSources;
  }

  /**
   * Get indexed news sources from database
   */
  async getIndexedNewsSources(config) {
    try {
      const sources = [];
      
      // Get sources for organization
      if (config.organization?.name) {
        const result = await pool.query(
          `SELECT index_data FROM source_indexes 
           WHERE entity_type = 'company' 
           AND LOWER(entity_name) = LOWER($1)
           AND active = true
           ORDER BY quality_score DESC
           LIMIT 1`,
          [config.organization.name]
        );
        
        if (result.rows.length > 0) {
          const indexData = JSON.parse(result.rows[0].index_data);
          if (indexData.sources) {
            const newsSources = indexData.sources
              .filter(s => ['news', 'social', 'financial'].includes(s.type))
              .map(s => ({ ...s, category: 'indexed' }));
            sources.push(...newsSources);
          }
        }
      }
      
      return sources;
    } catch (error) {
      console.error('Failed to get indexed sources:', error);
      return [];
    }
  }

  /**
   * Major news outlets RSS feeds
   */
  getMajorNewsOutlets() {
    return [
      // Business & General News
      { name: 'Reuters Business', url: 'https://feeds.reuters.com/reuters/businessNews', category: 'business' },
      { name: 'Reuters Top News', url: 'https://feeds.reuters.com/reuters/topNews', category: 'top' },
      { name: 'BBC Business', url: 'https://feeds.bbci.co.uk/news/business/rss.xml', category: 'business' },
      { name: 'BBC Technology', url: 'https://feeds.bbci.co.uk/news/technology/rss.xml', category: 'tech' },
      { name: 'CNN Business', url: 'http://rss.cnn.com/rss/money_latest.rss', category: 'business' },
      { name: 'The Guardian Business', url: 'https://www.theguardian.com/business/rss', category: 'business' },
      { name: 'NY Times Business', url: 'https://rss.nytimes.com/services/xml/rss/nyt/Business.xml', category: 'business' },
      { name: 'NY Times Technology', url: 'https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml', category: 'tech' },
      
      // Financial News
      { name: 'WSJ Markets', url: 'https://feeds.a.dj.com/rss/RSSMarketsMain.xml', category: 'financial' },
      { name: 'WSJ Business', url: 'https://feeds.a.dj.com/rss/WSJcomUSBusiness.xml', category: 'business' },
      { name: 'Bloomberg', url: 'https://feeds.bloomberg.com/markets/news.rss', category: 'financial' },
      { name: 'CNBC Top News', url: 'https://www.cnbc.com/id/100003114/device/rss/rss.html', category: 'business' },
      { name: 'MarketWatch', url: 'http://feeds.marketwatch.com/marketwatch/topstories', category: 'financial' },
      { name: 'Financial Times', url: 'https://www.ft.com/?format=rss', category: 'financial' },
      { name: 'Forbes', url: 'https://www.forbes.com/real-time/feed2/', category: 'business' },
      { name: 'Fortune', url: 'https://fortune.com/feed/', category: 'business' },
      
      // Tech News
      { name: 'TechCrunch', url: 'https://techcrunch.com/feed/', category: 'tech' },
      { name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml', category: 'tech' },
      { name: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/index', category: 'tech' },
      { name: 'Wired', url: 'https://www.wired.com/feed/rss', category: 'tech' },
      { name: 'VentureBeat', url: 'https://feeds.feedburner.com/venturebeat/SZYF', category: 'tech' },
      { name: 'Engadget', url: 'https://www.engadget.com/rss.xml', category: 'tech' },
      
      // Industry Specific
      { name: 'MIT Tech Review', url: 'https://www.technologyreview.com/feed/', category: 'tech' },
      { name: 'HBR', url: 'https://feeds.hbr.org/harvardbusiness', category: 'business' },
      { name: 'Fast Company', url: 'https://www.fastcompany.com/latest/rss', category: 'business' },
      { name: 'Inc.', url: 'https://www.inc.com/rss', category: 'business' },
      { name: 'Entrepreneur', url: 'https://www.entrepreneur.com/latest.rss', category: 'business' }
    ];
  }

  /**
   * Build Google News RSS feeds dynamically
   */
  buildGoogleNewsFeeds(config) {
    const feeds = [];
    
    // Organization news
    if (config.organization?.name) {
      feeds.push({
        name: `Google News - ${config.organization.name}`,
        url: `https://news.google.com/rss/search?q="${encodeURIComponent(config.organization.name)}"&hl=en-US&gl=US&ceid=US:en`,
        category: 'organization'
      });
    }
    
    // Competitor news
    if (config.competitors) {
      for (const competitor of config.competitors.slice(0, 5)) {
        feeds.push({
          name: `Google News - ${competitor.name}`,
          url: `https://news.google.com/rss/search?q="${encodeURIComponent(competitor.name)}"&hl=en-US&gl=US&ceid=US:en`,
          category: 'competitor'
        });
      }
    }
    
    // Topic news
    if (config.topics) {
      for (const topic of config.topics.slice(0, 5)) {
        feeds.push({
          name: `Google News - ${topic.name}`,
          url: `https://news.google.com/rss/search?q="${encodeURIComponent(topic.name)}"&hl=en-US&gl=US&ceid=US:en`,
          category: 'topic'
        });
      }
    }
    
    // Industry news
    if (config.organization?.industry) {
      feeds.push({
        name: `Google News - ${config.organization.industry}`,
        url: `https://news.google.com/rss/search?q="${encodeURIComponent(config.organization.industry)}"&hl=en-US&gl=US&ceid=US:en`,
        category: 'industry'
      });
    }
    
    return feeds;
  }

  /**
   * Get industry-specific feeds
   */
  getIndustryFeeds(industry) {
    const industryFeeds = {
      'technology': [
        { name: 'Hacker News', url: 'https://hnrss.org/frontpage', category: 'tech' },
        { name: 'Product Hunt', url: 'https://www.producthunt.com/feed', category: 'tech' },
        { name: 'Dev.to', url: 'https://dev.to/feed', category: 'tech' }
      ],
      'finance': [
        { name: 'Zero Hedge', url: 'https://feeds.feedburner.com/zerohedge/feed', category: 'financial' },
        { name: 'Seeking Alpha', url: 'https://seekingalpha.com/feed.xml', category: 'financial' }
      ],
      'retail': [
        { name: 'Retail Dive', url: 'https://www.retaildive.com/feeds/news/', category: 'industry' },
        { name: 'Retail Wire', url: 'https://www.retailwire.com/rss/', category: 'industry' }
      ],
      'healthcare': [
        { name: 'Healthcare IT News', url: 'https://www.healthcareitnews.com/rss', category: 'industry' },
        { name: 'Modern Healthcare', url: 'https://www.modernhealthcare.com/section/rss', category: 'industry' }
      ],
      'automotive': [
        { name: 'Automotive News', url: 'https://www.autonews.com/rss', category: 'industry' },
        { name: 'Electrek', url: 'https://electrek.co/feed/', category: 'industry' }
      ]
    };
    
    return industryFeeds[industry?.toLowerCase()] || [];
  }

  /**
   * Get financial news feeds
   */
  getFinancialFeeds() {
    return [
      { name: 'Yahoo Finance', url: 'https://finance.yahoo.com/news/rss', category: 'financial' },
      { name: 'Investing.com', url: 'https://www.investing.com/rss/news.rss', category: 'financial' },
      { name: 'Business Insider', url: 'https://www.businessinsider.com/rss', category: 'business' }
    ];
  }

  /**
   * Get tech news feeds
   */
  getTechFeeds() {
    return [
      { name: 'Slashdot', url: 'http://rss.slashdot.org/Slashdot/slashdotMain', category: 'tech' },
      { name: 'The Register', url: 'https://www.theregister.com/headlines.atom', category: 'tech' },
      { name: 'AnandTech', url: 'https://www.anandtech.com/rss/', category: 'tech' }
    ];
  }

  /**
   * Get social media feeds
   */
  getSocialFeeds(config) {
    const feeds = [];
    
    // Reddit feeds
    if (config.organization?.name) {
      const subreddit = config.organization.name.toLowerCase().replace(/\s+/g, '');
      feeds.push({
        name: `Reddit - ${config.organization.name}`,
        url: `https://www.reddit.com/search.rss?q=${encodeURIComponent(config.organization.name)}&sort=new`,
        category: 'social'
      });
    }
    
    return feeds;
  }

  /**
   * Fetch all news from sources
   */
  async fetchAllNews(sources, config) {
    const articles = [];
    const keywords = this.extractKeywords(config);
    
    console.log(`📥 Fetching news from ${sources.length} sources...`);
    console.log(`🔍 Keywords: ${keywords.join(', ')}`);
    
    // Process in batches for performance
    const batchSize = 10;
    for (let i = 0; i < sources.length; i += batchSize) {
      const batch = sources.slice(i, i + batchSize);
      const batchPromises = batch.map(source => this.fetchFromSource(source, keywords));
      const batchResults = await Promise.allSettled(batchPromises);
      
      for (const result of batchResults) {
        if (result.status === 'fulfilled' && result.value) {
          articles.push(...result.value);
        }
      }
    }
    
    console.log(`📊 Collected ${articles.length} total articles`);
    
    // Sort by date (newest first)
    articles.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
    
    return articles;
  }

  /**
   * Fetch news from a single source
   */
  async fetchFromSource(source, keywords) {
    try {
      // Add timeout for RSS fetch
      const feedPromise = this.parser.parseURL(source.url);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 5000)
      );
      
      const feed = await Promise.race([feedPromise, timeoutPromise]);
      const articles = [];
      
      // Check if feed has items
      if (!feed.items || feed.items.length === 0) {
        console.log(`⚠️ No items in feed: ${source.name}`);
        return [];
      }
      
      for (const item of feed.items.slice(0, 20)) { // Limit per feed
        const article = {
          title: item.title || 'Untitled',
          link: item.link || '#',
          pubDate: item.pubDate || item.isoDate || new Date(),
          source: source.name,
          category: source.category,
          description: item.contentSnippet || item.summary || '',
          content: item.content || item['content:encoded'] || '',
          relevance: this.calculateRelevance(item, keywords)
        };
        
        // Be more inclusive - lower threshold and include important categories
        if (article.relevance > 0.1 || 
            source.category === 'indexed' || 
            source.category === 'organization' ||
            source.category === 'competitor' ||
            (keywords.length === 0 && source.category === 'industry')) {
          articles.push(article);
        }
      }
      
      if (articles.length > 0) {
        console.log(`✅ ${source.name}: ${articles.length} relevant articles`);
      }
      
      return articles;
    } catch (error) {
      console.log(`❌ Failed to fetch ${source.name}: ${error.message}`);
      
      // Try alternate URL formats for some sources
      if (error.message === 'Timeout' && source.url.includes('https://')) {
        try {
          const altUrl = source.url.replace('https://', 'http://');
          const altFeed = await this.parser.parseURL(altUrl);
          console.log(`✅ Retry successful for ${source.name}`);
          // Process with same logic...
        } catch (retryError) {
          // Retry also failed
        }
      }
      
      return [];
    }
  }

  /**
   * Extract keywords from configuration
   */
  extractKeywords(config) {
    const keywords = [];
    
    // FIX: Only add organization name if it's not an ID
    if (config.organization?.name && 
        !config.organization.name.startsWith('org-') && 
        !config.organization.name.includes('Organization')) {
      keywords.push(config.organization.name);
      // Also add individual words from org name
      const words = config.organization.name.split(' ').filter(w => w.length > 2);
      keywords.push(...words);
    }
    
    // Add aliases if available
    if (config.organization?.aliases) {
      keywords.push(...config.organization.aliases);
    }
    
    if (config.competitors) {
      config.competitors.forEach(c => {
        if (c.name && !c.name.startsWith('org-')) {
          keywords.push(c.name);
        }
      });
    }
    
    if (config.topics) {
      config.topics.forEach(t => {
        if (t.name) {
          keywords.push(t.name);
          // Split compound topics
          const topicWords = t.name.split(/[\s\/]+/).filter(w => w.length > 3);
          keywords.push(...topicWords);
        }
      });
    }
    
    if (config.keywords) {
      keywords.push(...config.keywords);
    }
    
    // Add industry keywords if we have few keywords
    if (keywords.length < 3 && config.organization?.industry) {
      const industryWords = config.organization.industry.split(' ').filter(w => w.length > 3);
      keywords.push(...industryWords);
    }
    
    // Filter out common words and ensure uniqueness
    const commonWords = ['the', 'and', 'or', 'but', 'for', 'with', 'from', 'company', 'inc', 'corp', 'llc'];
    const uniqueKeywords = [...new Set(keywords)]
      .filter(k => k && k.length > 2 && !commonWords.includes(k.toLowerCase()));
    
    console.log('📌 Extracted keywords:', uniqueKeywords);
    return uniqueKeywords;
  }

  /**
   * Calculate article relevance with improved matching
   */
  calculateRelevance(item, keywords) {
    if (!keywords || keywords.length === 0) {
      // If no keywords, consider all articles somewhat relevant
      return 0.3;
    }
    
    const title = (item.title || '').toLowerCase();
    const content = (item.contentSnippet || item.summary || '').toLowerCase();
    const fullText = `${title} ${content}`;
    
    let score = 0;
    let titleMatches = 0;
    
    for (const keyword of keywords) {
      if (!keyword) continue;
      
      const keywordLower = keyword.toLowerCase();
      
      // Title matches are worth more
      if (title.includes(keywordLower)) {
        score += 2;
        titleMatches++;
      }
      
      // Content matches
      if (content.includes(keywordLower)) {
        score += 1;
      }
      
      // Check for partial word matches (e.g., "Microsoft" in "Microsoft's")
      const wordBoundaryPattern = new RegExp(`\\b${keywordLower}`, 'i');
      if (wordBoundaryPattern.test(fullText)) {
        score += 0.5;
      }
    }
    
    // Calculate normalized score
    const maxPossibleScore = keywords.length * 3; // Max if all keywords in title and content
    let relevance = score / maxPossibleScore;
    
    // Boost relevance if title has matches
    if (titleMatches > 0) {
      relevance = Math.min(1, relevance * 1.5);
    }
    
    return relevance;
  }

  /**
   * Categorize news articles
   */
  async categorizeNews(articles, config) {
    const categorized = {
      topStories: [],
      organization: [],
      competitors: [],
      industry: [],
      market: [],
      regulatory: [],
      technical: []
    };
    
    for (const article of articles) {
      // Check relevance to organization
      if (this.matchesEntity(article, config.organization?.name)) {
        categorized.organization.push(article);
        
        // High relevance org articles are also top stories
        if (article.relevance > 0.5) {
          categorized.topStories.push(article);
        }
      }
      
      // Check relevance to competitors
      if (config.competitors) {
        for (const competitor of config.competitors) {
          if (this.matchesEntity(article, competitor.name)) {
            categorized.competitors.push(article);
            break;
          }
        }
      }
      
      // Categorize by content type
      const text = `${article.title} ${article.description}`.toLowerCase();
      
      if (text.match(/market|trading|stock|shares|nasdaq|dow|s&p/i)) {
        categorized.market.push(article);
      }
      
      if (text.match(/regulation|compliance|sec|ftc|law|legal|court/i)) {
        categorized.regulatory.push(article);
      }
      
      if (text.match(/technology|ai|software|platform|innovation|digital/i)) {
        categorized.technical.push(article);
      }
      
      // Industry news (not specific to org or competitors)
      if (article.category === 'industry' || article.category === 'business') {
        categorized.industry.push(article);
      }
    }
    
    // Select top stories if not enough
    if (categorized.topStories.length < 5) {
      // Add most relevant articles from all categories
      const allArticles = [...articles].sort((a, b) => b.relevance - a.relevance);
      categorized.topStories = allArticles.slice(0, 5);
    }
    
    return categorized;
  }

  /**
   * Check if article matches entity with fuzzy matching
   */
  matchesEntity(article, entityName) {
    if (!entityName || entityName.startsWith('org-')) return false;
    
    const text = `${article.title || ''} ${article.description || ''}`.toLowerCase();
    const entity = entityName.toLowerCase();
    
    // Direct match
    if (text.includes(entity)) {
      return true;
    }
    
    // Check for partial matches (e.g., "Apple" in "Apple's" or "Apple Inc")
    const wordBoundaryPattern = new RegExp(`\\b${entity}`, 'i');
    if (wordBoundaryPattern.test(text)) {
      return true;
    }
    
    // Check for individual words in multi-word entities
    const entityWords = entity.split(' ').filter(w => w.length > 3);
    if (entityWords.length > 1) {
      // Require at least 2 words to match for multi-word entities
      const matchCount = entityWords.filter(word => text.includes(word)).length;
      return matchCount >= Math.min(2, entityWords.length);
    }
    
    return false;
  }

  /**
   * Generate executive summary
   */
  generateSummary(sections) {
    const totalArticles = Object.values(sections).reduce((sum, section) => sum + section.length, 0);
    
    const summary = {
      totalArticles: totalArticles,
      breakdown: {
        topStories: sections.topStories.length,
        organization: sections.organizationNews.length,
        competitors: sections.competitorNews.length,
        industry: sections.industryNews.length,
        market: sections.marketTrends.length,
        regulatory: sections.regulatoryUpdates.length,
        technical: sections.technicalDevelopments.length
      },
      keyHighlights: []
    };
    
    // Extract key highlights from top stories
    for (const story of sections.topStories.slice(0, 3)) {
      summary.keyHighlights.push({
        headline: story.title,
        source: story.source,
        link: story.link
      });
    }
    
    return summary;
  }
}

module.exports = NewsRoundupService;