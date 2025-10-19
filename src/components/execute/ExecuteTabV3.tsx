'use client'

import React, { useState, useEffect } from 'react'
import {
  FileText,
  ChevronLeft,
  ChevronRight,
  Library,
  List,
  Sparkles,
  Brain,
  Hash,
  Megaphone,
  Mail,
  Briefcase,
  AlertTriangle,
  FileQuestion,
  Mic,
  BookOpen,
  Presentation,
  MessageSquare,
  X,
  ArrowLeft
} from 'lucide-react'
import NIVContentAssistantV2 from './NIVContentAssistantV2'
import ContentEditor from './ContentEditor'
import ContentQueue from './ContentQueue'
import ContentLibrary from './ContentLibrary'
import FrameworkBanner from './FrameworkBanner'
import { useAppStore } from '@/stores/useAppStore'
import { useNivStrategyV2 } from '@/hooks/useNivStrategyV2'
import type { ContentItem, ContentType, OrchestrationSession } from '@/types/content'
import { ContentGenerationService } from '@/services/ContentGenerationService'

interface ExecuteTabV3Props {
  className?: string
}

const CONTENT_TYPES: { type: ContentType; label: string; icon: any; description: string }[] = [
  { type: 'press-release', label: 'Press Release', icon: Megaphone, description: 'Official announcements' },
  { type: 'social-post', label: 'Social Media', icon: Hash, description: 'Platform-optimized posts' },
  { type: 'exec-statement', label: 'Executive Statement', icon: Briefcase, description: 'Leadership messages' },
  { type: 'crisis-response', label: 'Crisis Response', icon: AlertTriangle, description: 'Incident management' },
  { type: 'email', label: 'Email Campaign', icon: Mail, description: 'Targeted outreach' },
  { type: 'qa-doc', label: 'Q&A Document', icon: FileQuestion, description: 'FAQs and responses' },
  { type: 'media-pitch', label: 'Media Pitch', icon: Mic, description: 'Journalist outreach' },
  { type: 'thought-leadership', label: 'Thought Leadership', icon: BookOpen, description: 'Industry insights' },
  { type: 'presentation', label: 'Presentation', icon: Presentation, description: 'Deck content' },
  { type: 'messaging', label: 'Messaging', icon: MessageSquare, description: 'Core narratives' }
]

type ViewMode = 'assistant' | 'workspace' | 'library' | 'queue'

