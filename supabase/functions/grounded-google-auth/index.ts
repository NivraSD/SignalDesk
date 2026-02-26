import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const GOOGLE_CLIENT_ID = '828236259059-shci1jksn3aa1qd49gb7vji060ja99e3.apps.googleusercontent.com'
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_OAUTH_CLIENT_SECRET')!

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    // Verify JWT and get user
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return errorResponse('Missing authorization header', 401)

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    const token = authHeader.replace('Bearer ', '')

    // Verify the user's JWT
    const { data: { user }, error: authError } = await createClient(
      SUPABASE_URL,
      Deno.env.get('SUPABASE_ANON_KEY') || SUPABASE_SERVICE_KEY
    ).auth.getUser(token)

    if (authError || !user) return errorResponse('Unauthorized', 401)

    const { action, code, redirect_uri } = await req.json()

    // Exchange authorization code for tokens
    if (action === 'exchange') {
      if (!code || !redirect_uri) return errorResponse('Missing code or redirect_uri', 400)

      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          redirect_uri,
          grant_type: 'authorization_code',
        }),
      })

      const tokens = await tokenResponse.json()
      if (tokens.error) return errorResponse(`Google OAuth error: ${tokens.error_description || tokens.error}`, 400)

      // Store tokens in DB
      const { error: upsertError } = await supabase
        .from('grounded_google_tokens')
        .upsert({
          user_id: user.id,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
          scope: tokens.scope || '',
        }, { onConflict: 'user_id' })

      if (upsertError) return errorResponse(`DB error: ${upsertError.message}`, 500)

      // Update user settings
      await supabase
        .from('grounded_user_settings')
        .upsert({
          user_id: user.id,
          google_calendar_enabled: true,
        }, { onConflict: 'user_id' })

      return jsonResponse({
        access_token: tokens.access_token,
        expires_in: tokens.expires_in,
      })
    }

    // Refresh access token
    if (action === 'refresh') {
      const { data: tokenRecord, error: fetchError } = await supabase
        .from('grounded_google_tokens')
        .select('refresh_token')
        .eq('user_id', user.id)
        .single()

      if (fetchError || !tokenRecord) return errorResponse('No Google tokens found', 404)

      const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          refresh_token: tokenRecord.refresh_token,
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          grant_type: 'refresh_token',
        }),
      })

      const newTokens = await refreshResponse.json()
      if (newTokens.error) return errorResponse(`Refresh error: ${newTokens.error_description || newTokens.error}`, 400)

      // Update stored token
      await supabase
        .from('grounded_google_tokens')
        .update({
          access_token: newTokens.access_token,
          expires_at: new Date(Date.now() + newTokens.expires_in * 1000).toISOString(),
        })
        .eq('user_id', user.id)

      return jsonResponse({
        access_token: newTokens.access_token,
        expires_in: newTokens.expires_in,
      })
    }

    // Disconnect / revoke
    if (action === 'disconnect') {
      const { data: tokenRecord } = await supabase
        .from('grounded_google_tokens')
        .select('access_token')
        .eq('user_id', user.id)
        .single()

      // Revoke token with Google
      if (tokenRecord?.access_token) {
        await fetch(`https://oauth2.googleapis.com/revoke?token=${tokenRecord.access_token}`, {
          method: 'POST',
        })
      }

      // Delete tokens from DB
      await supabase.from('grounded_google_tokens').delete().eq('user_id', user.id)

      // Update settings
      await supabase
        .from('grounded_user_settings')
        .update({ google_calendar_enabled: false })
        .eq('user_id', user.id)

      return jsonResponse({ success: true })
    }

    return errorResponse(`Unknown action: ${action}`, 400)
  } catch (err) {
    console.error('grounded-google-auth error:', err)
    return errorResponse(err.message || 'Internal error', 500)
  }
})
