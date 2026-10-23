import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!
const VOYAGE_API_KEY = Deno.env.get('VOYAGE_API_KEY')!

// ── Google Calendar Helper ───────────────────────────────────────────────────

const GOOGLE_SERVICE_ACCOUNT_JSON = Deno.env.get('GOOGLE_SERVICE_ACCOUNT')
let GOOGLE_SA: any = null
try { if (GOOGLE_SERVICE_ACCOUNT_JSON) GOOGLE_SA = JSON.parse(GOOGLE_SERVICE_ACCOUNT_JSON) } catch {}


async function getGoogleAccessToken(): Promise<string | null> {
  if (!GOOGLE_SA) return null
  const now = Math.floor(Date.now() / 1000)
  const header = { alg: 'RS256', typ: 'JWT' }
  const payload = {
    iss: GOOGLE_SA.client_email,
    scope: 'https://www.googleapis.com/auth/calendar.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }
  const encoder = new TextEncoder()
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  const payloadB64 = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  const unsignedToken = `${headerB64}.${payloadB64}`

  const pemContents = GOOGLE_SA.private_key.replace(/-----BEGIN PRIVATE KEY-----/, '').replace(/-----END PRIVATE KEY-----/, '').replace(/\s/g, '')
  const binaryKey = Uint8Array.from(atob(pemContents), (c: string) => c.charCodeAt(0))
  const cryptoKey = await crypto.subtle.importKey('pkcs8', binaryKey, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign'])
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, encoder.encode(unsignedToken))
  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  const jwt = `${unsignedToken}.${signatureB64}`

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  })
  const tokenData = await tokenResponse.json()
  return tokenData.access_token || null
}

// The person's own calendar (grounded_user_settings.calendar_id); nothing if they haven't connected one.
// ── Dates ────────────────────────────────────────────────────────────────────
// Everything the companion sees about time is in the person's zone (Eastern for now), with today's
// date stated outright and past dates labeled relative to it, so it never has to guess.

export const TIMEZONE = 'America/New_York'

export const dayISO = (d: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE }).format(d)
// Today / tomorrow as YYYY-MM-DD in TIMEZONE (not UTC, which flips at 8pm Eastern).
export const todayISO = () => dayISO(new Date())
export const shiftISO = (iso: string, n: number) => new Date(Date.parse(iso + 'T12:00:00Z') + n * 86400000).toISOString().slice(0, 10)

// "Friday, October 23, 2026, 7:55 AM"
export function nowInWords(): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE, weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  }).format(new Date())
}

// "2026-10-21 (Wednesday, 2 days ago)"
export function labelDay(iso: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso
  const diff = Math.round((Date.parse(iso + 'T00:00:00Z') - Date.parse(dayISO(new Date()) + 'T00:00:00Z')) / 86400000)
  const weekday = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', weekday: 'long' }).format(new Date(iso + 'T00:00:00Z'))
  const rel = diff === 0 ? 'today' : diff === -1 ? 'yesterday' : diff === 1 ? 'tomorrow' : diff < 0 ? `${-diff} days ago` : `in ${diff} days`
  return `${iso} (${weekday}, ${rel})`
}

// Midnight-to-midnight of a YYYY-MM-DD day in TIMEZONE, as ISO instants.
function dayBounds(date: string): { timeMin: string; timeMax: string } {
  const offsetAt = (iso: string) =>
    new Intl.DateTimeFormat('en-US', { timeZone: TIMEZONE, timeZoneName: 'longOffset' })
      .formatToParts(new Date(iso + 'T12:00:00Z')).find((p) => p.type === 'timeZoneName')?.value.replace('GMT', '') || '-05:00'
  const start = new Date(`${date}T00:00:00${offsetAt(date)}`)
  return { timeMin: start.toISOString(), timeMax: new Date(start.getTime() + 24 * 3600 * 1000 - 1000).toISOString() }
}

