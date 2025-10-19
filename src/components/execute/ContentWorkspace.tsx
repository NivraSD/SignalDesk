'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  Save,
  Download,
  Share2,
  Edit3,
  Eye,
  Users,
  Clock,
  Copy,
  Check,
  Maximize2,
  X,
  Image as ImageIcon,
  Play,
  FileText,
  Hash,
  Mail,
  Presentation as PresentationIcon,
  Video as VideoIcon,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw
} from 'lucide-react'

// Content item interface
export interface ContentItem {
  id: string
  type: 'text' | 'image' | 'video' | 'presentation' | 'social-post' | 'press-release' | 'email' |
        'media-pitch' | 'media-list' | 'qa-document' | 'talking-points' | 'blog-post' |
        'case-study' | 'white-paper' | 'media-advisory' | 'executive-statement' |
        'internal-memo' | 'thought-leadership' | string  // Allow any string for flexibility
  content: any  // Can be text, URL, or structured data
  title?: string
  folder?: string
  savedPath?: string
  createdAt?: Date
  status?: 'draft' | 'completed' | 'published'
  source?: string
  metadata?: {
    platform?: string  // LinkedIn, Twitter, etc.
    audience?: string[]
    generatedAt?: string
    framework?: any
    opportunity?: any
    keyMessages?: string[]
  }
  versions?: Array<{
    platform: string
    content: string
    characterCount?: number
    limits?: { min: number, max: number }
  }>
  saved: boolean
  timestamp: number
}

interface ContentWorkspaceProps {
  content?: ContentItem | ContentItem[]
  onEdit?: (content: ContentItem) => void
  onSave?: (content: ContentItem) => void
  onVersionForAudience?: (content: ContentItem, audience: string) => void
  onExport?: (content: ContentItem, format: string) => void
  className?: string
}

// Platform configurations
const PLATFORM_CONFIG: Record<string, { icon: any, color: string, charLimit?: number }> = {
  'linkedin': { icon: Hash, color: 'text-blue-600', charLimit: 3000 },
  'twitter': { icon: Hash, color: 'text-sky-500', charLimit: 280 },
  'facebook': { icon: Hash, color: 'text-blue-500', charLimit: 63206 },
  'instagram': { icon: ImageIcon, color: 'text-pink-500', charLimit: 2200 },
  'email': { icon: Mail, color: 'text-green-500' },
  'press': { icon: FileText, color: 'text-gray-400' }
}

// Audience profiles
const AUDIENCE_PROFILES = [
  { id: 'investors', label: 'Investors', icon: '💰' },
  { id: 'customers', label: 'Customers', icon: '🛍️' },
  { id: 'employees', label: 'Employees', icon: '👥' },
  { id: 'media', label: 'Media', icon: '📰' },
  { id: 'regulators', label: 'Regulators', icon: '⚖️' }
]

