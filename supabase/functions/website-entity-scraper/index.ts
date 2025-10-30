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

    const extractedEntities: any = {
      products: [],
      services: [],
      locations: [],
      subsidiaries: [],
      team: []
    }

    // STEP 1: Extract Products/Services
    if (entity_types.includes('products') || entity_types.includes('services')) {
      console.log('📦 Extracting products and services...')

      const productsSchema = {
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
          }
        }
      }

      const productsResult = await extractWithFirecrawl(
        firecrawlApiKey,
        website_url,
        'Extract all products and services offered by this company. Include product names, descriptions, categories, and any relevant details.',
        productsSchema
      )

      if (productsResult) {
        extractedEntities.products = productsResult.products || []
        extractedEntities.services = productsResult.services || []
        console.log(`   ✓ Found ${extractedEntities.products.length} products, ${extractedEntities.services.length} services`)
      }
    }

    // STEP 2: Extract Locations
    if (entity_types.includes('locations')) {
      console.log('📍 Extracting locations...')

      const locationsSchema = {
        type: 'object',
        properties: {
          locations: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                type: { type: 'string' }, // headquarters, office, store, etc.
                address: { type: 'string' },
                city: { type: 'string' },
                state: { type: 'string' },
                country: { type: 'string' },
                postal_code: { type: 'string' },
                phone: { type: 'string' },
                email: { type: 'string' }
              }
            }
          }
        }
      }

      const locationsResult = await extractWithFirecrawl(
        firecrawlApiKey,
        website_url,
        'Extract all physical locations, offices, stores, or facilities mentioned on this website. Include addresses and contact information.',
        locationsSchema
      )

      if (locationsResult) {
        extractedEntities.locations = locationsResult.locations || []
        console.log(`   ✓ Found ${extractedEntities.locations.length} locations`)
      }
    }

    // STEP 3: Extract Subsidiaries/Business Units
    if (entity_types.includes('subsidiaries')) {
      console.log('🏢 Extracting subsidiaries and business units...')

      const subsidiariesSchema = {
        type: 'object',
        properties: {
          subsidiaries: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                description: { type: 'string' },
                type: { type: 'string' }, // subsidiary, division, business_unit
                industry: { type: 'string' },
                url: { type: 'string' }
              }
            }
          }
        }
      }

      const subsidiariesResult = await extractWithFirecrawl(
        firecrawlApiKey,
        website_url,
        'Extract all subsidiaries, divisions, business units, or child organizations mentioned. Include their names, what they do, and any relevant URLs.',
        subsidiariesSchema
      )

      if (subsidiariesResult) {
        extractedEntities.subsidiaries = subsidiariesResult.subsidiaries || []
        console.log(`   ✓ Found ${extractedEntities.subsidiaries.length} subsidiaries`)
      }
    }

    // STEP 4: Extract Team/Leadership
    if (entity_types.includes('team')) {
      console.log('👥 Extracting leadership team...')

      const teamSchema = {
        type: 'object',
        properties: {
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

      const teamResult = await extractWithFirecrawl(
        firecrawlApiKey,
        website_url,
        'Extract leadership team members, executives, and key personnel. Include names, titles, roles, and any biographical information.',
        teamSchema
      )

      if (teamResult) {
        extractedEntities.team = teamResult.team || []
        console.log(`   ✓ Found ${extractedEntities.team.length} team members`)
      }
    }

    // Calculate totals
    const totalEntities =
      extractedEntities.products.length +
      extractedEntities.services.length +
      extractedEntities.locations.length +
      extractedEntities.subsidiaries.length +
      extractedEntities.team.length

    console.log('✅ Website Entity Scraper Complete:', {
      total_entities: totalEntities,
      products: extractedEntities.products.length,
      services: extractedEntities.services.length,
      locations: extractedEntities.locations.length,
      subsidiaries: extractedEntities.subsidiaries.length,
      team: extractedEntities.team.length
    })

    return new Response(
      JSON.stringify({
        success: true,
        entities: extractedEntities,
        summary: {
          total_entities: totalEntities,
          by_type: {
            products: extractedEntities.products.length,
            services: extractedEntities.services.length,
            locations: extractedEntities.locations.length,
            subsidiaries: extractedEntities.subsidiaries.length,
            team: extractedEntities.team.length
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
 * Extract data using Firecrawl Extract API
 */
async function extractWithFirecrawl(
  apiKey: string,
  url: string,
  prompt: string,
  schema: any
): Promise<any> {
  try {
    console.log(`   🔍 Firecrawl Extract: ${url}`)

    const response = await fetch('https://api.firecrawl.dev/v1/extract', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        urls: [url],
        prompt,
        schema,
        // Enable web search to find relevant pages beyond the homepage
        enableWebSearch: true,
        // Limit number of pages to extract from
        limit: 5
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('   ✗ Firecrawl error:', errorText)
      return null
    }

    const data = await response.json()

    // Check if it's an async job
    if (data.success && data.id) {
      console.log(`   ⏳ Job started: ${data.id}, polling for results...`)
      // Poll for results
      return await pollFirecrawlJob(apiKey, data.id)
    }

    // Immediate result
    if (data.success && data.data) {
      return data.data
    }

    console.error('   ✗ Unexpected Firecrawl response format')
    return null

  } catch (error) {
    console.error('   ✗ Firecrawl Extract error:', error)
    return null
  }
}

/**
 * Poll Firecrawl job for completion
 */
async function pollFirecrawlJob(apiKey: string, jobId: string, maxAttempts = 30): Promise<any> {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(resolve => setTimeout(resolve, 2000)) // Wait 2 seconds

    const response = await fetch(`https://api.firecrawl.dev/v2/extract/${jobId}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    })

    if (!response.ok) {
      console.error('   ✗ Job polling error')
      return null
    }

    const data = await response.json()

    if (data.status === 'completed' && data.data) {
      console.log('   ✓ Extraction complete')
      return data.data
    }

    if (data.status === 'failed') {
      console.error('   ✗ Extraction failed')
      return null
    }

    console.log(`   ⏳ Job status: ${data.status} (attempt ${i + 1}/${maxAttempts})`)
  }

  console.error('   ✗ Job timeout')
  return null
}
