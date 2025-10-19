import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Campaign Builder Research - Async Research Pipeline
 *
 * This function runs the research pipeline asynchronously and saves results to the database.
 * It's called by the orchestrator in a fire-and-forget manner to avoid timeout issues.
 */

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { sessionId, campaignGoal, orgId } = await req.json()

    console.log(`🚀 Starting async research for session ${sessionId}`)

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Run the research pipeline
    const orgContext = {
      name: 'OpenAI', // TODO: Get from org data
      industry: 'Artificial Intelligence'
    }

    // STEP 1: Organization Discovery
    console.log('📋 Step 1: Organization discovery...')
    const discoveryResponse = await fetch(
      `${Deno.env.get('SUPABASE_URL')}/functions/v1/mcp-discovery`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
        },
        body: JSON.stringify({
          organization: orgContext.name,
          industry_hint: orgContext.industry
        })
      }
    )

    const discoveryData = await discoveryResponse.json()
    console.log('✅ Organization profile created')

    // STEP 2: Parallel MCP tool calls
    console.log('🔍 Step 2: Gathering intelligence across dimensions...')

    const researchCalls = await Promise.allSettled([
      // Stakeholder Intelligence
      fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/niv-fireplexity`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
        },
        body: JSON.stringify({
          query: `${orgContext.name} stakeholders customers target audience`,
          timeWindow: '7d',
          maxResults: 10
        })
      }).then(r => r.json()).then(d => ({ type: 'stakeholder', data: d })),

      // Narrative Environment
      fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/niv-fireplexity`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
        },
        body: JSON.stringify({
          query: `${orgContext.industry} trends narrative 2025`,
          timeWindow: '7d',
          maxResults: 10
        })
      }).then(r => r.json()).then(d => ({ type: 'narrative', data: d })),

      // Channel Intelligence
      fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/journalist-registry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
        },
        body: JSON.stringify({
          industry: orgContext.industry,
          tier: 'tier1',
          count: 20
        })
      }).then(r => r.json()).then(d => ({ type: 'channel', data: d })),

      // Historical Patterns
      fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/knowledge-library-registry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
        },
        body: JSON.stringify({
          query: `${orgContext.industry} successful campaigns case studies`,
          research_area: 'case_studies',
          limit: 10
        })
      }).then(r => r.json()).then(d => ({ type: 'historical', data: d }))
    ])

    // Collect results
    const gatheredData: any = {
      discovery: discoveryData,
      stakeholder: [],
      narrative: [],
      channel: [],
      historical: []
    }

    researchCalls.forEach((result, idx) => {
      if (result.status === 'fulfilled') {
        const { type, data } = result.value as any
        gatheredData[type] = data
      }
    })

    console.log('✅ Intelligence gathered')

    // STEP 3: Synthesize
    console.log('🧪 Step 3: Synthesizing intelligence brief...')
    const synthesisResponse = await fetch(
      `${Deno.env.get('SUPABASE_URL')}/functions/v1/niv-campaign-research-synthesis`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
        },
        body: JSON.stringify({
          compiledResearch: gatheredData,
          campaignGoal,
          organizationContext: orgContext
        })
      }
    )

    const synthesisData = await synthesisResponse.json()
    const intelligenceBrief = synthesisData.campaignIntelligenceBrief

    console.log('✅ Research pipeline complete')

    // STEP 4: Save to database
    const { error } = await supabaseClient
      .from('campaign_builder_sessions')
      .update({
        research_findings: intelligenceBrief,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId)

    if (error) {
      console.error('Failed to save research:', error)
      throw new Error('Failed to save research to database')
    }

    console.log('💾 Research saved to database')

    return new Response(JSON.stringify({
      success: true,
      sessionId,
      message: 'Research complete'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error: any) {
    console.error('❌ Research error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
