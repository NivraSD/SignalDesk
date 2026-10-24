'use client'

// A deck NIV is building in Gamma: "building…" while it generates (polls the status route), then
// links to Gamma, the PowerPoint download and the Memory Vault copy.
import React, { useEffect, useState } from 'react'
import { Loader2, ExternalLink, Download, Presentation } from 'lucide-react'

export default function DeckCard({ organizationId, messageId, deck: initial, onReady, onOpenInStudio }: {
  organizationId: string
  messageId: string
  deck: any
  onReady?: () => void
  onOpenInStudio?: (contentId: string) => void
}) {
  const [deck, setDeck] = useState(initial)
  useEffect(() => setDeck(initial), [initial])

  useEffect(() => {
    if (deck?.status !== 'generating') return
    let stop = false
    const tick = async () => {
      const r = await fetch(`/api/advisor/deck?organizationId=${organizationId}&messageId=${messageId}`)
      const j = await r.json().catch(() => ({}))
      if (stop || !j.deck) return
      setDeck(j.deck)
      if (j.deck.status !== 'generating') onReady?.()
    }
    const t = setInterval(tick, 6000)
    tick()
    return () => { stop = true; clearInterval(t) }
  }, [deck?.status, organizationId, messageId, onReady])

  if (!deck) return null
  return (
    <div className="rounded-lg border border-[var(--grey-700)] p-3 space-y-2">
      <div className="text-xs text-[var(--grey-400)] flex items-center gap-1.5">
        <Presentation className="w-3.5 h-3.5 text-[var(--burnt-orange)]" /> {deck.title}
      </div>
      {deck.status === 'generating' && (
        // The Draft it button keeps spinning until the deck is back.
        <button disabled className="text-xs px-3 py-1.5 rounded-md bg-[var(--burnt-orange)] text-white inline-flex items-center gap-1.5 opacity-80 cursor-wait">
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Drafting…
        </button>
      )}
      {deck.status === 'failed' && <div className="text-xs text-red-400">Gamma couldn't finish this deck. Click Draft it again to retry.</div>}
      {deck.status === 'ready' && (
        <div className="flex flex-wrap gap-2">
          {deck.gamma_url && (
            <a href={deck.gamma_url} target="_blank" rel="noopener noreferrer" className="text-xs px-3 py-1.5 rounded-md bg-[var(--burnt-orange)] text-white inline-flex items-center gap-1.5">
              <ExternalLink className="w-3.5 h-3.5" /> Open in Gamma
            </a>
          )}
          {deck.pptx_url && (
            <a href={deck.pptx_url} target="_blank" rel="noopener noreferrer" className="text-xs px-3 py-1.5 rounded-md bg-[var(--grey-800)] text-white inline-flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5" /> Download PowerPoint
            </a>
          )}
          {deck.content_id && onOpenInStudio && (
            <button onClick={() => onOpenInStudio(deck.content_id)} className="text-xs px-3 py-1.5 rounded-md bg-[var(--grey-800)] text-white inline-flex items-center gap-1.5">
              <ExternalLink className="w-3.5 h-3.5" /> Open in Studio
            </button>
          )}
        </div>
      )}
    </div>
  )
}
