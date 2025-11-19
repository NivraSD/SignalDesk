import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * POST /api/organizations/generate-schema?id={uuid}
 * Generate schema.org data for an organization by running the full pipeline
 * This proxies the Edge Functions to avoid CORS issues from the frontend
 */
export async function POST(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const organizationId = searchParams.get('id')
    const body = await req.json()
    const { organization_name, website } = body

    if (!organizationId || !organization_name || !website) {
      return NextResponse.json(
        { error: 'organization_id, organization_name, and website are required' },
        { status: 400 }
      )
    }

    console.log(`🚀 Starting schema generation for ${organization_name}`)

    // Step 1: Website scraping
    console.log('📄 Step 1: Scraping website...')
    const scrapeResponse = await fetch(`${SUPABASE_URL}/functions/v1/website-entity-scraper`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        organization_name,
        website_url: website
      })
    })

    if (!scrapeResponse.ok) {
      const error = await scrapeResponse.text()
      return NextResponse.json(
        { error: 'Website scraping failed', details: error },
        { status: 500 }
      )
    }

    const scrapeData = await scrapeResponse.json()
    console.log(`✅ Scraped content: ${scrapeData.total_content?.length || 0} chars`)

    // Step 2: Entity extraction
    console.log('🔍 Step 2: Extracting entities...')
    const extractResponse = await fetch(`${SUPABASE_URL}/functions/v1/entity-extractor-v2`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        organization_id: organizationId,
        organization_name,
        scraped_content: scrapeData.content || scrapeData.total_content
      })
    })

    if (!extractResponse.ok) {
      const error = await extractResponse.text()
      return NextResponse.json(
        { error: 'Entity extraction failed', details: error },
        { status: 500 }
      )
    }

    const extractData = await extractResponse.json()
    console.log(`✅ Extracted ${extractData.summary?.total_entities || 0} entities`)

    // Step 3: Entity enrichment
    console.log('✨ Step 3: Enriching entities...')
    const enrichResponse = await fetch(`${SUPABASE_URL}/functions/v1/entity-enricher`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        organization_id: organizationId,
        organization_name,
        entities: extractData.entities || {}
      })
    })

    if (!enrichResponse.ok) {
      const error = await enrichResponse.text()
      return NextResponse.json(
        { error: 'Entity enrichment failed', details: error },
        { status: 500 }
      )
    }

    const enrichData = await enrichResponse.json()
    console.log(`✅ Enriched ${enrichData.summary?.total_entities || 0} entities`)

    // Step 4: Schema generation
    console.log('📊 Step 4: Generating schema graph...')
    const schemaResponse = await fetch(`${SUPABASE_URL}/functions/v1/schema-graph-generator`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        organization_id: organizationId,
        organization_name,
        url: website,
        entities: enrichData.enriched_entities || {},
        coverage: []
      })
    })

    if (!schemaResponse.ok) {
      const error = await schemaResponse.text()
      return NextResponse.json(
        { error: 'Schema generation failed', details: error },
        { status: 500 }
      )
    }

    const schemaData = await schemaResponse.json()
    console.log('✅ Schema graph generated')

    // Step 5: Schema enhancement (FAQs, optimizations)
    console.log('🎯 Step 5: Enhancing schema...')
    const enhanceResponse = await fetch(`${SUPABASE_URL}/functions/v1/geo-schema-enhancer`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        organization_id: organizationId,
        organization_name,
        base_schema: schemaData.schema_graph,
        coverage_articles: [],
        entities: enrichData.enriched_entities || {}
      })
    })

    if (!enhanceResponse.ok) {
      const error = await enhanceResponse.text()
      return NextResponse.json(
        { error: 'Schema enhancement failed', details: error },
        { status: 500 }
      )
    }

    const enhanceData = await enhanceResponse.json()
    const finalSchema = enhanceData.enhanced_schema
    console.log('✅ Schema enhanced')

    // Step 6: Save to content_library (MemoryVault)
    console.log('💾 Step 6: Saving to MemoryVault...')
    const saveResponse = await fetch(`${req.nextUrl.origin}/api/content-library/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: {
          type: 'schema',
          title: `${organization_name} - Complete Schema`,
          content: finalSchema,
          organization_id: organizationId,
          metadata: {
            organizationId,
            organizationName: organization_name,
            url: website,
            generatedAt: new Date().toISOString(),
            source: 'settings_api'
          }
        },
        metadata: {
          organizationId,
          title: `${organization_name} - Complete Schema`
        },
        folder: 'Schemas'
      })
    })

    if (!saveResponse.ok) {
      console.error('Failed to save schema to MemoryVault')
    } else {
      console.log('✅ Schema saved to MemoryVault')
    }

    // Step 7: Update org profile with schema reference
    const profileResponse = await fetch(`${req.nextUrl.origin}/api/organizations/profile?id=${organizationId}`)
    if (profileResponse.ok) {
      const profileData = await profileResponse.json()
      if (profileData.success && profileData.organization) {
        const updatedProfile = {
          ...profileData.organization.company_profile,
          schema_org_data: {
            has_schema: true,
            generated_at: new Date().toISOString(),
            schema_reference: 'content_library:schema'
          }
        }

        await fetch(`${req.nextUrl.origin}/api/organizations/profile?id=${organizationId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ company_profile: updatedProfile })
        })

        console.log('✅ Updated org profile with schema reference')
      }
    }

    return NextResponse.json({
      success: true,
      schema: finalSchema,
      message: 'Schema generated and saved successfully'
    })

  } catch (error: any) {
    console.error('❌ Schema generation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate schema', details: error.toString() },
      { status: 500 }
    )
  }
}
