'use client'

import React, { useState, useRef, useEffect } from 'react'
import {
  Sparkles,
  Send,
  Loader2,
  Save,
  RefreshCw,
  FileText,
  Hash,
  Mail,
  Briefcase,
  AlertTriangle,
  Mic,
  BookOpen,
  MessageSquare,
  Image as ImageIcon,
  Video,
  Presentation
} from 'lucide-react'
import type { NivStrategicFramework } from '@/types/niv-strategic-framework'
import type { ContentItem } from '@/types/content'
import { useAppStore } from '@/stores/useAppStore'

// Content type configurations with LOCAL API endpoints (as per reconstruction plan)
const CONTENT_SERVICE_MAP = {
  'press-release': {
    label: 'Press Release',
    icon: FileText,
    service: '/api/content/press-release'
  },
  'social-post': {
    label: 'Social Post',
    icon: Hash,
    service: '/api/content/social-post'
  },
  'email': {
    label: 'Email Campaign',
    icon: Mail,
    service: '/api/content/email-campaign'
  },
  'exec-statement': {
    label: 'Executive Statement',
    icon: Briefcase,
    service: '/api/content/executive-statement'
  },
  'crisis-response': {
    label: 'Crisis Response',
    icon: AlertTriangle,
    service: '/api/content/crisis-response'
  },
  'media-pitch': {
    label: 'Media Pitch',
    icon: Mic,
    service: '/api/content/media-pitch'
  },
  'thought-leadership': {
    label: 'Thought Leadership',
    icon: BookOpen,
    service: '/api/content/thought-leadership'
  },
  'qa-doc': {
    label: 'Q&A Document',
    icon: FileText,
    service: '/api/content/qa-document'
  },
  'messaging': {
    label: 'Messaging Framework',
    icon: MessageSquare,
    service: '/api/content/messaging-framework'
  },
  'image': {
    label: 'Image',
    icon: ImageIcon,
    service: '/api/visual/image'
  },
  'video': {
    label: 'Video',
    icon: Video,
    service: '/api/visual/video'
  },
  'presentation': {
    label: 'Presentation',
    icon: Presentation,
    service: '/api/visual/presentation'
  }
}

interface NIVContentOrchestratorProps {
  framework?: NivStrategicFramework
  selectedContentType?: string
  onContentGenerated?: (content: ContentItem) => void
  onContentSave?: (content: ContentItem) => void
  className?: string
}

