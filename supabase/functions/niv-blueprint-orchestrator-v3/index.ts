import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BlueprintOrchestratorRequest {
  sessionId?: string // Optional session ID to save results
  researchData: any // CampaignIntelligenceBrief
  selectedPositioning: any
  campaignGoal: string
  orgId: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const {
      sessionId,
      researchData,
      selectedPositioning,
      campaignGoal,
      orgId
    } = await req.json() as BlueprintOrchestratorRequest

    console.log('🎯 Blueprint Orchestrator V3:', {
      stakeholderCount: researchData?.stakeholders?.length || 0,
      positioning: selectedPositioning?.name,
      goal: campaignGoal.substring(0, 50)
    })

    const startTime = Date.now()

    const baseUrl = Deno.env.get('SUPABASE_URL')
    const authKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    // =====================================================
    // STAGE 1: ENRICHMENT LAYER (NO AI)
    // =====================================================
    console.log('📚 Stage 1: Data enrichment...')
    const enrichmentStart = Date.now()

    const enrichmentResponse = await fetch(
      `${baseUrl}/functions/v1/niv-blueprint-enrichment`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authKey}`
        },
        body: JSON.stringify({
          researchData,
          selectedPositioning,
          campaignGoal,
          orgId
        })
      }
    )

    if (!enrichmentResponse.ok) {
      const errorText = await enrichmentResponse.text()
      throw new Error(`Enrichment failed: ${errorText}`)
    }

    const enrichmentData = await enrichmentResponse.json()
    const enrichedData = enrichmentData.enrichedData

    const enrichmentTime = Date.now() - enrichmentStart
    console.log(`✅ Enrichment complete (${enrichmentTime}ms)`)
    console.log(`   - Tier1 Journalists: ${enrichmentData.metadata.tier1JournalistCount}`)
    console.log(`   - Knowledge Sources: ${enrichmentData.metadata.knowledgeSourceCount}`)

    // =====================================================
    // STAGE 2: AI GENERATION LAYER
    // =====================================================
    console.log('🤖 Stage 2A: Pattern selection...')
    const patternStart = Date.now()

    // MCP 1: Pattern Selector (~7s) - MUST run first
    const patternResponse = await fetch(`${baseUrl}/functions/v1/mcp-pattern-selector`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authKey}`
      },
      body: JSON.stringify({
        enrichedData,
        campaignGoal
      })
    })

    if (!patternResponse.ok) {
      const errorText = await patternResponse.text()
      throw new Error(`Pattern selector failed: ${errorText}`)
    }

    const patternSelection = await patternResponse.json()
    const patternTime = Date.now() - patternStart
    console.log(`✅ Pattern selected: ${patternSelection.selectedPattern.pattern} (${patternTime}ms)`)

    // Stage 2B: Influence Mapper (~25s) - needs to run BEFORE tactical
    console.log('🤖 Stage 2B: Influence mapping...')
    const influenceStart = Date.now()

    const influenceResponse = await fetch(`${baseUrl}/functions/v1/mcp-influence-mapper`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authKey}`
      },
      body: JSON.stringify({
        enrichedData,
        patternSelection,
        campaignGoal
      })
    })

    if (!influenceResponse.ok) {
      const errorText = await influenceResponse.text()
      throw new Error(`Influence mapper failed: ${errorText}`)
    }

    const influenceStrategies = await influenceResponse.json()
    const influenceTime = Date.now() - influenceStart
    console.log(`✅ Influence strategies generated: ${influenceStrategies.influenceStrategies?.length || 0} (${influenceTime}ms)`)

    // Stage 2C: Stakeholder Orchestration (NEW - replaces old tactical generation)
    console.log('🤖 Stage 2C: Stakeholder orchestration generation...')
    const tacticalStart = Date.now()

    const tacticalResponse = await fetch(`${baseUrl}/functions/v1/niv-blueprint-stakeholder-orchestration`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authKey}`
      },
      body: JSON.stringify({
        part1_strategicFoundation: enrichedData.part1_goalFramework || {},
        part2_psychologicalInfluence: influenceStrategies
      })
    })

    if (!tacticalResponse.ok) {
      throw new Error(`Stakeholder orchestration failed: ${tacticalResponse.status}`)
    }

    const tacticalOrchestration = await tacticalResponse.json()

    const tacticalTime = Date.now() - tacticalStart
    console.log(`✅ Stakeholder orchestration complete (${tacticalTime}ms)`)
    const stakeholderCount = tacticalOrchestration.part3_stakeholderOrchestration?.stakeholderOrchestrationPlans?.length || 0
    console.log(`   - Stakeholders prioritized: ${stakeholderCount}`)

    // =====================================================
    // STAGE 3: ASSEMBLY LAYER (NO AI)
    // =====================================================
    console.log('📦 Stage 3: Final assembly...')
    const assemblyStart = Date.now()

    const compilerResponse = await fetch(
      `${baseUrl}/functions/v1/niv-blueprint-compiler`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authKey}`
        },
        body: JSON.stringify({
          enrichedData,
          patternSelection,
          influenceStrategies,
          tacticalOrchestration,
          campaignGoal
        })
      }
    )

    if (!compilerResponse.ok) {
      const errorText = await compilerResponse.text()
      throw new Error(`Compiler failed: ${errorText}`)
    }

    const blueprint = await compilerResponse.json()

    const assemblyTime = Date.now() - assemblyStart
    const totalTime = Date.now() - startTime

    console.log(`✅ Assembly complete (${assemblyTime}ms)`)
    console.log(`🎉 Total blueprint generation: ${totalTime}ms`)
    console.log(`   - Enrichment: ${enrichmentTime}ms`)
    console.log(`   - Pattern Selection: ${patternTime}ms`)
    console.log(`   - Influence Mapping: ${influenceTime}ms`)
    console.log(`   - Tactical Generation: ${tacticalTime}ms`)
    console.log(`   - Assembly: ${assemblyTime}ms`)

    // Add performance metadata to blueprint
    blueprint.metadata.performance = {
      totalTime: `${totalTime}ms`,
      enrichmentTime: `${enrichmentTime}ms`,
      patternSelectionTime: `${patternTime}ms`,
      influenceMappingTime: `${influenceTime}ms`,
      tacticalGenerationTime: `${tacticalTime}ms`,
      assemblyTime: `${assemblyTime}ms`,
      stages: {
        enrichment: `${enrichmentTime}ms`,
        patternSelection: `${patternTime}ms`,
        influenceMapping: `${influenceTime}ms`,
        tacticalGeneration: `${tacticalTime}ms`,
        assembly: `${assemblyTime}ms`
      }
    }

    // If sessionId provided, save blueprint to database
    if (sessionId) {
      console.log('💾 Saving blueprint to campaign_builder_sessions...')

      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )

      const { error: saveError } = await supabaseClient
        .from('campaign_builder_sessions')
        .update({
          blueprint: blueprint,
          current_stage: 'blueprint',
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId)

      if (saveError) {
        console.error('Failed to save blueprint to database:', saveError)
        // Don't throw - we still have the blueprint even if save failed
      } else {
        console.log('✅ Blueprint saved to database')
      }
    }

    return new Response(
      JSON.stringify(blueprint),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Blueprint orchestrator error:', error)
    return new Response(
      JSON.stringify({
        error: error.message,
        details: 'Failed to generate blueprint',
        stage: error.message.includes('Enrichment') ? 'enrichment' :
               error.message.includes('Pattern') ? 'pattern_selection' :
               error.message.includes('Influence') ? 'influence_mapping' :
               error.message.includes('Tactical') ? 'tactical_generation' :
               error.message.includes('Compiler') ? 'assembly' : 'unknown'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
