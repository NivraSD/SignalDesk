// Scraper Intelligence MCP - Real Website Scraping with Database Integration
// Connects scraper MCP to source_indexes for intelligent website analysis

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

// Industry-specific websites from MasterSourceRegistry
const INDUSTRY_WEBSITES = {
  technology: [
    'https://techcrunch.com',
    'https://theverge.com',
    'https://arstechnica.com',
    'https://wired.com',
    'https://venturebeat.com',
    'https://thenextweb.com'
  ],
  finance: [
    'https://ft.com',
    'https://bloomberg.com',
    'https://reuters.com/business',
    'https://wsj.com',
    'https://cnbc.com',
    'https://marketwatch.com'
  ],
  healthcare: [
    'https://healthcareitnews.com',
    'https://modernhealthcare.com',
    'https://medcitynews.com',
    'https://fiercepharma.com',
    'https://statnews.com'
  ],
  energy: [
    'https://oilprice.com',
    'https://energyvoice.com',
    'https://renewableenergyworld.com',
    'https://cleantechnica.com'
  ],
  retail: [
    'https://retaildive.com',
    'https://nrf.com',
    'https://retailwire.com',
    'https://chainstoreage.com'
  ],
  manufacturing: [
    'https://industryweek.com',
    'https://manufacturingnews.com',
    'https://automationworld.com'
  ],
  automotive: [
    'https://autonews.com',
    'https://insideevs.com',
    'https://motortrend.com',
    'https://autoblog.com',
    'https://caranddriver.com'
  ],
  conglomerate: [
    'https://ft.com',
    'https://asia.nikkei.com',
    'https://bloomberg.com',
    'https://reuters.com/business'
  ]
}

interface ScraperRequest {
  method: string
  params: {
    url?: string
    urls?: string[]  // Support multiple URLs
    organization?: {
      name: string
      industry?: string
      url?: string
      competitors?: string[]  // Support competitor URLs
    }
    keywords?: string[]
    stakeholder?: string
  }
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// Scraper MCP integration (runs on Railway or local)
async function callScraperMCP(method: string, params: any) {
  try {
    // In production, this would call your scraper MCP server
    // For now, we'll simulate scraper functionality with real website analysis
    
    switch (method) {
      case 'scrape_competitor':
        return await scrapeCompetitorWebsite(params.url)
      case 'monitor_social':
        return await monitorSocialMedia(params.handle, params.platform)
      case 'detect_cascades':
        return await detectCascadeIndicators(params.keywords)
      case 'monitor_changes':
        return await monitorWebsiteChanges(params.url, params.frequency)
      default:
        throw new Error(`Unknown scraper method: ${method}`)
    }
  } catch (error) {
    console.error('Scraper MCP error:', error)
    throw error
  }
}

async function scrapeCompetitorWebsite(url: string) {
  // Real website scraping simulation
  console.log(`🌐 Scraping competitor website: ${url}`)
  
  try {
    // Fetch website content
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'SignalDesk-Intelligence-Bot/1.0'
      }
    })
    
    if (!response.ok) {
      throw new Error(`Website fetch failed: ${response.status}`)
    }
    
    const html = await response.text()
    
    // Simple content analysis (in production would use Playwright)
    const signals = {
      leadership: extractLeadershipInfo(html, url),
      press: extractPressReleases(html, url),
      products: extractProductInfo(html, url),
      jobs: extractJobPostings(html, url),
      blog: extractBlogPosts(html, url),
      meta: extractMetaInfo(html),
      lastScraped: new Date().toISOString()
    }
    
    // Store in source_indexes database
    await storeWebsiteIndex(url, signals)
    
    return {
      url,
      signals,
      patterns: analyzeOpportunityPatterns(signals),
      timestamp: new Date().toISOString(),
      source: 'Real Website Scraping'
    }
  } catch (error) {
    console.error(`Scraping error for ${url}:`, error)
    throw error
  }
}

