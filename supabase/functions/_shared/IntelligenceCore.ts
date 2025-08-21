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
    
    // FIRST: Use AI-enhanced industry insights if available
    const aiIndustryInsights = organization.industryInsights || {}
    const industry = organization.industry || this.identifyIndustry(organization)
    
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
      // Return top competitors based on organization size/type
      return industryConfig.competitors.slice(0, 5)
    }
    
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
    const intelligence = {
      news: [],
      competitors: [],
      opportunities: [],
      alerts: []
    }
    
    // Fetch from RSS feeds
    for (const feedUrl of config.sources.rss_feeds) {
      try {
        const articles = await this.fetchRSSFeed(feedUrl)
        intelligence.news.push(...articles)
      } catch (error) {
        console.log(`RSS feed error for ${feedUrl}:`, error.message)
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
        
        // Industry mapping for common variations
        const industryMap: Record<string, string> = {
          'tech': 'technology',
          'fintech': 'finance',
          'saas': 'technology',
          'software': 'technology',
          'banking': 'finance',
          'pharma': 'healthcare',
          'medical': 'healthcare',
          'auto': 'automotive',
          'cars': 'automotive',
          'food': 'retail',
          'restaurant': 'hospitality',
          'hotel': 'hospitality',
          'airline': 'transportation',
          'aircraft': 'aerospace',
          'realestate': 'real_estate',
          'property': 'real_estate',
          'ecommerce': 'retail',
          'shopping': 'retail'
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
   * Comprehensive industry sources database (key sources from MasterSourceRegistry)
   */
  getIndustrySourcesDatabase() {
    return {
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
        ]
      },
      
      automotive: {
        rss: [
          { name: 'Automotive News', url: 'https://www.autonews.com/feed', priority: 'critical', category: 'auto' },
          { name: 'Electrek', url: 'https://electrek.co/feed/', priority: 'high', category: 'electric_vehicles' },
          { name: 'Green Car Reports', url: 'https://www.greencarreports.com/rss', priority: 'high', category: 'green_vehicles' }
        ],
        google_news: [
          'electric vehicles', 'autonomous driving', 'automotive chips', 'vehicle recalls', 
          'auto manufacturing', 'charging infrastructure', 'EV adoption'
        ]
      },
      
      finance: {
        rss: [
          { name: 'Bloomberg', url: 'https://feeds.bloomberg.com/markets/news.rss', priority: 'critical', category: 'markets' },
          { name: 'Reuters Business', url: 'https://feeds.reuters.com/reuters/businessNews', priority: 'critical', category: 'business' },
          { name: 'CNBC Top News', url: 'https://www.cnbc.com/id/100003114/device/rss/rss.html', priority: 'high', category: 'business' }
        ],
        google_news: [
          'stock market', 'cryptocurrency', 'federal reserve', 'interest rates',
          'inflation', 'recession', 'IPO', 'mergers acquisitions', 'fintech'
        ]
      },
      
      healthcare: {
        rss: [
          { name: 'STAT News', url: 'https://www.statnews.com/feed/', priority: 'critical', category: 'health_news' },
          { name: 'FiercePharma', url: 'https://www.fiercepharma.com/rss/xml', priority: 'high', category: 'pharma' },
          { name: 'MedCity News', url: 'https://medcitynews.com/feed/', priority: 'high', category: 'health_innovation' }
        ],
        google_news: [
          'FDA approval', 'clinical trials', 'drug development', 'medical devices',
          'telemedicine', 'health insurance', 'vaccine development'
        ]
      },
      
      retail: {
        rss: [
          { name: 'Retail Dive', url: 'https://www.retaildive.com/feeds/news/', priority: 'high', category: 'retail_news' },
          { name: 'Chain Store Age', url: 'https://chainstoreage.com/rss.xml', priority: 'medium', category: 'retail_chains' }
        ],
        google_news: [
          'e-commerce', 'retail sales', 'supply chain', 'consumer spending',
          'holiday shopping', 'omnichannel retail'
        ]
      },
      
      global: {
        major_news: [
          { name: 'Reuters Top News', url: 'https://feeds.reuters.com/reuters/topNews', priority: 'critical' },
          { name: 'AP News', url: 'https://feeds.apnews.com/rss/apf-topnews', priority: 'critical' },
          { name: 'BBC News', url: 'https://feeds.bbci.co.uk/news/rss.xml', priority: 'critical' },
          { name: 'WSJ Business', url: 'https://feeds.wsj.com/wsj/xml/rss/3_7014.xml', priority: 'critical' }
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