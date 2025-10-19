'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  // Content Types Icons
  FileText,
  Hash,
  Mail,
  Briefcase,
  AlertTriangle,
  Mic,
  BookOpen,
  MessageSquare,
  Users,
  Image as ImageIcon,
  Video,
  Presentation,
  Megaphone,
  TrendingUp,
  FileCheck,
  Globe,
  Newspaper,
  Radio,
  Tv,
  // UI Icons
  ChevronRight,
  ChevronDown,
  Library,
  ListOrdered,
  X,
  Maximize2,
  Minimize2,
  Sparkles
} from 'lucide-react'
import NIVContentOrchestrator from './NIVContentOrchestratorProduction'
import ContentQueue from './ContentQueue'
import ContentWorkspace from './ContentWorkspace'
import ContentLibraryWithFolders from './ContentLibraryWithFolders'
import ContentPrompts from './ContentPrompts'
import type { NivStrategicFramework } from '@/types/niv-strategic-framework'
import type { QueueItem } from './ContentQueue'
import type { ContentItem } from './ContentWorkspace'
import { useAppStore } from '@/stores/useAppStore'

// ALL content types - properly organized
const CONTENT_TYPES = [
  // Written Content
  { id: 'press-release', label: 'Press Release', icon: FileText, category: 'Written' },
  { id: 'blog-post', label: 'Blog Post', icon: BookOpen, category: 'Written' },
  { id: 'thought-leadership', label: 'Thought Leadership', icon: TrendingUp, category: 'Written' },
  { id: 'case-study', label: 'Case Study', icon: FileCheck, category: 'Written' },
  { id: 'white-paper', label: 'White Paper', icon: FileText, category: 'Written' },
  { id: 'ebook', label: 'eBook', icon: BookOpen, category: 'Written' },
  { id: 'qa-document', label: 'Q&A Document', icon: MessageSquare, category: 'Written' },

  // Social & Digital
  { id: 'social-post', label: 'Social Media Post', icon: Hash, category: 'Social' },
  { id: 'linkedin-article', label: 'LinkedIn Article', icon: Briefcase, category: 'Social' },
  { id: 'twitter-thread', label: 'Twitter Thread', icon: Hash, category: 'Social' },
  { id: 'instagram-caption', label: 'Instagram Caption', icon: ImageIcon, category: 'Social' },
  { id: 'facebook-post', label: 'Facebook Post', icon: Hash, category: 'Social' },

  // Email & Campaigns
  { id: 'email', label: 'Email Campaign', icon: Mail, category: 'Email' },
  { id: 'newsletter', label: 'Newsletter', icon: Newspaper, category: 'Email' },
  { id: 'drip-sequence', label: 'Email Drip Sequence', icon: Mail, category: 'Email' },
  { id: 'cold-outreach', label: 'Cold Outreach', icon: Mail, category: 'Email' },

  // Executive & Crisis
  { id: 'executive-statement', label: 'Executive Statement', icon: Briefcase, category: 'Executive' },
  { id: 'board-presentation', label: 'Board Presentation', icon: Presentation, category: 'Executive' },
  { id: 'investor-update', label: 'Investor Update', icon: TrendingUp, category: 'Executive' },
  { id: 'crisis-response', label: 'Crisis Response', icon: AlertTriangle, category: 'Executive' },
  { id: 'apology-statement', label: 'Apology Statement', icon: MessageSquare, category: 'Executive' },

  // Media & PR
  { id: 'media-pitch', label: 'Media Pitch', icon: Megaphone, category: 'Media' },
  { id: 'media-kit', label: 'Media Kit', icon: Briefcase, category: 'Media' },
  { id: 'podcast-pitch', label: 'Podcast Pitch', icon: Mic, category: 'Media' },
  { id: 'tv-interview-prep', label: 'TV Interview Prep', icon: Tv, category: 'Media' },

  // Strategy & Messaging
  { id: 'messaging', label: 'Messaging Framework', icon: MessageSquare, category: 'Strategy' },
  { id: 'brand-narrative', label: 'Brand Narrative', icon: BookOpen, category: 'Strategy' },
  { id: 'value-proposition', label: 'Value Proposition', icon: TrendingUp, category: 'Strategy' },
  { id: 'competitive-positioning', label: 'Competitive Positioning', icon: TrendingUp, category: 'Strategy' },

  // Visual Content
  { id: 'image', label: 'Image', icon: ImageIcon, category: 'Visual' },
  { id: 'infographic', label: 'Infographic', icon: ImageIcon, category: 'Visual' },
  { id: 'social-graphics', label: 'Social Graphics', icon: ImageIcon, category: 'Visual' },
  { id: 'presentation', label: 'Presentation', icon: Presentation, category: 'Visual' },
  { id: 'video', label: 'Video (Veo)', icon: Video, category: 'Visual' }
]

interface ExecuteTabProductionProps {
  framework?: NivStrategicFramework
  opportunity?: any
}

