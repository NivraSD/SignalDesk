import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * Extract schema.org markup from organization website
 * Stores in Memory Vault for GEO optimization
 */
export async function POST(request: NextRequest) {
  try {
    const {
      organization_id,
      organization_url,
      organization_name,
      industry,
      extract_competitors = false,
      competitor_urls = []
    } = await request.json()

    if (!organization_id || !organization_url) {
      return NextResponse.json(
        { error: 'organization_id and organization_url required' },
        { status: 400 }
      )
    }

    console.log('🔍 Extracting schema for:', organization_name)

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Call geo-schema-extractor edge function
    const response = await fetch(
      `${supabaseUrl}/functions/v1/geo-schema-extractor`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`
        },
        body: JSON.stringify({
          organization_id,
          organization_url,
          organization_name,
          industry,
          extract_competitors,
          competitor_urls
        })
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Schema extraction failed:', errorText)
      throw new Error(`Schema extraction failed: ${response.status}`)
    }

    const result = await response.json()

    console.log('✅ Schema extraction complete:', {
      source: result.organization_schema?.source,
      fields: result.organization_schema?.fields?.length || 0,
      competitors: result.competitor_schemas?.length || 0
    })

    return NextResponse.json({
      success: true,
      ...result
    })

  } catch (error: any) {
    console.error('❌ Error extracting schema:', error)
    return NextResponse.json(
      {
        error: error.message || 'Failed to extract schema',
        details: error.toString()
      },
      { status: 500 }
    )
  }
}

/**
 * Get organization's current schema from Memory Vault
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organization_id')

    if (!organizationId) {
      return NextResponse.json(
        { error: 'organization_id required' },
        { status: 400 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch active schema - check multiple folder patterns for compatibility
    let schema = null
    let error = null

    // First try Schemas/Active/ (new format)
    const { data: activeSchema, error: activeError } = await supabase
      .from('content_library')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('content_type', 'schema')
      .eq('folder', 'Schemas/Active/')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single()

    if (activeSchema) {
      schema = activeSchema
    } else {
      // Try Schemas (onboarding format)
      const { data: onboardingSchema, error: onboardingError } = await supabase
        .from('content_library')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('content_type', 'schema')
        .eq('folder', 'Schemas')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single()

      if (onboardingSchema) {
        schema = onboardingSchema
      } else {
        // Last try: any schema for this org
        const { data: anySchema, error: anyError } = await supabase
          .from('content_library')
          .select('*')
          .eq('organization_id', organizationId)
          .eq('content_type', 'schema')
          .order('updated_at', { ascending: false })
          .limit(1)
          .single()

        schema = anySchema
        error = anyError
      }
    }

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    // Fetch competitor schemas
    const { data: competitorSchemas } = await supabase
      .from('content_library')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('content_type', 'schema')
      .ilike('folder', 'Schemas/Competitors/%')
      .order('updated_at', { ascending: false })

    return NextResponse.json({
      success: true,
      schema: schema || null,
      competitor_schemas: competitorSchemas || [],
      has_schema: !!schema
    })

  } catch (error: any) {
    console.error('❌ Error fetching schema:', error)
    return NextResponse.json(
      {
        error: error.message || 'Failed to fetch schema',
        details: error.toString()
      },
      { status: 500 }
    )
  }
}
