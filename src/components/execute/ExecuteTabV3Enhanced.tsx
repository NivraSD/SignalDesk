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
  Image as ImageIcon,
  Video,
  Users,
  Download,
  X,
  ArrowLeft
} from 'lucide-react'
import NIVContentOrchestrator from './NIVContentOrchestrator'
import ContentEditor from './ContentEditor'
import ContentQueue from './ContentQueue'
import ContentLibrary from './ContentLibrary'
import FrameworkBanner from './FrameworkBanner'
import { MediaDisplay, MediaGallery } from './MediaDisplay'
import { useAppStore } from '@/stores/useAppStore'
import { useNivStrategyV2 } from '@/hooks/useNivStrategyV2'
import type { ContentItem, ContentType, OrchestrationSession } from '@/types/content'
import { ContentGenerationService } from '@/services/ContentGenerationService'

interface ExecuteTabV3EnhancedProps {
  className?: string
}

// Enhanced content types including visual content
const CONTENT_TYPES: { type: ContentType | 'image' | 'video' | 'media-list'; label: string; icon: any; description: string }[] = [
  { type: 'press-release', label: 'Press Release', icon: Megaphone, description: 'Official announcements' },
  { type: 'social-post', label: 'Social Media', icon: Hash, description: 'Platform-optimized posts' },
  { type: 'image', label: 'Image', icon: ImageIcon, description: 'AI-generated visuals' },
  { type: 'video', label: 'Video', icon: Video, description: 'Video content' },
  { type: 'presentation', label: 'Presentation', icon: Presentation, description: 'Deck content via Gamma' },
  { type: 'media-list', label: 'Media List', icon: Users, description: 'Target journalist list' },
  { type: 'exec-statement', label: 'Executive Statement', icon: Briefcase, description: 'Leadership messages' },
  { type: 'crisis-response', label: 'Crisis Response', icon: AlertTriangle, description: 'Incident management' },
  { type: 'email', label: 'Email Campaign', icon: Mail, description: 'Targeted outreach' },
  { type: 'qa-doc', label: 'Q&A Document', icon: FileQuestion, description: 'FAQs and responses' },
  { type: 'media-pitch', label: 'Media Pitch', icon: Mic, description: 'Journalist outreach' },
  { type: 'thought-leadership', label: 'Thought Leadership', icon: BookOpen, description: 'Industry insights' },
  { type: 'messaging', label: 'Messaging', icon: MessageSquare, description: 'Core narratives' }
]

