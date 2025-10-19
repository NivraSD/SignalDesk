'use client'

import React, { useState, useRef, useEffect } from 'react'
import {
  Brain,
  Send,
  Sparkles,
  FileText,
  Target,
  Users,
  Globe,
  Shield,
  TrendingUp,
  MessageSquare,
  AlertCircle,
  Loader2,
  X,
  ChevronRight,
  Lightbulb,
  Copy,
  Check,
  Save,
  Edit3,
  Wand2,
  Hash,
  AtSign,
  Camera,
  Megaphone,
  Mail,
  FileQuestion,
  Presentation,
  PenTool,
  AlertTriangle,
  Mic,
  Briefcase,
  BookOpen
} from 'lucide-react'
import type { ContentType, ContentGenerationRequest, ContentItem, AudienceType } from '@/types/content'
import { ContentGenerationService } from '@/services/ContentGenerationService'
import { useAppStore } from '@/stores/useAppStore'
import { supabase } from '@/lib/supabase/client'

interface NIVContentAssistantProps {
  framework?: any
  onContentSave: (content: ContentItem) => void
  onWorkspaceOpen?: (content: ContentItem) => void
  initialContentType?: ContentType
  className?: string
}

interface Message {
  id: string
  type: 'user' | 'assistant' | 'content' | 'tool'
  content: string
  timestamp: Date
  suggestions?: Suggestion[]
  contentType?: ContentType
  generatedContent?: ContentItem
  toolCall?: {
    name: string
    status: 'calling' | 'success' | 'error'
    result?: any
  }
}

interface Suggestion {
  label: string
  action: () => void
  icon?: any
  type?: 'create' | 'refine' | 'save' | 'edit'
}

interface ConversationContext {
  currentTopic?: string
  contentType?: ContentType
  audience?: AudienceType[]
  tone?: string
  requirements?: string[]
  draft?: string
  clarificationNeeded?: string[]
}

const CONTENT_TYPE_ICONS: Record<ContentType, any> = {
  'press-release': Megaphone,
  'social-post': Hash,
  'exec-statement': Briefcase,
  'crisis-response': AlertTriangle,
  'email': Mail,
  'qa-doc': FileQuestion,
  'media-pitch': Mic,
  'thought-leadership': BookOpen,
  'presentation': Presentation,
  'messaging': MessageSquare
}

const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  'press-release': 'Press Release',
  'social-post': 'Social Media Post',
  'exec-statement': 'Executive Statement',
  'crisis-response': 'Crisis Response',
  'email': 'Email Campaign',
  'qa-doc': 'Q&A Document',
  'media-pitch': 'Media Pitch',
  'thought-leadership': 'Thought Leadership',
  'presentation': 'Presentation',
  'messaging': 'Messaging Framework'
}

const AUDIENCE_OPTIONS: AudienceType[] = [
  'investors',
  'customers',
  'employees',
  'media',
  'partners',
  'regulators',
  'general-public',
  'technical',
  'executives',
  'board'
]

