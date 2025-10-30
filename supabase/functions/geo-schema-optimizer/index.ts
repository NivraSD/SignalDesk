import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

/**
 * GEO SCHEMA OPTIMIZER v2.0
 *
 * Orchestrates comprehensive schema generation system:
 *
 * SYSTEM 1: Website Entity Discovery
 *  → website-entity-scraper (Firecrawl Extract)
 *  → website-entity-compiler (Claude validation)
 *
 * SYSTEM 2: Positive Coverage Discovery
 *  → positive-coverage-scraper (Web search)
 *  → positive-coverage-compiler (Claude filtering)
 *
 * SYSTEM 3: Schema Graph Generation
 *  → schema-graph-generator (Combines everything into @graph)
 *
 * This function orchestrates all three systems to generate a complete,
 * comprehensive schema.org graph for the organization.
 */

interface SchemaOptimizationRequest {
  organization_id: string
  organization_name: string
  industry?: string
  url?: string
  force_regenerate?: boolean
  skip_entity_extraction?: boolean // For testing
  skip_positive_coverage?: boolean // For testing
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
      force_regenerate = false,
      skip_entity_extraction = false,
      skip_positive_coverage = false
    } = await req.json() as SchemaOptimizationRequest

    if (!organization_id || !organization_name) {
      throw new Error('organization_id and organization_name required')
    }

    console.log('🎯 GEO Schema Optimizer v2.0 Starting:', {
      organization_name,
      industry,
      url,
      force_regenerate
    })

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Check for existing schema
    const { data: existingSchema } = await supabase
      .from('content_library')
      .select('*')
      .eq('organization_id', organization_id)
      .eq('content_type', 'schema')
      .eq('folder', 'Schemas/Active/')
      .maybeSingle()

    if (existingSchema && !force_regenerate) {
      console.log('✅ Schema already exists, use force_regenerate=true to rebuild')
      return new Response(
        JSON.stringify({
          success: true,
          schema_exists: true,
          schema_id: existingSchema.id,
          message: 'Schema already exists'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // SYSTEM 1: Website Entity Discovery
    if (!skip_entity_extraction && url) {
      console.log('\n🌐 SYSTEM 1: Website Entity Discovery')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

      try {
        // Step 1A: Scrape website entities
        console.log('📡 Step 1A: Scraping website entities...')
        const scraperResponse = await fetch(
          `${supabaseUrl}/functions/v1/website-entity-scraper`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              organization_id,
              organization_name,
              website_url: url
            })
          }
        )

        if (scraperResponse.ok) {
          const scraperData = await scraperResponse.json()
          console.log(`   ✓ Scraped ${scraperData.summary?.total_entities || 0} entities`)

          // Step 1B: Compile entities
          if (scraperData.entities && scraperData.summary.total_entities > 0) {
            console.log('🔨 Step 1B: Compiling entities...')
            const compilerResponse = await fetch(
              `${supabaseUrl}/functions/v1/website-entity-compiler`,
              {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${supabaseKey}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  organization_id,
                  organization_name,
                  entities: scraperData.entities
                })
              }
            )

            if (compilerResponse.ok) {
              const compilerData = await compilerResponse.json()
              console.log(`   ✓ Compiled and saved ${compilerData.saved_count} entities`)
            } else {
              console.warn('   ⚠️ Entity compilation failed (non-blocking)')
            }
          }
        } else {
          console.warn('   ⚠️ Entity scraping failed (non-blocking):', await scraperResponse.text())
        }
      } catch (error) {
        console.warn('   ⚠️ Website entity discovery failed (non-blocking):', error)
      }
    } else {
      console.log('\n⏭️  SYSTEM 1: Skipped (no URL or skip_entity_extraction=true)')
    }

    // SYSTEM 2: Positive Coverage Discovery
    if (!skip_positive_coverage) {
      console.log('\n🏆 SYSTEM 2: Positive Coverage Discovery')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

      try {
        // Step 2A: Scrape positive coverage
        console.log('📡 Step 2A: Scraping positive coverage...')
        const scraperResponse = await fetch(
          `${supabaseUrl}/functions/v1/positive-coverage-scraper`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              organization_id,
              organization_name,
              recency_window: '90days'
            })
          }
        )

        if (scraperResponse.ok) {
          const scraperData = await scraperResponse.json()
          console.log(`   ✓ Found ${scraperData.summary?.recent_articles || 0} articles`)

          // Step 2B: Compile coverage
          if (scraperData.articles && scraperData.articles.length > 0) {
            console.log('🔨 Step 2B: Compiling positive coverage...')
            const compilerResponse = await fetch(
              `${supabaseUrl}/functions/v1/positive-coverage-compiler`,
              {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${supabaseKey}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  organization_id,
                  organization_name,
                  articles: scraperData.articles
                })
              }
            )

            if (compilerResponse.ok) {
              const compilerData = await compilerResponse.json()
              console.log(`   ✓ Compiled and saved ${compilerData.saved_count} coverage items`)
            } else {
              console.warn('   ⚠️ Coverage compilation failed (non-blocking)')
            }
          }
        } else {
          console.warn('   ⚠️ Coverage scraping failed (non-blocking):', await scraperResponse.text())
        }
      } catch (error) {
        console.warn('   ⚠️ Positive coverage discovery failed (non-blocking):', error)
      }
    } else {
      console.log('\n⏭️  SYSTEM 2: Skipped (skip_positive_coverage=true)')
    }

    // SYSTEM 3: Schema Graph Generation
    console.log('\n📊 SYSTEM 3: Schema Graph Generation')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    console.log('🔨 Generating comprehensive schema graph...')
    const generatorResponse = await fetch(
      `${supabaseUrl}/functions/v1/schema-graph-generator`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          organization_id,
          organization_name,
          industry,
          url
        })
      }
    )

    if (!generatorResponse.ok) {
      const errorText = await generatorResponse.text()
      console.error('Schema graph generation failed:', errorText)
      throw new Error(`Schema graph generation failed: ${errorText}`)
    }

    const generatorData = await generatorResponse.json()
    console.log(`   ✓ Generated schema graph with ${generatorData.entity_count} entities`)

    console.log('\n✅ GEO Schema Optimizer Complete!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('Summary:', generatorData.summary)

    return new Response(
      JSON.stringify({
        success: true,
        schema_graph: generatorData.schema_graph,
        entity_count: generatorData.entity_count,
        summary: generatorData.summary,
        message: 'Comprehensive schema graph generated successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('❌ GEO Schema Optimizer Error:', error)
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
