'use client'

import React, { useState, useEffect } from 'react'
import {
  FileText,
  Hash,
  Mail,
  Briefcase,
  AlertTriangle,
  Mic,
  BookOpen,
  MessageSquare,
  Image as ImageIcon,
  Video,
  Presentation,
  Users,
  ArrowLeft,
  X
} from 'lucide-react'
import NIVContentCreator from './NIVContentCreator'
import ContentEditor from './ContentEditor'
import { AnimatePresence } from 'framer-motion'

// Content types with proper configurations
const CONTENT_TYPES = [
  { type: 'press-release', label: 'Press Release', icon: FileText, color: '#10b981', description: 'Official announcements and news' },
  { type: 'social-post', label: 'Social Media', icon: Hash, color: '#3b82f6', description: 'Platform-optimized social posts' },
  { type: 'email', label: 'Email Campaign', icon: Mail, color: '#f59e0b', description: 'Targeted email communications' },
  { type: 'exec-statement', label: 'Executive Statement', icon: Briefcase, color: '#8b5cf6', description: 'Leadership messages' },
  { type: 'crisis-response', label: 'Crisis Response', icon: AlertTriangle, color: '#ef4444', description: 'Crisis communications' },
  { type: 'media-pitch', label: 'Media Pitch', icon: Mic, color: '#06b6d4', description: 'Journalist outreach' },
  { type: 'thought-leadership', label: 'Thought Leadership', icon: BookOpen, color: '#6366f1', description: 'Industry insights and expertise' },
  { type: 'qa-doc', label: 'Q&A Document', icon: MessageSquare, color: '#84cc16', description: 'Comprehensive Q&As' },
  { type: 'image', label: 'Image', icon: ImageIcon, color: '#ec4899', description: 'AI-generated visuals' },
  { type: 'video', label: 'Video', icon: Video, color: '#f97316', description: 'Video content creation' },
  { type: 'presentation', label: 'Presentation', icon: Presentation, color: '#14b8a6', description: 'Deck creation with Gamma' },
  { type: 'media-list', label: 'Media List', icon: Users, color: '#64748b', description: 'Targeted journalist lists' }
]

interface ContentItem {
  id: string
  type: string
  title: string
  content: any
  metadata?: any
  saved?: boolean
}

interface ExecuteTabRebuiltProps {
  className?: string
}

