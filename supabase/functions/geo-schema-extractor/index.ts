import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

/**
 * GEO SCHEMA EXTRACTOR
 *
 * Extracts schema.org markup from organization websites
 * If no schema exists, generates a basic one from org profile
 * Stores schemas in Memory Vault for GEO optimization
 *
 * Flow:
 * 1. Scrape organization website with Firecrawl
 * 2. Extract JSON-LD schema markup
 * 3. If no schema found, generate basic Organization schema
 * 4. Store in content_library (Memory Vault)
 * 5. Optionally extract competitor schemas
 */

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const {
      organization_id,
      organization_url,
      organization_name,
      industry,
      extract_competitors = false,
      competitor_urls = []
    } = await req.json()

    if (!organization_id || !organization_url) {
      throw new Error('organization_id and organization_url required')
    }

    console.log('🔍 Schema Extraction Starting:', {
      organization_id,
      organization_url,
      extract_competitors,
      timestamp: new Date().toISOString()
    })

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY')

    if (!firecrawlApiKey) {
      throw new Error('Firecrawl API key not configured')
    }

    // STEP 1: Extract organization schema
    console.log(`📡 Scraping ${organization_url}...`)

    const orgSchema = await extractSchemaFromUrl(organization_url, firecrawlApiKey)

    let schemaToStore = orgSchema

    // STEP 2: If no schema found, generate basic one
    if (!orgSchema) {
      console.log('⚠️  No schema found, generating basic Organization schema...')
      schemaToStore = generateBasicOrganizationSchema(organization_name, organization_url, industry)
    } else {
      console.log('✅ Found existing schema:', orgSchema['@type'])
    }

    // STEP 3: Store in Memory Vault
    console.log('💾 Saving schema to Memory Vault...')

    const { data: existingSchema, error: checkError } = await supabase
      .from('content_library')
      .select('id')
      .eq('organization_id', organization_id)
      .eq('content_type', 'schema')
      .eq('folder', 'Schemas/Active/')
      .eq('metadata->>schema_type', schemaToStore['@type'])
      .single()

    if (existingSchema && !checkError) {
      // Update existing schema
      const { error: updateError } = await supabase
        .from('content_library')
        .update({
          content: schemaToStore,
          metadata: {
            schema_type: schemaToStore['@type'],
            platform_optimized: 'all',
            version: 1,
            last_updated: new Date().toISOString(),
            extracted_from: organization_url
          },
          intelligence: {
            schemaType: schemaToStore['@type'],
            fields: Object.keys(schemaToStore).filter(k => !k.startsWith('@')),
            lastExtracted: new Date().toISOString(),
            source: orgSchema ? 'extracted' : 'generated'
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', existingSchema.id)

      if (updateError) throw updateError
      console.log('✅ Updated existing schema')
    } else {
      // Insert new schema
      const { error: insertError } = await supabase
        .from('content_library')
        .insert({
          organization_id,
          content_type: 'schema',
          folder: 'Schemas/Active/',
          content: schemaToStore,
          metadata: {
            schema_type: schemaToStore['@type'],
            platform_optimized: 'all',
            version: 1,
            extracted_from: organization_url
          },
          intelligence: {
            schemaType: schemaToStore['@type'],
            fields: Object.keys(schemaToStore).filter(k => !k.startsWith('@')),
            lastExtracted: new Date().toISOString(),
            source: orgSchema ? 'extracted' : 'generated'
          },
          salience: 1.0
        })

      if (insertError) throw insertError
      console.log('✅ Inserted new schema')
    }

    // STEP 4: Extract competitor schemas if requested
    const competitorSchemas: any[] = []

    if (extract_competitors && competitor_urls.length > 0) {
      console.log(`🏢 Extracting ${competitor_urls.length} competitor schemas...`)

      for (const compUrl of competitor_urls.slice(0, 3)) { // Limit to 3
        try {
          console.log(`  Scraping ${compUrl}...`)
          const compSchema = await extractSchemaFromUrl(compUrl, firecrawlApiKey)

          if (compSchema) {
            const compName = new URL(compUrl).hostname.replace('www.', '')

            // Store competitor schema
            const { error: compError } = await supabase
              .from('content_library')
              .insert({
                organization_id,
                content_type: 'schema',
                folder: `Schemas/Competitors/${compName}/`,
                content: compSchema,
                metadata: {
                  schema_type: compSchema['@type'],
                  competitor: true,
                  competitor_url: compUrl,
                  extracted_from: compUrl
                },
                intelligence: {
                  schemaType: compSchema['@type'],
                  fields: Object.keys(compSchema).filter(k => !k.startsWith('@')),
                  lastExtracted: new Date().toISOString(),
                  source: 'extracted'
                },
                salience: 0.8
              })

            if (!compError) {
              console.log(`  ✅ Stored schema for ${compName}`)
              competitorSchemas.push({
                url: compUrl,
                name: compName,
                schema: compSchema
              })
            }
          }
        } catch (error) {
          console.error(`  ❌ Failed to extract schema from ${compUrl}:`, error)
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        organization_schema: {
          type: schemaToStore['@type'],
          source: orgSchema ? 'extracted' : 'generated',
          fields: Object.keys(schemaToStore).filter(k => !k.startsWith('@')),
          schema: schemaToStore
        },
        competitor_schemas: competitorSchemas,
        message: orgSchema
          ? 'Schema extracted and stored successfully'
          : 'No schema found - generated basic schema from organization profile'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error: any) {
    console.error('❌ Schema Extraction Error:', error)
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
 * Extract schema.org JSON-LD from a URL using Firecrawl
 */
async function extractSchemaFromUrl(url: string, apiKey: string): Promise<any | null> {
  try {
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        url: url,
        formats: ['html', 'links'],
        onlyMainContent: false // Need full page to get schema in <head>
      })
    })

    if (!response.ok) {
      console.error('Firecrawl error:', await response.text())
      return null
    }

    const data = await response.json()
    const html = data.data?.html || ''

    // Extract JSON-LD schema markup
    // Look for <script type="application/ld+json">
    const jsonLdRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
    const matches = [...html.matchAll(jsonLdRegex)]

    if (matches.length === 0) {
      return null
    }

    // Parse all JSON-LD blocks and find Organization schema
    for (const match of matches) {
      try {
        const jsonStr = match[1].trim()
        const schema = JSON.parse(jsonStr)

        // Handle array of schemas
        if (Array.isArray(schema)) {
          const orgSchema = schema.find(s =>
            s['@type'] === 'Organization' ||
            s['@type']?.includes('Organization')
          )
          if (orgSchema) return orgSchema
        }

        // Single schema
        if (schema['@type'] === 'Organization' || schema['@type']?.includes('Organization')) {
          return schema
        }

        // Graph structure
        if (schema['@graph']) {
          const orgSchema = schema['@graph'].find((s: any) =>
            s['@type'] === 'Organization' ||
            s['@type']?.includes('Organization')
          )
          if (orgSchema) return orgSchema
        }
      } catch (err) {
        console.error('Error parsing JSON-LD:', err)
        continue
      }
    }

    return null
  } catch (error) {
    console.error('Error extracting schema:', error)
    return null
  }
}

/**
 * Generate basic Organization schema from org profile
 */
function generateBasicOrganizationSchema(
  name: string,
  url: string,
  industry?: string
): any {
  const schema: any = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: name,
    url: url
  }

  // Add industry if available
  if (industry) {
    schema.description = `${industry} organization`
    schema.knowsAbout = industry
  }

  // Add basic contact point
  const domain = new URL(url).hostname
  schema.contactPoint = {
    '@type': 'ContactPoint',
    contactType: 'customer service',
    email: `contact@${domain}`
  }

  return schema
}
