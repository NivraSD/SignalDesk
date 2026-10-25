// "Draft it": turns a draft NIV proposed into real content, saved to the Memory Vault under the
// opportunity's folder, so it can be opened and edited in Studio.
//   POST /api/advisor/draft { organizationId, messageId } -> { content: {id,title,content_type,content,folder,metadata} }
// The proposal is read from the stored message (not the request), and only from the caller's own thread.
import { NextRequest, NextResponse, after } from 'next/server'
import { followDeck } from '@/lib/advisor/deck'
import Anthropic from '@anthropic-ai/sdk'
import { HttpError, addMessage, describeCaseFile, describeOpportunity, loadOpportunity, loadOrg, loadTaste, requireMember } from '@/lib/advisor/data'
import { anthropic, NIV_MODEL, WRITING_RULES } from '@/lib/advisor/niv'

export const maxDuration = 300

const LABELS: Record<string, string> = {
  'media-pitch': 'Media pitch', 'press-release': 'Press release', 'thought-leadership': 'Thought leadership',
  'social-post': 'Social post', 'blog-post': 'Blog post', email: 'Email', 'talking-points': 'Talking points', 'one-pager': 'One-pager', memo: 'Memo', presentation: 'Presentation',
}

// NIV's writer drafts directly: it has the case file (verified findings), the person's taste and the
// brand voice. (niv-content-intelligent-v2 stays in Studio for edits; called one-shot from here it
// ignores the brief and fills its own template.)
async function draftWithNiv(system: string, prompt: string): Promise<string> {
  const response = (await anthropic.messages.create({
    model: NIV_MODEL,
    max_tokens: 8000,
    system: `${system}\n\n${WRITING_RULES}`,
    messages: [{ role: 'user', content: prompt }],
    output_config: { effort: 'medium' },
  } as any)) as Anthropic.Message
  return response.content.filter((b): b is Anthropic.TextBlock => b.type === 'text').map((b) => b.text).join('\n').trim()
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const organizationId = String(body.organizationId || '')
    const { user, admin } = await requireMember(organizationId)

    const { data: msg } = await admin
      .from('advisor_messages')
      .select('id, meta, thread_id, advisor_threads!inner(id, user_id, organization_id, case_file_id)')
      .eq('id', String(body.messageId || ''))
      .single()
    const thread = (msg as any)?.advisor_threads
    const proposal = (msg as any)?.meta?.proposal
    if (!msg || !thread || thread.user_id !== user.id || thread.organization_id !== organizationId || !proposal) {
      throw new HttpError(404, 'Nothing to draft')
    }
    // A deck already started (or finished) for this proposal: return it rather than starting another.
    if ((msg as any).meta?.deck && (msg as any).meta.deck.status !== 'failed') {
      return NextResponse.json({ deck: (msg as any).meta.deck })
    }
    if ((msg as any).meta?.drafted_content_id && !(msg as any).meta?.deck) {
      const { data: existing } = await admin.from('content_library').select('id, title, content_type, content, folder, metadata').eq('id', (msg as any).meta.drafted_content_id).single()
      if (existing) return NextResponse.json({ content: existing })
    }

    const { data: caseFile } = await admin.from('advisor_case_files').select('*').eq('id', thread.case_file_id).single()
    // Opportunity threads draft for the opportunity; workspace conversations draft from the conversation.
    const opp = caseFile.subject_type === 'opportunity' ? await loadOpportunity(admin, organizationId, caseFile.subject_id) : null
    const org = await loadOrg(admin, organizationId)
    if (!org || (caseFile.subject_type === 'opportunity' && !opp)) throw new HttpError(404, 'Not found')
    const { data: recent } = await admin.from('advisor_messages').select('role, content').eq('thread_id', thread.id).order('created_at', { ascending: false }).limit(8)
    const conversation = (recent || []).reverse().map((m: any) => `${m.role === 'user' ? 'Them' : 'NIV'}: ${m.content}`).join('\n\n').slice(0, 8000)
    const taste = await loadTaste(admin, user.id, organizationId)

    const label = LABELS[proposal.content_type] || proposal.content_type
    const brief = `Write a ${label.toLowerCase()} for ${org.name}.
Angle: ${proposal.angle}
${proposal.notes ? `Notes: ${proposal.notes}\n` : ''}
${opp ? `Opportunity:\n${describeOpportunity(opp)}` : `The conversation it comes from (use its facts and citations; keep citations to company documents where they support a point):\n${conversation}`}

Verified findings to draw on (use only facts that appear here or in the opportunity; don't invent statistics, quotes, or names):
${describeCaseFile(caseFile)}
${taste.length ? `\nThe author's taste (follow it):\n${taste.map((t) => `- ${t}`).join('\n')}` : ''}
${org.company_profile?.brand_voice ? `\nBrand voice: ${JSON.stringify(org.company_profile.brand_voice).slice(0, 1000)}` : ''}

Return only the finished ${label.toLowerCase()}, ready to edit, in light Markdown (a title line, at most a few ## section headings, normal paragraphs; no ### sub-headings, no decorative italics). Mark anything that needs a real name, quote, or number as [PLACEHOLDER: …].
${['thought-leadership', 'press-release', 'blog-post', 'media-pitch', 'social-post'].includes(proposal.content_type)
  ? 'This will be published, so keep internal document citations OUT of the body. End with a short section "## Internal notes (remove before publishing)" listing the internal sources the piece relies on and any sign-offs needed.'
  : 'This is internal, so cite company documents inline like [Doc vX §section].'}`

    // Presentations: NIV writes the storyline as slide-by-slide markdown, then Gamma designs the
    // deck (and exports PowerPoint). The chat polls /api/advisor/deck until it's ready.
    if (proposal.content_type === 'presentation') {
      const outline = (await draftWithNiv(
        `You are a senior strategist at ${org.name} who builds clear, persuasive decks.`,
        `${brief}\n\nWrite the deck as Markdown for a slide generator: start with "# <deck title>", then one slide per section, each starting with "## <slide headline as a full-sentence takeaway>", 3-5 tight bullets, and a line "Speaker notes: ..." Separate slides with a line containing only "---". Usually 6-10 slides. Keep citations to company documents in the speaker notes, not on the slides.`
      )).trim()
      if (!outline) throw new HttpError(502, "Couldn't write the deck just now. Try again.")
      const deckTitle = (outline.match(/^#\s+(.+)$/m)?.[1] || proposal.angle).slice(0, 120)
      const slideCount = Math.min(Math.max((outline.match(/^##\s/gm) || []).length || 8, 3), 15)
      const folder = opp ? `Opportunities/${opp.title}`.slice(0, 200) : 'NIV/Decks'
      const g = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/gamma-presentation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}` },
        body: JSON.stringify({
          title: deckTitle, content: outline, format: 'presentation', slideCount,
          capture: true, organization_id: organizationId, campaign_folder: folder,
          options: { imageSource: 'ai', cardSplit: 'inputTextBreaks' },
        }),
      })
      const gj = await g.json().catch(() => ({}))
      if (!g.ok || !gj.generationId) throw new HttpError(502, gj.error || "Gamma couldn't start the deck. Try again.")
      const deck = { generation_id: gj.generationId, status: 'generating', title: deckTitle, folder, outline, started_at: new Date().toISOString() }
      await admin.from('advisor_messages').update({ meta: { ...(msg as any).meta, deck } }).eq('id', msg.id)
      await addMessage(admin, { id: thread.id, organization_id: organizationId }, 'assistant',
        `On it. I'm building **${deckTitle}** in Gamma (${slideCount} slides). It takes a few minutes; the card above will switch to the finished deck when it's ready, so feel free to keep working.`,
        { deck_started: deck.generation_id })
      after(() => followDeck(admin, organizationId, msg.id))
      return NextResponse.json({ deck })
    }

    const text = (await draftWithNiv(`You are a senior communications writer for ${org.name}. You write tight, specific, human copy with no filler and no clichés.`, brief)).trim()
    if (!text) throw new HttpError(502, "Couldn't write the draft just now. Try again.")

    const folder = opp ? `Opportunities/${opp.title}`.slice(0, 200) : 'NIV/Drafts'
    const shortAngle = proposal.angle.length > 70 ? `${proposal.angle.slice(0, 70).replace(/\s+\S*$/, '')}…` : proposal.angle
    const title = `${label}: ${shortAngle}`
    const { data: saved, error } = await admin
      .from('content_library')
      .insert({
        organization_id: organizationId,
        content_type: proposal.content_type,
        title,
        content: text,
        folder,
        status: 'draft',
        created_by: user.id,
        metadata: { source: 'niv-advisor', opportunity_id: opp?.id ?? null, advisor_message_id: msg.id, angle: proposal.angle },
      })
      .select('id, title, content_type, content, folder, metadata')
      .single()
    if (error) throw error

    await admin.from('advisor_messages').update({ meta: { ...(msg as any).meta, drafted_content_id: saved.id } }).eq('id', msg.id)
    // The proposal's card shows the finished draft (Open in Studio); no separate completion message.
    return NextResponse.json({ content: saved })
  } catch (e) {
    if (e instanceof HttpError) return NextResponse.json({ error: e.message }, { status: e.status })
    console.error('advisor draft error:', e)
    return NextResponse.json({ error: "Couldn't create the draft. Try again." }, { status: 500 })
  }
}