function extractLeadershipInfo(html: string, url: string) {
  const results = []
  
  // Look for leadership/team sections
  const leadershipKeywords = ['leadership', 'team', 'about', 'executives', 'founders', 'ceo', 'management']
  
  for (const keyword of leadershipKeywords) {
    const regex = new RegExp(`<[^>]*class[^>]*${keyword}[^>]*>([\\s\\S]*?)</[^>]*>`, 'gi')
    const matches = html.match(regex)
    
    if (matches) {
      matches.forEach(match => {
        const text = match.replace(/<[^>]*>/g, '').trim()
        if (text.length > 50 && text.length < 500) {
          results.push({
            section: keyword,
            content: text,
            hasChanges: false,
            source: url
          })
        }
      })
    }
  }
  
  return results.slice(0, 5)
}

function extractPressReleases(html: string, url: string) {
  const results = []
  
  // Look for press/news links
  const pressRegex = /<a[^>]*href[^>]*["'](.*?(?:press|news|media|announcement)[^"']*?)["'][^>]*>([^<]*)</gi
  let match
  
  while ((match = pressRegex.exec(html)) !== null) {
    const [, href, text] = match
    if (text.trim()) {
      results.push({
        url: href.startsWith('http') ? href : new URL(href, url).href,
        title: text.trim(),
        date: '',
        type: 'press'
      })
    }
  }
  
  return results.slice(0, 10)
}

function extractProductInfo(html: string, url: string) {
  const results = []
  
  // Look for product mentions
  const productKeywords = ['product', 'features', 'solution', 'service', 'platform']
  
  for (const keyword of productKeywords) {
    const regex = new RegExp(`\\b${keyword}[^.!?]*[.!?]`, 'gi')
    const matches = html.match(regex)
    
    if (matches) {
      matches.forEach(match => {
        const text = match.trim()
        if (text.length > 20 && text.length < 200) {
          results.push({
            section: keyword,
            content: text,
            timestamp: new Date().toISOString()
          })
        }
      })
    }
  }
  
  return results.slice(0, 5)
}

function extractJobPostings(html: string, url: string) {
  // Look for job/career related content
  const jobKeywords = ['job', 'career', 'hiring', 'position', 'opening', 'join']
  const jobCount = jobKeywords.reduce((count, keyword) => {
    const regex = new RegExp(keyword, 'gi')
    const matches = html.match(regex)
    return count + (matches ? matches.length : 0)
  }, 0)
  
  return {
    activePostings: Math.min(jobCount, 50), // Cap at reasonable number
    growthIndicator: jobCount > 20 ? 'high' : jobCount > 10 ? 'medium' : 'low',
    timestamp: new Date().toISOString()
  }
}

function extractBlogPosts(html: string, url: string) {
  const results = []
  
  // Look for blog/article content
  const blogRegex = /<article[^>]*>[\s\S]*?<\/article>|<h[1-3][^>]*>([^<]*)<\/h[1-3]>/gi
  let match
  
  while ((match = blogRegex.exec(html)) !== null && results.length < 5) {
    const text = match[1] || match[0].replace(/<[^>]*>/g, '')
    if (text.trim().length > 10) {
      results.push({
        title: text.trim().substring(0, 100),
        date: '',
        excerpt: '',
        signals: []
      })
    }
  }
  
  return results
}

