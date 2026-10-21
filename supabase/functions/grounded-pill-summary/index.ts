// Grounded: email one day's pill checks via Resend.
// POST { day: 'YYYY-MM-DD' } with the user's JWT. Sends to GROUNDED_PILL_TO_EMAIL if set, else the user's own email.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const TO_OVERRIDE = Deno.env.get('GROUNDED_PILL_TO_EMAIL')
const FROM = 'Grounded <notifications@nivria.ai>'
const TIMEZONE = 'America/New_York'

const SLOTS = ['morning', 'afternoon', 'evening', 'night'] as const
const label = (s: string) => s[0].toUpperCase() + s.slice(1)

const fmtTime = (iso: string) =>
  new Intl.DateTimeFormat('en-US', { timeZone: TIMEZONE, hour: 'numeric', minute: '2-digit' }).format(new Date(iso))
const fmtDay = (day: string) =>
  new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', weekday: 'short', month: 'short', day: 'numeric' }).format(new Date(day + 'T00:00:00Z'))
const dayOf = (iso: string) => new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE }).format(new Date(iso))

Deno.serve(async (req) => {
  const cors = handleCors(req)
  if (cors) return cors
  if (req.method !== 'POST') return errorResponse('POST only', 405)
  if (!RESEND_API_KEY) return errorResponse('RESEND_API_KEY not configured', 500)

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    const token = req.headers.get('Authorization')?.replace('Bearer ', '')
    const { data: { user }, error: authError } = token ? await supabase.auth.getUser(token) : { data: { user: null }, error: null }
    if (authError || !user) return errorResponse('Not authenticated', 401)

    const body = await req.json().catch(() => ({}))
    const day = typeof body.day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.day) && !isNaN(Date.parse(body.day))
      ? body.day
      : dayOf(new Date().toISOString())

    const { data: rows, error } = await supabase
      .from('grounded_pill_checks')
      .select('slot, taken_at')
      .eq('user_id', user.id)
      .eq('day', day)
    if (error) return errorResponse(error.message, 500)

    const checks: Record<string, string> = {}
    for (const r of rows ?? []) checks[r.slot] = r.taken_at
    const taken = SLOTS.filter((s) => checks[s]).length
    const dayLabel = fmtDay(day)
    // A dose ticked off on a later day has no meaningful time.
    const when = (s: string) => (checks[s] && dayOf(checks[s]) === day ? fmtTime(checks[s]) : '')

    const to = TO_OVERRIDE || user.email
    if (!to) return errorResponse('No recipient email', 400)

    const htmlRows = SLOTS.map((s) => `<tr>
      <td style="padding:8px 12px;border-bottom:1px solid #e7e5e4;font-weight:600">${label(s)}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e7e5e4;color:${checks[s] ? '#16a34a' : '#b4432f'}">${checks[s] ? 'Taken' : 'No log'}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e7e5e4;color:#78716c">${when(s)}</td>
    </tr>`).join('')

    const html = `<div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;max-width:480px;color:#292524">
      <h2 style="margin:0 0 4px">Pills — ${dayLabel}</h2>
      <p style="margin:0 0 16px;color:#78716c">${taken} of 4 taken</p>
      <table style="border-collapse:collapse;width:100%">${htmlRows}</table>
    </div>`

    const text = `${dayLabel}\n` + SLOTS.map((s) =>
      `${label(s)}: ${checks[s] ? 'taken' + (when(s) ? ' at ' + when(s) : '') : 'no log'}`).join('\n')

    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM, to: [to], subject: `Pills — ${dayLabel}: ${taken}/4`, html, text }),
    })
    if (!r.ok) return errorResponse(`Resend ${r.status}: ${(await r.text()).slice(0, 200)}`, 502)

    return jsonResponse({ ok: true, sentTo: to })
  } catch (e) {
    return errorResponse(e instanceof Error ? e.message : String(e), 500)
  }
})
