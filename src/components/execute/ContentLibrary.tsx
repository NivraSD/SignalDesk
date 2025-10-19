'use client'

import React, { useState, useEffect } from 'react'
import { Clock, FileText, Star, Tag, Folder, Search } from 'lucide-react'
import { CONTENT_TYPE_CONFIG } from '@/types/content'

interface ContentLibraryProps {
  organization: any
  className?: string
  onContentSelect?: (content: any) => void
}

type LibraryTab = 'recent' | 'templates' | 'drafts'

interface ContentItem {
  id: string
  title: string
  content_type: string
  content: string | any
  metadata?: any
  tags?: string[]
  status?: string
  created_at: string
  updated_at?: string
  created_by?: string
}

export default function ContentLibrary({ organization, className = '', onContentSelect }: ContentLibraryProps) {
  const [activeTab, setActiveTab] = useState<LibraryTab>('recent')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [contentItems, setContentItems] = useState<ContentItem[]>([])
  const [error, setError] = useState<string | null>(null)

  // Fetch real data from content_library table
  useEffect(() => {
    fetchContentLibrary()
  }, [organization])

  const fetchContentLibrary = async () => {
    try {
      setLoading(true)
      setError(null)

      // Build query parameters
      const params = new URLSearchParams()
      if (organization?.id) {
        params.append('organization_id', organization.id)
      }
      params.append('limit', '100')

      const response = await fetch(`/api/content-library/save?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      const result = await response.json()

      if (result.success) {
        setContentItems(result.data || [])
      } else {
        console.log('Content library fetch warning:', result.message)
        setContentItems([]) // Set empty array if no data yet
      }
    } catch (error) {
      console.error('Error fetching content library:', error)
      setError('Failed to load content library')
      setContentItems([])
    } finally {
      setLoading(false)
    }
  }

  // Process content items into categories
  const recentContent = contentItems
    .filter(item => item.status !== 'draft' && item.status !== 'template')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10)
    .map(item => ({
      id: item.id,
      title: item.title,
      type: item.content_type || 'general',
      date: new Date(item.created_at),
      status: item.status || 'saved',
      content: item.content,
      metadata: item.metadata
    }))

  const templates = contentItems
    .filter(item => item.status === 'template' || item.tags?.includes('template'))
    .map(item => ({
      id: item.id,
      title: item.title,
      type: item.content_type || 'general',
      uses: item.metadata?.uses || 0,
      content: item.content,
      metadata: item.metadata
    }))

  const drafts = contentItems
    .filter(item => item.status === 'draft')
    .map(item => ({
      id: item.id,
      title: item.title,
      type: item.content_type || 'general',
      lastEdited: new Date(item.updated_at || item.created_at),
      content: item.content,
      metadata: item.metadata
    }))

  return (
    <div className={`content-library bg-gray-800 rounded-lg ${className}`}>
      {/* Header with Tabs */}
      <div className="border-b border-gray-700">
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center gap-3">
            <Folder className="w-5 h-5 text-gray-400" />
            <h3 className="text-sm font-medium">Content Library</h3>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="pl-8 pr-3 py-1 bg-gray-700 rounded text-sm w-40 focus:outline-none focus:ring-1 focus:ring-purple-500/50"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex px-3">
          <button
            onClick={() => setActiveTab('recent')}
            className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'recent'
                ? 'text-purple-400 border-purple-400'
                : 'text-gray-400 border-transparent hover:text-gray-300'
            }`}
          >
            <Clock className="w-4 h-4 inline mr-1.5" />
            Recent
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'templates'
                ? 'text-purple-400 border-purple-400'
                : 'text-gray-400 border-transparent hover:text-gray-300'
            }`}
          >
            <Star className="w-4 h-4 inline mr-1.5" />
            Templates
          </button>
          <button
            onClick={() => setActiveTab('drafts')}
            className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'drafts'
                ? 'text-purple-400 border-purple-400'
                : 'text-gray-400 border-transparent hover:text-gray-300'
            }`}
          >
            <FileText className="w-4 h-4 inline mr-1.5" />
            Drafts
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-3 overflow-y-auto" style={{ maxHeight: '150px' }}>
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <div className="text-sm text-gray-400">Loading content library...</div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-4">
            <div className="text-sm text-red-400">{error}</div>
          </div>
        ) : (
          <>
            {activeTab === 'recent' && (
              <div className="space-y-2">
                {recentContent.length > 0 ? (
                  recentContent
                    .filter(item => !searchQuery || item.title.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map(item => (
                      <button
                        key={item.id}
                        onClick={() => onContentSelect?.(item)}
                        className="w-full p-2 bg-gray-700/50 hover:bg-gray-700 rounded text-left transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-lg">
                            {CONTENT_TYPE_CONFIG[item.type as keyof typeof CONTENT_TYPE_CONFIG]?.icon || '📄'}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm truncate">{item.title}</p>
                            <p className="text-xs text-gray-400">
                              {item.date.toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))
                ) : (
                  <div className="text-sm text-gray-500 text-center py-4">
                    No recent content yet. Generate some content to see it here.
                  </div>
                )}
              </div>
            )}

            {activeTab === 'templates' && (
              <div className="space-y-2">
                {templates.length > 0 ? (
                  templates
                    .filter(item => !searchQuery || item.title.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map(template => (
                      <button
                        key={template.id}
                        onClick={() => onContentSelect?.(template)}
                        className="w-full p-2 bg-gray-700/50 hover:bg-gray-700 rounded text-left transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-lg">
                            {CONTENT_TYPE_CONFIG[template.type as keyof typeof CONTENT_TYPE_CONFIG]?.icon || '📄'}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm truncate">{template.title}</p>
                            <p className="text-xs text-gray-400">Used {template.uses} times</p>
                          </div>
                          <Star className="w-4 h-4 text-yellow-400" />
                        </div>
                      </button>
                    ))
                ) : (
                  <div className="text-sm text-gray-500 text-center py-4">
                    No templates saved yet.
                  </div>
                )}
              </div>
            )}

            {activeTab === 'drafts' && (
              <div className="space-y-2">
                {drafts.length > 0 ? (
                  drafts
                    .filter(item => !searchQuery || item.title.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map(draft => (
                      <button
                        key={draft.id}
                        onClick={() => onContentSelect?.(draft)}
                        className="w-full p-2 bg-gray-700/50 hover:bg-gray-700 rounded text-left transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-lg">
                            {CONTENT_TYPE_CONFIG[draft.type as keyof typeof CONTENT_TYPE_CONFIG]?.icon || '📄'}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm truncate">{draft.title}</p>
                            <p className="text-xs text-gray-400">
                              Edited {draft.lastEdited.toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))
                ) : (
                  <div className="text-sm text-gray-500 text-center py-4">
                    No drafts saved yet.
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}