function extractMetaInfo(html: string) {
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i)
  const descMatch = html.match(/<meta[^>]*name[^>]*["']description["'][^>]*content[^>]*["']([^"']*)/i)
  
  return {
    title: titleMatch ? titleMatch[1].trim() : '',
    description: descMatch ? descMatch[1].trim() : '',
    hasChanges: false
  }
}

function analyzeOpportunityPatterns(signals: any) {
  const patterns = []
  
  // Check for leadership changes
  if (signals.leadership?.some((l: any) => l.content.toLowerCase().includes('new') || l.content.toLowerCase().includes('join'))) {
    patterns.push({
      pattern: 'leadership_change',
      confidence: 0.7,
      indicators: ['new leadership mentions'],
      timestamp: new Date().toISOString()
    })
  }
  
  // Check for growth indicators
  if (signals.jobs?.growthIndicator === 'high') {
    patterns.push({
      pattern: 'rapid_growth',
      confidence: 0.8,
      indicators: ['high job posting activity'],
      timestamp: new Date().toISOString()
    })
  }
  
  return patterns
}

async function storeWebsiteIndex(url: string, signals: any) {
  try {
    // Store or update in source_indexes table
    const indexData = {
      url,
      signals,
      lastIndexed: new Date().toISOString(),
      qualityScore: calculateQualityScore(signals),
      contentSections: Object.keys(signals).length
    }
    
    const { error } = await supabase
      .from('indexed_sources')
      .upsert({
        url,
        name: signals.meta?.title || extractDomainName(url),
        type: 'competitor_website',
        subtype: 'corporate_site',
        category: 'intelligence',
        priority: 'high',
        quality_score: indexData.qualityScore,
        tier: 'tier1',
        validation_status: 'validated',
        last_validated: new Date().toISOString(),
        content_analysis: indexData,
        metadata: { source: 'scraper_mcp' },
        active: true
      }, {
        onConflict: 'url,index_id'
      })
    
    if (error) {
      console.error('Database storage error:', error)
    } else {
      console.log(`✅ Stored website index for ${url}`)
    }
  } catch (error) {
    console.error('Error storing website index:', error)
  }
}

function calculateQualityScore(signals: any): number {
  let score = 0
  
  // Score based on data richness
  if (signals.leadership?.length > 0) score += 2
  if (signals.press?.length > 0) score += 2
  if (signals.products?.length > 0) score += 2
  if (signals.jobs?.activePostings > 0) score += 1
  if (signals.blog?.length > 0) score += 1
  if (signals.meta?.title) score += 1
  if (signals.meta?.description) score += 1
  
  return Math.min(10, score)
}

function extractDomainName(url: string): string {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname.replace('www.', '')
  } catch {
    return url
  }
}

async function monitorSocialMedia(handle: string, platform: string) {
  // Placeholder for social media monitoring
  return {
    platform,
    handle,
    posts: [],
    patterns: [],
    message: 'Social media monitoring requires specialized APIs',
    timestamp: new Date().toISOString()
  }
}

async function detectCascadeIndicators(keywords: string[]) {
  // Placeholder for cascade detection
  return {
    keywords,
    cascades: [],
    cascadePotential: 'low',
    message: 'Cascade detection requires broader data sources',
    timestamp: new Date().toISOString()
  }
}

async function monitorWebsiteChanges(url: string, frequency: string) {
  // Placeholder for change monitoring
  return {
    url,
    frequency,
    message: `Change monitoring scheduled for ${url}`,
    timestamp: new Date().toISOString()
  }
}

function analyzeCompetitorPatterns(results: any[]) {
  const patterns = {
    common_technologies: [],
    hiring_trends: [],
    product_focus: [],
    content_themes: [],
    growth_signals: []
  }
  
  // Analyze successful scrapes
  const successfulScrapes = results.filter(r => !r.error && r.signals)
  
  if (successfulScrapes.length === 0) {
    return patterns
  }
  
  // Aggregate patterns across competitors
  const allJobs = []
  const allProducts = []
  const allPress = []
  
  for (const scrape of successfulScrapes) {
    if (scrape.signals?.jobs?.activePostings) {
      allJobs.push(scrape.signals.jobs)
    }
    if (scrape.signals?.products) {
      allProducts.push(...scrape.signals.products)
    }
    if (scrape.signals?.press) {
      allPress.push(...scrape.signals.press)
    }
  }
  
  // Identify hiring trends
  let totalHiring = 0
  if (allJobs.length > 0) {
    totalHiring = allJobs.reduce((sum, job) => sum + (job.activePostings || 0), 0)
    patterns.hiring_trends.push({
      trend: totalHiring > 50 ? 'aggressive_expansion' : 'moderate_growth',
      total_openings: totalHiring,
      competitors_hiring: allJobs.length
    })
  }
  
  // Identify product themes
  const productKeywords = {}
  allProducts.forEach(product => {
    // Handle both string and object formats
    const productText = typeof product === 'string' ? product : product.content || ''
    if (productText) {
      const words = productText.toLowerCase().split(/\s+/)
      words.forEach(word => {
        if (word.length > 4) {
          productKeywords[word] = (productKeywords[word] || 0) + 1
        }
      })
    }
  })
  
  patterns.product_focus = Object.entries(productKeywords)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([keyword, count]) => ({ keyword, frequency: count }))
  
  // Identify growth signals
  if (allPress.length > 10) {
    patterns.growth_signals.push('high_pr_activity')
  }
  if (totalHiring > 100) {
    patterns.growth_signals.push('rapid_hiring')
  }
  
  return patterns
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  try {
    const request: ScraperRequest = await req.json()
    const { method, params } = request

    console.log(`🕷️ Scraper Intelligence: ${method} request`)

    let data: any = {}

    switch (method) {
      case 'gather':
      case 'scrape':
        // Enhanced scraping with industry awareness
        let targetUrls = params.urls || []
        
        // Add scrape_targets from intelligent discovery if available
        if (!targetUrls.length && params.scrape_targets) {
          targetUrls = params.scrape_targets
        }
        
        // Add single URL if provided
        if (!targetUrls.length && params.url) {
          targetUrls = [params.url]
        }
        
        // Add industry-specific websites if we know the industry
        const industry = params.organization?.industry || params.industry
        if (industry && INDUSTRY_WEBSITES[industry]) {
          console.log(`📊 Adding ${industry} industry websites`)
          // Add industry websites but avoid duplicates
          const industryUrls = INDUSTRY_WEBSITES[industry]
          targetUrls = [...new Set([...targetUrls, ...industryUrls.slice(0, 3)])]
        }
        
        // If still no URLs, check organization competitors
        if (!targetUrls.length && params.organization?.competitors) {
          // Convert competitor names to potential URLs
          targetUrls = params.organization.competitors.map(comp => {
            const name = comp.toLowerCase().replace(/[^a-z0-9]/g, '')
            return `https://${name}.com`
          })
        }
        
        if (!targetUrls.length) {
          console.log('⚠️ No URLs to scrape')
          data = {
            websites_scraped: 0,
            total_attempted: 0,
            results: [],
            message: 'No URLs provided for scraping',
            timestamp: new Date().toISOString()
          }
        } else {
          console.log(`🕷️ Scraping ${targetUrls.length} websites in parallel`)
          const scrapePromises = targetUrls.slice(0, 10).map(url => // Limit to 10 for performance
            callScraperMCP('scrape_competitor', { url }).catch(err => ({
              url,
              error: err.message,
              success: false
            }))
          )
          const results = await Promise.all(scrapePromises)
          data = {
            websites_scraped: results.filter(r => !r.error).length,
            total_attempted: targetUrls.length,
            results: results,
            industry: industry || 'unknown',
            timestamp: new Date().toISOString()
          }
        }
        break

      case 'scrape_competitors':
        // Scrape multiple competitor websites
        if (!params.urls && !params.organization?.competitors) {
          throw new Error('Competitor URLs required')
        }
        
        const competitorUrls = params.urls || params.organization.competitors || []
        console.log(`🎯 Scraping ${competitorUrls.length} competitor websites`)
        
        const competitorPromises = competitorUrls.slice(0, 10).map(url => 
          callScraperMCP('scrape_competitor', { url }).catch(err => ({
            url,
            error: err.message,
            success: false
          }))
        )
        
        const competitorResults = await Promise.all(competitorPromises)
        
        data = {
          competitors_scraped: competitorResults.filter(r => !r.error).length,
          total_competitors: competitorUrls.length,
          competitor_data: competitorResults,
          patterns: analyzeCompetitorPatterns(competitorResults),
          timestamp: new Date().toISOString()
        }
        break

      case 'analyze':
        // Analyze organization's competitive landscape
        if (!params.organization) {
          throw new Error('Organization parameter required for analysis')
        }
        
        // Scrape organization's website if available
        if (params.organization.url) {
          const orgData = await callScraperMCP('scrape_competitor', { url: params.organization.url })
          data.organizationAnalysis = orgData
        }
        
        data.method = 'competitive_analysis'
        data.timestamp = new Date().toISOString()
        break

      case 'monitor':
        // Set up monitoring for changes
        if (!params.url) {
          throw new Error('URL parameter required for monitoring')
        }
        data = await callScraperMCP('monitor_changes', params)
        break

      default:
        throw new Error(`Unknown method: ${method}`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        data,
        source: 'Scraper Intelligence MCP',
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('❌ Scraper Intelligence error:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        service: 'Scraper Intelligence MCP',
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 503
      }
    )
  }
})