export async function fetchCalendarEvents(date: string, userId: string): Promise<string> {
  try {
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const { data: settings } = await admin
      .from('grounded_user_settings')
      .select('calendar_id')
      .eq('user_id', userId)
      .maybeSingle()
    const calendarId = settings?.calendar_id
    if (!calendarId) return ''

    const accessToken = await getGoogleAccessToken()
    if (!accessToken) return ''

    const { timeMin, timeMax } = dayBounds(date)
    const params = new URLSearchParams({ singleEvents: 'true', orderBy: 'startTime', timeMin, timeMax })
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )
    const data = await response.json()
    const events = data.items || []
    if (events.length === 0) return ''

    const lines = events.map((e: any) => {
      const fmt = (t: string) => new Date(t).toLocaleTimeString('en-US', { timeZone: TIMEZONE, hour: 'numeric', minute: '2-digit', hour12: true })
      const start = e.start?.dateTime ? fmt(e.start.dateTime) : 'All day'
      const end = e.end?.dateTime ? fmt(e.end.dateTime) : ''
      return `- ${start}${end ? ` – ${end}` : ''}: ${e.summary || '(no title)'}`
    })
    return lines.join('\n')
  } catch (e) {
    console.error('Calendar fetch failed:', e)
    return ''
  }
}

// ── Embedding Helpers ────────────────────────────────────────────────────────

export async function getEmbedding(text: string): Promise<number[]> {
  const resp = await fetch('https://api.voyageai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${VOYAGE_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'voyage-3-large',
      input: [text.substring(0, 32000)],
      input_type: 'query',
    }),
  })
  if (!resp.ok) throw new Error(`Voyage API error: ${resp.status}`)
  const data = await resp.json()
  return data.data[0].embedding
}

export async function embedAndStore(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  contentType: string,
  contentId: string,
  text: string
) {
  try {
    const embedding = await getEmbedding(text)
    await supabase.from('grounded_embeddings').insert({
      user_id: userId,
      content_type: contentType,
      content_id: contentId,
      content_text: text.substring(0, 2000),
      embedding: `[${embedding.join(',')}]`,
    })
  } catch (e) {
    console.error('Embed failed:', e)
  }
}

export async function searchSimilar(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  queryText: string,
  limit = 5
) {
  try {
    const embedding = await getEmbedding(queryText)
    const { data } = await supabase.rpc('grounded_match_embeddings', {
      query_embedding: `[${embedding.join(',')}]`,
      match_user_id: userId,
      match_count: limit,
      match_threshold: 0.3,
    })
    return data || []
  } catch (e) {
    console.error('Similarity search failed:', e)
    return []
  }
}

// ── Context Loading ──────────────────────────────────────────────────────────

