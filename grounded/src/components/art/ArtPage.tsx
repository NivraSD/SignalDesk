import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import LockScreenArt from '@/components/settings/LockScreenArt'

// Art: one captioned piece at a time, like "I got jokes". Tap for another.
// The point is the small moment of connecting the image to its title, not matching a mood.

interface Card { url: string; title: string }

export default function ArtPage() {
  const [card, setCard] = useState<Card | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
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
      setCard({ url, title })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Try again.')
    }
    setBusy(false)
  }

  useEffect(() => () => { if (current.current) URL.revokeObjectURL(current.current) }, [])


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
      </div>

      {error && <p className="text-xs text-stone-500 text-center">{error}</p>}

      <LockScreenArt />
    </div>
  )
}
