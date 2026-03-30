'use client'

import React, { useState, useRef, useEffect } from 'react'
import {
  Brain,
  Send,
  Sparkles,
  Target,
  Loader2,
  ChevronRight,
  Copy,
  Check,
  Save,
  Edit3,
  Wand2,
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
  Search,
  Globe,
  Zap,
  TrendingUp,
  Shield
} from 'lucide-react'
import type { ContentType, ContentGenerationRequest, ContentItem, AudienceType } from '@/types/content'
import { ContentGenerationService } from '@/services/ContentGenerationService'
import { useAppStore } from '@/stores/useAppStore'
import { useNivStrategyV2 } from '@/hooks/useNivStrategyV2'

interface NIVContentAssistantV2Props {
  framework?: any
  onContentSave: (content: ContentItem) => void
  onWorkspaceOpen?: (content: ContentItem) => void
  initialContentType?: ContentType
  className?: string
}

interface Message {
  id: string
  role: 'user' | 'niv' | 'tool'
  content: string
  timestamp: Date
  structured?: any
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
  type?: 'create' | 'refine' | 'save' | 'edit' | 'research'
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

const DYNAMIC_GREETINGS = [
  "Hey there! I'm NIV, your content orchestrator. What's on your strategic agenda today?",
  "Welcome back! Ready to create something impactful? Tell me what you're working on.",
  "Hi! I'm here to help you craft strategic content. What's the mission?",
  "Good to see you! Let's turn your ideas into compelling content. What are we building?",
  "Hello! I'm NIV, ready to orchestrate your content strategy. What's the objective?"
]

const CONTENT_TYPE_RESPONSES: Record<ContentType, string[]> = {
  'press-release': [
    "Press release - excellent choice! What's the big announcement?",
    "Let's craft a newsworthy press release. What's the headline story?",
    "Time to make news! What are we announcing to the world?",
    "Press release mode activated. What's the breaking news?"
  ],
  'social-post': [
    "Social media content coming up! Which platforms are we targeting?",
    "Let's create something viral. What's the message you want to amplify?",
    "Social post mode! Are we going for engagement, awareness, or conversion?",
    "Time to connect with your audience. What's the story?"
  ],
  'exec-statement': [
    "Executive communication - let's make it powerful. Who's the executive and what's their message?",
    "Leadership voice activated. What's the strategic message from the top?",
    "Executive statement mode. What vision are we communicating?",
    "Let's craft words that lead. What's the executive perspective?"
  ],
  'crisis-response': [
    "Crisis management mode. Tell me about the situation and I'll help you respond appropriately.",
    "Let's handle this carefully. What's the crisis and who are the stakeholders?",
    "Crisis response activated. What's happened and what's our position?",
    "Time for strategic communication. Break down the situation for me."
  ],
  'email': [
    "Email campaign mode! Who's the audience and what's the call to action?",
    "Let's craft an email that converts. What's the goal?",
    "Email marketing activated. Tell me about your audience and objective.",
    "Time to reach inboxes effectively. What's the campaign about?"
  ],
  'qa-doc': [
    "Q&A document - let's anticipate everything. What's the topic?",
    "FAQ mode activated. What questions are your stakeholders asking?",
    "Let's build comprehensive Q&As. What's the subject matter?",
    "Time to address all concerns. What's the context?"
  ],
  'media-pitch': [
    "Media pitch mode! Which journalists or outlets are we targeting?",
    "Let's get you coverage. What's the angle that makes this newsworthy?",
    "Media outreach activated. What's the exclusive story?",
    "Time to pitch! What makes this irresistible to journalists?"
  ],
  'thought-leadership': [
    "Thought leadership piece - let's establish authority. What's your unique perspective?",
    "Time to share expertise. What industry insight are you bringing?",
    "Thought leadership mode. What trend or challenge are we addressing?",
    "Let's position you as an expert. What's the big idea?"
  ],
  'presentation': [
    "Presentation content coming up! What's the audience and objective?",
    "Deck mode activated. Is this for investors, customers, or internal?",
    "Let's build a compelling presentation. What's the story arc?",
    "Time to present! What's the key message you need to land?"
  ],
  'messaging': [
    "Messaging framework - let's align your narrative. What's the core story?",
    "Strategic messaging activated. What's the brand position?",
    "Let's craft your messaging pillars. What are the key themes?",
    "Messaging architecture mode. What's the value proposition?"
  ]
}

export default function NIVContentAssistantV2({
  framework,
  onContentSave,
  onWorkspaceOpen,
  initialContentType,
  className = ''
}: NIVContentAssistantV2Props) {
  const { organization, intelligenceData, opportunities } = useAppStore()
  const { saveStrategy, currentStrategy } = useNivStrategyV2()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [currentDraft, setCurrentDraft] = useState<ContentItem | null>(null)
  const [conversationContext, setConversationContext] = useState<any>({})
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Initialize with dynamic welcome
    const greeting = DYNAMIC_GREETINGS[Math.floor(Math.random() * DYNAMIC_GREETINGS.length)]
    const welcomeMessage: Message = {
      id: 'welcome',
      role: 'niv',
      content: greeting + (framework ? `\n\nI see you have an active framework: "${framework.strategy?.objective?.substring(0, 60)}..." - should we create content from this?` : ''),
      timestamp: new Date(),
      suggestions: getContextualSuggestions()
    }
    setMessages([welcomeMessage])

    // Handle initial content type if provided
    if (initialContentType) {
      setTimeout(() => handleContentTypeSelect(initialContentType), 500)
    }
  }, [framework, initialContentType])

  useEffect(() => {
    // Only scroll if we're near the bottom already (within 100px)
    const container = messagesEndRef.current?.parentElement
    if (container) {
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100
      if (isNearBottom) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }
    }
  }, [messages, isTyping])

  const getContextualSuggestions = (): Suggestion[] => {
    const suggestions: Suggestion[] = []

    // Add framework-based suggestions if available
    if (framework?.strategy?.content_needs?.priority_content?.length > 0) {
      suggestions.push({
        label: `Create: ${framework.strategy.content_needs.priority_content[0].substring(0, 40)}...`,
        action: () => handleFrameworkContent(0),
        icon: Target,
        type: 'create'
      })
    }

    // Add research suggestion if intelligence is available
    if (intelligenceData?.synthesis) {
      suggestions.push({
        label: 'Create content from latest intelligence',
        action: () => createFromIntelligence(),
        icon: Brain,
        type: 'research'
      })
    }

    // Add opportunity-based suggestion
    if (opportunities && opportunities.length > 0) {
      suggestions.push({
        label: `Address opportunity: ${opportunities[0].title?.substring(0, 30)}...`,
        action: () => createFromOpportunity(opportunities[0]),
        icon: TrendingUp,
        type: 'create'
      })
    }

    // Add quick create options
    suggestions.push(
      {
        label: 'Write a press release',
        action: () => handleContentTypeSelect('press-release'),
        icon: Megaphone,
        type: 'create'
      },
      {
        label: 'Create social media posts',
        action: () => handleContentTypeSelect('social-post'),
        icon: Hash,
        type: 'create'
      }
    )

    return suggestions
  }

  const handleContentTypeSelect = (type: ContentType) => {
    const responses = CONTENT_TYPE_RESPONSES[type]
    const response = responses[Math.floor(Math.random() * responses.length)]

    const message: Message = {
      id: `msg-${Date.now()}`,
      role: 'niv',
      content: response,
      timestamp: new Date(),
      contentType: type,
      suggestions: [
        {
          label: framework ? 'Use framework context' : 'Use current intelligence',
          action: () => generateWithContext(type),
          icon: Brain,
          type: 'create'
        },
        {
          label: 'Research first',
          action: () => researchThenCreate(type),
          icon: Search,
          type: 'research'
        }
      ]
    }

    setMessages(prev => [...prev, message])
    setConversationContext({ contentType: type })
  }

  const handleFrameworkContent = (index: number = 0) => {
    if (!framework?.strategy?.content_needs?.priority_content) return

    const content = framework.strategy.content_needs.priority_content[index]
    const contentType = detectContentType(content)

    addNivMessage(
      `Perfect! Let me create "${content}" for you. I'll use the framework context and current intelligence to make this impactful.`
    )

    generateContent(contentType, content, true)
  }

  const createFromIntelligence = () => {
    addNivMessage(
      "I'll analyze the latest intelligence and suggest content that addresses current opportunities. One moment..."
    )

    setTimeout(() => {
      const suggestions = [
        'Press release on market leadership based on competitive analysis',
        'Social campaign highlighting our differentiators',
        'Executive statement on industry trends'
      ]

      addNivMessage(
        `Based on current intelligence, here are high-impact content opportunities:`,
        suggestions.map((s, i) => ({
          label: s,
          action: () => generateContent(detectContentType(s), s, true),
          icon: Sparkles,
          type: 'create'
        }))
      )
    }, 1000)
  }

  const createFromOpportunity = (opportunity: any) => {
    const contentType = opportunity.risk_level === 'critical' ? 'crisis-response' : 'press-release'

    addNivMessage(
      `This opportunity requires ${opportunity.risk_level === 'critical' ? 'immediate crisis response' : 'strategic communication'}. Let me craft the right content.`
    )

    generateContent(contentType, `Address opportunity: ${opportunity.title}`, true)
  }

  const generateWithContext = (type: ContentType) => {
    const context = framework ? `Using framework: ${framework.strategy?.objective}` : 'Using current market intelligence'
    generateContent(type, context, true)
  }

  const researchThenCreate = async (type: ContentType) => {
    setIsTyping(true)

    addToolMessage('Researching with Fireplexity...', 'calling')

    // Call NIV orchestrator for research
    try {
      const response = await fetch('/api/supabase/functions/niv-orchestrator-robust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Research for ${type}: ${input || conversationContext.topic}`,
          sessionId: 'content-session',
          stage: 'full',
          context: {
            organization: organization?.name,
            contentType: type
          }
        })
      })

      if (response.ok) {
        const data = await response.json()

        updateToolMessage('Research complete', 'success')

        addNivMessage(
          `Great research insights! Here's what I found:\n\n${data.message?.substring(0, 300)}...\n\nNow let me create your ${type} with this intelligence.`
        )

        generateContent(type, data.message, true)
      }
    } catch (error) {
      updateToolMessage('Research failed', 'error')
    } finally {
      setIsTyping(false)
    }
  }

  const detectContentType = (text: string): ContentType => {
    const lower = text.toLowerCase()
    for (const [type, icon] of Object.entries(CONTENT_TYPE_ICONS)) {
      if (lower.includes(type.replace('-', ' '))) return type as ContentType
    }
    return 'messaging'
  }

  const generateContent = async (type: ContentType, prompt: string, useFullNiv: boolean = false) => {
    setIsTyping(true)

    // Always go straight to content generation, don't get guides
    addToolMessage(`Generating ${type}...`, 'calling')

    try {
      // Direct MCP content generation with clear instructions
      const request: ContentGenerationRequest = {
        type,
        context: {
          framework: framework?.framework_data || framework?.strategy,
          organization,
          intelligence: intelligenceData?.synthesis
        },
        options: {
          tone: 'professional',
          includeData: true,
          generateVariations: false
        },
        // Be very explicit about wanting actual content, not a guide
        prompt: `${prompt}. Generate the actual ${type} content, not a guide or instructions about how to write it.`


          const response = await ContentGenerationService.generateContent(request)

          if (response.success && response.content) {
            updateToolMessage('Content generated successfully', 'success')

            const contentItem: ContentItem = {
              id: `content-${Date.now()}`,
              title: `${type} - ${new Date().toLocaleDateString()}`,
              type,
              content: response.content,
              status: 'draft',
              priority: 'high',
              frameworkId: framework?.id,
              versions: response.variations,
              metadata: {
                createdAt: new Date(),
                updatedAt: new Date(),
                nivEnhanced: true,
                ...response.metadata
              }
            }

            setCurrentDraft(contentItem)

            // Add content with NIV's strategic framing
            addNivMessage(
              `${nivData.message ? nivData.message.substring(0, 200) + '...\n\n' : ''}Here's your ${type}:`,
              [
                {
                  label: 'Save to Memory Vault',
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
                  label: 'Create variations',
                  action: () => createVariations(contentItem),
                  icon: Wand2,
                  type: 'refine'
                }
              ]
            )

            // Add the actual content in a separate message
            setMessages(prev => [...prev, {
              id: `content-${Date.now()}`,
              role: 'niv',
              content: response.content,
              timestamp: new Date(),
              generatedContent: contentItem,
              contentType: type
            }])
          }
        }
      } catch (error) {
        updateToolMessage('Generation failed', 'error')
        addNivMessage("I encountered an issue. Let me try a different approach...")

        // Fallback to direct MCP generation
        generateContent(type, prompt, false)
      }
    } else {
      // Direct MCP content generation (fallback)
      addToolMessage(`MCP: Generating ${type}`, 'calling')

      const request: ContentGenerationRequest = {
        type,
        context: { framework, organization },
        options: { tone: 'professional', includeData: true },
        prompt
      }

      const response = await ContentGenerationService.generateContent(request)

      if (response.success && response.content) {
        updateToolMessage('Content ready', 'success')

        const contentItem: ContentItem = {
          id: `content-${Date.now()}`,
          title: `${type} - ${new Date().toLocaleDateString()}`,
          type,
          content: response.content,
          status: 'draft',
          priority: 'high',
          frameworkId: framework?.id,
          metadata: { createdAt: new Date(), updatedAt: new Date() }
        }

        setCurrentDraft(contentItem)

        addNivMessage(
          `Your ${type} is ready:`,
          [
            { label: 'Save', action: () => saveContent(contentItem), icon: Save, type: 'save' },
            { label: 'Edit', action: () => openInWorkspace(contentItem), icon: Edit3, type: 'edit' }
          ]
        )

        setMessages(prev => [...prev, {
          id: `content-${Date.now()}`,
          role: 'niv',
          content: response.content,
          timestamp: new Date(),
          generatedContent: contentItem,
          contentType: type
        }])
      }
    }

    setIsTyping(false)
  }

  const createVariations = async (content: ContentItem) => {
    setIsTyping(true)
    addNivMessage("Creating audience-specific variations...")

    const audiences: AudienceType[] = ['investors', 'customers', 'media']
    const variations = await ContentGenerationService.generateAudienceVersions(
      content.content,
      audiences,
      { framework, organization }
    )

    const updatedContent = { ...content, versions: variations }
    setCurrentDraft(updatedContent)

    addNivMessage(
      `I've created ${variations.length} audience variations. Each is optimized for different stakeholders.`,
      [
        { label: 'Save all versions', action: () => saveContent(updatedContent), icon: Save, type: 'save' },
        { label: 'Review in workspace', action: () => openInWorkspace(updatedContent), icon: Edit3, type: 'edit' }
      ]
    )

    setIsTyping(false)
  }

  const saveContent = async (content: ContentItem) => {
    const saved = await ContentGenerationService.saveToMemoryVault(content)
    if (saved) {
      onContentSave(content)
      addNivMessage(
        "Content saved to Memory Vault! Want to create something else?",
        getContextualSuggestions()
      )
    }
  }

  const openInWorkspace = (content: ContentItem) => {
    if (onWorkspaceOpen) {
      onWorkspaceOpen(content)
      addNivMessage("Content opened in workspace. I'm here if you need help with anything else.")
    }
  }

  const handleSend = async () => {
    if (!input.trim() || isTyping) return

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    const userInput = input
    setInput('')
    setIsTyping(true)

    // Use NIV's full orchestration for natural language processing
    try {
      // For content creation, be more direct
      const isDirectContentRequest = userInput.toLowerCase().includes('write') ||
                                     userInput.toLowerCase().includes('create') ||
                                     userInput.toLowerCase().includes('draft') ||
                                     userInput.toLowerCase().includes('generate')

      if (isDirectContentRequest) {
        // Skip NIV orchestration and go straight to content generation
        const detectedType = detectContentType(userInput)
        generateContent(detectedType, userInput, false)
        return
      }

      // For conversational queries, use NIV
      const response = await fetch('/api/supabase/functions/niv-orchestrator-robust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userInput,
          sessionId: 'content-session',
          stage: 'full',
          conversationHistory: messages.slice(-5).map(m => ({
            role: m.role,
            content: m.content
          })),
          context: {
            organization: organization?.name,
            activeModule: 'execute',
            contentCreation: true,
            framework: framework?.strategy,
            intelligence: intelligenceData?.synthesis
          }
        })
      })

      if (response.ok) {
        const data = await response.json()

        // Detect if NIV identified a content type to create
        const detectedType = detectContentType(userInput)

        if (detectedType !== 'messaging' || userInput.toLowerCase().includes('create') || userInput.toLowerCase().includes('write')) {
          // User wants to create content
          addNivMessage(data.message?.substring(0, 300) || "I understand. Let me help you create that.")
          generateContent(detectedType, userInput, true)
        } else {
          // General conversation or question
          addNivMessage(
            data.message,
            data.readyForHandoff ? getContextualSuggestions() : undefined
          )
        }
      }
    } catch (error) {
      console.error('NIV error:', error)
      addNivMessage(
        "I'm having trouble connecting to my full capabilities, but I can still help you create content. What would you like to make?"
      )
    } finally {
      setIsTyping(false)
    }
  }

  const addNivMessage = (content: string, suggestions?: Suggestion[]) => {
    const message: Message = {
      id: `msg-${Date.now()}`,
      role: 'niv',
      content,
      timestamp: new Date(),
      suggestions
    }
    setMessages(prev => [...prev, message])
  }

  const addToolMessage = (content: string, status: 'calling' | 'success' | 'error') => {
    const message: Message = {
      id: `tool-${Date.now()}`,
      role: 'tool',
      content,
      timestamp: new Date(),
      toolCall: { name: content, status }
    }
    setMessages(prev => [...prev, message])
  }

  const updateToolMessage = (content: string, status: 'success' | 'error') => {
    setMessages(prev => prev.map(msg => {
      if (msg.role === 'tool' && msg.toolCall?.status === 'calling') {
        return { ...msg, content, toolCall: { ...msg.toolCall, status } }
      }
      return msg
    }))
  }

  return (
    <div
      className={`niv-content-assistant-v2 flex flex-col h-full bg-gray-900 ${className}`}
      onKeyDown={(e) => e.stopPropagation()}
      onKeyUp={(e) => e.stopPropagation()}>
      {/* Header */}
      <div className="p-4 border-b border-gray-700 bg-gradient-to-r from-purple-900/20 to-blue-900/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg animate-pulse">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-medium">NIV Content Orchestrator</h3>
              <p className="text-xs text-gray-400">
                {framework ? 'Framework Active' : 'Strategic Content Creation'}
                {intelligenceData && ' • Intelligence Available'}
              </p>
            </div>
          </div>
          {framework && (
            <div className="flex items-center gap-2 px-3 py-1 bg-purple-900/30 rounded-full">
              <Target className="w-3 h-3 text-purple-400" />
              <span className="text-xs text-purple-400">
                {framework.strategy?.objective?.substring(0, 30)}...
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(message => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-3xl ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
              {/* Tool messages */}
              {message.role === 'tool' && (
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
                        <span className="text-sm text-green-400">{message.content}</span>
                      </>
                    )}
                    {message.toolCall?.status === 'error' && (
                      <>
                        <AlertTriangle className="w-4 h-4 text-red-400" />
                        <span className="text-sm text-red-400">{message.content}</span>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Regular messages */}
              {message.role !== 'tool' && (
                <div
                  className={`p-4 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-purple-600/20 border border-purple-600/30'
                      : message.generatedContent
                      ? 'bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-600/30'
                      : 'bg-gray-800'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {message.role === 'niv' && (
                      <div className="p-1.5 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg">
                        <Sparkles className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                    {message.generatedContent && (
                      <button
                        onClick={() => navigator.clipboard.writeText(message.content)}
                        className="p-1.5 hover:bg-gray-700 rounded transition-colors"
                      >
                        <Copy className="w-4 h-4 text-gray-400" />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Suggestions */}
              {message.suggestions && message.suggestions.length > 0 && (
                <div className="mt-3 grid grid-cols-1 gap-2">
                  {message.suggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={suggestion.action}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-left ${
                        suggestion.type === 'save'
                          ? 'bg-green-900/20 hover:bg-green-900/30 border border-green-600/30'
                          : suggestion.type === 'edit'
                          ? 'bg-blue-900/20 hover:bg-blue-900/30 border border-blue-600/30'
                          : suggestion.type === 'research'
                          ? 'bg-purple-900/20 hover:bg-purple-900/30 border border-purple-600/30'
                          : 'bg-gray-800 hover:bg-gray-700 border border-gray-600'
                      }`}
                    >
                      {suggestion.icon && React.createElement(suggestion.icon, {
                        className: `w-4 h-4 ${
                          suggestion.type === 'save' ? 'text-green-400' :
                          suggestion.type === 'edit' ? 'text-blue-400' :
                          suggestion.type === 'research' ? 'text-purple-400' :
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

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-800 p-4 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
                <span className="text-sm text-gray-400">NIV is orchestrating...</span>
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
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                // Stop ALL key events from propagating to canvas
                e.stopPropagation()

                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              placeholder="Tell NIV what you want to create..."
              className="w-full px-4 py-3 bg-gray-700 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              rows={2}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className={`p-3 rounded-lg transition-all ${
              !input.trim() || isTyping
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white animate-pulse'
            }`}
          >
            {isTyping ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}