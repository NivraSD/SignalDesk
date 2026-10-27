// NIV knowledge base: find passages in documents everyone can see that repeat specific facts from
// restricted documents (see migrations/20261027_knowledge_exposures.sql).
//   POST { organization_id, document_id? }   (service role only)
// With document_id, only pairs involving that document are checked (run after it's ingested), and
// that document's earlier open flags that no longer hold are marked resolved. Without it, the whole
// org is scanned (daily cron). Open passages are split into lines and each line is embedded and
// compared with restricted passages (a leaked line inside a long passage doesn't move the passage's
// own embedding much); passages with a close line go to Gemini, which decides.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { callGeminiFlash } from '../_shared/gemini-flash.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const VOYAGE_API_KEY = Deno.env.get('VOYAGE_API_KEY')!
const BATCH = 6
const LINE_MIN_SIM = Number(Deno.env.get('EXPOSURE_LINE_MIN_SIM') || 0.72)

const cos = (a: number[], b: number[]) => { let d = 0, x = 0, y = 0; for (let i = 0; i < a.length; i++) { d += a[i] * b[i]; x += a[i] * a[i]; y += b[i] * b[i] } return d / Math.sqrt(x * y) }
const vec = (v: any): number[] => (typeof v === 'string' ? JSON.parse(v) : v)

// Lines worth checking: long enough to carry a fact, not headers or footers.
function linesOf(text: string) {
  const out: string[] = []
  for (const raw of text.split(/\n+/)) {
    const parts = raw.length > 300 ? raw.split(/(?<=[.;])\s+(?=[A-Z])/) : [raw]
    for (const p of parts) {
      const l = p.replace(/^[\s•\-*>#|]+/, '').trim()
      if (l.length >= 40 && !/^Nivria — Internal/.test(l)) out.push(l)
    }
  }
  return out
}

async function embedLines(lines: string[]) {
  const out: number[][] = []
  for (let i = 0; i < lines.length; i += 128) {
    const r = await fetch('https://api.voyageai.com/v1/embeddings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${VOYAGE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'voyage-3-large', input: lines.slice(i, i + 128), input_type: 'query' }),
    })
    if (!r.ok) throw new Error(`voyage ${r.status}`)
    out.push(...(await r.json()).data.map((d: any) => d.embedding))
  }
  return out
}

function role(token: string): string | null {
  try { return JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).role ?? null } catch { return null }
}

async function hash(s: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s.trim()))
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

type Cand = {
  open_chunk_id: string; open_document_id: string; open_title: string; open_section: string | null; open_content: string
  restricted_chunk_id: string; restricted_document_id: string; restricted_title: string; restricted_visibility: string[]; restricted_content: string
  similarity: number
}
type Verdict = { item: number; discloses: boolean; restricted: number | null; facts: string[]; intentional?: boolean }

const SYSTEM = `You review a company's internal documents for accidental over-sharing. Passage A is in a document every employee can read. The B passages are from documents restricted to certain teams.
Decide whether A discloses specific, non-public facts that are in a B passage: numbers, prices, discount levels, approval thresholds, client names tied to deals or terms, financial results, forecasts, plans or decisions.
It is NOT a disclosure when they only share a topic, general principles, public-facing claims, or common policy wording (e.g. "client names need written consent"), or when A is generic boilerplate.
Be conservative: only flag clear cases.
Also judge "intentional": true when A reads like a deliberate communication from leadership to all employees that chose to share the fact (all-hands notes, a CEO memo to all staff); false when it looks like an accidental copy (internal rules or numbers pasted into a customer-facing deck, speaker notes, a general document or template).`

async function judge(group: { open: Cand; cands: Cand[]; lines: string[] }[]): Promise<Verdict[]> {
  const items = group.map((g, i) => `### Item ${i}
A (${g.open.open_title}${g.open.open_section ? ` > ${g.open.open_section}` : ''}, visible to everyone):
"""${g.open.open_content.slice(0, 1800)}"""
Lines in A that look closest to restricted material: ${g.lines.slice(0, 4).map((l) => `"${l.slice(0, 200)}"`).join('; ')}
${g.cands.map((c, j) => `B${j} (${c.restricted_title}, restricted to ${c.restricted_visibility.join(', ')}):
"""${c.restricted_content.slice(0, 1500)}"""`).join('\n')}`).join('\n\n')
  const out = await callGeminiFlash(`${items}

For each item return {"item": <n>, "discloses": true|false, "restricted": <index of the B passage it repeats, or null>, "facts": [<what it repeats, a few words each, max 4>], "intentional": true|false}.
Return a JSON array with one object per item.`, { json: true, system: SYSTEM, maxOutputTokens: 3000, timeoutMs: 60000 })
  const parsed = JSON.parse(out)
  return Array.isArray(parsed) ? parsed : parsed.items || []
}

