/**
 * Intelligent Source Discovery Service
 * Dynamically determines the best sources for monitoring based on:
 * - Organization industry and characteristics
 * - Competitor profiles
 * - Topic relevance
 * - Geographic considerations
 * - Source quality and reliability
 */

const axios = require('axios');

class SourceDiscoveryService {
  constructor() {
    this.sourceCache = new Map();
    this.cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours
  }

  /**
   * Get comprehensive sources for an organization
   */
  async getSourcesForOrganization(organization, competitors, topics) {
    console.log('=== INTELLIGENT SOURCE DISCOVERY ===');
    console.log('Organization:', organization?.name);
    console.log('Industry:', organization?.industry);
    console.log('Competitors:', competitors?.map(c => c.name).join(', '));
    console.log('Topics:', topics?.map(t => t.name).join(', '));

    const sources = {
      primary: [],      // Core news sources
      industry: [],     // Industry-specific sources
      specialized: [],  // Topic-specific sources
      competitive: [],  // Competitor monitoring sources
      social: [],       // Social media and forums
      events: [],       // Industry events and conferences
      thought_leaders: [], // Key influencers and experts
      regulatory: [],   // Government and regulatory sources
      academic: []      // Research and academic sources
    };

    // 1. GOOGLE NEWS - Primary source for everything
    sources.primary.push(...this.buildGoogleNewsFeeds(organization, competitors, topics));

    // 2. INDUSTRY-SPECIFIC SOURCES
    sources.industry.push(...await this.getIndustrySpecificSources(organization));

    // 3. COMPETITOR-SPECIFIC SOURCES
    for (const competitor of competitors || []) {
      sources.competitive.push(...await this.getCompetitorSources(competitor));
    }

    // 4. TOPIC-SPECIFIC SOURCES
    for (const topic of topics || []) {
      sources.specialized.push(...await this.getTopicSources(topic));
    }

    // 5. THOUGHT LEADERS & INFLUENCERS
    sources.thought_leaders.push(...await this.identifyThoughtLeaders(organization, topics));

    // 6. INDUSTRY EVENTS
    sources.events.push(...await this.getIndustryEvents(organization));

    // 7. REGULATORY & GOVERNMENT SOURCES
    if (this.needsRegulatoryMonitoring(organization, topics)) {
      sources.regulatory.push(...await this.getRegulatorySourcesx(organization));
    }

    // 8. ACADEMIC & RESEARCH SOURCES
    if (this.needsAcademicSources(topics)) {
      sources.academic.push(...await this.getAcademicSources(topics));
    }

    // 9. SOCIAL MEDIA & FORUMS
    sources.social.push(...this.getSocialMediaSources(organization, competitors));

    return sources;
  }

  /**
   * Build Google News RSS feeds for all entities
   */
  buildGoogleNewsFeeds(organization, competitors, topics) {
    const feeds = [];
    
    // Organization Google News feed
    if (organization?.name) {
      feeds.push({
        name: `Google News - ${organization.name}`,
        url: `https://news.google.com/rss/search?q="${encodeURIComponent(organization.name)}"&hl=en-US&gl=US&ceid=US:en`,
        type: 'google_news',
        priority: 'high',
        entity: organization.name
      });

      // Industry-specific Google News
      if (organization.industry) {
        feeds.push({
          name: `Google News - ${organization.industry}`,
          url: `https://news.google.com/rss/search?q="${encodeURIComponent(organization.industry)}"&hl=en-US&gl=US&ceid=US:en`,
          type: 'google_news',
          priority: 'medium',
          entity: organization.industry
        });
      }
    }

    // Competitor Google News feeds
    for (const competitor of competitors || []) {
      feeds.push({
        name: `Google News - ${competitor.name}`,
        url: `https://news.google.com/rss/search?q="${encodeURIComponent(competitor.name)}"&hl=en-US&gl=US&ceid=US:en`,
        type: 'google_news',
        priority: 'high',
        entity: competitor.name
      });
    }

    // Topic Google News feeds
    for (const topic of topics || []) {
      feeds.push({
        name: `Google News - ${topic.name}`,
        url: `https://news.google.com/rss/search?q="${encodeURIComponent(topic.name)}"&hl=en-US&gl=US&ceid=US:en`,
        type: 'google_news',
        priority: topic.priority || 'medium',
        entity: topic.name
      });
    }

    // Combined search for competitive intelligence
    if (organization?.name && competitors?.length > 0) {
      const competitorNames = competitors.map(c => c.name).join(' OR ');
      feeds.push({
        name: 'Google News - Competitive Intelligence',
        url: `https://news.google.com/rss/search?q="${encodeURIComponent(organization.name)}" AND ("${encodeURIComponent(competitorNames)}")&hl=en-US&gl=US&ceid=US:en`,
        type: 'google_news',
        priority: 'high',
        entity: 'competitive'
      });
    }

    return feeds;
  }

