import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface FinalizeRequest {
  sessionId: string
  blueprintBase: any
  organizationContext: {
    name: string
    industry: string
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const payload = await req.json() as FinalizeRequest

    console.log('🎯 Blueprint Finalizer starting:', {
      sessionId: payload.sessionId,
      org: payload.organizationContext?.name
    })

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

    // Get orchestration result from database
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.39.3')
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const { data: sessionData } = await supabase
      .from('campaign_builder_sessions')
      .select('part3_stakeholderOrchestration')
      .eq('id', payload.sessionId)
      .single()

    if (!sessionData?.part3_stakeholderOrchestration) {
      throw new Error('Stakeholder orchestration not found in session')
    }

    const orchestrationStrategy = {
      part3_stakeholderOrchestration: sessionData.part3_stakeholderOrchestration,
      metadata: {
        totalStakeholders: sessionData.part3_stakeholderOrchestration.stakeholderOrchestrationPlans?.length || 0,
        totalLevers: sessionData.part3_stakeholderOrchestration.stakeholderOrchestrationPlans?.reduce((sum: number, p: any) => sum + (p.influenceLevers?.length || 0), 0) || 0,
        totalTactics: sessionData.part3_stakeholderOrchestration.stakeholderOrchestrationPlans?.reduce((sum: number, plan: any) => {
          return sum + (plan.influenceLevers || []).reduce((leverSum: number, lever: any) => {
            const campaign = lever.campaign || {}
            return leverSum +
              (campaign.mediaPitches?.length || 0) +
              (campaign.socialPosts?.length || 0) +
              (campaign.thoughtLeadership?.length || 0) +
              (campaign.additionalTactics?.length || 0)
          }, 0)
        }, 0) || 0
      }
    }

    console.log('✅ Orchestration found:', {
      stakeholders: orchestrationStrategy.metadata.totalStakeholders,
      levers: orchestrationStrategy.metadata.totalLevers,
      tactics: orchestrationStrategy.metadata.totalTactics
    })

    // Update progress
    await supabase
      .from('campaign_builder_sessions')
      .update({
        blueprint_progress: {
          base: 'completed',
          orchestration: 'completed',
          execution: 'running',
          merging: 'pending'
        }
      })
      .eq('id', payload.sessionId)

    // STEP 3: Generate execution requirements
    console.log('⚙️ Generating execution requirements...')

    const execResponse = await fetch(`${SUPABASE_URL}/functions/v1/niv-campaign-execution-generator`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({
        blueprintBase: payload.blueprintBase,
        orchestrationStrategy,
        organizationContext: payload.organizationContext
      })
    })

    if (!execResponse.ok) {
      const errorText = await execResponse.text()
      throw new Error(`Execution generator failed: ${execResponse.status} - ${errorText}`)
    }

    const execution = await execResponse.json()

    // Update progress
    await supabase
      .from('campaign_builder_sessions')
      .update({
        blueprint_progress: {
          base: 'completed',
          orchestration: 'completed',
          execution: 'completed',
          merging: 'running'
        }
      })
      .eq('id', payload.sessionId)

    console.log('✅ Execution requirements generated')

    // MERGE: Combine all parts into complete blueprint
    console.log('📦 Merging all parts into complete blueprint...')

    const completeBlueprint = {
      // Overview from base
      overview: payload.blueprintBase.overview,

      // Part 1: Goal Framework
      part1_goalFramework: payload.blueprintBase.part1_goalFramework,

      // Part 2: Stakeholder Mapping
      part2_stakeholderMapping: payload.blueprintBase.part2_stakeholderMapping,

      // Message Architecture (from base)
      messageArchitecture: payload.blueprintBase.messageArchitecture,

      // Part 3: Stakeholder Orchestration
      part3_stakeholderOrchestration: orchestrationStrategy.part3_stakeholderOrchestration,

      // Part 4: Counter-Narrative Strategy (placeholder - generate on-demand)
      part4_counterNarrativeStrategy: {
        status: 'pending',
        message: 'Counter-narrative playbooks can be generated on-demand when needed',
        generateEndpoint: 'niv-campaign-counter-narrative-generator'
      },

      // Part 5: Execution Requirements
      part5_executionRequirements: execution.part5_executionRequirements,

      // Part 6: Pattern Guidance (placeholder - generate on-demand)
      part6_patternGuidance: {
        status: 'pending',
        message: 'Pattern-specific guidance can be generated on-demand',
        generateEndpoint: 'niv-campaign-pattern-generator'
      },

      // Metadata
      metadata: {
        generatedAt: new Date().toISOString(),
        version: '2.0',
        architecture: 'async-multi-function',
        generatorsUsed: [
          'niv-campaign-blueprint-base',
          'niv-blueprint-stakeholder-orchestration',
          'niv-campaign-execution-generator'
        ],
        generatorsAvailable: [
          'niv-campaign-counter-narrative-generator',
          'niv-campaign-pattern-generator'
        ],
        totalTokensEstimate: 6000 + 14000 + 6000, // ~26k tokens
        organizationName: payload.organizationContext?.name
      }
    }

    // Update progress to completed
    await supabase
      .from('campaign_builder_sessions')
      .update({
        blueprint_progress: {
          base: 'completed',
          orchestration: 'completed',
          execution: 'completed',
          merging: 'completed'
        }
      })
      .eq('id', payload.sessionId)

    console.log('✅ Complete blueprint generated!')
    console.log('📊 Blueprint stats:', {
      stakeholders: orchestrationStrategy.metadata.totalStakeholders,
      levers: orchestrationStrategy.metadata.totalLevers,
      tactics: orchestrationStrategy.metadata.totalTactics,
      pattern: payload.blueprintBase.overview?.pattern
    })

    return new Response(
      JSON.stringify(completeBlueprint),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Blueprint finalizer error:', error)
    return new Response(
      JSON.stringify({
        error: error.message,
        details: 'Failed to finalize blueprint. Check edge function logs for details.'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
