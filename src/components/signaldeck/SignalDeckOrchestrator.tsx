'use client'

import { useState, useEffect } from 'react'
import { useMemoryVault } from '@/hooks/useMemoryVault'

interface SignalDeckOutline {
  topic: string
  audience: string
  purpose: string
  key_messages: string[]
  slide_count: number
  sections: Array<{
    title: string
    talking_points: string[]
    visual_element?: {
      type: 'chart' | 'timeline' | 'image' | 'diagram' | 'quote' | 'data_table' | 'none'
      description?: string
      chart_type?: 'bar' | 'line' | 'pie' | 'column' | 'area'
      data?: any
    }
  }>
}

interface SignalDeckOrchestratorProps {
  outline: SignalDeckOutline | null
  mode: string
  generationId?: string
  onApprove?: () => void
  onEdit?: (outline: SignalDeckOutline) => void
}

export function SignalDeckOrchestrator({
  outline,
  mode,
  generationId,
  onApprove,
  onEdit
}: SignalDeckOrchestratorProps) {
  const [status, setStatus] = useState<'outline' | 'generating' | 'complete' | 'error'>('outline')
  const [progress, setProgress] = useState(0)
  const [fileUrl, setFileUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { saveContent } = useMemoryVault()

  // Poll for generation status
  useEffect(() => {
    if (!generationId || status === 'complete' || status === 'error') return

    const pollStatus = async () => {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zskaxjtyuaqazydouifp.supabase.co'
        const response = await fetch(`${supabaseUrl}/functions/v1/signaldeck-presentation?generationId=${generationId}`)
        const data = await response.json()

        console.log('📊 Poll response:', data)

        if (data.status === 'completed') {
          setStatus('complete')
          setFileUrl(data.fileUrl || data.downloadUrl)
          setProgress(100)

          // Auto-save to MemoryVault
          const downloadUrl = data.fileUrl || data.downloadUrl
          if (outline && downloadUrl) {
            await saveContent({
              title: outline.topic,
              content: downloadUrl,
              content_type: 'signaldeck',
              folder: 'presentations',
              metadata: {
                slideCount: outline.slide_count,
                audience: outline.audience,
                purpose: outline.purpose,
                hasCharts: outline.sections.some(s => s.visual_element?.type === 'chart'),
                hasTimelines: outline.sections.some(s => s.visual_element?.type === 'timeline')
              },
              tags: ['presentation', 'signaldeck', outline.audience]
            })
          }
        } else if (data.status === 'error') {
          setStatus('error')
          setError(data.error || 'Generation failed')
        } else {
          setProgress(data.progress || progress + 5)
        }
      } catch (err) {
        console.error('Status poll error:', err)
      }
    }

    const interval = setInterval(pollStatus, 3000)
    return () => clearInterval(interval)
  }, [generationId, status, outline])

  // Update status when mode changes
  useEffect(() => {
    if (mode === 'signaldeck_outline') {
      setStatus('outline')
    } else if (mode === 'signaldeck_generating') {
      setStatus('generating')
      setProgress(10)
    }
  }, [mode])

  const getVisualIcon = (type?: string) => {
    switch (type) {
      case 'chart': return '📊'
      case 'timeline': return '📅'
      case 'diagram': return '📐'
      case 'data_table': return '📋'
      case 'image': return '🖼️'
      case 'quote': return '💬'
      default: return '📄'
    }
  }

  if (!outline) return null

  return (
    <div className="space-y-6">
      {/* Outline View */}
      {status === 'outline' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">
              SignalDeck Presentation
            </h2>
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
              Review Outline
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-semibold text-gray-800">{outline.topic}</h3>
              <div className="mt-2 space-y-1 text-sm text-gray-600">
                <p><strong>Audience:</strong> {outline.audience}</p>
                <p><strong>Purpose:</strong> {outline.purpose}</p>
                <p><strong>Slides:</strong> {outline.slide_count || outline.sections.length}</p>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Key Messages:</h4>
              <ul className="list-disc list-inside space-y-1">
                {outline.key_messages.map((msg, i) => (
                  <li key={i} className="text-gray-700">{msg}</li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-gray-700 mb-3">Slide Structure:</h4>
              <div className="space-y-3">
                {outline.sections.map((section, i) => (
                  <div key={i} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl flex-shrink-0">
                        {getVisualIcon(section.visual_element?.type)}
                      </span>
                      <div className="flex-1">
                        <h5 className="font-semibold text-gray-800">
                          Slide {i + 1}: {section.title}
                        </h5>
                        <ul className="mt-2 space-y-1 text-sm text-gray-600">
                          {section.talking_points.map((point, j) => (
                            <li key={j}>• {point}</li>
                          ))}
                        </ul>
                        {section.visual_element?.description && (
                          <p className="mt-2 text-sm text-blue-600 italic">
                            Visual: {section.visual_element.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={onApprove}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              ✓ Approve & Generate PowerPoint
            </button>
            {onEdit && (
              <button
                onClick={() => onEdit(outline)}
                className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium"
              >
                Edit Outline
              </button>
            )}
          </div>
        </div>
      )}

      {/* Generating View */}
      {status === 'generating' && (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            Creating Your Presentation
          </h3>
          <p className="text-gray-600 mb-4">
            Generating {outline.slide_count || outline.sections.length} slides with professional layouts...
          </p>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-500">
            {progress}% complete • Estimated time: 15-30 seconds
          </p>
        </div>
      )}

      {/* Complete View */}
      {status === 'complete' && fileUrl && (
        <div className="bg-white rounded-lg border border-green-200 p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-2xl font-semibold text-gray-800 mb-2">
            Presentation Ready!
          </h3>
          <p className="text-gray-600 mb-6">
            Your PowerPoint presentation "{outline.topic}" has been generated successfully.
          </p>
          <div className="flex gap-3 justify-center">
            <a
              href={fileUrl}
              download
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium inline-flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download PowerPoint
            </a>
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium"
            >
              Preview
            </a>
          </div>
          <div className="mt-6 text-sm text-gray-500">
            ✓ Saved to MemoryVault → Presentations folder
          </div>
        </div>
      )}

      {/* Error View */}
      {status === 'error' && (
        <div className="bg-white rounded-lg border border-red-200 p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            Generation Failed
          </h3>
          <p className="text-gray-600 mb-6">
            {error || 'An error occurred while generating your presentation'}
          </p>
          <button
            onClick={() => {
              setStatus('outline')
              setError(null)
              setProgress(0)
            }}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  )
}
