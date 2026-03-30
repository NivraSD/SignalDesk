'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  Brain,
  Sparkles,
  Send,
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
  Presentation,
  Users,
  Edit,
  Save,
  Download,
  RefreshCw,
  Loader2,
  Check
} from 'lucide-react'
import { useAppStore } from '@/stores/useAppStore'
import { motion, AnimatePresence } from 'framer-motion'

// Content types with proper configurations
const CONTENT_TYPES = [
  { type: 'press-release', label: 'Press Release', icon: FileText, color: '#10b981' },
  { type: 'social-post', label: 'Social Media', icon: Hash, color: '#3b82f6' },
  { type: 'email', label: 'Email Campaign', icon: Mail, color: '#f59e0b' },
  { type: 'exec-statement', label: 'Executive Statement', icon: Briefcase, color: '#8b5cf6' },
  { type: 'crisis-response', label: 'Crisis Response', icon: AlertTriangle, color: '#ef4444' },
  { type: 'media-pitch', label: 'Media Pitch', icon: Mic, color: '#06b6d4' },
  { type: 'thought-leadership', label: 'Thought Leadership', icon: BookOpen, color: '#6366f1' },
  { type: 'qa-doc', label: 'Q&A Document', icon: MessageSquare, color: '#84cc16' },
  { type: 'image', label: 'Image', icon: ImageIcon, color: '#ec4899' },
  { type: 'video', label: 'Video', icon: Video, color: '#f97316' },
  { type: 'presentation', label: 'Presentation', icon: Presentation, color: '#14b8a6' },
  { type: 'media-list', label: 'Media List', icon: Users, color: '#64748b' }
]

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  contentItem?: any
  loading?: boolean
}

interface ContentItem {
  id: string
  type: string
  title: string
  content: any
  metadata?: any
  saved?: boolean
}

interface NIVContentCreatorProps {
  selectedContentType?: string
  onContentGenerated?: (content: ContentItem) => void
  className?: string
}