export default function NIVContentAssistant({
  framework,
  onContentSave,
  onWorkspaceOpen,
  initialContentType,
  className = ''
}: NIVContentAssistantProps) {
  const { organization } = useAppStore()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [context, setContext] = useState<ConversationContext>({})
  const [currentDraft, setCurrentDraft] = useState<ContentItem | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Initialize with welcome message
    const welcomeMessage: Message = {
      id: 'welcome',
      type: 'assistant',
      content: `Hi! I'm NIV, your AI content assistant. I can help you create any type of strategic content${
        framework ? ` based on your active framework: "${framework.strategy?.objective?.substring(0, 50)}..."` : ''
      }.\n\nWhat would you like to create today? You can:\n• Describe what you need in your own words\n• Select a content type below\n• Ask me for suggestions`,
      timestamp: new Date(),
      suggestions: getInitialSuggestions()
    }
    setMessages([welcomeMessage])

    // If initial content type is provided, start that flow
    if (initialContentType) {
      handleContentTypeSelect(initialContentType)
    }
  }, [framework, initialContentType])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const getInitialSuggestions = (): Suggestion[] => {
    const suggestions: Suggestion[] = []

    // Add content type suggestions
    const contentTypes: ContentType[] = ['press-release', 'social-post', 'exec-statement', 'email']
    contentTypes.forEach(type => {
      const Icon = CONTENT_TYPE_ICONS[type]
      suggestions.push({
        label: `Create ${CONTENT_TYPE_LABELS[type]}`,
        action: () => handleContentTypeSelect(type),
        icon: Icon,
        type: 'create'
      })
    })

    // Add contextual suggestion if framework is active
    if (framework) {
      suggestions.unshift({
        label: 'Generate priority content from framework',
        action: () => handleFrameworkContent(),
        icon: Target,
        type: 'create'
      })
    }

    return suggestions
  }

  const handleContentTypeSelect = (type: ContentType) => {
    setContext(prev => ({ ...prev, contentType: type }))

    const message: Message = {
      id: `msg-${Date.now()}`,
      type: 'assistant',
      content: `Great! Let's create a ${CONTENT_TYPE_LABELS[type]}. \n\nTo help me generate the best content, could you tell me:\n1. What's the main message or announcement?\n2. Who is the target audience?\n3. Any specific details or requirements?`,
      timestamp: new Date(),
      contentType: type,
      suggestions: [
        {
          label: 'Use framework context',
          action: () => generateWithFramework(type),
          icon: Target,
          type: 'create'
        },
        {
          label: 'Skip to generation',
          action: () => generateContent(type),
          icon: Wand2,
          type: 'create'
        }
      ]
    }

    setMessages(prev => [...prev, message])
  }

  const handleFrameworkContent = () => {
    if (!framework?.strategy?.content_needs?.priority_content) {
      addAssistantMessage('No priority content found in the active framework. Let me know what you\'d like to create.')
      return
    }

    const priorityContent = framework.strategy.content_needs.priority_content[0]
    const contentType = detectContentType(priorityContent)

    addAssistantMessage(`I'll help you with the first priority item from your framework: "${priorityContent}"\n\nLet me generate this for you...`)
    generateContent(contentType, priorityContent)
  }

  const generateWithFramework = (type: ContentType) => {
    if (!framework) {
      generateContent(type)
      return
    }

    const prompt = `Generate ${CONTENT_TYPE_LABELS[type]} based on framework: ${framework.strategy?.objective}`
    generateContent(type, prompt)
  }

  const detectContentType = (text: string): ContentType => {
    const lower = text.toLowerCase()

    if (lower.includes('press release')) return 'press-release'
    if (lower.includes('social') || lower.includes('tweet') || lower.includes('post')) return 'social-post'
    if (lower.includes('executive') || lower.includes('statement')) return 'exec-statement'
    if (lower.includes('crisis')) return 'crisis-response'
    if (lower.includes('email') || lower.includes('newsletter')) return 'email'
    if (lower.includes('q&a') || lower.includes('faq')) return 'qa-doc'
    if (lower.includes('pitch') || lower.includes('media')) return 'media-pitch'
    if (lower.includes('article') || lower.includes('thought')) return 'thought-leadership'
    if (lower.includes('presentation') || lower.includes('deck')) return 'presentation'

    return 'messaging'
  }

  const generateContent = async (type: ContentType, prompt?: string) => {
    setIsProcessing(true)

    // Show tool calling message
    const toolMessage: Message = {
      id: `tool-${Date.now()}`,
      type: 'tool',
      content: 'Calling MCP Content Generator...',
      timestamp: new Date(),
      toolCall: {
        name: `mcp-content/${type}`,
        status: 'calling'
      }
    }
    setMessages(prev => [...prev, toolMessage])

    try {
      // Call the appropriate MCP based on content type
      const request: ContentGenerationRequest = {
        type,
        context: {
          framework: framework?.framework_data || framework?.strategy || framework,
          organization,
          intelligence: framework?.intelligence
        },
        options: {
          tone: context.tone || 'professional',
          audience: context.audience,
          includeData: true,
          generateVariations: true
        },
        prompt: prompt || inputValue || `Generate ${CONTENT_TYPE_LABELS[type]}`
      }

      const response = await ContentGenerationService.generateContent(request)

      if (response.success && response.content) {
        // Update tool message to success
        setMessages(prev => prev.map(msg =>
          msg.id === toolMessage.id
            ? { ...msg, toolCall: { ...msg.toolCall!, status: 'success', result: response } }
            : msg
        ))

        // Create content item
        const contentItem: ContentItem = {
          id: `content-${Date.now()}`,
          title: `${CONTENT_TYPE_LABELS[type]} - ${new Date().toLocaleDateString()}`,
          type,
          content: response.content,
          status: 'draft',
          priority: 'high',
          frameworkId: framework?.id,
          versions: response.variations,
          metadata: {
            createdAt: new Date(),
            updatedAt: new Date(),
            ...response.metadata
          }
        }

        setCurrentDraft(contentItem)

        // Add content message
        const contentMessage: Message = {
          id: `content-${Date.now()}`,
          type: 'content',
          content: response.content,
          timestamp: new Date(),
          contentType: type,
          generatedContent: contentItem,
          suggestions: [
            {
              label: 'Save to Library',
              action: () => saveContent(contentItem),
              icon: Save,
              type: 'save'
            },
            {
              label: 'Open in Workspace',
              action: () => openInWorkspace(contentItem),
              icon: Edit3,
              type: 'edit'
            },
            {
              label: 'Generate Variations',
              action: () => generateVariations(contentItem),
              icon: Users,
              type: 'refine'
            },
            {
              label: 'Refine Content',
              action: () => refineContent(contentItem),
              icon: Wand2,
              type: 'refine'
            }
          ]
        }

        setMessages(prev => [...prev, contentMessage])
      } else {
        throw new Error('Failed to generate content')
      }
    } catch (error) {
      // Update tool message to error
      setMessages(prev => prev.map(msg =>
        msg.id === toolMessage.id
          ? { ...msg, toolCall: { ...msg.toolCall!, status: 'error', result: error } }
          : msg
      ))

      addAssistantMessage('I encountered an error generating content. Please try again or rephrase your request.')
    } finally {
      setIsProcessing(false)
    }
  }

  const saveContent = async (content: ContentItem) => {
    // Save to Memory Vault
    const saved = await ContentGenerationService.saveToMemoryVault(content)

    if (saved) {
      onContentSave(content)
      addAssistantMessage('Content saved to your library! Would you like to create something else?', getInitialSuggestions())
    } else {
      addAssistantMessage('Failed to save content. Please try again.')
    }
  }

  const openInWorkspace = (content: ContentItem) => {
    if (onWorkspaceOpen) {
      onWorkspaceOpen(content)
      addAssistantMessage('Content opened in workspace. You can continue editing there while I help you with other content.')
    }
  }

  const generateVariations = async (content: ContentItem) => {
    setIsProcessing(true)
    addAssistantMessage('Generating audience variations...')

    try {
      const variations = await ContentGenerationService.generateAudienceVersions(
        content.content,
        AUDIENCE_OPTIONS.slice(0, 3), // Generate for top 3 audiences
        { framework, organization }
      )

      const updatedContent = {
        ...content,
        versions: variations
      }

      setCurrentDraft(updatedContent)

      addAssistantMessage(
        `I've created ${variations.length} audience variations. Each is optimized for different stakeholders.`,
        [
          {
            label: 'Save All Versions',
            action: () => saveContent(updatedContent),
            icon: Save,
            type: 'save'
          },
          {
            label: 'View in Workspace',
            action: () => openInWorkspace(updatedContent),
            icon: Edit3,
            type: 'edit'
          }
        ]
      )
    } catch (error) {
      addAssistantMessage('Failed to generate variations. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const refineContent = (content: ContentItem) => {
    setContext(prev => ({ ...prev, draft: content.content }))
    addAssistantMessage(
      'What would you like me to refine? You can ask me to:\n• Adjust the tone\n• Add more details\n• Make it shorter/longer\n• Focus on specific points\n• Change the audience perspective'
    )
  }

  const handleSend = async () => {
    if (!inputValue.trim() || isProcessing) return

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    const userInput = inputValue
    setInputValue('')

    // Analyze user intent
    const detectedType = detectContentType(userInput)

    if (!context.contentType) {
      // First interaction - detect what they want
      if (detectedType !== 'messaging') {
        handleContentTypeSelect(detectedType)
      } else {
        // Need clarification
        addAssistantMessage(
          'I can help you create that! What type of content would you like?',
          getInitialSuggestions()
        )
      }
    } else if (context.draft) {
      // Refining existing content
      await refineWithPrompt(userInput)
    } else {
      // Continue with current context
      await generateContent(context.contentType, userInput)
    }
  }

  const refineWithPrompt = async (prompt: string) => {
    if (!currentDraft) return

    setIsProcessing(true)

    try {
      const request: ContentGenerationRequest = {
        type: currentDraft.type,
        context: {
          framework,
          organization,
          existingContent: currentDraft.content
        },
        options: {
          tone: context.tone || 'professional',
          audience: context.audience
        },
        prompt: `Refine this content based on: ${prompt}\n\nOriginal:\n${currentDraft.content}`
      }

      const response = await ContentGenerationService.generateContent(request)

      if (response.success && response.content) {
        const refinedContent = {
          ...currentDraft,
          content: response.content,
          metadata: {
            ...currentDraft.metadata,
            updatedAt: new Date()
          }
        }

        setCurrentDraft(refinedContent)

        const contentMessage: Message = {
          id: `content-${Date.now()}`,
          type: 'content',
          content: response.content,
          timestamp: new Date(),
          generatedContent: refinedContent,
          suggestions: [
            {
              label: 'Save Refined Version',
              action: () => saveContent(refinedContent),
              icon: Save,
              type: 'save'
            },
            {
              label: 'Continue Refining',
              action: () => refineContent(refinedContent),
              icon: Wand2,
              type: 'refine'
            }
          ]
        }

        setMessages(prev => [...prev, contentMessage])
      }
    } catch (error) {
      addAssistantMessage('Failed to refine content. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const addAssistantMessage = (content: string, suggestions?: Suggestion[]) => {
    const message: Message = {
      id: `msg-${Date.now()}`,
      type: 'assistant',
      content,
      timestamp: new Date(),
      suggestions
    }
    setMessages(prev => [...prev, message])
  }

  const copyContent = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className={`niv-content-assistant flex flex-col h-full bg-gray-900 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-700 bg-gradient-to-r from-purple-900/20 to-blue-900/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-medium">NIV Content Studio</h3>
              <p className="text-xs text-gray-400">AI-Powered Strategic Content Creation</p>
            </div>
          </div>
          {framework && (
            <div className="flex items-center gap-2 px-3 py-1 bg-purple-900/30 rounded-full">
              <Target className="w-3 h-3 text-purple-400" />
              <span className="text-xs text-purple-400">Framework Active</span>
            </div>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(message => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-3xl ${message.type === 'user' ? 'order-2' : 'order-1'}`}>
              {/* Tool Call Message */}
              {message.type === 'tool' && (
                <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
                  <div className="flex items-center gap-2">
                    {message.toolCall?.status === 'calling' && (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                        <span className="text-sm text-blue-400">{message.content}</span>
                      </>
                    )}
                    {message.toolCall?.status === 'success' && (
                      <>
                        <Check className="w-4 h-4 text-green-400" />
                        <span className="text-sm text-green-400">Content generated successfully</span>
                      </>
                    )}
                    {message.toolCall?.status === 'error' && (
                      <>
                        <AlertCircle className="w-4 h-4 text-red-400" />
                        <span className="text-sm text-red-400">Generation failed</span>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Content Message */}
              {message.type === 'content' && (
                <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 p-4 rounded-lg border border-purple-600/30">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {message.contentType && (
                        <>
                          {React.createElement(CONTENT_TYPE_ICONS[message.contentType], {
                            className: 'w-4 h-4 text-purple-400'
                          })}
                          <span className="text-sm font-medium text-purple-400">
                            {CONTENT_TYPE_LABELS[message.contentType]}
                          </span>
                        </>
                      )}
                    </div>
                    <button
                      onClick={() => copyContent(message.content)}
                      className="p-1.5 hover:bg-gray-700 rounded transition-colors"
                      title="Copy content"
                    >
                      <Copy className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                  <div className="text-sm text-gray-200 whitespace-pre-wrap max-h-96 overflow-y-auto">
                    {message.content}
                  </div>
                </div>
              )}

              {/* Regular Message */}
              {(message.type === 'assistant' || message.type === 'user') && (
                <div
                  className={`p-4 rounded-lg ${
                    message.type === 'user'
                      ? 'bg-purple-600/20 border border-purple-600/30'
                      : 'bg-gray-800'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {message.type === 'assistant' && (
                      <div className="p-1.5 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg">
                        <Sparkles className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Suggestions */}
              {message.suggestions && message.suggestions.length > 0 && (
                <div className="mt-3 space-y-1">
                  {message.suggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={suggestion.action}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all w-full text-left ${
                        suggestion.type === 'save'
                          ? 'bg-green-900/20 hover:bg-green-900/30 border border-green-600/30'
                          : suggestion.type === 'edit'
                          ? 'bg-blue-900/20 hover:bg-blue-900/30 border border-blue-600/30'
                          : 'bg-gray-800 hover:bg-gray-700 border border-gray-600'
                      }`}
                    >
                      {suggestion.icon && React.createElement(suggestion.icon, {
                        className: `w-4 h-4 ${
                          suggestion.type === 'save' ? 'text-green-400' :
                          suggestion.type === 'edit' ? 'text-blue-400' :
                          'text-gray-400'
                        }`
                      })}
                      <span className="flex-1 text-sm">{suggestion.label}</span>
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {isProcessing && !messages.find(m => m.type === 'tool') && (
          <div className="flex justify-start">
            <div className="bg-gray-800 p-4 rounded-lg">
              <div className="flex items-center gap-3">
                <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                <span className="text-sm text-gray-400">NIV is thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-700 bg-gray-800/50">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === ' ') {
                  e.stopPropagation()
                }
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              placeholder="Describe what you want to create or ask for help..."
              className="w-full px-4 py-3 bg-gray-700 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              rows={2}
            />
            <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
              <span>Press Enter to send, Shift+Enter for new line</span>
              {context.contentType && (
                <span className="text-purple-400">
                  Creating: {CONTENT_TYPE_LABELS[context.contentType]}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isProcessing}
            className={`p-3 rounded-lg transition-all ${
              !inputValue.trim() || isProcessing
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white'
            }`}
          >
            {isProcessing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Quick Content Type Selection */}
        <div className="mt-3 flex flex-wrap gap-2">
          {Object.entries(CONTENT_TYPE_LABELS).slice(0, 6).map(([type, label]) => {
            const Icon = CONTENT_TYPE_ICONS[type as ContentType]
            return (
              <button
                key={type}
                onClick={() => handleContentTypeSelect(type as ContentType)}
                className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-full transition-colors flex items-center gap-2 text-xs"
              >
                <Icon className="w-3 h-3" />
                <span>{label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}