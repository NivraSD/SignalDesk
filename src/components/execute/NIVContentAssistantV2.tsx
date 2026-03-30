'use client'

import React, { useState, useRef, useEffect } from 'react'
import {
  Send,
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
  Zap
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
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const messageCounterRef = useRef(0)

  // Generate unique message IDs
  const generateMessageId = (prefix: string = 'msg') => {
    messageCounterRef.current += 1
    return `${prefix}-${Date.now()}-${messageCounterRef.current}`
  }

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
    // Smart scrolling - only if user is near bottom
    const container = chatContainerRef.current
    if (container) {
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150
      if (isNearBottom) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
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
      id: generateMessageId('msg'),
      role: 'niv',
      content: response,
      timestamp: new Date(),
      contentType: type,
      suggestions: [
        {
          label: 'Quick generate',
          action: () => quickGenerate(type),
          icon: Zap,
          type: 'create'
        }
      ]
    }

    setMessages(prev => [...prev, message])
    setConversationContext({ contentType: type })
  }

  const handleFrameworkContent = async (index: number = 0) => {
    if (!framework?.strategy?.content_needs?.priority_content) return

    const content = framework.strategy.content_needs.priority_content[index]
    const contentType = detectContentType(content)

    addNivMessage(
      `I'll create "${content}" for you right now.`
    )

    await generateContent(contentType, content)
  }

  const quickGenerate = async (type: ContentType) => {
    const basicPrompt = `Generate a ${CONTENT_TYPE_LABELS[type]} for ${organization?.name || 'our organization'}`
    await generateContent(type, basicPrompt)
  }

  const detectContentType = (text: string): ContentType => {
    const lower = text.toLowerCase()

    // Check for birthday/celebration posts -> social
    if (lower.includes('birthday') || lower.includes('anniversary') || lower.includes('celebration')) {
      return 'social-post'
    }

    for (const [type, icon] of Object.entries(CONTENT_TYPE_ICONS)) {
      if (lower.includes(type.replace('-', ' '))) return type as ContentType
    }
    return 'social-post' // Default to social for casual requests
  }

  const generateContent = async (type: ContentType, prompt: string) => {
    setIsTyping(true)
    addToolMessage(`Creating ${CONTENT_TYPE_LABELS[type]}...`, 'calling')

    try {
      // Get discovery context if available
      const discoveryContext = intelligenceData?.discovery || {}
      const currentDate = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })

      // Direct content generation - no guides!
      const request: ContentGenerationRequest = {
        type,
        context: {
          framework: framework?.framework_data || framework?.strategy,
          organization: organization || { name: 'OpenAI', industry: 'technology' },
          discovery: discoveryContext,
          currentDate: currentDate,
          intelligence: intelligenceData
        },
        options: {
          tone: prompt.toLowerCase().includes('happy') || prompt.toLowerCase().includes('celebration') ? 'casual' : 'professional',
          includeData: false
        },
        // Very explicit prompt to get actual content with date context
        prompt: `Today is ${currentDate}. Create the actual ${CONTENT_TYPE_LABELS[type]} for ${organization?.name || 'OpenAI'} with this requirement: ${prompt}. ${discoveryContext.keywords ? `Context: ${organization?.name || 'OpenAI'} is known for ${discoveryContext.keywords.join(', ')}.` : ''} Write the complete content, not instructions or guides.`
      }

      const response = await ContentGenerationService.generateContent(request)

      if (response.success && response.content) {
        updateToolMessage('Done!', 'success')

        const contentItem: ContentItem = {
          id: generateMessageId('content'),
          title: prompt.substring(0, 50) + '...',
          type,
          content: response.content,
          status: 'draft',
          priority: 'high',
          frameworkId: framework?.id,
          metadata: {
            createdAt: new Date(),
            updatedAt: new Date()
          }
        }

        setCurrentDraft(contentItem)

        // Simple response
        addNivMessage(
          `Here's your ${CONTENT_TYPE_LABELS[type]}:`,
          [
            {
              label: 'Save to Library',
              action: () => saveContent(contentItem),
              icon: Save,
              type: 'save'
            },
            {
              label: 'Edit in Workspace',
              action: () => openInWorkspace(contentItem),
              icon: Edit3,
              type: 'edit'
            },
            {
              label: 'Create another version',
              action: () => generateContent(type, prompt),
              icon: Wand2,
              type: 'create'
            }
          ]
        )

        // Show the actual content
        setMessages(prev => [...prev, {
          id: generateMessageId('content'),
          role: 'niv',
          content: response.content,
          timestamp: new Date(),
          generatedContent: contentItem,
          contentType: type
        }])
      } else {
        updateToolMessage('Failed', 'error')
        addNivMessage("I had trouble generating that. Can you be more specific about what you need?")
      }
    } catch (error) {
      updateToolMessage('Error', 'error')
      addNivMessage("Something went wrong. Please try again.")
    } finally {
      setIsTyping(false)
    }
  }

  const saveContent = async (content: ContentItem) => {
    const saved = await ContentGenerationService.saveToMemoryVault(content)
    if (saved) {
      onContentSave(content)
      addNivMessage(
        "Saved! What else would you like to create?",
        getContextualSuggestions()
      )
    }
  }

  const openInWorkspace = (content: ContentItem) => {
    if (onWorkspaceOpen) {
      onWorkspaceOpen(content)
      addNivMessage("Opened in workspace for editing.")
    }
  }

  const handleSend = async () => {
    if (!input.trim() || isTyping) return

    const userMessage: Message = {
      id: generateMessageId('msg'),
      role: 'user',
      content: input,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    const userInput = input
    setInput('')

    // Direct content creation for common requests
    const lower = userInput.toLowerCase()

    // Check if user is requesting content creation
    if (conversationContext.contentType ||
        lower.includes('write') || lower.includes('create') || lower.includes('draft') ||
        lower.includes('generate') || lower.includes('make') || lower.includes('birthday') ||
        lower.includes('announcement') || lower.includes('post')) {

      // Use the selected type or detect from input
      const typeToUse = conversationContext.contentType || detectContentType(userInput)

      // Check if we need to gather specific information
      if (conversationContext.needsMoreInfo && conversationContext.contentType === typeToUse) {
        // User is providing the info we asked for - generate content now
        await generateContent(typeToUse, userInput)
        setConversationContext({ ...conversationContext, needsMoreInfo: false })
      } else if (typeToUse === 'press-release') {
        // For press releases, always gather key details
        if (userInput.includes('launch') || userInput.includes('product')) {
          addNivMessage(
            `Great! A product launch press release for ${organization?.name || 'OpenAI'}. To make this compelling, I need a few details:\n\n` +
            `• What's the product name?\n` +
            `• Key features or capabilities?\n` +
            `• When is it launching/available?\n` +
            `• Who's the target audience?\n` +
            `• Any pricing or availability details?\n\n` +
            `Just give me the key points and I'll craft a professional press release.`,
            []
          )
          setConversationContext({ ...conversationContext, contentType: typeToUse, needsMoreInfo: true })
        } else if (userInput.includes('partnership') || userInput.includes('partner')) {
          addNivMessage(
            `A partnership announcement - excellent! To create an impactful press release, tell me:\n\n` +
            `• Who's the partner company?\n` +
            `• What's the nature of the partnership?\n` +
            `• What value does it bring to customers?\n` +
            `• Any specific goals or milestones?\n\n` +
            `Share what you can and I'll create the press release.`,
            []
          )
          setConversationContext({ ...conversationContext, contentType: typeToUse, needsMoreInfo: true })
        } else if (userInput.includes('funding') || userInput.includes('investment')) {
          addNivMessage(
            `Funding announcement - congratulations! For the press release, I'll need:\n\n` +
            `• Amount raised?\n` +
            `• Lead investors?\n` +
            `• What will the funds be used for?\n` +
            `• Current valuation (if sharing)?\n\n` +
            `Provide what details you're ready to announce.`,
            []
          )
          setConversationContext({ ...conversationContext, contentType: typeToUse, needsMoreInfo: true })
        } else if (!conversationContext.hasAskedDetails) {
          // Generic press release - still ask for details
          addNivMessage(
            `I'll help you create a press release for ${organization?.name || 'OpenAI'}. To make it newsworthy, tell me:\n\n` +
            `• What's the main announcement?\n` +
            `• Why is this significant now?\n` +
            `• Who does it impact?\n` +
            `• Any key quotes or data points?\n\n` +
            `Share the details and I'll craft your press release.`,
            []
          )
          setConversationContext({ ...conversationContext, contentType: typeToUse, needsMoreInfo: true, hasAskedDetails: true })
        } else {
          // We've asked for details, now generate with what we have
          await generateContent(typeToUse, userInput)
        }
      } else if (typeToUse === 'crisis-response' && !conversationContext.hasCrisisContext) {
        addNivMessage(
          `I understand this is urgent. Can you briefly describe the situation so I can craft an appropriate response?`,
          []
        )
        setConversationContext({ ...conversationContext, contentType: typeToUse, needsMoreInfo: true })
      } else {
        // For other content types, generate directly
        await generateContent(typeToUse, userInput)
      }
    } else {
      // For questions or unclear requests - be conversational
      addNivMessage(
        "I can help you create content! What type would you like? Just describe what you need.",
        getContextualSuggestions()
      )
    }
  }

  const addNivMessage = (content: string, suggestions?: Suggestion[]) => {
    const message: Message = {
      id: generateMessageId('msg'),
      role: 'niv',
      content,
      timestamp: new Date(),
      suggestions
    }
    setMessages(prev => [...prev, message])
  }

  const addToolMessage = (content: string, status: 'calling' | 'success' | 'error') => {
    const message: Message = {
      id: generateMessageId('tool'),
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
      <div className="p-4 border-b border-gray-700" style={{ background: 'var(--charcoal)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg width="45" height="45" viewBox="0 0 45 45">
              <rect width="45" height="45" rx="10" fill="#faf9f7" />
              <text
                x="6"
                y="31"
                fontFamily="Space Grotesk, sans-serif"
                fontWeight="700"
                fontSize="22"
                fill="#1a1a1a"
              >
                NIV
              </text>
              <polygon points="35,0 45,0 45,10" fill="#c75d3a" />
            </svg>
            <div>
              <h3 className="text-lg font-medium" style={{ color: 'var(--white)' }}>NIV Content Orchestrator</h3>
              <p className="text-xs" style={{ color: 'var(--grey-500)' }}>
                Tell me what to create - I'll handle the rest
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
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
                  style={{
                    padding: '12px 16px',
                    borderRadius: '12px',
                    background: message.role === 'user' ? 'var(--burnt-orange)' : 'var(--grey-800)',
                    color: 'var(--white)',
                    fontSize: '0.875rem',
                    lineHeight: '1.5'
                  }}
                >
                  <div className="flex items-start gap-3">
                    {message.role === 'niv' && (
                      <svg width="32" height="32" viewBox="0 0 32 32" style={{ flexShrink: 0 }}>
                        <rect width="32" height="32" rx="7" fill="#faf9f7" />
                        <text
                          x="4"
                          y="22"
                          fontFamily="Space Grotesk, sans-serif"
                          fontWeight="700"
                          fontSize="16"
                          fill="#1a1a1a"
                        >
                          NIV
                        </text>
                        <polygon points="25,0 32,0 32,7" fill="#c75d3a" />
                      </svg>
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

        {isTyping && (
          <div className="flex justify-start">
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div className="relative" style={{ width: '32px', height: '32px', flexShrink: 0 }}>
                <svg width="32" height="32" viewBox="0 0 32 32" className="animate-pulse">
                  <rect width="32" height="32" rx="7" fill="#faf9f7" />
                  <polygon points="25,0 32,0 32,7" fill="#c75d3a" />
                </svg>
                <Loader2
                  className="w-4 h-4 animate-spin absolute"
                  style={{ color: '#1a1a1a', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
                />
              </div>
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background: 'var(--grey-800)',
                  color: 'var(--grey-400)',
                  fontSize: '0.875rem'
                }}
              >
                Thinking...
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div
        style={{
          padding: '16px',
          borderTop: '1px solid var(--grey-800)',
          display: 'flex',
          gap: '12px',
          background: 'var(--grey-900)',
          alignItems: 'flex-end'
        }}
      >
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
          placeholder="Tell me what to create..."
          rows={2}
          style={{
            flex: 1,
            background: 'var(--charcoal)',
            border: '1px solid var(--grey-800)',
            borderRadius: '10px',
            padding: '14px 16px',
            fontSize: '0.9rem',
            color: 'var(--white)',
            outline: 'none',
            resize: 'none',
            minHeight: '50px',
            maxHeight: '100px',
            lineHeight: '1.4'
          }}
        />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            style={{
              width: '50px',
              height: '50px',
              background: !input.trim() || isTyping ? 'var(--grey-700)' : 'var(--burnt-orange)',
              border: 'none',
              borderRadius: '10px',
              color: 'var(--white)',
              cursor: !input.trim() || isTyping ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: !input.trim() || isTyping ? 0.5 : 1,
              flexShrink: 0
            }}
          >
            {isTyping ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
      </div>
    </div>
  )
}