export async function loadContext(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  queryText?: string
) {
  const [profileRes, rulesRes, checkinsRes, journalRes, activitiesRes, similarRes, settingsRes, storyRes] = await Promise.all([
    supabase
      .from('grounded_user_profile')
      .select('profile_context, patterns')
      .eq('user_id', userId)
      .single(),
    supabase
      .from('grounded_user_rules')
      .select('rule_text, category')
      .eq('user_id', userId)
      .eq('is_active', true),
    supabase
      .from('grounded_checkins')
      .select('checkin_date, areas, journal, tomorrow_schedule')
      .eq('user_id', userId)
      .order('checkin_date', { ascending: false })
      .limit(7),
    supabase
      .from('grounded_journal_entries')
      .select('entry_type, content, entry_date, entry_time, notes, completion_notes')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(15),
    supabase
      .from('grounded_activities')
      .select('area_id, name')
      .eq('user_id', userId),
    queryText ? searchSimilar(supabase, userId, queryText, 5) : Promise.resolve([]),
    supabase
      .from('grounded_user_settings')
      .select('display_name, areas')
      .eq('user_id', userId)
      .maybeSingle(),
    supabase
      .from('grounded_user_story')
      .select('section, content')
      .eq('user_id', userId),
  ])

  const parts: string[] = []
  parts.push(`## Right now\nIt is ${nowInWords()} (Eastern time). Today is ${dayISO(new Date())}.`)

  // Who they are, in their own words (About you). This outranks anything inferred below.
  const STORY_TITLES: Record<string, string> = {
    people: 'People in their life', life: 'Life right now', working_with: "What they're working with",
    hard: "What's hard", events: 'Key events', helps: 'What helps',
  }
  const name = settingsRes.data?.display_name
  const story = (storyRes.data || []).filter((s: { content: string }) => s.content?.trim())
  if (name || story.length) {
    parts.push(
      `## About them (in their own words — trust this over anything inferred)
` +
        (name ? `Call them: ${name}\n` : '') +
        story.map((s: { section: string; content: string }) => `### ${STORY_TITLES[s.section] || s.section}\n${s.content.trim()}`).join('\n\n')
    )
  }

  const areas = (settingsRes.data?.areas as { id: string; name: string; description?: string; enabled?: boolean }[] | null)
    ?.filter((a) => a.enabled !== false)
  if (areas?.length) {
    parts.push(`## Their life areas (check-ins are keyed by these ids)
${areas.map((a) => `- ${a.id} = "${a.name}"${a.description ? `: ${a.description}` : ''}`).join('\n')}`)
  }

  if (profileRes.data?.profile_context) {
    parts.push(`## User Profile\n${profileRes.data.profile_context}`)
  }

  if (rulesRes.data?.length) {
    parts.push(
      `## User's Rules & Preferences\n${rulesRes.data.map((r: { rule_text: string }) => `- ${r.rule_text}`).join('\n')}`
    )
  }

  if (checkinsRes.data?.length) {
    const text = checkinsRes.data
      .map((c: { checkin_date: string; areas: Record<string, { score?: number }>; journal?: string }) => {
        const areas = Object.entries(c.areas || {})
          .map(([id, d]) => `${id}: ${d.score || '?'}/5`)
          .join(', ')
        return `${labelDay(c.checkin_date)}: ${areas}${c.journal ? ` | "${c.journal.substring(0, 80)}"` : ''}`
      })
      .join('\n')
    parts.push(`## Recent Check-ins (last 7 days)\n${text}`)
  }

  if (journalRes.data?.length) {
    const text = journalRes.data
      .map(
        (j: { entry_type: string; entry_date: string; content: string; notes?: string }) =>
          `[${j.entry_type}] ${labelDay(j.entry_date)}: ${j.content.substring(0, 100)}${j.notes ? ` (note: ${j.notes.substring(0, 50)})` : ''}`
      )
      .join('\n')
    parts.push(`## Recent Journal Entries\n${text}`)
  }

  if (activitiesRes.data?.length) {
    const byArea: Record<string, string[]> = {}
    for (const a of activitiesRes.data) {
      if (!byArea[a.area_id]) byArea[a.area_id] = []
      byArea[a.area_id].push(a.name)
    }
    const text = Object.entries(byArea)
      .map(([area, acts]) => `- ${area}: ${acts.join(', ')}`)
      .join('\n')
    parts.push(`## Activity Bank (activities they value)\n${text}`)
  }

  if (similarRes.length) {
    parts.push(
      `## Relevant Past Context (from memory)\n${similarRes.map((r: { content_text: string }) => r.content_text.substring(0, 200)).join('\n---\n')}`
    )
  }

  return parts.join('\n\n')
}

// ── Claude API ───────────────────────────────────────────────────────────────

export async function callClaude(
  systemPrompt: string,
  messages: { role: string; content: string }[],
  maxTokens = 800,
  model = 'claude-sonnet-5'
) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      // Sonnet 5 runs adaptive thinking when `thinking` is omitted, and
      // max_tokens caps thinking + reply together — at 800 that truncates.
      thinking: { type: 'disabled' },
      system: systemPrompt,
      messages,
    }),
  })
  const result = await response.json()
  return result.content?.[0]?.text || ''
}
