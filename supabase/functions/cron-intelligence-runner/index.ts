import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
import { corsHeaders } from '../_shared/cors.ts'

/**
 * CRON INTELLIGENCE RUNNER
 *
 * Scheduled by pg_cron to keep the intelligence pipeline running automatically.
 *
 * Modes:
 *   signals     — Fetch new articles & create signals for active orgs
 *   predictions — Generate predictions from accumulated signals
 *   full        — Both (signals first, then predictions)
 *
 * Only processes orgs that have intelligence_targets configured.
 * Uses batch_size + offset for round-robin across cron runs so
 * every org gets covered even if there are many.
 */

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

async function callEdgeFunction(name: string, body: Record<string, unknown>, timeoutMs = 50000): Promise<any> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body),
      signal: controller.signal
    })
    const data = await response.json().catch(() => ({}))
    return { ok: response.ok, status: response.status, data }
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return { ok: false, status: 0, data: { error: 'timeout' } }
    }
    return { ok: false, status: 0, data: { error: err.message } }
  } finally {
    clearTimeout(timer)
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  const startTime = Date.now()
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  try {
    const body = await req.json().catch(() => ({}))
    const mode: string = body.mode || 'full'
    const batchSize: number = body.batch_size || 5
    // offset auto-rotates: stored in cron_state table, or passed explicitly
    let offset: number = body.offset ?? -1 // -1 = auto-rotate

    console.log(`🕐 CRON Intelligence Runner — mode: ${mode}, batch: ${batchSize}`)
    console.log(`   Time: ${new Date().toISOString()}`)

    let signalResults: any[] = []
    let predictionResult: any = null

    // ================================================================
    // STEP 1: Signal Processing — fetch articles & create signals
    // ================================================================
    if (mode === 'signals' || mode === 'full') {
      // Only get orgs that have intelligence_targets (i.e., actually configured)
      const { data: activeOrgIds } = await supabase
        .from('intelligence_targets')
        .select('organization_id')

      if (!activeOrgIds || activeOrgIds.length === 0) {
        console.log('   No organizations with intelligence targets')
      } else {
        const uniqueOrgIds = [...new Set(activeOrgIds.map(r => r.organization_id))]

        const { data: orgs } = await supabase
          .from('organizations')
          .select('id, name')
          .in('id', uniqueOrgIds)
          .order('name')

        if (orgs && orgs.length > 0) {
          // Auto-rotate offset using simple time-based rotation
          if (offset === -1) {
            // Use current hour to determine which batch to process
            // This naturally rotates through orgs across cron runs
            const hourOfDay = new Date().getUTCHours()
            const runsPerDay = 6 // ~every 4 hours
            const runIndex = Math.floor(hourOfDay / (24 / runsPerDay))
            const totalBatches = Math.ceil(orgs.length / batchSize)
            offset = (runIndex % totalBatches) * batchSize
          }

          const batch = orgs.slice(offset, offset + batchSize)
          console.log(`\n   📊 Processing batch ${Math.floor(offset / batchSize) + 1} of ${Math.ceil(orgs.length / batchSize)}`)
          console.log(`   ${batch.length} orgs (of ${orgs.length} with targets): ${batch.map(o => o.name).join(', ')}`)

          // Process batch concurrently (all at once since batch is small)
          const promises = batch.map(async (org) => {
            console.log(`   📡 ${org.name}...`)
            try {
              const result = await callEdgeFunction('real-time-alert-router', {
                organization_name: org.name,
                organization_id: org.id,
                time_window: '6hours',
                route_to_crisis: true,
                route_to_predictions: true
              }, 50000)

              const entry = {
                org: org.name,
                status: result.ok ? 'ok' : 'error',
                articles: result.data?.articles_analyzed || 0,
                error: result.ok ? undefined : (result.data?.error || `HTTP ${result.status}`)
              }
              console.log(`   ${result.ok ? '✅' : '❌'} ${org.name}: ${entry.articles} articles`)
              return entry
            } catch (err: any) {
              console.error(`   ❌ ${org.name}: ${err.message}`)
              return { org: org.name, status: 'error', articles: 0, error: err.message }
            }
          })

          signalResults = await Promise.all(promises)

          const processed = signalResults.filter(r => r.status === 'ok').length
          const errors = signalResults.filter(r => r.status === 'error').length
          console.log(`\n   Signal summary: ${processed} ok, ${errors} errors`)
        }
      }
    }

    // ================================================================
    // STEP 2: Prediction Generation
    // NOTE: generate-outcome-predictions runs 130s+ (many Claude calls)
    // so it MUST be called directly via its own pg_cron job, NOT nested
    // through this runner. This mode exists for manual testing only.
    // ================================================================
    if (mode === 'predictions') {
      console.log(`\n   🎯 Triggering prediction generation (direct call)...`)
      console.log(`   ⚠️  This takes 2+ minutes. For cron, call generate-outcome-predictions directly.`)

      const result = await callEdgeFunction('generate-outcome-predictions', {
        hours_back: 168
      }, 55000)

      predictionResult = result.data
      console.log(`   ${result.ok ? '✅' : '⚠️'} Predictions: ${predictionResult?.predictions_created || 0} created`)
    }

    // ================================================================
    // DONE
    // ================================================================
    const duration = Math.round((Date.now() - startTime) / 1000)
    console.log(`\n🏁 Cron complete in ${duration}s`)

    return new Response(JSON.stringify({
      success: true,
      mode,
      duration_seconds: duration,
      signals: {
        orgs_processed: signalResults.filter(r => r.status === 'ok').length,
        orgs_errored: signalResults.filter(r => r.status === 'error').length,
        total_articles: signalResults.reduce((sum, r) => sum + (r.articles || 0), 0),
        details: signalResults
      },
      predictions: predictionResult
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error: any) {
    console.error('❌ Cron runner error:', error)
    return new Response(JSON.stringify({
      error: error.message,
      duration_seconds: Math.round((Date.now() - startTime) / 1000)
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
