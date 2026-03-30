import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: Request) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  const { searchParams } = new URL(request.url)
  const orgName = searchParams.get('org') // Optional: filter by org name

  try {
    // 1. Get organizations (filter if specified)
    let orgQuery = supabase
      .from('organizations')
      .select('id, name, created_at')
      .order('created_at', { ascending: false })

    if (orgName) {
      orgQuery = orgQuery.ilike('name', `%${orgName}%`)
    }

    const { data: orgs, error: orgError } = await orgQuery.limit(10)
    if (orgError) throw orgError

    const results: any[] = []

    for (const org of orgs || []) {
      // 2. Intelligence targets for this org
      const { count: targetCount } = await supabase
        .from('intelligence_targets')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', org.id)
        .eq('is_active', true)

      // Targets with embeddings
      const { count: embeddedTargets } = await supabase
        .from('intelligence_targets')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', org.id)
        .eq('is_active', true)
        .not('embedding', 'is', null)

      // 3. Recent article matches (last 48h)
      const since48h = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
      const { count: recentMatches } = await supabase
        .from('target_article_matches')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', org.id)
        .gte('matched_at', since48h)

      // Unprocessed matches (facts not extracted)
      const { count: pendingFacts } = await supabase
        .from('target_article_matches')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', org.id)
        .or('facts_extracted.is.null,facts_extracted.eq.false')

      // 4. Recent signals (last 7 days)
      const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      const { data: recentSignals } = await supabase
        .from('signals')
        .select('id, signal_type, title, created_at, status')
        .eq('organization_id', org.id)
        .gte('created_at', since7d)
        .order('created_at', { ascending: false })
        .limit(20)

      // Signal counts by type
      const signalsByType: Record<string, number> = {}
      for (const s of recentSignals || []) {
        signalsByType[s.signal_type] = (signalsByType[s.signal_type] || 0) + 1
      }

      // 5. Cascade alerts specifically
      const { count: cascadeAlerts } = await supabase
        .from('signals')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', org.id)
        .eq('signal_type', 'cascade_alert')
        .gte('created_at', since7d)

      // 6. Accumulated context check (targets with facts)
      const { data: targetsWithFacts } = await supabase
        .from('intelligence_targets')
        .select('id, name, total_facts, accumulated_context')
        .eq('organization_id', org.id)
        .eq('is_active', true)
        .gt('total_facts', 0)
        .order('total_facts', { ascending: false })
        .limit(10)

      // 7. Latest pipeline run
      const { data: lastPipeline } = await supabase
        .from('pipeline_runs')
        .select('id, run_type, status, started_at, completed_at, duration_seconds')
        .eq('organization_id', org.id)
        .order('started_at', { ascending: false })
        .limit(1)

      // 8. org_story_links (recent)
      const { count: storyLinks } = await supabase
        .from('org_story_links')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', org.id)
        .gte('created_at', since7d)

      results.push({
        org: { id: org.id, name: org.name },
        targets: {
          total_active: targetCount || 0,
          with_embeddings: embeddedTargets || 0,
          missing_embeddings: (targetCount || 0) - (embeddedTargets || 0),
          with_facts: targetsWithFacts?.length || 0,
          top_targets: targetsWithFacts?.map(t => ({
            name: t.name,
            total_facts: t.total_facts,
            has_context: !!t.accumulated_context
          }))
        },
        article_matches: {
          last_48h: recentMatches || 0,
          pending_fact_extraction: pendingFacts || 0
        },
        signals: {
          last_7d_total: recentSignals?.length || 0,
          by_type: signalsByType,
          cascade_alerts: cascadeAlerts || 0,
          latest: recentSignals?.slice(0, 5).map(s => ({
            type: s.signal_type,
            title: s.title?.substring(0, 80),
            status: s.status,
            created: s.created_at
          }))
        },
        story_links_7d: storyLinks || 0,
        last_pipeline: lastPipeline?.[0] || null,
        health: {
          has_targets: (targetCount || 0) > 0,
          targets_embedded: (embeddedTargets || 0) > 0,
          getting_matches: (recentMatches || 0) > 0,
          facts_accumulating: (targetsWithFacts?.length || 0) > 0,
          signals_generating: (recentSignals?.length || 0) > 0,
          cascades_active: (cascadeAlerts || 0) > 0
        }
      })
    }

    return NextResponse.json({
      checked_at: new Date().toISOString(),
      organizations: results
    })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST: Trigger pipeline stages for specific orgs
export async function POST(request: Request) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    const body = await request.json()
    const { organization_ids, action } = body

    if (!organization_ids || !Array.isArray(organization_ids) || organization_ids.length === 0) {
      return NextResponse.json({ error: 'organization_ids required' }, { status: 400 })
    }

    const results: any[] = []

    for (const orgId of organization_ids) {
      switch (action) {
        case 'embed_targets': {
          // Trigger batch-embed-targets for this org
          const res = await fetch(`${supabaseUrl}/functions/v1/batch-embed-targets`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ organization_id: orgId })
          })
          results.push({ org_id: orgId, action: 'embed_targets', status: res.status, data: await res.json().catch(() => null) })
          break
        }

        case 'match_signals': {
          const res = await fetch(`${supabaseUrl}/functions/v1/batch-match-signals`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ organization_id: orgId, hours_back: 72 })
          })
          results.push({ org_id: orgId, action: 'match_signals', status: res.status, data: await res.json().catch(() => null) })
          break
        }

        case 'extract_facts': {
          const res = await fetch(`${supabaseUrl}/functions/v1/extract-target-facts`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ organization_id: orgId, max_matches: 50 })
          })
          results.push({ org_id: orgId, action: 'extract_facts', status: res.status, data: await res.json().catch(() => null) })
          break
        }

        case 'analyze_patterns': {
          const res = await fetch(`${supabaseUrl}/functions/v1/analyze-target-patterns`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ organization_id: orgId, max_targets: 50, min_facts: 2 })
          })
          results.push({ org_id: orgId, action: 'analyze_patterns', status: res.status, data: await res.json().catch(() => null) })
          break
        }

        case 'detect_cascades': {
          const res = await fetch(`${supabaseUrl}/functions/v1/detect-cascade-patterns`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ organization_id: orgId, lookback_hours: 72 })
          })
          results.push({ org_id: orgId, action: 'detect_cascades', status: res.status, data: await res.json().catch(() => null) })
          break
        }

        case 'full_pipeline': {
          // Run ALL stages in sequence for this org
          const stages = ['embed_targets', 'match_signals', 'extract_facts', 'analyze_patterns', 'detect_cascades']
          const stageResults: any[] = []

          for (const stage of stages) {
            const funcMap: Record<string, { name: string; body: any }> = {
              embed_targets: { name: 'batch-embed-targets', body: { organization_id: orgId } },
              match_signals: { name: 'batch-match-signals', body: { organization_id: orgId, hours_back: 72 } },
              extract_facts: { name: 'extract-target-facts', body: { organization_id: orgId, max_matches: 50 } },
              analyze_patterns: { name: 'analyze-target-patterns', body: { organization_id: orgId, max_targets: 50, min_facts: 2 } },
              detect_cascades: { name: 'detect-cascade-patterns', body: { organization_id: orgId, lookback_hours: 72 } }
            }

            const { name, body: funcBody } = funcMap[stage]
            try {
              const res = await fetch(`${supabaseUrl}/functions/v1/${name}`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${supabaseServiceKey}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(funcBody)
              })
              const data = await res.json().catch(() => null)
              stageResults.push({ stage, status: res.status, success: data?.success, summary: data })
            } catch (err: any) {
              stageResults.push({ stage, error: err.message })
            }
          }

          results.push({ org_id: orgId, action: 'full_pipeline', stages: stageResults })
          break
        }

        default:
          results.push({ org_id: orgId, error: `Unknown action: ${action}` })
      }
    }

    return NextResponse.json({
      triggered_at: new Date().toISOString(),
      results
    })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
