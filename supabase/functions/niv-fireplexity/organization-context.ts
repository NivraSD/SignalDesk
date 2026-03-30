// Lightweight organization context for NIV
// Provides competitor context and source registry without full Discovery process

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { INDUSTRY_COMPETITORS_DETAILED } from '../mcp-discovery/industry-competitors.ts'

export interface OrganizationContext {
  organizationId: string
  organizationName: string
  industry?: string
  subIndustry?: string
  directCompetitors: string[]
  indirectCompetitors: string[]
  emergingCompetitors: string[]
  keyWords: string[]
  trustedSources: string[]
  lastUpdated?: string
}

// Cache organization contexts for session persistence
const contextCache = new Map<string, OrganizationContext>()

// Cache for master-source-registry results (avoid repeated calls)
const sourceRegistryCache = new Map<string, string[]>()

/**
 * Fetch trusted sources from master-source-registry
 * This replaces the hardcoded 13 domains with 100+ curated sources
 */
async function fetchTrustedSourcesFromRegistry(industry?: string): Promise<string[]> {
  const cacheKey = industry || 'general'

  // Check cache first
  if (sourceRegistryCache.has(cacheKey)) {
    console.log(`📋 Using cached sources for ${cacheKey}`)
    return sourceRegistryCache.get(cacheKey)!
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseKey) {
      console.log('⚠️ No Supabase credentials, using fallback sources')
      return getFallbackSources()
    }

    console.log(`📚 Fetching sources from master-source-registry for industry: ${industry || 'general'}`)

    const response = await fetch(`${supabaseUrl}/functions/v1/master-source-registry`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({ industry: industry || 'general' })
    })

    if (!response.ok) {
      console.log(`⚠️ Master-source-registry returned ${response.status}, using fallback`)
      return getFallbackSources()
    }

    const data = await response.json()
    const sources = data.data || data

    // Extract domains from all source categories
    const domains: string[] = []

    // Helper to extract domain from URL
    const extractDomain = (url: string): string | null => {
      try {
        const urlObj = new URL(url)
        return urlObj.hostname.replace('www.', '')
      } catch {
        return null
      }
    }

    // Process all source categories
    const categories = ['competitive', 'media', 'regulatory', 'market', 'forward', 'specialized']
    for (const category of categories) {
      const categorySources = sources[category] || []
      if (Array.isArray(categorySources)) {
        categorySources.forEach((source: any) => {
          if (source.url) {
            const domain = extractDomain(source.url)
            if (domain) domains.push(domain)
          }
        })
      }
    }

    // Remove duplicates and cache
    const uniqueDomains = [...new Set(domains)]
    console.log(`✅ Loaded ${uniqueDomains.length} trusted source domains from master-source-registry`)

    sourceRegistryCache.set(cacheKey, uniqueDomains)
    return uniqueDomains

  } catch (error) {
    console.error('❌ Error fetching from master-source-registry:', error)
    return getFallbackSources()
  }
}

/**
 * Fallback sources if master-source-registry is unavailable
 * Uses tier-1 business and tech sources as baseline
 */
function getFallbackSources(): string[] {
  console.log('📋 Using fallback tier-1 sources')
  return [
    // Tier 1 Business
    'reuters.com', 'bloomberg.com', 'ft.com', 'wsj.com',
    'businessinsider.com', 'fortune.com', 'forbes.com',
    'cnbc.com', 'economist.com', 'marketwatch.com',
    // Tier 1 Tech
    'techcrunch.com', 'theverge.com', 'arstechnica.com',
    'wired.com', 'venturebeat.com', 'theinformation.com'
  ]
}

/**
 * Get or create organization context for NIV
 * First checks cache, then database, then creates minimal context
 */
export async function getOrganizationContext(
  organizationId: string,
  conversationId?: string
): Promise<OrganizationContext> {
  // Check session cache first
  const cacheKey = conversationId ? `${organizationId}_${conversationId}` : organizationId
  if (contextCache.has(cacheKey)) {
    console.log(`📋 Using cached context for ${organizationId}`)
    return contextCache.get(cacheKey)!
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, supabaseKey)

  // Try to get existing Discovery profile
  const { data: discoveryData } = await supabase
    .from('mcp_discoveries')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (discoveryData) {
    console.log(`✅ Found existing Discovery profile for ${organizationId}`)
    const context: OrganizationContext = {
      organizationId,
      organizationName: discoveryData.organization_name || organizationId,
      industry: discoveryData.industry,
      subIndustry: discoveryData.sub_industry,
      directCompetitors: discoveryData.direct_competitors || [],
      indirectCompetitors: discoveryData.indirect_competitors || [],
      emergingCompetitors: discoveryData.emerging_competitors || [],
      keyWords: discoveryData.keywords || [],
      trustedSources: await extractTrustedSources(discoveryData),
      lastUpdated: discoveryData.created_at
    }

    contextCache.set(cacheKey, context)
    return context
  }

  // Create minimal context based on organization name
  console.log(`🔨 Creating minimal context for ${organizationId}`)
  const context = await createMinimalContext(organizationId)
  contextCache.set(cacheKey, context)

  return context
}

