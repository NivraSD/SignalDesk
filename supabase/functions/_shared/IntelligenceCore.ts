/**
 * INTELLIGENCE CORE - Central Brain of SignalDesk
 * This is the SINGLE SOURCE OF TRUTH that all Edge Functions use
 * Connects all the disconnected parts of the system
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Industry configurations with REAL data
const INDUSTRY_CONFIG = {
  technology: {
    keywords: [
      'artificial intelligence', 'AI', 'machine learning', 'cloud computing',
      'cybersecurity', 'SaaS', 'API', 'blockchain', 'quantum computing',
      'edge computing', '5G', 'IoT', 'automation', 'digital transformation'
    ],
    competitors: [
      'Microsoft', 'Google', 'Apple', 'Amazon', 'Meta', 'OpenAI',
      'Tesla', 'NVIDIA', 'Intel', 'IBM', 'Oracle', 'Salesforce'
    ],
    rss_feeds: [
      'https://techcrunch.com/feed/',
      'https://www.theverge.com/rss/index.xml',
      'https://feeds.arstechnica.com/arstechnica/index',
      'https://www.wired.com/feed/rss',
      'https://feeds.feedburner.com/venturebeat/SZYF'
    ],
    news_queries: [
      'artificial intelligence news',
      'tech industry updates',
      'startup funding rounds',
      'cybersecurity breaches'
    ]
  },
  
  finance: {
    keywords: [
      'interest rates', 'Fed', 'inflation', 'recession', 'banking',
      'cryptocurrency', 'Bitcoin', 'fintech', 'digital banking',
      'lending', 'investment', 'IPO', 'merger', 'acquisition'
    ],
    competitors: [
      'JPMorgan Chase', 'Bank of America', 'Wells Fargo', 'Goldman Sachs',
      'Morgan Stanley', 'Citigroup', 'BlackRock', 'PayPal', 'Square', 'Stripe'
    ],
    rss_feeds: [
      'https://feeds.bloomberg.com/markets/news.rss',
      'https://feeds.reuters.com/reuters/businessNews',
      'https://www.cnbc.com/id/100003114/device/rss/rss.html'
    ],
    news_queries: [
      'stock market today',
      'cryptocurrency news',
      'federal reserve announcement',
      'banking crisis'
    ]
  },
  
  healthcare: {
    keywords: [
      'FDA approval', 'clinical trial', 'drug development', 'biotech',
      'telemedicine', 'digital health', 'AI healthcare', 'genomics',
      'vaccine', 'medical device', 'pharma', 'patient care'
    ],
    competitors: [
      'Johnson & Johnson', 'Pfizer', 'Moderna', 'AstraZeneca', 'Merck',
      'Abbott', 'Medtronic', 'UnitedHealth', 'CVS Health', 'Teladoc'
    ],
    rss_feeds: [
      'https://www.statnews.com/feed/',
      'https://medcitynews.com/feed/',
      'https://www.fiercepharma.com/rss/xml'
    ],
    news_queries: [
      'FDA drug approval',
      'clinical trial results',
      'healthcare innovation',
      'medical breakthrough'
    ]
  },
  
  // Add more industries as needed
  default: {
    keywords: ['industry news', 'business updates', 'market trends'],
    competitors: [],
    rss_feeds: ['https://feeds.reuters.com/reuters/businessNews'],
    news_queries: ['business news today']
  }
}

export class IntelligenceCore {
  private supabase: any
  
  constructor() {
    this.supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
  }
  
  /**
   * Get complete intelligence configuration for an organization
   * This is called by EVERY Edge Function to know what to monitor
   * NOW USES: AI-enhanced industry data + comprehensive MasterSourceRegistry
   */
  async getOrganizationConfig(organization: any) {
    console.log(`🧠 Getting enhanced configuration for ${organization.name}`)
    console.log(`📝 Input organization data:`, {
      name: organization.name,
      industry: organization.industry,
      hasCompetitors: !!organization.competitors,
      competitorCount: organization.competitors?.length || 0
    })
    
    // FIRST: Use AI-enhanced industry insights if available
    const aiIndustryInsights = organization.industryInsights || {}
    const industry = organization.industry || this.identifyIndustry(organization)
    console.log(`🏭 Identified industry: ${industry} (provided: ${organization.industry}, detected: ${this.identifyIndustry(organization)})`)
    
    // SECOND: Get comprehensive sources from MasterSourceRegistry
    const comprehensiveSources = await this.getComprehensiveSources(industry)
    
    // THIRD: Get any custom sources from database
    const customSources = await this.getCustomSources(organization)
    
    // FOURTH: Identify specific competitors using AI + discovered data
    const competitors = await this.identifyCompetitors(organization, industry)
    
    // FIFTH: Build comprehensive monitoring keywords
    const keywords = this.buildComprehensiveKeywords(organization, aiIndustryInsights, comprehensiveSources)
    
    // SIXTH: Merge all media outlets (AI + MasterSourceRegistry)
    const mediaOutlets = this.mergeMediaOutlets(aiIndustryInsights.media_outlets, comprehensiveSources.media_outlets)
    
    console.log(`✅ Enhanced config: ${competitors.length} competitors, ${comprehensiveSources.rss_feeds.length} RSS feeds, ${keywords.length} keywords`)
    
    return {
      organization: organization.name,
      industry,
      keywords,
      competitors,
      stakeholder_groups: organization.stakeholders || aiIndustryInsights.stakeholder_groups || [],
      industry_events: aiIndustryInsights.industry_events || [],
      regulatory_bodies: aiIndustryInsights.regulatory_bodies || [],
      sources: {
        rss_feeds: [...comprehensiveSources.rss_feeds, ...(customSources.rss_feeds || [])],
        news_queries: [...comprehensiveSources.google_news_queries, `"${organization.name}" news`, ...(customSources.news_queries || [])],
        websites: [...comprehensiveSources.websites, this.getIndustryWebsites(industry), ...(customSources.websites || [])],
        media_outlets: mediaOutlets
      },
      monitoring: {
        refresh_interval: 3600000, // 1 hour
        priority_keywords: [organization.name, ...competitors.slice(0, 5), ...keywords.slice(0, 10)],
        alert_keywords: ['crisis', 'lawsuit', 'breach', 'acquisition', 'layoffs', 'bankruptcy', 'investigation', 'recall']
      }
    }
  }
  
  /**
   * Identify industry from organization data
   */
  identifyIndustry(organization: any): string {
    const name = organization.name?.toLowerCase() || ''
    const industry = organization.industry?.toLowerCase() || ''
    
    // Check for conglomerate/trading company FIRST (most specific)
    if (industry.includes('conglomerate') || industry.includes('diversified') || 
        industry.includes('holding') || industry.includes('trading')) {
      return 'conglomerate'
    }
    if (name.includes('mitsui') || name.includes('mitsubishi') || name.includes('sumitomo') || 
        name.includes('itochu') || name.includes('marubeni')) {
      return 'conglomerate'  // Japanese trading companies
    }
    
    // Use exact industry if automotive
    if (industry === 'automotive' || industry.includes('automotive')) {
      return 'automotive'
    }
    
    // Direct industry match
    if (industry.includes('tech') || industry.includes('software') || industry.includes('ai')) {
      return 'technology'
    }
    if (industry.includes('finance') || industry.includes('bank') || industry.includes('fintech')) {
      return 'finance'
    }
    if (industry.includes('health') || industry.includes('medical') || industry.includes('pharma')) {
      return 'healthcare'
    }
    
    // Name-based inference
    if (name.includes('tech') || name.includes('soft') || name.includes('ai')) {
      return 'technology'
    }
    if (name.includes('bank') || name.includes('capital') || name.includes('financial')) {
      return 'finance'
    }
    if (name.includes('health') || name.includes('med') || name.includes('bio')) {
      return 'healthcare'
    }
    
    return 'default'
  }
  
  /**
   * Identify specific competitors for this organization
   */
  async identifyCompetitors(organization: any, industry: string): Promise<string[]> {
    const competitors = []
    
    // FIRST - Check if competitors were provided directly (from intelligent discovery)
    if (organization.competitors && Array.isArray(organization.competitors)) {
      console.log(`✅ Using ${organization.competitors.length} discovered competitors for ${organization.name}`)
      return organization.competitors
    }
    
    // SECOND - Check if we have stored competitors in database
    const { data } = await this.supabase
      .from('organization_intelligence')
      .select('competitors')
      .eq('organization_name', organization.name)
      .single()
    
    if (data?.competitors) {
      return data.competitors
    }
    
    // Otherwise use industry defaults
    const industryConfig = INDUSTRY_CONFIG[industry]
    if (industryConfig) {
      console.log(`📊 Using industry config for ${industry}: ${industryConfig.competitors.length} competitors available`)
      // Return ALL competitors for conglomerates, more for others
      if (industry === 'conglomerate' || industry === 'trading_company') {
        return industryConfig.competitors // Return all 10 for conglomerates
      }
      return industryConfig.competitors.slice(0, 8) // Return 8 for other industries
    }
    
    console.log(`⚠️ No industry config found for ${industry}`)
    return []
  }
  
  /**
   * Get custom sources from database
   */
  async getCustomSources(organization: any) {
    const { data } = await this.supabase
      .from('source_indexes')
      .select('entity_data')
      .eq('entity_name', organization.name)
      .single()
    
    return data?.entity_data?.sources || {}
  }
  
  /**
   * Get industry-specific websites to monitor
   */
  getIndustryWebsites(industry: string): string[] {
    const websites = {
      technology: [
        'https://techcrunch.com',
        'https://theverge.com',
        'https://arstechnica.com'
      ],
      finance: [
        'https://bloomberg.com',
        'https://reuters.com/business',
        'https://ft.com'
      ],
      healthcare: [
        'https://statnews.com',
        'https://fiercepharma.com',
        'https://medcitynews.com'
      ],
      default: [
        'https://reuters.com',
        'https://bloomberg.com'
      ]
    }
    
    return websites[industry] || websites.default
  }
  
  /**
   * Gather intelligence from all configured sources
   */
  async gatherIntelligence(config: any) {
    const intelligence: {
      news: any[],
      competitors: any[],
      opportunities: any[],
      alerts: any[]
    } = {
      news: [],
      competitors: [],
      opportunities: [],
      alerts: []
    }
    
    console.log('🔍 Starting REAL data gathering for:', config.organization)
    
    // DIRECTLY fetch news from APIs since Edge Functions can't call each other
    const NEWS_API_KEY = Deno.env.get('NEWS_API_KEY') || '44466831285e41dfa4c1fb4bf6f1a92f'
    
    try {
      console.log('📰 Fetching news directly from NewsAPI...')
      
      // Build search query
      const searchTerms = [
        config.organization,
        ...config.keywords.slice(0, 3),
        ...config.competitors.slice(0, 2)
      ].filter(Boolean).join(' OR ')
      
      const newsUrl = `https://newsapi.org/v2/everything?q=${encodeURIComponent(searchTerms)}&language=en&sortBy=publishedAt&pageSize=10&apiKey=${NEWS_API_KEY}`
      
      // Add timeout to prevent hanging
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 3000) // 3 second timeout
      
      const newsResponse = await fetch(newsUrl, {
        signal: controller.signal
      })
      clearTimeout(timeoutId)
      
      if (newsResponse.ok) {
        const newsData = await newsResponse.json()
        console.log('📰 NewsAPI response:', {
          status: newsData.status,
          totalResults: newsData.totalResults,
          articles: newsData.articles?.length || 0
        })
        
        if (newsData.articles && newsData.articles.length > 0) {
          intelligence.news = newsData.articles.map((article: any) => ({
            title: article.title,
            description: article.description,
            url: article.url,
            source: article.source?.name || 'NewsAPI',
            publishedAt: article.publishedAt,
            content: article.content
          }))
          console.log(`✅ Got ${intelligence.news.length} real news articles from NewsAPI`)
        }
      } else {
        console.error('NewsAPI returned error:', newsResponse.status)
      }
    } catch (error) {
      console.error('Failed to fetch news directly:', error.message)
    }
    
    // Skip Google News RSS backup to prevent timeouts - NewsAPI should be enough
    
    // Fallback to RSS if no news found
    if (intelligence.news.length === 0) {
      console.log('⚠️ No news from Edge Function, trying RSS feeds...')
      for (const feedUrl of config.sources.rss_feeds) {
        try {
          const articles = await this.fetchRSSFeed(feedUrl)
          intelligence.news.push(...articles)
        } catch (error) {
          console.log(`RSS feed error for ${feedUrl}:`, error.message)
        }
      }
    }
    
    // Search for competitor mentions
    for (const competitor of config.competitors) {
      const mentions = intelligence.news.filter(article => 
        article.title?.includes(competitor) || 
        article.description?.includes(competitor)
      )
      if (mentions.length > 0) {
        intelligence.competitors.push({
          name: competitor,
          mentions: mentions.length,
          articles: mentions.slice(0, 3)
        })
      }
    }
    
    // Identify opportunities (high-relevance articles)
    intelligence.opportunities = intelligence.news
      .filter(article => {
        const text = `${article.title} ${article.description}`.toLowerCase()
        return config.keywords.some(keyword => text.includes(keyword.toLowerCase()))
      })
      .slice(0, 10)
    
    // Check for alerts
    const alertArticles = intelligence.news.filter(article => {
      const text = `${article.title} ${article.description}`.toLowerCase()
      return config.monitoring.alert_keywords.some(keyword => text.includes(keyword))
    })
    
    if (alertArticles.length > 0) {
      intelligence.alerts = alertArticles.map(article => ({
        type: 'news_alert',
        severity: 'high',
        title: article.title,
        source: article.source,
        url: article.url,
        timestamp: article.publishedAt
      }))
    }
    
    return intelligence
  }
  
  /**
   * Fetch and parse RSS feed
   */
  async fetchRSSFeed(url: string) {
    const articles = []
    
    try {
      const response = await fetch(url)
      if (!response.ok) return articles
      
      const xml = await response.text()
      
      // Simple RSS parsing
      const items = xml.match(/<item>([\s\S]*?)<\/item>/gi) || []
      
      for (const item of items.slice(0, 5)) {
        const title = item.match(/<title>(.*?)<\/title>/)?.[1] || ''
        const description = item.match(/<description>(.*?)<\/description>/)?.[1] || ''
        const link = item.match(/<link>(.*?)<\/link>/)?.[1] || ''
        const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || ''
        
        articles.push({
          title: title.replace(/<!\[CDATA\[|\]\]>/g, ''),
          description: description.replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<[^>]*>/g, ''),
          url: link,
          source: new URL(url).hostname,
          publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString()
        })
      }
    } catch (error) {
      console.error(`RSS feed error: ${error.message}`)
    }
    
    return articles
  }

  /**
   * Get comprehensive sources from MasterSourceRegistry
   * This replaces the limited hardcoded INDUSTRY_CONFIG
   */
  async getComprehensiveSources(industry: string) {
    // Import MasterSourceRegistry logic (simplified version for Edge Function)
    const masterSources = this.getMasterSourceRegistry()
    
    // Get sources for this specific industry
    const industrySources = masterSources.getSourcesForIndustry(industry)
    
    return {
      rss_feeds: (industrySources.rss_feeds || []).map(feed => 
        typeof feed === 'string' ? feed : feed.url
      ),
      google_news_queries: industrySources.google_news_queries || [],
      websites: industrySources.websites || [],
      media_outlets: (industrySources.rss_feeds || []).map(feed => ({
        name: typeof feed === 'string' ? feed.split('/')[2] : feed.name,
        url: typeof feed === 'string' ? feed : feed.url,
        category: typeof feed === 'string' ? 'general' : feed.category,
        priority: typeof feed === 'string' ? 'medium' : feed.priority
      }))
    }
  }

  /**
   * Simplified MasterSourceRegistry for Edge Functions
   * Contains the comprehensive source database
   */
  getMasterSourceRegistry() {
    return {
      getSourcesForIndustry: (industry: string) => {
        const sources = this.getIndustrySourcesDatabase()
        
        if (!industry) {
          return {
            rss_feeds: sources.global.major_news,
            google_news_queries: ['business news', 'industry trends', 'market updates'],
            websites: []
          }
        }
        
        // Normalize industry name
        const normalizedIndustry = industry.toLowerCase().replace(/[^a-z]/g, '')
        
        // Try exact match first
        if (sources[normalizedIndustry]) {
          return {
            rss_feeds: sources[normalizedIndustry].rss || [],
            google_news_queries: sources[normalizedIndustry].google_news || [],
            websites: sources[normalizedIndustry].websites || []
          }
        }
        
        // Try partial match
        for (const key in sources) {
          if (key !== 'global' && (key.includes(normalizedIndustry) || normalizedIndustry.includes(key))) {
            return {
              rss_feeds: sources[key].rss || [],
              google_news_queries: sources[key].google_news || [],
              websites: sources[key].websites || []
            }
          }
        }
        
        // Comprehensive industry mapping for all variations
        const industryMap: Record<string, string> = {
          // Technology variations
          'tech': 'technology',
          'software': 'technology',
          'saas': 'technology',
          'ai': 'technology',
          'it': 'technology',
          'digital': 'technology',
          
          // Conglomerate variations - keep conglomerate as conglomerate!
          'conglomerate': 'conglomerate',  // Explicit mapping to itself
          'diversified': 'conglomerate',
          'diversifiedconglomerate': 'conglomerate',
          'holding': 'conglomerate',
          'holdingcompany': 'conglomerate',
          'tradingcompany': 'trading_company',
          'generaltrading': 'trading_company',
          'sogoshosha': 'trading_company',
          
          // Finance variations
          'fintech': 'finance',
          'banking': 'finance',
          'bank': 'finance',
          'financial': 'finance',
          'financialservices': 'finance',
          'investment': 'finance',
          'privateequity': 'private_equity',
          'pe': 'private_equity',
          'hedgefund': 'finance',
          'assetmanagement': 'finance',
          
          // Healthcare variations
          'pharma': 'healthcare',
          'pharmaceutical': 'healthcare',
          'medical': 'healthcare',
          'health': 'healthcare',
          'biotech': 'healthcare',
          'biotechnology': 'healthcare',
          'lifesciences': 'healthcare',
          
          // Automotive variations
          'auto': 'automotive',
          'automobile': 'automotive',
          'cars': 'automotive',
          'vehicles': 'automotive',
          'ev': 'automotive',
          
          // Real Estate variations
          'realestate': 'real_estate',
          'property': 'real_estate',
          'reit': 'real_estate',
          'propertymanagement': 'real_estate',
          'commercialrealestate': 'real_estate',
          
          // Retail variations
          'ecommerce': 'retail',
          'shopping': 'retail',
          'consumer': 'retail',
          'cpg': 'retail',
          'consumergoods': 'retail',
          
          // Food & Beverage variations
          'food': 'food_beverage',
          'beverage': 'food_beverage',
          'restaurant': 'food_beverage',
          'qsr': 'food_beverage',
          'foodservice': 'food_beverage',
          
          // Transportation variations
          'airline': 'transportation',
          'shipping': 'transportation',
          'logistics': 'transportation',
          'freight': 'transportation',
          'delivery': 'transportation',
          
          // Hospitality variations
          'hotel': 'hospitality',
          'travel': 'hospitality',
          'tourism': 'hospitality',
          'leisure': 'hospitality',
          
          // Manufacturing variations
          'industrial': 'manufacturing',
          'machinery': 'manufacturing',
          'equipment': 'manufacturing',
          
          // Aerospace variations
          'aircraft': 'aerospace',
          'aviation': 'aerospace',
          'space': 'aerospace',
          'defense': 'aerospace',
          
          // Telecom variations
          'telecom': 'telecommunications',
          'telco': 'telecommunications',
          'wireless': 'telecommunications',
          'mobile': 'telecommunications',
          
          // Media variations
          'entertainment': 'media',
          'broadcasting': 'media',
          'streaming': 'media',
          'publishing': 'media',
          
          // Energy variations
          'oil': 'energy',
          'gas': 'energy',
          'utilities': 'energy',
          'renewable': 'energy',
          'solar': 'energy',
          'wind': 'energy',
          
          // Professional Services variations
          'consulting': 'consulting',
          'professionalservices': 'consulting',
          'advisory': 'consulting',
          'accounting': 'consulting',
          
          // Insurance variations
          'insurtech': 'insurance',
          'reinsurance': 'insurance',
          'underwriting': 'insurance',
          
          // Agriculture variations
          'farming': 'agriculture',
          'agtech': 'agriculture',
          'agribusiness': 'agriculture',
          'agricultural': 'agriculture'
        }
        
        const mappedIndustry = industryMap[normalizedIndustry]
        if (mappedIndustry && sources[mappedIndustry]) {
          return {
            rss_feeds: sources[mappedIndustry].rss || [],
            google_news_queries: sources[mappedIndustry].google_news || [],
            websites: sources[mappedIndustry].websites || []
          }
        }
        
        // Default to business sources with industry-specific queries
        return {
          rss_feeds: sources.global.major_news.slice(0, 10),
          google_news_queries: [
            `${industry} news`,
            `${industry} trends`,
            `${industry} market`,
            `${industry} industry`,
            'business news'
          ],
          websites: []
        }
      }
    }
  }

  /**
   * Comprehensive industry sources database - COMPLETE coverage for all industries
   */
  getIndustrySourcesDatabase() {
    return {
      // TECHNOLOGY & SOFTWARE
      technology: {
        rss: [
          { name: 'TechCrunch', url: 'https://techcrunch.com/feed/', priority: 'critical', category: 'tech_news' },
          { name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml', priority: 'critical', category: 'tech_news' },
          { name: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/index', priority: 'high', category: 'tech_news' },
          { name: 'Wired', url: 'https://www.wired.com/feed/rss', priority: 'high', category: 'tech_news' },
          { name: 'VentureBeat', url: 'https://feeds.feedburner.com/venturebeat/SZYF', priority: 'high', category: 'tech_news' },
          { name: 'MIT Tech Review', url: 'https://www.technologyreview.com/feed/', priority: 'high', category: 'research' }
        ],
        google_news: [
          'artificial intelligence', 'machine learning', 'cloud computing', 'cybersecurity',
          'software development', 'blockchain', 'quantum computing', 'IoT', '5G technology'
        ],
        competitors: ['Microsoft', 'Google', 'Apple', 'Amazon', 'Meta', 'Oracle', 'Salesforce', 'Adobe']
      },
      
      // CONGLOMERATES & TRADING COMPANIES
      conglomerate: {
        rss: [
          { name: 'Nikkei Asia', url: 'https://asia.nikkei.com/rss/feed/nar', priority: 'critical', category: 'asian_business' },
          { name: 'Japan Times Business', url: 'https://www.japantimes.co.jp/feed/business/', priority: 'critical', category: 'japan_business' },
          { name: 'Financial Times', url: 'https://www.ft.com/rss/home', priority: 'critical', category: 'global_business' },
          { name: 'Reuters Business', url: 'https://feeds.reuters.com/reuters/businessNews', priority: 'critical', category: 'business' }
        ],
        google_news: [
          'sogo shosha', 'trading company', 'Mitsubishi Corporation', 'Mitsui', 'Sumitomo', 'Itochu',
          'Marubeni', 'conglomerate strategy', 'diversified portfolio', 'keiretsu', 'zaibatsu'
        ],
        competitors: ['Mitsubishi Corporation', 'Sumitomo Corporation', 'Itochu Corporation', 'Marubeni Corporation', 
                     'Sojitz', 'Toyota Tsusho', 'Berkshire Hathaway', 'General Electric', 'Siemens', '3M']
      },
      
      trading_company: {
        rss: [
          { name: 'Nikkei Asia', url: 'https://asia.nikkei.com/rss/feed/nar', priority: 'critical', category: 'asian_business' },
          { name: 'Japan Times Business', url: 'https://www.japantimes.co.jp/feed/business/', priority: 'critical', category: 'japan_business' },
          { name: 'Trade Finance Global', url: 'https://www.tradefinanceglobal.com/feed/', priority: 'high', category: 'trade' }
        ],
        google_news: [
          'general trading company', 'sogo shosha', 'commodity trading', 'international trade',
          'supply chain management', 'trade finance', 'export import'
        ],
        competitors: ['Mitsubishi Corporation', 'Mitsui & Co.', 'Sumitomo Corporation', 'Itochu Corporation', 
                     'Marubeni', 'Sojitz', 'Glencore', 'Trafigura', 'Vitol', 'Cargill']
      },
      
      // AUTOMOTIVE
      automotive: {
        rss: [
          { name: 'Automotive News', url: 'https://www.autonews.com/feed', priority: 'critical', category: 'auto' },
          { name: 'Electrek', url: 'https://electrek.co/feed/', priority: 'high', category: 'electric_vehicles' },
          { name: 'Green Car Reports', url: 'https://www.greencarreports.com/rss', priority: 'high', category: 'green_vehicles' }
        ],
        google_news: [
          'electric vehicles', 'autonomous driving', 'automotive chips', 'vehicle recalls', 
          'auto manufacturing', 'charging infrastructure', 'EV adoption', 'Tesla', 'Toyota', 'Ford'
        ],
        competitors: ['Toyota', 'Volkswagen', 'Tesla', 'General Motors', 'Ford', 'Stellantis', 'BMW', 'Mercedes-Benz', 'Honda', 'Nissan']
      },
      
      // FINANCE & BANKING
      finance: {
        rss: [
          { name: 'Bloomberg', url: 'https://feeds.bloomberg.com/markets/news.rss', priority: 'critical', category: 'markets' },
          { name: 'Reuters Business', url: 'https://feeds.reuters.com/reuters/businessNews', priority: 'critical', category: 'business' },
          { name: 'CNBC Top News', url: 'https://www.cnbc.com/id/100003114/device/rss/rss.html', priority: 'high', category: 'business' },
          { name: 'Financial Times', url: 'https://www.ft.com/rss/home', priority: 'critical', category: 'finance' }
        ],
        google_news: [
          'stock market', 'cryptocurrency', 'federal reserve', 'interest rates',
          'inflation', 'recession', 'IPO', 'mergers acquisitions', 'fintech', 'banking crisis'
        ],
        competitors: ['JPMorgan Chase', 'Bank of America', 'ICBC', 'Wells Fargo', 'HSBC', 'Citigroup', 'Goldman Sachs', 'Morgan Stanley']
      },
      
      private_equity: {
        rss: [
          { name: 'PE Hub', url: 'https://www.pehub.com/feed/', priority: 'critical', category: 'pe_news' },
          { name: 'Private Equity International', url: 'https://www.privateequityinternational.com/feed/', priority: 'critical', category: 'pe_news' },
          { name: 'Pitchbook News', url: 'https://pitchbook.com/news/rss', priority: 'high', category: 'pe_deals' }
        ],
        google_news: [
          'private equity deals', 'leveraged buyout', 'portfolio company', 'fund raising',
          'exit strategy', 'venture capital', 'growth equity', 'distressed investing'
        ],
        competitors: ['Blackstone', 'KKR', 'Apollo', 'Carlyle Group', 'TPG', 'Warburg Pincus', 'CVC Capital', 'EQT', 'Advent International']
      },
      
      // HEALTHCARE & PHARMA
      healthcare: {
        rss: [
          { name: 'STAT News', url: 'https://www.statnews.com/feed/', priority: 'critical', category: 'health_news' },
          { name: 'FiercePharma', url: 'https://www.fiercepharma.com/rss/xml', priority: 'high', category: 'pharma' },
          { name: 'MedCity News', url: 'https://medcitynews.com/feed/', priority: 'high', category: 'health_innovation' },
          { name: 'Healthcare Dive', url: 'https://www.healthcaredive.com/feeds/news/', priority: 'high', category: 'healthcare' }
        ],
        google_news: [
          'FDA approval', 'clinical trials', 'drug development', 'medical devices',
          'telemedicine', 'health insurance', 'vaccine development', 'biotech', 'pharma merger'
        ],
        competitors: ['Johnson & Johnson', 'Pfizer', 'Roche', 'Novartis', 'Merck', 'AbbVie', 'Sanofi', 'GSK', 'AstraZeneca', 'Moderna']
      },
      
      // RETAIL & E-COMMERCE
      retail: {
        rss: [
          { name: 'Retail Dive', url: 'https://www.retaildive.com/feeds/news/', priority: 'high', category: 'retail_news' },
          { name: 'Chain Store Age', url: 'https://chainstoreage.com/rss.xml', priority: 'medium', category: 'retail_chains' },
          { name: 'Modern Retail', url: 'https://www.modernretail.co/feed/', priority: 'high', category: 'ecommerce' }
        ],
        google_news: [
          'e-commerce', 'retail sales', 'supply chain', 'consumer spending',
          'holiday shopping', 'omnichannel retail', 'Amazon', 'Walmart', 'retail technology'
        ],
        competitors: ['Amazon', 'Walmart', 'Alibaba', 'Costco', 'Home Depot', 'CVS', 'Target', 'Kroger', 'JD.com', 'Shopify']
      },
      
      // ENERGY & UTILITIES
      energy: {
        rss: [
          { name: 'Oil & Gas Journal', url: 'https://www.ogj.com/rss/', priority: 'critical', category: 'oil_gas' },
          { name: 'Renewable Energy World', url: 'https://www.renewableenergyworld.com/feed/', priority: 'high', category: 'renewable' },
          { name: 'Energy Digital', url: 'https://www.energydigital.com/feed', priority: 'high', category: 'energy_news' }
        ],
        google_news: [
          'oil prices', 'renewable energy', 'solar power', 'wind energy', 'natural gas',
          'energy transition', 'carbon neutral', 'electric grid', 'OPEC', 'crude oil'
        ],
        competitors: ['Saudi Aramco', 'ExxonMobil', 'Shell', 'Chevron', 'BP', 'TotalEnergies', 'ConocoPhillips', 'NextEra Energy']
      },
      
      // REAL ESTATE
      real_estate: {
        rss: [
          { name: 'Real Estate Weekly', url: 'https://rew-online.com/feed/', priority: 'high', category: 'real_estate' },
          { name: 'The Real Deal', url: 'https://therealdeal.com/feed/', priority: 'high', category: 'real_estate' },
          { name: 'CoStar', url: 'https://www.costar.com/News/RSS', priority: 'high', category: 'commercial_real_estate' }
        ],
        google_news: [
          'real estate market', 'property prices', 'commercial real estate', 'REITs',
          'mortgage rates', 'housing market', 'property development', 'real estate investment'
        ],
        competitors: ['CBRE', 'Jones Lang LaSalle', 'Cushman & Wakefield', 'Colliers', 'Brookfield', 'Simon Property', 'Prologis']
      },
      
      // MANUFACTURING & INDUSTRIAL
      manufacturing: {
        rss: [
          { name: 'IndustryWeek', url: 'https://www.industryweek.com/feed', priority: 'high', category: 'manufacturing' },
          { name: 'Manufacturing.net', url: 'https://www.manufacturing.net/rss/all', priority: 'high', category: 'manufacturing' },
          { name: 'Supply Chain Dive', url: 'https://www.supplychaindive.com/feeds/news/', priority: 'high', category: 'supply_chain' }
        ],
        google_news: [
          'manufacturing', 'supply chain', 'industrial automation', 'factory production',
          'lean manufacturing', 'industry 4.0', 'robotics', 'quality control'
        ],
        competitors: ['General Electric', 'Siemens', 'Honeywell', '3M', 'Caterpillar', 'Boeing', 'Lockheed Martin', 'Raytheon']
      },
      
      // AEROSPACE & DEFENSE
      aerospace: {
        rss: [
          { name: 'Aviation Week', url: 'https://aviationweek.com/rss.xml', priority: 'critical', category: 'aerospace' },
          { name: 'Defense News', url: 'https://www.defensenews.com/arc/outboundfeeds/rss/', priority: 'critical', category: 'defense' },
          { name: 'Space News', url: 'https://spacenews.com/feed/', priority: 'high', category: 'space' }
        ],
        google_news: [
          'aerospace', 'defense contracts', 'military aircraft', 'space exploration',
          'satellite', 'NASA', 'SpaceX', 'Boeing', 'fighter jets', 'missile defense'
        ],
        competitors: ['Boeing', 'Airbus', 'Lockheed Martin', 'Northrop Grumman', 'Raytheon', 'General Dynamics', 'BAE Systems', 'SpaceX']
      },
      
      // TELECOMMUNICATIONS
      telecommunications: {
        rss: [
          { name: 'Light Reading', url: 'https://www.lightreading.com/rss.xml', priority: 'high', category: 'telecom' },
          { name: 'Fierce Wireless', url: 'https://www.fiercewireless.com/rss/xml', priority: 'high', category: 'wireless' },
          { name: 'RCR Wireless', url: 'https://www.rcrwireless.com/feed', priority: 'high', category: 'telecom' }
        ],
        google_news: [
          '5G network', 'telecom', 'wireless', 'broadband', 'fiber optic',
          'mobile network', 'spectrum auction', 'network infrastructure'
        ],
        competitors: ['AT&T', 'Verizon', 'T-Mobile', 'China Mobile', 'Vodafone', 'Deutsche Telekom', 'Orange', 'Telefonica']
      },
      
      // MEDIA & ENTERTAINMENT
      media: {
        rss: [
          { name: 'Variety', url: 'https://variety.com/feed/', priority: 'high', category: 'entertainment' },
          { name: 'Hollywood Reporter', url: 'https://www.hollywoodreporter.com/feed', priority: 'high', category: 'entertainment' },
          { name: 'Deadline', url: 'https://deadline.com/feed/', priority: 'high', category: 'entertainment' }
        ],
        google_news: [
          'streaming services', 'box office', 'television ratings', 'media merger',
          'content production', 'Netflix', 'Disney', 'Warner Bros', 'advertising revenue'
        ],
        competitors: ['Disney', 'Netflix', 'Warner Bros Discovery', 'Comcast', 'Paramount', 'Sony', 'Amazon Prime', 'Apple TV+']
      },
      
      // HOSPITALITY & TOURISM
      hospitality: {
        rss: [
          { name: 'Hotel News Now', url: 'https://www.hotelnewsnow.com/rss/', priority: 'high', category: 'hospitality' },
          { name: 'Skift', url: 'https://skift.com/feed/', priority: 'high', category: 'travel' },
          { name: 'PhocusWire', url: 'https://www.phocuswire.com/rss', priority: 'high', category: 'travel_tech' }
        ],
        google_news: [
          'hotel industry', 'tourism', 'travel recovery', 'airline industry',
          'cruise lines', 'vacation rental', 'business travel', 'hospitality technology'
        ],
        competitors: ['Marriott', 'Hilton', 'Airbnb', 'Booking.com', 'Expedia', 'IHG', 'Hyatt', 'Accor', 'Wyndham']
      },
      
      // FOOD & BEVERAGE
      food_beverage: {
        rss: [
          { name: 'Food Dive', url: 'https://www.fooddive.com/feeds/news/', priority: 'high', category: 'food_industry' },
          { name: 'Food Business News', url: 'https://www.foodbusinessnews.net/rss', priority: 'high', category: 'food_industry' },
          { name: 'Beverage Daily', url: 'https://www.beveragedaily.com/rss', priority: 'high', category: 'beverage' }
        ],
        google_news: [
          'food industry', 'restaurant industry', 'food safety', 'supply chain',
          'plant-based food', 'beverage market', 'food tech', 'QSR', 'food delivery'
        ],
        competitors: ['Nestle', 'PepsiCo', 'Coca-Cola', 'Unilever', 'Mondelez', 'Kraft Heinz', 'General Mills', 'Danone', 'Mars']
      },
      
      // TRANSPORTATION & LOGISTICS
      transportation: {
        rss: [
          { name: 'Transport Topics', url: 'https://www.ttnews.com/rss.xml', priority: 'high', category: 'transport' },
          { name: 'Logistics Management', url: 'https://www.logisticsmgmt.com/rss', priority: 'high', category: 'logistics' },
          { name: 'FreightWaves', url: 'https://www.freightwaves.com/feed', priority: 'high', category: 'freight' }
        ],
        google_news: [
          'logistics', 'shipping', 'freight', 'transportation', 'supply chain',
          'cargo', 'trucking industry', 'rail transport', 'port operations'
        ],
        competitors: ['UPS', 'FedEx', 'DHL', 'Maersk', 'C.H. Robinson', 'XPO Logistics', 'J.B. Hunt', 'DSV', 'Kuehne + Nagel']
      },
      
      // CONSULTING & PROFESSIONAL SERVICES
      consulting: {
        rss: [
          { name: 'Consulting Magazine', url: 'https://www.consultingmag.com/feed/', priority: 'high', category: 'consulting' },
          { name: 'Management Consulted', url: 'https://managementconsulted.com/feed/', priority: 'medium', category: 'consulting' }
        ],
        google_news: [
          'management consulting', 'strategy consulting', 'digital transformation',
          'business advisory', 'McKinsey', 'BCG', 'Bain', 'Deloitte', 'Accenture'
        ],
        competitors: ['McKinsey', 'BCG', 'Bain', 'Deloitte', 'PwC', 'EY', 'KPMG', 'Accenture', 'IBM Consulting', 'Capgemini']
      },
      
      // INSURANCE
      insurance: {
        rss: [
          { name: 'Insurance Journal', url: 'https://www.insurancejournal.com/feed/', priority: 'high', category: 'insurance' },
          { name: 'PropertyCasualty360', url: 'https://www.propertycasualty360.com/feed/', priority: 'high', category: 'insurance' }
        ],
        google_news: [
          'insurance industry', 'insurtech', 'claims processing', 'underwriting',
          'reinsurance', 'catastrophe insurance', 'health insurance', 'life insurance'
        ],
        competitors: ['Berkshire Hathaway', 'Ping An', 'Allianz', 'AXA', 'MetLife', 'Prudential', 'Munich Re', 'Zurich', 'AIG']
      },
      
      // AGRICULTURE
      agriculture: {
        rss: [
          { name: 'AgWeb', url: 'https://www.agweb.com/rss/', priority: 'high', category: 'agriculture' },
          { name: 'Farm Progress', url: 'https://www.farmprogress.com/rss', priority: 'high', category: 'farming' }
        ],
        google_news: [
          'agriculture', 'farming', 'crop prices', 'agricultural technology',
          'precision farming', 'sustainable agriculture', 'food security', 'agribusiness'
        ],
        competitors: ['Cargill', 'ADM', 'Bunge', 'John Deere', 'Bayer Crop Science', 'Corteva', 'Syngenta', 'Nutrien']
      },
      
      // GLOBAL NEWS SOURCES (fallback)
      global: {
        major_news: [
          { name: 'Reuters Top News', url: 'https://feeds.reuters.com/reuters/topNews', priority: 'critical' },
          { name: 'AP News', url: 'https://feeds.apnews.com/rss/apf-topnews', priority: 'critical' },
          { name: 'BBC News', url: 'https://feeds.bbci.co.uk/news/rss.xml', priority: 'critical' },
          { name: 'WSJ Business', url: 'https://feeds.wsj.com/wsj/xml/rss/3_7014.xml', priority: 'critical' },
          { name: 'Financial Times', url: 'https://www.ft.com/rss/home', priority: 'critical' },
          { name: 'Nikkei Asia', url: 'https://asia.nikkei.com/rss/feed/nar', priority: 'critical' }
        ]
      }
    }
  }

  /**
   * Build comprehensive monitoring keywords from AI insights + sources
   */
  buildComprehensiveKeywords(organization: any, aiInsights: any, sources: any) {
    const keywords = new Set([
      // Organization basics
      organization.name,
      
      // AI-discovered keywords
      ...(organization.keywords || []),
      ...(aiInsights.monitoring_keywords || []),
      
      // Source-based keywords
      ...(sources.google_news_queries || []),
      
      // Competitor names as keywords
      ...(organization.competitors || []),
      
      // Industry-specific terms
      ...(organization.topics || [])
    ])
    
    return Array.from(keywords).slice(0, 25) // Limit to top 25 keywords
  }

  /**
   * Merge AI-discovered media outlets with comprehensive source outlets
   */
  mergeMediaOutlets(aiOutlets: any[], sourceOutlets: any[]) {
    const outlets = new Map()
    
    // Add source outlets first (comprehensive database)
    if (sourceOutlets) {
      sourceOutlets.forEach(outlet => {
        outlets.set(outlet.name || outlet.url, outlet)
      })
    }
    
    // Add AI-discovered outlets (may have more specific industry focus)
    if (aiOutlets) {
      aiOutlets.forEach(outlet => {
        outlets.set(outlet.name, {
          name: outlet.name,
          type: outlet.type,
          focus: outlet.focus,
          priority: 'high', // AI-discovered outlets get high priority
          source: 'ai_discovery'
        })
      })
    }
    
    return Array.from(outlets.values())
  }
}

// Export singleton instance
export const intelligenceCore = new IntelligenceCore()