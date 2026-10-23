import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'

// Art: one captioned piece at a time, like "I got jokes". Tap for another; save the one you want.
// The point is the small moment of connecting the image to its title, not matching a mood.

interface Card { url: string; blob: Blob; title: string }

export default function ArtPage() {
  const [card, setCard] = useState<Card | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const current = useRef<string | null>(null)

  const next = async () => {
    setBusy(true)
    setError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not signed in')
      const r = await fetch('/api/art-card', { headers: { Authorization: `Bearer ${session.access_token}` } })
      if (!r.ok) throw new Error(r.status === 404 ? 'No art yet. Check back soon.' : 'Try again.')
      const blob = await r.blob()
      const title = decodeURIComponent(r.headers.get('X-Art-Title') || '')
      const url = URL.createObjectURL(blob)
      if (current.current) URL.revokeObjectURL(current.current)
      current.current = url
      setCard({ url, blob, title })
      setSaved(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Try again.')
    }
    setBusy(false)
  }

  useEffect(() => () => { if (current.current) URL.revokeObjectURL(current.current) }, [])

  // iPhone: the share sheet's "Save Image" puts it in Photos. Elsewhere: a plain download.
  const save = async () => {
    if (!card) return
    const name = `${(card.title || 'grounded').replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-').toLowerCase() || 'grounded'}.jpg`
    const file = new File([card.blob], name, { type: 'image/jpeg' })
    try {
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file] })
        setSaved(true)
        return
      }
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return
    }
    const a = document.createElement('a')
    a.href = card.url
    a.download = name
    a.click()
    setSaved(true)
  }

  return (
    <div className="space-y-4">
      {card && (
        <img
          src={card.url}
          alt={card.title}
          className="w-full max-w-xs mx-auto rounded-2xl shadow-sm aspect-[9/16] object-cover bg-stone-900"
        />
      )}

      <div className={`flex gap-2 ${card ? 'max-w-xs mx-auto' : ''}`}>
        <button onClick={next} disabled={busy} className="flex-1 py-2.5 bg-stone-700 text-white rounded-lg text-sm disabled:opacity-50">
          {busy ? '…' : card ? 'Another' : 'Show me one'}
        </button>
        {card && (
          <button onClick={save} className="flex-1 py-2.5 rounded-lg border border-stone-200 text-stone-600 text-sm bg-white">
            {saved ? 'Saved' : 'Save'}
          </button>
        )}
      </div>

      {error && <p className="text-xs text-stone-500 text-center">{error}</p>}
    </div>
  )
}
