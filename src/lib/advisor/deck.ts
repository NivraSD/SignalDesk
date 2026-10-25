// Finishing a Gamma deck NIV started: check Gamma once; if it's done, record the links on the
// proposal message (exactly once, even if the server loop and an open chat check at the same time)
// and post NIV's "deck's ready" note into the conversation.
import { Admin } from './data'

export async function checkDeck(admin: Admin, organizationId: string, messageId: string) {
  const { data: msg } = await admin
    .from('advisor_messages')
    .select('id, meta, thread_id, advisor_threads!inner(id, organization_id)')
    .eq('id', messageId)
    .single()
  const deck = (msg as any)?.meta?.deck
  if (!msg || !deck) return null
  if (deck.status !== 'generating') return deck

  const g = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/gamma-presentation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}` },
    body: JSON.stringify({ generationId: deck.generation_id, capture: true, organization_id: organizationId, title: deck.title, campaign_folder: deck.folder }),
  })
  const s = await g.json().catch(() => ({}))
  const done = s.status === 'completed' || s.status === 'complete' || (s.gammaUrl && !['pending', 'processing'].includes(s.status))
  const stale = Date.now() - new Date(deck.started_at).getTime() > 10 * 60 * 1000
  if (!done && !stale && s.status !== 'failed' && s.status !== 'error') return deck

  let next: any
  if (done) {
    const { data: saved } = await admin
      .from('content_library')
      .select('id, metadata')
      .eq('organization_id', organizationId)
      .eq('metadata->>gamma_id', deck.generation_id)
      .maybeSingle()
    // File the vault copy where NIV said it would be (Gamma only honors folders for campaigns).
    if ((saved as any)?.id) await admin.from('content_library').update({ folder: deck.folder }).eq('id', (saved as any).id)
    next = {
      ...deck,
      status: 'ready',
      gamma_url: s.gammaUrl || s.exportUrls?.view || null,
      // Gamma's own link opens the deck (editable when signed in to Gamma); "/edit" isn't a Gamma route.
      edit_url: s.gammaUrl || null,
      pptx_url: (saved as any)?.metadata?.pptx_url || s.exportUrls?.pptx || null,
      content_id: (saved as any)?.id || null,
    }
  } else {
    next = { ...deck, status: 'failed' }
  }

  // Only the first checker to flip it from "generating" posts the note.
  const { data: flipped } = await admin
    .from('advisor_messages')
    .update({ meta: { ...(msg as any).meta, deck: next, ...(next.content_id && { drafted_content_id: next.content_id }) } })
    .eq('id', messageId)
    .eq('meta->deck->>status', 'generating')
    .select('id')
  // The proposal's card shows the result (Open in Gamma / PowerPoint / Studio, or a retry);
  // no separate completion message.
  void flipped
  return next
}

// Server-side follow-through after starting a deck, so the "ready" note arrives even if nobody
// keeps the chat open. Checks every 10s for up to ~4.5 minutes (an open chat keeps checking after).
export async function followDeck(admin: Admin, organizationId: string, messageId: string) {
  for (let i = 0; i < 27; i++) {
    await new Promise((r) => setTimeout(r, 10_000))
    const deck = await checkDeck(admin, organizationId, messageId).catch(() => null)
    if (!deck || deck.status !== 'generating') return
  }
}