export default function ExecuteTabV3Enhanced({ className = '' }: ExecuteTabV3EnhancedProps) {
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [activeView, setActiveView] = useState<'types' | 'assistant' | 'editor' | 'queue' | 'library' | 'media'>('types')
  const [currentContent, setCurrentContent] = useState<ContentItem | null>(null)
  const [generatedMedia, setGeneratedMedia] = useState<Array<{
    id: string
    url: string
    type: 'image' | 'video'
    title?: string
    metadata?: any
  }>>([])
  const [isGeneratingMedia, setIsGeneratingMedia] = useState(false)

  const { organization } = useAppStore()
  const { framework, loading: frameworkLoading } = useNivStrategyV2()

  const [orchestrationSession, setOrchestrationSession] = useState<OrchestrationSession | null>(null)
  const [hasFramework, setHasFramework] = useState(false)

  useEffect(() => {
    setHasFramework(!!framework && Object.keys(framework).length > 0)
  }, [framework])

  const handleTypeSelection = async (type: string) => {
    setSelectedType(type)

    // All content types go through NIV assistant first
    if (type === 'media-list') {
      // Media list might have special handling
      setActiveView('assistant')
    } else {
      // All content including image/video goes through NIV
      setActiveView('assistant')
    }
  }

  const generateVisualContent = async (type: 'image' | 'video') => {
    setIsGeneratingMedia(true)

    try {
      const response = await fetch('/api/supabase/functions/content-visual-generation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          framework,
          style: type === 'image' ? 'professional' : 'corporate',
          aspectRatio: '16:9',
          duration: type === 'video' ? 15 : undefined
        })
      })

      const result = await response.json()

      if (result.success) {
        if (type === 'image' && result.images) {
          setGeneratedMedia(prev => [
            ...prev,
            ...result.images.map((img: any) => ({
              id: `img-${Date.now()}-${Math.random()}`,
              url: img.url,
              type: 'image' as const,
              title: `Generated for ${framework?.strategy?.objective || 'Campaign'}`,
              metadata: img.metadata
            }))
          ])
        } else if (type === 'video' && result.jobId) {
          // Handle async video generation
          setGeneratedMedia(prev => [
            ...prev,
            {
              id: result.jobId,
              url: '', // Will be updated when ready
              type: 'video' as const,
              title: 'Video generating...',
              metadata: { status: 'processing', estimatedTime: result.estimatedTime }
            }
          ])

          // Poll for video completion
          pollVideoStatus(result.jobId)
        }
      } else if (result.fallback) {
        // Show fallback instructions
        console.log('Visual generation fallback:', result.fallback)
        // You could show a modal with the fallback instructions
      }
    } catch (error) {
      console.error('Visual content generation error:', error)
    } finally {
      setIsGeneratingMedia(false)
    }
  }

  const pollVideoStatus = async (jobId: string) => {
    // Poll every 10 seconds for video completion
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/webhooks/veo/${jobId}`)
        const data = await response.json()

        if (data.status === 'completed' && data.videoUrl) {
          setGeneratedMedia(prev =>
            prev.map(item =>
              item.id === jobId
                ? { ...item, url: data.videoUrl, metadata: { ...item.metadata, status: 'completed' } }
                : item
            )
          )
          clearInterval(interval)
        } else if (data.status === 'failed') {
          clearInterval(interval)
        }
      } catch (error) {
        console.error('Error polling video status:', error)
      }
    }, 10000)

    // Clear interval after 5 minutes
    setTimeout(() => clearInterval(interval), 300000)
  }

  const generateMediaList = async () => {
    try {
      const response = await fetch('/api/supabase/functions/media-list-generation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          framework,
          organization: organization?.name || 'OpenAI',
          tier1Count: 10,
          tier2Count: 20
        })
      })

      const result = await response.json()

      // Display media list in a special view
      setCurrentContent({
        id: `media-list-${Date.now()}`,
        type: 'media-list' as ContentType,
        title: 'Media Target List',
        content: result.mediaTargets,
        status: 'completed',
        metadata: {
          tier1Count: result.tier1Count,
          tier2Count: result.tier2Count,
          beats: result.beats
        }
      })

      setActiveView('editor')
    } catch (error) {
      console.error('Media list generation error:', error)
    }
  }

  const handleContentGenerated = (content: ContentItem) => {
    setCurrentContent(content)
    setActiveView('editor')
  }

  const handleSaveContent = async (content: ContentItem) => {
    console.log('Saving content:', content)
    setCurrentContent(content)
  }

  const handleGoBack = () => {
    if (activeView === 'media') {
      setActiveView('types')
    } else if (activeView === 'assistant' || activeView === 'editor') {
      setActiveView('types')
    } else if (activeView === 'queue' || activeView === 'library') {
      setActiveView('types')
    }
    setSelectedType(null)
  }

  return (
    <div className={`execute-tab-v3 h-full flex flex-col ${className}`}>
      {/* Framework Banner */}
      {hasFramework && (
        <FrameworkBanner
          framework={framework}
          onExecute={() => console.log('Execute framework')}
        />
      )}

      {/* Navigation Header */}
      <div className="px-6 py-4 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {activeView !== 'types' && (
              <button
                onClick={handleGoBack}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-400" />
              </button>
            )}
            <h2 className="text-xl font-semibold text-white">
              {activeView === 'types' && 'Create Content'}
              {activeView === 'assistant' && `${CONTENT_TYPES.find(t => t.type === selectedType)?.label || 'Content'} Assistant`}
              {activeView === 'editor' && 'Content Editor'}
              {activeView === 'media' && 'Visual Content'}
              {activeView === 'queue' && 'Content Queue'}
              {activeView === 'library' && 'Content Library'}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveView('queue')}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                activeView === 'queue' ? 'bg-gray-800' : 'hover:bg-gray-800'
              }`}
            >
              <List className="w-4 h-4" />
              <span>Queue</span>
            </button>
            <button
              onClick={() => setActiveView('library')}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                activeView === 'library' ? 'bg-gray-800' : 'hover:bg-gray-800'
              }`}
            >
              <Library className="w-4 h-4" />
              <span>Library</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        {/* Content Type Selection */}
        {activeView === 'types' && (
          <div className="h-full overflow-y-auto p-6">
            <div className="max-w-6xl mx-auto">
              <div className="mb-6">
                <p className="text-gray-400">
                  Choose content type to create. NIV will help you craft it based on your strategic framework.
                </p>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {CONTENT_TYPES.map(({ type, label, icon: Icon, description }) => (
                  <button
                    key={type}
                    onClick={() => handleTypeSelection(type)}
                    className="p-6 bg-gray-800 hover:bg-gray-750 rounded-lg border border-gray-700 hover:border-yellow-500/50 transition-all text-left group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-gray-700 rounded-lg group-hover:bg-yellow-500/20 transition-colors">
                        <Icon className="w-6 h-6 text-yellow-500" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-white mb-1">{label}</h3>
                        <p className="text-sm text-gray-400">{description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* NIV Content Orchestrator - Handles all content types and orchestration */}
        {activeView === 'assistant' && (
          <NIVContentOrchestrator
            framework={framework}
            selectedContentType={selectedType || undefined}
            onContentGenerated={handleContentGenerated}
            onContentSave={handleSaveContent}
            className="h-full"
          />
        )}

        {/* Content Editor */}
        {activeView === 'editor' && currentContent && (
          <ContentEditor
            content={currentContent}
            onSave={handleSaveContent}
            onCancel={handleGoBack}
          />
        )}

        {/* Media Display */}
        {activeView === 'media' && (
          <div className="h-full overflow-y-auto p-6">
            <div className="max-w-6xl mx-auto">
              {isGeneratingMedia && (
                <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <p className="text-blue-400">Generating visual content...</p>
                </div>
              )}

              {generatedMedia.length > 0 && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-white">Generated Visual Content</h3>

                  {/* Display individual media items */}
                  {generatedMedia.map(item => (
                    <MediaDisplay
                      key={item.id}
                      mediaUrl={item.url}
                      mediaType={item.type}
                      title={item.title}
                      metadata={item.metadata}
                      onDownload={() => {
                        // Handle download with export tracking
                        const link = document.createElement('a')
                        link.href = item.url
                        link.download = item.title || `${item.type}-${Date.now()}`
                        link.click()
                      }}
                    />
                  ))}

                  {/* Export options */}
                  <div className="flex gap-4 mt-6">
                    <button className="px-4 py-2 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 transition-colors flex items-center gap-2">
                      <Download className="w-4 h-4" />
                      Export All
                    </button>
                  </div>
                </div>
              )}

              {generatedMedia.length === 0 && !isGeneratingMedia && (
                <div className="text-center py-12">
                  <p className="text-gray-400">No visual content generated yet.</p>
                  <button
                    onClick={() => generateVisualContent(selectedType as 'image' | 'video')}
                    className="mt-4 px-4 py-2 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400"
                  >
                    Generate {selectedType === 'image' ? 'Image' : 'Video'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Content Queue */}
        {activeView === 'queue' && (
          <ContentQueue
            onSelectContent={(content) => {
              setCurrentContent(content)
              setActiveView('editor')
            }}
          />
        )}

        {/* Content Library */}
        {activeView === 'library' && (
          <ContentLibrary
            onSelectContent={(content) => {
              setCurrentContent(content)
              setActiveView('editor')
            }}
          />
        )}
      </div>
    </div>
  )
}