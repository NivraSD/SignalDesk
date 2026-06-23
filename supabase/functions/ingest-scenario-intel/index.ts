// ingest-scenario-intel
//
// Reads recent target_article_matches for the scenario's organization,
// joins each match to its raw_articles row, projects into the events_feed
// event shape, dedupes against what's already there, and appends the new
// ones to lp_scenarios.events_feed.
//
// Body: { scenario_id, lookback_hours?, limit? }

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
import { jsonResponse, errorResponse, handleCors } from '../_shared/cors.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

function threatFor(strength: string | null, similarity: number | null): 'critical' | 'high' | 'medium' {
  if (strength === 'strong' || (similarity ?? 0) >= 0.7) return 'critical'
  if (strength === 'moderate' || (similarity ?? 0) >= 0.5) return 'high'
  return 'medium'
}

serve(async (req) => {
  const cors = handleCors(req)
  if (cors) return cors

  try {
    const body = await req.json()
    const { scenario_id, lookback_hours = 72, limit = 60 } = body
    if (!scenario_id) return errorResponse('scenario_id required', 400)

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    const { data: scn, error: scErr } = await supabase
      .from('lp_scenarios')
      .select('id, organization_id, events_feed')
      .eq('id', scenario_id)
      .single()
    if (scErr || !scn) return errorResponse(`scenario lookup failed: ${scErr?.message}`, 404)

    const existing = Array.isArray(scn.events_feed) ? scn.events_feed : []
    const seenSourceIds = new Set<string>(existing.map((e: any) => e?.source_id).filter(Boolean))
    const seenUrls = new Set<string>(existing.map((e: any) => e?.url).filter(Boolean))

    const since = new Date(Date.now() - lookback_hours * 3600_000).toISOString()

    const { data: matches, error: mErr } = await supabase
      .from('target_article_matches')
      .select('id, article_id, similarity_score, signal_strength, signal_category, matched_at')
      .eq('organization_id', scn.organization_id)
      .gte('matched_at', since)
      .order('matched_at', { ascending: false })
      .limit(limit)
    if (mErr) return errorResponse(`matches query failed: ${mErr.message}`, 500)

    const candidateIds = (matches || [])
      .filter(m => !seenSourceIds.has(m.article_id))
      .map(m => m.article_id)

    if (candidateIds.length === 0) {
      return jsonResponse({ ingested: 0, total_matches_in_window: matches?.length || 0, message: 'No new intel.' })
    }

    const { data: articles, error: aErr } = await supabase
      .from('raw_articles')
      .select('id, source_name, url, title, description, published_at')
      .in('id', candidateIds)
    if (aErr) return errorResponse(`articles fetch failed: ${aErr.message}`, 500)

    const matchByArticle = new Map<string, any>((matches || []).map(m => [m.article_id, m]))
    const newEvents: any[] = []
    for (const a of articles || []) {
      if (seenUrls.has(a.url)) continue
      const m = matchByArticle.get(a.id)
      const summary = a.description?.trim()
        || a.title?.trim()
        || '(no summary)'
      newEvents.push({
        id: `intel_${a.id}`,
        ts: a.published_at || m?.matched_at,
        source: a.source_name || 'wire',
        summary: a.title && a.title !== summary ? `${a.title}. ${summary}` : summary,
        auto_tags: [m?.signal_category, m?.signal_strength].filter(Boolean),
        source_id: a.id,
        similarity: m?.similarity_score ?? null,
        entities_referenced: [],
        url: a.url,
        threat: threatFor(m?.signal_strength || null, m?.similarity_score ?? null),
      })
    }

    if (newEvents.length === 0) {
      return jsonResponse({ ingested: 0, total_matches_in_window: matches?.length || 0, message: 'Articles already in feed.' })
    }

    const merged = [...existing, ...newEvents].sort((a: any, b: any) => (a.ts || '').localeCompare(b.ts || ''))
    const latest = newEvents.reduce<string | null>((acc, e) => (!acc || (e.ts || '') > acc ? e.ts : acc), null)

    const { error: uErr } = await supabase
      .from('lp_scenarios')
      .update({ events_feed: merged, last_event_at: latest || scn.events_feed })
      .eq('id', scenario_id)
    if (uErr) return errorResponse(`scenario update failed: ${uErr.message}`, 500)

    return jsonResponse({
      ingested: newEvents.length,
      total_matches_in_window: matches?.length || 0,
      feed_total: merged.length,
      latest,
    })
  } catch (err: any) {
    console.error('ingest-scenario-intel error:', err)
    return errorResponse(err.message || 'Internal error', 500)
  }
})
