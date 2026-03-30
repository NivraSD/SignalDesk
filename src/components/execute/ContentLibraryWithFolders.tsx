'use client'

import React, { useState, useEffect } from 'react'
import {
  Clock,
  FileText,
  Star,
  Tag,
  Folder,
  FolderOpen,
  Search,
  ChevronRight,
  ChevronDown,
  Plus,
  FolderPlus,
  File,
  Hash,
  Mail,
  Image as ImageIcon,
  Video,
  Presentation,
  BookOpen,
  MessageSquare
} from 'lucide-react'
import { CONTENT_TYPE_CONFIG } from '@/types/content'

interface ContentLibraryProps {
  organization: any
  className?: string
  onContentSelect?: (content: any) => void
}

type LibraryView = 'folders' | 'recent' | 'templates' | 'drafts'

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
  folder?: string // Added folder field
}

interface FolderStructure {
  name: string
  path: string
  items: ContentItem[]
  subfolders: FolderStructure[]
  isOpen?: boolean
  createdAt?: Date
}

// Icon mapping for content types
const CONTENT_ICONS: Record<string, any> = {
  'press-release': FileText,
  'blog-post': BookOpen,
  'social-post': Hash,
  'email': Mail,
  'image': ImageIcon,
  'video': Video,
  'presentation': Presentation,
  'messaging': MessageSquare,
  'media-pitch': FileText,
  'talking-points': MessageSquare,
  'campaign-plan': FileText,
  'text': FileText
}

