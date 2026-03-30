'use client'

import React, { useState } from 'react'
import {
  Image as ImageIcon,
  Video,
  Download,
  Maximize2,
  X,
  Loader2,
  AlertCircle
} from 'lucide-react'

interface MediaDisplayProps {
  mediaUrl: string
  mediaType: 'image' | 'video'
  title?: string
  description?: string
  metadata?: {
    width?: number
    height?: number
    duration?: number
    format?: string
    size?: number
  }
  onDownload?: () => void
}

export function MediaDisplay({
  mediaUrl,
  mediaType,
  title,
  description,
  metadata,
  onDownload
}: MediaDisplayProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const handleLoad = () => {
    setIsLoading(false)
  }

  const handleError = () => {
    setIsLoading(false)
    setHasError(true)
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  const handleDownload = () => {
    if (onDownload) {
      onDownload()
    } else {
      // Default download behavior
      const link = document.createElement('a')
      link.href = mediaUrl
      link.download = title || `${mediaType}-${Date.now()}`
      link.click()
    }
  }

  return (
    <div className="media-display bg-gray-800 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {mediaType === 'image' ? (
              <ImageIcon className="w-5 h-5 text-blue-400" />
            ) : (
              <Video className="w-5 h-5 text-purple-400" />
            )}
            <div>
              {title && <h4 className="font-semibold text-white">{title}</h4>}
              {description && <p className="text-sm text-gray-400">{description}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleFullscreen}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              title="Fullscreen"
            >
              <Maximize2 className="w-4 h-4 text-gray-400" />
            </button>
            <button
              onClick={handleDownload}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              title="Download"
            >
              <Download className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Media Content */}
      <div className="relative bg-gray-900">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-gray-500 animate-spin" />
          </div>
        )}

        {hasError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
            <AlertCircle className="w-12 h-12 text-red-400 mb-3" />
            <p className="text-gray-400 text-center">
              Failed to load {mediaType}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Please check your connection and try again
            </p>
          </div>
        )}

        {mediaType === 'image' ? (
          <img
            src={mediaUrl}
            alt={title || 'Generated image'}
            onLoad={handleLoad}
            onError={handleError}
            className={`w-full h-auto ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity`}
            style={{ maxHeight: '600px', objectFit: 'contain' }}
          />
        ) : (
          <video
            src={mediaUrl}
            controls
            onLoadedData={handleLoad}
            onError={handleError}
            className={`w-full h-auto ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity`}
            style={{ maxHeight: '600px' }}
          >
            Your browser does not support the video tag.
          </video>
        )}
      </div>

      {/* Metadata */}
      {metadata && (
        <div className="p-3 border-t border-gray-700 bg-gray-850">
          <div className="flex flex-wrap gap-4 text-sm text-gray-400">
            {metadata.width && metadata.height && (
              <span>{metadata.width}x{metadata.height}</span>
            )}
            {metadata.duration && (
              <span>{Math.floor(metadata.duration / 60)}:{(metadata.duration % 60).toString().padStart(2, '0')}</span>
            )}
            {metadata.format && (
              <span className="uppercase">{metadata.format}</span>
            )}
            {metadata.size && (
              <span>{(metadata.size / 1024 / 1024).toFixed(2)} MB</span>
            )}
          </div>
        </div>
      )}

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-95 flex items-center justify-center p-4">
          <button
            onClick={toggleFullscreen}
            className="absolute top-4 right-4 p-2 bg-gray-800 rounded-lg hover:bg-gray-700"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          {mediaType === 'image' ? (
            <img
              src={mediaUrl}
              alt={title || 'Generated image'}
              className="max-w-full max-h-full object-contain"
            />
          ) : (
            <video
              src={mediaUrl}
              controls
              autoPlay
              className="max-w-full max-h-full"
            >
              Your browser does not support the video tag.
            </video>
          )}
        </div>
      )}
    </div>
  )
}

// Gallery component for multiple media items
export function MediaGallery({
  items
}: {
  items: Array<{
    id: string
    url: string
    type: 'image' | 'video'
    title?: string
    thumbnail?: string
  }>
}) {
  const [selectedItem, setSelectedItem] = useState<string | null>(null)

  return (
    <div className="media-gallery">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map(item => (
          <div
            key={item.id}
            onClick={() => setSelectedItem(item.id)}
            className="relative cursor-pointer group"
          >
            <div className="aspect-square bg-gray-800 rounded-lg overflow-hidden">
              {item.type === 'image' ? (
                <img
                  src={item.thumbnail || item.url}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-900">
                  <Video className="w-12 h-12 text-purple-400" />
                </div>
              )}

              {/* Overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <Maximize2 className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>

            {item.title && (
              <p className="mt-2 text-sm text-gray-400 truncate">{item.title}</p>
            )}
          </div>
        ))}
      </div>

      {/* Selected Item Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4">
          <button
            onClick={() => setSelectedItem(null)}
            className="absolute top-4 right-4 p-2 bg-gray-800 rounded-lg hover:bg-gray-700"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          {(() => {
            const item = items.find(i => i.id === selectedItem)
            if (!item) return null

            return (
              <MediaDisplay
                mediaUrl={item.url}
                mediaType={item.type}
                title={item.title}
              />
            )
          })()}
        </div>
      )}
    </div>
  )
}