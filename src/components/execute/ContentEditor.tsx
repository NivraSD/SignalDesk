'use client'

import React, { useState, useEffect } from 'react'
import {
  Bold,
  Italic,
  List,
  Link,
  Quote,
  Code,
  Sparkles,
  Save,
  Download,
  Share2,
  Eye,
  History,
  Users,
  Globe,
  Shield,
  Target,
  Mic,
  Brain,
  Copy,
  Check,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { CONTENT_TYPE_CONFIG, AUDIENCE_PROFILES, type ContentType, type ContentItem, type AudienceType, type ContentGenerationRequest } from '@/types/content'
import { ContentGenerationService } from '@/services/ContentGenerationService'
import { useAppStore } from '@/stores/useAppStore'

interface ContentEditorProps {
  content?: ContentItem | null
  type?: ContentType
  framework?: any
  onSave: (content: ContentItem) => void
  className?: string
}

type EditorView = 'edit' | 'preview' | 'versions'

export default function ContentEditor({ content, type, framework, onSave, className = '' }: ContentEditorProps) {
  const [currentContent, setCurrentContent] = useState<ContentItem>(content || {
    id: `content-${Date.now()}`,
    title: '',
    type: type || 'press-release',
    content: '',
    status: 'in-progress',
    priority: 'medium',
    metadata: {
      createdAt: new Date()
    }
  })

  const [activeView, setActiveView] = useState<EditorView>('edit')
  const [selectedAudience, setSelectedAudience] = useState<AudienceType>('general-public')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showAudiencePanel, setShowAudiencePanel] = useState(false)
  const [copiedToClipboard, setCopiedToClipboard] = useState(false)
  const [wordCount, setWordCount] = useState(0)

  useEffect(() => {
    if (content) {
      setCurrentContent(content)
    } else if (type) {
      setCurrentContent(prev => ({
        ...prev,
        type,
        title: `New ${CONTENT_TYPE_CONFIG[type].label}`
      }))
    }
  }, [content, type])

  useEffect(() => {
    const words = currentContent.content?.split(/\s+/).filter(word => word.length > 0).length || 0
    setWordCount(words)
  }, [currentContent.content])

  const handleContentChange = (value: string) => {
    setCurrentContent(prev => ({
      ...prev,
      content: value,
      metadata: {
        ...prev.metadata,
        updatedAt: new Date(),
        wordCount: value.split(/\s+/).filter(word => word.length > 0).length
      }
    }))
  }

  const handleTitleChange = (value: string) => {
    setCurrentContent(prev => ({
      ...prev,
      title: value
    }))
  }

  const { organization } = useAppStore()

  const generateWithAI = async () => {
    setIsGenerating(true)

    try {
      const request: ContentGenerationRequest = {
        type: currentContent.type,
        context: {
          framework: framework?.framework_data || framework?.strategy || framework,
          organization,
          intelligence: framework?.intelligence
        },
        options: {
          tone: CONTENT_TYPE_CONFIG[currentContent.type].defaultTone,
          audience: selectedAudience ? [selectedAudience] : undefined,
          includeData: true
        },
        prompt: currentContent.title || `Generate ${CONTENT_TYPE_CONFIG[currentContent.type].label}`
      }

      const response = await ContentGenerationService.generateContent(request)

      if (response.success && response.content) {
        handleContentChange(response.content)
      } else {
        console.error('Failed to generate content')
        // Fallback to showing an error message
        handleContentChange('Failed to generate content. Please try again.')
      }
    } catch (error) {
      console.error('Error generating content:', error)
      handleContentChange('An error occurred while generating content. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)

    // Add metadata
    const updatedContent = {
      ...currentContent,
      metadata: {
        ...currentContent.metadata,
        updatedAt: new Date(),
        wordCount,
        readingTime: Math.ceil(wordCount / 200) // Assuming 200 words per minute
      }
    }

    // Save content
    await new Promise(resolve => setTimeout(resolve, 500))
    onSave(updatedContent)
    setIsSaving(false)
  }

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(currentContent.content || '')
    setCopiedToClipboard(true)
    setTimeout(() => setCopiedToClipboard(false), 2000)
  }

  const adaptForAudience = async (audience: AudienceType) => {
    if (!currentContent.content) {
      alert('Please generate or write content first before adapting for audiences')
      return
    }

    setIsGenerating(true)

    try {
      const versions = await ContentGenerationService.generateAudienceVersions(
        currentContent.content,
        [audience],
        {
          framework: framework?.framework_data || framework?.strategy || framework,
          organization
        }
      )

      if (versions.length > 0) {
        if (!currentContent.versions) {
          setCurrentContent(prev => ({ ...prev, versions: [] }))
        }

        setCurrentContent(prev => ({
          ...prev,
          versions: [...(prev.versions || []), ...versions]
        }))

        setSelectedAudience(audience)
      }
    } catch (error) {
      console.error('Error adapting content:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const contentTypeConfig = CONTENT_TYPE_CONFIG[currentContent.type]

  // Prevent spacebar from triggering canvas pan
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ') {
      e.stopPropagation()
    }
  }

  const handleKeyUp = (e: React.KeyboardEvent) => {
    if (e.key === ' ') {
      e.stopPropagation()
    }
  }

  return (
    <div
      className={`content-editor flex flex-col h-full bg-gray-800 rounded-lg ${className}`}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
    >
      {/* Editor Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center gap-3 flex-1">
          <span className="text-2xl">{contentTypeConfig.icon}</span>
          <input
            type="text"
            value={currentContent.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder={`Enter ${contentTypeConfig.label} title...`}
            className="flex-1 bg-transparent text-lg font-medium focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setActiveView('edit')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                activeView === 'edit' ? 'bg-gray-600 text-white' : 'text-gray-400'
              }`}
            >
              Edit
            </button>
            <button
              onClick={() => setActiveView('preview')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                activeView === 'preview' ? 'bg-gray-600 text-white' : 'text-gray-400'
              }`}
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveView('versions')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                activeView === 'versions' ? 'bg-gray-600 text-white' : 'text-gray-400'
              }`}
            >
              <Users className="w-4 h-4" />
            </button>
          </div>

          {/* Actions */}
          <button
            onClick={copyToClipboard}
            className="p-2 hover:bg-gray-700 rounded transition-colors"
          >
            {copiedToClipboard ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
          </button>
          <button className="p-2 hover:bg-gray-700 rounded transition-colors">
            <Share2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save
          </button>
        </div>
      </div>

      {/* Toolbar */}
      {activeView === 'edit' && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700">
          <div className="flex items-center gap-1">
            <button className="p-2 hover:bg-gray-700 rounded transition-colors">
              <Bold className="w-4 h-4" />
            </button>
            <button className="p-2 hover:bg-gray-700 rounded transition-colors">
              <Italic className="w-4 h-4" />
            </button>
            <button className="p-2 hover:bg-gray-700 rounded transition-colors">
              <List className="w-4 h-4" />
            </button>
            <button className="p-2 hover:bg-gray-700 rounded transition-colors">
              <Link className="w-4 h-4" />
            </button>
            <button className="p-2 hover:bg-gray-700 rounded transition-colors">
              <Quote className="w-4 h-4" />
            </button>
            <button className="p-2 hover:bg-gray-700 rounded transition-colors">
              <Code className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* AI Generation */}
            <button
              onClick={generateWithAI}
              disabled={isGenerating}
              className="flex items-center gap-1.5 px-2.5 py-1 text-sm bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded transition-colors disabled:opacity-50"
            >
              {isGenerating ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Sparkles className="w-3 h-3" />
              )}
              {isGenerating ? 'Generating...' : 'AI Generate'}
            </button>

            {/* Audience Adaptation */}
            <button
              onClick={() => setShowAudiencePanel(!showAudiencePanel)}
              className="flex items-center gap-1.5 px-2.5 py-1 text-sm bg-gray-700 hover:bg-gray-600 rounded transition-colors"
            >
              <Users className="w-3 h-3" />
              Audience
            </button>
          </div>
        </div>
      )}

      {/* Audience Panel */}
      {showAudiencePanel && (
        <div className="px-4 py-3 bg-gray-700/50 border-b border-gray-700">
          <p className="text-sm text-gray-400 mb-2">Select audience to create adapted version:</p>
          <div className="flex flex-wrap gap-2">
            {Object.keys(AUDIENCE_PROFILES).map(audience => (
              <button
                key={audience}
                onClick={() => {
                  adaptForAudience(audience as AudienceType)
                  setShowAudiencePanel(false)
                }}
                className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm capitalize transition-colors"
              >
                {audience}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {activeView === 'edit' && (
          <textarea
            value={currentContent.content}
            onChange={(e) => handleContentChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === ' ') {
                e.stopPropagation()
              }
            }}
            placeholder={`Start writing your ${contentTypeConfig.label.toLowerCase()}...\n\n${contentTypeConfig.guidelines}`}
            className="w-full h-full p-4 bg-gray-900/50 resize-none focus:outline-none"
          />
        )}

        {activeView === 'preview' && (
          <div className="h-full overflow-y-auto p-6 prose prose-invert max-w-none">
            <h1>{currentContent.title}</h1>
            <div className="whitespace-pre-wrap">{currentContent.content || 'No content to preview'}</div>
          </div>
        )}

        {activeView === 'versions' && (
          <div className="h-full overflow-y-auto p-4 space-y-4">
            <h3 className="text-lg font-medium mb-3">Content Versions by Audience</h3>
            {currentContent.versions && currentContent.versions.length > 0 ? (
              currentContent.versions.map(version => (
                <div key={version.id} className="p-4 bg-gray-700/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium capitalize">{version.audience} Version</h4>
                    <div className="flex gap-2 text-sm">
                      <span className="px-2 py-1 bg-gray-600 rounded">{version.adaptations.tone}</span>
                      <span className="px-2 py-1 bg-gray-600 rounded">{version.adaptations.language}</span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-300 whitespace-pre-wrap max-h-40 overflow-y-auto">
                    {version.content}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Users className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                <p>No audience versions created yet</p>
                <button
                  onClick={() => setShowAudiencePanel(true)}
                  className="mt-3 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                >
                  Create Audience Version
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Status Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900/50 border-t border-gray-700 text-xs text-gray-400">
        <div className="flex items-center gap-4">
          <span>{wordCount} words</span>
          <span>{Math.ceil(wordCount / 200)} min read</span>
          <span className="capitalize">{currentContent.status}</span>
        </div>
        <div className="flex items-center gap-2">
          {framework && (
            <span className="flex items-center gap-1">
              <Target className="w-3 h-3" />
              Framework: {framework.strategy?.objective?.substring(0, 30)}...
            </span>
          )}
        </div>
      </div>
    </div>
  )
}