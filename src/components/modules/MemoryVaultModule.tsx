'use client'

import React, { useState, useEffect } from 'react'
import { Database, Search, Calendar, Tag, Download, Trash2, Eye, FolderOpen, FileText, Image, Video, Hash, BookOpen, Upload, Edit, FolderPlus, Folder } from 'lucide-react'
import { useNivStrategyV2 } from '@/hooks/useNivStrategyV2'
import type { StoredStrategy } from '@/types/niv-strategy'
import { CampaignOrchestrator } from '@/components/orchestration/CampaignOrchestrator'
import { CampaignItems } from '@/components/orchestration/CampaignItems'
import { useAppStore } from '@/stores/useAppStore'

interface ContentLibraryItem {
  id: string
  title: string
  content_type: string
  content: any
  metadata?: any
  created_at: string
  updated_at?: string
  organization_id?: string
  framework_data?: any
  opportunity_data?: any
  folder?: string
}

type ContentTab = 'all' | 'strategies' | 'media-plans' | 'uploads' | 'folders'

export default function MemoryVaultModule() {
  const { organization } = useAppStore()
  const {
    strategies,
    loadStrategy,
    refresh,
    deleteStrategy,
    exportStrategies,
    getRecentStrategies,
    useDatabase
  } = useNivStrategyV2()

  const [selectedStrategy, setSelectedStrategy] = useState<StoredStrategy | null>(null)
  const [selectedContent, setSelectedContent] = useState<ContentLibraryItem | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTag, setFilterTag] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<ContentTab>('all')
  const [allContent, setAllContent] = useState<ContentLibraryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [showFolderDialog, setShowFolderDialog] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [showSaveToFolderDialog, setShowSaveToFolderDialog] = useState(false)
  const [contentToMove, setContentToMove] = useState<ContentLibraryItem | null>(null)
  const [showNewDocDialog, setShowNewDocDialog] = useState(false)
  const [newDocTitle, setNewDocTitle] = useState('')
  const [newDocContent, setNewDocContent] = useState('')
  const [newDocFolder, setNewDocFolder] = useState('')
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // Function to fetch content from library
  const fetchContent = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/content-library/save?limit=500', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })

      const result = await response.json()
      if (result.success && result.data) {
        setAllContent(result.data)
      }
    } catch (error) {
      console.error('Error fetching content library:', error)
    } finally {
      setLoading(false)
    }
  }

  // Load strategies and all content on mount
  useEffect(() => {
    const fetchData = async () => {
      console.log('🔄 Memory Vault: Fetching data...')
      // Fetch strategies
      await refresh('*')
      // Fetch all content from content_library
      await fetchContent()
      console.log('✅ Memory Vault: Data loaded', {
        strategiesCount: strategies.length,
        contentCount: allContent.length
      })
    }
    fetchData()
  }, [refresh])

  // Add periodic refresh to catch new content
  useEffect(() => {
    const intervalId = setInterval(() => {
      console.log('🔄 Memory Vault: Auto-refreshing...')
      fetchContent()
      refresh('*')
    }, 5000) // Refresh every 5 seconds

    return () => clearInterval(intervalId)
  }, [])

  // Filter content based on tab, search and tags
  const getFilteredContent = () => {
    if (activeTab === 'strategies') {
      return strategies.filter(strategy => {
        const matchesSearch = !searchQuery ||
          strategy.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          strategy.objective?.toLowerCase().includes(searchQuery.toLowerCase())

        const matchesTag = !filterTag ||
          strategy.metadata?.tags?.includes(filterTag)

        return matchesSearch && matchesTag
      })
    }

    // Filter all content
    let filtered = allContent

    // Apply tab filter
    if (activeTab === 'media-plans') {
      filtered = filtered.filter(item =>
        item.metadata?.mediaPlan === true || item.folder?.startsWith('media-plans/')
      )
    } else if (activeTab === 'uploads') {
      filtered = filtered.filter(item =>
        item.metadata?.uploaded === true || item.folder?.startsWith('uploads/')
      )
    } else if (activeTab === 'folders') {
      // Only show content that has a folder assigned
      filtered = filtered.filter(item => item.folder && item.folder.length > 0)
    }

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.content_type?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    return filtered
  }

  const filteredContent = getFilteredContent()
  const filteredStrategies = activeTab === 'strategies' ? filteredContent as StoredStrategy[] : []

  // Get all unique tags
  const allTags = Array.from(new Set(
    strategies.flatMap(s => s.metadata?.tags || [])
  ))

  const handleViewStrategy = async (strategyId: string) => {
    const strategy = await loadStrategy(strategyId)
    if (strategy) {
      setSelectedStrategy(strategy)
    }
  }

  const handleDeleteStrategy = async (strategyId: string) => {
    if (confirm('Are you sure you want to delete this strategy?')) {
      await deleteStrategy(strategyId)
    }
  }

  const handleDeleteContent = async (contentId: string) => {
    if (confirm('Are you sure you want to delete this content?')) {
      try {
        const response = await fetch('/api/content-library', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: contentId })
        })

        if (response.ok) {
          // Refresh content list
          await fetchContent()
          // Clear selection if deleted item was selected
          if (selectedContent?.id === contentId) {
            setSelectedContent(null)
          }
        } else {
          alert('Failed to delete content')
        }
      } catch (error) {
        console.error('Error deleting content:', error)
        alert('Error deleting content')
      }
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setUploading(true)

    try {
      const uploadPromises = Array.from(files).map(file => {
        return new Promise<void>((resolve, reject) => {
          const reader = new FileReader()

          reader.onload = async (e) => {
            try {
              const content = e.target?.result as string

              // Determine content type
              let contentType = 'document'
              if (file.type.startsWith('image/')) contentType = 'image'
              else if (file.type.includes('pdf')) contentType = 'pdf'
              else if (file.type.startsWith('video/')) contentType = 'video'
              else if (file.name.endsWith('.md')) contentType = 'markdown'
              else if (file.name.endsWith('.txt')) contentType = 'text'

              // Save to content library
              const response = await fetch('/api/content-library/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  content: {
                    type: contentType,
                    title: file.name,
                    content: content,
                    timestamp: new Date().toISOString(),
                    organization_id: organization?.id
                  },
                  metadata: {
                    uploaded: true,
                    filename: file.name,
                    fileSize: file.size,
                    fileType: file.type,
                    uploadedAt: new Date().toISOString()
                  }
                })
              })

              if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to upload file')
              }

              resolve()
            } catch (error) {
              reject(error)
            }
          }

          reader.onerror = () => reject(new Error('Failed to read file'))

          // Read file based on type
          if (file.type.startsWith('image/') || file.type.includes('pdf')) {
            reader.readAsDataURL(file)
          } else {
            reader.readAsText(file)
          }
        })
      })

      // Wait for all uploads to complete
      await Promise.all(uploadPromises)

      // Refresh content after all uploads
      await fetchContent()
      setActiveTab('uploads')
      alert(`${files.length} file(s) uploaded successfully!`)

    } catch (error) {
      console.error('Error uploading files:', error)
      alert(`Error uploading files: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleOpenInExecute = (item: ContentLibraryItem) => {
    console.log('📤 Opening content in Execute:', item.title)

    // First, ensure Execute module is open on the canvas
    const openExecuteEvent = new CustomEvent('addComponentToCanvas', {
      detail: { moduleId: 'execute', action: 'window' }
    })
    window.dispatchEvent(openExecuteEvent)

    // Wait a bit for Execute to mount, then send the content
    setTimeout(() => {
      const contentEvent = new CustomEvent('openInExecute', {
        detail: {
          id: item.id,
          type: item.content_type,
          title: item.title,
          content: typeof item.content === 'string' ? item.content : JSON.stringify(item.content, null, 2),
          metadata: item.metadata,
          saved: true,
          timestamp: new Date(item.created_at).getTime()
        }
      })
      window.dispatchEvent(contentEvent)
      console.log('✅ Content event dispatched to Execute')
    }, 300)
  }

  const handleCreateFolder = () => {
    setShowFolderDialog(true)
  }

  const handleSaveFolderName = async () => {
    if (!newFolderName.trim()) {
      alert('Please enter a folder name')
      return
    }

    try {
      // Create a placeholder document to initialize the folder
      const response = await fetch('/api/content-library/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: {
            type: 'document',
            title: newFolderName.trim(),
            content: '',
            timestamp: new Date().toISOString(),
            organization_id: organization?.id
          },
          metadata: {
            isPlaceholder: true,
            folderName: newFolderName.trim()
          },
          folder: `custom-folders/${newFolderName.trim()}`
        })
      })

      if (response.ok) {
        await fetchContent()
        setShowFolderDialog(false)
        setNewFolderName('')
        setActiveTab('folders')
        alert(`Folder "${newFolderName.trim()}" created successfully!`)
      } else {
        const errorData = await response.json()
        alert(`Failed to create folder: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error creating folder:', error)
      alert(`Error creating folder: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleMoveToFolder = (item: ContentLibraryItem) => {
    setContentToMove(item)
    setShowSaveToFolderDialog(true)
  }

  const handleSaveToFolder = async (folderName: string) => {
    if (!contentToMove) return

    try {
      // Update the content with folder path
      const response = await fetch('/api/content-library', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: contentToMove.id,
          folder: `custom-folders/${folderName}`
        })
      })

      if (response.ok) {
        await fetchContent()
        setShowSaveToFolderDialog(false)
        setContentToMove(null)
        alert(`Moved to folder: ${folderName}`)
      } else {
        alert('Failed to move content to folder')
      }
    } catch (error) {
      console.error('Error moving content to folder:', error)
      alert('Error moving content to folder')
    }
  }

  // Get unique folder names from content
  const getFolders = () => {
    const folders = new Set<string>()
    allContent.forEach(item => {
      if (item.folder) {
        // Extract folder name from path
        const folderName = item.folder.replace('custom-folders/', '').replace('media-plans/', '')
        folders.add(folderName)
      }
    })
    return Array.from(folders).sort()
  }

  // Handle creating a new document
  const handleCreateDocument = async () => {
    if (!newDocTitle.trim()) {
      alert('Please enter a document title')
      return
    }

    try {
      const folderPath = newDocFolder.trim()
        ? `custom-folders/${newDocFolder.trim()}`
        : undefined

      const response = await fetch('/api/content-library/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: {
            type: 'document',
            title: newDocTitle,
            content: newDocContent,
            timestamp: new Date().toISOString(),
            organization_id: organization?.id
          },
          metadata: {
            createdManually: true,
            createdAt: new Date().toISOString()
          },
          folder: folderPath
        })
      })

      if (response.ok) {
        await fetchContent()
        setShowNewDocDialog(false)
        setNewDocTitle('')
        setNewDocContent('')
        setNewDocFolder('')
        setActiveTab('folders')
        alert('Document created successfully!')
      } else {
        const errorData = await response.json()
        alert(`Failed to create document: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error creating document:', error)
      alert(`Error creating document: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleExport = async () => {
    const exported = await exportStrategies()
    const blob = new Blob([JSON.stringify(exported, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `memory-vault-export-${new Date().toISOString().split('T')[0]}.json`
    a.click()
  }

  // Orchestration handlers
  const handleExecuteWorkflow = async (workflowType: string) => {
    if (!selectedStrategy) return

    console.log(`Executing ${workflowType} for strategy:`, selectedStrategy.id)

    // Special handling for strategic planning workflow
    if (workflowType === 'strategic_planning') {
      // Dispatch event to open Strategic Planning with the framework
      const event = new CustomEvent('addComponentToCanvas', {
        detail: {
          moduleId: 'plan',
          action: 'window',
          framework: selectedStrategy // Pass the framework data
        }
      })
      window.dispatchEvent(event)
      return
    }

    // Here we'll call the appropriate service based on workflow type
    // For now, we'll simulate the execution
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        console.log(`${workflowType} completed`)
        resolve()
      }, 2000)
    })
  }

  const handleExecuteAllWorkflows = async () => {
    if (!selectedStrategy) return

    console.log('Executing all workflows for strategy:', selectedStrategy.id)

    // Execute all workflows in parallel or sequence
    const workflows = [
      'content_generation',
      'media_outreach',
      'intelligence_gathering',
      'strategic_planning'
    ]

    await Promise.all(
      workflows.map(workflow => handleExecuteWorkflow(workflow))
    )
  }

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Database className="w-6 h-6" style={{ color: '#ffaa00' }} />
            <h2 className="text-xl font-bold">Memory Vault</h2>
            <div className={`px-2 py-1 rounded text-xs ${useDatabase ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
              {useDatabase ? 'Database' : 'Local'}
            </div>
            <span className="text-xs text-gray-500 ml-2">
              {allContent.length + strategies.length} items
            </span>
          </div>
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileUpload}
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.txt,.md"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 px-3 py-1 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 rounded-lg transition-colors disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
            <button
              onClick={() => setShowNewDocDialog(true)}
              className="flex items-center gap-2 px-3 py-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors"
            >
              <FileText className="w-4 h-4" />
              New Document
            </button>
            <button
              onClick={handleCreateFolder}
              className="flex items-center gap-2 px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors"
            >
              <FolderPlus className="w-4 h-4" />
              New Folder
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'all'
                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
            }`}
          >
            <FolderOpen className="w-4 h-4" />
            All Content
          </button>
          <button
            onClick={() => setActiveTab('strategies')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'strategies'
                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            NIV Strategies
          </button>
          <button
            onClick={() => setActiveTab('media-plans')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'media-plans'
                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
            }`}
          >
            <FolderOpen className="w-4 h-4" />
            Media Plans
          </button>
          <button
            onClick={() => setActiveTab('uploads')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'uploads'
                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
            }`}
          >
            <FileText className="w-4 h-4" />
            Uploads
          </button>
          <button
            onClick={() => setActiveTab('folders')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'folders'
                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
            }`}
          >
            <Folder className="w-4 h-4" />
            Folders
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Content List */}
        <div className="w-1/3 border-r border-gray-800 overflow-y-auto">
          <div className="p-2">
            <div className="text-xs text-gray-500 px-2 py-1">
              {filteredContent.length} {activeTab === 'all' ? 'items' : activeTab}
            </div>
            <div className="space-y-1">
              {activeTab === 'strategies' ? (
                // Show strategies
                filteredStrategies.map(strategy => (
                <div
                  key={strategy.id}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedStrategy?.id === strategy.id
                      ? 'bg-yellow-500/10 border border-yellow-500/30'
                      : 'bg-gray-800/50 hover:bg-gray-800'
                  }`}
                  onClick={() => handleViewStrategy(strategy.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-sm line-clamp-1">{strategy.title}</h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(strategy.created).toLocaleDateString()}
                      </p>
                      {strategy.metadata?.tags && strategy.metadata.tags.length > 0 && (
                        <div className="flex gap-1 mt-2">
                          {strategy.metadata.tags.slice(0, 3).map(tag => (
                            <span key={tag} className="px-1.5 py-0.5 bg-gray-700 rounded text-xs">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1 ml-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleViewStrategy(strategy.id)
                        }}
                        className="p-1 hover:bg-gray-700 rounded"
                      >
                        <Eye className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteStrategy(strategy.id)
                        }}
                        className="p-1 hover:bg-red-500/20 rounded text-red-400"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
              ) : activeTab === 'media-plans' || activeTab === 'folders' ? (
                // Show media plans or folders grouped by folder
                (() => {
                  const grouped = (filteredContent as ContentLibraryItem[]).reduce((acc, item) => {
                    const folder = item.folder || 'uncategorized'
                    if (!acc[folder]) acc[folder] = []
                    acc[folder].push(item)
                    return acc
                  }, {} as Record<string, ContentLibraryItem[]>)

                  return Object.entries(grouped).map(([folder, items]) => (
                    <div key={folder} className="mb-4">
                      <div className="flex items-center gap-2 px-2 py-1 mb-2">
                        <FolderOpen className="w-4 h-4 text-yellow-500" />
                        <h3 className="font-medium text-sm text-yellow-500">
                          {folder.replace('media-plans/', '').replace('custom-folders/', '').replace('uploads/', '')}
                        </h3>
                        <span className="text-xs text-gray-500">({items.length} items)</span>
                      </div>
                      {items.map(item => (
                        <div
                          key={item.id}
                          className={`p-3 rounded-lg cursor-pointer transition-colors ml-4 mb-1 ${
                            selectedContent?.id === item.id
                              ? 'bg-yellow-500/10 border border-yellow-500/30'
                              : 'bg-gray-800/50 hover:bg-gray-800'
                          }`}
                          onClick={() => setSelectedContent(item)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <FileText className="w-3.5 h-3.5 text-gray-400" />
                                <h3 className="font-medium text-sm line-clamp-1">{item.title}</h3>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                {item.content_type}
                              </p>
                            </div>
                            <div className="flex gap-1 ml-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedContent(item)
                                }}
                                className="p-1 hover:bg-gray-700 rounded"
                                title="View"
                              >
                                <Eye className="w-3 h-3" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleOpenInExecute(item)
                                }}
                                className="p-1 hover:bg-yellow-500/20 rounded text-yellow-400"
                                title="Open in Execute"
                              >
                                <Edit className="w-3 h-3" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteContent(item.id)
                                }}
                                className="p-1 hover:bg-red-500/20 rounded text-red-400"
                                title="Delete"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))
                })()
              ) : (
                // Show other content
                (filteredContent as ContentLibraryItem[]).map(item => (
                  <div
                    key={item.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedContent?.id === item.id
                        ? 'bg-yellow-500/10 border border-yellow-500/30'
                        : 'bg-gray-800/50 hover:bg-gray-800'
                    }`}
                    onClick={() => setSelectedContent(item)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {item.content_type === 'image' && <Image className="w-4 h-4 text-blue-400" />}
                          {item.content_type === 'video' && <Video className="w-4 h-4 text-purple-400" />}
                          {item.content_type === 'social-post' && <Hash className="w-4 h-4 text-green-400" />}
                          {!['image', 'video', 'social-post'].includes(item.content_type) && <FileText className="w-4 h-4 text-gray-400" />}
                          <h3 className="font-medium text-sm line-clamp-1">{item.title}</h3>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {item.content_type} • {new Date(item.created_at).toLocaleDateString()}
                        </p>
                        {item.metadata?.tags && item.metadata.tags.length > 0 && (
                          <div className="flex gap-1 mt-2">
                            {item.metadata.tags.slice(0, 3).map((tag: string) => (
                              <span key={tag} className="px-1.5 py-0.5 bg-gray-700 rounded text-xs">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-1 ml-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedContent(item)
                          }}
                          className="p-1 hover:bg-gray-700 rounded"
                          title="View"
                        >
                          <Eye className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleOpenInExecute(item)
                          }}
                          className="p-1 hover:bg-yellow-500/20 rounded text-yellow-400"
                          title="Open in Execute"
                        >
                          <Edit className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleMoveToFolder(item)
                          }}
                          className="p-1 hover:bg-blue-500/20 rounded text-blue-400"
                          title="Move to Folder"
                        >
                          <Folder className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteContent(item.id)
                          }}
                          className="p-1 hover:bg-red-500/20 rounded text-red-400"
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Content Details */}
        <div className="flex-1 overflow-y-auto">
          {selectedContent ? (
            // Show selected content
            <div className="p-6 space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">{selectedContent.title}</h2>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(selectedContent.created_at).toLocaleString()}
                  </span>
                  <span className="px-2 py-1 bg-gray-800 rounded text-xs">
                    {selectedContent.content_type}
                  </span>
                </div>
              </div>

              {/* Content Display */}
              <div className="bg-gray-800/50 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-2" style={{ color: '#ffaa00' }}>Content</h3>
                {typeof selectedContent.content === 'string' ? (
                  <pre className="whitespace-pre-wrap text-gray-200 font-sans">
                    {selectedContent.content}
                  </pre>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(selectedContent.content || {}).map(([key, value]) => (
                      <div key={key}>
                        <h4 className="text-sm font-medium text-gray-400 mb-1 capitalize">
                          {key.replace(/_/g, ' ')}
                        </h4>
                        <p className="text-gray-200">
                          {typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Framework Data */}
              {selectedContent.framework_data && (
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-2" style={{ color: '#ffaa00' }}>Framework</h3>
                  <pre className="text-xs text-gray-400 overflow-auto">
                    {JSON.stringify(selectedContent.framework_data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ) : selectedStrategy ? (
            <div className="p-6 space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">{selectedStrategy.title}</h2>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(selectedStrategy.created).toLocaleString()}
                  </span>
                  {selectedStrategy.metadata?.organizationName && (
                    <span>{selectedStrategy.metadata.organizationName}</span>
                  )}
                </div>
              </div>

              {/* Strategic Framework */}
              {selectedStrategy.strategy && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2" style={{ color: '#ffaa00' }}>
                      Strategic Framework
                    </h3>

                    {/* Primary Fields - Used by ALL components */}
                    <div className="bg-gray-800/50 rounded-lg p-4 mb-4">
                      <h4 className="text-sm font-medium text-yellow-400 mb-3">Core Strategy (All Components)</h4>

                      {(selectedStrategy.strategy.objective || selectedStrategy.objective) && (
                        <div className="mb-3">
                          <h5 className="text-xs font-medium text-gray-400 mb-1">🎯 Objective</h5>
                          <p className="text-gray-200">{selectedStrategy.strategy.objective || selectedStrategy.objective}</p>
                        </div>
                      )}

                      {(selectedStrategy.strategy as any).narrative && (
                        <div className="mb-3">
                          <h5 className="text-xs font-medium text-gray-400 mb-1">📖 Narrative</h5>
                          <p className="text-gray-200">{(selectedStrategy.strategy as any).narrative}</p>
                        </div>
                      )}

                      {(selectedStrategy.strategy as any).proof_points && (selectedStrategy.strategy as any).proof_points.length > 0 && (
                        <div className="mb-3">
                          <h5 className="text-xs font-medium text-gray-400 mb-1">✅ Proof Points</h5>
                          <ul className="space-y-1">
                            {(selectedStrategy.strategy as any).proof_points.map((point: string, i: number) => (
                              <li key={i} className="text-gray-200 flex items-start">
                                <span className="text-green-500 mr-2">•</span>
                                <span className="text-sm">{point}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Component-Specific Fields */}
                    {(selectedStrategy.strategy as any).content_needs && (
                      <div className="bg-gray-800/50 rounded-lg p-4 mb-4">
                        <h4 className="text-sm font-medium text-blue-400 mb-3">📝 Content Needs (Content Generator)</h4>
                        {(selectedStrategy.strategy as any).content_needs.priority_content && (
                          <div className="mb-2">
                            <h5 className="text-xs font-medium text-gray-400 mb-1">Priority Content</h5>
                            <ul className="space-y-1">
                              {(selectedStrategy.strategy as any).content_needs.priority_content.map((content: string, i: number) => (
                                <li key={i} className="text-gray-200 text-sm">• {content}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {(selectedStrategy.strategy as any).media_targets && (
                      <div className="bg-gray-800/50 rounded-lg p-4 mb-4">
                        <h4 className="text-sm font-medium text-purple-400 mb-3">📰 Media Targets (Media Outreach)</h4>
                        {(selectedStrategy.strategy as any).media_targets.tier_1_targets && (
                          <div className="mb-2">
                            <h5 className="text-xs font-medium text-gray-400 mb-1">Tier 1 Outlets</h5>
                            <ul className="space-y-1">
                              {(selectedStrategy.strategy as any).media_targets.tier_1_targets.map((target: string, i: number) => (
                                <li key={i} className="text-gray-200 text-sm">• {target}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {(selectedStrategy.strategy as any).timeline_execution && (
                      <div className="bg-gray-800/50 rounded-lg p-4 mb-4">
                        <h4 className="text-sm font-medium text-orange-400 mb-3">⏱️ Timeline (Strategic Planning)</h4>
                        {(selectedStrategy.strategy as any).timeline_execution.immediate && (
                          <div className="mb-2">
                            <h5 className="text-xs font-medium text-gray-400 mb-1">Immediate (24-48 hours)</h5>
                            <ul className="space-y-1">
                              {(selectedStrategy.strategy as any).timeline_execution.immediate.map((action: string, i: number) => (
                                <li key={i} className="text-gray-200 text-sm">• {action}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {(selectedStrategy.strategy as any).timeline_execution.week_1 && (
                          <div className="mb-2">
                            <h5 className="text-xs font-medium text-gray-400 mb-1">Week 1</h5>
                            <ul className="space-y-1">
                              {(selectedStrategy.strategy as any).timeline_execution.week_1.map((action: string, i: number) => (
                                <li key={i} className="text-gray-200 text-sm">• {action}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Legacy fields */}
                    {selectedStrategy.strategy.approach && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-400 mb-1">Approach</h4>
                        <p className="text-gray-200">{selectedStrategy.strategy.approach}</p>
                      </div>
                    )}

                    {selectedStrategy.strategy.keyMessages && selectedStrategy.strategy.keyMessages.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-400 mb-1">Key Messages</h4>
                        <ul className="space-y-1">
                          {selectedStrategy.strategy.keyMessages.map((msg, i) => (
                            <li key={i} className="text-gray-200 flex items-start">
                              <span className="text-yellow-500 mr-2">•</span>
                              <span>{msg}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Research Findings */}
              {selectedStrategy.research && (
                <div>
                  <h3 className="text-lg font-semibold mb-2" style={{ color: '#ffaa00' }}>
                    Research Insights
                  </h3>

                  {selectedStrategy.research.keyFindings && selectedStrategy.research.keyFindings.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-400 mb-1">Key Findings</h4>
                      <ul className="space-y-1">
                        {selectedStrategy.research.keyFindings.map((finding, i) => (
                          <li key={i} className="text-gray-200 flex items-start">
                            <span className="text-green-500 mr-2">✓</span>
                            <span>{finding}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedStrategy.research.gaps && selectedStrategy.research.gaps.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-400 mb-1">Risk Factors / Gaps</h4>
                      <ul className="space-y-1">
                        {selectedStrategy.research.gaps.map((gap, i) => (
                          <li key={i} className="text-gray-200 flex items-start">
                            <span className="text-orange-500 mr-2">⚠️</span>
                            <span>{gap}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedStrategy.research.sources && selectedStrategy.research.sources.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-400 mb-1">Research Sources ({selectedStrategy.research.sources.length})</h4>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {selectedStrategy.research.sources.slice(0, 10).map((source: any, i) => (
                          <div key={i} className="text-xs bg-gray-800/30 rounded p-2">
                            <div className="font-medium text-gray-300">
                              {source.title || source.headline || `Source ${i + 1}`}
                            </div>
                            {source.url && (
                              <div className="text-gray-500 truncate">
                                {source.url}
                              </div>
                            )}
                            {source.excerpt && (
                              <div className="text-gray-400 mt-1 line-clamp-2">
                                {source.excerpt}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Campaign Orchestration - Execute Workflows */}
              <CampaignOrchestrator
                strategy={selectedStrategy}
                onExecuteWorkflow={handleExecuteWorkflow}
                onExecuteAll={handleExecuteAllWorkflows}
              />

              {/* Campaign Items */}
              <CampaignItems
                strategyId={selectedStrategy.id}
                items={[]} // TODO: Fetch actual items from database
                onOpenItem={(item) => {
                  console.log('Opening item:', item)
                  // TODO: Open in appropriate component
                }}
              />

              {/* Workflow Status */}
              {selectedStrategy.workflows && (
                <div>
                  <h3 className="text-lg font-semibold mb-2" style={{ color: '#ffaa00' }}>
                    Workflow Configuration
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(selectedStrategy.workflows).map(([key, value]) => (
                      <div
                        key={key}
                        className="p-3 bg-gray-800/50 rounded-lg flex items-center justify-between"
                      >
                        <span className="text-sm capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          value.enabled ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-500'
                        }`}>
                          {value.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              <div className="text-center">
                <Database className="w-12 h-12 mx-auto mb-2" style={{ color: '#ffaa00' }} />
                <p>Select {activeTab === 'strategies' ? 'a strategy' : 'content'} to view details</p>
                {loading && <p className="text-xs mt-2">Loading content library...</p>}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Folder Creation Dialog */}
      {showFolderDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 w-96 border border-gray-800">
            <h3 className="text-lg font-bold mb-4">Create New Folder</h3>
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Folder name"
              className="w-full px-3 py-2 bg-gray-800 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowFolderDialog(false)
                  setNewFolderName('')
                }}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveFolderName}
                className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Move to Folder Dialog */}
      {showSaveToFolderDialog && contentToMove && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 w-96 border border-gray-800">
            <h3 className="text-lg font-bold mb-4">Move to Folder</h3>
            <p className="text-sm text-gray-400 mb-4">Select or create a folder for: {contentToMove.title}</p>

            <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
              {getFolders().map(folder => (
                <button
                  key={folder}
                  onClick={() => handleSaveToFolder(folder)}
                  className="w-full px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-left transition-colors flex items-center gap-2"
                >
                  <Folder className="w-4 h-4 text-blue-400" />
                  {folder}
                </button>
              ))}
            </div>

            <div className="mb-4">
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Or create new folder"
                className="w-full px-3 py-2 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowSaveToFolderDialog(false)
                  setContentToMove(null)
                  setNewFolderName('')
                }}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (newFolderName.trim()) {
                    handleSaveToFolder(newFolderName.trim())
                    setNewFolderName('')
                  }
                }}
                disabled={!newFolderName.trim()}
                className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors disabled:opacity-50"
              >
                Move
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Document Dialog */}
      {showNewDocDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 w-[600px] border border-gray-800">
            <h3 className="text-lg font-bold mb-4">Create New Document</h3>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Title</label>
                <input
                  type="text"
                  value={newDocTitle}
                  onChange={(e) => setNewDocTitle(e.target.value)}
                  placeholder="Document title"
                  className="w-full px-3 py-2 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-2 block">Content</label>
                <textarea
                  value={newDocContent}
                  onChange={(e) => setNewDocContent(e.target.value)}
                  placeholder="Document content (optional)"
                  className="w-full px-3 py-2 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 min-h-[200px]"
                />
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-2 block">Folder (optional)</label>
                <input
                  type="text"
                  value={newDocFolder}
                  onChange={(e) => setNewDocFolder(e.target.value)}
                  placeholder="Enter folder name or leave empty"
                  className="w-full px-3 py-2 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                {getFolders().length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {getFolders().map(folder => (
                      <button
                        key={folder}
                        onClick={() => setNewDocFolder(folder)}
                        className="px-2 py-1 bg-gray-800 hover:bg-gray-700 rounded text-xs transition-colors flex items-center gap-1"
                      >
                        <Folder className="w-3 h-3 text-blue-400" />
                        {folder}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 justify-end mt-6">
              <button
                onClick={() => {
                  setShowNewDocDialog(false)
                  setNewDocTitle('')
                  setNewDocContent('')
                  setNewDocFolder('')
                }}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateDocument}
                disabled={!newDocTitle.trim()}
                className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors disabled:opacity-50"
              >
                Create Document
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}