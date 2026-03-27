import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface ArtPiece {
  id: string
  title: string
  image_url: string
  created_at: string
  overlay_applied?: boolean
}

export default function ArtPage() {
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState<ArtPiece | null>(null)
  const [error, setError] = useState('')
  const [history, setHistory] = useState<ArtPiece[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)

  useEffect(() => {
    loadHistory()
  }, [])

  async function loadHistory() {
    setLoadingHistory(true)
    try {
      const { data, error: err } = await supabase.functions.invoke('grounded-art', {
        body: { action: 'history' }
      })
      if (data?.pieces) setHistory(data.pieces)
      if (err) console.error('History error:', err)
    } catch (e) {
      console.error('Failed to load history:', e)
    } finally {
      setLoadingHistory(false)
    }
  }

  async function generateArt() {
    setGenerating(true)
    setError('')
    setResult(null)

    try {
      const { data, error: err } = await supabase.functions.invoke('grounded-art', {
        body: { action: 'generate' }
      })

      if (err) {
        setError(`Error: ${JSON.stringify(err)}`)
        return
      }
      if (data?.error) {
        setError(data.error)
        return
      }

      setResult(data)
      loadHistory()
    } catch (e: any) {
      setError(e.message || 'Failed to generate')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Generate */}
      <div>
        <button
          onClick={generateArt}
          disabled={generating}
          className="w-full py-4 bg-stone-100 text-stone-900 font-medium rounded-2xl hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-all text-base"
        >
          {generating ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              generating...
            </span>
          ) : 'generate new piece'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-950/50 border border-red-900/50 rounded-xl text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Latest Result */}
      {result && (
        <div className="bg-stone-900/50 border border-stone-800 rounded-2xl p-4">
          <div className="text-xs text-stone-500 uppercase tracking-widest mb-3">just created</div>
          <img
            src={result.image_url}
            alt={result.title}
            className="w-full rounded-xl"
            style={{ aspectRatio: '9/16', objectFit: 'cover' }}
          />
          <div className="mt-3 text-center">
            <div className="text-lg font-light tracking-wide text-stone-200">{result.title}</div>
            <div className="text-xs text-stone-600 mt-1">
              {result.overlay_applied ? 'title overlay applied' : 'raw image'}
            </div>
          </div>
        </div>
      )}

      {/* Gallery */}
      <div>
        <div className="text-sm text-stone-500 mb-4">
          gallery {history.length > 0 && `(${history.length})`}
        </div>

        {loadingHistory ? (
          <div className="text-stone-600 text-sm">loading...</div>
        ) : history.length === 0 ? (
          <div className="text-stone-600 text-sm">no pieces yet</div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {history.map((piece) => (
              <a
                key={piece.id}
                href={piece.image_url}
                target="_blank"
                rel="noopener noreferrer"
                className="group"
              >
                <div className="aspect-[9/16] rounded-xl overflow-hidden bg-stone-900 border border-stone-800 group-hover:border-stone-600 transition-colors">
                  <img
                    src={piece.image_url}
                    alt={piece.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="mt-1.5 text-xs text-stone-500 group-hover:text-stone-300 transition-colors truncate">
                  {piece.title}
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
