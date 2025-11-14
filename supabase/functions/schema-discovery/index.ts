import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

/**
 * SCHEMA DISCOVERY
 *
 * Checks if a website already has schema.org markup
 * Extracts and validates existing JSON-LD structured data
 *
 * Returns:
 * - Whether schema exists
 * - What types of schema are present (Organization, Product, Service, etc.)
 * - The actual schema markup for enhancement
 */

interface SchemaDiscoveryRequest {
  organization_id: string
  organization_name: string
  website_url: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    })
  }

  try {
    const {
      organization_id,
      organization_name,
      website_url
    }: SchemaDiscoveryRequest = await req.json()

    if (!organization_id || !organization_name || !website_url) {
      throw new Error('organization_id, organization_name, and website_url required')
    }

    console.log('🔍 Schema Discovery Starting:', {
      organization_name,
      website_url
    })

    // Normalize URL
    let url = website_url.trim()
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`
    }

    // Fetch the homepage HTML
    console.log(`📡 Fetching ${url}...`)
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'SignalDesk Schema Discovery Bot/1.0'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch website: ${response.status} ${response.statusText}`)
    }

    const html = await response.text()
    console.log(`✅ Fetched ${html.length} characters of HTML`)

    // Extract all JSON-LD script tags
    const jsonLdRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
    const matches = [...html.matchAll(jsonLdRegex)]

    console.log(`📊 Found ${matches.length} JSON-LD script tags`)

    if (matches.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          has_schema: false,
          schema_count: 0,
          message: 'No schema.org markup found'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse each JSON-LD block
    const schemas: any[] = []
    const schemaTypes: Set<string> = new Set()
    const errors: string[] = []

    for (let i = 0; i < matches.length; i++) {
      const jsonContent = matches[i][1].trim()

      try {
        const parsed = JSON.parse(jsonContent)

        // Handle both single objects and arrays
        const schemaArray = Array.isArray(parsed) ? parsed : [parsed]

        for (const schema of schemaArray) {
          schemas.push(schema)

          // Track schema types
          if (schema['@type']) {
            const type = Array.isArray(schema['@type']) ? schema['@type'][0] : schema['@type']
            schemaTypes.add(type)
          }

          // If it's a @graph, extract types from graph items
          if (schema['@graph'] && Array.isArray(schema['@graph'])) {
            for (const item of schema['@graph']) {
              if (item['@type']) {
                const type = Array.isArray(item['@type']) ? item['@type'][0] : item['@type']
                schemaTypes.add(type)
              }
            }
          }
        }

        console.log(`   ✓ Parsed JSON-LD block ${i + 1}/${matches.length}`)
      } catch (parseError) {
        console.error(`   ✗ Failed to parse JSON-LD block ${i + 1}:`, parseError)
        errors.push(`Block ${i + 1}: ${parseError.message}`)
      }
    }

    // Analyze what we found
    const hasOrganization = schemaTypes.has('Organization')
    const hasProduct = schemaTypes.has('Product')
    const hasService = schemaTypes.has('Service')
    const hasPerson = schemaTypes.has('Person')
    const hasPlace = schemaTypes.has('Place')
    const hasWebSite = schemaTypes.has('WebSite')
    const hasLocalBusiness = schemaTypes.has('LocalBusiness')

    // Extract Organization schema if it exists
    let organizationSchema = null
    for (const schema of schemas) {
      if (schema['@type'] === 'Organization') {
        organizationSchema = schema
        break
      }
      // Check in @graph
      if (schema['@graph'] && Array.isArray(schema['@graph'])) {
        const orgInGraph = schema['@graph'].find((item: any) => item['@type'] === 'Organization')
        if (orgInGraph) {
          organizationSchema = orgInGraph
          break
        }
      }
    }

    console.log('✅ Schema Discovery Complete:', {
      has_schema: true,
      schema_types: Array.from(schemaTypes),
      total_schemas: schemas.length,
      has_organization: hasOrganization,
      has_products: hasProduct,
      parse_errors: errors.length
    })

    return new Response(
      JSON.stringify({
        success: true,
        has_schema: schemas.length > 0,
        schema_count: schemas.length,
        schema_types: Array.from(schemaTypes),
        has_organization: hasOrganization,
        has_product: hasProduct,
        has_service: hasService,
        has_person: hasPerson,
        has_place: hasPlace,
        has_website: hasWebSite,
        has_local_business: hasLocalBusiness,
        organization_schema: organizationSchema,
        all_schemas: schemas,
        parse_errors: errors,
        recommendation: schemas.length > 0
          ? 'Existing schema found - we can enhance it'
          : 'No schema found - we will create one from scratch'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('❌ Schema Discovery Error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        has_schema: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
