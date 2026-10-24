// NIV advisor v1 (opportunity view).
//   GET  /api/advisor?organizationId=&opportunityId=  -> { thread, messages, caseFile, jobs, taste }
//   POST /api/advisor { organizationId, opportunityId, message } -> { messages: [user, assistant], jobs }
// Signed-in org members only. Conversation history lives in the database (never trusted from the
// client). Research NIV hands off runs after the response (next/server after()), and its result
// arrives as a new message (the panel listens via Realtime and polls while a job is running).
import { NextRequest, NextResponse, after } from 'next/server'
import {
  HttpError, addMessage, getOrCreateCaseFile, getOrCreateThread, loadMessages, loadOpportunity, loadOrg, loadTaste, requireMember,
} from '@/lib/advisor/data'
import { runNivTurn } from '@/lib/advisor/niv'
import { runResearchJob } from '@/lib/advisor/researcher'

export const maxDuration = 300

const MAX_MESSAGE_CHARS = 4000
const DAILY_MESSAGES_PER_USER = 150
const MAX_ACTIVE_JOBS_PER_THREAD = 2

function fail(e: unknown) {
  if (e instanceof HttpError) return NextResponse.json({ error: e.message }, { status: e.status })
  console.error('advisor error:', e)
  return NextResponse.json({ error: 'Something went wrong. Try again.' }, { status: 500 })
}

// History only stores what NIV said; append what it *did* that turn so it doesn't forget its own
// actions (and redo or disown them) on the next turn.
function withActions(m: { role: string; content: string; meta?: any }) {
  if (m.role !== 'assistant' || !m.meta) return m.content
  const done: string[] = []
  if (m.meta.taste_saved?.length) done.push(`saved taste notes: ${m.meta.taste_saved.join('; ')}`)
  if (m.meta.proposal) done.push(`offered a "Draft it" button for a ${m.meta.proposal.content_type}: ${m.meta.proposal.angle}${m.meta.drafted_content_id ? ' (they clicked it; the draft was created)' : ''}`)
  if (m.meta.job_ids?.length) done.push('started looking into a question (findings arrive as a later message)')
  if (m.meta.from === 'researcher') done.push('this message reported findings from looking into a question')
  return done.length ? `${m.content}\n\n[What I did in this turn: ${done.join(' | ')}]` : m.content
}

async function setup(organizationId: string, opportunityId: string) {
  const { user, admin } = await requireMember(organizationId)
  const opp = await loadOpportunity(admin, organizationId, opportunityId)
  if (!opp) throw new HttpError(404, 'Opportunity not found')
  const caseFile = await getOrCreateCaseFile(admin, organizationId, opp.id)
  const thread = await getOrCreateThread(admin, organizationId, user.id, caseFile.id)
  return { user, admin, opp, caseFile, thread }
}

export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams
    const { user, admin, caseFile, thread } = await setup(q.get('organizationId') || '', q.get('opportunityId') || '')
    const [messages, jobsRes, taste] = await Promise.all([
      loadMessages(admin, thread.id),
      admin.from('advisor_jobs').select('id, status, input, created_at').eq('thread_id', thread.id).in('status', ['queued', 'running']),
      loadTaste(admin, user.id, thread.organization_id),
    ])
    return NextResponse.json({ thread: { id: thread.id }, messages, caseFile, jobs: jobsRes.data || [], taste })
  } catch (e) {
    return fail(e)
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const message = typeof body.message === 'string' ? body.message.trim() : ''
    if (!message) throw new HttpError(400, 'Empty message')
    if (message.length > MAX_MESSAGE_CHARS) throw new HttpError(413, `Keep messages under ${MAX_MESSAGE_CHARS} characters.`)

    const { user, admin, opp, caseFile, thread } = await setup(String(body.organizationId || ''), String(body.opportunityId || ''))

    // Daily cap per person (all threads).
    const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString()
    const { data: myThreads } = await admin.from('advisor_threads').select('id').eq('user_id', user.id)
    const { count } = await admin
      .from('advisor_messages')
      .select('id', { count: 'exact', head: true })
      .in('thread_id', (myThreads || []).map((t: { id: string }) => t.id))
      .eq('role', 'user')
      .gte('created_at', since)
    if ((count ?? 0) >= DAILY_MESSAGES_PER_USER) throw new HttpError(429, "That's the limit for today. Let's pick this up tomorrow.")

    const userMsg = await addMessage(admin, thread, 'user', message)
    const [org, taste, history] = await Promise.all([
      loadOrg(admin, thread.organization_id),
      loadTaste(admin, user.id, thread.organization_id),
      loadMessages(admin, thread.id, 30),
    ])
    if (!org) throw new HttpError(404, 'Organization not found')

    const turn = await runNivTurn({
      admin, user, org, opp, caseFile, taste,
      history: history.map((m: any) => ({ role: m.role, content: withActions(m) })),
    })

    // Queue research NIV handed off (capped per thread), run after responding.
    const { count: active } = await admin
      .from('advisor_jobs')
      .select('id', { count: 'exact', head: true })
      .eq('thread_id', thread.id)
      .in('status', ['queued', 'running'])
    const jobs: { id: string; status: string; input: any }[] = []
    for (const r of (turn.research || []).slice(0, Math.max(0, MAX_ACTIVE_JOBS_PER_THREAD - (active ?? 0)))) {
      const { data: job } = await admin
        .from('advisor_jobs')
        .insert({ organization_id: thread.organization_id, thread_id: thread.id, case_file_id: caseFile.id, kind: 'research', input: { question: r.question } })
        .select('id, status, input')
        .single()
      if (job) jobs.push(job)
    }

    const assistantMsg = await addMessage(admin, thread, 'assistant', turn.reply, {
      ...(turn.proposal && { proposal: turn.proposal }),
      ...(jobs.length && { job_ids: jobs.map((j) => j.id) }),
      ...(turn.tasteSaved?.length && { taste_saved: turn.tasteSaved }),
    })

    if (jobs.length) {
      after(async () => {
        for (const j of jobs) await runResearchJob(admin, j.id)
      })
    }

    return NextResponse.json({ messages: [userMsg, assistantMsg], jobs })
  } catch (e) {
    return fail(e)
  }
}
