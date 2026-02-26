import { useEffect, useState } from 'react'
import { Sparkles, X, ChevronLeft, Grid3X3 } from 'lucide-react'
import { useArt } from '@/hooks/useArt'
import type { ArtPiece } from '@/types'

export default function ArtPage() {
  const { pieces, generating, loading, loadHistory, generate } = useArt()
  const [view, setView] = useState<'generate' | 'gallery'>('generate')
  const [selected, setSelected] = useState<ArtPiece | null>(null)
  const [latestPiece, setLatestPiece] = useState<ArtPiece | null>(null)

  useEffect(() => { loadHistory() }, [loadHistory])

  async function handleGenerate() {
    const piece = await generate()
    if (piece) setLatestPiece(piece)
  }

  // Full-screen selected piece
  if (selected) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
        <button
          onClick={() => setSelected(null)}
          className="absolute top-4 right-4 z-10 p-2 bg-black/50 rounded-full text-white"
        >
          <X size={20} />
        </button>
        <div className="flex-1 flex items-center justify-center">
          <img src={selected.image_url} alt={selected.title} className="w-full h-full object-contain" />
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 pb-safe">
          <h2 className="text-white text-lg font-light">{selected.title}</h2>
          <p className="text-white/50 text-xs mt-1">
            {new Date(selected.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-8 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-light text-stone-800">Art</h1>
        <button
          onClick={() => setView(view === 'generate' ? 'gallery' : 'generate')}
          className="p-2 text-stone-400"
        >
          {view === 'generate' ? <Grid3X3 size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      {view === 'generate' ? (
        <div className="space-y-6">
          {/* Display area */}
          <div className="aspect-[9/16] max-h-[60vh] bg-stone-200 rounded-2xl overflow-hidden relative">
            {generating ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-200 via-purple-200 to-amber-200 animate-pulse" />
                <div className="relative text-center">
                  <Sparkles size={32} className="text-white/80 mx-auto mb-3 animate-spin" style={{ animationDuration: '3s' }} />
                  <p className="text-white/80 text-sm font-medium">Creating your art...</p>
                  <p className="text-white/50 text-xs mt-1">This takes about 10-15 seconds</p>
                </div>
              </div>
            ) : latestPiece ? (
              <>
                <img src={latestPiece.image_url} alt={latestPiece.title} className="w-full h-full object-cover" />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-5">
                  <h2 className="text-white text-lg font-light">{latestPiece.title}</h2>
                </div>
              </>
            ) : pieces.length > 0 ? (
              <>
                <img src={pieces[0].image_url} alt={pieces[0].title} className="w-full h-full object-cover" />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-5">
                  <h2 className="text-white text-lg font-light">{pieces[0].title}</h2>
                </div>
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-center p-8">
                <div>
                  <Sparkles size={40} className="text-stone-300 mx-auto mb-3" />
                  <p className="text-stone-500 text-sm">Generate your first piece of abstract art</p>
                  <p className="text-stone-400 text-xs mt-1">Perfect for a lock screen or moment of calm</p>
                </div>
              </div>
            )}
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full py-3.5 rounded-xl bg-stone-800 text-white font-medium flex items-center justify-center gap-2 disabled:opacity-50 transition-opacity"
          >
            <Sparkles size={18} />
            {generating ? 'Creating...' : 'Create New Art'}
          </button>
        </div>
      ) : (
        /* Gallery view */
        <div>
          {loading ? (
            <div className="text-center text-stone-400 text-sm py-10">Loading gallery...</div>
          ) : pieces.length === 0 ? (
            <div className="text-center text-stone-400 text-sm py-10">
              No art yet. Generate your first piece!
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {pieces.map((piece) => (
                <button
                  key={piece.id}
                  onClick={() => setSelected(piece)}
                  className="aspect-[9/16] rounded-xl overflow-hidden relative group"
                >
                  <img src={piece.image_url} alt={piece.title} className="w-full h-full object-cover" />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-white text-xs font-light truncate">{piece.title}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
