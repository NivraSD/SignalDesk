// Monitor Intelligence Edge Function for Supabase
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { organizationId, targetId } = await req.json()

    if (!organizationId) {
      throw new Error('organizationId is required')
    }

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Create monitoring run record
    const { data: monitoringRun, error: runError } = await supabase
      .from('monitoring_runs')
      .insert({
        organization_id: organizationId,
        target_id: targetId,
        status: 'running',
        started_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (runError) {
      throw new Error(`Failed to create monitoring run: ${runError.message}`)
    }

    // Get intelligence targets
    let targetsQuery = supabase
      .from('intelligence_targets')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('active', true)

    if (targetId) {
      targetsQuery = targetsQuery.eq('id', targetId)
    }

    const { data: targets, error: targetsError } = await targetsQuery

    if (targetsError) {
      throw new Error(`Failed to fetch targets: ${targetsError.message}`)
    }

    // Simulate monitoring process (in production, this would call actual monitoring APIs)
    const findings = []
    
    for (const target of targets || []) {
      // Here you would implement actual monitoring logic
      // For demo purposes, we'll create sample findings
      
      const sampleFinding = {
        organization_id: organizationId,
        target_id: target.id,
        title: `New development regarding ${target.name}`,
        content: `Automated monitoring detected relevant activity for ${target.name}. This is a sample finding generated during monitoring.`,
        source: 'Automated Monitoring',
        relevance_score: Math.floor(Math.random() * 30) + 70, // 70-100
        sentiment: ['positive', 'negative', 'neutral'][Math.floor(Math.random() * 3)],
        metadata: {
          monitoring_run_id: monitoringRun.id,
          target_type: target.type,
          automated: true,
        },
      }
      
      findings.push(sampleFinding)
    }

    // Insert findings if any
    let findingsCount = 0
    if (findings.length > 0) {
      const { data: insertedFindings, error: findingsError } = await supabase
        .from('intelligence_findings')
        .insert(findings)
        .select()

      if (findingsError) {
        console.error('Error inserting findings:', findingsError)
      } else {
        findingsCount = insertedFindings?.length || 0
      }
    }

    // Update monitoring run as completed
    const { error: updateError } = await supabase
      .from('monitoring_runs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        findings_count: findingsCount,
      })
      .eq('id', monitoringRun.id)

    if (updateError) {
      console.error('Error updating monitoring run:', updateError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        monitoring_run_id: monitoringRun.id,
        findings_count: findingsCount,
        targets_processed: targets?.length || 0,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in monitor-intelligence function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})