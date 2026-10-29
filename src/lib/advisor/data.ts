// NIV advisor v1: data access shared by the API routes, NIV and the Researcher.
// Every entry point goes through requireMember() first, so all reads/writes here are scoped to an
// org the signed-in person belongs to. The service client is only ever used after that check.
import { createClient, createServiceClient } from '@/lib/supabase/server'

export type Admin = ReturnType<typeof createServiceClient>

export const TIMEZONE = 'America/New_York'

export function nowInWords(): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE, weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  }).format(new Date())
}

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

// Signed in, and a member of this org.
export async function requireMember(organizationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new HttpError(401, 'Not signed in')
  if (!organizationId) throw new HttpError(400, 'organizationId required')
  const admin = createServiceClient()
  const { data: membership } = await admin
    .from('org_users')
    .select('role')
    .eq('organization_id', organizationId)
    .eq('user_id', user.id)
    .maybeSingle()
  if (!membership) throw new HttpError(403, 'Not a member of this organization')
  return { user, admin }
}

export async function loadOrg(admin: Admin, organizationId: string) {
  const { data } = await admin
    .from('organizations')
    .select('id, name, industry, url, company_profile')
    .eq('id', organizationId)
    .single()
  return data as { id: string; name: string; industry: string | null; url: string | null; company_profile: any } | null
}

export async function loadOpportunity(admin: Admin, organizationId: string, opportunityId: string) {
  const { data } = await admin
    .from('opportunities')
    .select('id, title, description, score, urgency, category, time_window, expected_impact, strategic_context, execution_plan, data, status, executed, created_at, presentation_url')
    .eq('id', opportunityId)
    .eq('organization_id', organizationId)
    .maybeSingle()
  return data as any
}

export async function getOrCreateCaseFile(admin: Admin, organizationId: string, subjectId: string) {
  const { data: existing } = await admin
    .from('advisor_case_files')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('subject_type', 'opportunity')
    .eq('subject_id', subjectId)
    .maybeSingle()
  if (existing) return existing
  const { data, error } = await admin
    .from('advisor_case_files')
    .insert({ organization_id: organizationId, subject_type: 'opportunity', subject_id: subjectId })
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function getOrCreateThread(admin: Admin, organizationId: string, userId: string, caseFileId: string) {
  const { data: existing } = await admin
    .from('advisor_threads')
    .select('*')
    .eq('user_id', userId)
    .eq('case_file_id', caseFileId)
    .maybeSingle()
  if (existing) return existing
  const { data, error } = await admin
    .from('advisor_threads')
    .insert({ organization_id: organizationId, user_id: userId, case_file_id: caseFileId })
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function loadMessages(admin: Admin, threadId: string, limit = 40) {
  const { data } = await admin
    .from('advisor_messages')
    .select('id, role, content, meta, created_at')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: false })
    .limit(limit)
  return (data || []).reverse()
}

export async function addMessage(
  admin: Admin,
  thread: { id: string; organization_id: string },
  role: 'user' | 'assistant',
  content: string,
  meta: Record<string, unknown> = {}
) {
  const { data, error } = await admin
    .from('advisor_messages')
    .insert({ thread_id: thread.id, organization_id: thread.organization_id, role, content, meta })
    .select('id, role, content, meta, created_at')
    .single()
  if (error) throw error
  await admin.from('advisor_threads').update({ updated_at: new Date().toISOString() }).eq('id', thread.id)
  return data
}

export async function loadTaste(admin: Admin, userId: string, organizationId: string) {
  const { data } = await admin
    .from('advisor_taste')
    .select('note, created_at')
    .eq('user_id', userId)
    .or(`organization_id.is.null,organization_id.eq.${organizationId}`)
    .order('created_at', { ascending: false })
    .limit(40)
  return (data || []).map((t: { note: string }) => t.note)
}

// The org's own intelligence: articles its targets matched, newest/most similar first.
// A query narrows it by headline/summary; empty returns the most recent strong matches.
export async function searchOrgIntel(admin: Admin, organizationId: string, query: string, limit = 12) {
  const since = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
  const { data } = await admin
    .from('target_article_matches')
    .select('similarity_score, intelligence_targets(name), raw_articles(id, title, description, url, source_name, published_at)')
    .eq('organization_id', organizationId)
    .gte('matched_at', since)
    .order('similarity_score', { ascending: false })
    .limit(300)
  const words = query.toLowerCase().split(/\W+/).filter((w) => w.length > 3)
  const seen = new Set<string>()
  const rows = (data || [])
    .map((m: any) => ({ target: m.intelligence_targets?.name, score: m.similarity_score, ...m.raw_articles }))
    .filter((a: any) => a.id && !seen.has(a.id) && seen.add(a.id))
    .map((a: any) => {
      const text = `${a.title} ${a.description || ''}`.toLowerCase()
      return { ...a, hits: words.filter((w) => text.includes(w)).length }
    })
    .filter((a: any) => !words.length || a.hits > 0)
    .sort((a: any, b: any) => b.hits - a.hits || b.score - a.score)
    .slice(0, limit)
  return rows.map((a: any) => ({
    title: a.title,
    source: a.source_name,
    published: (a.published_at || '').slice(0, 10),
    url: a.url,
    summary: (a.description || '').replace(/<[^>]+>/g, '').slice(0, 300),
    matched_target: a.target,
  }))
}

