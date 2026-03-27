'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function GroundedArtPage() {
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')
  const [history, setHistory] = useState<any[]>([])
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
    } catch (e: any) {
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

      console.log('Response:', { data, err })

      if (err) {
        setError(`Error: ${JSON.stringify(err)}`)
        return
      }

      if (data?.error) {
        setError(data.error)
        return
      }

      setResult(data)
      // Refresh history
      loadHistory()
    } catch (e: any) {
      console.error('Generate error:', e)
      setError(e.message || 'Failed to generate')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-zinc-800 px-8 py-6">
        <h1 className="text-3xl font-light tracking-wide" style={{ fontFamily: 'var(--font-display, Georgia, serif)' }}>
          grounded art
        </h1>
        <p className="text-zinc-500 text-sm mt-1">abstract art generator</p>
      </div>

      {/* Main */}
      <div className="max-w-6xl mx-auto px-8 py-8">
        {/* Generate Button */}
        <div className="mb-10">
          <button
            onClick={generateArt}
            disabled={generating}
            className="px-8 py-4 bg-white text-black font-medium rounded-lg hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-lg"
          >
            {generating ? (
              <span className="flex items-center gap-3">
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
          <div className="mb-8 p-4 bg-red-900/30 border border-red-800 rounded-lg text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Latest Result */}
        {result && (
          <div className="mb-10 p-6 bg-zinc-900 border border-zinc-800 rounded-xl">
            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <img
                  src={result.image_url}
                  alt={result.title}
                  className="w-48 rounded-lg shadow-2xl"
                  style={{ aspectRatio: '9/16', objectFit: 'cover' }}
                />
              </div>
              <div className="flex flex-col justify-center">
                <div className="text-xs text-zinc-500 uppercase tracking-widest mb-2">just created</div>
                <h2 className="text-2xl font-light tracking-wide mb-2">{result.title}</h2>
                <div className="text-xs text-zinc-600">
                  {result.overlay_applied ? 'title overlay applied' : 'raw image (no overlay)'}
                </div>
                <div className="text-xs text-zinc-600 mt-1">
                  {new Date(result.created_at).toLocaleString()}
                </div>
                <a
                  href={result.image_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 text-sm text-zinc-400 hover:text-white underline"
                >
                  open full size
                </a>
              </div>
            </div>
          </div>
        )}

        {/* History */}
        <div>
          <h2 className="text-lg font-light tracking-wide text-zinc-400 mb-6">
            gallery {history.length > 0 && <span className="text-zinc-600">({history.length})</span>}
          </h2>

          {loadingHistory ? (
            <div className="text-zinc-600 text-sm">loading...</div>
          ) : history.length === 0 ? (
            <div className="text-zinc-600 text-sm">no pieces yet. generate your first one above.</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {history.map((piece) => (
                <a
                  key={piece.id}
                  href={piece.image_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group"
                >
                  <div className="aspect-[9/16] rounded-lg overflow-hidden bg-zinc-900 border border-zinc-800 group-hover:border-zinc-600 transition-colors">
                    <img
                      src={piece.image_url}
                      alt={piece.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="mt-2 text-xs text-zinc-500 group-hover:text-zinc-300 transition-colors truncate">
                    {piece.title}
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
