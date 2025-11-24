import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const anthropicApiKey = process.env.ANTHROPIC_API_KEY!

/**
 * Auto-generate company profile from schema data in Memory Vault
 */
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('id')

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID required' },
        { status: 400 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('🔍 Fetching organization:', organizationId)

    // Fetch organization data - select all fields to see what's available
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', organizationId)
      .single()

    console.log('📊 Organization query result:', {
      hasData: !!org,
      error: orgError,
      orgFields: org ? Object.keys(org) : [],
      name: org?.name,
      url: org?.url,
      website: org?.website,
      settingsUrl: org?.settings?.url,
      industry: org?.industry
    })

    if (orgError) {
      console.error('❌ Organization query error:', orgError)
      return NextResponse.json(
        { error: `Organization query failed: ${orgError.message}` },
        { status: 500 }
      )
    }

    if (!org) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    // Handle url being in different locations (url column, website column, or settings.url)
    const organizationUrl = org.url || org.website || org.settings?.url

    // Fetch schema from Memory Vault
    console.log('🔍 Fetching schema for organization:', organizationId)

    const { data: schemaData, error: schemaError } = await supabase
      .from('content_library')
      .select('content')
      .eq('organization_id', organizationId)
      .eq('content_type', 'schema')
      .eq('folder', 'Schemas')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single()

    console.log('📊 Schema query result:', {
      hasData: !!schemaData,
      error: schemaError,
      contentPreview: schemaData?.content ? JSON.stringify(schemaData.content).substring(0, 100) : null
    })

    if (schemaError && schemaError.code !== 'PGRST116') {
      console.error('❌ Schema query error:', schemaError)
      return NextResponse.json(
        { error: `Schema query failed: ${schemaError.message}` },
        { status: 500 }
      )
    }

    if (!schemaData || !schemaData.content) {
      return NextResponse.json(
        { error: 'No schema found. Please generate a schema first in the About tab.' },
        { status: 404 }
      )
    }

    // Parse schema if it's a string
    let schema = schemaData.content
    if (typeof schema === 'string') {
      try {
        schema = JSON.parse(schema)
        console.log('✅ Parsed schema from string')
      } catch (e) {
        console.error('❌ Failed to parse schema string:', e)
        return NextResponse.json(
          { error: 'Schema data is corrupted' },
          { status: 500 }
        )
      }
    }

    console.log('📊 Schema structure:', {
      hasGraph: !!schema['@graph'],
      topLevelKeys: Object.keys(schema).slice(0, 10)
    })

    // Extract relevant data from schema
    const extractedData = {
      organization_name: org.name,
      url: organizationUrl,
      industry: org.industry,
      schema_data: {
        // Organization data
        organization: schema['@graph']?.find((item: any) => item['@type'] === 'Organization') || schema,

        // Extract products
        products: schema['@graph']?.filter((item: any) => item['@type'] === 'Product') || [],

        // Extract services
        services: schema['@graph']?.filter((item: any) => item['@type'] === 'Service') || [],

        // Extract locations
        locations: schema['@graph']?.filter((item: any) => item['@type'] === 'Place') || [],

        // Extract team members
        team: schema['@graph']?.filter((item: any) => item['@type'] === 'Person') || [],

        // Extract subsidiaries
        subsidiaries: schema['@graph']?.filter((item: any) =>
          item['@type'] === 'Organization' && item.parentOrganization
        ) || []
      }
    }

    console.log('📊 Extracted schema data:', {
      products: extractedData.schema_data.products.length,
      services: extractedData.schema_data.services.length,
      locations: extractedData.schema_data.locations.length,
      team: extractedData.schema_data.team.length,
      subsidiaries: extractedData.schema_data.subsidiaries.length
    })

    // Use Claude to generate company profile
    const anthropic = new Anthropic({ apiKey: anthropicApiKey })

    const prompt = `You are a company profile generator. Based on the schema.org data provided, extract and structure a comprehensive company profile.

ORGANIZATION: ${extractedData.organization_name}
INDUSTRY: ${extractedData.industry || 'Not specified'}
URL: ${extractedData.url || 'Not specified'}

SCHEMA DATA:
${JSON.stringify(extractedData.schema_data, null, 2)}

Generate a comprehensive company profile with the following structure:

1. **Leadership Team** - Extract from Person entities in schema
   - name: string
   - title: string (job title)
   - email: string (if available)
   - linkedin: string (if available)

2. **Headquarters** - Extract from Place entities or Organization.address
   - address: string
   - city: string
   - state: string
   - country: string
   - zip: string

3. **Company Size** - Infer from schema if possible
   - employees: string (range like "51-200")
   - revenue_tier: string (range like "$10M-$50M")

4. **Founded** - Extract from Organization.foundingDate if available

5. **Parent Company** - Extract from Organization.parentOrganization if available

6. **Product Lines** - Extract from Product and Service entities
   - Array of strings describing key products/services

7. **Key Markets** - Infer from locations, products, or organization description
   - Array of strings describing geographic markets or customer segments

8. **Business Model** - Infer from the data (e.g., "B2B SaaS", "Manufacturing", "Retail")

IMPORTANT:
- Only include data that you can extract or reasonably infer from the schema
- Do not make up information
- If a field is not available in the schema, omit it or leave it empty
- For product_lines, extract actual product/service names from the schema
- For key_markets, look at location data and organization description

Return ONLY a valid JSON object with this structure:
{
  "leadership": [{ "name": "...", "title": "..." }],
  "headquarters": { "address": "...", "city": "...", "state": "...", "country": "..." },
  "company_size": { "employees": "...", "revenue_tier": "..." },
  "founded": "...",
  "parent_company": "...",
  "product_lines": ["...", "..."],
  "key_markets": ["...", "..."],
  "business_model": "..."
}`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: prompt
      }]
    })

    const content = response.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude')
    }

    // Parse Claude's response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Failed to extract JSON from Claude response')
    }

    const profile = JSON.parse(jsonMatch[0])

    console.log('✅ Generated company profile:', {
      leadership: profile.leadership?.length || 0,
      product_lines: profile.product_lines?.length || 0,
      key_markets: profile.key_markets?.length || 0
    })

    return NextResponse.json({
      success: true,
      profile
    })

  } catch (error: any) {
    console.error('❌ Error generating profile:', error)
    return NextResponse.json(
      {
        error: error.message || 'Failed to generate profile',
        details: error.toString()
      },
      { status: 500 }
    )
  }
}
