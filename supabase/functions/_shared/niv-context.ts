// What NIV knows, for content written as the organization (niv-content-intelligent-v2 and others):
// the company's own documents (only those visible to everyone, current versions), its brand rules,
// past work in the Memory Vault, and recent intel; plus NIV's house writing rules. Mirrors NIV in
// the app (src/lib/advisor/niv.ts WRITING_RULES / CURRENT_FACTS_RULE; keep the two in sync).
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

export const NIV_WRITING_RULES = `Writing rules (always):
- American English: American spelling (organization, analyze, color, program, center, license, defense, traveling), American punctuation and dates (October 24, 2026), US currency formatting ($1.2M). Keep British spelling only inside direct quotes and official names.
- Say the thing directly. Don't tell readers what they feel, think or fear: no "what most teams already feel but struggle to articulate", "what nobody wants to say", "afraid to admit", "quietly", "the uncomfortable truth", "let's be honest", "here's the thing".
- No manufactured contrast ("it's not X, it's Y"), no rhetorical-question hooks, no "imagine a world" openers.
- No filler or hype: game-changer, unlock, leverage (as a verb), delve, robust, seamless, cutting-edge, revolutionize, landscape, "in today's fast-paced world", "now more than ever".
- Specific beats general: name the evidence, the number, the example. If there's no evidence, make a plainer claim.
- Current facts: your built-in knowledge is older than today. Don't state anything that changes over time (who holds a job or office, recent results, prices, laws) as current unless it appears in the material below; otherwise mark it [PLACEHOLDER: confirm ...].`

const H = { 'Content-Type': 'application/json', apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` }
const clip = (s: unknown, n: number) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, n)

async function openDocs(orgId: string, query: string, limit: number) {
  const r = await fetch(`${SUPABASE_URL}/functions/v1/knowledge-search`, {
    method: 'POST', headers: H, signal: AbortSignal.timeout(12000),
    body: JSON.stringify({ organization_id: orgId, query, limit, open_only: true }),
  }).catch(() => null)
  if (!r?.ok) return []
  return ((await r.json().catch(() => ({}))).results || []) as any[]
}

async function rest(path: string) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers: H, signal: AbortSignal.timeout(8000) }).catch(() => null)
  return r?.ok ? ((await r.json().catch(() => [])) as any[]) : []
}

// A context block for the prompt. Every part is optional; failures just leave a part out.
export async function nivContextFor(p: { organizationId?: string; topic?: string; orgName?: string }): Promise<string> {
  if (!p.organizationId) return ''
  const topic = clip(p.topic, 400)
  const words = [...new Set(topic.toLowerCase().split(/\W+/).filter((w) => w.length > 4))].slice(0, 6)
  const since = new Date(Date.now() - 14 * 86400_000).toISOString()
  const [brand, related, vault, intel] = await Promise.all([
    openDocs(p.organizationId, 'brand guidelines voice tone naming rules words we do not use', 4),
    topic ? openDocs(p.organizationId, topic, 5) : Promise.resolve([]),
    words.length
      ? rest(`content_library?organization_id=eq.${p.organizationId}&content_type=neq.company-document&or=(${words.map((w) => `title.ilike.*${encodeURIComponent(w)}*`).join(',')})&select=title,content_type,created_at&order=created_at.desc&limit=5`)
      : Promise.resolve([]),
    words.length
      ? rest(`target_article_matches?organization_id=eq.${p.organizationId}&matched_at=gte.${since}&select=raw_articles(title,source_name,published_at,url)&order=similarity_score.desc&limit=60`)
      : Promise.resolve([]),
  ])
  const intelHits = intel
    .map((m: any) => m.raw_articles).filter(Boolean)
    .filter((a: any) => words.some((w) => String(a.title || '').toLowerCase().includes(w)))
    .slice(0, 5)
  const relatedDocs = related.filter((d: any) => !brand.some((b: any) => b.chunk_id === d.chunk_id))
  const parts: string[] = []
  if (brand.length) parts.push(`Brand rules (binding for anything published; follow naming and voice, avoid listed words; ignore visual rules like colors):\n${brand.map((b: any) => `- [${b.title}${b.section ? ` › ${b.section}` : ''}] ${clip(b.content, 450)}`).join('\n')}`)
  if (relatedDocs.length) parts.push(`Company knowledge on this topic (facts you may use; policies are rules, precedent is how we've done it; don't contradict them):\n${relatedDocs.map((d: any) => `- [${d.title}${d.version ? ` v${d.version}` : ''}${d.section ? ` › ${d.section}` : ''} · ${d.authority}] ${clip(d.content, 500)}`).join('\n')}`)
  if (vault.length) parts.push(`Past work in the Memory Vault on this topic (stay consistent with it; don't repeat it word for word):\n${vault.map((v: any) => `- ${v.content_type}: "${clip(v.title, 140)}" (${String(v.created_at).slice(0, 10)})`).join('\n')}`)
  if (intelHits.length) parts.push(`Recent coverage the organization is tracking (current facts you may cite with the outlet):\n${intelHits.map((a: any) => `- ${clip(a.title, 160)} (${a.source_name || 'source'}, ${String(a.published_at || '').slice(0, 10)})`).join('\n')}`)
  if (!parts.length) return ''
  return `\n\n## What NIV knows about ${p.orgName || 'the organization'} (use it)\n${parts.join('\n\n')}\nDon't put internal document names or citations into published copy; use the facts, not the references.`
}
