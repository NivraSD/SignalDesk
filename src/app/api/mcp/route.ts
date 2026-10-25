// NIV MCP server: use NIV from Claude Desktop, Claude Code, Cursor, Copilot and other MCP clients.
//   URL: https://<host>/api/mcp   (Streamable HTTP)
//   Auth: Authorization: Bearer niv_…  (personal access token from NIV; acts as that person in their
//         org, with exactly their permissions; membership re-checked on every request)
// Tools: company documents (search/read/list), intel (search, latest brief), Memory Vault
// (search/read), and ask_niv (the full advisor; answers are saved to the person's NIV history).
import { createMcpHandler, withMcpAuth } from 'mcp-handler'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase/server'
import { verifyAccessToken } from '@/lib/advisor/tokens'
import { knowledgeSearch, listDocuments, readDocument, runWorkspaceTurn } from '@/lib/advisor/workspace'
import { addMessage, latestBrief, loadMessages, loadOrg, loadTaste, searchOrgIntel } from '@/lib/advisor/data'
import { randomUUID } from 'crypto'

export const maxDuration = 300

const DAILY_ASK_LIMIT = 100

type Who = { userId: string; organizationId: string; tokenId: string; scopes: string[] }

function who(ctx: any): Who {
  const extra = ctx?.http?.authInfo?.extra as Who | undefined
  if (!extra?.userId || !extra?.organizationId) throw new Error('Not authorized')
  return extra
}

const text = (s: string) => ({ content: [{ type: 'text' as const, text: s }] })
const json = (v: unknown) => text(JSON.stringify(v, null, 2))

// Can this person see this company document's vault entry? (Restricted docs: their teams only.)
async function canSeeVaultItem(admin: any, w: Who, item: any) {
  if (item.content_type !== 'company-document') return true
  const vis: string[] = item.metadata?.visibility || ['all']
  if (vis.includes('all')) return true
  const { data: me } = await admin.from('org_users').select('role, teams').eq('organization_id', w.organizationId).eq('user_id', w.userId).maybeSingle()
  return me?.role === 'owner' || me?.role === 'admin' || vis.some((t) => (me?.teams || []).includes(t))
}

