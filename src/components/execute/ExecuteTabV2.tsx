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
  MessageSquare
} from 'lucide-react'
import NIVContentAssistant from './NIVContentAssistant'
import ContentEditor from './ContentEditor'
import ContentQueue from './ContentQueue'
import ContentLibrary from './ContentLibrary'
import FrameworkBanner from './FrameworkBanner'
import { useAppStore } from '@/stores/useAppStore'
import { useNivStrategyV2 } from '@/hooks/useNivStrategyV2'
import type { ContentItem, ContentType, OrchestrationSession } from '@/types/content'
import { ContentGenerationService } from '@/services/ContentGenerationService'

interface ExecuteTabV2Props {
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

export default function ExecuteTabV2({ className = '' }: ExecuteTabV2Props) {
  const { organization } = useAppStore()
  const { activeStrategy } = useNivStrategyV2()

  // Component state
  const [selectedContentType, setSelectedContentType] = useState<ContentType | null>(null)
  const [workspaceContent, setWorkspaceContent] = useState<ContentItem | null>(null)
  const [contentQueue, setContentQueue] = useState<ContentItem[]>([])
  const [showLeftSidebar, setShowLeftSidebar] = useState(true) // Show content types by default
  const [showRightSidebar, setShowRightSidebar] = useState(false)
  const [showLibrary, setShowLibrary] = useState(false)
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
    // Save to Memory Vault
    await ContentGenerationService.saveToMemoryVault(content)

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
  }

  const handleWorkspaceOpen = (content: ContentItem) => {
    setWorkspaceContent(content)
  }

  const handleContentTypeSelect = (type: ContentType) => {
    setSelectedContentType(type)
    // The NIV Assistant will be notified via prop
  }

  const handleWorkspaceSave = async (content: ContentItem) => {
    // Save to Memory Vault
    await ContentGenerationService.saveToMemoryVault(content)

    // Update in queue
    setContentQueue(prev => prev.map(item =>
      item.id === content.id ? content : item
    ))

    // Close workspace
    setWorkspaceContent(null)
  }

  // Stop event propagation for spacebar
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ') {
      e.stopPropagation()
    }
  }

  return (
    <div
      className={`execute-tab-v2 h-full flex flex-col bg-gray-900 ${className}`}
      onKeyDown={handleKeyDown}
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
              {/* Quick Actions */}
              <div className="p-3 border-t border-gray-700 space-y-2">
                <button
                  onClick={() => setShowLibrary(!showLibrary)}
                  className="w-full px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex items-center gap-2 text-sm"
                >
                  <Library className="w-4 h-4" />
                  {showLibrary ? 'Hide' : 'Show'} Library
                </button>
                <button
                  onClick={() => setShowRightSidebar(!showRightSidebar)}
                  className="w-full px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex items-center gap-2 text-sm"
                >
                  <List className="w-4 h-4" />
                  {showRightSidebar ? 'Hide' : 'Show'} Queue
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Main Content Area - NIV Assistant */}
        <div className="flex-1 flex overflow-hidden">
          {/* NIV Assistant - Always visible */}
          <div className={`flex-1 ${workspaceContent ? 'w-1/2' : 'w-full'}`}>
            <NIVContentAssistant
              framework={activeStrategy}
              onContentSave={handleContentSave}
              onWorkspaceOpen={handleWorkspaceOpen}
              initialContentType={selectedContentType || undefined}
            />
          </div>

          {/* Workspace Editor - Shows when content is opened */}
          {workspaceContent && (
            <div className="w-1/2 border-l border-gray-700">
              <div className="h-full flex flex-col">
                <div className="flex items-center justify-between p-3 border-b border-gray-700 bg-gray-800">
                  <h3 className="text-sm font-medium">Content Workspace</h3>
                  <button
                    onClick={() => setWorkspaceContent(null)}
                    className="text-gray-400 hover:text-gray-200 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <ContentEditor
                  content={workspaceContent}
                  framework={activeStrategy}
                  onSave={handleWorkspaceSave}
                  onCancel={() => setWorkspaceContent(null)}
                />
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar - Queue or Library */}
        {(showRightSidebar || showLibrary) && (
          <div className="w-80 border-l border-gray-700">
            {showRightSidebar && !showLibrary ? (
              <div className="h-full bg-gray-800 flex flex-col">
                <div className="flex items-center justify-between p-3 border-b border-gray-700">
                  <h3 className="text-sm font-medium flex items-center gap-2">
                    <List className="w-4 h-4" />
                    Content Queue
                  </h3>
                  <button
                    onClick={() => setShowRightSidebar(false)}
                    className="p-1 hover:bg-gray-700 rounded transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex-1 overflow-hidden">
                  <ContentQueue
                    items={contentQueue}
                    onItemSelect={setWorkspaceContent}
                    className="h-full"
                  />
                </div>
              </div>
            ) : (
              <div className="h-full bg-gray-800 flex flex-col">
                <div className="flex items-center justify-between p-3 border-b border-gray-700">
                  <h3 className="text-sm font-medium flex items-center gap-2">
                    <Library className="w-4 h-4" />
                    Content Library
                  </h3>
                  <button
                    onClick={() => setShowLibrary(false)}
                    className="p-1 hover:bg-gray-700 rounded transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex-1 overflow-hidden">
                  <ContentLibrary
                    organization={organization}
                    onContentSelect={setWorkspaceContent}
                    className="h-full"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Welcome Overlay - Shows when nothing is active */}
      {!orchestrationSession && !workspaceContent && !showLeftSidebar && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 backdrop-blur-sm">
          <div className="text-center max-w-md">
            <div className="p-4 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-2xl mb-4 inline-block">
              <Brain className="w-12 h-12 text-purple-400" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">Welcome to NIV Content Studio</h2>
            <p className="text-gray-400 mb-6">
              Your AI-powered content creation assistant is ready. Start by typing what you want to create or select a content type.
            </p>
            <button
              onClick={() => setShowLeftSidebar(true)}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg transition-all flex items-center gap-2 mx-auto"
            >
              <Sparkles className="w-5 h-5" />
              Get Started
            </button>
          </div>
        </div>
      )}
    </div>
  )
}