export default function ExecuteTabRebuilt({ className = '' }: ExecuteTabRebuiltProps) {
  const [view, setView] = useState<'types' | 'create' | 'edit'>('types')
  const [selectedContentType, setSelectedContentType] = useState<string | null>(null)
  const [currentContent, setCurrentContent] = useState<ContentItem | null>(null)
  const [createdContent, setCreatedContent] = useState<ContentItem[]>([])

  // Handle content type selection
  const handleTypeSelection = (type: string) => {
    setSelectedContentType(type)
    setView('create')
  }

  // Handle content generation from NIV
  const handleContentGenerated = (content: ContentItem) => {
    setCurrentContent(content)
    setCreatedContent(prev => [content, ...prev])
  }

  // Handle opening editor
  const handleOpenEditor = (content: ContentItem) => {
    setCurrentContent(content)
    setView('edit')
  }

  // Handle saving content
  const handleSaveContent = (content: ContentItem) => {
    // Update the content in our list
    setCreatedContent(prev =>
      prev.map(item => item.id === content.id ? { ...content, saved: true } : item)
    )

    // Update current content
    setCurrentContent({ ...content, saved: true })

    // Close editor and go back to create view
    setView('create')
  }

  // Handle navigation
  const handleGoBack = () => {
    if (view === 'edit') {
      setView('create')
    } else if (view === 'create') {
      setView('types')
      setSelectedContentType(null)
      setCurrentContent(null)
    }
  }

  return (
    <div className={`execute-tab-rebuilt h-full flex flex-col bg-gray-950 ${className}`}>
      {/* Header */}
      <div className="flex-shrink-0 bg-gray-900 border-b border-gray-800 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {view !== 'types' && (
              <button
                onClick={handleGoBack}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <h1 className="text-xl font-bold text-white">
                {view === 'types' && 'Create Content'}
                {view === 'create' && `${CONTENT_TYPES.find(t => t.type === selectedContentType)?.label} Creator`}
                {view === 'edit' && 'Content Editor'}
              </h1>
              <p className="text-sm text-gray-400">
                {view === 'types' && 'Choose what you want to create with NIV'}
                {view === 'create' && 'Work with NIV to create your content'}
                {view === 'edit' && 'Edit and refine your content'}
              </p>
            </div>
          </div>

          {/* Quick actions */}
          {view === 'create' && createdContent.length > 0 && (
            <div className="text-sm text-gray-400">
              {createdContent.length} item{createdContent.length !== 1 ? 's' : ''} created
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        {/* Content Type Selection */}
        {view === 'types' && (
          <div className="h-full overflow-y-auto p-6">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {CONTENT_TYPES.map((contentType) => {
                  const Icon = contentType.icon
                  return (
                    <button
                      key={contentType.type}
                      onClick={() => handleTypeSelection(contentType.type)}
                      className="group p-6 bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-gray-700 rounded-xl transition-all duration-200 text-left"
                      style={{
                        boxShadow: `0 0 0 0 ${contentType.color}20`,
                        transition: 'all 0.2s ease, box-shadow 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = `0 0 20px ${contentType.color}40`
                        e.currentTarget.style.borderColor = `${contentType.color}60`
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = `0 0 0 0 ${contentType.color}20`
                        e.currentTarget.style.borderColor = '#374151'
                      }}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className="p-3 rounded-xl group-hover:scale-110 transition-transform duration-200"
                          style={{ backgroundColor: `${contentType.color}20` }}
                        >
                          <Icon
                            className="w-6 h-6"
                            style={{ color: contentType.color }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-white mb-2 group-hover:text-white transition-colors">
                            {contentType.label}
                          </h3>
                          <p className="text-sm text-gray-400 group-hover:text-gray-300 leading-relaxed">
                            {contentType.description}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-gray-800 group-hover:border-gray-700">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">Click to create</span>
                          <div
                            className="w-2 h-2 rounded-full opacity-60 group-hover:opacity-100 transition-opacity"
                            style={{ backgroundColor: contentType.color }}
                          ></div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Recent Content */}
              {createdContent.length > 0 && (
                <div className="mt-12 max-w-4xl mx-auto">
                  <h2 className="text-lg font-semibold text-white mb-6">Recent Content</h2>
                  <div className="grid gap-4">
                    {createdContent.slice(0, 3).map((content) => {
                      const contentType = CONTENT_TYPES.find(t => t.type === content.type)
                      const Icon = contentType?.icon || FileText

                      return (
                        <button
                          key={content.id}
                          onClick={() => handleOpenEditor(content)}
                          className="flex items-center gap-4 p-4 bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-gray-700 rounded-lg transition-all text-left"
                        >
                          <div
                            className="p-2 rounded-lg"
                            style={{ backgroundColor: `${contentType?.color || '#6b7280'}20` }}
                          >
                            <Icon
                              className="w-4 h-4"
                              style={{ color: contentType?.color || '#6b7280' }}
                            />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium text-white">{content.title}</h3>
                            <p className="text-sm text-gray-400">
                              {contentType?.label} • {content.saved ? 'Saved' : 'Draft'}
                            </p>
                          </div>
                          <div className="text-xs text-gray-500">
                            {content.metadata?.createdAt && new Date(content.metadata.createdAt).toLocaleDateString()}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* NIV Content Creator */}
        {view === 'create' && selectedContentType && (
          <NIVContentCreator
            selectedContentType={selectedContentType}
            onContentGenerated={handleContentGenerated}
            className="h-full"
          />
        )}

        {/* Content Editor */}
        {view === 'edit' && currentContent && (
          <div className="h-full relative">
            <ContentEditor
              content={currentContent}
              onSave={handleSaveContent}
              className="h-full"
            />
          </div>
        )}
      </div>
    </div>
  )
}