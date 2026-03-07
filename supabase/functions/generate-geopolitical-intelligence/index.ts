import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const {
      report_id,
      organization_id,
      organization_name,
      organization_profile,
      industry,
      trigger_event,
      raw_research
    } = await req.json()

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

    console.log('Geopolitical Intelligence Orchestrator starting for:', organization_name)
    console.log('Report ID:', report_id)

    // Helper to call sibling edge functions
    const callFunction = async (functionName: string, body: any) => {
      console.log(`Calling ${functionName}...`)
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
        throw new Error(`${functionName} failed: ${response.status} - ${errorText.substring(0, 500)}`)
      }

      const data = await response.json()
      const duration = Date.now() - startTime
      console.log(`${functionName} completed in ${duration}ms`)
      return data
    }

    // STAGE 1: Executive Summary + Situation Assessment + Stakeholder Analysis
    console.log('Stage 1: Situation & Stakeholders...')
    const stage1Result = await callFunction('pa-intel-stage1', {
      organization_name,
      organization_profile,
      industry,
      trigger_event,
      raw_research
    })

    if (!stage1Result.success) {
      throw new Error(`Stage 1 failed: ${stage1Result.error}`)
    }

    const stage1 = stage1Result.stage1
    console.log('Stage 1 complete. Keys:', Object.keys(stage1).join(', '))

    // STAGE 2: Geopolitical Context + Scenarios + Impact + Sources
    // Feeds Stage 1 output as context so Stage 2 builds on established facts
    console.log('Stage 2: Scenarios & Impact...')
    const stage2Result = await callFunction('pa-intel-stage2', {
      organization_name,
      industry,
      trigger_event,
      raw_research,
      stage1
    })

    if (!stage2Result.success) {
      throw new Error(`Stage 2 failed: ${stage2Result.error}`)
    }

    const stage2 = stage2Result.stage2
    console.log('Stage 2 complete. Keys:', Object.keys(stage2).join(', '))

    // MERGE: Combine Stage 1 + Stage 2 into unified research_data
    const researchData = {
      executive_summary: stage1.executive_summary,
      situation_assessment: stage1.situation_assessment,
      stakeholder_analysis: stage1.stakeholder_analysis,
      geopolitical_context: stage2.geopolitical_context,
      scenario_analysis: stage2.scenario_analysis,
      impact_assessment: stage2.impact_assessment,
      sources_and_confidence: stage2.sources_and_confidence
    }

    console.log('Orchestration complete. Merged research data.')

    return new Response(
      JSON.stringify({
        success: true,
        research_data: researchData,
        report_id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error('Geopolitical Intelligence Orchestrator error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
