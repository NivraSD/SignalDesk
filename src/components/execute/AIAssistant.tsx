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
  Check
} from 'lucide-react'
import type { ContentType, ContentGenerationRequest } from '@/types/content'
import { ContentGenerationService } from '@/services/ContentGenerationService'
import { useAppStore } from '@/stores/useAppStore'

interface AIAssistantProps {
  framework?: any
  onContentGenerate: (type: ContentType, content: string) => void
}

interface Message {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
  suggestions?: Suggestion[]
  contentType?: ContentType
}

interface Suggestion {
  label: string
  query: string
  type?: ContentType
}

const INITIAL_SUGGESTIONS: Suggestion[] = [
  { label: 'Write a press release', query: 'Write a press release announcing our latest product launch', type: 'press-release' },
  { label: 'Create crisis response', query: 'Draft a crisis response statement for a data breach', type: 'crisis-response' },
  { label: 'Generate social posts', query: 'Create social media posts for our upcoming event', type: 'social-post' },
  { label: 'Executive statement', query: 'Write an executive statement about our Q3 results', type: 'exec-statement' }
]

const CONTENT_SUGGESTIONS: Record<string, Suggestion[]> = {
  'press': [
    { label: 'Product launch announcement', query: 'Write a press release for our new product launch' },
    { label: 'Partnership announcement', query: 'Draft a press release about our strategic partnership' },
    { label: 'Financial results', query: 'Create a press release for Q3 earnings' }
  ],
  'social': [
    { label: 'Twitter thread', query: 'Create a Twitter thread about our mission' },
    { label: 'LinkedIn post', query: 'Write a LinkedIn post about industry trends' },
    { label: 'Instagram caption', query: 'Generate Instagram captions for our product photos' }
  ],
  'exec': [
    { label: 'Vision statement', query: 'Write an executive vision statement' },
    { label: 'All-hands message', query: 'Draft an all-hands meeting message' },
    { label: 'Board update', query: 'Create an executive update for the board' }
  ],
  'crisis': [
    { label: 'Service outage', query: 'Write a response for service outage' },
    { label: 'Data incident', query: 'Draft a statement about a data incident' },
    { label: 'Product recall', query: 'Create a product recall announcement' }
  ]
}

