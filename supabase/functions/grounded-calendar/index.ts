// Grounded Calendar - uses Google Service Account to read/write user's calendar
// User must share their calendar with: signaldesk-api@nivria.iam.gserviceaccount.com

import { corsHeaders, handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts'

const GOOGLE_SERVICE_ACCOUNT_JSON = Deno.env.get('GOOGLE_SERVICE_ACCOUNT')
let GOOGLE_SERVICE_ACCOUNT: any = null
try {
  if (GOOGLE_SERVICE_ACCOUNT_JSON) {
    GOOGLE_SERVICE_ACCOUNT = JSON.parse(GOOGLE_SERVICE_ACCOUNT_JSON)
  }
} catch (e) {
  console.error('Failed to parse GOOGLE_SERVICE_ACCOUNT:', e)
}

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
      return errorResponse('Google service account not configured', 500)
    }

    const { action, calendarId, event, timeMin, timeMax } = await req.json()
    const targetCalendar = calendarId || 'primary'
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
