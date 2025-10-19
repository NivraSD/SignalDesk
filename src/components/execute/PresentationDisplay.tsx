import React, { useState } from 'react'
import { Presentation, ExternalLink, Download, Maximize2, X } from 'lucide-react'

interface PresentationDisplayProps {
  gammaUrl?: string
  generationId?: string
  title?: string
  metadata?: any
  onClose?: () => void
}

export function PresentationDisplay({
  gammaUrl,
  generationId,
  title,
  metadata,
  onClose
}: PresentationDisplayProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showEmbed, setShowEmbed] = useState(false)

  // Construct the embed URL (Gamma presentations can be embedded)
  const embedUrl = gammaUrl || (generationId ? `https://gamma.app/embed/${generationId}` : null)
  const viewUrl = gammaUrl || (generationId ? `https://gamma.app/docs/${generationId}` : null)

  if (!embedUrl && !viewUrl) {
    return (
      <div className="p-6 bg-gray-800 rounded-lg">
        <div className="flex items-center gap-3 mb-4">
          <Presentation className="w-6 h-6 text-yellow-500" />
          <h3 className="text-lg font-semibold">Presentation Not Available</h3>
        </div>
        <p className="text-gray-400">The presentation URL is not available.</p>
      </div>
    )
  }

  return (
    <div className={`presentation-display ${isFullscreen ? 'fixed inset-0 z-50 bg-black' : ''}`}>
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <Presentation className="w-5 h-5 text-yellow-500" />
            <h3 className="font-semibold text-white">
              {title || 'Gamma Presentation'}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowEmbed(!showEmbed)}
              className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 rounded transition-colors"
            >
              {showEmbed ? 'Hide Preview' : 'Show Preview'}
            </button>

            <a
              href={viewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 hover:bg-gray-700 rounded transition-colors"
              title="Open in Gamma"
            >
              <ExternalLink className="w-4 h-4" />
            </a>

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 hover:bg-gray-700 rounded transition-colors"
              title="Fullscreen"
            >
              {isFullscreen ? <X className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {onClose && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-700 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Embed Preview */}
        {showEmbed && (
          <div className={`relative bg-black ${isFullscreen ? 'h-screen' : 'h-[600px]'}`}>
            <iframe
              src={embedUrl}
              className="w-full h-full"
              frameBorder="0"
              allowFullScreen
              title={title || 'Presentation'}
            />
          </div>
        )}

        {/* Info Section */}
        {!showEmbed && (
          <div className="p-6 space-y-4">
            <div className="bg-gray-900 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-400 mb-2">Presentation Details</h4>

              <div className="space-y-2 text-sm">
                {generationId && (
                  <div>
                    <span className="text-gray-500">ID:</span>
                    <span className="ml-2 font-mono text-gray-300">{generationId}</span>
                  </div>
                )}

                {metadata?.format && (
                  <div>
                    <span className="text-gray-500">Format:</span>
                    <span className="ml-2 text-gray-300 capitalize">{metadata.format}</span>
                  </div>
                )}

                {metadata?.numCards && (
                  <div>
                    <span className="text-gray-500">Slides:</span>
                    <span className="ml-2 text-gray-300">{metadata.numCards}</span>
                  </div>
                )}

                {metadata?.creditsUsed && (
                  <div>
                    <span className="text-gray-500">Credits Used:</span>
                    <span className="ml-2 text-gray-300">{metadata.creditsUsed}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <a
                href={viewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 px-4 py-2 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 transition-colors text-center font-medium"
              >
                Open in Gamma
              </a>

              <button
                onClick={() => setShowEmbed(true)}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors font-medium"
              >
                Preview Here
              </button>
            </div>

            <div className="text-sm text-gray-500">
              <p className="mb-2">📌 About Gamma Presentations:</p>
              <ul className="space-y-1 ml-4">
                <li>• Presentations are hosted on Gamma's platform</li>
                <li>• You can view, edit, and present directly in Gamma</li>
                <li>• Export to PDF or PowerPoint from Gamma</li>
                <li>• Share via link or embed in other platforms</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function PresentationGallery({ presentations }: { presentations: any[] }) {
  const [selectedPresentation, setSelectedPresentation] = useState<any>(null)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {presentations.map((presentation) => (
          <div
            key={presentation.generationId}
            className="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition-colors cursor-pointer"
            onClick={() => setSelectedPresentation(presentation)}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Presentation className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-white">
                    {presentation.title || 'Untitled Presentation'}
                  </h4>
                  <p className="text-sm text-gray-400">
                    {presentation.metadata?.numCards || '?'} slides
                  </p>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-gray-500" />
            </div>
          </div>
        ))}
      </div>

      {selectedPresentation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="max-w-4xl w-full max-h-[90vh] overflow-auto">
            <PresentationDisplay
              {...selectedPresentation}
              onClose={() => setSelectedPresentation(null)}
            />
          </div>
        </div>
      )}
    </div>
  )
}