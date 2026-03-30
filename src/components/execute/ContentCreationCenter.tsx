'use client'

import React, { useState } from 'react'
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
  ChevronDown,
  ChevronRight,
  Wand2,
  Brain,
  Plus
} from 'lucide-react'
import ContentEditor from './ContentEditor'
import QuickCreateButtons from './QuickCreateButtons'
import AIAssistant from './AIAssistant'
import { CONTENT_TYPE_CONFIG, type ContentType, type ContentItem } from '@/types/content'

interface ContentCreationCenterProps {
  mode: 'orchestrated' | 'standalone'
  framework?: any
  activeContent?: ContentItem | null
  onContentCreate: (content: ContentItem) => void
  onContentComplete: (contentId: string) => void
}

interface ContentCategory {
  id: string
  label: string
  icon: React.ReactNode
  types: ContentType[]
  color: string
}

const CONTENT_CATEGORIES: ContentCategory[] = [
  {
    id: 'external',
    label: 'External Communications',
    icon: <Globe className="w-4 h-4" />,
    types: ['press-release', 'media-pitch', 'thought-leadership', 'social-post'],
    color: 'blue'
  },
  {
    id: 'internal',
    label: 'Internal Communications',
    icon: <Users className="w-4 h-4" />,
    types: ['exec-statement', 'email', 'presentation'],
    color: 'green'
  },
  {
    id: 'crisis',
    label: 'Crisis Management',
    icon: <Shield className="w-4 h-4" />,
    types: ['crisis-response', 'qa-doc'],
    color: 'red'
  },
  {
    id: 'strategy',
    label: 'Strategic Content',
    icon: <Target className="w-4 h-4" />,
    types: ['messaging', 'thought-leadership'],
    color: 'purple'
  }
]

export default function ContentCreationCenter({
  mode,
  framework,
  activeContent,
  onContentCreate,
  onContentComplete
}: ContentCreationCenterProps) {
  const [selectedType, setSelectedType] = useState<ContentType | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['external']))
  const [showAIAssistant, setShowAIAssistant] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  const handleTypeSelect = (type: ContentType) => {
    setSelectedType(type)
    setShowAIAssistant(false)

    // Create new content item
    const newContent: ContentItem = {
      id: `content-${Date.now()}`,
      title: `New ${CONTENT_TYPE_CONFIG[type].label}`,
      type,
      status: 'in-progress',
      priority: 'medium',
      frameworkId: framework?.id,
      metadata: {
        createdAt: new Date()
      }
    }

    onContentCreate(newContent)
  }

  const handleQuickCreate = async (type: ContentType) => {
    setIsGenerating(true)
    setSelectedType(type)

    // Create content with framework context
    const newContent: ContentItem = {
      id: `content-${Date.now()}`,
      title: `${CONTENT_TYPE_CONFIG[type].label} - ${framework?.strategy?.objective || 'Quick Create'}`,
      type,
      status: 'in-progress',
      priority: 'high',
      frameworkId: framework?.id,
      metadata: {
        createdAt: new Date()
      }
    }

    onContentCreate(newContent)

    // Simulate generation (will be replaced with actual API call)
    setTimeout(() => {
      setIsGenerating(false)
      onContentComplete(newContent.id)
    }, 3000)
  }

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId)
      } else {
        newSet.add(categoryId)
      }
      return newSet
    })
  }

  // Prevent spacebar from triggering canvas pan
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ') {
      e.stopPropagation()
    }
  }

  return (
    <div
      className="content-creation-center flex-1 bg-gray-800 rounded-lg overflow-hidden"
      onKeyDown={handleKeyDown}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-semibold">Content Creation</h2>
            {mode === 'orchestrated' && (
              <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded-full">
                Framework Mode
              </span>
            )}
          </div>
          <button
            onClick={() => setShowAIAssistant(!showAIAssistant)}
            className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
          >
            <Brain className="w-4 h-4" />
            AI Assistant
          </button>
        </div>
      </div>

      <div className="flex h-full">
        {/* Left Panel - Content Type Selection */}
        <div className="w-80 border-r border-gray-700 p-4 space-y-4 overflow-y-auto flex-shrink-0">
          {/* Quick Create Buttons */}
          <QuickCreateButtons
            onQuickCreate={handleQuickCreate}
            isGenerating={isGenerating}
            framework={framework}
          />

          <div className="border-t border-gray-700 pt-4">
            <h3 className="text-sm font-medium text-gray-400 mb-3">Content Categories</h3>

            {/* Content Categories */}
            {CONTENT_CATEGORIES.map(category => (
              <div key={category.id} className="mb-2">
                <button
                  onClick={() => toggleCategory(category.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors text-left`}
                >
                  {expandedCategories.has(category.id) ? (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  )}
                  {category.icon}
                  <span className="flex-1">{category.label}</span>
                  <span className="text-xs text-gray-500">{category.types.length}</span>
                </button>

                {expandedCategories.has(category.id) && (
                  <div className="ml-6 mt-1 space-y-1">
                    {category.types.map(type => (
                      <button
                        key={type}
                        onClick={() => handleTypeSelect(type)}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-700/50 transition-colors text-left text-sm ${
                          selectedType === type ? 'bg-gray-700 text-white' : 'text-gray-400'
                        }`}
                      >
                        <span className="text-lg">{CONTENT_TYPE_CONFIG[type].icon}</span>
                        <span className="flex-1">{CONTENT_TYPE_CONFIG[type].label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Custom Content Button */}
          <button className="w-full flex items-center gap-2 px-4 py-2 border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors">
            <Plus className="w-4 h-4" />
            Create Custom Content
          </button>
        </div>

        {/* Right Panel - Content Editor or AI Assistant */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {showAIAssistant ? (
            <AIAssistant
              framework={framework}
              onContentGenerate={(type, content) => {
                setSelectedType(type)
                setShowAIAssistant(false)
                // Handle AI-generated content
              }}
            />
          ) : activeContent || selectedType ? (
            <ContentEditor
              content={activeContent}
              type={selectedType || activeContent?.type}
              framework={framework}
              onSave={(content) => onContentComplete(content.id)}
              className="flex-1 h-full"
            />
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                <h3 className="text-lg font-medium text-gray-400 mb-2">
                  Select a content type to begin
                </h3>
                <p className="text-sm text-gray-500 mb-6 max-w-sm">
                  Choose from quick create options, browse categories, or use the AI Assistant
                </p>
                <button
                  onClick={() => setShowAIAssistant(true)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                >
                  <Sparkles className="w-4 h-4 inline mr-2" />
                  Use AI Assistant
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}