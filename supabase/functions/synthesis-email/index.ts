// Emails each new executive synthesis to the org's recipients (organizations.settings.synthesis_emails).
//   POST {}                      (service role; run every 15 min by /api/cron/synthesis-emails)
//   POST { synthesis_id, to? }   send one now (to overrides the recipients; still logged)
// A synthesis is sent once (synthesis_email_log). Only syntheses from the last 12 hours are picked up,
// so turning this on doesn't flood an inbox with old ones.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const FROM = 'NIV <notifications@nivria.ai>'

function role(token: string): string | null {
  try { return JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).role ?? null } catch { return null }
}

const esc = (s: unknown) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const paras = (s: string) => s.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean).map((p) => `<p style="margin:0 0 14px">${esc(p).replace(/\n/g, '<br>')}</p>`).join('')
const h2 = (t: string) => `<h2 style="font-size:15px;letter-spacing:.04em;text-transform:uppercase;color:#C75D2C;margin:28px 0 10px">${t}</h2>`

function render(orgName: string, createdAt: string, s: any, summaryText: string) {
  const date = new Date(createdAt + (createdAt.endsWith('Z') ? '' : 'Z')).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'America/New_York' })
  const dev = (s.key_developments || []).slice(0, 10).map((d: any) => `
    <li style="margin:0 0 14px">
      <strong>${esc(d.entity || d.category || '')}</strong>${d.outlet ? ` <span style="color:#777">· ${esc(d.outlet)}</span>` : ''}<br>
      ${d.url ? `<a href="${esc(d.url)}" style="color:#1F1F1F">${esc(d.event || d.source)}</a>` : esc(d.event || d.source)}
      ${d.pr_implication ? `<div style="color:#555;margin-top:4px">${esc(d.pr_implication)}</div>` : ''}
    </li>`).join('')
  const narratives = (s.narrative_updates || []).slice(0, 6).map((n: any) => typeof n === 'string'
    ? `<li style="margin:0 0 10px">${esc(n)}</li>`
    : `<li style="margin:0 0 10px"><strong>${esc(n.title)}</strong>${n.status ? ` <span style="color:#777">(${esc(n.status)}${n.is_new ? ', new' : ''})</span>` : ''}<br>${esc(n.summary || '')}</li>`).join('')
  const watching = (s.watching_closely || []).slice(0, 6).map((w: any) => `<li style="margin:0 0 8px">${esc(typeof w === 'string' ? w : w.title || w.item || JSON.stringify(w))}</li>`).join('')
  const implications = typeof s.strategic_implications === 'string' ? s.strategic_implications : Array.isArray(s.strategic_implications) ? s.strategic_implications.map((x: any) => typeof x === 'string' ? x : x.implication || x.title || '').join('\n\n') : ''
  const summary = summaryText || (typeof s.executive_summary === 'string' ? s.executive_summary : '')
  return `<!doctype html><html><body style="margin:0;background:#F5F2EE">
  <div style="max-width:640px;margin:0 auto;padding:32px 24px;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.55;color:#1F1F1F">
    <div style="font-size:13px;color:#777">${esc(orgName)} · ${esc(date)}</div>
    <h1 style="font-size:24px;margin:6px 0 22px">Executive synthesis</h1>
    ${summary ? paras(summary) : ''}
    ${dev ? h2('Key developments') + `<ul style="padding-left:18px;margin:0">${dev}</ul>` : ''}
    ${implications ? h2('Strategic implications') + paras(implications) : ''}
    ${narratives ? h2('Narratives') + `<ul style="padding-left:18px;margin:0">${narratives}</ul>` : ''}
    ${watching ? h2('Watching closely') + `<ul style="padding-left:18px;margin:0">${watching}</ul>` : ''}
    <p style="margin:32px 0 0;font-size:13px;color:#777">Open the full brief, opportunities and NIV at <a href="https://nivria.ai/dashboard" style="color:#C75D2C">nivria.ai</a>.</p>
  </div></body></html>`
}

async function sendOne(admin: any, syn: any, to: string[]) {
  const s = syn.synthesis_data?.synthesis || {}
  // The readable version saved alongside it (same org, within a minute).
  const t = new Date(syn.created_at + 'Z').getTime()
  const { data: doc } = await admin.from('content_library').select('content, created_at').eq('organization_id', syn.organization_id)
    .eq('content_type', 'executive-summary').gte('created_at', new Date(t - 5 * 60_000).toISOString()).lte('created_at', new Date(t + 5 * 60_000).toISOString())
    .order('created_at', { ascending: false }).limit(1).maybeSingle()
  const summaryText = typeof doc?.content === 'string' ? doc.content.split(/\n#{1,3}\s/)[0].trim() : ''
  const orgName = syn.organization_name || 'Your organization'
  const html = render(orgName, syn.created_at, s, summaryText)
  const dateShort = new Date(syn.created_at + 'Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/New_York' })
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to, subject: `${orgName} executive synthesis · ${dateShort}`, html }),
  })
  const body = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(`resend ${r.status}: ${JSON.stringify(body).slice(0, 200)}`)
  await admin.from('synthesis_email_log').upsert({ synthesis_id: syn.id, organization_id: syn.organization_id, recipients: to, resend_id: body.id || null, sent_at: new Date().toISOString() })
  return body.id
}

Deno.serve(async (req) => {
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || ''
  if (role(token) !== 'service_role') return new Response('Forbidden', { status: 403 })
  const admin = createClient(SUPABASE_URL, SERVICE_KEY)
  const body = await req.json().catch(() => ({}))
  try {
    if (body.synthesis_id) {
      const { data: syn } = await admin.from('executive_synthesis').select('*').eq('id', body.synthesis_id).single()
      const { data: org } = await admin.from('organizations').select('settings').eq('id', syn.organization_id).maybeSingle()
      const to = Array.isArray(body.to) ? body.to : body.to ? [body.to] : org?.settings?.synthesis_emails || []
      if (!to.length) return new Response(JSON.stringify({ error: 'no recipients' }), { status: 400 })
      return new Response(JSON.stringify({ ok: true, sent: await sendOne(admin, syn, to) }), { headers: { 'Content-Type': 'application/json' } })
    }

    const { data: orgs } = await admin.from('organizations').select('id, settings').not('settings->synthesis_emails', 'is', null)
    const results: any[] = []
    for (const org of orgs || []) {
      const to: string[] = (org.settings?.synthesis_emails || []).filter((e: unknown) => typeof e === 'string' && e.includes('@'))
      if (!to.length) continue
      const since = new Date(Date.now() - 12 * 3600_000).toISOString().replace('Z', '')
      const { data: syns } = await admin.from('executive_synthesis').select('*').eq('organization_id', org.id).gte('created_at', since).order('created_at', { ascending: true })
      if (!syns?.length) continue
      const { data: sent } = await admin.from('synthesis_email_log').select('synthesis_id').in('synthesis_id', syns.map((x: any) => x.id))
      const done = new Set((sent || []).map((x: any) => x.synthesis_id))
      for (const syn of syns.filter((x: any) => !done.has(x.id))) {
        try { results.push({ org: org.id, synthesis: syn.id, resend: await sendOne(admin, syn, to) }) }
        catch (e) { results.push({ org: org.id, synthesis: syn.id, error: e instanceof Error ? e.message : String(e) }) }
      }
    }
    return new Response(JSON.stringify({ ok: true, results }), { headers: { 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
})
