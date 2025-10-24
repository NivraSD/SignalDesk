'use client'

import React, { useState } from 'react'
import { X, Copy, Download, Share2, CheckCircle, Edit2, Save } from 'lucide-react'

interface ContentItem {
  id: string
  type: 'media_pitch' | 'social_post' | 'thought_leadership' | 'user_action'
  stakeholder: string
  topic: string
  target?: string
  generatedContent?: string
  details: any
  status: string
}

interface ContentViewerModalProps {
  item: ContentItem
  onClose: () => void
  onUpdate?: (itemId: string, content: string) => void
  onPublish?: (itemId: string) => void
}

export function ContentViewerModal({
  item,
  onClose,
  onUpdate,
  onPublish
}: ContentViewerModalProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState(item.generatedContent || '')
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(editedContent)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSave = () => {
    if (onUpdate) {
      onUpdate(item.id, editedContent)
      setIsEditing(false)
    }
  }

  const handleDownload = () => {
    const blob = new Blob([editedContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${item.type}-${item.topic.substring(0, 30)}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const getTypeInfo = () => {
    switch (item.type) {
      case 'media_pitch':
        return { label: 'Media Pitch', icon: '📰', color: 'emerald' }
      case 'social_post':
        return { label: 'Social Post', icon: '📱', color: 'blue' }
      case 'thought_leadership':
        return { label: 'Thought Leadership', icon: '✍️', color: 'purple' }
      case 'user_action':
        return { label: 'User Action', icon: '👤', color: 'amber' }
    }
  }

  const typeInfo = getTypeInfo()

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-gray-800">
        {/* Header */}
        <div className={`p-6 border-b border-${typeInfo.color}-500/30 bg-${typeInfo.color}-900/20`}>
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{typeInfo.icon}</span>
                <div>
                  <h3 className={`text-xl font-bold text-${typeInfo.color}-300`}>
                    {typeInfo.label}
                  </h3>
                  <p className="text-sm text-gray-400">For: {item.stakeholder}</p>
                </div>
              </div>
              <div className="mt-3">
                <p className="text-sm text-gray-400">Topic</p>
                <p className="text-white font-medium">{item.topic}</p>
              </div>
              {item.target && (
                <div className="mt-2">
                  <p className="text-sm text-gray-400">Target</p>
                  <p className="text-white">{item.target}</p>
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Strategic Brief */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-400 mb-2">Strategic Context</h4>
            <div className="bg-gray-800/50 rounded-lg p-4">
              {item.type === 'media_pitch' && (
                <div className="space-y-2 text-sm">
                  <p><span className="text-gray-400">Journalist:</span> <span className="text-white">{item.details.who}</span></p>
                  <p><span className="text-gray-400">Outlet:</span> <span className="text-white">{item.details.outlet}</span></p>
                  <p><span className="text-gray-400">Beat:</span> <span className="text-white">{item.details.beat}</span></p>
                  <p><span className="text-gray-400">Timing:</span> <span className="text-white">{item.details.when}</span></p>
                </div>
              )}
              {item.type === 'social_post' && (
                <div className="space-y-2 text-sm">
                  <p><span className="text-gray-400">Posted by:</span> <span className="text-white">{item.details.who}</span></p>
                  <p><span className="text-gray-400">Platform:</span> <span className="text-white">{item.details.platform}</span></p>
                  <p><span className="text-gray-400">Timing:</span> <span className="text-white">{item.details.when}</span></p>
                  {item.details.keyMessages && item.details.keyMessages.length > 0 && (
                    <div>
                      <p className="text-gray-400 mb-1">Key Messages:</p>
                      <ul className="list-disc list-inside text-gray-300 space-y-1">
                        {item.details.keyMessages.map((msg: string, i: number) => (
                          <li key={i}>{msg}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
              {item.type === 'thought_leadership' && (
                <div className="space-y-2 text-sm">
                  <p><span className="text-gray-400">Author:</span> <span className="text-white">{item.details.who}</span></p>
                  <p><span className="text-gray-400">Publication:</span> <span className="text-white">{item.details.where}</span></p>
                  <p><span className="text-gray-400">Timing:</span> <span className="text-white">{item.details.when}</span></p>
                  {item.details.keyPoints && item.details.keyPoints.length > 0 && (
                    <div>
                      <p className="text-gray-400 mb-1">Key Points:</p>
                      <ul className="list-disc list-inside text-gray-300 space-y-1">
                        {item.details.keyPoints.map((point: string, i: number) => (
                          <li key={i}>{point}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Generated Content */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-400">Generated Content</h4>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 text-xs px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded transition-colors"
                >
                  <Edit2 className="w-3 h-3" />
                  Edit
                </button>
              )}
            </div>
            {isEditing ? (
              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="w-full h-96 bg-gray-800 border border-gray-700 rounded-lg p-4 text-white font-mono text-sm focus:outline-none focus:border-blue-500 transition-colors"
              />
            ) : (
              <div className="bg-gray-800/50 rounded-lg p-4">
                <pre className="whitespace-pre-wrap text-gray-300 text-sm font-mono">
                  {editedContent}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-800 bg-gray-900/50">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    Save Changes
                  </button>
                  <button
                    onClick={() => {
                      setEditedContent(item.generatedContent || '')
                      setIsEditing(false)
                    }}
                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
                  >
                    {copied ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                </>
              )}
            </div>
            {!isEditing && onPublish && item.status !== 'published' && (
              <button
                onClick={() => onPublish(item.id)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Share2 className="w-4 h-4" />
                Mark as Published
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