export default function NIVContentCreator({
  selectedContentType,
  onContentGenerated,
  className = ''
}: NIVContentCreatorProps) {
  // State management
  const { organization } = useAppStore()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentContentType, setCurrentContentType] = useState(selectedContentType)
  const [generatedContent, setGeneratedContent] = useState<ContentItem | null>(null)
  const [showEditor, setShowEditor] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Initialize with content type selection
  useEffect(() => {
    if (selectedContentType) {
      setCurrentContentType(selectedContentType)
      const contentConfig = CONTENT_TYPES.find(t => t.type === selectedContentType)
      if (contentConfig) {
        const welcomeMessage: Message = {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: `I'll help you create a ${contentConfig.label}. What would you like to communicate?`,
          timestamp: new Date()
        }
        setMessages([welcomeMessage])
      }
    } else {
      // Show initial welcome
      const welcomeMessage: Message = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: "I'm NIV, your content strategist. Select a content type above or tell me what you'd like to create.",
        timestamp: new Date()
      }
      setMessages([welcomeMessage])
    }
  }, [selectedContentType])

  // Handle message sending
  const handleSend = async () => {
    if (!input.trim() || isThinking) return

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsThinking(true)

    try {
      // Check if user is asking for content generation
      const lowerInput = input.toLowerCase()
      const isGenerationRequest =
        lowerInput.includes('create') ||
        lowerInput.includes('generate') ||
        lowerInput.includes('make') ||
        lowerInput.includes('write') ||
        currentContentType // If content type is selected, assume generation intent

      if (isGenerationRequest && currentContentType) {
        await handleContentGeneration(input.trim())
      } else {
        // Regular conversation
        await handleConversation(input.trim())
      }
    } catch (error) {
      console.error('Error in handleSend:', error)
      addAssistantMessage('I encountered an error. Please try again.')
    } finally {
      setIsThinking(false)
    }
  }

  // Handle regular conversation
  const handleConversation = async (message: string) => {
    try {
      // Call a simple chat endpoint (you'll need to create this)
      const response = await fetch('/api/niv/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          context: {
            contentType: currentContentType,
            organization: organization?.name || 'OpenAI'
          }
        })
      })

      if (response.ok) {
        const data = await response.json()
        addAssistantMessage(data.response || data.content)
      } else {
        addAssistantMessage("I'm having trouble connecting. Let me know what content you'd like to create and I'll help.")
      }
    } catch (error) {
      console.error('Conversation error:', error)
      addAssistantMessage("I'm ready to help create content. What would you like to make?")
    }
  }

  // Handle content generation
  const handleContentGeneration = async (prompt: string) => {
    if (!currentContentType) {
      addAssistantMessage('Please select a content type first.')
      return
    }

    setIsGenerating(true)

    const thinkingMessage: Message = {
      id: `thinking-${Date.now()}`,
      role: 'assistant',
      content: `Creating your ${CONTENT_TYPES.find(t => t.type === currentContentType)?.label}...`,
      timestamp: new Date(),
      loading: true
    }

    setMessages(prev => [...prev, thinkingMessage])

    try {
      const content = await generateContent(currentContentType, prompt)

      if (content) {
        // Remove thinking message
        setMessages(prev => prev.filter(m => m.id !== thinkingMessage.id))

        // Add success message with content
        const successMessage: Message = {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: `Here's your ${CONTENT_TYPES.find(t => t.type === currentContentType)?.label}:`,
          timestamp: new Date(),
          contentItem: content
        }

        setMessages(prev => [...prev, successMessage])
        setGeneratedContent(content)

        if (onContentGenerated) {
          onContentGenerated(content)
        }
      } else {
        throw new Error('Content generation failed')
      }
    } catch (error) {
      console.error('Content generation error:', error)
      // Remove thinking message
      setMessages(prev => prev.filter(m => m.id !== thinkingMessage.id))
      addAssistantMessage('I had trouble creating that content. Please try again with more specific details.')
    } finally {
      setIsGenerating(false)
    }
  }

  // Generate content based on type
  const generateContent = async (type: string, prompt: string): Promise<ContentItem | null> => {
    try {
      const endpoint = `/api/content/${type}`
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          organization: organization?.name || 'OpenAI',
          context: {
            // Add any additional context here
          }
        })
      })

      if (!response.ok) {
        // Fallback for missing endpoints - use mock content
        return generateMockContent(type, prompt)
      }

      const data = await response.json()

      return {
        id: `content-${Date.now()}`,
        type,
        title: data.title || `${type} - ${new Date().toLocaleDateString()}`,
        content: data.content || data,
        metadata: data.metadata,
        saved: false
      }
    } catch (error) {
      console.error('API generation failed, using mock:', error)
      return generateMockContent(type, prompt)
    }
  }

  // Mock content generation for testing
  const generateMockContent = (type: string, prompt: string): ContentItem => {
    const contentConfig = CONTENT_TYPES.find(t => t.type === type)

    let mockContent = ''
    let title = `${contentConfig?.label} - ${new Date().toLocaleDateString()}`

    switch (type) {
      case 'press-release':
        title = 'OpenAI Announces Major AI Breakthrough'
        mockContent = `FOR IMMEDIATE RELEASE

${title}

Revolutionary new capabilities set to transform enterprise AI applications

SAN FRANCISCO, CA - ${new Date().toLocaleDateString()} - OpenAI, the leading artificial intelligence research company, today announced a groundbreaking advancement in AI technology that promises to revolutionize how businesses operate.

${prompt}

"This represents a significant leap forward in AI capability," said [Executive Name], [Title] at OpenAI. "We're excited about the potential impact this will have across industries."

The new technology will be available to enterprise customers starting [Date].

About OpenAI
OpenAI is an AI research and deployment company. Our mission is to ensure that artificial general intelligence benefits all of humanity.

Media Contact:
[Name]
[Email]
[Phone]`
        break

      case 'social-post':
        mockContent = {
          linkedin: `🚀 Excited to share: ${prompt}

This represents a major milestone in our mission to ensure AI benefits everyone.

What are your thoughts on the future of AI? Let's discuss in the comments!

#OpenAI #ArtificialIntelligence #Innovation`,

          twitter: `🚀 ${prompt}

A major step forward in our mission to benefit humanity with AI.

What do you think? 🤔

#OpenAI #AI`,

          facebook: `We're thrilled to announce: ${prompt}

This development represents years of research and collaboration with our amazing team. We can't wait to see how this technology will help solve real-world problems.

Learn more at openai.com`
        }
        break

      case 'email':
        mockContent = `Subject: Important Update: ${prompt}

Dear [Name],

I hope this message finds you well. I wanted to personally share some exciting news with you.

${prompt}

This development aligns with our ongoing commitment to advancing AI technology in ways that benefit everyone.

We're grateful for your continued support and look forward to sharing more updates soon.

Best regards,
[Your Name]
OpenAI Team

P.S. If you have any questions, feel free to reply to this email.`
        break

      case 'image':
        // For images, return a placeholder that will trigger actual generation
        mockContent = {
          url: `https://picsum.photos/800/600?random=${Date.now()}`,
          prompt: `${prompt}, professional tech aesthetic, modern corporate style, OpenAI branding elements`,
          style: 'professional',
          dimensions: { width: 800, height: 600 }
        }
        title = 'AI Generated Image'
        break

      default:
        mockContent = `${contentConfig?.label}

${prompt}

[Generated content would appear here based on the specific type and requirements.]

This is a mock version for testing. The actual content would be generated using appropriate AI services.`
    }

    return {
      id: `content-${Date.now()}`,
      type,
      title,
      content: mockContent,
      metadata: {
        wordCount: typeof mockContent === 'string' ? mockContent.split(' ').length : 0,
        createdAt: new Date()
      },
      saved: false
    }
  }

  // Add assistant message
  const addAssistantMessage = (content: string) => {
    const message: Message = {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, message])
  }

  // Handle content actions
  const handleSaveContent = async (content: ContentItem) => {
    try {
      // Save to local storage for now (you can replace with actual API)
      const saved = JSON.parse(localStorage.getItem('content_library') || '[]')
      saved.push({ ...content, saved: true, savedAt: new Date() })
      localStorage.setItem('content_library', JSON.stringify(saved))

      addAssistantMessage('✅ Content saved successfully!')

      // Update the content item
      setGeneratedContent(prev => prev ? { ...prev, saved: true } : null)
    } catch (error) {
      console.error('Save error:', error)
      addAssistantMessage('❌ Failed to save content. Please try again.')
    }
  }

  const handleEditContent = (content: ContentItem) => {
    setGeneratedContent(content)
    setShowEditor(true)
  }

  const handleRegenerateContent = async () => {
    if (currentContentType && generatedContent) {
      const lastUserMessage = messages.filter(m => m.role === 'user').pop()
      if (lastUserMessage) {
        await handleContentGeneration(lastUserMessage.content)
      }
    }
  }

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Render content preview
  const renderContentPreview = (content: ContentItem) => {
    if (content.type === 'image') {
      // Handle image display
      const imageData = content.content
      if (typeof imageData === 'object' && imageData.url) {
        return (
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mt-4">
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-pink-400" />
              Generated Image
            </h4>
            <div className="bg-gray-900 rounded-lg p-4">
              <img
                src={imageData.url}
                alt={imageData.prompt || 'Generated image'}
                className="w-full max-w-2xl mx-auto rounded-lg shadow-lg"
                style={{ maxHeight: '400px', objectFit: 'contain' }}
              />
              <div className="mt-3 text-sm text-gray-400">
                <p><strong>Prompt:</strong> {imageData.prompt}</p>
                <p><strong>Style:</strong> {imageData.style}</p>
                {imageData.dimensions && (
                  <p><strong>Size:</strong> {imageData.dimensions.width} × {imageData.dimensions.height}</p>
                )}
              </div>
            </div>
          </div>
        )
      } else {
        return (
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mt-4">
            <div className="text-center py-8">
              <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400 mb-4">Image generation failed</p>
              <button
                onClick={handleRegenerateContent}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500"
              >
                Try Again
              </button>
            </div>
          </div>
        )
      }
    }

    if (typeof content.content === 'object' && content.type === 'social-post') {
      return (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mt-4">
          <h4 className="font-semibold mb-4">Social Media Posts</h4>
          {Object.entries(content.content as Record<string, string>).map(([platform, post]) => (
            <div key={platform} className="mb-4 last:mb-0">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium text-blue-400 capitalize">{platform}</span>
              </div>
              <div className="bg-gray-900 rounded-lg p-3 text-sm whitespace-pre-wrap">
                {post}
              </div>
            </div>
          ))}
        </div>
      )
    }

    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mt-4">
        <h4 className="font-semibold mb-2">{content.title}</h4>
        <div className="prose prose-invert prose-sm max-w-none">
          <pre className="whitespace-pre-wrap text-sm text-gray-300 font-sans">
            {typeof content.content === 'string' ? content.content : JSON.stringify(content.content, null, 2)}
          </pre>
        </div>
      </div>
    )
  }

  return (
    <div className={`niv-content-creator flex flex-col h-full bg-gray-950 ${className}`}>
      {/* Header */}
      <div className="flex-shrink-0 bg-gradient-to-r from-violet-600 to-indigo-600 p-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Brain className="w-6 h-6 text-white" />
            {isThinking && (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0"
              >
                <Sparkles className="w-6 h-6 text-white/50" />
              </motion.div>
            )}
          </div>
          <div>
            <h2 className="text-white font-bold">NIV Content Creator</h2>
            <p className="text-white/80 text-sm">
              {currentContentType
                ? `Creating: ${CONTENT_TYPES.find(t => t.type === currentContentType)?.label}`
                : 'Ready to create content'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map(message => (
          <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-2xl ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
              <div className={`rounded-lg p-4 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 border border-gray-700'
              }`}>
                {message.role === 'assistant' && (
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-violet-400" />
                    <span className="text-sm font-medium text-violet-400">NIV</span>
                  </div>
                )}

                <div className="whitespace-pre-wrap">
                  {message.loading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {message.content}
                    </div>
                  ) : (
                    message.content
                  )}
                </div>

                {/* Content Preview */}
                {message.contentItem && renderContentPreview(message.contentItem)}

                {/* Action Buttons */}
                {message.contentItem && (
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => handleSaveContent(message.contentItem)}
                      className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-sm rounded-md flex items-center gap-1.5"
                    >
                      <Save className="w-3.5 h-3.5" />
                      Save
                    </button>
                    <button
                      onClick={() => handleEditContent(message.contentItem)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-md flex items-center gap-1.5"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      Edit
                    </button>
                    <button
                      onClick={handleRegenerateContent}
                      className="px-3 py-1.5 bg-gray-600 hover:bg-gray-500 text-white text-sm rounded-md flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Regenerate
                    </button>
                  </div>
                )}

                <div className="text-xs text-gray-500 mt-2">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 border-t border-gray-800 p-4">
        <div className="flex gap-3">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={
              currentContentType
                ? `Describe your ${CONTENT_TYPES.find(t => t.type === currentContentType)?.label.toLowerCase()}...`
                : "What content would you like to create?"
            }
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-violet-500 resize-none"
            rows={3}
            disabled={isThinking || isGenerating}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isThinking || isGenerating}
            className="px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            Send
          </button>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 mt-3">
          {!currentContentType && (
            <span className="text-xs text-gray-500">
              Select a content type above to get started
            </span>
          )}
          {currentContentType && (
            <button
              onClick={() => setInput(`Create a ${CONTENT_TYPES.find(t => t.type === currentContentType)?.label.toLowerCase()} about `)}
              className="text-xs px-3 py-1 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors"
            >
              Quick Start
            </button>
          )}
        </div>
      </div>
    </div>
  )
}