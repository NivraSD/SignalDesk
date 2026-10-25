// OAuth token endpoint: authorization_code (with PKCE) and refresh_token grants.
import { createServiceClient } from '@/lib/supabase/server'
import { CORS, OAuthError, corsJson, exchangeCode, oauthErrorResponse, readParams, refreshTokens } from '@/lib/advisor/oauth'

export async function POST(req: Request) {
  try {
    const p = await readParams(req)
    const admin = createServiceClient()
    if (p.grant_type === 'authorization_code') {
      return corsJson(await exchangeCode(admin, { code: p.code, client_id: p.client_id, redirect_uri: p.redirect_uri, code_verifier: p.code_verifier }))
    }
    if (p.grant_type === 'refresh_token') {
      return corsJson(await refreshTokens(admin, { refresh_token: p.refresh_token, client_id: p.client_id }))
    }
    throw new OAuthError('unsupported_grant_type', 'Use authorization_code or refresh_token')
  } catch (e) {
    return oauthErrorResponse(e)
  }
}

export const OPTIONS = () => new Response(null, { status: 204, headers: CORS })
