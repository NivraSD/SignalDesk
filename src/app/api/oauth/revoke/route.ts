// OAuth token revocation (RFC 7009): either token ends that app's connection.
import { createServiceClient } from '@/lib/supabase/server'
import { CORS, oauthErrorResponse, readParams, revokeToken } from '@/lib/advisor/oauth'

export async function POST(req: Request) {
  try {
    const p = await readParams(req)
    await revokeToken(createServiceClient(), p.token)
    return new Response(null, { status: 200, headers: CORS })
  } catch (e) {
    return oauthErrorResponse(e)
  }
}

export const OPTIONS = () => new Response(null, { status: 204, headers: CORS })
