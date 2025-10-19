'use client'

import React, { useState } from 'react'
import {
  Rocket,
  FileText,
  Hash,
  Users,
  Video,
  ImageIcon,
  Mail,
  Library,
  List,
  Shield,
  Presentation,
  Megaphone,
  Mic,
  BookOpen,
  Briefcase,
  AlertTriangle,
  FileQuestion,
  MessageSquare
} from 'lucide-react'
import NIVContentOrchestrator from './NIVContentOrchestrator'
import ContentEditor from './ContentEditor'
import ContentQueue from './ContentQueue'
import ContentLibrary from './ContentLibrary'
import FrameworkBanner from './FrameworkBanner'
import type { ContentItem, ContentType } from '@/types/content'

interface ExecuteTabProps {
  framework?: any
  className?: string
}

const CONTENT_TYPES = [
  { type: 'press-release', label: 'Press Release', icon: Megaphone, description: 'Official announcements' },
  { type: 'social-post', label: 'Social Post', icon: Hash, description: 'Social media content' },
  { type: 'email', label: 'Email', icon: Mail, description: 'Email campaigns' },
  { type: 'exec-statement', label: 'Executive Statement', icon: Briefcase, description: 'Leadership messages' },
  { type: 'crisis-response', label: 'Crisis Response', icon: AlertTriangle, description: 'Urgent communications' },
  { type: 'media-pitch', label: 'Media Pitch', icon: Mic, description: 'Journalist outreach' },
  { type: 'thought-leadership', label: 'Thought Leadership', icon: BookOpen, description: 'Expert content' },
  { type: 'qa-doc', label: 'Q&A Document', icon: FileQuestion, description: 'FAQs and responses' },
  { type: 'messaging', label: 'Messaging', icon: MessageSquare, description: 'Key messages' },
  { type: 'image', label: 'Image', icon: ImageIcon, description: 'AI-generated visuals' },
  { type: 'video', label: 'Video', icon: Video, description: 'Video content' },
  { type: 'presentation', label: 'Presentation', icon: Presentation, description: 'Decks via Gamma' },
  { type: 'media-list', label: 'Media List', icon: Users, description: 'Target journalist list' }
]

export default function ExecuteTabSplitView({ framework, className = '' }: ExecuteTabProps) {
  const [selectedType, setSelectedType] = useState<ContentType | 'image' | 'video' | 'presentation' | 'media-list' | null>(null)
  const [currentContent, setCurrentContent] = useState<ContentItem | null>(null)
  const [activeView, setActiveView] = useState<'assistant' | 'editor' | 'queue' | 'library'>('assistant')
  const [queueItems, setQueueItems] = useState<ContentItem[]>([])
  const [libraryItems, setLibraryItems] = useState<ContentItem[]>([])

  const handleTypeSelection = (type: ContentType | 'image' | 'video' | 'presentation' | 'media-list') => {
    setSelectedType(type)
    setActiveView('assistant')
  }

  const handleContentGenerated = (content: ContentItem) => {
    setCurrentContent(content)
    setQueueItems(prev => [...prev, content])
  }

  const handleSaveContent = (content: ContentItem) => {
    setLibraryItems(prev => [...prev, content])
    setCurrentContent(null)
  }

  const handleQueueItemSelect = (content: ContentItem) => {
    setCurrentContent(content)
    setActiveView('editor')
  }

  const handleLibraryItemSelect = (content: ContentItem) => {
    setCurrentContent(content)
    setActiveView('editor')
  }

  const hasFramework = framework && (
    framework.strategy?.objective ||
    framework.framework_data?.strategy?.objective
  )

  return (
    <div className={`execute-tab-split h-full flex flex-col ${className}`}>
      {/* Framework Banner */}
      {hasFramework && (
        <FrameworkBanner
          framework={framework}
          onExecute={() => console.log('Execute framework')}
        />
      )}

      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Rocket className="w-6 h-6 text-yellow-500" />
            <h2 className="text-xl font-semibold text-white">Execute Content</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveView('queue')}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                activeView === 'queue' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800'
              }`}
            >
              <List className="w-4 h-4" />
              <span>Queue ({queueItems.length})</span>
            </button>
            <button
              onClick={() => setActiveView('library')}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                activeView === 'library' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800'
              }`}
            >
              <Library className="w-4 h-4" />
              <span>Library ({libraryItems.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Split View Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Content Types (1/3 width) */}
        <div className="w-1/3 border-r border-gray-800 overflow-y-auto bg-gray-900/50">
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-400 mb-4">Select Content Type</h3>
            <div className="space-y-2">
              {CONTENT_TYPES.map(({ type, label, icon: Icon, description }) => (
                <button
                  key={type}
                  onClick={() => handleTypeSelection(type as any)}
                  className={`w-full p-4 rounded-lg border transition-all text-left group ${
                    selectedType === type
                      ? 'bg-yellow-500/10 border-yellow-500/50'
                      : 'bg-gray-800/50 border-gray-700 hover:bg-gray-800 hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg transition-colors ${
                      selectedType === type
                        ? 'bg-yellow-500/20'
                        : 'bg-gray-700 group-hover:bg-gray-600'
                    }`}>
                      <Icon className={`w-5 h-5 ${
                        selectedType === type ? 'text-yellow-500' : 'text-gray-400'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <h4 className={`font-medium mb-1 ${
                        selectedType === type ? 'text-white' : 'text-gray-200'
                      }`}>
                        {label}
                      </h4>
                      <p className="text-xs text-gray-400">{description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel - Content Area (2/3 width) */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {activeView === 'assistant' && (
            <NIVContentOrchestrator
              framework={framework}
              selectedContentType={selectedType}
              onContentGenerated={handleContentGenerated}
              onContentSave={handleSaveContent}
              className="h-full"
            />
          )}

          {activeView === 'editor' && currentContent && (
            <ContentEditor
              content={currentContent}
              onSave={handleSaveContent}
              onCancel={() => {
                setCurrentContent(null)
                setActiveView('assistant')
              }}
            />
          )}

          {activeView === 'queue' && (
            <div className="h-full p-6 overflow-y-auto">
              <div className="max-w-4xl mx-auto">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">Content Queue</h3>
                  <p className="text-sm text-gray-400">Content in progress or pending review</p>
                </div>
                <ContentQueue
                  items={queueItems}
                  onItemSelect={handleQueueItemSelect}
                />
              </div>
            </div>
          )}

          {activeView === 'library' && (
            <div className="h-full p-6 overflow-y-auto">
              <div className="max-w-4xl mx-auto">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">Content Library</h3>
                  <p className="text-sm text-gray-400">Your saved and published content</p>
                </div>
                <ContentLibrary
                  items={libraryItems}
                  onItemSelect={handleLibraryItemSelect}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}