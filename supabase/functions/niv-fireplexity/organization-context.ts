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

// Master source registry for trusted news sources
const MASTER_SOURCE_REGISTRY = {
  tier1_business: [
    'reuters.com',
    'bloomberg.com',
    'ft.com',
    'wsj.com',
    'businessinsider.com',
    'fortune.com',
    'forbes.com'
  ],
  tier1_tech: [
    'techcrunch.com',
    'theverge.com',
    'arstechnica.com',
    'wired.com',
    'thenextweb.com',
    'venturebeat.com'
  ],
  industry_specific: {
    ai: ['theinformation.com', 'aiweekly.co', 'bensbites.co'],
    crypto: ['coindesk.com', 'cointelegraph.com', 'decrypt.co'],
    biotech: ['statnews.com', 'fiercebiotech.com', 'biopharmadive.com'],
    fintech: ['finextra.com', 'tearsheet.co', 'bankingdive.com']
  }
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
      trustedSources: extractTrustedSources(discoveryData),
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
  // Determine industry and competitors based on organization
  const { industry, subIndustry, competitors } = identifyIndustryAndCompetitors(organizationId)

  // Generate smart keywords based on organization
  const keywords = generateKeywords(organizationId, industry)

  // Select appropriate news sources
  const sources = selectNewsSources(industry, subIndustry)

  return {
    organizationId,
    organizationName: organizationId,
    industry,
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
 */
function selectNewsSources(industry: string, subIndustry?: string): string[] {
  const sources = [
    ...MASTER_SOURCE_REGISTRY.tier1_business,
    ...MASTER_SOURCE_REGISTRY.tier1_tech
  ]

  // Add industry-specific sources
  if (subIndustry === 'ai_ml') {
    sources.push(...(MASTER_SOURCE_REGISTRY.industry_specific.ai || []))
  } else if (subIndustry === 'fintech') {
    sources.push(...(MASTER_SOURCE_REGISTRY.industry_specific.fintech || []))
  } else if (subIndustry === 'biotech') {
    sources.push(...(MASTER_SOURCE_REGISTRY.industry_specific.biotech || []))
  }

  return [...new Set(sources)] // Remove duplicates
}

/**
 * Extract trusted sources from Discovery data
 */
function extractTrustedSources(discoveryData: any): string[] {
  const sources = []

  // Extract from RSS feeds if available
  if (discoveryData.rss_feeds) {
    sources.push(...discoveryData.rss_feeds.map((feed: any) =>
      new URL(feed.url || feed).hostname.replace('www.', '')
    ))
  }

  // Add default trusted sources
  sources.push(...MASTER_SOURCE_REGISTRY.tier1_business)
  sources.push(...MASTER_SOURCE_REGISTRY.tier1_tech)

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