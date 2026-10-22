// Grounded Calendar - uses Google Service Account to read/write user's calendar
// User must share their calendar with: signaldesk-api@nivria.iam.gserviceaccount.com

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const GOOGLE_SERVICE_ACCOUNT_JSON = Deno.env.get('GOOGLE_SERVICE_ACCOUNT')

// The secret is service-account JSON, but it can arrive with the private key's "\n" escapes turned into real
// newlines (set from a .env file) or base64-encoded. Accept all three instead of silently failing.
function escapeNewlinesInStrings(json: string): string {
  let out = '', inString = false, escaped = false
  for (const ch of json) {
    if (inString && (ch === '\n' || ch === '\r')) { if (ch === '\n') out += '\\n'; continue }
    out += ch
    if (escaped) escaped = false
    else if (ch === '\\') escaped = true
    else if (ch === '"') inString = !inString
  }
  return out
}

let SA_PROBLEM = 'Google service account not configured'

function parseServiceAccount(raw: string | undefined): any {
  if (!raw) return null
  const attempts = [
    () => JSON.parse(raw),
    () => JSON.parse(escapeNewlinesInStrings(raw)),
    () => JSON.parse(atob(raw.trim())),
  ]
  const keysSeen: string[] = []
  for (const attempt of attempts) {
    try {
      const sa = attempt()
      if (sa?.client_email && sa?.private_key) return sa
      if (sa && typeof sa === 'object') keysSeen.push(...Object.keys(sa))
    } catch { /* try the next format */ }
  }
  // Describe the shape (never the contents) so a bad secret can be fixed.
  SA_PROBLEM = keysSeen.length
    ? `GOOGLE_SERVICE_ACCOUNT is JSON but not a service-account key (fields: ${[...new Set(keysSeen)].join(', ')})`
    : `GOOGLE_SERVICE_ACCOUNT is not JSON (${raw.length} chars, starts with ${JSON.stringify(raw.trim()[0] ?? '')})`
  console.error(SA_PROBLEM)
  return null
}

const GOOGLE_SERVICE_ACCOUNT = parseServiceAccount(GOOGLE_SERVICE_ACCOUNT_JSON)

// Get Google access token from service account (same approach as budget bot)
async function getGoogleAccessToken(): Promise<string> {
  if (!GOOGLE_SERVICE_ACCOUNT) throw new Error('Google service account not configured')

  const now = Math.floor(Date.now() / 1000)
  const header = { alg: 'RS256', typ: 'JWT' }
  const payload = {
    iss: GOOGLE_SERVICE_ACCOUNT.client_email,
    scope: 'https://www.googleapis.com/auth/calendar',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }

  const encoder = new TextEncoder()
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  const payloadB64 = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  const unsignedToken = `${headerB64}.${payloadB64}`

  const privateKeyPem = GOOGLE_SERVICE_ACCOUNT.private_key
  const pemContents = privateKeyPem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s/g, '')
  const binaryKey = Uint8Array.from(atob(pemContents), (c: string) => c.charCodeAt(0))

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, encoder.encode(unsignedToken))
  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
  const jwt = `${unsignedToken}.${signatureB64}`

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  })

  const tokenData = await tokenResponse.json()
  if (!tokenData.access_token) {
    console.error('Token exchange failed:', tokenData)
    throw new Error(`Google token error: ${tokenData.error_description || tokenData.error || 'unknown'}`)
  }
  return tokenData.access_token
}

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    if (!GOOGLE_SERVICE_ACCOUNT) {
      return errorResponse(SA_PROBLEM, 500)
    }

    // Signed-in people only, and only their own calendar (grounded_user_settings.calendar_id).
    // Any calendarId in the request is ignored, so nobody can reach someone else's calendar.
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    const token = req.headers.get('Authorization')?.replace('Bearer ', '')
    const { data: { user } } = token ? await admin.auth.getUser(token) : { data: { user: null } }
    if (!user) return errorResponse('Not signed in', 401)
    const { data: settings } = await admin
      .from('grounded_user_settings')
      .select('calendar_id')
      .eq('user_id', user.id)
      .maybeSingle()
    if (!settings?.calendar_id) return errorResponse('No calendar connected', 400)
    const targetCalendar = settings.calendar_id

    const { action, event, timeMin, timeMax } = await req.json()
    const accessToken = await getGoogleAccessToken()

    // Get events
    if (action === 'get-events') {
      const params = new URLSearchParams({
        singleEvents: 'true',
        orderBy: 'startTime',
        ...(timeMin && { timeMin }),
        ...(timeMax && { timeMax }),
      })

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(targetCalendar)}/events?${params}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      )

      const data = await response.json()
      if (data.error) {
        return errorResponse(`Calendar API error: ${data.error.message}`, data.error.code || 400)
      }

      return jsonResponse({ items: data.items || [] })
    }

    // Create event
    if (action === 'create-event') {
      if (!event) return errorResponse('Missing event data', 400)

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(targetCalendar)}/events`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(event),
        }
      )

      const data = await response.json()
      if (data.error) {
        return errorResponse(`Calendar API error: ${data.error.message}`, data.error.code || 400)
      }

      return jsonResponse(data)
    }

    // Delete event
    if (action === 'delete-event') {
      const { eventId } = await req.json().catch(() => ({}))
      if (!event?.id && !eventId) return errorResponse('Missing event ID', 400)

      const id = eventId || event.id
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(targetCalendar)}/events/${id}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      )

      if (!response.ok && response.status !== 204) {
        const data = await response.json()
        return errorResponse(`Calendar API error: ${data.error?.message || 'Delete failed'}`, response.status)
      }

      return jsonResponse({ success: true })
    }

    return errorResponse(`Unknown action: ${action}`, 400)
  } catch (err) {
    console.error('grounded-calendar error:', err)
    return errorResponse(err.message || 'Internal error', 500)
  }
})
