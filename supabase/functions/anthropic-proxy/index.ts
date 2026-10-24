// Server-only pass-through to the Anthropic Messages API using the ANTHROPIC_API_KEY secret held
// in Supabase, so Vercel routes (the NIV advisor) don't need their own copy of the key.
// Only accepts the project's service-role JWT: browsers and the anon key are refused.
// The Anthropic SDK is pointed here with baseURL = <SUPABASE_URL>/functions/v1/anthropic-proxy,
// so requests arrive as POST .../anthropic-proxy/v1/messages.

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!

function role(token: string): string | null {
  try {
    return JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).role ?? null
  } catch {
    return null
  }
}

Deno.serve(async (req) => {
  // verify_jwt (on by default) has already checked the signature; require the service role.
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || ''
  if (role(token) !== 'service_role') return new Response('Forbidden', { status: 403 })

  const path = new URL(req.url).pathname.replace(/^.*\/anthropic-proxy/, '')
  if (req.method !== 'POST' || path !== '/v1/messages') return new Response('Not found', { status: 404 })

  const headers: Record<string, string> = {
    'content-type': 'application/json',
    'x-api-key': ANTHROPIC_API_KEY,
    'anthropic-version': req.headers.get('anthropic-version') || '2023-06-01',
  }
  const beta = req.headers.get('anthropic-beta')
  if (beta) headers['anthropic-beta'] = beta

  const upstream = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers, body: await req.text() })
  return new Response(upstream.body, {
    status: upstream.status,
    headers: { 'content-type': upstream.headers.get('content-type') || 'application/json', 'request-id': upstream.headers.get('request-id') || '' },
  })
})