const handler = createMcpHandler(
  (server) => {
    server.registerTool(
      'search_company_docs',
      {
        title: 'Search company documents',
        description: "Semantic search over the company's own documents (policies, precedent, playbooks, research, financials, brand rules). Returns passages with title, type, authority (binding = rule, guidance = how we've done it, reference = evidence), status (current/superseded/scheduled/draft), version, effective date, section and page for citation. Only documents you are allowed to see. Prefer current versions; superseded ones are flagged.",
        inputSchema: z.object({ query: z.string().min(2), limit: z.number().int().min(1).max(25).optional() }),
      },
      async ({ query, limit }, ctx) => {
        const w = who(ctx)
        const rows = await knowledgeSearch(w.organizationId, w.userId, query, limit ?? 10)
        return json(rows.map((r: any) => ({
          document_id: r.document_id, title: r.title, doc_type: r.doc_type, authority: r.authority, status: r.status,
          version: r.version, effective_date: r.effective_date, owner: r.owner, section: r.section, page: r.page,
          cite_as: `[${r.title}${r.version ? ` v${r.version}` : ''}${r.section ? ` §${r.section}` : ''}${r.page ? `, p${r.page}` : ''}]`,
          text: r.content,
        })))
      }
    )

    server.registerTool(
      'read_company_document',
      {
        title: 'Read a company document',
        description: 'Read a whole company document (or the parts matching a section name or keyword) by document_id from search or list results.',
        inputSchema: z.object({ document_id: z.string().uuid(), section: z.string().optional() }),
      },
      async ({ document_id, section }, ctx) => {
        const w = who(ctx)
        const doc = await readDocument(createServiceClient(), w.organizationId, w.userId, document_id, section)
        if (!doc) return text('Not found, or not visible to you.')
        return text(`${doc.doc.title} v${doc.doc.version} (${doc.doc.status}, ${doc.doc.authority}; effective ${doc.doc.effective_date}; owner ${doc.doc.owner})\n\n${doc.text}`)
      }
    )

    server.registerTool(
      'list_company_documents',
      {
        title: 'List company documents',
        description: 'List the company documents you can see, optionally one type (policy, precedent, memo, playbook, research, financial, brand, reference).',
        inputSchema: z.object({ doc_type: z.enum(['policy', 'precedent', 'memo', 'playbook', 'research', 'financial', 'brand', 'reference']).optional() }),
      },
      async ({ doc_type }, ctx) => {
        const w = who(ctx)
        const docs = await listDocuments(createServiceClient(), w.organizationId, w.userId, doc_type)
        return json(docs.map((d: any) => ({ document_id: d.id, title: d.title, doc_type: d.doc_type, authority: d.authority, status: d.status, version: d.version, effective_date: d.effective_date, owner: d.owner, summary: d.summary })))
      }
    )

    server.registerTool(
      'search_intel',
      {
        title: 'Search intelligence',
        description: "Search the organization's monitored outside news from the last 30 days (competitors, market, regulators, stakeholders): title, source, date, URL, summary and which target it matched.",
        inputSchema: z.object({ query: z.string().optional() }),
      },
      async ({ query }, ctx) => {
        const w = who(ctx)
        const rows = await searchOrgIntel(createServiceClient(), w.organizationId, query || '')
        return rows.length ? json(rows) : text('No matching news in the last 30 days.')
      }
    )

    server.registerTool(
      'get_latest_brief',
      {
        title: 'Latest intelligence brief',
        description: "The organization's most recent executive intelligence brief (synthesis of its monitored news).",
        inputSchema: z.object({}),
      },
      async (_args, ctx) => {
        const w = who(ctx)
        const brief = await latestBrief(createServiceClient(), w.organizationId)
        return text(brief ? `${brief.title} (${brief.date})\n\n${brief.text}` : 'No brief yet.')
      }
    )

    server.registerTool(
      'search_memory_vault',
      {
        title: 'Search the Memory Vault',
        description: "Search the organization's Memory Vault (drafts, campaigns, strategies, press releases, decks, company documents) by keyword, optionally within a folder. Returns ids, titles, folders, types and a snippet.",
        inputSchema: z.object({ query: z.string().min(2), folder: z.string().optional(), limit: z.number().int().min(1).max(25).optional() }),
      },
      async ({ query, folder, limit }, ctx) => {
        const w = who(ctx)
        const admin = createServiceClient()
        const q = query.replace(/[%_,()]/g, ' ').trim()
        let req = admin
          .from('content_library')
          .select('id, title, folder, content_type, content, metadata, updated_at')
          .eq('organization_id', w.organizationId)
          .or(`title.ilike.%${q}%,content.ilike.%${q}%`)
          .order('updated_at', { ascending: false })
          .limit(50)
        if (folder) req = req.ilike('folder', `${folder}%`)
        const { data } = await req
        const out: any[] = []
        for (const item of data || []) {
          if (!(await canSeeVaultItem(admin, w, item))) continue
          const body = typeof item.content === 'string' ? item.content : JSON.stringify(item.content || '')
          const i = body.toLowerCase().indexOf(q.toLowerCase())
          out.push({ id: item.id, title: item.title, folder: item.folder, type: item.content_type, updated_at: item.updated_at, snippet: body.slice(Math.max(0, i - 120), i + 280).replace(/\s+/g, ' ').trim() })
          if (out.length >= (limit ?? 10)) break
        }
        return out.length ? json(out) : text('Nothing in the Memory Vault matches that.')
      }
    )

    server.registerTool(
      'read_memory_vault_item',
      {
        title: 'Read a Memory Vault item',
        description: 'Read one Memory Vault item (draft, campaign, deck text, company document) by id.',
        inputSchema: z.object({ id: z.string().uuid() }),
      },
      async ({ id }, ctx) => {
        const w = who(ctx)
        const admin = createServiceClient()
        const { data: item } = await admin.from('content_library').select('id, title, folder, content_type, content, metadata, updated_at').eq('id', id).eq('organization_id', w.organizationId).maybeSingle()
        if (!item || !(await canSeeVaultItem(admin, w, item))) return text('Not found, or not visible to you.')
        const body = typeof item.content === 'string' ? item.content : JSON.stringify(item.content, null, 2)
        return text(`${item.title}\nFolder: ${item.folder || '—'} · Type: ${item.content_type} · Updated: ${(item.updated_at || '').slice(0, 10)}\n\n${body.slice(0, 60000)}`)
      }
    )

    server.registerTool(
      'ask_niv',
      {
        title: 'Ask NIV',
        description: "Ask NIV, the organization's AI advisor, a question. NIV answers from the company's documents (with citations, respecting your permissions), its intelligence and current facts, and applies your saved preferences. Use for judgment calls (what's allowed, what we've done before, what to do next) rather than raw lookups. Pass conversation_id to continue a conversation. Answers are saved to your NIV history at /niv.",
        inputSchema: z.object({ question: z.string().min(2).max(6000), conversation_id: z.string().uuid().optional() }),
      },
      async ({ question, conversation_id }, ctx) => {
        const w = who(ctx)
        if (!w.scopes.includes('ask')) return text('This token is not allowed to ask NIV.')
        const admin = createServiceClient()

        const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString()
        const { data: myThreads } = await admin.from('advisor_threads').select('id').eq('user_id', w.userId)
        const { count } = await admin.from('advisor_messages').select('id', { count: 'exact', head: true })
          .in('thread_id', (myThreads || []).map((t: any) => t.id)).eq('role', 'user').gte('created_at', since)
        if ((count ?? 0) >= DAILY_ASK_LIMIT) return text("That's the daily limit for NIV questions. Try again tomorrow.")

        // Continue this person's conversation, or start one.
        let thread: any = null
        if (conversation_id) {
          const { data } = await admin.from('advisor_threads').select('*, advisor_case_files!inner(*)')
            .eq('user_id', w.userId).eq('organization_id', w.organizationId)
            .eq('advisor_case_files.subject_type', 'conversation').eq('advisor_case_files.subject_id', conversation_id).maybeSingle()
          thread = data
        }
        if (!thread) {
          const cid = randomUUID()
          const { data: cf } = await admin.from('advisor_case_files').insert({ organization_id: w.organizationId, subject_type: 'conversation', subject_id: cid }).select('*').single()
          const { data: th } = await admin.from('advisor_threads').insert({ organization_id: w.organizationId, user_id: w.userId, case_file_id: cf.id }).select('*').single()
          thread = { ...th, advisor_case_files: cf }
        }

        await addMessage(admin, thread, 'user', question, { via: 'mcp' })
        const [org, taste, history, me, { data: { user } }] = await Promise.all([
          loadOrg(admin, w.organizationId),
          loadTaste(admin, w.userId, w.organizationId),
          loadMessages(admin, thread.id, 30),
          admin.from('org_users').select('role, teams').eq('organization_id', w.organizationId).eq('user_id', w.userId).maybeSingle(),
          admin.auth.admin.getUserById(w.userId),
        ])
        if (!org) return text('Organization not found.')
        const turn = await runWorkspaceTurn({
          admin, user: { id: w.userId }, org, caseFile: thread.advisor_case_files, taste,
          person: { name: (user?.user_metadata as any)?.full_name || user?.email?.split('@')[0], role: me.data?.role, teams: me.data?.teams || [] },
          history: history.map((m: any) => ({ role: m.role, content: m.content })),
        })
        await addMessage(admin, thread, 'assistant', turn.reply, { via: 'mcp', ...(turn.sources.length && { doc_sources: turn.sources }) })
        if (turn.citedDocs.length) await admin.rpc('knowledge_touch', { p_ids: turn.citedDocs })

        const sources = turn.sources.map((s) => `- ${s.title}${s.version ? ` v${s.version}` : ''} (${s.status})`).join('\n')
        return text(`${turn.reply}${sources ? `\n\nSources:\n${sources}` : ''}\n\n(conversation_id: ${thread.advisor_case_files.subject_id}. Continue at /niv or pass it back to keep going.)`)
      }
    )
  },
  { serverInfo: { name: 'NIV', version: '1.0.0' } }
)

// Personal access token -> the person and org it acts for.
const authed = withMcpAuth(
  handler,
  async (_req, bearerToken) => {
    const p = await verifyAccessToken(createServiceClient(), bearerToken)
    if (!p) return undefined
    return {
      token: bearerToken!,
      clientId: p.tokenId,
      scopes: p.scopes,
      extra: { userId: p.userId, organizationId: p.organizationId, tokenId: p.tokenId, scopes: p.scopes },
    }
  },
  { required: true }
)

export { authed as GET, authed as POST, authed as DELETE }