export default function NIVContentOrchestrator({
  framework,
  selectedContentType,
  onContentGenerated,
  onContentSave,
  className = ''
}: NIVContentOrchestratorProps) {
  const { organization } = useAppStore()
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const [, setCurrentContent] = useState<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Content type acknowledgment
  useEffect(() => {
    if (selectedContentType) {
      const config = CONTENT_SERVICE_MAP[selectedContentType as keyof typeof CONTENT_SERVICE_MAP]
      if (config) {
        const acknowledgments: Record<string, string> = {
          'press-release': "I'll help you create a press release. What's the announcement?",
          'social-post': "Perfect! I'll create social posts. What's the message?",
          'image': "I'll create an image using Google Imagen. Describe what you need.",
          'video': "I'll generate a video using Google Veo. What's the concept?",
          'presentation': "I'll create a presentation using Gamma. What's the topic?",
          'email': "I'll create an email campaign. What's the purpose?",
          'crisis-response': "I understand the urgency. Let's craft a crisis response. What's the situation?",
          'exec-statement': "I'll draft an executive statement. What's the occasion?",
          'media-pitch': "I'll create a media pitch. What's your story?",
          'thought-leadership': "I'll help craft thought leadership content. What's your perspective?",
          'qa-doc': "I'll prepare a Q&A document. What topics should we address?",
          'messaging': "I'll develop a messaging framework. What's the narrative?"
        }

        const welcomeMessage = {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: acknowledgments[selectedContentType] || `I'll help you create ${config.label}. What do you need?`,
          timestamp: new Date()
        }

        setMessages([welcomeMessage])
      }
    }
  }, [selectedContentType])

  // Scroll to bottom
  useEffect(() => {
    // Scroll within chat container only, not the entire page
    const chatContainer = messagesEndRef.current?.parentElement
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight
    }
  }, [messages])

  // Handle message send
  const handleSend = async () => {
    if (!input.trim() || isThinking) return

    const userMessage = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setIsThinking(true)

    try {
      // Check if user is asking for content generation
      const isGenerationRequest = userMessage.toLowerCase().includes('create') ||
                                  userMessage.toLowerCase().includes('make') ||
                                  userMessage.toLowerCase().includes('generate') ||
                                  userMessage.toLowerCase().includes('write')

      if (isGenerationRequest && selectedContentType) {
        // Generate content using the new API endpoints
        await generateContent(selectedContentType, userMessage)
      } else {
        // Check if research is needed
        const needsResearch = userMessage.toLowerCase().includes('research') ||
                             userMessage.toLowerCase().includes('find') ||
                             userMessage.toLowerCase().includes('search') ||
                             userMessage.toLowerCase().includes('competitor')

        if (needsResearch) {
          await performResearch(userMessage)
        }

        // Normal conversation with Claude
        const response = await fetch('/api/claude-direct', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{ role: 'user', content: userMessage }],
            system: `You are NIV, the Content Orchestrator for ${organization?.name || 'OpenAI'}.

IDENTITY: You are a senior content strategist with expertise in PR, marketing, and strategic communications.

CURRENT CONTEXT:
- Selected Content Type: ${selectedContentType || 'None selected'}
- Organization: ${organization?.name || 'OpenAI'}
${framework ? `- Strategic Framework: ${framework.strategy?.objective}` : ''}

GUIDELINES:
- Provide strategic guidance on messaging and content approach
- Ask clarifying questions to understand their content needs
- When they ask to CREATE/MAKE/GENERATE/WRITE something, respond positively that you'll generate it
- Be conversational and helpful about content strategy`,
            max_tokens: 800,
            temperature: 0.7
          })
        })

        if (response.ok) {
          const data = await response.json()
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: data.content || "I'm here to help with content strategy. What would you like to create?",
            timestamp: new Date()
          }])
        }
      }
    } catch (error) {
      console.error('Error:', error)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'I encountered an error. Please try again.',
        timestamp: new Date(),
        error: true
      }])
    } finally {
      setIsThinking(false)
    }
  }

  // Generate content using the new LOCAL API endpoints
  const generateContent = async (contentType: string, prompt: string) => {
    const config = CONTENT_SERVICE_MAP[contentType as keyof typeof CONTENT_SERVICE_MAP]
    if (!config) return

    setIsThinking(true)

    try {
      const requestBody = {
        prompt: prompt,
        organization: organization?.name || 'OpenAI',
        organizationId: organization?.id,
        framework: framework
      }

      console.log(`Calling API endpoint: ${config.service}`)

      const response = await fetch(config.service, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })

      if (response.ok) {
        const result = await response.json()

        const contentItem: ContentItem = {
          id: `content-${Date.now()}`,
          type: contentType as any,
          title: `${config.label} - ${new Date().toLocaleDateString()}`,
          content: result.content || result,
          priority: 'normal' as any,
          metadata: {
            createdAt: new Date(),
            service: config.service,
            organization: organization?.name
          } as any,
          status: 'draft' as any
        }

        setCurrentContent(contentItem)

        const contentMessage = {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: `✅ Created your ${config.label}!`,
          contentItem: contentItem,
          timestamp: new Date(),
          showActions: true
        }

        setMessages(prev => [...prev, contentMessage])

        if (onContentGenerated) {
          onContentGenerated(contentItem)
        }
      } else {
        throw new Error(`Service returned ${response.status}`)
      }
    } catch (error) {
      console.error('Generation error:', error)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `❌ Failed to generate content: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        error: true
      }])
    } finally {
      setIsThinking(false)
    }
  }

  // Perform research using intelligence endpoint
  const performResearch = async (query: string) => {
    try {
      const response = await fetch('/api/intelligence/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          organization: organization?.name || 'OpenAI',
          organizationId: organization?.id
        })
      })

      if (response.ok) {
        const data = await response.json()

        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `📚 Research findings:\n\n${data.findings.slice(0, 3).map((f: any) =>
            `• ${f.title || f.summary}`).join('\n')}\n\nWould you like me to create content based on this research?`,
          timestamp: new Date(),
          researchData: data
        }])
      }
    } catch (error) {
      console.error('Research error:', error)
    }
  }

  // Handle save to Memory Vault using new endpoint
  const handleSave = async (content: ContentItem) => {
    try {
      const response = await fetch('/api/memory-vault/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: {
            type: content.type,
            title: content.title,
            content: content.content,
            organization_id: organization?.id,
            status: 'completed'
          },
          metadata: content.metadata
        })
      })

      if (response.ok) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: '✅ Content saved to Memory Vault successfully!',
          timestamp: new Date()
        }])

        if (onContentSave) {
          onContentSave(content)
        }
      } else {
        throw new Error(`Save failed: ${response.status}`)
      }
    } catch (error) {
      console.error('Save error:', error)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `❌ Failed to save: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        error: true
      }])
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className={`niv-content-orchestrator flex flex-col h-full ${className}`}>
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <Sparkles className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">NIV Content Orchestrator</h3>
            <p className="text-gray-400">
              I orchestrate content creation using all your services.
            </p>
            <p className="text-gray-500 mt-2 text-sm">
              Select a content type and tell me what to create.
            </p>
          </div>
        )}

        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-2xl ${msg.role === 'user' ? 'order-2' : 'order-1'}`}>
              <div className={`rounded-lg p-4 ${
                msg.role === 'user'
                  ? 'bg-blue-500/10 border border-blue-500/30'
                  : msg.error
                  ? 'bg-red-500/10 border border-red-500/30'
                  : 'bg-gray-800 border border-gray-700'
              }`}>
                {msg.role === 'assistant' && (
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm font-medium text-yellow-500">NIV</span>
                  </div>
                )}

                <div className="text-white whitespace-pre-wrap">{msg.content}</div>

                {/* Display generated content */}
                {msg.contentItem && (
                  <div className="mt-4 bg-gray-900 rounded-lg border border-gray-700">
                    {msg.contentItem.type === 'image' ? (
                      <div className="p-4">
                        <img
                          src={typeof msg.contentItem.content === 'string'
                            ? msg.contentItem.content
                            : msg.contentItem.content.imageUrl || msg.contentItem.content.url}
                          alt={msg.contentItem.title}
                          className="w-full h-auto rounded-lg max-h-96 object-contain"
                        />
                      </div>
                    ) : msg.contentItem.type === 'video' ? (
                      <div className="p-4">
                        <video
                          src={typeof msg.contentItem.content === 'string'
                            ? msg.contentItem.content
                            : msg.contentItem.content.videoUrl || msg.contentItem.content.url}
                          controls
                          className="w-full max-h-96 rounded-lg"
                        />
                      </div>
                    ) : msg.contentItem.type === 'presentation' ? (
                      <div className="p-4">
                        <a
                          href={typeof msg.contentItem.content === 'string'
                            ? msg.contentItem.content
                            : msg.contentItem.content.presentationUrl || msg.contentItem.content.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300"
                        >
                          📊 Open Presentation in Gamma
                        </a>
                      </div>
                    ) : (
                      <div className="p-4">
                        <div className="prose prose-invert max-w-none">
                          <pre className="whitespace-pre-wrap text-sm">
                            {typeof msg.contentItem.content === 'string'
                              ? msg.contentItem.content
                              : JSON.stringify(msg.contentItem.content, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}

                    {/* Action buttons */}
                    {msg.showActions && (
                      <div className="flex gap-2 p-3 bg-gray-800/50 border-t border-gray-700">
                        <button
                          onClick={() => handleSave(msg.contentItem)}
                          className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-sm font-medium rounded-md flex items-center gap-1.5"
                        >
                          <Save className="w-3.5 h-3.5" />
                          Save to Vault
                        </button>
                        <button
                          onClick={() => generateContent(selectedContentType!, `Regenerate: ${msg.contentItem.title}`)}
                          className="px-3 py-1.5 bg-gray-600 hover:bg-gray-500 text-white text-sm font-medium rounded-md flex items-center gap-1.5"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          Regenerate
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <div className="text-xs text-gray-500 mt-2">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>
        ))}

        {isThinking && (
          <div className="flex justify-start">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-yellow-500" />
                <span className="text-sm text-gray-400">NIV is working...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-800 p-4">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              selectedContentType
                ? `Tell me what ${CONTENT_SERVICE_MAP[selectedContentType as keyof typeof CONTENT_SERVICE_MAP]?.label.toLowerCase()} to create...`
                : "What content would you like to create?"
            }
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500/50 resize-none"
            rows={2}
            disabled={isThinking}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isThinking}
            className="px-6 py-3 bg-yellow-500 hover:bg-yellow-400 disabled:bg-gray-700 disabled:opacity-50 text-black rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            Send
          </button>
        </div>
      </div>
    </div>
  )
}