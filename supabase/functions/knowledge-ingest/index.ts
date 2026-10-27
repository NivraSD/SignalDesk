// NIV knowledge base: ingest one uploaded document.
//   POST { document_id }  (service role only)
// Downloads the original from the private 'knowledge' bucket, extracts text (PDF page by page,
// DOCX with headings, PPTX slide by slide incl. speaker notes), splits it into passages that keep
// their section heading and page/slide number, embeds them (Voyage, 1024-d), and marks the
// document ready. Documents uploaded without a type get one guessed by Gemini Flash
// (classified_by = 'model', for a human to confirm).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { extractText, getDocumentProxy } from 'npm:unpdf@0.12.1'
import mammoth from 'npm:mammoth@1.8.0'
import JSZip from 'npm:jszip@3.10.1'
import { callGeminiFlash } from '../_shared/gemini-flash.ts'
import { VERSIONED_TYPES, documentDate, findDates, parseVersion, seriesKey } from '../_shared/dates.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const VOYAGE_API_KEY = Deno.env.get('VOYAGE_API_KEY')!

type Unit = { section: string; page: number | null; text: string }

function role(token: string): string | null {
  try { return JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).role ?? null } catch { return null }
}

// ── Extraction → units of text with their heading path and page ─────────────
async function extractPdf(bytes: Uint8Array): Promise<{ units: Unit[]; pages: number }> {
  const pdf = await getDocumentProxy(bytes)
  const { totalPages, text } = await extractText(pdf, { mergePages: false })
  const units: Unit[] = []
  let section = ''
  ;(text as string[]).forEach((pageText, i) => {
    // Headings in our PDFs are short lines; keep the most recent one as the section label.
    const lines = pageText.split('\n').map((l) => l.trim()).filter(Boolean)
    let buf: string[] = []
    for (const line of lines) {
      if (/^(§?\d+(\.\d+)*\.?\s+[A-Z][^.]{2,80}|[A-Z][A-Za-z &/,'’()-]{3,60})$/.test(line) && line.length < 90) {
        if (buf.length) units.push({ section, page: i + 1, text: buf.join('\n') })
        buf = []
        section = line
      } else buf.push(line)
    }
    if (buf.length) units.push({ section, page: i + 1, text: buf.join('\n') })
  })
  return { units, pages: totalPages }
}

async function extractDocx(bytes: Uint8Array): Promise<{ units: Unit[]; pages: number | null }> {
  const { value: html } = await mammoth.convertToHtml({ buffer: bytes })
  const units: Unit[] = []
  const path: string[] = []
  let buf: string[] = []
  const flush = () => { if (buf.length) units.push({ section: path.filter(Boolean).join(' > '), page: null, text: buf.join('\n') }); buf = [] }
  const clean = (s: string) => s.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim()
  for (const m of html.matchAll(/<(h[1-4]|p|li|tr)[^>]*>([\s\S]*?)<\/\1>/g)) {
    const tag = m[1]
    if (tag.startsWith('h')) {
      flush()
      const lvl = Number(tag[1])
      path.length = lvl - 1
      path[lvl - 1] = clean(m[2])
    } else if (tag === 'tr') {
      const cells = [...m[2].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)].map((c) => clean(c[1]))
      if (cells.some(Boolean)) buf.push(cells.join(' | '))
    } else {
      const t = clean(m[2])
      if (t) buf.push(tag === 'li' ? `- ${t}` : t)
    }
  }
  flush()
  return { units, pages: null }
}

async function extractPptx(bytes: Uint8Array): Promise<{ units: Unit[]; pages: number }> {
  const zip = await JSZip.loadAsync(bytes)
  const slideFiles = Object.keys(zip.files)
    .filter((f) => /^ppt\/slides\/slide\d+\.xml$/.test(f))
    .sort((a, b) => Number(a.match(/\d+/g)!.pop()) - Number(b.match(/\d+/g)!.pop()))
  const texts = (xml: string) => [...xml.matchAll(/<a:t>([^<]*)<\/a:t>/g)].map((m) => m[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'"))
  const units: Unit[] = []
  for (const f of slideFiles) {
    const n = Number(f.match(/slide(\d+)\.xml$/)![1])
    const parts = texts(await zip.file(f)!.async('string'))
    const notesFile = zip.file(`ppt/notesSlides/notesSlide${n}.xml`)
    const notes = notesFile ? texts(await notesFile.async('string')).filter((t) => !/^\d+$/.test(t)) : []
    const [title, ...rest] = parts
    const body = [...rest, ...(notes.length ? [`Speaker notes: ${notes.join(' ')}`] : [])].join('\n')
    units.push({ section: `Slide ${n}: ${title || ''}`.trim(), page: n, text: body || title || '' })
  }
  return { units, pages: slideFiles.length }
}

// ── Passages: ~1,200 chars, never crossing a section; small neighbors merged ─
function chunk(units: Unit[]): Unit[] {
  const out: Unit[] = []
  for (const u of units) {
    const text = u.text.trim()
    if (!text) continue
    const last = out[out.length - 1]
    if (last && last.section === u.section && (last.text.length + text.length) < 1400) {
      last.text += '\n' + text
      continue
    }
    if (text.length <= 1600) { out.push({ ...u, text }); continue }
    const paras = text.split(/\n/)
    let buf = ''
    for (const p of paras) {
      if ((buf + '\n' + p).length > 1200 && buf) { out.push({ ...u, text: buf }); buf = p } else buf = buf ? buf + '\n' + p : p
    }
    if (buf) out.push({ ...u, text: buf })
  }
  return out
}

async function embed(texts: string[]): Promise<number[][]> {
  const out: number[][] = []
  for (let i = 0; i < texts.length; i += 64) {
    const r = await fetch('https://api.voyageai.com/v1/embeddings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${VOYAGE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'voyage-3-large', input: texts.slice(i, i + 64), input_type: 'document' }),
    })
    if (!r.ok) throw new Error(`Voyage ${r.status}: ${(await r.text()).slice(0, 200)}`)
    const j = await r.json()
    out.push(...j.data.map((d: { embedding: number[] }) => d.embedding))
  }
  return out
}

// ── Memory Vault mirror ──────────────────────────────────────────────────────
// Each company document appears in the Memory Vault (content_library) under Company/<category>,
// so the vault stays the one file system. Restricted documents (not visible to everyone) carry
// title + metadata only: other features read content_library directly, and the full text must stay
// behind the knowledge base's permission check. The vault list API also hides them from people
// outside their teams.
const VAULT_FOLDER: Record<string, string> = {
  policy: 'Company/Policies', precedent: 'Company/Precedent', memo: 'Company/Memos', playbook: 'Company/Playbooks',
  research: 'Company/Research', financial: 'Company/Board & Finance', brand: 'Company/Brand', reference: 'Company/Reference',
}
async function syncVaultMirror(admin: any, docIds: string[]) {
  for (const id of docIds) {
    const { data: d } = await admin.from('knowledge_documents').select('*').eq('id', id).single()
    if (!d) continue
    const open = (d.visibility || []).includes('all')
    let text = ''
    if (open) {
      const { data: chunks } = await admin.from('knowledge_chunks').select('content').eq('document_id', id).order('chunk_index')
      text = (chunks || []).map((c: any) => c.content).join('\n\n')
    }
    const row = {
      organization_id: d.organization_id,
      content_type: 'company-document',
      title: d.version && !new RegExp(`v?${String(d.version).replace('.', '\\.')}\\b`, 'i').test(d.title) ? `${d.title} (v${d.version})` : d.title,
      content: open ? text : `Restricted document (${(d.visibility || []).join(', ')}). Ask NIV, which checks access, or open it if you're on that team.`,
      folder: VAULT_FOLDER[d.doc_type] || 'Company/Reference',
      status: d.status === 'superseded' ? 'archived' : 'approved',
      tags: [d.doc_type, d.authority, d.status],
      metadata: {
        knowledge_document_id: d.id, doc_type: d.doc_type, authority: d.authority, status: d.status, version: d.version,
        effective_date: d.effective_date, date_precision: d.date_precision, owner: d.owner, visibility: d.visibility,
        superseded_by: d.superseded_by, superseded_at: d.superseded_at, summary: d.summary, restricted: !open,
      },
      updated_at: new Date().toISOString(),
    }
    const { data: existing } = await admin.from('content_library').select('id').eq('organization_id', d.organization_id).eq('metadata->>knowledge_document_id', d.id).maybeSingle()
    if (existing) await admin.from('content_library').update(row).eq('id', existing.id)
    else await admin.from('content_library').insert(row)
  }
}

// ── Dates, versions and the version chain ────────────────────────────────────
// Policies are correct until replaced: within a series, the newest effective date (then highest
// version) is current, regardless of upload order. Drafts never replace a current document.
async function stampDates(admin: any, doc: any, fullText: string) {
  const own = doc.effective_date
    ? { date: doc.effective_date, precision: 'day', text: 'document metadata' }
    : documentDate(fullText)
  const year = own ? Number(String(own.date).slice(0, 4)) : undefined
  const seen = new Set<string>()
  const mentioned = findDates(fullText, year)
    .filter((d) => !seen.has(d.date + d.precision) && seen.add(d.date + d.precision))
    .slice(0, 60)
    .map(({ text, date, precision }) => ({ text, date, precision }))
  const parsedVersion = parseVersion(doc.version) ?? parseVersion(fullText.slice(0, 1500))
  const patch = {
    version: doc.version || (parsedVersion != null ? String(parsedVersion) : null),
    // Only revisable document types form version series; periodic reports stand alone.
    series_key: VERSIONED_TYPES.has(doc.doc_type) ? seriesKey(doc.title || '') : null,
    version_number: parsedVersion,
    effective_date: own?.date ?? null,
    date_precision: own?.precision ?? null,
    date_source: own?.text ?? null,
    dates_mentioned: mentioned,
  }
  await admin.from('knowledge_documents').update(patch).eq('id', doc.id)
  return { ...doc, ...patch }
}

async function reconcileSeries(admin: any, organizationId: string, key: string) {
  if (!key) return []
  const { data: docs } = await admin
    .from('knowledge_documents')
    .select('id, title, status, version, version_number, effective_date, created_at, superseded_at, superseded_by, supersedes_id')
    .eq('organization_id', organizationId)
    .eq('series_key', key)
    .eq('ingest_status', 'ready')
  // Drafts never replace anything. A version effective in the future waits as 'scheduled'
  // (promoted on its date by knowledge_promote_scheduled).
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date())
  for (const d of (docs || []).filter((d: any) => d.status !== 'draft' && d.effective_date && d.effective_date > today)) {
    if (d.status !== 'scheduled') await admin.from('knowledge_documents').update({ status: 'scheduled' }).eq('id', d.id)
  }
  const live = (docs || []).filter((d: any) => d.status !== 'draft' && !(d.effective_date && d.effective_date > today))
  if (live.length < 2) {
    if (live.length === 1 && live[0].status === 'superseded' && !live[0].superseded_by) {
      await admin.from('knowledge_documents').update({ status: 'current', superseded_at: null }).eq('id', live[0].id)
    }
    return []
  }
  // Same effective date and version as an earlier upload = a duplicate: the original stays canonical.
  const sameAs = (x: any, y: any) => x.effective_date && x.effective_date === y.effective_date && x.version_number != null && Number(x.version_number) === Number(y.version_number)
  const byAge = [...live].sort((a: any, b: any) => String(a.created_at).localeCompare(String(b.created_at)))
  const originals: any[] = []
  for (const d of byAge) {
    const orig = originals.find((o) => sameAs(o, d))
    if (orig) {
      await admin.from('knowledge_documents').update({ status: 'superseded', superseded_by: orig.id, duplicate_of: orig.id, superseded_at: d.superseded_at || new Date().toISOString() }).eq('id', d.id)
    } else originals.push(d)
  }
  const ranked = [...originals].sort((a: any, b: any) =>
    String(b.effective_date || '').localeCompare(String(a.effective_date || '')) ||
    (Number(b.version_number ?? -1) - Number(a.version_number ?? -1)) ||
    String(a.created_at).localeCompare(String(b.created_at)))
  if (ranked.length < 2) {
    if (ranked[0] && ranked[0].status !== 'current') await admin.from('knowledge_documents').update({ status: 'current', superseded_at: null, superseded_by: null }).eq('id', ranked[0].id)
    return []
  }
  const changes: { id: string; title: string; version: string; superseded_by: string }[] = []
  const now = new Date().toISOString()
  for (let i = 0; i < ranked.length; i++) {
    const d = ranked[i]
    if (i === 0) {
      await admin.from('knowledge_documents').update({ status: 'current', superseded_at: null, superseded_by: null, supersedes_id: ranked[1]?.id ?? d.supersedes_id }).eq('id', d.id)
    } else {
      const newer = ranked[i - 1]
      const already = d.status === 'superseded' && d.superseded_by === newer.id
      await admin.from('knowledge_documents').update({
        status: 'superseded',
        superseded_by: newer.id,
        superseded_at: already ? d.superseded_at : now,
        supersedes_id: ranked[i + 1]?.id ?? d.supersedes_id,
      }).eq('id', d.id)
      if (!already) changes.push({ id: d.id, title: d.title, version: d.version, superseded_by: newer.id })
    }
  }
  return changes
}

Deno.serve(async (req) => {
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || ''
  if (role(token) !== 'service_role') return new Response('Forbidden', { status: 403 })
  const { document_id, mode } = await req.json().catch(() => ({}))
  if (!document_id) return new Response(JSON.stringify({ error: 'document_id required' }), { status: 400 })

  const admin = createClient(SUPABASE_URL, SERVICE_KEY)
  const { data: doc } = await admin.from('knowledge_documents').select('*').eq('id', document_id).single()
  if (!doc) return new Response(JSON.stringify({ error: 'not found' }), { status: 404 })

  // Re-stamp dates and reconcile versions from the stored passages (no re-extraction/embedding).
  if (mode === 'dates_only') {
    const { data: chunks } = await admin.from('knowledge_chunks').select('content').eq('document_id', doc.id).order('chunk_index')
    const stamped = await stampDates(admin, doc, (chunks || []).map((c: any) => c.content).join('\n'))
    const superseded = await reconcileSeries(admin, doc.organization_id, stamped.series_key)
    await syncVaultMirror(admin, [doc.id, ...superseded.map((x) => x.id)])
    return new Response(JSON.stringify({ ok: true, effective_date: stamped.effective_date, precision: stamped.date_precision, series: stamped.series_key, superseded, status: (await admin.from('knowledge_documents').select('status').eq('id', doc.id).single()).data?.status }), { headers: { 'Content-Type': 'application/json' } })
  }
  await admin.from('knowledge_documents').update({ ingest_status: 'processing', ingest_error: null }).eq('id', doc.id)

  try {
    const { data: file, error: dlErr } = await admin.storage.from('knowledge').download(doc.file_path)
    if (dlErr || !file) throw new Error(`download failed: ${dlErr?.message}`)
    const bytes = new Uint8Array(await file.arrayBuffer())
    const name = (doc.file_path || '').toLowerCase()
    const { units, pages } = name.endsWith('.pdf') ? await extractPdf(bytes)
      : name.endsWith('.docx') ? await extractDocx(bytes)
      : name.endsWith('.pptx') ? await extractPptx(bytes)
      : { units: [{ section: '', page: null, text: new TextDecoder().decode(bytes) }], pages: null }

    const passages = chunk(units)
    if (!passages.length) throw new Error('no text extracted')

    // Untyped uploads: let Gemini guess type/authority/summary for a human to confirm.
    const patch: Record<string, unknown> = { page_count: pages }
    if (doc.classified_by === 'model' || !doc.summary) {
      try {
        const sample = passages.slice(0, 8).map((p) => `[${p.section}] ${p.text}`).join('\n').slice(0, 6000)
        const guess = JSON.parse(await callGeminiFlash(
          `Classify this internal company document. Return JSON {"doc_type": one of policy|precedent|memo|playbook|research|financial|brand|reference, "authority": binding (rules people must follow) | guidance (how we've done it / recommended) | reference (evidence/context), "summary": one sentence, "owner": name/role if stated else null, "effective_date": YYYY-MM-DD if stated else null}.\nTitle: ${doc.title}\n\n${sample}`,
          { json: true, maxOutputTokens: 2000 }))
        if (doc.classified_by === 'model') {
          if (guess.doc_type) patch.doc_type = guess.doc_type
          if (guess.authority) patch.authority = guess.authority
          if (!doc.owner && guess.owner) patch.owner = guess.owner
          if (!doc.effective_date && guess.effective_date) patch.effective_date = guess.effective_date
        }
        if (!doc.summary && guess.summary) patch.summary = guess.summary
      } catch (e) {
        console.warn('classification skipped:', e instanceof Error ? e.message : e)
      }
    }

    const vectors = await embed(passages.map((p) => `${doc.title}${p.section ? ` — ${p.section}` : ''}\n${p.text}`))
    await admin.from('knowledge_chunks').delete().eq('document_id', doc.id)
    const rows = passages.map((p, i) => ({
      document_id: doc.id, organization_id: doc.organization_id, chunk_index: i,
      section: p.section || null, page: p.page, content: p.text, embedding: JSON.stringify(vectors[i]),
    }))
    for (let i = 0; i < rows.length; i += 100) {
      const { error } = await admin.from('knowledge_chunks').insert(rows.slice(i, i + 100))
      if (error) throw new Error(`insert chunks: ${error.message}`)
    }
    await admin.from('knowledge_documents').update({ ...patch, ingest_status: 'ready', updated_at: new Date().toISOString() }).eq('id', doc.id)
    const stamped = await stampDates(admin, { ...doc, ...patch }, passages.map((p) => p.text).join('\n'))
    const superseded = await reconcileSeries(admin, doc.organization_id, stamped.series_key)
    await syncVaultMirror(admin, [doc.id, ...superseded.map((x) => x.id)])
    // Check whether this document repeats (or is repeated by) restricted content; runs after responding.
    const scan = fetch(`${SUPABASE_URL}/functions/v1/knowledge-exposure-scan`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${SERVICE_KEY}` },
      body: JSON.stringify({ organization_id: doc.organization_id, document_id: doc.id }),
    }).catch((e) => console.warn('exposure scan not started:', e))
    ;(globalThis as any).EdgeRuntime?.waitUntil?.(scan)
    return new Response(JSON.stringify({ ok: true, passages: rows.length, pages, effective_date: stamped.effective_date, precision: stamped.date_precision, series: stamped.series_key, superseded, status: (await admin.from('knowledge_documents').select('status').eq('id', doc.id).single()).data?.status }), { headers: { 'Content-Type': 'application/json' } })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    await admin.from('knowledge_documents').update({ ingest_status: 'failed', ingest_error: msg.slice(0, 500) }).eq('id', doc.id)
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
})