export default function AIAssistant({ framework, onContentGenerate }: AIAssistantProps) {
  const { organization } = useAppStore()
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: `Hi! I'm your AI content assistant. I can help you create any type of content${
        framework ? ` based on your active framework: "${framework.strategy?.objective?.substring(0, 50)}..."` : ''
      }. What would you like to create today?`,
      timestamp: new Date(),
      suggestions: INITIAL_SUGGESTIONS
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const detectContentType = (query: string): ContentType | undefined => {
    const lowerQuery = query.toLowerCase()

    if (lowerQuery.includes('press release')) return 'press-release'
    if (lowerQuery.includes('crisis') || lowerQuery.includes('incident')) return 'crisis-response'
    if (lowerQuery.includes('social') || lowerQuery.includes('tweet') || lowerQuery.includes('linkedin')) return 'social-post'
    if (lowerQuery.includes('executive') || lowerQuery.includes('leadership')) return 'exec-statement'
    if (lowerQuery.includes('email') || lowerQuery.includes('campaign')) return 'email'
    if (lowerQuery.includes('q&a') || lowerQuery.includes('faq')) return 'qa-doc'
    if (lowerQuery.includes('pitch') || lowerQuery.includes('media')) return 'media-pitch'
    if (lowerQuery.includes('thought leadership') || lowerQuery.includes('article')) return 'thought-leadership'
    if (lowerQuery.includes('presentation') || lowerQuery.includes('deck')) return 'presentation'
    if (lowerQuery.includes('messaging') || lowerQuery.includes('framework')) return 'messaging'

    return undefined
  }

  const generateFollowUpSuggestions = (contentType?: ContentType): Suggestion[] => {
    if (!contentType) return INITIAL_SUGGESTIONS

    const categoryMap: Record<ContentType, string> = {
      'press-release': 'press',
      'social-post': 'social',
      'exec-statement': 'exec',
      'crisis-response': 'crisis',
      'media-pitch': 'press',
      'email': 'social',
      'qa-doc': 'exec',
      'thought-leadership': 'exec',
      'presentation': 'exec',
      'messaging': 'exec'
    }

    const category = categoryMap[contentType]
    return CONTENT_SUGGESTIONS[category] || INITIAL_SUGGESTIONS
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
    setInputValue('')
    setIsProcessing(true)

    // Detect content type
    const detectedType = detectContentType(inputValue) || 'press-release'

    try {
      // Use real content generation service
      const request: ContentGenerationRequest = {
        type: detectedType,
        context: {
          framework: framework?.framework_data || framework?.strategy || framework,
          organization,
          intelligence: framework?.intelligence
        },
        options: {
          tone: 'professional',
          includeData: true
        },
        prompt: inputValue
      }

      const response = await ContentGenerationService.generateContent(request)

      let generatedContent = ''
      if (response.success && response.content) {
        generatedContent = response.content
      } else {
        generatedContent = 'I encountered an error generating content. Please try again or try rephrasing your request.'
      }

      const assistantResponse: Message = {
        id: `msg-${Date.now() + 1}`,
        type: 'assistant',
        content: `I've created ${detectedType ? `a ${detectedType.replace('-', ' ')}` : 'the content'} for you${
          framework ? ' based on your active framework' : ''
        }:\n\n${generatedContent}`,
        timestamp: new Date(),
        contentType: detectedType,
        suggestions: generateFollowUpSuggestions(detectedType)
      }

      setMessages(prev => [...prev, assistantResponse])

      // Trigger content generation callback
      if (detectedType && response.success) {
        onContentGenerate(detectedType, generatedContent)
      }
    } catch (error) {
      console.error('Error generating content:', error)

      const errorMessage: Message = {
        id: `msg-${Date.now() + 1}`,
        type: 'assistant',
        content: 'I apologize, but I encountered an error while generating content. Please try again.',
        timestamp: new Date(),
        suggestions: INITIAL_SUGGESTIONS
      }

      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSuggestionClick = (suggestion: Suggestion) => {
    setInputValue(suggestion.query)
  }

  const copyMessage = (message: Message) => {
    navigator.clipboard.writeText(message.content)
    setCopiedMessageId(message.id)
    setTimeout(() => setCopiedMessageId(null), 2000)
  }

  return (
    <div className="ai-assistant flex flex-col h-full bg-gray-800">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-medium">AI Content Assistant</h3>
              <p className="text-xs text-gray-400">Powered by NIV Intelligence</p>
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
              <div
                className={`p-4 rounded-lg ${
                  message.type === 'user'
                    ? 'bg-purple-600/20 border border-purple-600/30'
                    : 'bg-gray-700/50'
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

                    {/* Suggestions */}
                    {message.suggestions && message.suggestions.length > 0 && (
                      <div className="mt-3 space-y-1">
                        <p className="text-xs text-gray-400 mb-2">Suggestions:</p>
                        {message.suggestions.map((suggestion, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-sm text-left w-full"
                          >
                            <Lightbulb className="w-3 h-3 text-yellow-400" />
                            <span className="flex-1">{suggestion.label}</span>
                            <ChevronRight className="w-3 h-3 text-gray-400" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {message.type === 'assistant' && (
                    <button
                      onClick={() => copyMessage(message)}
                      className="p-1.5 hover:bg-gray-600 rounded transition-colors"
                    >
                      {copiedMessageId === message.id ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  )}
                </div>
              </div>
              <div className="mt-1 px-2">
                <span className="text-xs text-gray-500">
                  {message.timestamp.toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>
        ))}

        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-gray-700/50 p-4 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg">
                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                </div>
                <span className="text-sm text-gray-400">Generating content...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-700">
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
              placeholder="Describe the content you want to create..."
              className="w-full px-4 py-3 bg-gray-700 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              rows={3}
            />
            <div className="mt-2 flex items-center gap-4 text-xs text-gray-400">
              <span>Press Enter to send</span>
              <span>Shift+Enter for new line</span>
              {framework && (
                <span className="text-purple-400">
                  Framework context will be included
                </span>
              )}
            </div>
          </div>
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isProcessing}
            className={`p-3 rounded-lg transition-colors ${
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
      </div>
    </div>
  )
}