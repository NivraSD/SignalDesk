import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Vercel Cron endpoint: orchestrates the full signal pipeline
// Calls each edge function PER ORG in parallel (fire-and-forget)
// so no single org blocks others and we don't hit the 60s edge function timeout

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Vercel cron secret to prevent unauthorized access
const CRON_SECRET = process.env.CRON_SECRET

// Pipeline stages in order. Each stage calls a Supabase edge function.
const PIPELINE_STAGES = [
  {
    name: 'extract-target-facts',
    body: (orgId: string) => ({ organization_id: orgId, max_matches: 30 }),
    // Only run if org has pending matches
    condition: 'has_pending_matches'
  },
  {
    name: 'analyze-target-patterns',
    body: (orgId: string) => ({ organization_id: orgId, max_targets: 8, min_facts: 2 }),
    // Only run if org has targets with facts
    condition: 'has_facts'
  },
  {
    name: 'generate-outcome-predictions',
    body: (orgId: string) => ({ organization_id: orgId, max_signals: 10 }),
    condition: 'has_signals'
  },
  {
    name: 'detect-cascade-patterns',
    body: (orgId: string) => ({ organization_id: orgId, lookback_hours: 72 }),
    condition: 'has_signals'
  }
] as const

async function callEdgeFunction(name: string, body: Record<string, any>): Promise<{ status: number; data: any }> {
  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/${name}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(55000) // 55s timeout per call
    })
    const data = await res.json().catch(async () => ({ raw: await res.text().catch(() => 'no body') }))
    return { status: res.status, data }
  } catch (err: any) {
    return { status: 0, data: { error: err.message } }
  }
}

export async function GET(request: Request) {
  // Verify cron secret if set
  if (CRON_SECRET) {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const { searchParams } = new URL(request.url)
  const stage = searchParams.get('stage') // Optional: run specific stage only
  const orgFilter = searchParams.get('org') // Optional: run for specific org only

  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  const startTime = Date.now()

  try {
    // Get all active organizations with intelligence targets
    let orgQuery = supabase
      .from('organizations')
      .select('id, name')

    if (orgFilter) {
      orgQuery = orgQuery.ilike('name', `%${orgFilter}%`)
    }

    const { data: orgs, error: orgError } = await orgQuery
    if (orgError) throw orgError

    if (!orgs || orgs.length === 0) {
      return NextResponse.json({ success: true, message: 'No organizations found' })
    }

    // Check which orgs have active targets (skip orgs with no monitoring)
    const { data: activeTargetOrgs } = await supabase
      .from('intelligence_targets')
      .select('organization_id')
      .eq('is_active', true)

    const orgsWithTargets = new Set((activeTargetOrgs || []).map(t => t.organization_id))
    const eligibleOrgs = orgs.filter(o => orgsWithTargets.has(o.id))

    // Determine which stages to run
    const stagesToRun = stage
      ? PIPELINE_STAGES.filter(s => s.name === stage || s.name.includes(stage))
      : PIPELINE_STAGES

    const results: Record<string, any> = {}

    // Run each stage for ALL orgs in parallel
    for (const pipelineStage of stagesToRun) {
      const stageStart = Date.now()

      // Fire all orgs in parallel for this stage
      const promises = eligibleOrgs.map(async (org) => {
        const body = pipelineStage.body(org.id)
        const result = await callEdgeFunction(pipelineStage.name, body)
        return {
          org_id: org.id,
          org_name: org.name,
          status: result.status,
          success: result.data?.success,
          facts: result.data?.facts_extracted,
          patterns: result.data?.patterns_detected,
          signals: result.data?.signals_created,
          cascades: result.data?.cascades_detected,
          duration: result.data?.duration_seconds,
          error: result.data?.error
        }
      })

      const stageResults = await Promise.allSettled(promises)

      results[pipelineStage.name] = {
        duration_ms: Date.now() - stageStart,
        orgs: stageResults.map((r, i) => {
          if (r.status === 'fulfilled') return r.value
          return { org_name: eligibleOrgs[i]?.name, error: r.reason?.message }
        })
      }

      // Don't exceed Vercel function timeout (300s for pro, 60s for hobby)
      if (Date.now() - startTime > 250000) {
        results._warning = 'Stopped early to avoid timeout'
        break
      }
    }

    return NextResponse.json({
      success: true,
      triggered_at: new Date().toISOString(),
      eligible_orgs: eligibleOrgs.length,
      total_orgs: orgs.length,
      stages_run: Object.keys(results).filter(k => !k.startsWith('_')).length,
      duration_ms: Date.now() - startTime,
      results
    })

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      duration_ms: Date.now() - startTime
    }, { status: 500 })
  }
}
