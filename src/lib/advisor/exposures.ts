// Content exposure flags (supabase/migrations/20261027_knowledge_exposures.sql): passages in
// documents everyone can see that repeat specific facts from restricted documents. NIV withholds
// the ones that look accidental from people who can't see the restricted source, and tells
// owners/admins about all of them so they can fix the document or mark the flag fine.
import type { Admin } from './data'

const WITHHELD = (owner?: string | null) =>
  `[Withheld: this part repeats details that are restricted to certain teams.${owner ? ` Ask the document owner (${owner}) if you need it.` : ''}]`

async function viewer(admin: Admin, orgId: string, userId: string) {
  const { data } = await admin.from('org_users').select('role, teams').eq('organization_id', orgId).eq('user_id', userId).maybeSingle()
  return { privileged: data?.role === 'owner' || data?.role === 'admin', teams: (data?.teams || []) as string[] }
}

// Open, accidental-looking flags on these open documents whose restricted source this person can't see.
async function blockedFlags(admin: Admin, orgId: string, userId: string, openDocIds: string[]) {
  if (!openDocIds.length) return []
  const me = await viewer(admin, orgId, userId)
  if (me.privileged) return []
  const { data: flags } = await admin
    .from('knowledge_exposures')
    .select('id, open_document_id, open_chunk_id, restricted_document_id, knowledge_documents!knowledge_exposures_restricted_document_id_fkey(visibility), open_doc:knowledge_documents!knowledge_exposures_open_document_id_fkey(owner)')
    .eq('organization_id', orgId)
    .eq('status', 'open')
    .eq('likely_intentional', false)
    .in('open_document_id', openDocIds)
  return (flags || []).filter((f: any) => {
    const vis: string[] = f.knowledge_documents?.visibility || []
    return !vis.includes('all') && !vis.some((t) => me.teams.includes(t))
  }).map((f: any) => ({ chunkId: f.open_chunk_id as string | null, docId: f.open_document_id as string, owner: f.open_doc?.owner as string | null }))
}

// Search results / document chunks: replace withheld passages' text.
export async function guardPassages<T extends { content: string }>(admin: Admin, orgId: string, userId: string, rows: T[], ids: (r: T) => { chunkId?: string; docId?: string }) {
  const docIds = [...new Set(rows.map((r) => ids(r).docId).filter(Boolean) as string[])]
  const blocked = await blockedFlags(admin, orgId, userId, docIds)
  if (!blocked.length) return rows
  const byChunk = new Map(blocked.filter((b) => b.chunkId).map((b) => [b.chunkId!, b]))
  return rows.map((r) => {
    const b = byChunk.get(ids(r).chunkId || '')
    return b ? { ...r, content: WITHHELD(b.owner) } : r
  })
}

// Memory Vault copies of open company documents: a redactor that cuts withheld passages out of
// their text (one lookup for many documents).
export async function vaultRedactor(admin: Admin, orgId: string, userId: string, knowledgeDocIds: (string | undefined)[]) {
  const ids = [...new Set(knowledgeDocIds.filter(Boolean) as string[])]
  const blocked = (await blockedFlags(admin, orgId, userId, ids)).filter((b) => b.chunkId)
  const byDoc = new Map<string, { content: string; owner: string | null }[]>()
  if (blocked.length) {
    const { data: chunks } = await admin.from('knowledge_chunks').select('id, document_id, content').in('id', blocked.map((b) => b.chunkId!))
    for (const c of chunks || []) {
      const b = blocked.find((x) => x.chunkId === c.id)!
      byDoc.set(c.document_id, [...(byDoc.get(c.document_id) || []), { content: c.content, owner: b.owner }])
    }
  }
  return (docId: string | undefined, text: string) => {
    let out = text
    for (const c of (docId && byDoc.get(docId)) || []) out = out.split(c.content).join(WITHHELD(c.owner))
    return out
  }
}

// For owners/admins: what's open, in a few lines for NIV.
export async function exposureBrief(admin: Admin, orgId: string) {
  const { data } = await admin
    .from('knowledge_exposures')
    .select('id, facts, likely_intentional, detected_at, open_chunk:knowledge_chunks!knowledge_exposures_open_chunk_id_fkey(section, page), open_doc:knowledge_documents!knowledge_exposures_open_document_id_fkey(title, owner), restricted_doc:knowledge_documents!knowledge_exposures_restricted_document_id_fkey(title, visibility)')
    .eq('organization_id', orgId)
    .eq('status', 'open')
    .order('likely_intentional', { ascending: true })
    .order('detected_at', { ascending: false })
    .limit(8)
  return (data || []).map((f: any) =>
    `- [${f.id}] "${f.open_doc?.title}"${f.open_chunk?.section ? ` › ${f.open_chunk.section}` : ''} (visible to everyone; owner ${f.open_doc?.owner || 'unknown'}) repeats ${f.facts?.join(', ') || 'details'} from "${f.restricted_doc?.title}" (restricted to ${(f.restricted_doc?.visibility || []).join(', ')}). ${f.likely_intentional ? 'Looks deliberate (a leadership update to all staff); not withheld.' : 'Looks accidental; withheld from people outside those teams until reviewed.'}`
  )
}

export async function dismissExposure(admin: Admin, orgId: string, userId: string, id: string) {
  const me = await viewer(admin, orgId, userId)
  if (!me.privileged) return 'Only owners and admins can review these.'
  const { data } = await admin.from('knowledge_exposures').update({ status: 'dismissed', reviewed_by: userId, reviewed_at: new Date().toISOString() })
    .eq('id', id).eq('organization_id', orgId).eq('status', 'open').select('id').maybeSingle()
  return data ? 'Marked as fine. It will no longer be flagged or withheld (unless that passage changes).' : 'No open flag with that id.'
}