export default function ContentLibraryWithFolders({
  organization,
  className = '',
  onContentSelect
}: ContentLibraryProps) {
  const [activeView, setActiveView] = useState<LibraryView>('folders')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [contentItems, setContentItems] = useState<ContentItem[]>([])
  const [folders, setFolders] = useState<FolderStructure[]>([])
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Fetch content from API
  useEffect(() => {
    fetchContentLibrary()
  }, [organization])

  // Process content into folders
  useEffect(() => {
    organizeFolders()
  }, [contentItems])

  const fetchContentLibrary = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (organization?.id) {
        params.append('organization_id', organization.id)
      }
      params.append('limit', '500') // Get more items for folder organization

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
        setContentItems([])
      }
    } catch (error) {
      console.error('Error fetching content library:', error)
      setError('Failed to load content library')
      setContentItems([])
    } finally {
      setLoading(false)
    }
  }

  // Organize content into folder structure
  const organizeFolders = () => {
    const folderMap = new Map<string, FolderStructure>()
    const rootItems: ContentItem[] = []

    contentItems.forEach(item => {
      // Try to get folder from metadata.folder or item.folder (direct property)
      let folderName = item.metadata?.folder || item.folder || null

      // If no folder found, try to extract from tags
      if (!folderName && item.tags && Array.isArray(item.tags)) {
        const folderTag = item.tags.find(tag => typeof tag === 'string' && tag.includes(' - '))
        folderName = folderTag || null
      }

      if (folderName) {
        if (!folderMap.has(folderName)) {
          folderMap.set(folderName, {
            name: folderName,
            path: folderName,
            items: [],
            subfolders: [],
            isOpen: false,
            createdAt: new Date(item.created_at)
          })
        }
        folderMap.get(folderName)!.items.push(item)
      } else {
        rootItems.push(item)
      }
    })

    // Convert map to array and sort by date
    const folderArray = Array.from(folderMap.values()).sort((a, b) => {
      const dateA = a.createdAt?.getTime() || 0
      const dateB = b.createdAt?.getTime() || 0
      return dateB - dateA
    })

    // Add unfiled items as a special folder if any exist
    if (rootItems.length > 0) {
      folderArray.push({
        name: 'Unfiled',
        path: 'unfiled',
        items: rootItems,
        subfolders: [],
        isOpen: false
      })
    }

    setFolders(folderArray)
  }

  // Toggle folder open/close
  const toggleFolder = (folderPath: string) => {
    setFolders(prevFolders =>
      prevFolders.map(folder =>
        folder.path === folderPath
          ? { ...folder, isOpen: !folder.isOpen }
          : folder
      )
    )
  }

  // Handle content selection
  const handleContentSelect = (item: ContentItem) => {
    // Parse content if it's a string
    let content = item.content
    if (typeof content === 'string') {
      try {
        content = JSON.parse(content)
      } catch (e) {
        // Keep as string if not JSON
      }
    }

    // Create content item for workspace
    const workspaceItem = {
      id: item.id,
      type: item.content_type || 'text',
      content: content,
      title: item.title,
      saved: true,
      timestamp: new Date(item.created_at).getTime(),
      metadata: {
        ...item.metadata,
        folder: item.metadata?.folder || item.tags?.find(tag => tag.includes(' - '))
      }
    }

    if (onContentSelect) {
      onContentSelect(workspaceItem)
    }
  }

  // Filter content based on search
  const filterContent = (items: ContentItem[]) => {
    if (!searchQuery) return items
    const query = searchQuery.toLowerCase()
    return items.filter(item =>
      item.title?.toLowerCase().includes(query) ||
      item.content_type?.toLowerCase().includes(query) ||
      item.tags?.some(tag => tag.toLowerCase().includes(query))
    )
  }

  // Render folder tree
  const renderFolderTree = () => {
    return (
      <div className="space-y-1">
        {folders.map(folder => (
          <div key={folder.path} className="select-none">
            <div
              onClick={() => toggleFolder(folder.path)}
              className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-700 rounded cursor-pointer group"
            >
              {folder.isOpen ? (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-400" />
              )}
              {folder.isOpen ? (
                <FolderOpen className="w-4 h-4 text-yellow-500" />
              ) : (
                <Folder className="w-4 h-4 text-yellow-600" />
              )}
              <span className="text-sm flex-1">{folder.name}</span>
              <span className="text-xs text-gray-500 opacity-0 group-hover:opacity-100">
                {folder.items.length} items
              </span>
            </div>

            {/* Folder contents */}
            {folder.isOpen && (
              <div className="ml-6 space-y-0.5">
                {filterContent(folder.items).map(item => {
                  const Icon = CONTENT_ICONS[item.content_type] || File
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleContentSelect(item)}
                      className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-700 rounded cursor-pointer group"
                    >
                      <Icon className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-300 flex-1 truncate">
                        {item.title}
                      </span>
                      <span className="text-xs text-gray-500 opacity-0 group-hover:opacity-100">
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    )
  }

  // Render recent items
  const renderRecentItems = () => {
    const recentItems = contentItems
      .filter(item => item.status !== 'draft' && item.status !== 'template')
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 20)

    return (
      <div className="space-y-1">
        {filterContent(recentItems).map(item => {
          const Icon = CONTENT_ICONS[item.content_type] || File
          return (
            <div
              key={item.id}
              onClick={() => handleContentSelect(item)}
              className="flex items-center gap-3 px-3 py-2 hover:bg-gray-700 rounded cursor-pointer"
            >
              <Icon className="w-4 h-4 text-gray-400" />
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{item.title}</p>
                <p className="text-xs text-gray-500">
                  {item.metadata?.folder && (
                    <span className="mr-2">📂 {item.metadata.folder}</span>
                  )}
                  {new Date(item.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className={`content-library bg-gray-800 rounded-lg flex flex-col ${className}`}>
      {/* Header */}
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

        {/* View tabs */}
        <div className="flex px-3">
          <button
            onClick={() => setActiveView('folders')}
            className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeView === 'folders'
                ? 'text-purple-400 border-purple-400'
                : 'text-gray-400 border-transparent hover:text-gray-300'
            }`}
          >
            <Folder className="w-4 h-4 inline mr-1.5" />
            Folders
          </button>
          <button
            onClick={() => setActiveView('recent')}
            className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeView === 'recent'
                ? 'text-purple-400 border-purple-400'
                : 'text-gray-400 border-transparent hover:text-gray-300'
            }`}
          >
            <Clock className="w-4 h-4 inline mr-1.5" />
            Recent
          </button>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto p-3">
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-flex items-center gap-2 text-sm text-gray-400">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-600 border-t-purple-500"></div>
              Loading library...
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        ) : contentItems.length === 0 ? (
          <div className="text-center py-8">
            <Folder className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No content yet</p>
            <p className="text-xs text-gray-500 mt-1">Generated content will appear here</p>
          </div>
        ) : (
          <>
            {activeView === 'folders' && renderFolderTree()}
            {activeView === 'recent' && renderRecentItems()}
          </>
        )}
      </div>

      {/* Footer with folder count */}
      {!loading && !error && contentItems.length > 0 && (
        <div className="border-t border-gray-700 px-3 py-2">
          <p className="text-xs text-gray-500">
            {folders.length} folders • {contentItems.length} items
          </p>
        </div>
      )}
    </div>
  )
}