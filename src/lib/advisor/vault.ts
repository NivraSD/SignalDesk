// The Memory Vault (content_library) for NIV and the MCP server: keyword search, read, and save.
// Restricted company documents are visible only to their teams (and owners/admins).
import type { Admin } from './data'
import { vaultRedactor } from './exposures'

export type VaultHit = { id: string; title: string; folder: string | null; type: string; updated_at: string; snippet: string }

async function teamsOf(admin: Admin, organizationId: string, userId: string) {
  const { data } = await admin.from('org_users').select('role, teams').eq('organization_id', organizationId).eq('user_id', userId).maybeSingle()
  return { privileged: data?.role === 'owner' || data?.role === 'admin', teams: (data?.teams || []) as string[] }
}

function visible(item: any, me: { privileged: boolean; teams: string[] }) {
  if (item.content_type !== 'company-document') return true
  const vis: string[] = item.metadata?.visibility || ['all']
  return vis.includes('all') || me.privileged || vis.some((t) => me.teams.includes(t))
}

const bodyOf = (item: any) => (typeof item.content === 'string' ? item.content : JSON.stringify(item.content || ''))

const STOP = new Set(['the', 'and', 'for', 'with', 'that', 'this', 'from', 'about', 'our', 'piece', 'doc', 'document'])

// Any of the words, ranked by how many match (title matches count triple), then by recency.
export async function searchVault(admin: Admin, organizationId: string, userId: string, query: string, opts: { folder?: string; limit?: number } = {}): Promise<VaultHit[]> {
  const clean = query.replace(/[%_,()*\\"]/g, ' ').toLowerCase()
  let words = [...new Set(clean.split(/\s+/).filter((w) => w.length >= 3 && !STOP.has(w)))].slice(0, 8)
  if (!words.length) words = clean.split(/\s+/).filter(Boolean).slice(0, 3)
  if (!words.length) return []
  let req = admin
    .from('content_library')
    .select('id, title, folder, content_type, content, metadata, updated_at')
    .eq('organization_id', organizationId)
    .or(words.flatMap((w) => [`title.ilike.%${w}%`, `content.ilike.%${w}%`]).join(','))
    .order('updated_at', { ascending: false })
    .limit(150)
  if (opts.folder) req = req.ilike('folder', `${opts.folder.replace(/[%_]/g, '')}%`)
  const { data } = await req
  const me = await teamsOf(admin, organizationId, userId)
  const items = (data || []).filter((i: any) => visible(i, me))
  const redact = await vaultRedactor(admin, organizationId, userId, items.map((i: any) => i.metadata?.knowledge_document_id))
  const scored = items.map((item: any) => {
    const title = (item.title || '').toLowerCase()
    const body = redact(item.metadata?.knowledge_document_id, bodyOf(item))
    const lower = body.toLowerCase()
    const score = words.reduce((s, w) => s + (title.includes(w) ? 3 : 0) + (lower.includes(w) ? 1 : 0), 0)
    const first = Math.max(0, Math.min(...words.map((w) => { const i = lower.indexOf(w); return i < 0 ? Infinity : i })))
    const at = Number.isFinite(first) ? first : 0
    return { score, hit: { id: item.id, title: item.title, folder: item.folder, type: item.content_type, updated_at: item.updated_at, snippet: body.slice(Math.max(0, at - 120), at + 280).replace(/\s+/g, ' ').trim() } }
  })
  scored.sort((a: any, b: any) => b.score - a.score)
  return scored.slice(0, opts.limit ?? 10).map((s: any) => s.hit)
}

export async function readVaultItem(admin: Admin, organizationId: string, userId: string, id: string) {
  const { data: item } = await admin.from('content_library').select('id, title, folder, content_type, content, metadata, updated_at').eq('id', id).eq('organization_id', organizationId).maybeSingle()
  if (!item || !visible(item, await teamsOf(admin, organizationId, userId))) return null
  const redact = await vaultRedactor(admin, organizationId, userId, [item.metadata?.knowledge_document_id])
  const text = redact(item.metadata?.knowledge_document_id, bodyOf(item))
  return { id: item.id, title: item.title as string, folder: item.folder as string | null, type: item.content_type as string, updated_at: item.updated_at as string, text: text.slice(0, 60000) }
}

// Save a piece of work into the vault (default folder NIV/Drafts), with an embedding for semantic search.
export async function saveToVault(admin: Admin, p: { organizationId: string; userId: string; title: string; content: string; folder?: string; contentType?: string; via?: string }) {
  const title = p.title.trim().slice(0, 200) || `Draft ${new Date().toLocaleDateString('en-US')}`
  const folder = (p.folder || 'NIV/Drafts').replace(/^\/+|\/+$/g, '').slice(0, 200) || 'NIV/Drafts'
  let embedding: number[] | null = null
  try {
    const { data } = await admin.functions.invoke('generate-embeddings', { body: { text: `${title}\n\n${p.content}`.slice(0, 2000) } })
    embedding = data?.embedding || null
  } catch {}
  const { data, error } = await admin.from('content_library').insert({
    organization_id: p.organizationId,
    content_type: p.contentType || 'draft',
    title,
    content: p.content,
    folder,
    status: 'saved',
    created_by: 'niv',
    tags: [p.contentType || 'draft'],
    metadata: { saved_by_user_id: p.userId, via: p.via || 'niv', generatedAt: new Date().toISOString() },
    last_accessed_at: new Date().toISOString(),
    salience_score: 1.0,
    ...(embedding && { embedding, embedding_model: 'voyage-3-large', embedding_updated_at: new Date().toISOString() }),
  }).select('id, title, folder').single()
  if (error) throw error
  return data as { id: string; title: string; folder: string }
}
