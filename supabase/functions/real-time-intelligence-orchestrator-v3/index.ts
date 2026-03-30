// Real-Time Intelligence Orchestrator V3
// SIMPLE WRAPPER around the proven intelligence-orchestrator-v2
// With timeout handling: returns partial results if taking too long

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// 120-second timeout to stay under Supabase's 150s limit
const TIMEOUT_MS = 120000

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { organization_name, time_window, route_to_opportunities, route_to_crisis } = await req.json()

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('  Real-Time Intelligence Orchestrator V3')
    console.log('  (Wrapper around proven pipeline)')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`Organization: ${organization_name}`)
    console.log(`Time window: ${time_window}`)
    console.log()

    const startTime = Date.now()

    // Call the PROVEN intelligence-orchestrator-v2 directly with timeout handling
    console.log('📡 Calling intelligence-orchestrator-v2 (proven pipeline)...')
    console.log(`⏰ Timeout set to ${TIMEOUT_MS / 1000}s`)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

    let orchestratorData
    let timedOut = false

    try {
      const orchestratorResponse = await fetch(`${SUPABASE_URL}/functions/v1/intelligence-orchestrator-v2`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_KEY}`
        },
        body: JSON.stringify({
          organization_name: organization_name,
          skip_opportunity_engine: route_to_opportunities === false
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!orchestratorResponse.ok) {
        const error = await orchestratorResponse.text()
        throw new Error(`intelligence-orchestrator-v2 failed: ${orchestratorResponse.status} - ${error}`)
      }

      orchestratorData = await orchestratorResponse.json()
      console.log(`✅ Intelligence orchestrator complete`)
      console.log(`   Articles: ${orchestratorData.statistics?.articles_analyzed || 0}`)
      console.log(`   Events: ${orchestratorData.statistics?.events_extracted || 0}`)
      console.log(`   Opportunities: ${orchestratorData.opportunities?.length || 0}`)

    } catch (error: any) {
      clearTimeout(timeoutId)

      if (error.name === 'AbortError') {
        console.log(`⚠️ Intelligence orchestrator timed out after ${TIMEOUT_MS / 1000}s`)
        timedOut = true

        // Return partial results showing we're processing
        orchestratorData = {
          success: false,
          timed_out: true,
          message: 'Intelligence pipeline is still processing. This typically takes 2-3 minutes for the full pipeline.',
          statistics: { articles_analyzed: 0, events_extracted: 0 },
          opportunities: []
        }
      } else {
        throw error
      }
    }

    // Filter results by time window if needed
    const executionTime = Date.now() - startTime

    return new Response(JSON.stringify({
      success: !timedOut,
      timed_out: timedOut,
      time_window,
      execution_time_ms: executionTime,

      // Pass through everything from the proven pipeline
      ...orchestratorData,

      // Add real-time specific formatting
      breaking_summary: timedOut
        ? 'Intelligence pipeline is processing. Full results typically take 2-3 minutes.'
        : orchestratorData.executive_synthesis?.synthesis?.executive_summary ||
          orchestratorData.executive_synthesis?.executive_summary ||
          'Intelligence summary generated',
      critical_alerts: [],  // Could extract from synthesis
      watch_list: [],       // Could extract from synthesis

      articles_analyzed: orchestratorData.statistics?.articles_analyzed || 0,
      opportunities_count: orchestratorData.opportunities?.length || 0,
      crises_count: 0,  // TODO: Implement crisis detection

    }), {
      status: timedOut ? 202 : 200,  // 202 Accepted for timeout (processing continues)
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error: any) {
    console.error('Real-time orchestrator error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
