import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface OrchestratorRequest {
  sessionId?: string
  researchData: any
  selectedPositioning: any
  campaignGoal: string
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
    const payload = await req.json() as OrchestratorRequest

    console.log('🎯 Blueprint Orchestrator starting:', {
      goal: payload.campaignGoal?.substring(0, 50),
      positioning: payload.selectedPositioning?.name,
      org: payload.organizationContext?.name,
      sessionId: payload.sessionId
    })

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

    // Helper to update progress in session
    const updateProgress = async (stage: string, status: 'running' | 'completed' | 'failed') => {
      if (!payload.sessionId) return

      try {
        const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.39.3')
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

        // Define stage order
        const stageOrder = ['base', 'orchestration', 'execution', 'merging']
        const currentIndex = stageOrder.indexOf(stage)

        // Build progress object: completed for past stages, current status for current stage, pending for future stages
        const progress: any = {}
        stageOrder.forEach((s, idx) => {
          if (idx < currentIndex) {
            progress[s] = 'completed'
          } else if (idx === currentIndex) {
            progress[s] = status
          } else {
            progress[s] = 'pending'
          }
        })

        await supabase
          .from('campaign_builder_sessions')
          .update({ blueprint_progress: progress })
          .eq('id', payload.sessionId)

        console.log(`📊 Progress updated: ${stage} = ${status}`, progress)
      } catch (err) {
        console.error('Progress update failed (non-critical):', err)
      }
    }

    // Helper to call edge functions
    const callFunction = async (functionName: string, body: any) => {
      console.log(`📞 Calling ${functionName}...`)
      const startTime = Date.now()

      const response = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify(body)
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`${functionName} failed: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      const duration = Date.now() - startTime
      console.log(`✅ ${functionName} completed in ${duration}ms`)

      return data
    }

    // STEP 1: Generate blueprint base (Parts 1-2 + Message Architecture)
    console.log('📋 Step 1: Generating blueprint base...')
    await updateProgress('base', 'running')

    const blueprintBase = await callFunction('niv-campaign-blueprint-base', {
      researchData: payload.researchData,
      campaignGoal: payload.campaignGoal,
      selectedPositioning: payload.selectedPositioning,
      organizationContext: payload.organizationContext
    })

    await updateProgress('base', 'completed')

    // STEP 2: Start stakeholder orchestration (async - will complete in background)
    console.log('⚡ Step 2: Starting stakeholder orchestration (async)...')
    await updateProgress('orchestration', 'running')

    // Start orchestration function - it will save to database when complete
    // Don't wait for HTTP response - frontend will poll database
    callFunction('niv-blueprint-stakeholder-orchestration', {
      part1_strategicFoundation: blueprintBase.part1_goalFramework,
      part2_psychologicalInfluence: blueprintBase.part2_stakeholderMapping,
      sessionId: payload.sessionId
    }).catch(err => {
      console.log('⚠️ Orchestration started in background (HTTP response will timeout)')
    })

    console.log('✅ Blueprint base generated - orchestration running in background')
    console.log('📊 Frontend will poll database for completion')

    // Return immediately with base and job status
    // Frontend will poll for part3 and continue from there
    return new Response(
      JSON.stringify({
        status: 'partial',
        message: 'Blueprint base generated. Stakeholder orchestration running in background.',
        blueprintBase,
        sessionId: payload.sessionId,
        nextSteps: {
          poll: 'part3_stakeholderOrchestration',
          interval: 2000,
          maxWait: 240000 // 4 minutes
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Blueprint orchestrator error:', error)
    return new Response(
      JSON.stringify({
        error: error.message,
        details: 'Failed to generate complete blueprint. Check edge function logs for details.'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
