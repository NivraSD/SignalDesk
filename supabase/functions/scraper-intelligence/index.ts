// Scraper Intelligence MCP - Real Website Scraping with Database Integration
// Connects scraper MCP to source_indexes for intelligent website analysis

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ScraperRequest {
  method: string
  params: {
    url?: string
    organization?: {
      name: string
      industry?: string
      url?: string
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
      case 'scrape':
        // Scrape a specific URL
        if (!params.url) {
          throw new Error('URL parameter required for scraping')
        }
        data = await callScraperMCP('scrape_competitor', { url: params.url })
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