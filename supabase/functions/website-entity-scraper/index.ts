import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

/**
 * WEBSITE ENTITY SCRAPER
 *
 * Extracts structured entities from company website using Firecrawl Extract API:
 * - Products/Services offered
 * - Business units/service lines
 * - Physical locations/offices
 * - Subsidiaries/child organizations
 * - Leadership team
 *
 * Uses Firecrawl Extract with structured schemas to get clean data
 */

interface ScraperRequest {
  organization_id: string
  organization_name: string
  website_url: string
  entity_types?: string[] // Which entities to extract
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const {
      organization_id,
      organization_name,
      website_url,
      entity_types = ['products', 'services', 'locations', 'subsidiaries', 'team']
    }: ScraperRequest = await req.json()

    if (!organization_id || !organization_name || !website_url) {
      throw new Error('organization_id, organization_name, and website_url required')
    }

    console.log('🌐 Website Entity Scraper Starting:', {
      organization_name,
      website_url,
      entity_types
    })

    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY')
    if (!firecrawlApiKey) {
      throw new Error('FIRECRAWL_API_KEY not configured')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // STEP 1: Map the website to discover relevant URLs (2-3 seconds)
    console.log('🗺️  Step 1: Mapping website structure...')
    const relevantUrls = await discoverRelevantUrls(firecrawlApiKey, website_url)
    console.log(`   ✓ Found ${relevantUrls.length} relevant pages to scrape`)

    // STEP 2: Batch scrape all relevant URLs with extraction (via mcp-firecrawl)
    console.log('🔍 Step 2: Extracting entities from all pages...')

    const consolidatedSchema = {
      type: 'object',
      properties: {
        products: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              category: { type: 'string' },
              url: { type: 'string' },
              price_range: { type: 'string' },
              features: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        services: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              category: { type: 'string' },
              url: { type: 'string' },
              service_type: { type: 'string' }
            }
          }
        },
        locations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              address: { type: 'string' },
              city: { type: 'string' },
              state: { type: 'string' },
              country: { type: 'string' },
              postal_code: { type: 'string' },
              phone: { type: 'string' },
              email: { type: 'string' }
            }
          }
        },
        subsidiaries: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              type: { type: 'string' },
              industry: { type: 'string' },
              url: { type: 'string' }
            }
          }
        },
        team: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              title: { type: 'string' },
              role: { type: 'string' },
              bio: { type: 'string' },
              image_url: { type: 'string' },
              linkedin_url: { type: 'string' }
            }
          }
        }
      }
    }

    // Call Firecrawl directly for each URL in parallel
    const extractionPromises = relevantUrls.map(url =>
      extractEntitiesFromUrl(firecrawlApiKey, url, consolidatedSchema)
    )

    const extractionResults = await Promise.all(extractionPromises)

    // Merge entities from all pages
    const entities = mergeExtractedEntities(extractionResults)

    console.log(`   ✓ Extraction complete:`, {
      pages_scraped: extractionResults.filter(r => r !== null).length,
      products: entities.products.length,
      services: entities.services.length,
      locations: entities.locations.length,
      subsidiaries: entities.subsidiaries.length,
      team: entities.team.length
    })

    // Calculate totals
    const totalEntities =
      entities.products.length +
      entities.services.length +
      entities.locations.length +
      entities.subsidiaries.length +
      entities.team.length

    console.log('✅ Website Entity Scraper Complete:', {
      total_entities: totalEntities,
      products: entities.products.length,
      services: entities.services.length,
      locations: entities.locations.length,
      subsidiaries: entities.subsidiaries.length,
      team: entities.team.length
    })

    return new Response(
      JSON.stringify({
        success: true,
        entities: entities,
        summary: {
          total_entities: totalEntities,
          by_type: {
            products: entities.products.length,
            services: entities.services.length,
            locations: entities.locations.length,
            subsidiaries: entities.subsidiaries.length,
            team: entities.team.length
          }
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('❌ Website Entity Scraper Error:', error)
    return new Response(
      JSON.stringify({
        error: error.message,
        details: error.toString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

/**
 * Discover relevant URLs using Firecrawl /map endpoint
 */
async function discoverRelevantUrls(apiKey: string, baseUrl: string): Promise<string[]> {
  try {
    const response = await fetch('https://api.firecrawl.dev/v1/map', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: baseUrl,
        limit: 100 // Get up to 100 URLs
      })
    })

    if (!response.ok) {
      console.error('   ⚠️  Map failed, using homepage only')
      return [baseUrl]
    }

    const data = await response.json()
    const allUrls = data.links || []

    // Filter for relevant pages
    const relevantKeywords = [
      'about', 'team', 'leadership', 'executives', 'management',
      'products', 'services', 'solutions', 'offerings',
      'locations', 'offices', 'contact',
      'company', 'who-we-are', 'our-story'
    ]

    const scoredUrls = allUrls.map((url: string) => {
      const urlLower = url.toLowerCase()
      let score = 0

      // Homepage gets high priority
      if (url === baseUrl || urlLower.endsWith('/') || urlLower === baseUrl + '/') {
        score = 100
      }

      // Score based on relevant keywords
      for (const keyword of relevantKeywords) {
        if (urlLower.includes(keyword)) {
          score += 10
        }
      }

      // Penalize very long URLs (likely not top-level pages)
      const pathDepth = url.split('/').length - 3
      score -= pathDepth * 2

      return { url, score }
    })

    // Sort by score and take top 5
    const topUrls = scoredUrls
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(item => item.url)

    // Always include homepage if not already included
    if (!topUrls.includes(baseUrl)) {
      topUrls.unshift(baseUrl)
    }

    return topUrls.slice(0, 5) // Max 5 pages

  } catch (error) {
    console.error('   ⚠️  Map error, using homepage only:', error)
    return [baseUrl]
  }
}

/**
 * Extract entities from a single URL using Firecrawl v1 scrape API
 */
async function extractEntitiesFromUrl(
  apiKey: string,
  url: string,
  schema: any
): Promise<any> {
  try {
    console.log(`   🔍 Scraping: ${url}`)

    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: url,
        formats: ['extract'],
        extract: {
          schema: schema,
          prompt: 'Extract comprehensive company information including products, services, locations, subsidiaries, and team members.'
        }
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`   ✗ Scrape failed for ${url}:`, errorText)
      return null
    }

    const data = await response.json()

    if (data.success && data.data?.extract) {
      console.log(`   ✓ Extracted from ${url}`)
      return data.data.extract
    }

    console.error(`   ✗ No extraction data for ${url}`)
    return null

  } catch (error) {
    console.error(`   ✗ Error scraping ${url}:`, error)
    return null
  }
}

/**
 * Merge entities from multiple extractions
 */
function mergeExtractedEntities(extractionResults: any[]): any {
  const merged = {
    products: [],
    services: [],
    locations: [],
    subsidiaries: [],
    team: []
  }

  for (const extracted of extractionResults) {
    if (!extracted) continue

    // Merge arrays, avoiding duplicates by name
    if (extracted.products) {
      for (const product of extracted.products) {
        if (product.name && !merged.products.find(p => p.name === product.name)) {
          merged.products.push(product)
        }
      }
    }

    if (extracted.services) {
      for (const service of extracted.services) {
        if (service.name && !merged.services.find(s => s.name === service.name)) {
          merged.services.push(service)
        }
      }
    }

    if (extracted.locations) {
      for (const location of extracted.locations) {
        if (location.name && !merged.locations.find(l => l.name === location.name)) {
          merged.locations.push(location)
        }
      }
    }

    if (extracted.subsidiaries) {
      for (const subsidiary of extracted.subsidiaries) {
        if (subsidiary.name && !merged.subsidiaries.find(s => s.name === subsidiary.name)) {
          merged.subsidiaries.push(subsidiary)
        }
      }
    }

    if (extracted.team) {
      for (const member of extracted.team) {
        if (member.name && !merged.team.find(m => m.name === member.name)) {
          merged.team.push(member)
        }
      }
    }
  }

  return merged
}