export async function latestBrief(admin: Admin, organizationId: string) {
  const { data } = await admin
    .from('content_library')
    .select('title, content, created_at')
    .eq('organization_id', organizationId)
    .eq('content_type', 'executive-summary')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (!data) return null
  const text = typeof data.content === 'string' ? data.content : JSON.stringify(data.content)
  return { title: data.title, date: (data.created_at || '').slice(0, 10), text: text.slice(0, 8000) }
}

// The opportunity, condensed for a prompt.
// The org's latest opportunities (Opportunity Engine), newest first. status 'active' (default) or 'all';
// query matches title, description and category.
export async function listOpportunities(admin: Admin, organizationId: string, opts: { status?: 'active' | 'all'; limit?: number; query?: string } = {}) {
  let q = admin
    .from('opportunities')
    .select('id, title, description, score, urgency, category, time_window, status, executed, created_at, expires_at, presentation_url, data')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(Math.min(Math.max(opts.limit ?? 10, 1), 30))
  if ((opts.status ?? 'active') === 'active') q = q.eq('status', 'active')
  const term = (opts.query || '').replace(/[%_,()]/g, ' ').trim()
  if (term) q = q.or(`title.ilike.%${term}%,description.ilike.%${term}%,category.ilike.%${term}%`)
  const { data } = await q
  return (data || []).map((o: any) => ({
    id: o.id, title: o.title, score: o.score, urgency: o.urgency, category: o.category, time_window: o.time_window,
    status: o.status, executed: !!o.executed, created: (o.created_at || '').slice(0, 10), expires: o.expires_at ? String(o.expires_at).slice(0, 10) : null,
    summary: (o.description || '').slice(0, 280),
    source_article: o.data?.source_article?.title ? { title: o.data.source_article.title, source: o.data.source_article.source, url: o.data.source_article.url } : null,
    deck: o.presentation_url || null,
  }))
}

// Everything about one opportunity, including the content plan, for NIV and MCP.
export function describeOpportunityFull(opp: any): string {
  const plan = opp.execution_plan || {}
  const items = (plan.stakeholder_campaigns || []).flatMap((c: any) =>
    (c.content_items || []).map((i: any) => `  - [${c.stakeholder_name || 'audience'}] ${i.type}: ${i.topic}${i.brief?.angle ? ` (angle: ${i.brief.angle})` : ''}`)
  )
  const media = opp.strategic_context?.media_targeting
  return [
    describeOpportunity(opp),
    opp.created_at && `Created: ${String(opp.created_at).slice(0, 10)}`,
    media?.target_outlets?.length && `Target outlets: ${media.target_outlets.join(', ')}`,
    media?.primary_journalist_types?.length && `Reporters: ${media.primary_journalist_types.join(', ')}`,
    items.length && `Content plan:\n${items.slice(0, 20).join('\n')}`,
    plan.execution_timeline?.immediate?.length && `Do now: ${plan.execution_timeline.immediate.join('; ')}`,
    opp.presentation_url && `Deck: ${opp.presentation_url}`,
  ].filter(Boolean).join('\n')
}

export function describeOpportunity(opp: any): string {
  const sc = opp.strategic_context || {}
  const plan = opp.execution_plan || {}
  const article = opp.data?.source_article
  const lines = [
    `Title: ${opp.title}`,
    `Score ${opp.score ?? '?'} · urgency ${opp.urgency ?? '?'} · ${opp.category ?? ''} · status ${opp.status ?? ''}${opp.executed ? ' (executed)' : ''}`,
    opp.description && `Description: ${opp.description}`,
    sc.why_now && `Why now: ${sc.why_now}`,
    sc.competitive_advantage && `Advantage: ${sc.competitive_advantage}`,
    sc.risk_if_missed && `Risk if missed: ${sc.risk_if_missed}`,
    sc.trigger_events?.length && `Triggers: ${sc.trigger_events.join('; ')}`,
    (sc.time_window || opp.time_window) && `Time window: ${sc.time_window || opp.time_window}`,
    (sc.expected_impact || opp.expected_impact) && `Expected impact: ${sc.expected_impact || opp.expected_impact}`,
    article?.title && `Source article: "${article.title}" (${article.source || ''}) ${article.url || ''}`,
    plan.stakeholder_campaigns?.length && `Plan: ${plan.stakeholder_campaigns.length} stakeholder campaigns (${plan.stakeholder_campaigns.map((c: any) => c.stakeholder_name || c.stakeholder || c.name).filter(Boolean).slice(0, 6).join(', ')})`,
  ].filter(Boolean)
  return lines.join('\n')
}

export function describeCaseFile(cf: any): string {
  const findings = (cf.findings || []) as any[]
  const open = (cf.open_questions || []) as string[]
  if (!findings.length && !open.length && !cf.summary) return '(nothing yet)'
  return [
    cf.summary && `Where things stand: ${cf.summary}`,
    ...findings.slice(-8).map((f: any) =>
      `- [${(f.at || '').slice(0, 10)} research] Q: ${f.question}\n  A: ${f.answer}${f.sources?.length ? `\n  Sources: ${f.sources.slice(0, 5).map((s: any) => `${s.title} (${s.url})`).join('; ')}` : ''}`
    ),
    open.length && `Open questions: ${open.join(' | ')}`,
  ].filter(Boolean).join('\n')
}