export default function ExecuteTabV3({ className = '' }: ExecuteTabV3Props) {
  const { organization } = useAppStore()
  const { activeStrategy } = useNivStrategyV2()

  // Component state
  const [viewMode, setViewMode] = useState<ViewMode>('assistant')
  const [selectedContentType, setSelectedContentType] = useState<ContentType | null>(null)
  const [workspaceContent, setWorkspaceContent] = useState<ContentItem | null>(null)
  const [contentQueue, setContentQueue] = useState<ContentItem[]>([])
  const [showLeftSidebar, setShowLeftSidebar] = useState(true)
  const [orchestrationSession, setOrchestrationSession] = useState<OrchestrationSession | null>(null)

  // Initialize with framework if available
  useEffect(() => {
    if (activeStrategy?.strategy?.content_needs) {
      initializeOrchestration()
    }
  }, [activeStrategy])

  const initializeOrchestration = () => {
    if (!activeStrategy) return

    const session: OrchestrationSession = {
      id: `session-${Date.now()}`,
      frameworkId: activeStrategy.id,
      objective: activeStrategy.strategy.objective,
      narrative: activeStrategy.strategy.narrative,
      proofPoints: activeStrategy.strategy.proof_points || [],
      contentNeeds: activeStrategy.strategy.content_needs,
      timeline: activeStrategy.strategy.timeline_execution,
      status: 'active',
      createdAt: new Date(),
      progress: {
        total: activeStrategy.strategy.content_needs?.priority_content?.length || 0,
        completed: 0,
        inProgress: 0
      }
    }

    setOrchestrationSession(session)
  }

  const handleContentSave = async (content: ContentItem) => {
    console.log('Saving content to Memory Vault:', content)

    // Save to Memory Vault
    const saved = await ContentGenerationService.saveToMemoryVault(content)

    if (saved) {
      console.log('Content saved successfully')

      // Add to queue if it's draft
      if (content.status === 'draft') {
        setContentQueue(prev => [content, ...prev])
      }

      // Update orchestration progress if applicable
      if (orchestrationSession) {
        setOrchestrationSession(prev => prev ? {
          ...prev,
          progress: {
            ...prev.progress,
            completed: prev.progress.completed + 1
          }
        } : null)
      }
    } else {
      console.error('Failed to save content')
    }
  }

  const handleWorkspaceOpen = (content: ContentItem) => {
    setWorkspaceContent(content)
    setViewMode('workspace')
  }

  const handleContentTypeSelect = (type: ContentType) => {
    setSelectedContentType(type)
    setViewMode('assistant')
  }

  const handleLibrarySelect = (content: ContentItem) => {
    setWorkspaceContent(content)
    setViewMode('workspace')
  }

  const handleQueueSelect = (content: ContentItem) => {
    setWorkspaceContent(content)
    setViewMode('workspace')
  }

  const handleWorkspaceSave = async (content: ContentItem) => {
    await handleContentSave(content)
    // Stay in workspace after save
  }

  const handleBackToAssistant = () => {
    setViewMode('assistant')
    setWorkspaceContent(null)
  }

  // Stop ALL keyboard event propagation to prevent canvas movement
  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation()
  }

  const handleKeyUp = (e: React.KeyboardEvent) => {
    e.stopPropagation()
  }

  return (
    <div
      className={`execute-tab-v3 h-full flex flex-col bg-gray-900 ${className}`}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
    >
      {/* Framework Banner */}
      {orchestrationSession && (
        <FrameworkBanner
          session={orchestrationSession}
          onGenerateAll={() => {}}
          isGenerating={false}
        />
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Content Types */}
        <div className={`transition-all duration-300 ${showLeftSidebar ? 'w-64' : 'w-12'}`}>
          {!showLeftSidebar ? (
            <button
              onClick={() => setShowLeftSidebar(true)}
              className="h-full w-12 bg-gray-800 border-r border-gray-700 flex items-center justify-center hover:bg-gray-750 transition-colors"
              title="Show Content Types"
            >
              <FileText className="w-5 h-5 text-gray-400" />
            </button>
          ) : (
            <div className="h-full w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
              <div className="flex items-center justify-between p-3 border-b border-gray-700">
                <h3 className="text-sm font-medium">Content Types</h3>
                <button
                  onClick={() => setShowLeftSidebar(false)}
                  className="p-1 hover:bg-gray-700 rounded transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>

              {/* Quick Actions */}
              <div className="p-3 space-y-2 border-b border-gray-700">
                <button
                  onClick={() => setViewMode(viewMode === 'library' ? 'assistant' : 'library')}
                  className={`w-full px-3 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm ${
                    viewMode === 'library'
                      ? 'bg-purple-600/20 border border-purple-600/30'
                      : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                >
                  <Library className="w-4 h-4" />
                  Content Library
                </button>
                <button
                  onClick={() => setViewMode(viewMode === 'queue' ? 'assistant' : 'queue')}
                  className={`w-full px-3 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm ${
                    viewMode === 'queue'
                      ? 'bg-purple-600/20 border border-purple-600/30'
                      : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                >
                  <List className="w-4 h-4" />
                  Content Queue ({contentQueue.length})
                </button>
              </div>

              {/* Content Types List */}
              <div className="flex-1 overflow-y-auto p-3 space-y-1">
                {CONTENT_TYPES.map(({ type, label, icon: Icon, description }) => (
                  <button
                    key={type}
                    onClick={() => handleContentTypeSelect(type)}
                    className={`w-full p-3 rounded-lg transition-all text-left ${
                      selectedContentType === type
                        ? 'bg-purple-600/20 border border-purple-600/30'
                        : 'bg-gray-700/50 hover:bg-gray-700 border border-transparent'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Icon className={`w-5 h-5 mt-0.5 ${
                        selectedContentType === type ? 'text-purple-400' : 'text-gray-400'
                      }`} />
                      <div className="flex-1">
                        <div className="font-medium text-sm">{label}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{description}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* NIV Assistant View */}
          {viewMode === 'assistant' && (
            <div className="flex-1">
              <NIVContentAssistantV2
                framework={activeStrategy}
                onContentSave={handleContentSave}
                onWorkspaceOpen={handleWorkspaceOpen}
                initialContentType={selectedContentType || undefined}
              />
            </div>
          )}

          {/* Workspace Editor View */}
          {viewMode === 'workspace' && workspaceContent && (
            <div className="flex-1 flex flex-col">
              <div className="flex items-center justify-between p-3 border-b border-gray-700 bg-gray-800">
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleBackToAssistant}
                    className="p-1.5 hover:bg-gray-700 rounded transition-colors"
                    title="Back to Assistant"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <h3 className="text-sm font-medium">Content Workspace</h3>
                </div>
                <button
                  onClick={handleBackToAssistant}
                  className="text-gray-400 hover:text-gray-200 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <ContentEditor
                content={workspaceContent}
                framework={activeStrategy}
                onSave={handleWorkspaceSave}
                onCancel={handleBackToAssistant}
              />
            </div>
          )}

          {/* Library View */}
          {viewMode === 'library' && (
            <div className="flex-1 bg-gray-800 flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-gray-700">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <Library className="w-5 h-5" />
                  Content Library
                </h3>
                <button
                  onClick={() => setViewMode('assistant')}
                  className="p-1.5 hover:bg-gray-700 rounded transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-hidden">
                <ContentLibrary
                  organization={organization}
                  onContentSelect={handleLibrarySelect}
                  className="h-full"
                />
              </div>
            </div>
          )}

          {/* Queue View */}
          {viewMode === 'queue' && (
            <div className="flex-1 bg-gray-800 flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-gray-700">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <List className="w-5 h-5" />
                  Content Queue
                </h3>
                <button
                  onClick={() => setViewMode('assistant')}
                  className="p-1.5 hover:bg-gray-700 rounded transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-hidden p-4">
                {contentQueue.length > 0 ? (
                  <ContentQueue
                    items={contentQueue}
                    onItemSelect={handleQueueSelect}
                    className="h-full"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <List className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-400">No items in queue</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Generated content will appear here
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}