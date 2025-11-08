import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

/**
 * SCHEMA GRAPH GENERATOR
 *
 * Generates comprehensive schema.org @graph with all entity types:
 * - Organization (main entity)
 * - Products (from content_library where content_type='product')
 * - Services (from content_library where content_type='service')
 * - Locations (from content_library where content_type='location')
 * - Subsidiaries (from content_library where content_type='subsidiary')
 * - Team (from content_library where content_type='person')
 * - NewsArticles (from intelligence_findings positive coverage)
 *
 * All linked via @id references in a single @graph structure
 */

interface GeneratorRequest {
  organization_id: string
  organization_name: string
  industry?: string
  url?: string
  entities?: any // Entities passed directly from scraper
  coverage?: any[] // Coverage articles passed directly from scraper
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const {
      organization_id,
      organization_name,
      industry,
      url,
      entities: passedEntities,
      coverage: passedCoverage
    }: GeneratorRequest = await req.json()

    if (!organization_id || !organization_name) {
      throw new Error('organization_id and organization_name required')
    }

    console.log('📊 Schema Graph Generator Starting:', {
      organization_name,
      industry,
      url,
      has_entities: !!passedEntities,
      has_coverage: !!passedCoverage
    })

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // STEP 1: Get entities (use passed data or query database)
    console.log('📚 Step 1: Getting entities...')

    let products, services, locations, subsidiaries, team

    if (passedEntities) {
      // Use entities passed directly from scraper
      products = passedEntities.products || []
      services = passedEntities.services || []
      locations = passedEntities.locations || []
      subsidiaries = passedEntities.subsidiaries || []
      team = passedEntities.team || []
      console.log(`   ✓ Using passed entities:`, {
        products: products.length,
        services: services.length,
        locations: locations.length,
        subsidiaries: subsidiaries.length,
        team: team.length
      })

      // Debug: Log first entity of each type to verify format
      if (products.length > 0) {
        console.log(`   📦 Sample product:`, JSON.stringify(products[0]).substring(0, 200))
      }
      if (services.length > 0) {
        console.log(`   🔧 Sample service:`, JSON.stringify(services[0]).substring(0, 200))
      }
      if (team.length > 0) {
        console.log(`   👤 Sample team member:`, JSON.stringify(team[0]).substring(0, 200))
      }
    } else {
      // Fallback: query from content_library
      console.log('   → Querying content_library...')
      const { data: dbProducts } = await supabase
        .from('content_library')
        .select('*')
        .eq('organization_id', organization_id)
        .eq('content_type', 'product')
        .eq('status', 'published')

      const { data: dbServices } = await supabase
        .from('content_library')
        .select('*')
        .eq('organization_id', organization_id)
        .eq('content_type', 'service')
        .eq('status', 'published')

      const { data: dbLocations } = await supabase
        .from('content_library')
        .select('*')
        .eq('organization_id', organization_id)
        .eq('content_type', 'location')
        .eq('status', 'published')

      const { data: dbSubsidiaries } = await supabase
        .from('content_library')
        .select('*')
        .eq('organization_id', organization_id)
        .eq('content_type', 'subsidiary')
        .eq('status', 'published')

      const { data: dbTeam } = await supabase
        .from('content_library')
        .select('*')
        .eq('organization_id', organization_id)
        .eq('content_type', 'person')
        .eq('status', 'published')

      products = dbProducts || []
      services = dbServices || []
      locations = dbLocations || []
      subsidiaries = dbSubsidiaries || []
      team = dbTeam || []

      console.log(`   ✓ Found entities from database:`, {
        products: products.length,
        services: services.length,
        locations: locations.length,
        subsidiaries: subsidiaries.length,
        team: team.length
      })
    }

    // STEP 2: Get positive coverage (use passed data or query database)
    console.log('🏆 Step 2: Getting positive coverage...')

    let positiveCoverage

    if (passedCoverage) {
      positiveCoverage = passedCoverage
      console.log(`   ✓ Using passed coverage: ${positiveCoverage.length} articles`)
    } else {
      const { data: dbCoverage } = await supabase
        .from('intelligence_findings')
        .select('*')
        .eq('organization_id', organization_id)
        .gte('relevance_score', 70)
        .order('published_at', { ascending: false })
        .limit(10)

      positiveCoverage = dbCoverage || []
      console.log(`   ✓ Found coverage from database: ${positiveCoverage.length} articles`)
    }

