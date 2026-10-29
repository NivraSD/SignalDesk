// Opportunity decks written by NIV. NIV writes the storyline (from the opportunity, the content
// already generated for it, the company's brand rules and profile), then Gamma designs the deck.
//   POST /api/opportunities/deck { organizationId, opportunityId, folder } -> { generationId, title, slideCount }
// The caller polls gamma-presentation for the result, as before. Replaces the fixed template in
// supabase/functions/_shared/opportunity-to-gamma.ts, which poured fields into the same 12 slides.
import { NextRequest, NextResponse } from 'next/server'
import { HttpError, describeOpportunityFull, loadOpportunity, loadOrg, requireMember } from '@/lib/advisor/data'
import { knowledgeSearch } from '@/lib/advisor/workspace'
import { writeWithNiv } from '@/lib/advisor/niv'

export const maxDuration = 300

function fail(e: unknown) {
  if (e instanceof HttpError) return NextResponse.json({ error: e.message }, { status: e.status })
  console.error('opportunity deck error:', e)
  return NextResponse.json({ error: "Couldn't build the deck just now. Try again." }, { status: 500 })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const organizationId = String(body.organizationId || '')
    const { user, admin } = await requireMember(organizationId)
    const [opp, org] = await Promise.all([
      loadOpportunity(admin, organizationId, String(body.opportunityId || '')),
      loadOrg(admin, organizationId),
    ])
    if (!opp || !org) throw new HttpError(404, 'Opportunity not found')
    const folder = String(body.folder || `Opportunities/${opp.title}`).slice(0, 300)

    // What's already been generated for it (so the deck names the real pieces), and brand rules.
    const [{ data: pieces }, brand] = await Promise.all([
      admin.from('content_library').select('title, content_type, content').eq('organization_id', organizationId)
        .ilike('folder', `${folder.replace(/[%_]/g, '')}%`).neq('content_type', 'presentation').order('created_at').limit(20),
      knowledgeSearch(organizationId, user.id, 'brand guidelines voice naming rules words we do not use', 4).catch(() => []),
    ])
    const contentList = (pieces || [])
      .filter((p: any) => !/^Phase \d+:.*Strategy$/.test(p.title || ''))
      .map((p: any) => `- ${p.content_type}: "${p.title}" (opens: ${String(p.content || '').replace(/\s+/g, ' ').slice(0, 160)}...)`)
      .join('\n')
    const profile = org.company_profile || {}

    const outline = await writeWithNiv(
      `You are a senior communications strategist at ${org.name}. You build decks that make a leadership team decide and act: a clear storyline, specific evidence, no filler.`,
      `Build the deck for this opportunity.

Opportunity:
${describeOpportunityFull(opp)}

${contentList ? `Content already written for it (refer to these by their exact titles; don't invent other pieces):\n${contentList}\n` : 'No content has been written yet; describe the planned pieces from the opportunity\'s content plan by their planned titles.\n'}
About ${org.name}: ${profile.description || org.industry || ''}
${profile.offering?.what ? `What they sell: ${profile.offering.what}` : ''}
${brand.length ? `\nBrand rules for the wording (product naming, voice, words not to use; ignore visual rules like colors and fonts, Gamma handles design):\n${brand.map((b: any) => `- ${String(b.content).replace(/\s+/g, ' ').slice(0, 400)}`).join('\n')}` : ''}

Write it as Markdown for a slide generator: start with "# <deck title>" (specific, not "Opportunity: ..."), then one slide per section starting with "## <slide headline as a full-sentence takeaway>", 3-5 tight bullets, and a line "Speaker notes: ..." Separate slides with a line containing only "---". 7-10 slides.
Tell it as a story, in roughly this order, merging or skipping what doesn't apply:
1. What happened (the trigger, with the source outlet and date) and why it matters to ${org.name}
2. The opportunity and our angle: what we can credibly say that others can't
3. Targets & urgency: urgency level and what closes the window; audiences; outlets and reporters
4. The content: each piece by its exact title, what it does and for whom
5. The plan: what happens today, this week, after
6. Risk if we wait, and what we need decided (owner, approvals)
Use only facts from the opportunity and the content; mark anything missing as [PLACEHOLDER: ...]. No success-metrics slide, no stock durations like "3-5 days", no repeated slides. Keep internal notes in speaker notes, not on slides.`
    )
    if (!outline) throw new HttpError(502, "Couldn't write the deck just now. Try again.")
    const title = (outline.match(/^#\s+(.+)$/m)?.[1] || opp.title).slice(0, 120)
    const slideCount = Math.min(Math.max((outline.match(/^##\s/gm) || []).length || 8, 4), 12)

    const g = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/gamma-presentation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}` },
      body: JSON.stringify({
        title, content: outline, format: 'presentation', slideCount,
        capture: false, organization_id: organizationId, campaign_folder: folder,
        options: { imageSource: 'ai', cardSplit: 'inputTextBreaks' },
      }),
    })
    const gj = await g.json().catch(() => ({}))
    if (!g.ok || !gj.generationId) throw new HttpError(502, gj.error || "Gamma couldn't start the deck. Try again.")
    return NextResponse.json({ generationId: gj.generationId, title, slideCount, outline })
  } catch (e) {
    return fail(e)
  }
}