export default function ContentWorkspace({
  content,
  onEdit,
  onSave,
  onVersionForAudience,
  onExport,
  className = ''
}: ContentWorkspaceProps) {
  const [activeTab, setActiveTab] = useState(0)
  const [editMode, setEditMode] = useState(false)
  const [editedContent, setEditedContent] = useState<string>('')
  const [copied, setCopied] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [zoom, setZoom] = useState(100)
  const [showAudienceModal, setShowAudienceModal] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Get current content item
  const items = Array.isArray(content) ? content : content ? [content] : []
  const currentItem = items[0]

  // Initialize edited content
  useEffect(() => {
    if (currentItem) {
      if (currentItem.versions && currentItem.versions[activeTab]) {
        setEditedContent(currentItem.versions[activeTab].content)
      } else if (typeof currentItem.content === 'string') {
        setEditedContent(currentItem.content)
      } else if (currentItem.content?.text) {
        setEditedContent(currentItem.content.text)
      } else if (currentItem.type === 'social-post' && typeof currentItem.content === 'object') {
        // For social posts, show the first available platform's content
        const platforms = ['twitter', 'linkedin', 'facebook', 'instagram']
        for (const platform of platforms) {
          if (currentItem.content[platform]?.length > 0) {
            setEditedContent(currentItem.content[platform][0])
            break
          }
        }
      }
    }
  }, [currentItem, activeTab])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current && editMode) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [editedContent, editMode])

  // Handle save
  const handleSave = () => {
    if (currentItem && onSave) {
      const updatedItem = {
        ...currentItem,
        content: editedContent,
        saved: true
      }
      onSave(updatedItem)
      setEditMode(false)
    }
  }

  // Handle copy
  const handleCopy = async () => {
    if (currentItem) {
      const textToCopy = editedContent || currentItem.content?.text || currentItem.content
      await navigator.clipboard.writeText(textToCopy)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Handle export
  const handleExport = (format: string) => {
    if (currentItem && onExport) {
      onExport(currentItem, format)
    }
  }

  // Render media content
  const renderMediaContent = () => {
    if (!currentItem) return null

    switch (currentItem.type) {
      case 'image':
        return (
          <div className="relative flex items-center justify-center h-full bg-black rounded-lg overflow-hidden">
            <img
              src={currentItem.content.url || currentItem.content}
              alt="Generated content"
              className="max-w-full max-h-full object-contain transition-transform"
              style={{ transform: `scale(${zoom / 100})` }}
            />

            {/* Image controls */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-900/90 backdrop-blur rounded-lg px-4 py-2 flex items-center gap-3">
              <button
                onClick={() => setZoom(Math.max(25, zoom - 25))}
                className="p-1.5 hover:bg-gray-800 rounded transition-colors"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-400">{zoom}%</span>
              <button
                onClick={() => setZoom(Math.min(200, zoom + 25))}
                className="p-1.5 hover:bg-gray-800 rounded transition-colors"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <div className="w-px h-4 bg-gray-700" />
              <button
                onClick={() => setZoom(100)}
                className="p-1.5 hover:bg-gray-800 rounded transition-colors"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        )

      case 'video':
        return (
          <div className="relative h-full bg-black rounded-lg overflow-hidden">
            <video
              src={currentItem.content.url || currentItem.content}
              controls
              className="w-full h-full"
            >
              Your browser does not support the video tag.
            </video>

            <div className="absolute top-4 right-4">
              <span className="px-2 py-1 bg-gray-900/90 backdrop-blur rounded text-xs text-gray-400">
                Video Content
              </span>
            </div>
          </div>
        )

      case 'presentation':
        return (
          <div className="h-full bg-gray-900 rounded-lg p-8 flex flex-col items-center justify-center">
            <PresentationIcon className="w-16 h-16 text-gray-600 mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">Presentation Ready</h3>
            <p className="text-sm text-gray-400 mb-6 text-center max-w-md">
              Your presentation has been generated using Gamma. Click below to view or edit it.
            </p>
            <div className="flex gap-3">
              <a
                href={currentItem.metadata?.gammaUrl || currentItem.content || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-medium rounded-lg transition-colors"
              >
                Open in Gamma
              </a>
              <button
                onClick={() => handleExport('pdf')}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Export PDF
              </button>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  // Render text content
  const renderTextContent = () => {
    // Allow all text-based content types
    if (!currentItem || ['image', 'video', 'presentation'].includes(currentItem.type)) {
      return null
    }

    const currentVersion = currentItem.versions?.[activeTab]
    const charCount = editedContent.length
    const charLimit = currentVersion?.limits?.max || PLATFORM_CONFIG[currentVersion?.platform || '']?.charLimit

    return (
      <div className="h-full flex flex-col">
        {/* Platform tabs */}
        {currentItem.versions && currentItem.versions.length > 1 && (
          <div className="flex gap-1 p-2 bg-gray-800 rounded-t-lg">
            {currentItem.versions.map((version, idx) => {
              const config = PLATFORM_CONFIG[version.platform]
              return (
                <button
                  key={idx}
                  onClick={() => setActiveTab(idx)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === idx
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {config && <config.icon className={`w-3.5 h-3.5 ${config.color}`} />}
                    {version.platform}
                  </span>
                </button>
              )
            })}
            <button
              onClick={() => setActiveTab(currentItem.versions!.length)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === currentItem.versions!.length
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              All Versions
            </button>
          </div>
        )}

        {/* Content area */}
        <div className="flex-1 p-6 bg-gray-800 rounded-b-lg overflow-y-auto">
          {activeTab === currentItem.versions?.length ? (
            // Show all versions
            <div className="space-y-6">
              {currentItem.versions?.map((version, idx) => {
                const config = PLATFORM_CONFIG[version.platform]
                return (
                  <div key={idx} className="border border-gray-700 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      {config && <config.icon className={`w-4 h-4 ${config.color}`} />}
                      <span className="font-medium text-white">{version.platform}</span>
                      {version.characterCount && (
                        <span className="text-xs text-gray-500">
                          {version.characterCount} / {version.limits?.max || config?.charLimit || '∞'}
                        </span>
                      )}
                    </div>
                    <div className="text-gray-300 whitespace-pre-wrap">{version.content}</div>
                  </div>
                )
              })}
            </div>
          ) : (
            // Show single version or content
            <>
              {editMode ? (
                <textarea
                  ref={textareaRef}
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="w-full h-full bg-transparent text-white resize-none focus:outline-none font-mono"
                  placeholder="Enter your content here..."
                />
              ) : (
                <div className="text-gray-300 whitespace-pre-wrap font-mono">
                  {editedContent || currentItem.content?.text ||
                   (typeof currentItem.content === 'string' ? currentItem.content : 'No content available')}
                </div>
              )}

              {/* Character count */}
              {charLimit && (
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Character count</span>
                    <span className={`text-sm font-medium ${
                      charCount > charLimit ? 'text-red-400' : 'text-gray-400'
                    }`}>
                      {charCount} / {charLimit}
                    </span>
                  </div>
                  {charCount > charLimit && (
                    <p className="mt-2 text-xs text-red-400">
                      Content exceeds platform limit by {charCount - charLimit} characters
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    )
  }

  // Empty state
  if (!currentItem) {
    return (
      <div className={`content-workspace bg-gray-900 rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-center">
          <FileText className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No content selected</p>
          <p className="text-sm text-gray-500 mt-1">Generate or select content to view here</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`content-workspace bg-gray-900 rounded-lg flex flex-col ${fullscreen ? 'fixed inset-0 z-50' : ''} ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-white">Content Workspace</h3>
            {currentItem.saved && (
              <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full flex items-center gap-1">
                <Check className="w-3 h-3" />
                Saved
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Edit/Preview toggle for text content */}
            {!['image', 'video', 'presentation'].includes(currentItem.type) && (
              <button
                onClick={() => {
                  if (editMode) {
                    handleSave()
                  } else {
                    setEditMode(true)
                  }
                }}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  editMode
                    ? 'bg-green-600 hover:bg-green-500 text-white'
                    : 'bg-gray-800 hover:bg-gray-700 text-white'
                }`}
              >
                {editMode ? (
                  <>
                    <Save className="w-3.5 h-3.5 inline mr-1.5" />
                    Save Changes
                  </>
                ) : (
                  <>
                    <Edit3 className="w-3.5 h-3.5 inline mr-1.5" />
                    Edit
                  </>
                )}
              </button>
            )}

            {/* Copy button */}
            <button
              onClick={handleCopy}
              className="p-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              title="Copy to clipboard"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-400" />
              ) : (
                <Copy className="w-4 h-4 text-white" />
              )}
            </button>

            {/* Fullscreen toggle */}
            <button
              onClick={() => setFullscreen(!fullscreen)}
              className="p-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              title="Toggle fullscreen"
            >
              {fullscreen ? (
                <X className="w-4 h-4 text-white" />
              ) : (
                <Maximize2 className="w-4 h-4 text-white" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {['image', 'video', 'presentation'].includes(currentItem.type)
          ? renderMediaContent()
          : renderTextContent()
        }
      </div>

      {/* Action Bar */}
      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {!currentItem.saved && (
              <button
                onClick={() => onSave?.(currentItem)}
                className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
              >
                <Save className="w-3.5 h-3.5" />
                Save to Library
              </button>
            )}

            <button
              onClick={() => setShowAudienceModal(true)}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm rounded-lg transition-colors flex items-center gap-2"
            >
              <Users className="w-3.5 h-3.5" />
              Version for Audience
            </button>

            <button
              onClick={() => handleExport('pdf')}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm rounded-lg transition-colors flex items-center gap-2"
            >
              <Download className="w-3.5 h-3.5" />
              Export
            </button>

            <button
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm rounded-lg transition-colors flex items-center gap-2"
            >
              <Share2 className="w-3.5 h-3.5" />
              Share
            </button>
          </div>

          {/* Metadata */}
          <div className="flex items-center gap-4 text-xs text-gray-500">
            {currentItem.metadata?.generatedAt && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(currentItem.metadata.generatedAt).toLocaleTimeString()}
              </span>
            )}
            {currentItem.metadata?.platform && (
              <span>Platform: {currentItem.metadata.platform}</span>
            )}
          </div>
        </div>
      </div>

      {/* Audience Versioning Modal */}
      {showAudienceModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold text-white mb-4">Create Audience Version</h3>
            <p className="text-sm text-gray-400 mb-4">
              Select an audience to create a tailored version of this content.
            </p>

            <div className="space-y-2">
              {AUDIENCE_PROFILES.map(audience => (
                <button
                  key={audience.id}
                  onClick={() => {
                    if (onVersionForAudience) {
                      onVersionForAudience(currentItem, audience.id)
                    }
                    setShowAudienceModal(false)
                  }}
                  className="w-full p-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-left transition-colors flex items-center gap-3"
                >
                  <span className="text-2xl">{audience.icon}</span>
                  <span className="text-white">{audience.label}</span>
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowAudienceModal(false)}
              className="w-full mt-4 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}