// NIV workspace (the company's second brain).
//   GET  /api/niv-workspace?organizationId=                      -> { conversations: [{id, title, updated_at}] }
//   GET  /api/niv-workspace?organizationId=&conversationId=       -> { messages, jobs }
//   POST /api/niv-workspace { organizationId, conversationId?, message } -> { conversationId, messages, jobs }
// Signed-in org members only. Each conversation is a case file (subject_type 'conversation') with a
// thread; history lives server-side. Research NIV hands off runs after the response.
import { NextRequest, NextResponse, after } from 'next/server'
import { randomUUID } from 'crypto'
import { HttpError, addMessage, loadMessages, loadOrg, loadTaste, requireMember } from '@/lib/advisor/data'
import { runWorkspaceTurn } from '@/lib/advisor/workspace'
import { runResearchJob } from '@/lib/advisor/researcher'

export const maxDuration = 300

const MAX_MESSAGE_CHARS = 6000
const DAILY_MESSAGES_PER_USER = 200

function fail(e: unknown) {
  if (e instanceof HttpError) return NextResponse.json({ error: e.message }, { status: e.status })
  console.error('niv-workspace error:', e)
  return NextResponse.json({ error: 'Something went wrong. Try again.' }, { status: 500 })
}

function withActions(m: { role: string; content: string; meta?: any }) {
  if (m.role !== 'assistant' || !m.meta) return m.content
  const done: string[] = []
  if (m.meta.taste_saved?.length) done.push(`saved taste notes: ${m.meta.taste_saved.join('; ')}`)
  if (m.meta.proposal) done.push(`offered a "Draft it" button for a ${m.meta.proposal.content_type}: ${m.meta.proposal.angle}${m.meta.drafted_content_id ? ' (they clicked it; the draft was created)' : ''}`)
  if (m.meta.job_ids?.length) done.push('started looking into a question (findings arrive as a later message)')
  if (m.meta.from === 'researcher') done.push('this message reported findings from looking into a question')
  return done.length ? `${m.content}\n\n[What I did in this turn: ${done.join(' | ')}]` : m.content
}

async function myConversation(admin: any, userId: string, organizationId: string, conversationId: string) {
  const { data: thread } = await admin
    .from('advisor_threads')
    .select('*, advisor_case_files!inner(*)')
    .eq('user_id', userId)
    .eq('organization_id', organizationId)
    .eq('advisor_case_files.subject_type', 'conversation')
    .eq('advisor_case_files.subject_id', conversationId)
    .maybeSingle()
  return thread
}

