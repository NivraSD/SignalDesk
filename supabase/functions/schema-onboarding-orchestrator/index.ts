import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

/**
 * SCHEMA ONBOARDING ORCHESTRATOR
 *
 * GEO-First Schema Generation Pipeline
 *
 * Stage 0: Schema Discovery - Check for existing schema
 * Stage 1: GEO Discovery - AI visibility + competitor analysis (geo-intelligence-monitor)
 * Stage 2: Website Scraping - Get clean text (website-entity-scraper)
 * Stage 3: Entity Extraction - Claude-based extraction (entity-extractor)
 * Stage 4: Entity Enrichment - Validation & dedup (entity-enricher)
 * Stage 5: Coverage Discovery - Positive news (positive-coverage-scraper)
 * Stage 6: Schema Synthesis - Final schema (schema-graph-generator)
 */

interface OrchestratorRequest {
  organization_id: string
  organization_name: string
  website_url: string
  industry?: string
  skip_geo_discovery?: boolean // Option to skip GEO if desired
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
      industry,
      skip_geo_discovery = false
    }: OrchestratorRequest = await req.json()

    if (!organization_id || !organization_name || !website_url) {
      throw new Error('organization_id, organization_name, and website_url required')
    }

    console.log('🎯 Schema Onboarding Orchestrator Starting:', {
      organization_name,
      website_url,
      industry,
      skip_geo_discovery
    })

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const results: any = {
      stages: {},
      timings: {}
    }

    const startTime = Date.now()

    // ========================================
    // STAGE 0: Schema Discovery
    // ========================================
    console.log('\n📋 STAGE 0: Schema Discovery')
    const stage0Start = Date.now()

    const { data: existingSchema } = await supabase
      .from('content_library')
      .select('*')
      .eq('organization_id', organization_id)
      .eq('content_type', 'schema')
      .eq('folder', 'Schemas/Active/')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single()

    const hasExistingSchema = !!existingSchema
    results.stages.schema_discovery = {
      has_existing_schema: hasExistingSchema,
      schema_version: existingSchema?.metadata?.version || 0,
      mode: hasExistingSchema ? 'enhancement' : 'creation'
    }

    console.log(`   ${hasExistingSchema ? '✓ Found existing schema' : '○ No existing schema'} - Mode: ${results.stages.schema_discovery.mode}`)
    results.timings.schema_discovery = Date.now() - stage0Start

    // ========================================
    // STAGE 1: GEO Discovery (Optional)
    // ========================================
    if (!skip_geo_discovery) {
      console.log('\n🎯 STAGE 1: GEO Discovery')
      const stage1Start = Date.now()

      try {
        const geoResponse = await fetch(
          `${supabaseUrl}/functions/v1/geo-intelligence-monitor`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              organization_id,
              organization_name,
              industry: industry || 'technology'
            })
          }
        )

        if (geoResponse.ok) {
          const geoData = await geoResponse.json()
          results.stages.geo_discovery = {
            success: true,
            summary: geoData.summary,
            signals: geoData.signals?.slice(0, 5), // Top 5 signals
            synthesis: geoData.synthesis
          }
          console.log('   ✓ GEO Discovery complete:', geoData.summary)
        } else {
          console.warn('   ⚠ GEO Discovery failed:', await geoResponse.text())
          results.stages.geo_discovery = { success: false }
        }
      } catch (error) {
        console.error('   ✗ GEO Discovery error:', error)
        results.stages.geo_discovery = { success: false, error: error.toString() }
      }

      results.timings.geo_discovery = Date.now() - stage1Start
    } else {
      console.log('\n⏭ STAGE 1: GEO Discovery (Skipped)')
      results.stages.geo_discovery = { skipped: true }
    }

    // ========================================
    // STAGE 2: Website Scraping
    // ========================================
    console.log('\n🌐 STAGE 2: Website Scraping')
    const stage2Start = Date.now()

    const scrapeResponse = await fetch(
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
          website_url
        })
      }
    )

    if (!scrapeResponse.ok) {
      throw new Error(`Website scraping failed: ${await scrapeResponse.text()}`)
    }

    const scrapeData = await scrapeResponse.json()
    results.stages.website_scraping = {
      success: true,
      pages_scraped: scrapeData.summary?.total_pages || 0,
      total_text_length: scrapeData.summary?.total_text_length || 0
    }

    console.log(`   ✓ Scraped ${results.stages.website_scraping.pages_scraped} pages`)
    results.timings.website_scraping = Date.now() - stage2Start

    // ========================================
    // STAGE 3: Entity Extraction
    // ========================================
    console.log('\n🔍 STAGE 3: Entity Extraction')
    const stage3Start = Date.now()

    const extractResponse = await fetch(
      `${supabaseUrl}/functions/v1/entity-extractor`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          organization_id,
          organization_name,
          scraped_pages: scrapeData.pages || []
        })
      }
    )

    if (!extractResponse.ok) {
      throw new Error(`Entity extraction failed: ${await extractResponse.text()}`)
    }

    const extractData = await extractResponse.json()
    results.stages.entity_extraction = {
      success: true,
      total_entities: extractData.summary?.total_entities || 0,
      by_type: extractData.summary?.by_type || {}
    }

    console.log(`   ✓ Extracted ${results.stages.entity_extraction.total_entities} entities`)
    results.timings.entity_extraction = Date.now() - stage3Start

    // ========================================
    // STAGE 4: Entity Enrichment
    // ========================================
    console.log('\n✨ STAGE 4: Entity Enrichment')
    const stage4Start = Date.now()

    const enrichResponse = await fetch(
      `${supabaseUrl}/functions/v1/entity-enricher`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          organization_id,
          organization_name,
          entities: extractData.entities || {},
          geo_insights: results.stages.geo_discovery?.signals || null
        })
      }
    )

    if (!enrichResponse.ok) {
      throw new Error(`Entity enrichment failed: ${await enrichResponse.text()}`)
    }

    const enrichData = await enrichResponse.json()
    results.stages.entity_enrichment = {
      success: true,
      total_entities: enrichData.summary?.total_entities || 0,
      by_type: enrichData.summary?.by_type || {},
      quality_metrics: enrichData.summary?.quality_metrics || {}
    }

    console.log(`   ✓ Enriched ${results.stages.entity_enrichment.total_entities} entities`)
    results.timings.entity_enrichment = Date.now() - stage4Start

    // ========================================
    // STAGE 5: Coverage Discovery
    // ========================================
    console.log('\n🏆 STAGE 5: Coverage Discovery')
    const stage5Start = Date.now()

    const coverageResponse = await fetch(
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

    let coverageData = null
    if (coverageResponse.ok) {
      coverageData = await coverageResponse.json()
      results.stages.coverage_discovery = {
        success: true,
        articles_found: coverageData.summary?.final_articles || 0
      }
      console.log(`   ✓ Found ${results.stages.coverage_discovery.articles_found} articles`)
    } else {
      console.warn('   ⚠ Coverage discovery failed')
      results.stages.coverage_discovery = { success: false }
    }

    results.timings.coverage_discovery = Date.now() - stage5Start

    // ========================================
    // STAGE 6: Schema Synthesis
    // ========================================
    console.log('\n📊 STAGE 6: Schema Synthesis')
    const stage6Start = Date.now()

    const schemaResponse = await fetch(
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
          industry: industry,
          url: website_url,
          entities: enrichData.enriched_entities || {},
          coverage: coverageData?.articles || []
        })
      }
    )

    if (!schemaResponse.ok) {
      throw new Error(`Schema synthesis failed: ${await schemaResponse.text()}`)
    }

    const schemaData = await schemaResponse.json()
    results.stages.schema_synthesis = {
      success: true,
      entity_count: schemaData.entity_count || 0,
      schema_generated: true
    }

    console.log(`   ✓ Schema generated with ${results.stages.schema_synthesis.entity_count} total entities`)
    results.timings.schema_synthesis = Date.now() - stage6Start

    // ========================================
    // SUMMARY
    // ========================================
    const totalTime = Date.now() - startTime

    console.log('\n✅ Schema Onboarding Complete!')
    console.log(`   Total time: ${(totalTime / 1000).toFixed(2)}s`)
    console.log('\n   Stage Timings:')
    for (const [stage, ms] of Object.entries(results.timings)) {
      console.log(`      ${stage}: ${((ms as number) / 1000).toFixed(2)}s`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        results,
        total_time_ms: totalTime,
        summary: {
          schema_mode: results.stages.schema_discovery.mode,
          geo_insights_generated: !skip_geo_discovery && results.stages.geo_discovery?.success,
          entities_extracted: results.stages.entity_enrichment?.total_entities || 0,
          coverage_articles: results.stages.coverage_discovery?.articles_found || 0,
          schema_generated: results.stages.schema_synthesis?.success || false
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('❌ Schema Onboarding Orchestrator Error:', error)
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