    // STEP 3: Get organization data
    console.log('🏢 Step 3: Getting organization data...')

    const { data: orgData } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', organization_id)
      .single()

    // STEP 4: Build schema graph
    console.log('🔨 Step 4: Building schema graph...')

    const baseUrl = url || orgData?.url || `https://${organization_name.toLowerCase().replace(/\s+/g, '')}.com`
    const graph: any[] = []

    // Main Organization schema
    const organizationSchema: any = {
      '@type': 'Organization',
      '@id': `${baseUrl}#organization`,
      'name': organization_name,
      'url': baseUrl
    }

    if (industry) {
      organizationSchema.industry = industry
    }

    // Add products if any
    if (products && products.length > 0) {
      organizationSchema.makesOffer = products.map((p, idx) => ({
        '@id': `${baseUrl}#product-${idx}`
      }))

      // Add Product schemas to graph (only if they have a name)
      products.forEach((p, idx) => {
        // Support both enriched entity format (name, description) and DB format (title, content)
        const productName = p.name || p.title
        if (productName) {
          graph.push({
            '@type': 'Product',
            '@id': `${baseUrl}#product-${idx}`,
            'name': productName,
            'description': p.description || p.content,
            'category': p.category || p.metadata?.category,
            'url': p.url || p.metadata?.url
          })
        }
      })
    }

    // Add services if any
    if (services && services.length > 0) {
      organizationSchema.hasOfferCatalog = {
        '@type': 'OfferCatalog',
        'itemListElement': services.map((s, idx) => ({
          '@id': `${baseUrl}#service-${idx}`
        }))
      }

      // Add Service schemas to graph
      services.forEach((s, idx) => {
        // Support both enriched entity format (name, description) and DB format (title, content)
        const serviceName = s.name || s.title
        if (serviceName) {
          graph.push({
            '@type': 'Service',
            '@id': `${baseUrl}#service-${idx}`,
            'name': serviceName,
            'description': s.description || s.content,
            'serviceType': s.service_type || s.metadata?.service_type,
            'provider': {
              '@id': `${baseUrl}#organization`
            }
          })
        }
      })
    }

    // Add locations if any
    if (locations && locations.length > 0) {
      organizationSchema.location = locations.map((l, idx) => ({
        '@id': `${baseUrl}#location-${idx}`
      }))

      // Add Place schemas to graph
      locations.forEach((l, idx) => {
        // Support both enriched entity format (name, address, city) and DB format (title, metadata)
        const locationName = l.name || l.title
        if (locationName) {
          graph.push({
            '@type': 'Place',
            '@id': `${baseUrl}#location-${idx}`,
            'name': locationName,
            'address': {
              '@type': 'PostalAddress',
              'streetAddress': l.address || l.metadata?.address,
              'addressLocality': l.city || l.metadata?.city,
              'addressRegion': l.state || l.metadata?.state,
              'postalCode': l.postal_code || l.metadata?.postal_code,
              'addressCountry': l.country || l.metadata?.country
            },
            'telephone': l.phone || l.metadata?.phone,
            'email': l.email || l.metadata?.email
          })
        }
      })
    }

    // Add subsidiaries if any
    if (subsidiaries && subsidiaries.length > 0) {
      organizationSchema.subOrganization = subsidiaries.map((s, idx) => ({
        '@id': `${baseUrl}#subsidiary-${idx}`
      }))

      // Add SubOrganization schemas to graph
      subsidiaries.forEach((s, idx) => {
        // Support both enriched entity format (name, description) and DB format (title, content)
        const subsidiaryName = s.name || s.title
        if (subsidiaryName) {
          graph.push({
            '@type': 'Organization',
            '@id': `${baseUrl}#subsidiary-${idx}`,
            'name': subsidiaryName,
            'description': s.description || s.content,
            'parentOrganization': {
              '@id': `${baseUrl}#organization`
            }
          })
        }
      })
    }