/**
 * Create minimal context without full Discovery
 * Uses industry competitor data and intelligent defaults
 */
async function createMinimalContext(organizationId: string): Promise<OrganizationContext> {
  // Fetch actual organization name from database
  let organizationName = organizationId // Fallback to ID
  let industryFromDb = undefined

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey)
      const { data: org } = await supabase
        .from('organizations')
        .select('name, industry')
        .eq('id', organizationId)
        .single()

      if (org) {
        organizationName = org.name
        industryFromDb = org.industry
        console.log(`✅ Fetched org name: ${organizationName}`)
      }
    }
  } catch (error) {
    console.log(`⚠️ Could not fetch org name, using ID: ${error.message}`)
  }

  // Determine industry and competitors based on organization name
  const { industry, subIndustry, competitors } = identifyIndustryAndCompetitors(organizationName)

  // Use industry from database if available
  const finalIndustry = industryFromDb || industry

  // Generate smart keywords based on organization name
  const keywords = generateKeywords(organizationName, finalIndustry)

  // Select appropriate news sources from master-source-registry
  const sources = await selectNewsSources(finalIndustry, subIndustry)

  return {
    organizationId,
    organizationName,
    industry: finalIndustry,
    subIndustry,
    directCompetitors: competitors.direct,
    indirectCompetitors: competitors.indirect,
    emergingCompetitors: competitors.emerging,
    keyWords: keywords,
    trustedSources: sources
  }
}

/**
 * Identify industry and competitors based on organization name
 */
function identifyIndustryAndCompetitors(org: string): {
  industry: string
  subIndustry?: string
  competitors: {
    direct: string[]
    indirect: string[]
    emerging: string[]
  }
} {
  const orgLower = org.toLowerCase()

  // AI/ML companies
  if (orgLower.includes('openai') || orgLower.includes('anthropic') || orgLower.includes('perplexity')) {
    return {
      industry: 'technology',
      subIndustry: 'ai_ml',
      competitors: {
        direct: INDUSTRY_COMPETITORS_DETAILED.technology.ai_ml.filter(c =>
          !c.toLowerCase().includes(orgLower)
        ).slice(0, 5),
        indirect: ['Google', 'Microsoft', 'Meta', 'Amazon'].slice(0, 3),
        emerging: ['Mistral AI', 'Cohere', 'Inflection AI'].slice(0, 3)
      }
    }
  }

  // Cybersecurity companies
  if (orgLower.includes('crowdstrike') || orgLower.includes('palo alto') || orgLower.includes('sentinel')) {
    return {
      industry: 'technology',
      subIndustry: 'cybersecurity',
      competitors: {
        direct: INDUSTRY_COMPETITORS_DETAILED.technology.cybersecurity.filter(c =>
          !c.toLowerCase().includes(orgLower)
        ).slice(0, 5),
        indirect: ['Microsoft', 'Cisco', 'IBM'].slice(0, 3),
        emerging: ['Wiz', 'Lacework', 'Snyk'].slice(0, 3)
      }
    }
  }

  // Default to general tech
  return {
    industry: 'technology',
    competitors: {
      direct: ['Microsoft', 'Google', 'Apple', 'Amazon', 'Meta'].slice(0, 5),
      indirect: ['Salesforce', 'Oracle', 'IBM'].slice(0, 3),
      emerging: ['ByteDance', 'Canva', 'Stripe'].slice(0, 3)
    }
  }
}

/**
 * Generate smart keywords based on organization and industry
 */
function generateKeywords(org: string, industry: string): string[] {
  const baseKeywords = [org]

  if (industry === 'technology') {
    baseKeywords.push(
      'partnership', 'acquisition', 'funding', 'product launch',
      'AI', 'machine learning', 'innovation', 'competition'
    )
  }

  if (org.toLowerCase().includes('ai') || org.toLowerCase().includes('anthropic')) {
    baseKeywords.push(
      'LLM', 'chatbot', 'GPT', 'Claude', 'generative AI',
      'AI safety', 'AI regulation', 'AI ethics'
    )
  }

  return baseKeywords
}

