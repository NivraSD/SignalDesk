// NIV knowledge base: permission-aware semantic search over a company's documents.
//   POST { organization_id, user_id, query, limit?, include_superseded? }  (service role only;
//   the caller has already verified user_id is signed in and a member of organization_id)
// Returns passages the person may see, with document/section/page for citations. Current
// documents rank ahead of superseded ones; superseded hits are returned flagged.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const VOYAGE_API_KEY = Deno.env.get('VOYAGE_API_KEY')!

function role(token: string): string | null {
  try { return JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).role ?? null } catch { return null }
}

Deno.serve(async (req) => {
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || ''
  if (role(token) !== 'service_role') return new Response('Forbidden', { status: 403 })
  const { organization_id, user_id, query, limit = 10, include_superseded = true } = await req.json().catch(() => ({}))
  if (!organization_id || !user_id || !query) return new Response(JSON.stringify({ error: 'organization_id, user_id, query required' }), { status: 400 })

  const r = await fetch('https://api.voyageai.com/v1/embeddings', {
    method: 'POST',
    headers: { Authorization: `Bearer ${VOYAGE_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'voyage-3-large', input: [String(query).slice(0, 2000)], input_type: 'query' }),
  })
  if (!r.ok) return new Response(JSON.stringify({ error: `embedding failed ${r.status}` }), { status: 502 })
  const vector = (await r.json()).data[0].embedding

  const admin = createClient(SUPABASE_URL, SERVICE_KEY)
  const { data, error } = await admin.rpc('match_knowledge', {
    p_org: organization_id, p_user: user_id, query_embedding: JSON.stringify(vector),
    match_count: Math.min(Math.max(Number(limit) || 10, 1), 25), include_superseded,
  })
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  return new Response(JSON.stringify({ results: data }), { headers: { 'Content-Type': 'application/json' } })
})
