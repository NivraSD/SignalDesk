import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!
const VOYAGE_API_KEY = Deno.env.get('VOYAGE_API_KEY')!

// ── Google Calendar Helper ───────────────────────────────────────────────────

const GOOGLE_SERVICE_ACCOUNT_JSON = Deno.env.get('GOOGLE_SERVICE_ACCOUNT')
let GOOGLE_SA: any = null
try { if (GOOGLE_SERVICE_ACCOUNT_JSON) GOOGLE_SA = JSON.parse(GOOGLE_SERVICE_ACCOUNT_JSON) } catch {}

const CALENDAR_ID = 'jl@nivria.ai'

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

export async function fetchCalendarEvents(date: string): Promise<string> {
  try {
    const accessToken = await getGoogleAccessToken()
    if (!accessToken) return ''

    const timeMin = `${date}T00:00:00Z`
    const timeMax = `${date}T23:59:59Z`
    const params = new URLSearchParams({ singleEvents: 'true', orderBy: 'startTime', timeMin, timeMax })
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDAR_ID)}/events?${params}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )
    const data = await response.json()
    const events = data.items || []
    if (events.length === 0) return ''

    const lines = events.map((e: any) => {
      const start = e.start?.dateTime ? new Date(e.start.dateTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : 'All day'
      const end = e.end?.dateTime ? new Date(e.end.dateTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : ''
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
  const [profileRes, rulesRes, checkinsRes, journalRes, activitiesRes, similarRes] = await Promise.all([
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
  ])

  const parts: string[] = []

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
        return `${c.checkin_date}: ${areas}${c.journal ? ` | "${c.journal.substring(0, 80)}"` : ''}`
      })
      .join('\n')
    parts.push(`## Recent Check-ins (last 7 days)\n${text}`)
  }

  if (journalRes.data?.length) {
    const text = journalRes.data
      .map(
        (j: { entry_type: string; entry_date: string; content: string; notes?: string }) =>
          `[${j.entry_type}] ${j.entry_date}: ${j.content.substring(0, 100)}${j.notes ? ` (note: ${j.notes.substring(0, 50)})` : ''}`
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
  model = 'claude-sonnet-4-20250514'
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
      system: systemPrompt,
      messages,
    }),
  })
  const result = await response.json()
  return result.content?.[0]?.text || ''
}