export default function ExecuteTabProduction({
  framework,
  opportunity
}: ExecuteTabProductionProps) {
  const { organization } = useAppStore()
  const [selectedContentType, setSelectedContentType] = useState<string>('')
  const [generatedContent, setGeneratedContent] = useState<ContentItem[]>([])
  const [showWorkspace, setShowWorkspace] = useState(false)
  const [currentContent, setCurrentContent] = useState<ContentItem | null>(null)
  const [queueItems, setQueueItems] = useState<QueueItem[]>([])
  const [showQueue, setShowQueue] = useState(false)
  const [showLibrary, setShowLibrary] = useState(false)
  const [showPrompts, setShowPrompts] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState(new Set<string>())

  // Use ref to maintain content across re-renders
  const currentContentRef = useRef<ContentItem | null>(null)

  // Listen for openInExecute events from Memory Vault
  useEffect(() => {
    const handleOpenInExecute = (event: CustomEvent) => {
      const content = event.detail as ContentItem
      console.log('📥 Opening content from Memory Vault:', content)

      setCurrentContent(content)
      currentContentRef.current = content
      setShowWorkspace(true)
    }

    window.addEventListener('openInExecute' as any, handleOpenInExecute)
    return () => window.removeEventListener('openInExecute' as any, handleOpenInExecute)
  }, [])

  // Handle content type selection
  const handleContentTypeSelect = (typeId: string) => {
    setSelectedContentType(typeId)
  }

  // Handle content generation from NIV
  const handleContentGenerated = (content: ContentItem) => {
    console.log('🎉 Content generated:', content)

    // Ensure content has required fields
    const completeContent = {
      ...content,
      id: content.id || `content-${Date.now()}`,
      saved: content.saved !== undefined ? content.saved : false,
      timestamp: content.timestamp || Date.now()
    }

    // Add to generated content list
    setGeneratedContent(prev => [...prev, completeContent])

    // Set as current content and store in ref
    currentContentRef.current = completeContent
    setCurrentContent(completeContent)

    // Open workspace immediately with the content
    setShowWorkspace(true)

    console.log('✅ Content opened in workspace:', completeContent)
  }

  // Handle content save
  const handleContentSave = async (content: ContentItem) => {
    try {
      console.log('💾 Saving content:', content)

      const response = await fetch('/api/content-library/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: {
            type: content.type,
            title: `${content.type} - ${new Date().toLocaleDateString()}`,
            content: content.content,
            organization_id: organization?.id,
            framework_data: framework,
            opportunity_data: opportunity,
            metadata: content.metadata
          },
          metadata: content.metadata
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Update saved status
        const updatedContent = { ...content, saved: true }

        setGeneratedContent(prev =>
          prev.map(item =>
            item.id === content.id ? updatedContent : item
          )
        )

        setCurrentContent(updatedContent)
        currentContentRef.current = updatedContent

        alert(`✅ Content saved to ${data.location}`)
      } else {
        alert(`❌ Failed to save: ${data.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Save error:', error)
      alert('❌ Failed to save content')
    }
  }

  // Toggle category expansion
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(category)) {
        newSet.delete(category)
      } else {
        newSet.add(category)
      }
      return newSet
    })
  }

  // Group content types by category
  const groupedContentTypes = CONTENT_TYPES.reduce((acc, type) => {
    if (!acc[type.category]) {
      acc[type.category] = []
    }
    acc[type.category].push(type)
    return acc
  }, {} as Record<string, typeof CONTENT_TYPES>)

  // No longer auto-open workspace - user controls when it opens
  useEffect(() => {
    // Keep this empty or remove - workspace opens on user action only
  }, [currentContent, showWorkspace])

  return (
    <div className="relative h-full flex">
      {/* LEFT - Content Type Selector & Queue */}
      <div className="w-80 bg-gray-950 border-r border-gray-800 flex flex-col">
        {/* Queue Toggle */}
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowQueue(!showQueue)}
              className="flex items-center gap-2 text-sm text-gray-300 hover:text-white transition-colors"
            >
              <ListOrdered className="w-4 h-4" />
              Queue ({queueItems.length})
              {showQueue ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => setShowPrompts(!showPrompts)}
                className={`px-3 py-1.5 hover:bg-gray-800 rounded transition-colors flex items-center gap-2 ${showPrompts ? 'bg-gray-800 text-purple-400' : 'text-gray-400'}`}
                title="Content Prompts - Example prompts for content generation"
              >
                <Sparkles className="w-4 h-4" />
                <span className="text-xs font-medium">Prompts</span>
              </button>
              <button
                onClick={() => setShowLibrary(!showLibrary)}
                className={`px-3 py-1.5 hover:bg-gray-800 rounded transition-colors flex items-center gap-2 ${showLibrary ? 'bg-gray-800 text-yellow-400' : 'text-gray-400'}`}
                title="Content Library - View all saved content"
              >
                <Library className="w-4 h-4" />
                <span className="text-xs font-medium">Library</span>
              </button>
            </div>
          </div>
        </div>

        {/* Queue Panel */}
        {showQueue && (
          <div className="border-b border-gray-800">
            <ContentQueue
              items={queueItems}
              onItemRemove={(id) => setQueueItems(prev => prev.filter(item => item.id !== id))}
              onItemSelect={(item) => {
                if (item.type) {
                  handleContentTypeSelect(item.type)
                }
              }}
              className="max-h-48"
            />
          </div>
        )}

        {/* Content Types */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-400 mb-4">Content Types</h3>
            {Object.entries(groupedContentTypes).map(([category, types]) => (
              <div key={category} className="mb-2">
                <button
                  onClick={() => toggleCategory(category)}
                  className="w-full px-2 py-1.5 flex items-center justify-between hover:bg-gray-800 rounded transition-colors"
                >
                  <span className="text-xs font-medium text-gray-500">{category}</span>
                  {expandedCategories.has(category) ? (
                    <ChevronDown className="w-3 h-3 text-gray-600" />
                  ) : (
                    <ChevronRight className="w-3 h-3 text-gray-600" />
                  )}
                </button>

                {expandedCategories.has(category) && (
                  <div className="mt-1 space-y-0.5">
                    {types.map(type => {
                      const Icon = type.icon
                      const isSelected = selectedContentType === type.id

                      return (
                        <button
                          key={type.id}
                          onClick={() => handleContentTypeSelect(type.id)}
                          className={`w-full px-3 py-2 rounded-lg text-left transition-all flex items-center gap-3 ${
                            isSelected
                              ? 'bg-yellow-500/20 border border-yellow-500/30 text-white'
                              : 'hover:bg-gray-800 text-gray-300 hover:text-white'
                          }`}
                        >
                          <Icon className="w-4 h-4 flex-shrink-0" />
                          <span className="text-base">{type.label}</span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CENTER - NIV Orchestrator */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-hidden">
          <NIVContentOrchestrator
            framework={framework}
            opportunity={opportunity}
            selectedContentType={selectedContentType}
            onContentGenerated={handleContentGenerated}
            onContentSave={handleContentSave}
            onQueueUpdate={setQueueItems}
            className="h-full"
          />
        </div>

        {/* Library Panel (slides in from left) */}
        {showLibrary && (
          <div className="absolute left-0 top-0 bottom-0 w-96 bg-gray-900 border-r border-gray-800 shadow-2xl z-30 flex flex-col">
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Content Library</h3>
              <button
                onClick={() => setShowLibrary(false)}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <ContentLibraryWithFolders
                organization={organization}
                onContentSelect={(item: any) => {
                  const contentItem = item as ContentItem
                  setCurrentContent(contentItem)
                  currentContentRef.current = contentItem
                  setShowWorkspace(true)
                  setShowLibrary(false)
                }}
                className="h-full"
              />
            </div>
          </div>
        )}

        {/* Prompts Panel (slides in from left) */}
        {showPrompts && (
          <div className="absolute left-0 top-0 bottom-0 w-[700px] bg-gray-900 border-r border-gray-800 shadow-2xl z-30 flex flex-col">
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                Content Generation Prompts
              </h3>
              <button
                onClick={() => setShowPrompts(false)}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <ContentPrompts />
            </div>
          </div>
        )}
      </div>

      {/* RIGHT SIDE WORKSPACE - Shows when user opens content */}
      {currentContent && showWorkspace && (
        <div className="fixed right-0 top-0 bottom-0 w-96 bg-gray-900 border-l border-gray-800 shadow-2xl z-40">
          {/* Workspace Header */}
          <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
            <h3 className="text-sm font-medium text-white">Content Workspace</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowWorkspace(false)}
                className="p-1 hover:bg-gray-800 rounded transition-colors"
                title="Minimize"
              >
                <Minimize2 className="w-4 h-4 text-gray-400" />
              </button>
              <button
                onClick={() => {
                  setShowWorkspace(false)
                  setCurrentContent(null)
                  currentContentRef.current = null
                }}
                className="p-1 hover:bg-gray-800 rounded transition-colors"
                title="Close"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Workspace Content */}
          <div className="h-full overflow-hidden">
            <ContentWorkspace
              content={currentContent}
              onEdit={(content) => {
                setCurrentContent(content)
                currentContentRef.current = content
              }}
              onSave={handleContentSave}
              className="h-full"
            />
          </div>
        </div>
      )}

      {/* Reopen workspace button - shows when content exists but workspace is closed */}
      {currentContent && !showWorkspace && (
        <button
          onClick={() => setShowWorkspace(true)}
          className="fixed bottom-4 right-4 bg-yellow-500 text-black px-4 py-2 rounded-lg shadow-lg hover:bg-yellow-400 transition-colors flex items-center gap-2 z-40 animate-pulse"
        >
          <Maximize2 className="w-4 h-4" />
          Open Workspace ({currentContent.type})
        </button>
      )}
    </div>
  )
}