/**
 * Select appropriate news sources based on industry
 * Now uses master-source-registry for comprehensive coverage
 */
async function selectNewsSources(industry: string, subIndustry?: string): Promise<string[]> {
  // Fetch from master-source-registry with industry context
  const sources = await fetchTrustedSourcesFromRegistry(industry)

  console.log(`📰 Selected ${sources.length} trusted news sources for ${industry}${subIndustry ? ` (${subIndustry})` : ''}`)

  return sources
}

/**
 * Extract trusted sources from Discovery data
 * Uses master-source-registry + any custom sources from profile
 */
async function extractTrustedSources(discoveryData: any): Promise<string[]> {
  const sources = []

  // Get sources from master-source-registry based on industry
  const registrySources = await fetchTrustedSourcesFromRegistry(discoveryData.industry)
  sources.push(...registrySources)

  // Also extract from RSS feeds if available in profile
  if (discoveryData.rss_feeds) {
    const extractDomain = (urlStr: string): string | null => {
      try {
        const url = new URL(urlStr)
        return url.hostname.replace('www.', '')
      } catch {
        return null
      }
    }

    discoveryData.rss_feeds.forEach((feed: any) => {
      const domain = extractDomain(feed.url || feed)
      if (domain) sources.push(domain)
    })
  }

  // Remove duplicates
  return [...new Set(sources)]
}

/**
 * Update organization context (for persistence across conversation)
 */
export function updateOrganizationContext(
  organizationId: string,
  updates: Partial<OrganizationContext>,
  conversationId?: string
): void {
  const cacheKey = conversationId ? `${organizationId}_${conversationId}` : organizationId
  const existing = contextCache.get(cacheKey)

  if (existing) {
    contextCache.set(cacheKey, { ...existing, ...updates })
  }
}

/**
 * Clear organization context (for new conversations)
 */
export function clearOrganizationContext(
  organizationId: string,
  conversationId?: string
): void {
  const cacheKey = conversationId ? `${organizationId}_${conversationId}` : organizationId
  contextCache.delete(cacheKey)
}

/**
 * Enhance search queries with organization context
 */
export function enhanceQueryWithContext(
  query: string,
  context: OrganizationContext
): string {
  const queryLower = query.toLowerCase()
  let enhancedQuery = query

  // Add organization name if not present
  if (!queryLower.includes(context.organizationName.toLowerCase())) {
    // Replace first-person references
    if (queryLower.includes('we') || queryLower.includes('our') || queryLower.includes('us')) {
      enhancedQuery = enhancedQuery.replace(/\b(we|our|us)\b/gi, context.organizationName)
    }
  }

  // Enhanced competitor detection - more patterns
  const competitorPatterns = [
    'competitor',
    'competitors',
    'rival',
    'rivals',
    'versus',
    'vs',
    'compared',
    'competition',
    'competing'
  ]

  const hasCompetitorIntent = competitorPatterns.some(pattern => queryLower.includes(pattern))

  if (hasCompetitorIntent) {
    // For "competitor news", we need to list actual competitor names
    const topCompetitors = context.directCompetitors.slice(0, 5)

    // Build a more effective search query
    if (queryLower.includes('competitor news')) {
      // Replace "competitor" with actual names for better search
      enhancedQuery = enhancedQuery.replace(/competitor(s)?/gi, '')
      enhancedQuery = `${topCompetitors.join(' OR ')} ${enhancedQuery.replace(/\s+/g, ' ').trim()}`
    } else if (!topCompetitors.some(comp => queryLower.includes(comp.toLowerCase()))) {
      // Add competitors if not already mentioned
      enhancedQuery += ` (${topCompetitors.join(' OR ')})`
    }
  }

  // Also check for industry news requests
  if (queryLower.includes('industry news') || queryLower.includes('market news')) {
    // Add both organization and competitors for comprehensive coverage
    const allEntities = [context.organizationName, ...context.directCompetitors.slice(0, 3)]
    enhancedQuery = `${allEntities.join(' OR ')} ${enhancedQuery}`
  }

  // Log the enhancement for debugging
  if (enhancedQuery !== query) {
    console.log(`🔧 Query enhanced: "${query}" → "${enhancedQuery}"`)
  }

  return enhancedQuery
}

/**
 * Format search domains based on organization's trusted sources
 */
export function getSearchDomains(context: OrganizationContext): string[] {
  return context.trustedSources.slice(0, 10) // Limit to top 10 domains
}