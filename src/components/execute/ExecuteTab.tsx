'use client'

import React, { useState, useEffect } from 'react'
import {
  FileText,
  Zap,
  Users,
  Shield,
  MessageSquare,
  TrendingUp,
  Target,
  Globe,
  Mail,
  Sparkles,
  CheckCircle,
  Clock,
  AlertCircle,
  ChevronRight,
  ChevronDown,
  List,
  Library
} from 'lucide-react'
import ContentCreationCenter from './ContentCreationCenter'
import ContentQueue from './ContentQueue'
import ContentLibrary from './ContentLibrary'
import FrameworkBanner from './FrameworkBanner'
import { useAppStore } from '@/stores/useAppStore'
import { useNivStrategyV2 } from '@/hooks/useNivStrategyV2'
import type { ContentItem, ContentType, OrchestrationSession } from '@/types/content'

interface ExecuteTabProps {
  className?: string
}

export default function ExecuteTab({ className = '' }: ExecuteTabProps) {
  const { organization } = useAppStore()
  const { activeStrategy } = useNivStrategyV2()

  // Component state
  const [mode, setMode] = useState<'orchestrated' | 'standalone'>('standalone')
  const [orchestrationSession, setOrchestrationSession] = useState<OrchestrationSession | null>(null)
  const [contentQueue, setContentQueue] = useState<ContentItem[]>([])
  const [activeContent, setActiveContent] = useState<ContentItem | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  // Collapsible states
  const [showQueue, setShowQueue] = useState(false)
  const [showLibrary, setShowLibrary] = useState(false)

  // Initialize orchestration mode if there's an active strategy
  useEffect(() => {
    if (activeStrategy?.strategy?.content_needs) {
      initializeOrchestration()
    }
  }, [activeStrategy])

  const initializeOrchestration = async () => {
    if (!activeStrategy) return

    setMode('orchestrated')

    // Create orchestration session from active framework
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

    // Populate content queue from priority content
    const priorityItems = session.contentNeeds?.priority_content?.map((item, index) => ({
      id: `content-${Date.now()}-${index}`,
      title: item,
      type: determineContentType(item),
      status: 'pending' as const,
      priority: 'high' as const,
      frameworkId: session.frameworkId,
      createdAt: new Date()
    })) || []

    setContentQueue(priorityItems)
  }

  const determineContentType = (title: string): ContentType => {
    const lowerTitle = title.toLowerCase()

    if (lowerTitle.includes('press release')) return 'press-release'
    if (lowerTitle.includes('social') || lowerTitle.includes('post')) return 'social-post'
    if (lowerTitle.includes('executive') || lowerTitle.includes('statement')) return 'exec-statement'
    if (lowerTitle.includes('q&a') || lowerTitle.includes('qa')) return 'qa-doc'
    if (lowerTitle.includes('email')) return 'email'
    if (lowerTitle.includes('presentation') || lowerTitle.includes('deck')) return 'presentation'
    if (lowerTitle.includes('thought leadership') || lowerTitle.includes('article')) return 'thought-leadership'
    if (lowerTitle.includes('crisis')) return 'crisis-response'
    if (lowerTitle.includes('pitch')) return 'media-pitch'

    return 'messaging'
  }

  const handleContentCreate = async (content: ContentItem) => {
    setActiveContent(content)

    // Update queue status
    setContentQueue(prev => prev.map(item =>
      item.id === content.id
        ? { ...item, status: 'in-progress' as const }
        : item
    ))

    // Update orchestration progress
    if (orchestrationSession) {
      setOrchestrationSession(prev => prev ? {
        ...prev,
        progress: {
          ...prev.progress,
          inProgress: prev.progress.inProgress + 1
        }
      } : null)
    }
  }

  const handleContentComplete = (contentId: string) => {
    // Update queue
    setContentQueue(prev => prev.map(item =>
      item.id === contentId
        ? { ...item, status: 'completed' as const }
        : item
    ))

    // Update orchestration progress
    if (orchestrationSession) {
      setOrchestrationSession(prev => prev ? {
        ...prev,
        progress: {
          ...prev.progress,
          completed: prev.progress.completed + 1,
          inProgress: Math.max(0, prev.progress.inProgress - 1)
        }
      } : null)
    }
  }

  const handleGenerateAll = async () => {
    if (!orchestrationSession || contentQueue.length === 0) return

    setIsGenerating(true)

    // Process queue items sequentially
    for (const item of contentQueue) {
      if (item.status === 'pending') {
        await handleContentCreate(item)
        // Simulate generation time (will be replaced with actual API call)
        await new Promise(resolve => setTimeout(resolve, 2000))
        handleContentComplete(item.id)
      }
    }

    setIsGenerating(false)
  }

  // Stop event propagation for spacebar to prevent canvas panning
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ') {
      e.stopPropagation()
    }
  }

  return (
    <div
      className={`execute-tab h-full flex flex-col bg-gray-900 ${className}`}
      onKeyDown={handleKeyDown}
    >
      {/* Framework Banner (if in orchestrated mode) */}
      {mode === 'orchestrated' && orchestrationSession && (
        <FrameworkBanner
          session={orchestrationSession}
          onGenerateAll={handleGenerateAll}
          isGenerating={isGenerating}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Collapsible Queue & Library */}
        <div className="flex">
          {/* Queue Toggle */}
          <div className={`transition-all duration-300 ${showQueue ? 'w-80' : 'w-12'}`}>
            {!showQueue ? (
              <button
                onClick={() => {
                  setShowQueue(true)
                  setShowLibrary(false)
                }}
                className="h-full w-12 bg-gray-800 border-r border-gray-700 flex flex-col items-center justify-center hover:bg-gray-750 transition-colors"
                title="Show Content Queue"
              >
                <List className="w-5 h-5 text-gray-400" />
                <span className="text-[10px] text-gray-500 mt-1 writing-mode-vertical">Queue</span>
              </button>
            ) : (
              <div className="h-full w-80 bg-gray-800 border-r border-gray-700 flex flex-col">
                <div className="flex items-center justify-between p-3 border-b border-gray-700">
                  <h3 className="text-sm font-medium flex items-center gap-2">
                    <List className="w-4 h-4" />
                    Content Queue
                  </h3>
                  <button
                    onClick={() => setShowQueue(false)}
                    className="p-1 hover:bg-gray-700 rounded transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex-1 overflow-hidden">
                  <ContentQueue
                    items={contentQueue}
                    onItemSelect={setActiveContent}
                    className="h-full"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Library Toggle */}
          <div className={`transition-all duration-300 ${showLibrary ? 'w-80' : 'w-12'}`}>
            {!showLibrary ? (
              <button
                onClick={() => {
                  setShowLibrary(true)
                  setShowQueue(false)
                }}
                className="h-full w-12 bg-gray-800 border-r border-gray-700 flex flex-col items-center justify-center hover:bg-gray-750 transition-colors"
                title="Show Content Library"
              >
                <Library className="w-5 h-5 text-gray-400" />
                <span className="text-[10px] text-gray-500 mt-1 writing-mode-vertical">Library</span>
              </button>
            ) : (
              <div className="h-full w-80 bg-gray-800 border-r border-gray-700 flex flex-col">
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
                    className="h-full"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Content Creation Center - Takes up remaining space */}
        <ContentCreationCenter
          mode={mode}
          framework={activeStrategy}
          activeContent={activeContent}
          onContentCreate={handleContentCreate}
          onContentComplete={handleContentComplete}
        />
      </div>

      <style jsx>{`
        .writing-mode-vertical {
          writing-mode: vertical-lr;
          text-orientation: mixed;
        }
      `}</style>
    </div>
  )
}