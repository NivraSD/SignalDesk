// Daily at 8:00 America/New_York: runs the monitoring pipeline for SCHEDULED_ORG_IDS, the same
// stages the dashboard's Run button calls (IntelligenceService.startPipeline), ending in the
// executive synthesis and opportunity detection.
//
// The browser can wait on the whole chain; a function can't, so each cron tick runs the next
// stage(s) and checkpoints the output in scheduled_pipeline_runs. A failed stage is retried on the
// next tick; a lock keeps overlapping ticks from running the same stage twice.
// Cron fires every 5 min during UTC 12-13; only ticks in the local 8:00 hour do work (DST-proof).
//   ?force=1  run now regardless of the hour     ?org=<id>  one org only
import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export const maxDuration = 300
const CRON_SECRET = process.env.CRON_SECRET

const SCHEDULED_ORG_IDS = [
  '888a79a0-fa6e-4125-8c97-74a0c3ae9fa7', // nivria
]
const TZ = 'America/New_York'
const RUN_HOUR = 8
const MAX_ATTEMPTS = 3
const DEADLINE_MS = 285_000 // every call is cut off by here, so a slow stage fails (and is retried) instead of being killed
const TICK_BUDGET_MS = 150_000 // don't start another stage after this much of the tick has passed
const LOCK_MS = 330_000

type Org = { id: string; name: string; deadline: number }
type State = Record<string, any>
const STAGES = ['select', 'collect', 'enrich', 'synthesize', 'opportunities'] as const
type Stage = (typeof STAGES)[number]

