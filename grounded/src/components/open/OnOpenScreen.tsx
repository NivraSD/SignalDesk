import { useEffect, useState, useCallback, Component, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOrchestration } from '@/hooks/useOrchestration'
import { DAILY_QUOTES } from '@/lib/constants'

class OpenErrorBoundary extends Component<{ children: ReactNode }, { error: string | null }> {
  state = { error: null as string | null }
  static getDerivedStateFromError(e: Error) { return { error: e.message } }
  render() {
    if (this.state.error) return (
      <div className="fixed inset-0 bg-stone-950 text-white p-8 flex flex-col justify-center">
        <p className="text-red-400 text-sm font-mono">{this.state.error}</p>
      </div>
    )
    return this.props.children
  }
}

function OnOpenScreenInner() {
  const navigate = useNavigate()
  const { loading, orchestration, fetchLatest } = useOrchestration()
  const [imageLoaded, setImageLoaded] = useState(false)
  const [fallbackQuote] = useState(() => {
    const idx = Math.floor(Math.random() * DAILY_QUOTES.length)
    return DAILY_QUOTES[idx]
  })

  useEffect(() => {
    fetchLatest().then((result) => {
      if (result) {
        localStorage.setItem('grounded_last_orchestration', JSON.stringify(result))
      }
    })
  }, [fetchLatest])

  // Use fresh orchestration, or cached from last session, or null
  const display = orchestration || (() => {
    try {
      const cached = localStorage.getItem('grounded_last_orchestration')
      return cached ? JSON.parse(cached) : null
    } catch { return null }
  })()

  const handleTap = useCallback(() => {
    navigate(display?.routing_target || '/')
  }, [navigate, display])

  // Loading state
  if (loading) {
    return (
      <div
        className="fixed inset-0 bg-stone-950 flex items-center justify-center"
        style={{ touchAction: 'manipulation' }}
      >
        <div className="w-3 h-3 rounded-full bg-stone-600 animate-pulse" />
      </div>
    )
  }

  // Fallback: gradient + daily quote (only if no cached orchestration either)
  if (!display) {
    return (
      <div
        className="fixed inset-0 cursor-pointer select-none"
        onClick={handleTap}
        style={{ touchAction: 'manipulation' }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-stone-800 via-stone-900 to-stone-950" />
        <div className="relative z-10 h-full flex flex-col justify-end pb-20 px-8">
          <p
            className="text-2xl font-light text-white/90 leading-relaxed mb-4"
            style={{ textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}
          >
            {fallbackQuote.text}
          </p>
          <p className="text-sm text-white/40 font-light">
            {fallbackQuote.source}
          </p>
        </div>
      </div>
    )
  }

  // Full orchestration screen
  return (
    <div
      className="fixed inset-0 cursor-pointer select-none"
      onClick={handleTap}
      style={{ touchAction: 'manipulation' }}
    >
      {display.image_url && (
        <img
          src={display.image_url}
          alt=""
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setImageLoaded(true)}
          draggable={false}
        />
      )}

      {!imageLoaded && (
        <div className="absolute inset-0 bg-stone-950" />
      )}

      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80" />

      <div className="relative z-10 h-full flex flex-col justify-end pb-20 px-8">
        <h1
          className="text-3xl font-light text-white leading-snug mb-4 tracking-wide"
          style={{ textShadow: '0 2px 12px rgba(0,0,0,0.6)' }}
        >
          {display.title}
        </h1>

        {display.routing_suggestion && (
          <p
            className="text-sm text-white/50 font-light max-w-xs"
            style={{ textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}
          >
            {display.routing_suggestion}
          </p>
        )}
      </div>
    </div>
  )
}

export default function OnOpenScreen() {
  return (
    <OpenErrorBoundary>
      <OnOpenScreenInner />
    </OpenErrorBoundary>
  )
}
