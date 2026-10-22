// Grounded Calendar - uses Google Service Account to read/write user's calendar
// User must share their calendar with: signaldesk-api@nivria.iam.gserviceaccount.com

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const GOOGLE_SERVICE_ACCOUNT_JSON = Deno.env.get('GOOGLE_SERVICE_ACCOUNT')
// "Sign in with Google" (OAuth). Unset = only the sharing method is offered.
const OAUTH_CLIENT_ID = Deno.env.get('GOOGLE_OAUTH_CLIENT_ID')
const OAUTH_CLIENT_SECRET = Deno.env.get('GOOGLE_OAUTH_CLIENT_SECRET')
const OAUTH_SCOPES = 'openid email https://www.googleapis.com/auth/calendar.events'
// Where Google may send people back to (must also be listed on the Google OAuth client).
const OAUTH_REDIRECTS = ['https://www.groundedproject.app/oauth/google', 'https://grounded-sepia.vercel.app/oauth/google', 'http://localhost:5173/oauth/google']

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
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    const body = await req.json()
    const { action, event, timeMin, timeMax } = body

    // ── Google sign-in, step 2: Google sent the person back with a code ──
    // No Grounded session needed here: on an iPhone home-screen app, Google's page opens in a separate
    // browser view that isn't signed in. The one-time `state` (made in step 1 for a signed-in person)
    // says whose calendar this is.
    if (action === 'oauth-exchange') {
      if (!OAUTH_CLIENT_ID || !OAUTH_CLIENT_SECRET) return errorResponse('Google sign-in is not set up', 400)
      const { code, state, redirectUri } = body
      if (!code || !state || !OAUTH_REDIRECTS.includes(redirectUri)) return errorResponse('Bad request', 400)
      const { data: st } = await admin.from('grounded_oauth_states').delete().eq('nonce', String(state)).select().maybeSingle()
      if (!st || Date.now() - new Date(st.created_at).getTime() > 15 * 60 * 1000) {
        return errorResponse('That sign-in link expired. Start again from Grounded.', 400)
      }
      const tr = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ code, client_id: OAUTH_CLIENT_ID, client_secret: OAUTH_CLIENT_SECRET, redirect_uri: redirectUri, grant_type: 'authorization_code' }),
      })
      const tokens = await tr.json()
      if (tokens.error) return errorResponse(`Google: ${tokens.error_description || tokens.error}`, 400)
      if (!String(tokens.scope || '').includes('calendar.events')) {
        return errorResponse('Grounded needs permission to add events. Try again and leave the calendar box ticked.', 400)
      }
      // The id_token comes straight from Google over TLS, so its claims can be read without re-verifying.
      let googleEmail: string | null = null
      try {
        googleEmail = JSON.parse(atob(tokens.id_token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).email ?? null
      } catch { /* email is display-only */ }
      const { data: prev } = await admin.from('grounded_google_tokens').select('refresh_token').eq('user_id', st.user_id).maybeSingle()
      const refresh = tokens.refresh_token || prev?.refresh_token
      if (!refresh) return errorResponse('Google did not grant offline access. Try again.', 400)
      const { error: e1 } = await admin.from('grounded_google_tokens').upsert({
        user_id: st.user_id,
        access_token: tokens.access_token,
        refresh_token: refresh,
        expires_at: new Date(Date.now() + (tokens.expires_in - 60) * 1000).toISOString(),
        scope: tokens.scope,
        google_email: googleEmail,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })
      if (e1) return errorResponse(e1.message, 500)
      const { error: e2 } = await admin.from('grounded_user_settings')
        .upsert({ user_id: st.user_id, calendar_id: googleEmail || 'primary' }, { onConflict: 'user_id' })
      if (e2) return errorResponse(e2.message, 500)
      return jsonResponse({ connected: true, calendarId: googleEmail, returnTo: st.return_to })
    }

    // Everything else: signed-in people only, and only their own calendar. Any calendarId in the
    // request is ignored, so nobody can reach someone else's calendar.
    const token = req.headers.get('Authorization')?.replace('Bearer ', '')
    const { data: { user } } = token ? await admin.auth.getUser(token) : { data: { user: null } }
    if (!user) return errorResponse('Not signed in', 401)

    // What the connect screen can offer.
    if (action === 'connect-options') {
      return jsonResponse({ google: !!(OAUTH_CLIENT_ID && OAUTH_CLIENT_SECRET), sharing: !!GOOGLE_SERVICE_ACCOUNT })
    }

    // ── Google sign-in, step 1: a one-time state for this person, and the Google URL to open ──
    if (action === 'oauth-start') {
      if (!OAUTH_CLIENT_ID || !OAUTH_CLIENT_SECRET) return errorResponse('Google sign-in is not set up', 400)
      const { redirectUri, returnTo } = body
      if (!OAUTH_REDIRECTS.includes(redirectUri)) return errorResponse('Bad redirect', 400)
      const nonce = crypto.randomUUID() + crypto.randomUUID().replace(/-/g, '')
      await admin.from('grounded_oauth_states').delete().lt('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())
      const { error } = await admin.from('grounded_oauth_states').insert({
        nonce,
        user_id: user.id,
        return_to: typeof returnTo === 'string' && returnTo.startsWith('/') ? returnTo : '/settings',
      })
      if (error) return errorResponse(error.message, 500)
      const params = new URLSearchParams({
        client_id: OAUTH_CLIENT_ID,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: OAUTH_SCOPES,
        access_type: 'offline',
        prompt: 'consent',
        include_granted_scopes: 'true',
        state: nonce,
        ...(user.email && { login_hint: user.email }),
      })
      return jsonResponse({ url: `https://accounts.google.com/o/oauth2/v2/auth?${params}` })
    }

    // ── Sharing method: link the calendar shared with Grounded's service account ──
    // Only the calendar matching the person's own login email, and only if nobody else has it,
    // because the service account can open every calendar shared with it.
    if (action === 'connect') {
      if (!GOOGLE_SERVICE_ACCOUNT) return errorResponse(SA_PROBLEM, 500)
      const email = (user.email || '').trim().toLowerCase()
      const requested = String(body.calendarId || email).trim().toLowerCase()
      if (!email || requested !== email) {
        return errorResponse('You can connect the calendar for your Grounded login email only.', 403)
      }
      const { data: claimed } = await admin
        .from('grounded_user_settings')
        .select('user_id')
        .eq('calendar_id', requested)
        .neq('user_id', user.id)
        .limit(1)
      if (claimed?.length) return errorResponse('That calendar is already connected to another account.', 409)

      const probeToken = await getGoogleAccessToken()
      const probe = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(requested)}/events?maxResults=1`,
        { headers: { Authorization: `Bearer ${probeToken}` } }
      )
      if (!probe.ok) {
        return errorResponse(
          `Grounded can't see that calendar yet. Share it with ${GOOGLE_SERVICE_ACCOUNT.client_email} ("Make changes to events"), then try again.`,
          400
        )
      }
      await admin.from('grounded_google_tokens').delete().eq('user_id', user.id)
      const { error } = await admin
        .from('grounded_user_settings')
        .upsert({ user_id: user.id, calendar_id: requested }, { onConflict: 'user_id' })
      if (error) return errorResponse(error.message, 500)
      return jsonResponse({ connected: true, calendarId: requested })
    }

    if (action === 'disconnect') {
      const { data: tok } = await admin.from('grounded_google_tokens').select('refresh_token').eq('user_id', user.id).maybeSingle()
      if (tok?.refresh_token) {
        await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(tok.refresh_token)}`, { method: 'POST' }).catch(() => {})
      }
      await admin.from('grounded_google_tokens').delete().eq('user_id', user.id)
      const { error } = await admin.from('grounded_user_settings').update({ calendar_id: null }).eq('user_id', user.id)
      if (error) return errorResponse(error.message, 500)
      return jsonResponse({ connected: false })
    }

    // The address to share with (for the setup screen); no calendar needed yet.
    if (action === 'share-address') {
      if (!GOOGLE_SERVICE_ACCOUNT) return errorResponse(SA_PROBLEM, 500)
      return jsonResponse({ serviceAccount: GOOGLE_SERVICE_ACCOUNT.client_email, email: user.email })
    }

    const { data: settings } = await admin
      .from('grounded_user_settings')
      .select('calendar_id')
      .eq('user_id', user.id)
      .maybeSingle()
    if (!settings?.calendar_id) return errorResponse('No calendar connected', 400)

    // Signed in with Google: their own token, their primary calendar. Otherwise the shared calendar
    // through the service account.
    let accessToken: string
    let targetCalendar: string
    const { data: tok } = await admin.from('grounded_google_tokens').select('*').eq('user_id', user.id).maybeSingle()
    if (tok) {
      targetCalendar = 'primary'
      if (new Date(tok.expires_at).getTime() > Date.now()) {
        accessToken = tok.access_token
      } else {
        const rr = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ refresh_token: tok.refresh_token, client_id: OAUTH_CLIENT_ID!, client_secret: OAUTH_CLIENT_SECRET!, grant_type: 'refresh_token' }),
        })
        const fresh = await rr.json()
        if (fresh.error) {
          // Access was revoked at Google (or expired): disconnect so the app offers Connect again.
          if (fresh.error === 'invalid_grant') {
            await admin.from('grounded_google_tokens').delete().eq('user_id', user.id)
            await admin.from('grounded_user_settings').update({ calendar_id: null }).eq('user_id', user.id)
          }
          return errorResponse('Google Calendar needs reconnecting (Settings → Google Calendar).', 401)
        }
        accessToken = fresh.access_token
        await admin.from('grounded_google_tokens').update({
          access_token: fresh.access_token,
          expires_at: new Date(Date.now() + (fresh.expires_in - 60) * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        }).eq('user_id', user.id)
      }
    } else {
      if (!GOOGLE_SERVICE_ACCOUNT) return errorResponse(SA_PROBLEM, 500)
      targetCalendar = settings.calendar_id
      accessToken = await getGoogleAccessToken()
    }

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
      const { eventId } = body
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