  /**
   * Get industry-specific sources based on organization profile
   */
  async getIndustrySpecificSources(organization) {
    const sources = [];
    const industry = organization?.industry?.toLowerCase() || '';

    // Athletic/Sports industry
    if (industry.includes('athletic') || industry.includes('footwear') || industry.includes('sports')) {
      sources.push(
        { name: 'ESPN Business', url: 'https://www.espn.com/espn/rss/news', type: 'industry', priority: 'high' },
        { name: 'Sports Business Journal', url: 'https://www.sportsbusinessjournal.com/rss/news.aspx', type: 'industry', priority: 'high' },
        { name: 'Footwear News', url: 'https://footwearnews.com/feed/', type: 'industry', priority: 'high' },
        { name: 'SGI Europe', url: 'https://sgieu.com/feed/', type: 'industry', priority: 'medium' },
        { name: 'Just Style', url: 'https://www.just-style.com/feed/', type: 'industry', priority: 'medium' },
        { name: 'Sportico', url: 'https://sportico.com/feed/', type: 'industry', priority: 'high' },
        { name: 'The Athletic Business', url: 'https://theathletic.com/rss/', type: 'industry', priority: 'medium' },
        { name: 'Retail Dive', url: 'https://www.retaildive.com/feeds/news/', type: 'industry', priority: 'medium' },
        { name: 'Fashion United', url: 'https://fashionunited.com/rss/news', type: 'industry', priority: 'medium' },
        { name: 'Hypebeast', url: 'https://hypebeast.com/feed', type: 'industry', priority: 'medium' },
        { name: 'Complex Sneakers', url: 'https://www.complex.com/sneakers/rss', type: 'industry', priority: 'medium' },
        { name: 'Sneaker News', url: 'https://sneakernews.com/feed/', type: 'industry', priority: 'medium' }
      );
    }

    // Tech/Cloud industry
    else if (industry.includes('cloud') || industry.includes('aws') || industry.includes('azure') || 
             industry.includes('technology') || industry.includes('software')) {
      sources.push(
        { name: 'TechCrunch', url: 'https://techcrunch.com/feed/', type: 'industry', priority: 'high' },
        { name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml', type: 'industry', priority: 'high' },
        { name: 'VentureBeat', url: 'https://feeds.feedburner.com/venturebeat/SZYF', type: 'industry', priority: 'high' },
        { name: 'ZDNet', url: 'https://www.zdnet.com/news/rss.xml', type: 'industry', priority: 'medium' },
        { name: 'InfoWorld', url: 'https://www.infoworld.com/index.rss', type: 'industry', priority: 'medium' },
        { name: 'The Register', url: 'https://www.theregister.com/headlines.atom', type: 'industry', priority: 'medium' },
        { name: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/index', type: 'industry', priority: 'medium' },
        { name: 'Cloud Computing News', url: 'https://cloudcomputing-news.net/feed/', type: 'industry', priority: 'high' },
        { name: 'DataCenter Knowledge', url: 'https://www.datacenterknowledge.com/rss.xml', type: 'industry', priority: 'medium' }
      );
    }

    // Retail industry
    else if (industry.includes('retail') || industry.includes('e-commerce') || 
             organization?.name?.toLowerCase().includes('walmart') || organization?.name?.toLowerCase().includes('amazon')) {
      sources.push(
        { name: 'Retail Dive', url: 'https://www.retaildive.com/feeds/news/', type: 'industry', priority: 'high' },
        { name: 'Retail Week', url: 'https://www.retail-week.com/rss/', type: 'industry', priority: 'high' },
        { name: 'Chain Store Age', url: 'https://chainstoreage.com/rss', type: 'industry', priority: 'medium' },
        { name: 'Retail TouchPoints', url: 'https://www.retailtouchpoints.com/feed', type: 'industry', priority: 'medium' },
        { name: 'Internet Retailer', url: 'https://www.digitalcommerce360.com/feed/', type: 'industry', priority: 'medium' },
        { name: 'Retail Wire', url: 'https://www.retailwire.com/feed/', type: 'industry', priority: 'medium' },
        { name: 'Modern Retail', url: 'https://www.modernretail.co/feed/', type: 'industry', priority: 'medium' }
      );
    }

    // Financial Services
    else if (industry.includes('finance') || industry.includes('banking') || industry.includes('fintech')) {
      sources.push(
        { name: 'Financial Times', url: 'https://www.ft.com/rss/home', type: 'industry', priority: 'high' },
        { name: 'Bloomberg', url: 'https://feeds.bloomberg.com/markets/news.rss', type: 'industry', priority: 'high' },
        { name: 'WSJ Markets', url: 'https://feeds.a.dj.com/rss/RSSMarketsMain.xml', type: 'industry', priority: 'high' },
        { name: 'American Banker', url: 'https://www.americanbanker.com/feed', type: 'industry', priority: 'medium' },
        { name: 'Banking Dive', url: 'https://www.bankingdive.com/feeds/news/', type: 'industry', priority: 'medium' },
        { name: 'Finextra', url: 'https://www.finextra.com/rss/headlines.aspx', type: 'industry', priority: 'medium' },
        { name: 'The Banker', url: 'https://www.thebanker.com/rss', type: 'industry', priority: 'medium' }
      );
    }

    // Healthcare
    else if (industry.includes('health') || industry.includes('medical') || industry.includes('pharma')) {
      sources.push(
        { name: 'Healthcare Dive', url: 'https://www.healthcaredive.com/feeds/news/', type: 'industry', priority: 'high' },
        { name: 'Modern Healthcare', url: 'https://www.modernhealthcare.com/section/rss', type: 'industry', priority: 'high' },
        { name: 'Fierce Healthcare', url: 'https://www.fiercehealthcare.com/rss', type: 'industry', priority: 'medium' },
        { name: 'Becker\'s Hospital Review', url: 'https://www.beckershospitalreview.com/rss', type: 'industry', priority: 'medium' },
        { name: 'STAT News', url: 'https://www.statnews.com/feed/', type: 'industry', priority: 'high' },
        { name: 'MedCity News', url: 'https://medcitynews.com/feed/', type: 'industry', priority: 'medium' }
      );
    }

    // Default business sources for any industry
    sources.push(
      { name: 'Reuters Business', url: 'https://www.reutersagency.com/feed/?best-topics=business-finance&post_type=best', type: 'general', priority: 'medium' },
      { name: 'BBC Business', url: 'https://feeds.bbci.co.uk/news/business/rss.xml', type: 'general', priority: 'medium' },
      { name: 'CNBC', url: 'https://www.cnbc.com/id/100003114/device/rss/rss.html', type: 'general', priority: 'medium' },
      { name: 'Forbes', url: 'https://www.forbes.com/business/feed/', type: 'general', priority: 'medium' },
      { name: 'Business Insider', url: 'https://www.businessinsider.com/rss', type: 'general', priority: 'medium' },
      { name: 'Fast Company', url: 'https://www.fastcompany.com/latest/rss', type: 'general', priority: 'medium' }
    );

    return sources;
  }

  /**
   * Get competitor-specific monitoring sources
   */
  async getCompetitorSources(competitor) {
    const sources = [];
    const competitorName = competitor.name.toLowerCase();

    // Add competitor's official channels dynamically based on competitor data
    // This should ideally be loaded from a database or external configuration
    // to avoid hardcoding specific company sources
    
    // For now, we'll use a generic approach that can be configured
    if (competitor.rssFeeds && competitor.rssFeeds.length > 0) {
      // Use competitor-specific RSS feeds if provided in config
      for (const feed of competitor.rssFeeds) {
        sources.push({
          name: `${competitor.name} - ${feed.type}`,
          url: feed.url,
          type: 'competitor_official',
          priority: feed.priority || 'medium'
        });
      }
    } else if (competitorName.includes('microsoft')) {
      sources.push(
        { name: 'Microsoft Blog', url: 'https://blogs.microsoft.com/feed/', type: 'competitor_official', priority: 'high' },
        { name: 'Azure Updates', url: 'https://azurecomcdn.azureedge.net/en-us/updates/feed/', type: 'competitor_official', priority: 'high' }
      );
    } else if (competitorName.includes('amazon') || competitorName.includes('aws')) {
      sources.push(
        { name: 'AWS News Blog', url: 'https://aws.amazon.com/blogs/aws/feed/', type: 'competitor_official', priority: 'high' },
        { name: 'Amazon News', url: 'https://www.aboutamazon.com/news/feed', type: 'competitor_official', priority: 'high' }
      );
    } else if (competitorName.includes('walmart')) {
      sources.push(
        { name: 'Walmart Corporate News', url: 'https://corporate.walmart.com/rss', type: 'competitor_official', priority: 'high' }
      );
    }

    // Add competitor analysis sites
    sources.push(
      { 
        name: `Owler - ${competitor.name}`, 
        url: `https://www.owler.com/company/${competitorName.replace(/\s+/g, '')}/rss`,
        type: 'competitive_intelligence',
        priority: 'medium'
      }
    );

    return sources;
  }

  /**
   * Get topic-specific sources
   */
  async getTopicSources(topic) {
    const sources = [];
    const topicName = topic.name.toLowerCase();

    // Sustainability topics
    if (topicName.includes('sustain') || topicName.includes('environment') || topicName.includes('green')) {
      sources.push(
        { name: 'GreenBiz', url: 'https://www.greenbiz.com/rss.xml', type: 'topic', priority: 'high' },
        { name: 'Sustainable Brands', url: 'https://sustainablebrands.com/rss', type: 'topic', priority: 'high' },
        { name: 'Triple Pundit', url: 'https://www.triplepundit.com/feed/', type: 'topic', priority: 'medium' },
        { name: 'Environmental Leader', url: 'https://www.environmentalleader.com/feed/', type: 'topic', priority: 'medium' }
      );
    }

    // Supply chain topics
    if (topicName.includes('supply chain') || topicName.includes('logistics')) {
      sources.push(
        { name: 'Supply Chain Dive', url: 'https://www.supplychaindive.com/feeds/news/', type: 'topic', priority: 'high' },
        { name: 'Supply Chain Brain', url: 'https://www.supplychainbrain.com/rss', type: 'topic', priority: 'high' },
        { name: 'Logistics Management', url: 'https://www.logisticsmgmt.com/rss', type: 'topic', priority: 'medium' },
        { name: 'FreightWaves', url: 'https://www.freightwaves.com/feed', type: 'topic', priority: 'medium' }
      );
    }

    // AI/ML topics
    if (topicName.includes('ai') || topicName.includes('artificial intelligence') || topicName.includes('machine learning')) {
      sources.push(
        { name: 'MIT Technology Review - AI', url: 'https://www.technologyreview.com/topic/artificial-intelligence/feed', type: 'topic', priority: 'high' },
        { name: 'AI News', url: 'https://artificialintelligence-news.com/feed/', type: 'topic', priority: 'high' },
        { name: 'The Gradient', url: 'https://thegradient.pub/rss/', type: 'topic', priority: 'medium' },
        { name: 'Import AI', url: 'https://jack-clark.net/feed/', type: 'topic', priority: 'medium' }
      );
    }

    // Marketing/Sponsorship topics
    if (topicName.includes('marketing') || topicName.includes('sponsor') || topicName.includes('advertising')) {
      sources.push(
        { name: 'Marketing Dive', url: 'https://www.marketingdive.com/feeds/news/', type: 'topic', priority: 'high' },
        { name: 'AdWeek', url: 'https://www.adweek.com/feed/', type: 'topic', priority: 'high' },
        { name: 'Marketing Land', url: 'https://martech.org/feed/', type: 'topic', priority: 'medium' },
        { name: 'The Drum', url: 'https://www.thedrum.com/feeds/rss/all', type: 'topic', priority: 'medium' }
      );
    }

    // Labor/Union topics
    if (topicName.includes('labor') || topicName.includes('union') || topicName.includes('worker')) {
      sources.push(
        { name: 'Labor Notes', url: 'https://labornotes.org/rss.xml', type: 'topic', priority: 'high' },
        { name: 'HR Dive', url: 'https://www.hrdive.com/feeds/news/', type: 'topic', priority: 'high' },
        { name: 'Workday Blog', url: 'https://blog.workday.com/en-us/feed.xml', type: 'topic', priority: 'medium' }
      );
    }

    // Regulatory topics
    if (topicName.includes('regulat') || topicName.includes('compliance') || topicName.includes('antitrust')) {
      sources.push(
        { name: 'Law360', url: 'https://www.law360.com/rss', type: 'topic', priority: 'high' },
        { name: 'Regulatory Affairs Professionals', url: 'https://www.raps.org/news-and-articles/rss', type: 'topic', priority: 'medium' },
        { name: 'Competition Policy International', url: 'https://www.competitionpolicyinternational.com/feed/', type: 'topic', priority: 'medium' }
      );
    }

    return sources;
  }

  /**
   * Identify thought leaders in the space
   */
  async identifyThoughtLeaders(organization, topics) {
    const leaders = [];
    const industry = organization?.industry?.toLowerCase() || '';

    // Athletic/Sports thought leaders
    if (industry.includes('athletic') || industry.includes('sports')) {
      leaders.push(
        { name: 'Matt Powell', platform: 'Twitter', handle: '@NPDMattPowell', expertise: 'Sports Industry Analysis', type: 'thought_leader' },
        { name: 'Darren Rovell', platform: 'Twitter', handle: '@darrenrovell', expertise: 'Sports Business', type: 'thought_leader' },
        { name: 'Nick DePaula', platform: 'Twitter', handle: '@NickDePaula', expertise: 'Sneaker Industry', type: 'thought_leader' },
        { name: 'Sara Germano', platform: 'Twitter', handle: '@germanotes', expertise: 'Sports Business Reporting', type: 'thought_leader' }
      );
    }

    // Tech/Cloud thought leaders
    if (industry.includes('cloud') || industry.includes('technology')) {
      leaders.push(
        { name: 'Werner Vogels', platform: 'Twitter', handle: '@Werner', expertise: 'AWS CTO', type: 'thought_leader' },
        { name: 'Satya Nadella', platform: 'Twitter', handle: '@satyanadella', expertise: 'Microsoft CEO', type: 'thought_leader' },
        { name: 'Benedict Evans', platform: 'Newsletter', url: 'https://www.ben-evans.com/newsletter', expertise: 'Tech Analysis', type: 'thought_leader' },
        { name: 'Mary Meeker', platform: 'Reports', expertise: 'Internet Trends', type: 'thought_leader' }
      );
    }

    return leaders;
  }

  /**
   * Get upcoming industry events
   */
  async getIndustryEvents(organization) {
    const events = [];
    const industry = organization?.industry?.toLowerCase() || '';
    const currentDate = new Date();

    // Athletic/Sports events
    if (industry.includes('athletic') || industry.includes('sports')) {
      events.push(
        { name: 'Major Sports Brand Investor Days', type: 'investor_event', relevance: 'high' },
        { name: 'Sports Business Summit', type: 'conference', relevance: 'high' },
        { name: 'Footwear Sourcing Summit', type: 'industry_event', relevance: 'medium' },
        { name: 'Outdoor Retailer Show', type: 'trade_show', relevance: 'medium' },
        { name: 'ISPO Munich', type: 'trade_show', relevance: 'high' }
      );
    }

    // Tech events
    if (industry.includes('cloud') || industry.includes('technology')) {
      events.push(
        { name: 'AWS re:Invent', type: 'conference', relevance: 'high' },
        { name: 'Microsoft Build', type: 'conference', relevance: 'high' },
        { name: 'Google Cloud Next', type: 'conference', relevance: 'high' },
        { name: 'KubeCon', type: 'conference', relevance: 'medium' }
      );
    }

    return events;
  }

  /**
   * Get regulatory sources if needed
   */
  async getRegulatorySourcesx(organization) {
    const sources = [];
    
    sources.push(
      { name: 'SEC Filings', url: `https://www.sec.gov/cgi-bin/browse-edgar?company=${encodeURIComponent(organization.name)}&output=atom`, type: 'regulatory', priority: 'high' },
      { name: 'FTC News', url: 'https://www.ftc.gov/feeds/press-releases.xml', type: 'regulatory', priority: 'medium' },
      { name: 'DOJ Antitrust', url: 'https://www.justice.gov/atr/rss.xml', type: 'regulatory', priority: 'medium' },
      { name: 'EU Competition', url: 'https://ec.europa.eu/competition/rss/rss_en.xml', type: 'regulatory', priority: 'medium' }
    );

    return sources;
  }

  /**
   * Get academic sources for research topics
   */
  async getAcademicSources(topics) {
    const sources = [];
    
    for (const topic of topics) {
      sources.push({
        name: `Google Scholar - ${topic.name}`,
        url: `https://scholar.google.com/scholar_alerts?view_op=create_alert_options&hl=en&alert_query="${encodeURIComponent(topic.name)}"`,
        type: 'academic',
        priority: 'low',
        note: 'Requires setup of Google Scholar alerts'
      });
    }

    sources.push(
      { name: 'arXiv CS', url: 'https://arxiv.org/rss/cs', type: 'academic', priority: 'low' },
      { name: 'SSRN', url: 'https://papers.ssrn.com/sol3/RSS/RSS_Reader.cfm', type: 'academic', priority: 'low' }
    );

    return sources;
  }

  /**
   * Get social media monitoring sources
   */
  getSocialMediaSources(organization, competitors) {
    const sources = [];

    // Reddit monitoring
    if (organization?.name) {
      const orgName = organization.name.toLowerCase().replace(/\s+/g, '');
      sources.push({
        name: `Reddit - ${organization.name}`,
        url: `https://www.reddit.com/search.rss?q="${encodeURIComponent(organization.name)}"&sort=new`,
        type: 'social',
        priority: 'medium'
      });
    }

    // LinkedIn monitoring (requires API)
    sources.push({
      name: 'LinkedIn Company Updates',
      type: 'social',
      priority: 'medium',
      note: 'Requires LinkedIn API integration'
    });

    // Twitter/X monitoring (requires API)
    sources.push({
      name: 'Twitter/X Monitoring',
      type: 'social',
      priority: 'high',
      note: 'Requires Twitter API integration'
    });

    return sources;
  }

  /**
   * Determine if regulatory monitoring is needed
   */
  needsRegulatoryMonitoring(organization, topics) {
    const needsRegulatory = 
      topics?.some(t => t.name.toLowerCase().includes('regulat') || 
                       t.name.toLowerCase().includes('compliance') ||
                       t.name.toLowerCase().includes('antitrust')) ||
      organization?.industry?.toLowerCase().includes('finance') ||
      organization?.industry?.toLowerCase().includes('health');
    
    return needsRegulatory;
  }

  /**
   * Determine if academic sources are needed
   */
  needsAcademicSources(topics) {
    return topics?.some(t => 
      t.name.toLowerCase().includes('research') ||
      t.name.toLowerCase().includes('innovation') ||
      t.name.toLowerCase().includes('technology') ||
      t.name.toLowerCase().includes('ai')
    );
  }

  /**
   * Validate and test RSS feed URLs
   */
  async validateFeed(feedUrl) {
    try {
      const response = await axios.get(feedUrl, {
        timeout: 5000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SignalDesk/1.0)'
        }
      });
      return response.status === 200;
    } catch (error) {
      console.log(`Feed validation failed for ${feedUrl}:`, error.message);
      return false;
    }
  }

  /**
   * Get all sources organized by priority
   */
  async getAllSourcesOrganized(sources) {
    const allSources = [];
    
    // Flatten all source categories
    for (const category of Object.values(sources)) {
      allSources.push(...category);
    }

    // Remove duplicates based on URL
    const uniqueSources = Array.from(
      new Map(allSources.map(s => [s.url, s])).values()
    );

    // Sort by priority
    const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
    uniqueSources.sort((a, b) => 
      (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0)
    );

    return uniqueSources;
  }
}

module.exports = SourceDiscoveryService;