    // Add team if any
    if (team && team.length > 0) {
      organizationSchema.employee = team.map((t, idx) => ({
        '@id': `${baseUrl}#person-${idx}`
      }))

      // Add Person schemas to graph
      team.forEach((t, idx) => {
        // Support both enriched entity format (name, title, bio) and DB format (title as name, metadata)
        const personName = t.name || t.title
        if (personName) {
          graph.push({
            '@type': 'Person',
            '@id': `${baseUrl}#person-${idx}`,
            'name': personName,
            'jobTitle': t.title || t.metadata?.title, // job title from 'title' field in enriched format
            'description': t.bio || t.role || t.content,
            'image': t.image_url || t.metadata?.image_url,
            'sameAs': t.linkedin_url || t.metadata?.linkedin_url,
            'worksFor': {
              '@id': `${baseUrl}#organization`
            }
          })
        }
      })
    }

    // Add positive coverage if any
    if (positiveCoverage && positiveCoverage.length > 0) {
      organizationSchema.subjectOf = positiveCoverage.map((c, idx) => ({
        '@id': `${baseUrl}#article-${idx}`
      }))

      // Add NewsArticle schemas to graph
      positiveCoverage.forEach((c, idx) => {
        graph.push({
          '@type': 'NewsArticle',
          '@id': `${baseUrl}#article-${idx}`,
          'headline': c.title,
          'url': c.url,
          'datePublished': c.published_at,
          'about': {
            '@id': `${baseUrl}#organization`
          },
          'publisher': {
            '@type': 'Organization',
            'name': c.source
          }
        })
      })
    }

    // Add Organization as first item in graph
    graph.unshift(organizationSchema)

    // Build final schema package
    const schemaPackage = {
      '@context': 'https://schema.org',
      '@graph': graph
    }

    // Count actual items added to graph (not just input counts)
    const graphCounts = {
      organization: 1,
      products: graph.filter(g => g['@type'] === 'Product').length,
      services: graph.filter(g => g['@type'] === 'Service').length,
      locations: graph.filter(g => g['@type'] === 'Place').length,
      subsidiaries: graph.filter(g => g['@type'] === 'Organization' && g['@id'].includes('subsidiary')).length,
      team: graph.filter(g => g['@type'] === 'Person').length,
      coverage: graph.filter(g => g['@type'] === 'NewsArticle').length
    }

    console.log('✅ Schema graph generated:', {
      total_entities: graph.length,
      breakdown: graphCounts,
      input_vs_output: {
        products: `${products?.length || 0} → ${graphCounts.products}`,
        services: `${services?.length || 0} → ${graphCounts.services}`,
        team: `${team?.length || 0} → ${graphCounts.team}`,
        locations: `${locations?.length || 0} → ${graphCounts.locations}`
      }
    })

    // STEP 5: Save to content_library
    console.log('💾 Step 5: Saving schema graph...')

    // Check for existing schema
    const { data: existingSchema } = await supabase
      .from('content_library')
      .select('*')
      .eq('organization_id', organization_id)
      .eq('content_type', 'schema')
      .eq('folder', 'Schemas')
      .maybeSingle()

    const { error: saveError } = await supabase
      .from('content_library')
      .upsert({
        id: existingSchema?.id,
        organization_id,
        content_type: 'schema',
        title: `${organization_name} - Schema Graph`,
        content: JSON.stringify(schemaPackage),
        folder: 'Schemas',
        status: 'published',
        metadata: {
          version: (existingSchema?.metadata?.version || 0) + 1,
          schema_type: 'Graph',
          generated_by: 'schema-graph-generator',
          generation_date: new Date().toISOString(),
          entity_count: graph.length,
          includes: {
            products: products?.length || 0,
            services: services?.length || 0,
            locations: locations?.length || 0,
            subsidiaries: subsidiaries?.length || 0,
            team: team?.length || 0,
            coverage: positiveCoverage?.length || 0
          }
        }
      }, { onConflict: 'id' })

    if (saveError) {
      console.error('Failed to save schema:', saveError)
      throw saveError
    }

    console.log('✅ Schema Graph Generator Complete')

    return new Response(
      JSON.stringify({
        success: true,
        schema_graph: schemaPackage,
        entity_count: graph.length,
        summary: {
          total_entities: graph.length,
          products: products?.length || 0,
          services: services?.length || 0,
          locations: locations?.length || 0,
          subsidiaries: subsidiaries?.length || 0,
          team: team?.length || 0,
          coverage: positiveCoverage?.length || 0
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('❌ Schema Graph Generator Error:', error)
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
