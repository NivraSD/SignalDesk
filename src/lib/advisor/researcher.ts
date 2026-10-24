// The Researcher: a background specialist. It never talks to the person. It digs into one question
// (the org's own intel first, then the open web with Anthropic's server-side search/fetch), files
// structured findings in the case file, and NIV turns them into a follow-up in its own voice.
import Anthropic from '@anthropic-ai/sdk'
import { anthropic, nivFollowUp } from './niv'
import { Admin, addMessage, loadOpportunity, loadOrg, loadTaste, nowInWords, searchOrgIntel } from './data'

const RESEARCH_MODEL = 'claude-sonnet-5-5'
const MAX_ROUNDS = 8

type Finding = { answer: string; key_points: string[]; sources: { title: string; url: string }[]; open_questions?: string[] }

const CLIENT_TOOLS: Anthropic.Tool[] = [
  {
    name: 'search_org_intel',
    description: "Search the organization's own matched news (last 30 days). Check this first.",
    input_schema: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] },
  },
  {
    name: 'submit_findings',
    description: 'Submit your final findings. Call exactly once, when done.',
    input_schema: {
      type: 'object',
      properties: {
        answer: { type: 'string', description: 'Direct answer to the question in 2-4 sentences. Say plainly if evidence is thin.' },
        key_points: { type: 'array', items: { type: 'string' }, description: '3-6 specific, sourced facts' },
        sources: { type: 'array', items: { type: 'object', properties: { title: { type: 'string' }, url: { type: 'string' } }, required: ['title', 'url'] } },
        open_questions: { type: 'array', items: { type: 'string' } },
      },
      required: ['answer', 'key_points', 'sources'],
    },
  },
]
const SERVER_TOOLS = [
  { type: 'web_search_20260209', name: 'web_search', max_uses: 6 },
  { type: 'web_fetch_20260209', name: 'web_fetch', max_uses: 4 },
]

async function research(admin: Admin, organizationId: string, orgName: string, oppTitle: string, question: string, useWeb: boolean): Promise<Finding> {
  const messages: Anthropic.MessageParam[] = [{
    role: 'user',
    content: `Research question (for ${orgName}, regarding the opportunity "${oppTitle}"):\n${question}\n\nToday is ${nowInWords()}. Check the org's own intel first${useWeb ? ', then search and read the web for current, credible sources' : ''}. Prefer primary reporting and named sources; note dates. Don't speculate beyond the evidence. Finish by calling submit_findings once.`,
  }]
  for (let round = 0; round < MAX_ROUNDS; round++) {
    const response = (await anthropic.messages.create({
      model: RESEARCH_MODEL,
      max_tokens: 8000,
      tools: [...CLIENT_TOOLS, ...(useWeb ? SERVER_TOOLS : [])] as any,
      messages,
      output_config: { effort: 'medium' },
    } as any)) as Anthropic.Message

    if ((response.stop_reason as string) === 'pause_turn') {
      messages.push({ role: 'assistant', content: response.content })
      continue
    }
    const toolUses = response.content.filter((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use')
    const submit = toolUses.find((t) => t.name === 'submit_findings')
    if (submit) {
      const f = submit.input as Finding
      return {
        answer: String(f.answer || ''),
        key_points: Array.isArray(f.key_points) ? f.key_points.map(String).slice(0, 8) : [],
        sources: Array.isArray(f.sources) ? f.sources.filter((s) => s?.url).slice(0, 8) : [],
        open_questions: Array.isArray(f.open_questions) ? f.open_questions.map(String).slice(0, 4) : [],
      }
    }
    if (!toolUses.length) {
      // Answered in prose instead of submitting: take it as the answer.
      const text = response.content.filter((b): b is Anthropic.TextBlock => b.type === 'text').map((b) => b.text).join('\n').trim()
      return { answer: text.slice(0, 1500) || 'No clear answer found.', key_points: [], sources: [] }
    }
    messages.push({ role: 'assistant', content: response.content })
    const results: Anthropic.ToolResultBlockParam[] = []
    for (const tu of toolUses) {
      if (tu.name === 'search_org_intel') {
        const rows = await searchOrgIntel(admin, organizationId, String((tu.input as any)?.query || ''))
        results.push({ type: 'tool_result', tool_use_id: tu.id, content: rows.length ? JSON.stringify(rows) : 'No matches in the org\'s intel.' })
      } else {
        results.push({ type: 'tool_result', tool_use_id: tu.id, content: `Unknown tool ${tu.name}`, is_error: true })
      }
    }
    messages.push({ role: 'user', content: results })
  }
  throw new Error('Research did not finish')
}

// Runs one queued research job end to end. Safe to call from after(): never throws.
export async function runResearchJob(admin: Admin, jobId: string) {
  const { data: job } = await admin.from('advisor_jobs').select('*').eq('id', jobId).single()
  if (!job || job.status !== 'queued') return
  await admin.from('advisor_jobs').update({ status: 'running', started_at: new Date().toISOString() }).eq('id', jobId)

  const { data: thread } = await admin.from('advisor_threads').select('*').eq('id', job.thread_id).single()
  try {
    const { data: caseFile } = await admin.from('advisor_case_files').select('*').eq('id', job.case_file_id).single()
    const org = await loadOrg(admin, job.organization_id)
    const opp = await loadOpportunity(admin, job.organization_id, caseFile.subject_id)
    if (!org || !opp) throw new Error('Opportunity no longer available')
    const question = String(job.input?.question || '')

    let finding: Finding
    try {
      finding = await research(admin, org.id, org.name, opp.title, question, true)
    } catch (e) {
      // Web tools unavailable for this API key/org: fall back to the org's own intel.
      const msg = e instanceof Error ? e.message : String(e)
      if (!/web_search|web_fetch|tool/i.test(msg)) throw e
      console.warn('Researcher: web tools unavailable, using org intel only:', msg.slice(0, 200))
      finding = await research(admin, org.id, org.name, opp.title, question, false)
    }

    const entry = { at: new Date().toISOString(), by: 'researcher', question, ...finding }
    const findings = [...((caseFile.findings as any[]) || []), entry].slice(-30)
    const openQs = Array.from(new Set([...((caseFile.open_questions as string[]) || []), ...(finding.open_questions || [])])).slice(-10)
    await admin.from('advisor_case_files').update({ findings, open_questions: openQs, updated_at: new Date().toISOString() }).eq('id', caseFile.id)

    const taste = await loadTaste(admin, thread.user_id, org.id)
    const followUp = await nivFollowUp({ org, opp, caseFile: { ...caseFile, findings, open_questions: openQs }, taste, question, finding })
    await addMessage(admin, thread, 'assistant', followUp || finding.answer, { from: 'researcher', job_id: jobId, sources: finding.sources })
    await admin.from('advisor_jobs').update({ status: 'done', result: finding, finished_at: new Date().toISOString() }).eq('id', jobId)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('Research job failed:', msg)
    await admin.from('advisor_jobs').update({ status: 'failed', error: msg.slice(0, 500), finished_at: new Date().toISOString() }).eq('id', jobId)
    if (thread) {
      await addMessage(admin, thread, 'assistant', "I tried to dig into that but couldn't get a solid answer just now. Want me to try a narrower angle?", { from: 'researcher', job_id: jobId, failed: true })
    }
  }
}
