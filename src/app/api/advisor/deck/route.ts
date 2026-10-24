// Status of a deck NIV is building in Gamma.
//   GET /api/advisor/deck?organizationId=&messageId= -> { deck }
// While generating, checks Gamma (which captures the finished deck into the Memory Vault); when
// ready, records the links on the message and posts NIV's "deck's ready" note once.
import { NextRequest, NextResponse } from 'next/server'
import { HttpError, addMessage, requireMember } from '@/lib/advisor/data'

export const maxDuration = 120

export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams
    const organizationId = q.get('organizationId') || ''
    const { user, admin } = await requireMember(organizationId)
    const { data: msg } = await admin
      .from('advisor_messages')
      .select('id, meta, thread_id, advisor_threads!inner(id, user_id, organization_id)')
      .eq('id', q.get('messageId') || '')
      .single()
    const thread = (msg as any)?.advisor_threads
    const deck = (msg as any)?.meta?.deck
    if (!msg || !thread || thread.user_id !== user.id || thread.organization_id !== organizationId || !deck) throw new HttpError(404, 'No deck here')
    if (deck.status !== 'generating') return NextResponse.json({ deck })

    const g = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/gamma-presentation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}` },
      body: JSON.stringify({ generationId: deck.generation_id, capture: true, organization_id: organizationId, title: deck.title, campaign_folder: deck.folder }),
    })
    const s = await g.json().catch(() => ({}))
    const done = s.status === 'completed' || s.status === 'complete' || (s.gammaUrl && !['pending', 'processing'].includes(s.status))
    if (!done) {
      const stale = Date.now() - new Date(deck.started_at).getTime() > 8 * 60 * 1000
      if (!stale && s.status !== 'failed' && s.status !== 'error') return NextResponse.json({ deck })
      const failed = { ...deck, status: 'failed' }
      await admin.from('advisor_messages').update({ meta: { ...(msg as any).meta, deck: failed } }).eq('id', msg.id)
      return NextResponse.json({ deck: failed })
    }

    // The captured Memory Vault copy (for Studio), if Gamma's capture saved one.
    const { data: saved } = await admin
      .from('content_library')
      .select('id, metadata')
      .eq('organization_id', organizationId)
      .eq('metadata->>gamma_id', deck.generation_id)
      .maybeSingle()
    // File the vault copy where NIV said it would be (Gamma only honors folders for campaigns).
    if ((saved as any)?.id) await admin.from('content_library').update({ folder: deck.folder }).eq('id', (saved as any).id)
    const ready = {
      ...deck,
      status: 'ready',
      gamma_url: s.gammaUrl || s.exportUrls?.view || null,
      edit_url: s.exportUrls?.edit || (s.gammaUrl ? `${s.gammaUrl}/edit` : null),
      pptx_url: (saved as any)?.metadata?.pptx_url || s.exportUrls?.pptx || null,
      content_id: (saved as any)?.id || null,
    }
    await admin.from('advisor_messages').update({ meta: { ...(msg as any).meta, deck: ready, ...(ready.content_id && { drafted_content_id: ready.content_id }) } }).eq('id', msg.id)
    await addMessage(admin, { id: thread.id, organization_id: organizationId }, 'assistant', `Your deck is ready: **${ready.title}**. Open it in Gamma to edit the design${ready.pptx_url ? ', or download the PowerPoint' : ''}. It's also saved in the Memory Vault under ${ready.folder}.`, { deck_ready: ready })
    return NextResponse.json({ deck: ready })
  } catch (e) {
    if (e instanceof HttpError) return NextResponse.json({ error: e.message }, { status: e.status })
    console.error('advisor deck error:', e)
    return NextResponse.json({ error: 'Could not check the deck.' }, { status: 500 })
  }
}