async function call(org: Org, name: string, body: Record<string, any>) {
  const left = org.deadline - Date.now()
  if (left < 10_000) throw new Error(`${name}: no time left in this tick`)
  const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/${name}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}` },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(left),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(`${name} ${res.status}: ${JSON.stringify(data).slice(0, 300)}`)
  return data
}

// Each stage returns the fields to merge into the run's state, plus a note for the log.
// `done: true` ends the run early (as startPipeline does when no articles are selected).
const RUN: Record<Stage, (org: Org, s: State) => Promise<{ state?: State; note: string; done?: boolean }>> = {
  async select(org) {
    const init = await call(org, 'pipeline-init', { organization_id: org.id, organization_name: org.name, min_targets: 10 })
    const profile = init.company_profile || {}
    const sel = await call(org, 'article-selector-v5', { organization_id: org.id, organization_name: org.name, hours_back: 24 })
    const selected = sel.articles || []
    let articles = selected
    if (selected.length) {
      // Same as the dashboard: if the relevance filter fails, keep every selected article.
      try {
        const rel = await call(org, 'monitor-stage-2-relevance', { articles: selected, organization_id: org.id, organization_name: org.name, profile })
        articles = rel.relevant_articles || selected
      } catch {}
    }
    const note = `${selected.length} selected, ${articles.length} relevant`
    if (!articles.length) return { note: `${note}; nothing to synthesize`, done: true }
    return { state: { profile, init_profile: init.profile, articles }, note }
  },

  async collect(org, s) {
    // Non-blocking side stages; failures are logged, never retried.
    const competitor = call(org, 'competitor-intelligence-search', { organization_id: org.id, organization_name: org.name })
    const collector = call(org, 'target-intelligence-collector', { articles: s.articles, organization_id: org.id, organization_name: org.name })
      .then((r) => call(org, 'mcp-crisis', {
        tool: 'detect_crisis_signals',
        arguments: { organization_id: org.id, organization_name: org.name, articles: s.articles, profile: s.profile, sensitivity: 'medium' },
      }).then(() => r))
    const [c, t] = await Promise.allSettled([competitor, collector])
    const why = (r: PromiseSettledResult<any>) => (r.status === 'fulfilled' ? 'ok' : String(r.reason).slice(0, 120))
    return { note: `competitor search: ${why(c)}; collector+crisis: ${why(t)}` }
  },

  async enrich(org, s) {
    const e = await call(org, 'monitoring-stage-2-enrichment', {
      articles: s.articles, profile: s.profile, organization_name: org.name, organization: { name: org.name }, articles_limit: 300,
    })
    const enriched = {
      enriched_articles: e.enriched_articles || e.articles || [],
      knowledge_graph: e.knowledge_graph || {},
      executive_summary: e.executive_summary || {},
      organized_intelligence: e.organized_intelligence || {},
      extracted_data: e.extracted_data,
      statistics: e.statistics,
      profile: e.profile || s.init_profile,
      monitoring_data: {
        total_articles: e.enriched_articles?.length || 0,
        articles_processed: e.articles_processed || 0,
        deep_analyzed: e.statistics?.deep_analyzed || 0,
      },
    }
    return { state: { enriched, articles: undefined }, note: `${enriched.enriched_articles.length} articles enriched` }
  },

  async synthesize(org, s) {
    const synthesis = await call(org, 'mcp-executive-synthesis', {
      method: 'tools/call',
      params: {
        name: 'synthesize_executive_intelligence',
        arguments: {
          organization_id: org.id, organization: { name: org.name }, organization_name: org.name,
          profile: s.init_profile, enriched_data: s.enriched, synthesis_focus: 'all_consolidated',
        },
      },
    })
    return { state: { synthesis }, note: 'synthesis saved' }
  },

  async opportunities(org, s) {
    const d = await call(org, 'mcp-opportunity-detector-v2', {
      organization_id: org.id, organization_name: org.name, enriched_data: s.enriched, executive_synthesis: s.synthesis, profile: s.init_profile,
    })
    const n = (d.opportunitiesV2 || d.opportunities || []).length
    return { state: { enriched: undefined, synthesis: undefined }, note: `${n} opportunities` }
  },
}

function localNow() {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23' })
      .formatToParts(new Date()).map((x) => [x.type, x.value]),
  )
  return { date: `${p.year}-${p.month}-${p.day}`, hour: Number(p.hour) }
}

async function advance(admin: ReturnType<typeof createServiceClient>, org: Org, date: string, started: number) {
  await admin.from('scheduled_pipeline_runs').upsert({ organization_id: org.id, run_date: date }, { onConflict: 'organization_id,run_date', ignoreDuplicates: true })

  // Claim the run; another tick still working on it holds the lock.
  const now = new Date()
  const { data: claimed } = await admin.from('scheduled_pipeline_runs')
    .update({ lock_until: new Date(now.getTime() + LOCK_MS).toISOString() })
    .eq('organization_id', org.id).eq('run_date', date).eq('status', 'running')
    .or(`lock_until.is.null,lock_until.lt.${now.toISOString()}`)
    .select('*')
  const run = claimed?.[0]
  if (!run) return { org: org.name, skipped: 'done, failed or locked' }

  let { next_stage: stage, state, log, attempts, status } = run as { next_stage: Stage; state: State; log: any[]; attempts: number; status: string }
  let first = true
  while (status === 'running' && Date.now() - started < TICK_BUDGET_MS) {
    const t0 = Date.now()
    try {
      const r = await RUN[stage](org, state)
      state = { ...state, ...r.state }
      for (const k of Object.keys(r.state || {})) if (state[k] === undefined) delete state[k]
      log = [...log, { stage, ok: true, note: r.note, ms: Date.now() - t0, at: new Date().toISOString() }]
      const i = STAGES.indexOf(stage)
      if (r.done || i === STAGES.length - 1) status = 'done'
      else stage = STAGES[i + 1]
      attempts = 0
      first = false
    } catch (e: any) {
      // A stage that started late in a tick may simply have run out of time; only a stage
      // that had the whole tick to itself counts as a failed attempt.
      if (first) attempts += 1
      log = [...log, { stage, ok: false, error: String(e?.message || e).slice(0, 500), ms: Date.now() - t0, at: new Date().toISOString() }]
      if (attempts >= MAX_ATTEMPTS) status = 'failed'
      break // retry on the next tick
    }
    await admin.from('scheduled_pipeline_runs')
      .update({ next_stage: stage, state, log, attempts, status, updated_at: new Date().toISOString() })
      .eq('id', run.id)
  }
  await admin.from('scheduled_pipeline_runs')
    .update({ next_stage: stage, state, log, attempts, status, lock_until: null, updated_at: new Date().toISOString() })
    .eq('id', run.id)
  return { org: org.name, status, next_stage: stage, log: log.map(({ stage, ok, note, error, ms }) => ({ stage, ok, note, error, ms })) }
}

export async function GET(request: Request) {
  if (CRON_SECRET && request.headers.get('authorization') !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const started = Date.now()
  const { searchParams } = new URL(request.url)
  const { date, hour } = localNow()
  if (hour !== RUN_HOUR && !searchParams.get('force')) {
    return NextResponse.json({ ok: true, skipped: `local hour ${hour}, runs at ${RUN_HOUR}:00 ${TZ}` })
  }

  const admin = createServiceClient()
  const only = searchParams.get('org')
  const { data: orgs } = await admin.from('organizations').select('id, name')
    .in('id', only ? SCHEDULED_ORG_IDS.filter((id) => id === only) : SCHEDULED_ORG_IDS)

  const results = await Promise.all((orgs || []).map((o) =>
    advance(admin, { ...o, deadline: started + DEADLINE_MS }, date, started).catch((e) => ({ org: o.name, error: String(e?.message || e) })),
  ))
  return NextResponse.json({ ok: true, date, results })
}