Deno.serve(async (req) => {
  try { return await handle(req) } catch (e) {
    console.error('exposure scan failed:', e)
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
})

async function handle(req: Request): Promise<Response> {
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || ''
  if (role(token) !== 'service_role') return new Response('Forbidden', { status: 403 })
  const { organization_id, document_id = null, debug = false } = await req.json().catch(() => ({}))
  if (!organization_id) return new Response(JSON.stringify({ error: 'organization_id required' }), { status: 400 })
  const admin = createClient(SUPABASE_URL, SERVICE_KEY)

  const { data: docs } = await admin.from('knowledge_documents').select('id, title, visibility, status').eq('organization_id', organization_id).neq('status', 'superseded').eq('ingest_status', 'ready')
  const isOpen = (d: any) => (d.visibility || []).includes('all')
  const scoped = document_id ? (docs || []).find((d: any) => d.id === document_id) : null
  const openDocs = (docs || []).filter((d: any) => isOpen(d) && (!scoped || !isOpen(scoped) || d.id === scoped.id))
  const restrictedDocs = (docs || []).filter((d: any) => !isOpen(d) && (!scoped || isOpen(scoped) || d.id === scoped.id))
  if (!openDocs.length || !restrictedDocs.length) return new Response(JSON.stringify({ ok: true, candidates: 0, flagged: 0 }), { headers: { 'Content-Type': 'application/json' } })
  const docById = new Map((docs || []).map((d: any) => [d.id, d]))

  const { data: rchunks } = await admin.from('knowledge_chunks').select('id, document_id, content, embedding').in('document_id', restrictedDocs.map((d: any) => d.id))
  const restricted = (rchunks || []).filter((c: any) => c.embedding && c.content.length >= 80).map((c: any) => ({ ...c, v: vec(c.embedding) }))
  const { data: ochunks } = await admin.from('knowledge_chunks').select('id, document_id, section, content').in('document_id', openDocs.map((d: any) => d.id))

  // Embed each open line once; find its closest restricted passages.
  const lineRefs: { chunk: any; line: string }[] = []
  for (const c of ochunks || []) for (const line of linesOf(c.content)) lineRefs.push({ chunk: c, line })
  const lineVecs = await embedLines(lineRefs.map((l) => l.line))
  const byOpen = new Map<string, { open: Cand; cands: Cand[]; lines: string[] }>()
  const top: any[] = []
  lineRefs.forEach((ref, i) => {
    const scored = restricted.map((r: any) => ({ r, sim: cos(lineVecs[i], r.v) })).sort((x, y) => y.sim - x.sim).slice(0, 2)
    if (debug) top.push({ sim: +scored[0]?.sim.toFixed(3), line: ref.line.slice(0, 110), doc: docById.get(scored[0]?.r.document_id)?.title })
    for (const { r, sim } of scored) {
      if (sim < LINE_MIN_SIM) continue
      const c = ref.chunk
      const g = byOpen.get(c.id) || { open: { open_chunk_id: c.id, open_document_id: c.document_id, open_title: docById.get(c.document_id).title, open_section: c.section, open_content: c.content } as Cand, cands: [], lines: [] }
      if (!g.lines.includes(ref.line)) g.lines.push(ref.line)
      if (!g.cands.some((x) => x.restricted_chunk_id === r.id)) {
        const rd = docById.get(r.document_id)
        g.cands.push({ ...g.open, restricted_chunk_id: r.id, restricted_document_id: r.document_id, restricted_title: rd.title, restricted_visibility: rd.visibility, restricted_content: r.content, similarity: sim })
      }
      byOpen.set(c.id, g)
    }
  })
  if (debug) {
    top.sort((a, b) => b.sim - a.sim)
    return new Response(JSON.stringify({ lines: lineRefs.length, groups: byOpen.size, top: top.slice(0, 40) }, null, 1), { headers: { 'Content-Type': 'application/json' } })
  }
  const groups = [...byOpen.values()].map((g) => ({ ...g, cands: g.cands.sort((a, b) => b.similarity - a.similarity).slice(0, 4) }))

  // Skip passages already reviewed (dismissed) with the same text.
  const { data: dismissed } = await admin.from('knowledge_exposures').select('open_document_id, content_hash, restricted_document_id').eq('organization_id', organization_id).eq('status', 'dismissed')
  const dismissedKey = new Set((dismissed || []).map((d: any) => `${d.open_document_id}|${d.content_hash}|${d.restricted_document_id}`))

  const found: any[] = []
  let judged = 0, failed = 0
  const batches: (typeof groups)[] = []
  for (let i = 0; i < groups.length; i += BATCH) batches.push(groups.slice(i, i + BATCH))
  const judgedBatches: { batch: typeof groups; verdicts: Verdict[] }[] = []
  for (let i = 0; i < batches.length; i += 4) {
    await Promise.all(batches.slice(i, i + 4).map(async (batch) => {
      try { judgedBatches.push({ batch, verdicts: await judge(batch) }); judged += batch.length }
      catch (e) { failed += batch.length; console.warn('judge failed:', e instanceof Error ? e.message : e) }
    }))
  }
  for (const { batch, verdicts } of judgedBatches) {
    for (const v of verdicts) {
      const g = batch[Number(v.item)]
      if (!g || !v.discloses) continue
      const c = g.cands[Number(v.restricted ?? 0)] || g.cands[0]
      const h = await hash(g.open.open_content)
      if (dismissedKey.has(`${g.open.open_document_id}|${h}|${c.restricted_document_id}`)) continue
      found.push({
        organization_id, open_document_id: g.open.open_document_id, open_chunk_id: g.open.open_chunk_id, content_hash: h,
        open_excerpt: g.open.open_content.slice(0, 600), restricted_document_id: c.restricted_document_id, restricted_chunk_id: c.restricted_chunk_id,
        similarity: c.similarity, facts: (v.facts || []).map(String).slice(0, 4), likely_intentional: v.intentional === true, status: 'open', detected_at: new Date().toISOString(),
      })
    }
  }

  // New flags are inserted; a resolved flag found again reopens. Open flags keep their first
  // judgment (so a rescan doesn't flip whether a passage is withheld).
  const { data: existing } = await admin.from('knowledge_exposures').select('id, open_document_id, content_hash, restricted_document_id, status').eq('organization_id', organization_id)
  const existingByKey = new Map((existing || []).map((e: any) => [`${e.open_document_id}|${e.content_hash}|${e.restricted_document_id}`, e]))
  for (const f of found) {
    const e: any = existingByKey.get(`${f.open_document_id}|${f.content_hash}|${f.restricted_document_id}`)
    if (!e) await admin.from('knowledge_exposures').insert(f)
    else if (e.status === 'resolved') await admin.from('knowledge_exposures').update({ ...f, reviewed_at: null, reviewed_by: null }).eq('id', e.id)
    else if (e.status === 'open') await admin.from('knowledge_exposures').update({ open_chunk_id: f.open_chunk_id, restricted_chunk_id: f.restricted_chunk_id }).eq('id', e.id)
  }

  // A flag resolves only when the document changed: the flagged text is gone from the open
  // document, or the restricted source is no longer restricted (or no longer current). Not when a
  // scan merely fails to find it again; the judge isn't perfectly consistent between runs.
  let resolved = 0
  const { data: openFlags } = await admin.from('knowledge_exposures').select('id, open_document_id, content_hash, restricted_document_id').eq('organization_id', organization_id).eq('status', 'open')
  const hashesByDoc = new Map<string, Set<string>>()
  for (const c of ochunks || []) {
    const set = hashesByDoc.get(c.document_id) || new Set<string>()
    set.add(await hash(c.content))
    hashesByDoc.set(c.document_id, set)
  }
  const gone = (openFlags || []).filter((f: any) => {
    const open = docById.get(f.open_document_id), restr = docById.get(f.restricted_document_id)
    if (!open || !isOpen(open) || !restr || isOpen(restr)) return true
    const hs = hashesByDoc.get(f.open_document_id)
    return hs ? !hs.has(f.content_hash) : false   // doc not in this scan's scope: leave it
  }).map((f: any) => f.id)
  if (gone.length) {
    await admin.from('knowledge_exposures').update({ status: 'resolved', reviewed_at: new Date().toISOString() }).in('id', gone)
    resolved = gone.length
  }

  return new Response(JSON.stringify({ ok: true, candidates: groups.length, judged, failed, flagged: found.length, resolved }), { headers: { 'Content-Type': 'application/json' } })
}
