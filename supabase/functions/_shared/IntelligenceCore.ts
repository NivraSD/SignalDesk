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
   */
  async getOrganizationConfig(organization: any) {
    // Determine industry
    const industry = this.identifyIndustry(organization)
    const config = INDUSTRY_CONFIG[industry] || INDUSTRY_CONFIG.default
    
    // Get any custom sources from database
    const customSources = await this.getCustomSources(organization)
    
    // Identify specific competitors for this org
    const competitors = await this.identifyCompetitors(organization, industry)
    
    return {
      organization: organization.name,
      industry,
      keywords: [...config.keywords, organization.name],
      competitors: [...new Set([...competitors, ...config.competitors.slice(0, 5)])],
      sources: {
        rss_feeds: config.rss_feeds,
        news_queries: [...config.news_queries, `"${organization.name}" news`],
        websites: this.getIndustryWebsites(industry)
      },
      monitoring: {
        refresh_interval: 3600000, // 1 hour
        priority_keywords: [organization.name, ...competitors.slice(0, 3)],
        alert_keywords: ['crisis', 'lawsuit', 'breach', 'acquisition', 'layoffs']
      }
    }
  }
  
  /**
   * Identify industry from organization data
   */
  identifyIndustry(organization: any): string {
    const name = organization.name?.toLowerCase() || ''
    const industry = organization.industry?.toLowerCase() || ''
    
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
    
    // First check if we have stored competitors
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
}

// Export singleton instance
export const intelligenceCore = new IntelligenceCore()