export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams
    const organizationId = q.get('organizationId') || ''
    const { user, admin } = await requireMember(organizationId)
    const conversationId = q.get('conversationId')

    if (!conversationId) {
      const { data: threads } = await admin
        .from('advisor_threads')
        .select('id, updated_at, advisor_case_files!inner(subject_id, subject_type)')
        .eq('user_id', user.id)
        .eq('organization_id', organizationId)
        .eq('advisor_case_files.subject_type', 'conversation')
        .order('updated_at', { ascending: false })
        .limit(50)
      const ids = (threads || []).map((t: any) => t.id)
      const { data: firsts } = ids.length
        ? await admin.from('advisor_messages').select('thread_id, content, created_at').in('thread_id', ids).eq('role', 'user').order('created_at', { ascending: true })
        : { data: [] as any[] }
      const titleOf: Record<string, string> = {}
      for (const m of firsts || []) if (!titleOf[m.thread_id]) titleOf[m.thread_id] = m.content.slice(0, 80)
      return NextResponse.json({
        conversations: (threads || []).map((t: any) => ({ id: t.advisor_case_files.subject_id, title: titleOf[t.id] || 'New conversation', updated_at: t.updated_at })),
      })
    }

    const thread = await myConversation(admin, user.id, organizationId, conversationId)
    if (!thread) throw new HttpError(404, 'Conversation not found')
    const [messages, jobsRes] = await Promise.all([
      loadMessages(admin, thread.id, 80),
      admin.from('advisor_jobs').select('id, status, input, created_at').eq('thread_id', thread.id).in('status', ['queued', 'running']),
    ])
    return NextResponse.json({ messages, jobs: jobsRes.data || [] })
  } catch (e) {
    return fail(e)
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const organizationId = String(body.organizationId || '')
    const message = typeof body.message === 'string' ? body.message.trim() : ''
    if (!message) throw new HttpError(400, 'Empty message')
    if (message.length > MAX_MESSAGE_CHARS) throw new HttpError(413, `Keep messages under ${MAX_MESSAGE_CHARS} characters.`)
    const { user, admin } = await requireMember(organizationId)

    // Daily cap per person across NIV.
    const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString()
    const { data: myThreads } = await admin.from('advisor_threads').select('id').eq('user_id', user.id)
    const { count } = await admin.from('advisor_messages').select('id', { count: 'exact', head: true })
      .in('thread_id', (myThreads || []).map((t: { id: string }) => t.id)).eq('role', 'user').gte('created_at', since)
    if ((count ?? 0) >= DAILY_MESSAGES_PER_USER) throw new HttpError(429, "That's the limit for today. Let's pick this up tomorrow.")

    // Existing conversation, or a new one.
    let conversationId = typeof body.conversationId === 'string' && body.conversationId ? body.conversationId : null
    let thread = conversationId ? await myConversation(admin, user.id, organizationId, conversationId) : null
    if (conversationId && !thread) throw new HttpError(404, 'Conversation not found')
    if (!thread) {
      conversationId = randomUUID()
      const { data: cf, error: e1 } = await admin.from('advisor_case_files')
        .insert({ organization_id: organizationId, subject_type: 'conversation', subject_id: conversationId }).select('*').single()
      if (e1) throw e1
      const { data: th, error: e2 } = await admin.from('advisor_threads')
        .insert({ organization_id: organizationId, user_id: user.id, case_file_id: cf.id }).select('*').single()
      if (e2) throw e2
      thread = { ...th, advisor_case_files: cf }
    }
    const caseFile = thread.advisor_case_files

    const userMsg = await addMessage(admin, thread, 'user', message)
    const [org, taste, history, me] = await Promise.all([
      loadOrg(admin, organizationId),
      loadTaste(admin, user.id, organizationId),
      loadMessages(admin, thread.id, 30),
      admin.from('org_users').select('role, teams').eq('organization_id', organizationId).eq('user_id', user.id).maybeSingle(),
    ])
    if (!org) throw new HttpError(404, 'Organization not found')

    const turn = await runWorkspaceTurn({
      admin, user, org, caseFile, taste,
      person: { name: (user.user_metadata as any)?.full_name || user.email?.split('@')[0], role: me.data?.role, teams: me.data?.teams || [] },
      history: history.map((m: any) => ({ role: m.role, content: withActions(m) })),
    })

    const jobs: { id: string; status: string; input: any }[] = []
    for (const r of (turn.research || []).slice(0, 2)) {
      const { data: job } = await admin.from('advisor_jobs')
        .insert({ organization_id: organizationId, thread_id: thread.id, case_file_id: caseFile.id, kind: 'research', input: { question: r.question } })
        .select('id, status, input').single()
      if (job) jobs.push(job)
    }

    const assistantMsg = await addMessage(admin, thread, 'assistant', turn.reply, {
      ...(turn.sources.length && { doc_sources: turn.sources }),
      ...(turn.proposal && { proposal: turn.proposal }),
      ...(jobs.length && { job_ids: jobs.map((j) => j.id) }),
      ...(turn.tasteSaved?.length && { taste_saved: turn.tasteSaved }),
    })

    // Documents NIV actually cited count as used (salience boost); research runs after responding.
    if (turn.citedDocs.length) await admin.rpc('knowledge_touch', { p_ids: turn.citedDocs })
    if (jobs.length) after(async () => { for (const j of jobs) await runResearchJob(admin, j.id) })

    return NextResponse.json({ conversationId, messages: [userMsg, assistantMsg], jobs })
  } catch (e) {
    return fail(e)
  }
}
