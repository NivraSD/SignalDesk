// Dynamic Client Registration (RFC 7591) for NIV's MCP server. Public clients only (PKCE).
import { createServiceClient } from '@/lib/supabase/server'
import { CORS, OAuthError, corsJson, oauthErrorResponse, registerClient } from '@/lib/advisor/oauth'

const MAX_PER_HOUR = 500

export async function POST(req: Request) {
  try {
    const admin = createServiceClient()
    const since = new Date(Date.now() - 3600 * 1000).toISOString()
    const { count } = await admin.from('niv_oauth_clients').select('client_id', { count: 'exact', head: true }).eq('kind', 'dcr').gte('created_at', since)
    if ((count ?? 0) >= MAX_PER_HOUR) throw new OAuthError('temporarily_unavailable', 'Too many registrations. Try again later.', 429)
    const body = await req.json().catch(() => null)
    if (!body || typeof body !== 'object') throw new OAuthError('invalid_client_metadata', 'Expected a JSON body')
    const c = await registerClient(admin, body)
    return corsJson({
      client_id: c.client_id,
      client_id_issued_at: Math.floor(Date.now() / 1000),
      client_name: c.client_name,
      redirect_uris: c.redirect_uris,
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
      token_endpoint_auth_method: 'none',
      ...(c.client_uri && { client_uri: c.client_uri }),
      ...(c.logo_uri && { logo_uri: c.logo_uri }),
    }, 201)
  } catch (e) {
    return oauthErrorResponse(e)
  }
}

export const OPTIONS = () => new Response(null, { status: 204, headers: CORS })
