// Daily: scan each organization's knowledge base for documents everyone can see that repeat details
// from restricted documents (knowledge-exposure-scan). Uploads also trigger a scan of that document.
import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export const maxDuration = 300
const CRON_SECRET = process.env.CRON_SECRET

export async function GET(request: Request) {
  if (CRON_SECRET && request.headers.get('authorization') !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const admin = createServiceClient()
  const { data: docs } = await admin.from('knowledge_documents').select('organization_id, visibility').eq('ingest_status', 'ready').neq('status', 'superseded')
  // Only orgs that have both open and restricted documents.
  const orgs = new Map<string, { open: boolean; restricted: boolean }>()
  for (const d of docs || []) {
    const o = orgs.get(d.organization_id) || { open: false, restricted: false }
    if ((d.visibility || []).includes('all')) o.open = true
    else o.restricted = true
    orgs.set(d.organization_id, o)
  }
  const results: Record<string, unknown> = {}
  for (const [orgId, o] of orgs) {
    if (!o.open || !o.restricted) continue
    const r = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/knowledge-exposure-scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}` },
      body: JSON.stringify({ organization_id: orgId }),
      signal: AbortSignal.timeout(250_000),
    }).catch((e) => ({ ok: false, status: 0, json: async () => ({ error: String(e) }) }) as any)
    results[orgId] = await r.json().catch(() => ({ status: r.status }))
  }
  return NextResponse.json({ ok: true, results })
}
