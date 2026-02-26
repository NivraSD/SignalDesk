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
  Presentation,
  Megaphone,
  Users,
  FolderPlus,
  ChevronRight
} from 'lucide-react'
import type { NivStrategicFramework } from '@/types/niv-strategic-framework'
import type { ContentItem } from '@/types/content'
import { useAppStore } from '@/stores/useAppStore'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co'

// Real Supabase edge functions mapped to ALL content types from ExecuteTabProduction
const CONTENT_SERVICE_MAP = {
  // Written Content
  'press-release': {
    label: 'Press Release',
    icon: FileText,
    service: `${SUPABASE_URL}/functions/v1/mcp-content`,
    params: { type: 'press-release' }
  },
  'blog-post': {
    label: 'Blog Post',
    icon: BookOpen,
    service: `${SUPABASE_URL}/functions/v1/mcp-content`,
    params: { type: 'blog-post' }
  },
  'thought-leadership': {
    label: 'Thought Leadership',
    icon: BookOpen,
    service: `${SUPABASE_URL}/functions/v1/mcp-content`,
    params: { type: 'thought-leadership' }
  },
  'case-study': {
    label: 'Case Study',
    icon: FileText,
    service: `${SUPABASE_URL}/functions/v1/mcp-content`,
    params: { type: 'case-study' }
  },
  'white-paper': {
    label: 'White Paper',
    icon: FileText,
    service: `${SUPABASE_URL}/functions/v1/mcp-content`,
    params: { type: 'white-paper' }
  },
  'ebook': {
    label: 'eBook',
    icon: BookOpen,
    service: `${SUPABASE_URL}/functions/v1/mcp-content`,
    params: { type: 'ebook' }
  },
  'qa-document': {
    label: 'Q&A Document',
    icon: MessageSquare,
    service: `${SUPABASE_URL}/functions/v1/mcp-content`,
    params: { type: 'qa' }
  },

  // Social & Digital
  'social-post': {
    label: 'Social Media Post',
    icon: Hash,
    service: `${SUPABASE_URL}/functions/v1/mcp-content`,
    params: { platforms: ['twitter', 'linkedin'] }
  },
  'linkedin-article': {
    label: 'LinkedIn Article',
    icon: Briefcase,
    service: `${SUPABASE_URL}/functions/v1/mcp-content`,
    params: { type: 'linkedin-article' }
  },
  'twitter-thread': {
    label: 'Twitter Thread',
    icon: Hash,
    service: `${SUPABASE_URL}/functions/v1/mcp-content`,
    params: { platform: 'twitter', type: 'thread' }
  },
  'instagram-caption': {
    label: 'Instagram Caption',
    icon: ImageIcon,
    service: `${SUPABASE_URL}/functions/v1/mcp-content`,
    params: { platform: 'instagram' }
  },
  'facebook-post': {
    label: 'Facebook Post',
    icon: Hash,
    service: `${SUPABASE_URL}/functions/v1/mcp-content`,
    params: { platform: 'facebook' }
  },

  // Email & Communications
  'email': {
    label: 'Email Campaign',
    icon: Mail,
    service: `${SUPABASE_URL}/functions/v1/mcp-campaigns`,
    params: { type: 'email' }
  },
  'newsletter': {
    label: 'Newsletter',
    icon: Mail,
    service: `${SUPABASE_URL}/functions/v1/mcp-campaigns`,
    params: { type: 'newsletter' }
  },
  'email-sequence': {
    label: 'Email Sequence',
    icon: Mail,
    service: `${SUPABASE_URL}/functions/v1/mcp-campaigns`,
    params: { type: 'sequence' }
  },
  'internal-memo': {
    label: 'Internal Memo',
    icon: FileText,
    service: `${SUPABASE_URL}/functions/v1/mcp-content`,
    params: { type: 'memo' }
  },

  // Executive & Strategic
  'exec-statement': {
    label: 'Executive Statement',
    icon: Briefcase,
    service: `${SUPABASE_URL}/functions/v1/mcp-content`,
    params: { type: 'executive' }
  },
  'keynote-speech': {
    label: 'Keynote Speech',
    icon: Mic,
    service: `${SUPABASE_URL}/functions/v1/mcp-content`,
    params: { type: 'keynote' }
  },
  'earnings-script': {
    label: 'Earnings Call Script',
    icon: FileText,
    service: `${SUPABASE_URL}/functions/v1/mcp-content`,
    params: { type: 'earnings' }
  },
  'investor-letter': {
    label: 'Investor Letter',
    icon: FileText,
    service: `${SUPABASE_URL}/functions/v1/mcp-content`,
    params: { type: 'investor' }
  },

  // Media & PR
  'media-pitch': {
    label: 'Media Pitch',
    icon: Mic,
    service: `${SUPABASE_URL}/functions/v1/mcp-media`,
    params: { type: 'pitch' }
  },
  'media-kit': {
    label: 'Media Kit',
    icon: FileText,
    service: `${SUPABASE_URL}/functions/v1/mcp-media`,
    params: { type: 'kit' }
  },
  'op-ed': {
    label: 'Op-Ed',
    icon: FileText,
    service: `${SUPABASE_URL}/functions/v1/mcp-content`,
    params: { type: 'op-ed' }
  },
  'bylined-article': {
    label: 'Bylined Article',
    icon: FileText,
    service: `${SUPABASE_URL}/functions/v1/mcp-content`,
    params: { type: 'bylined' }
  },
  'podcast-script': {
    label: 'Podcast Script',
    icon: Mic,
    service: `${SUPABASE_URL}/functions/v1/mcp-content`,
    params: { type: 'podcast' }
  },
  'interview-prep': {
    label: 'Interview Prep',
    icon: MessageSquare,
    service: `${SUPABASE_URL}/functions/v1/mcp-content`,
    params: { type: 'interview-prep' }
  },

  // Visual Content
  'image': {
    label: 'Image',
    icon: ImageIcon,
    service: `${SUPABASE_URL}/functions/v1/vertex-ai-visual`,
    params: { type: 'image' }
  },
  'video': {
    label: 'Video',
    icon: Video,
    service: `${SUPABASE_URL}/functions/v1/vertex-ai-visual`,
    params: { type: 'video' }
  },
  'presentation': {
    label: 'Presentation',
    icon: Presentation,
    service: `${SUPABASE_URL}/functions/v1/gamma-presentation`,
    params: { type: 'presentation' }
  },
  'infographic': {
    label: 'Infographic',
    icon: ImageIcon,
    service: `${SUPABASE_URL}/functions/v1/vertex-ai-visual`,
    params: { type: 'infographic' }
  },
  'slide-deck': {
    label: 'Slide Deck',
    icon: Presentation,
    service: `${SUPABASE_URL}/functions/v1/gamma-presentation`,
    params: { type: 'slides' }
  },

  // Strategic & Messaging
  'messaging': {
    label: 'Messaging Framework',
    icon: MessageSquare,
    service: `${SUPABASE_URL}/functions/v1/mcp-narratives`,
    params: { type: 'messaging' }
  },
  'positioning': {
    label: 'Positioning Statement',
    icon: MessageSquare,
    service: `${SUPABASE_URL}/functions/v1/mcp-narratives`,
    params: { type: 'positioning' }
  },
  'talking-points': {
    label: 'Talking Points',
    icon: MessageSquare,
    service: `${SUPABASE_URL}/functions/v1/mcp-content`,
    params: { type: 'talking-points' }
  },
  'campaign-plan': {
    label: 'Campaign Plan',
    icon: FileText,
    service: `${SUPABASE_URL}/functions/v1/mcp-campaigns`,
    params: { type: 'plan' }
  },

  // Specialized
  'crisis-response': {
    label: 'Crisis Response',
    icon: AlertTriangle,
    service: `${SUPABASE_URL}/functions/v1/mcp-crisis`,
    params: { urgency: 'high' }
  },
  'product-launch': {
    label: 'Product Launch',
    icon: FileText,
    service: `${SUPABASE_URL}/functions/v1/mcp-campaigns`,
    params: { type: 'product-launch' }
  },
  'event-promotion': {
    label: 'Event Promotion',
    icon: Megaphone,
    service: `${SUPABASE_URL}/functions/v1/mcp-campaigns`,
    params: { type: 'event' }
  },
  'customer-story': {
    label: 'Customer Story',
    icon: Users,
    service: `${SUPABASE_URL}/functions/v1/mcp-content`,
    params: { type: 'customer-story' }
  },
  'partnership-announcement': {
    label: 'Partnership Announcement',
    icon: Users,
    service: `${SUPABASE_URL}/functions/v1/mcp-content`,
    params: { type: 'partnership' }
  },
  'award-announcement': {
    label: 'Award Announcement',
    icon: FileText,
    service: `${SUPABASE_URL}/functions/v1/mcp-content`,
    params: { type: 'award' }
  },
  'landing-page-copy': {
    label: 'Landing Page Copy',
    icon: FileText,
    service: `${SUPABASE_URL}/functions/v1/mcp-content`,
    params: { type: 'landing-page' }
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

  // Track multi-part content generation
  const [isGeneratingMultiple, setIsGeneratingMultiple] = useState(false)
  const [pendingComponents, setPendingComponents] = useState<string[]>([])
  const [currentFolder, setCurrentFolder] = useState<string | null>(null)
  const [currentStrategy, setCurrentStrategy] = useState<string | null>(null)
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false)

  // Track conversation state with NIV
  const [conversationId, setConversationId] = useState(`conv-${Date.now()}`)
  const [conversationState, setConversationState] = useState<'discovery' | 'strategy' | 'creating' | 'delivering'>('discovery')
  const [prStrategy, setPrStrategy] = useState<any>(null)

  // Save content to content library
  const saveToContentLibrary = async (content: ContentItem) => {
    try {
      // For saving, we can use a default user ID
      const userId = 'system-generated'  // Since content is generated by the system

      const response = await fetch('/api/content-library/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: content.title,
          content: content.content,
          type: content.type,
          metadata: {
            folder: content.folder,
            source: content.source,
            createdAt: content.createdAt
          },
          organization_id: organization?.id || '1',
          created_by: userId
        })
      })

      if (!response.ok) {
        console.error('Failed to save to content library:', await response.text())
      } else {
        console.log(`✅ Saved ${content.title} to content library`)
      }
    } catch (error) {
      console.error('Error saving to content library:', error)
    }
  }

  // Content type acknowledgment - CLEAN AND SIMPLE
  useEffect(() => {
    if (selectedContentType) {
      const config = CONTENT_SERVICE_MAP[selectedContentType as keyof typeof CONTENT_SERVICE_MAP]
      if (config) {
        const acknowledgments: Record<string, string> = {
          'press-release': "I'll help you create a press release using our content service. What's the announcement?",
          'social-post': "Perfect! I'll create social posts using our social media service. What's the message?",
          'image': "I'll create an image using Google Imagen through our visual service. Describe what you need.",
          'video': "I'll generate a video using our visual generation service. What's the concept?",
          'presentation': "I'll create a presentation using Gamma. What's the topic?",
          'email': "I'll create an email campaign using our campaigns service. What's the purpose?",
        }

        const welcomeMessage = {
          id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          role: 'assistant',
          content: acknowledgments[selectedContentType] || `I'll help you create ${config.label}. What do you need?`,
          timestamp: new Date()
        }

        // Append welcome message instead of replacing all messages
        setMessages(prev => {
          // Only add if we don't already have a welcome for this content type
          const hasWelcomeForType = prev.some(msg =>
            msg.role === 'assistant' &&
            msg.content?.includes(config.label)
          )
          if (!hasWelcomeForType) {
            return [...prev, welcomeMessage]
          }
          return prev
        })
      }
    }
  }, [selectedContentType])

  // Helper function to extract event from prompt
  const extractEventFromPrompt = (prompt: string): string | undefined => {
    const lowerPrompt = prompt.toLowerCase()
    if (lowerPrompt.includes('launch')) return 'Product Launch'
    if (lowerPrompt.includes('announcement')) return 'Company Announcement'
    if (lowerPrompt.includes('event')) return 'Event'
    if (lowerPrompt.includes('campaign')) return 'Campaign'
    return undefined
  }

  // Scroll to bottom
  useEffect(() => {
    // Scroll within chat container only, not the entire page
    const chatContainer = messagesEndRef.current?.parentElement
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight
    }
  }, [messages])

  // Handle message send - COPY FROM WORKING NivStrategicAdvisor
  const handleSend = async () => {
    if (!input.trim() || isThinking) return

    const userMessage = input.trim()
    setInput('')
    setMessages(prev => [...prev, {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    }])
    setIsThinking(true)

    try {
      // Check if we're awaiting confirmation for a media plan
      if (awaitingConfirmation && (userMessage.toLowerCase() === 'yes' || userMessage.toLowerCase().includes('proceed') ||
          userMessage.toLowerCase().includes('perfect') || userMessage.toLowerCase().includes('create it') ||
          userMessage.toLowerCase().includes('let\'s do it') || userMessage.toLowerCase().includes('go ahead'))) {
        setAwaitingConfirmation(false)
        // NIV will handle generation itself - just send the approval
        await callNIVOrchestrator(userMessage)
        setIsThinking(false)
        return
      } else if (awaitingConfirmation) {
        // User provided feedback, refine the strategy
        setAwaitingConfirmation(false)
        setIsGeneratingMultiple(false)
        // Let normal conversation flow handle the refinement
      }

      // Always use the new NIV PR Consultant for content requests
      const lowerMessage = userMessage.toLowerCase()
      const isContentRequest = (
        lowerMessage.includes('media plan') ||
        lowerMessage.includes('press release') ||
        lowerMessage.includes('blog') ||
        lowerMessage.includes('social') ||
        lowerMessage.includes('email') ||
        lowerMessage.includes('campaign') ||
        lowerMessage.includes('announcement') ||
        lowerMessage.includes('create') ||
        lowerMessage.includes('generate') ||
        lowerMessage.includes('write')
      )

      if (isContentRequest) {
        // Call the enhanced NIV orchestrator
        await callNIVOrchestrator(userMessage)
      } else {
        // Build system prompt with multi-part context if applicable
        const multiPartContext = isGeneratingMultiple ? `

CURRENT MULTI-PART GENERATION:
- Generating components: ${pendingComponents.join(', ')}
- Folder: ${currentFolder || 'Not yet created'}

Guide the user through creating each component systematically.` : ''

        // Normal conversation with Claude using YOUR existing working endpoint
        const response = await fetch('/api/claude-direct', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: messages.slice(-10).concat([{ role: 'user', content: userMessage }]).map(msg => ({
              role: msg.role,
              content: typeof msg.content === 'string' ? msg.content : msg.content?.text || ''
            })),
            system: `You are NIV, the Content Orchestrator for ${organization?.name || 'OpenAI'}.

IDENTITY: You are a senior content strategist with expertise in PR, marketing, and strategic communications.

CURRENT CONTEXT:
- Selected Content Type: ${selectedContentType || 'None selected'}
- Organization: ${organization?.name || 'OpenAI'}
${multiPartContext}

GUIDELINES:
- Provide strategic guidance on messaging and content approach
- Ask clarifying questions to understand their content needs
- When they ask to CREATE/MAKE/GENERATE something, respond positively that you'll generate it
- Be conversational and helpful about content strategy
${isGeneratingMultiple ? `
- You are helping generate multiple content pieces
- Each component should be generated as a separate message
- Maintain consistency across all content pieces` : ''}`,
            max_tokens: 800,
            temperature: 0.7
          })
        })

        if (response.ok) {
          const data = await response.json()
          setMessages(prev => [...prev, {
            id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            role: 'assistant',
            content: data.content || "I'm here to help with content strategy. What would you like to create?",
            timestamp: new Date()
          }])
        } else {
          // Fallback response
          setMessages(prev => [...prev, {
            id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            role: 'assistant',
            content: selectedContentType
              ? `I'm ready to help you create your ${CONTENT_SERVICE_MAP[selectedContentType as keyof typeof CONTENT_SERVICE_MAP]?.label}. Just tell me what you want to create!`
              : "I can help you create any type of content. What do you need?",
            timestamp: new Date()
          }])
        }
      }
    } catch (error) {
      console.error('Error:', error)
      setMessages(prev => [...prev, {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        role: 'assistant',
        content: 'I encountered an error. Please try again.',
        timestamp: new Date(),
        error: true
      }])
    } finally {
      setIsThinking(false)
    }
  }

  // New function to call enhanced NIV PR Consultant orchestrator
  const callNIVOrchestrator = async (prompt: string) => {
    setIsThinking(true)

    try {
      console.log('🎯 Calling NIV PR Consultant...')

      const authToken = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

      const response = await fetch(`${SUPABASE_URL}/functions/v1/niv-content-robust`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          message: prompt,
          contentType: selectedContentType, // Pass the selected content type
          conversationId,
          conversationHistory: messages.slice(-10).map(msg => ({
            role: msg.role,
            content: typeof msg.content === 'string' ? msg.content : msg.content?.text || '',
            strategy: msg.strategy // Include any strategy from messages
          })),
          context: {
            organization: organization || {
              name: 'Tesla',
              industry: 'Technology'
            },
            framework: framework, // Pass the framework if available
            event: extractEventFromPrompt(prompt)
          },
          strategy: framework?.strategy // Pass strategy from framework
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('NIV error:', errorText)
        throw new Error(`NIV failed: ${response.status}`)
      }

      const data = await response.json()
      console.log('NIV Response:', data)

      // Handle the new response structure
      if (data.success) {
        // Check if this is a streaming response with multiple messages
        if (data.messages && Array.isArray(data.messages)) {
          // This is a content generation response with progress messages
          console.log('📦 Processing NIV messages...')

          // Process each message
          for (let i = 0; i < data.messages.length; i++) {
            const msg = data.messages[i]

            // Add delay for progressive display (except for first message)
            if (i > 0) {
              await new Promise(resolve => setTimeout(resolve, 500))
            }

            if (msg.type === 'acknowledgment' || msg.type === 'outline') {
              // Show acknowledgment or outline message
              setMessages(prev => [...prev, {
                id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                role: 'assistant',
                content: msg.message,
                timestamp: new Date()
              }])
            } else if (msg.type === 'presentation_started') {
              // Handle presentation start with generation ID
              setMessages(prev => [...prev, {
                id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                role: 'assistant',
                content: msg.message,
                timestamp: new Date(),
                generationId: msg.generationId
              }])

              // Start polling for presentation status
              if (msg.generationId) {
                console.log('🔄 Starting presentation polling for:', msg.generationId)
                startPresentationPolling(msg.generationId, null)
              }
            } else if (msg.type === 'progress') {
              // Show progress message
              setMessages(prev => [...prev, {
                id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                role: 'assistant',
                content: msg.message,
                timestamp: new Date(),
                isProgress: true
              }])
            } else if (msg.type === 'content') {
              // Create content item from the message
              let contentItem: ContentItem | undefined

              if (msg.content) {
                contentItem = {
                  id: `${msg.contentType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  title: msg.contentType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
                  type: msg.contentType as any,
                  content: msg.content,  // This is the actual content from NIV
                  createdAt: new Date(),
                  status: 'completed' as const,
                  source: 'niv-content-robust',
                  folder: msg.folder || msg.savedPath?.split('/')[2] || 'content',
                  savedPath: msg.savedPath
                }
              }

              // Show content completion message with content attached
              setMessages(prev => [...prev, {
                id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                role: 'assistant',
                content: msg.message,
                timestamp: new Date(),
                hasContent: true,
                contentType: msg.contentType,
                savedPath: msg.savedPath,
                contentItem: contentItem,  // Attach the content item directly
                showActions: !!contentItem  // Show actions if we have content
              }])
            } else if (msg.type === 'complete') {
              // Show completion summary
              setMessages(prev => [...prev, {
                id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                role: 'assistant',
                content: msg.message,
                timestamp: new Date(),
                isComplete: true
              }])
            }
          }
        } else if (data.needsAgreement) {
          // This is a strategy presentation awaiting agreement
          console.log('📊 Strategy presented, awaiting agreement')
          setMessages(prev => [...prev, {
            id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            role: 'assistant',
            content: data.message,
            timestamp: new Date(),
            stage: data.stage,
            needsAgreement: true
          }])

          // Update conversation state
          setConversationState('awaiting_confirmation')
          setAwaitingConfirmation(true)

          // Store the strategy and prepare for generation
          if (data.message) {
            setCurrentStrategy(data.message) // Store the strategy text
            setCurrentFolder(`Media Plan - ${new Date().toLocaleDateString()}`)
            setPendingComponents(['press-release', 'media-list', 'media-pitch', 'talking-points', 'qa-document', 'social-campaign'])
          }
        } else {
          // Regular message response
          setMessages(prev => [...prev, {
            id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            role: 'assistant',
            content: data.message,
            timestamp: new Date(),
            stage: data.stage
          }])
        }

        // Store conversation ID for continuity
        if (data.conversationId) {
          setConversationId(data.conversationId)
        }
      } else {
        // Error response
        throw new Error(data.error || 'Unknown error')
      }

    } catch (error) {
      console.error('NIV Orchestrator error:', error)
      setMessages(prev => [...prev, {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        role: 'assistant',
        content: 'I encountered an issue with content generation. Let me try a different approach.',
        timestamp: new Date(),
        error: true
      }])
    } finally {
      setIsThinking(false)
    }
  }

  // Generate multi-part content using the intelligent orchestrator
  const generateMultiPartContent = async (prompt: string) => {
    setIsThinking(true)

    try {
      // Call the intelligent NIV Content Orchestrator edge function
      console.log('🎯 Using intelligent NIV Content Orchestrator...')

      // Determine content type from prompt
      const lowerPrompt = prompt.toLowerCase()
      let contentType = 'media-plan' // default
      if (lowerPrompt.includes('social')) {
        contentType = 'social-campaign'
      } else if (lowerPrompt.includes('presentation') || lowerPrompt.includes('deck')) {
        contentType = 'presentation'
      } else if (lowerPrompt.includes('launch')) {
        contentType = 'product-launch'
      } else if (lowerPrompt.includes('crisis')) {
        contentType = 'crisis-response'
      } else if (lowerPrompt.includes('event')) {
        contentType = 'event-promotion'
      }

      // Use the anon key for authentication - it's what edge functions expect
      const authToken = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

      if (!authToken) {
        console.error('No Supabase anon key found')
        throw new Error('Authentication configuration error')
      }

      const response = await fetch(`${SUPABASE_URL}/functions/v1/niv-content-robust`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          message: prompt,
          conversationId: `conv-${Date.now()}`,
          conversationHistory: messages.slice(-10).map(msg => ({
            role: msg.role,
            content: typeof msg.content === 'string' ? msg.content : msg.content?.text || ''
          })),
          context: {
            organization: organization || {
              name: 'Company',
              industry: 'Technology'
            },
            requestedContentType: contentType  // Pass the specific content type
          }
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Orchestrator error details:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        })
        throw new Error(`Orchestrator failed: ${response.status} - ${errorText}`)
      }

      const data = await response.json()

      // Display acknowledgment
      if (data.acknowledgment) {
        setMessages(prev => [...prev, {
          id: `msg-${Date.now()}-ack-${Math.random().toString(36).substr(2, 9)}`,
          role: 'assistant',
          content: data.acknowledgment,
          timestamp: new Date()
        }])
      }

      // Handle clarifying questions
      if (data.status === 'needs_clarification' && data.questions?.length > 0) {
        setMessages(prev => [...prev, {
          id: `msg-${Date.now()}-q-${Math.random().toString(36).substr(2, 9)}`,
          role: 'assistant',
          content: data.message,
          timestamp: new Date()
        }])
        setIsThinking(false)
        return
      }

      // Process and save generated components
      console.log('🔍 Orchestrator response data:', data)

      if (data.deliveryTracking) {
        console.log('📦 Delivery tracking:', data.deliveryTracking)
        const completedComponents = Object.entries(data.deliveryTracking)
          .filter(([_, tracking]: [string, any]) => tracking?.status === 'completed' && tracking?.content)

        console.log(`✅ Found ${completedComponents.length} completed components`)

        // Create a folder for all components
        const folderName = data.folderName || `Media Plan - ${new Date().toLocaleDateString()}`

        // Track what was generated
        const generatedItems: string[] = []

        // Save strategy document if it exists
        if (data.deliveryTracking?.['media-plan-strategy']) {
          const strategy = data.deliveryTracking['media-plan-strategy']
          const strategyContent: ContentItem = {
            id: `strategy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            title: `Media Plan Strategy - ${folderName}`,
            type: 'strategy' as any,
            content: typeof strategy.content === 'string' ? strategy.content : (strategy.content?.text || JSON.stringify(strategy.content)),
            createdAt: new Date(),
            status: 'completed' as const,
            source: 'niv-orchestrator',
            folder: folderName
          }

          // Save via callback
          if (onContentGenerated) {
            onContentGenerated(strategyContent)
          }

          // Save to content library
          saveToContentLibrary(strategyContent)

          generatedItems.push('📋 Media Plan Strategy')
        }

        // Save each component
        for (const [componentType, tracking] of completedComponents) {
          const trackingData = tracking as any
          const componentTitle = componentType.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())

          // Create content item
          const newContent: ContentItem = {
            id: `${componentType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            title: `${componentTitle}`,
            type: componentType as any,
            content: typeof trackingData.content === 'string' ? trackingData.content : (trackingData.content?.text || JSON.stringify(trackingData.content)),
            createdAt: new Date(),
            status: 'completed' as const,
            source: 'niv-orchestrator',
            folder: folderName
          }

          // Save via callback
          if (onContentGenerated) {
            onContentGenerated(newContent)
          }

          // Save to content library
          saveToContentLibrary(newContent)

          // Add icon based on type
          const iconMap: Record<string, string> = {
            'press-release': '📰',
            'media-pitch': '📧',
            'social-post': '📱',
            'email-sequence': '✉️',
            'media-list': '📋',
            'talking-points': '🎯',
            'messaging-framework': '💬',
            'blog-post': '📝',
            'executive-statement': '🎤'
          }

          const icon = iconMap[componentType] || '📄'
          generatedItems.push(`${icon} ${componentTitle}`)
        }

        // Display a single completion message with all items
        if (generatedItems.length > 0) {
          setMessages(prev => [...prev, {
            id: `msg-${Date.now()}-complete-${Math.random().toString(36).substr(2, 9)}`,
            role: 'assistant',
            content: `✅ **Media Plan Complete!**\n\n**Generated ${generatedItems.length} components:**\n${generatedItems.join('\n')}\n\n📁 **Saved to folder:** ${folderName}\n\n**All content has been saved and is available in your workspace.** You can:\n• Open any component to view or edit\n• Export individual pieces or the entire package\n• Share with your team\n\nNeed any adjustments or additional content?`,
            timestamp: new Date(),
            metadata: {
              isSummary: true,
              folder: folderName,
              componentCount: generatedItems.length
            }
          }])
        } else {
          // No content was actually generated
          console.warn('⚠️ No content was generated despite orchestrator response')
          setMessages(prev => [...prev, {
            id: `msg-${Date.now()}-working-${Math.random().toString(36).substr(2, 9)}`,
            role: 'assistant',
            content: `🎯 **Analyzing your media plan request...**\n\nI understand you need a comprehensive media plan. Let me generate all the components for you:\n\n• Press Release\n• Media Pitch Templates\n• Social Media Posts\n• Email Sequences\n• Media Contact List\n• Talking Points\n• Messaging Framework\n\nGenerating content now...`,
            timestamp: new Date()
          }])

          // Trigger direct generation since orchestrator didn't generate content
          console.log('🚀 Triggering fallback content generation...')
          // The orchestrator should have generated content, but if not, we need to handle it
          setMessages(prev => [...prev, {
            id: `msg-${Date.now()}-issue-${Math.random().toString(36).substr(2, 9)}`,
            role: 'assistant',
            content: `⚠️ I noticed the content generation didn't complete properly. This might be because:\n\n1. The orchestrator needs more specific instructions\n2. There might be a configuration issue\n\nPlease try being more specific, for example:\n• "Create a media plan for our product launch announcement"\n• "Generate a PR campaign for our new partnership"\n• "Develop a crisis communication plan"\n\nWhat specific topic should the media plan cover?`,
            timestamp: new Date()
          }])
        }
      }

    } catch (error) {
      console.error('Error with orchestrator:', error)
      setMessages(prev => [...prev, {
        id: `msg-${Date.now()}-err-${Math.random().toString(36).substr(2, 9)}`,
        role: 'assistant',
        content: `I encountered an issue generating the content. Let me help you with a simpler approach. What specific piece of content would you like to start with?`,
        timestamp: new Date()
      }])
    } finally {
      setIsThinking(false)
    }

    return // Exit function completely - bypass all old logic

    /* OLD HARDCODED LOGIC BELOW - NOW BYPASSED
      const lowerPrompt = prompt.toLowerCase()
      let deliverableType = 'media-plan' // default
      let strategyTemplate = ''
      let components: string[] = []

      if (lowerPrompt.includes('media plan') || lowerPrompt.includes('media strategy')) {
        deliverableType = 'media-plan'
        components = ['press-release', 'media-pitch', 'email', 'talking-points', 'social-post', 'messaging']
        strategyTemplate = `## Media Plan Strategy`
      } else if (lowerPrompt.includes('social media') || lowerPrompt.includes('social campaign') || lowerPrompt.includes('content calendar')) {
        deliverableType = 'social-campaign'
        components = ['social-post', 'twitter-thread', 'linkedin-article', 'instagram-caption', 'campaign-plan']
        strategyTemplate = `## Social Media Campaign Strategy`
      } else if (lowerPrompt.includes('presentation') || lowerPrompt.includes('deck') || lowerPrompt.includes('pitch deck')) {
        deliverableType = 'presentation-package'
        components = ['presentation', 'talking-points', 'exec-statement', 'qa-document']
        strategyTemplate = `## Presentation Package Strategy`
      } else if (lowerPrompt.includes('product launch')) {
        deliverableType = 'product-launch'
        components = ['press-release', 'blog-post', 'social-post', 'email-sequence', 'landing-page-copy', 'customer-story']
        strategyTemplate = `## Product Launch Strategy`
      } else if (lowerPrompt.includes('campaign')) {
        deliverableType = 'campaign'
        components = ['messaging', 'campaign-plan', 'email', 'social-post', 'blog-post']
        strategyTemplate = `## Campaign Strategy`
      } else if (lowerPrompt.includes('crisis') || lowerPrompt.includes('emergency')) {
        deliverableType = 'crisis-response'
        components = ['crisis-response', 'press-release', 'internal-memo', 'social-post', 'talking-points', 'qa-document']
        strategyTemplate = `## Crisis Response Strategy`
      } else if (lowerPrompt.includes('event')) {
        deliverableType = 'event-promotion'
        components = ['event-promotion', 'email', 'social-post', 'press-release', 'landing-page-copy']
        strategyTemplate = `## Event Promotion Strategy`
      }

      // STEP 2: NIV announces what it's going to do
      console.log(`🎯 Developing ${deliverableType} strategy...`)

      setMessages(prev => [...prev, {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: `🎯 **Understanding your ${deliverableType.replace('-', ' ')} request**

I'll create a comprehensive ${deliverableType.replace('-', ' ')} with the following components:
${components.map(c => `• ${CONTENT_SERVICE_MAP[c as keyof typeof CONTENT_SERVICE_MAP]?.label || c}`).join('\n')}

Let me develop a strategic approach first...`,
        timestamp: new Date()
      }])

      // STEP 3: Call Claude to develop the comprehensive strategy
      const strategyResponse = await fetch('/api/claude-direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages.slice(-10).concat([{
            role: 'user',
            content: prompt
          }]).map(msg => ({
            role: msg.role,
            content: typeof msg.content === 'string' ? msg.content : msg.content?.text || ''
          })),
          system: `You are NIV, the strategic content orchestrator for ${organization?.name || 'the organization'}.

The user has requested: "${prompt}"

You are creating a ${deliverableType.replace('-', ' ')}. You must develop a comprehensive strategy that will guide the creation of these specific components:
${components.map(c => `- ${CONTENT_SERVICE_MAP[c as keyof typeof CONTENT_SERVICE_MAP]?.label || c}`).join('\n')}

Your task is to:
1. Understand the core objective and context from the user's request
2. Identify the target audiences
3. Define key messages and angles
4. Explain specifically how each component will serve the strategy
5. Provide the strategic rationale

Format your response as:

${strategyTemplate}

### Objective
[What we're trying to achieve based on the user's request]

### Context & Timing
[Why now, what's happening, any specific details from the request]

### Target Audiences
- Primary: [specific audience]
- Secondary: [specific audience]

### Key Messages
1. [Core message aligned with objective]
2. [Supporting message]
3. [Proof points or evidence]

### Component Strategy
${components.map(c => `- **${CONTENT_SERVICE_MAP[c as keyof typeof CONTENT_SERVICE_MAP]?.label || c}**: [specific angle, purpose, and key content points]`).join('\n')}

### Strategic Rationale
[Why this comprehensive approach will achieve the objective]

### Success Metrics
[How we'll measure the impact of this ${deliverableType.replace('-', ' ')}]

Be specific and actionable. Extract all relevant details from the user's request. This strategy will guide the creation of each component using the appropriate MCP tools.`,
          max_tokens: 2000,
          temperature: 0.7
        })
      })

      if (!strategyResponse.ok) {
        throw new Error('Failed to develop strategy')
      }

      const strategyData = await strategyResponse.json()
      const strategy = strategyData.content || strategyData.message

      // STEP 4: Present Strategy and Get Confirmation
      setMessages(prev => [...prev, {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: strategy + `

---

**📁 Folder Structure**
All components will be saved in: **"${deliverableType.charAt(0).toUpperCase() + deliverableType.slice(1).replace('-', ' ')} - ${new Date().toLocaleDateString()}"**

**✅ Ready to proceed?**
Type "yes" to generate all components with this strategy, or provide feedback to refine the approach.

Each component will be:
- Generated using the appropriate MCP tool
- Individually saveable to Memory Vault
- Editable in the workspace
- Organized in the folder`,
        timestamp: new Date(),
        metadata: {
          isStrategy: true,
          awaitingConfirmation: true,
          originalPrompt: prompt,
          deliverableType: deliverableType
        }
      }])

      // Store the strategy and components in state for later use
      setCurrentStrategy(strategy)
      setCurrentFolder(`${deliverableType.charAt(0).toUpperCase() + deliverableType.slice(1).replace('-', ' ')} - ${new Date().toLocaleDateString()}`)
      setAwaitingConfirmation(true)
      setIsGeneratingMultiple(true)
      setPendingComponents(components)
    */ // END OF OLD HARDCODED LOGIC
  } // End of generateMultiPartContent

  // Generate components with strategy context
  const generateComponentsWithStrategy = async () => {
    if (!currentStrategy || !currentFolder) {
      console.error('No strategy or folder available')
      return
    }

    setIsThinking(true)
    const generatedComponents: string[] = []

    try {
      // Announce generation is starting
      setMessages(prev => [...prev, {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: `🚀 **Starting content generation with approved strategy**\n\nI'll generate each component using the appropriate MCP tools with your strategic context...`,
        timestamp: new Date(),
        metadata: { folder: currentFolder }
      }])

      // Generate each component with full strategy context
      for (const componentType of pendingComponents) {
        const config = CONTENT_SERVICE_MAP[componentType as keyof typeof CONTENT_SERVICE_MAP]
        if (!config) {
          console.error(`No config for component type: ${componentType}`)
          continue
        }

        // Add a status message
        setMessages(prev => [...prev, {
          id: `msg-${Date.now()}-status-${componentType}`,
          role: 'assistant',
          content: `⏳ Generating ${config.label}...`,
          timestamp: new Date(),
          metadata: { isStatus: true }
        }])

        try {
          console.log(`📝 Generating ${componentType} with strategy context using service: ${config.service}`)

          // Build the prompt with full strategy context
          const componentPrompt = `Based on this comprehensive strategy, generate the ${config.label}:

STRATEGY CONTEXT:
${currentStrategy}

SPECIFIC COMPONENT REQUEST:
Create a ${config.label} that aligns with the strategy above.
- Organization: ${organization?.name || 'the organization'}
- Be specific, detailed, and ready for use
- Include all necessary elements for this content type
- Follow the strategic direction and key messages outlined above

Generate the actual ${config.label} content now.`

          // Call the ACTUAL MCP service endpoint for this content type
          const requestBody = {
            prompt: componentPrompt,
            contentType: componentType,
            organization: {
              id: organization?.id || 'default',
              name: organization?.name || 'Default Organization'
            },
            framework: framework || null,
            metadata: {
              strategy: currentStrategy,
              folder: currentFolder,
              component: componentType
            },
            // Include conversation history for better context
            conversation: messages.slice(-10).map(msg => ({
              role: msg.role,
              content: typeof msg.content === 'string' ? msg.content : msg.content?.text || ''
            })),
            mode: 'single' // Force single mode for individual component generation
          }

          console.log(`Calling service: ${config.service}`)

          // Map content type to MCP tool and prepare arguments
          const getMCPToolMapping = (contentType: string, prompt: string, strategy: string) => {
            const org = organization?.name || 'the organization'

            // Extract key points from strategy
            const extractKeyPoints = (strategy: string) => {
              const lines = strategy.split('\n').filter(line => line.trim())
              return lines.slice(0, 5).map(line => line.replace(/^[-*•]\s*/, '').trim())
            }

            const keyPoints = extractKeyPoints(strategy)

            switch(contentType) {
              // PRESS RELEASE
              case 'press-release':
                return {
                  service: `${SUPABASE_URL}/functions/v1/mcp-content`,
                  tool: 'generate_press_release',
                  arguments: {
                    headline: prompt.substring(0, 100),
                    subheadline: `${org} Announcement`,
                    keyPoints: keyPoints,
                    quotes: [{
                      speaker: "CEO",
                      title: `CEO of ${org}`,
                      quote: "This represents a significant milestone for our organization."
                    }],
                    tone: 'formal',
                    boilerplate: `About ${org}: A leading organization in the industry.`
                  }
                }

              // BLOG POST
              case 'blog-post':
              case 'thought-leadership':
              case 'white-paper':
              case 'ebook':
                return {
                  service: `${SUPABASE_URL}/functions/v1/mcp-content`,
                  tool: 'generate_blog_post',
                  arguments: {
                    title: prompt.substring(0, 100),
                    topic: `${prompt}\n\nStrategy Context:\n${strategy}`,
                    outline: keyPoints,
                    targetAudience: 'industry professionals',
                    wordCount: contentType === 'white-paper' ? 2000 : 800,
                    style: contentType === 'thought-leadership' ? 'thought_leadership' : 'educational',
                    includeCTA: true
                  }
                }

              // SOCIAL POSTS
              case 'social-post':
              case 'twitter-thread':
              case 'linkedin-article':
              case 'instagram-caption':
              case 'facebook-post':
                return {
                  service: `${SUPABASE_URL}/functions/v1/mcp-content`,
                  tool: 'generate_social_posts',
                  arguments: {
                    message: `${prompt}\n\nStrategy:\n${strategy}`,
                    platforms: contentType === 'twitter-thread' ? ['twitter'] :
                              contentType === 'linkedin-article' ? ['linkedin'] :
                              contentType === 'instagram-caption' ? ['instagram'] :
                              contentType === 'facebook-post' ? ['facebook'] :
                              ['twitter', 'linkedin'],
                    tone: 'engaging',
                    includeHashtags: true,
                    includeEmojis: false
                  }
                }

              // EMAIL CAMPAIGNS
              case 'email':
              case 'email-sequence':
              case 'newsletter':
                return {
                  service: `${SUPABASE_URL}/functions/v1/mcp-content`,
                  tool: 'generate_email_campaign',
                  arguments: {
                    campaignGoal: prompt,
                    targetAudience: 'subscribers',
                    numberOfEmails: contentType === 'email-sequence' ? 3 : 1,
                    emailTypes: contentType === 'newsletter' ? ['newsletter'] : ['announcement'],
                    personalizeFields: ['firstName'],
                    includePreheader: true
                  }
                }

              // EXECUTIVE & CRISIS
              case 'exec-statement':
              case 'keynote-speech':
              case 'earnings-script':
              case 'investor-letter':
              case 'internal-memo':
              case 'crisis-response':
                return {
                  service: `${SUPABASE_URL}/functions/v1/mcp-content`,
                  tool: 'generate_executive_statement',
                  arguments: {
                    topic: `${prompt}\n\nStrategy:\n${strategy}`,
                    keyPoints: keyPoints,
                    executiveName: "Leadership",
                    executiveTitle: "CEO",
                    tone: contentType === 'crisis-response' ? 'empathetic' : 'confident',
                    audience: contentType === 'investor-letter' ? 'investors' :
                             contentType === 'internal-memo' ? 'employees' : 'public'
                  }
                }

              // Q&A DOCUMENTS
              case 'qa-document':
              case 'interview-prep':
                return {
                  service: `${SUPABASE_URL}/functions/v1/mcp-content`,
                  tool: 'generate_qa_document',
                  arguments: {
                    topic: `${prompt}\n\nStrategy:\n${strategy}`,
                    questions: keyPoints.map(point => `What about ${point}?`),
                    audience: 'media',
                    style: 'conversational'
                  }
                }

              // MEDIA & PR
              case 'media-pitch':
              case 'media-kit':
              case 'op-ed':
              case 'bylined-article':
              case 'podcast-script':
                return {
                  service: `${SUPABASE_URL}/functions/v1/mcp-media`,
                  tool: 'generate_media_pitch',
                  arguments: {
                    angle: prompt,
                    targetOutlets: ['Major Publications'],
                    keyMessages: keyPoints,
                    supportingData: [],
                    exclusivity: false
                  }
                }

              // MESSAGING & CAMPAIGNS
              case 'messaging':
              case 'messaging-framework':
              case 'positioning':
              case 'talking-points':
              case 'campaign-plan':
                return {
                  service: `${SUPABASE_URL}/functions/v1/mcp-narratives`,
                  tool: 'generate_messaging_framework',
                  arguments: {
                    objective: prompt,
                    targetAudiences: ['primary', 'secondary'],
                    coreMessage: keyPoints[0] || prompt,
                    supportingPoints: keyPoints.slice(1),
                    proofPoints: [],
                    tone: 'professional'
                  }
                }

              // VISUAL CONTENT - Special handling
              case 'image':
              case 'infographic':
                return {
                  service: `${SUPABASE_URL}/functions/v1/vertex-ai-visual`,
                  tool: 'generate_image',
                  arguments: {
                    prompt: `${prompt}. Professional business image.`,
                    style: 'corporate',
                    aspectRatio: '16:9'
                  }
                }

              case 'video':
                return {
                  service: `${SUPABASE_URL}/functions/v1/vertex-ai-visual`,
                  tool: 'generate_video',
                  arguments: {
                    prompt: `${prompt}. Professional business video.`,
                    duration: 10
                  }
                }

              case 'presentation':
              case 'slide-deck':
                return {
                  service: `${SUPABASE_URL}/functions/v1/gamma-presentation`,
                  tool: 'generate_presentation',
                  arguments: {
                    topic: prompt,
                    outline: keyPoints,
                    slideCount: 10,
                    style: 'professional'
                  }
                }

              // SPECIALIZED CONTENT
              case 'case-study':
              case 'customer-story':
                return {
                  service: `${SUPABASE_URL}/functions/v1/mcp-content`,
                  tool: 'generate_blog_post',
                  arguments: {
                    title: `Customer Success: ${prompt}`,
                    topic: `${prompt}\n\nStrategy:\n${strategy}`,
                    outline: ['Challenge', 'Solution', 'Results', 'Impact'],
                    targetAudience: 'potential customers',
                    wordCount: 1000,
                    style: 'educational',
                    includeCTA: true
                  }
                }

              case 'event-promotion':
              case 'product-launch':
              case 'partnership-announcement':
              case 'award-announcement':
                return {
                  service: `${SUPABASE_URL}/functions/v1/mcp-content`,
                  tool: 'generate_press_release',
                  arguments: {
                    headline: prompt,
                    subheadline: `${org} ${contentType.replace('-', ' ')}`,
                    keyPoints: keyPoints,
                    quotes: [],
                    tone: 'exciting',
                    boilerplate: `About ${org}`
                  }
                }

              case 'landing-page-copy':
                return {
                  service: `${SUPABASE_URL}/functions/v1/mcp-content`,
                  tool: 'generate_blog_post',
                  arguments: {
                    title: 'Landing Page',
                    topic: `Create compelling landing page copy: ${prompt}\n\nStrategy:\n${strategy}`,
                    outline: ['Hero Section', 'Value Props', 'Features', 'CTA'],
                    targetAudience: 'website visitors',
                    wordCount: 500,
                    style: 'educational',
                    includeCTA: true
                  }
                }

              default:
                // Fallback to generic content generation
                return {
                  service: `${SUPABASE_URL}/functions/v1/mcp-content`,
                  tool: 'generate_blog_post',
                  arguments: {
                    title: prompt.substring(0, 100),
                    topic: `${prompt}\n\nStrategy:\n${strategy}`,
                    outline: keyPoints,
                    targetAudience: 'general',
                    wordCount: 800,
                    style: 'educational',
                    includeCTA: false
                  }
                }
            }
          }

          // Get the MCP mapping for this content type
          const mcpMapping = getMCPToolMapping(componentType, componentPrompt, currentStrategy)

          console.log(`Calling MCP service: ${mcpMapping.service} with tool: ${mcpMapping.tool}`)

          // Build the request in MCP format
          const mcpRequestBody = {
            tool: mcpMapping.tool,
            arguments: mcpMapping.arguments,
            conversation: messages.slice(-5).map(msg => ({
              role: msg.role,
              content: typeof msg.content === 'string' ? msg.content : msg.content?.text || ''
            }))
          }

          const response = await fetch(mcpMapping.service, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify(mcpRequestBody)
          })

          if (response.ok) {
            const result = await response.json()
            console.log(`✅ Generated ${componentType}:`, result)

            // Remove the status message
            setMessages(prev => prev.filter(msg => msg.id !== `msg-${Date.now()}-status-${componentType}`))

            // Extract actual content from the result
            let actualContent = result.content || result.text || result.message || result.generatedContent || result

            // Handle special content types
            if (componentType === 'social-post' && result.posts) {
              actualContent = result.posts
            } else if (componentType === 'email' && result.emails) {
              actualContent = result.emails
            } else if (componentType === 'presentation' && result.gammaUrl) {
              actualContent = result.gammaUrl
            }

            // Ensure we have actual content, not just metadata
            if (!actualContent || actualContent === componentType) {
              console.error(`No actual content generated for ${componentType}`)
              actualContent = `[Content generation pending for ${config.label}]`
            }

            // Create content item with proper structure and ACTUAL content
            const contentItem: ContentItem = {
              id: `content-${Date.now()}-${componentType}`,
              type: (componentType === 'press-release' ? 'press-release' :
                     componentType === 'social-post' ? 'social-post' :
                     componentType === 'twitter-thread' ? 'social-post' :
                     componentType === 'linkedin-article' ? 'text' :
                     componentType === 'instagram-caption' ? 'social-post' :
                     componentType === 'email' ? 'email' :
                     componentType === 'email-sequence' ? 'email' :
                     componentType === 'presentation' ? 'presentation' :
                     'text') as any,
              content: actualContent,
              title: `${config.label} - ${currentFolder}`,
              saved: false,
              timestamp: Date.now(),
              metadata: {
                createdAt: new Date(),
                service: 'niv-orchestrator-robust',
                organization: organization?.name,
                originalType: componentType,
                folder: currentFolder,
                strategy: currentStrategy // Include strategy in metadata
              } as any
            }

            // Add message with the generated content - show preview
            const previewContent = typeof actualContent === 'string'
              ? actualContent.substring(0, 200) + (actualContent.length > 200 ? '...' : '')
              : JSON.stringify(actualContent).substring(0, 200) + '...'

            setMessages(prev => [...prev, {
              id: `msg-${Date.now()}-${componentType}`,
              role: 'assistant',
              content: `✅ **${config.label} Generated**
📂 ${currentFolder}

**Preview:**
${previewContent}`,
              contentItem: contentItem,
              timestamp: new Date(),
              showActions: true
            }])

            // Track successfully generated components
            generatedComponents.push(config.label)

            // DO NOT auto-open in workspace - user will click if they want to open
            // Only store the content item for later access
            setCurrentContent(contentItem)

          } else {
            const errorText = await response.text()
            console.error(`Failed to generate ${componentType}:`, errorText)
            setMessages(prev => [...prev, {
              id: `msg-${Date.now()}`,
              role: 'assistant',
              content: `⚠️ Failed to generate ${config.label}: ${errorText.substring(0, 100)}`,
              timestamp: new Date(),
              error: true
            }])
          }
        } catch (error) {
          console.error(`Error generating ${componentType}:`, error)
          setMessages(prev => [...prev, {
            id: `msg-${Date.now()}`,
            role: 'assistant',
            content: `❌ Error generating ${config.label}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            timestamp: new Date(),
            error: true
          }])
        }

        // Small delay between components to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1500))
      }

      // All components generated - Create and save the folder
      const folderSummary = {
        id: `folder-${Date.now()}`,
        role: 'assistant',
        content: `✅ **Content generation complete!**

📂 **Folder: ${currentFolder}**

**Generated Components (${generatedComponents.length}):**
${generatedComponents.map(label => `• ${label} ✓`).join('\n')}

**Actions Available:**
- Click "Save" on each component to save to Memory Vault
- Click "Open in Workspace" to edit any component
- All components are organized in the folder: "${currentFolder}"

All content was generated using your approved strategy and the appropriate MCP tools.`,
        timestamp: new Date(),
        metadata: {
          folderComplete: true,
          folderName: currentFolder
        }
      }

      setMessages(prev => [...prev, folderSummary])

      // Auto-save folder metadata to Memory Vault
      try {
        const folderMetadata = {
          organization_id: organization?.id || 'default',
          content_type: 'folder',
          title: currentFolder,
          content: {
            strategy: currentStrategy,
            components: pendingComponents.map(c => ({
              type: c,
              label: CONTENT_SERVICE_MAP[c as keyof typeof CONTENT_SERVICE_MAP]?.label || c,
              status: 'generated'
            })),
            createdAt: new Date().toISOString()
          },
          metadata: {
            generatedBy: 'niv',
            timestamp: new Date().toISOString(),
            deliverableType: 'multi-part',
            totalComponents: pendingComponents.length
          },
          tags: ['niv-generated', 'folder', currentFolder],
          status: 'complete',
          created_by: 'niv'
        }

        const response = await fetch(`${SUPABASE_URL}/functions/v1/niv-memory-vault?action=save`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({ content: folderMetadata })
        })

        if (response.ok) {
          console.log('✅ Folder metadata saved to Memory Vault')
        }
      } catch (error) {
        console.error('Error saving folder metadata:', error)
      }

      setIsGeneratingMultiple(false)
      setPendingComponents([])
      setCurrentStrategy(null) // Clear strategy after completion

    } catch (error) {
      console.error('Error generating components:', error)
      setMessages(prev => [...prev, {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: `❌ Error generating components: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        error: true
      }])
      setIsGeneratingMultiple(false)
      setPendingComponents([])
    } finally {
      setIsThinking(false)
    }
  }

  // Handle single content response with folder context
  const handleSingleContentResponseWithFolder = (result: any, contentType: string, config: any, prompt: string, folderName: string) => {
    // Use existing handleSingleContentResponse logic but add folder metadata
    const typeMap: Record<string, string> = {
      'press-release': 'press-release',
      'media-pitch': 'text',
      'talking-points': 'text',
      'messaging': 'text',
      'campaign-plan': 'text',
      'crisis-response': 'text',
      'internal-memo': 'text',
      'blog-post': 'text',
      'social-post': 'social-post',
      'email': 'email',
      'email-sequence': 'email',
      'presentation': 'presentation'
    }

    const textContent = result.content || result.text || result.message || 'Content generated'
    const contentItem: ContentItem = {
      id: `content-${Date.now()}`,
      type: (typeMap[contentType] || 'text') as any,
      content: textContent,
      title: `${config.label} - ${folderName}`,
      saved: false,
      timestamp: Date.now(),
      metadata: {
        createdAt: new Date(),
        service: 'niv-orchestrator-robust',
        organization: organization?.name,
        originalType: contentType,
        prompt: prompt,
        folder: folderName  // Add folder metadata
      } as any
    }

    setCurrentContent(contentItem)

    // Add message with the generated content
    setMessages(prev => [...prev, {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: `✅ **${config.label} Generated**\n📂 ${folderName}`,
      contentItem: contentItem,
      timestamp: new Date(),
      showActions: true
    }])

    if (onContentGenerated) {
      onContentGenerated(contentItem)
    }
  }

  // Generate content using the new intelligent orchestrator
  const generateContent = async (contentType: string, prompt: string) => {
    const config = CONTENT_SERVICE_MAP[contentType as keyof typeof CONTENT_SERVICE_MAP]
    if (!config) return

    // Handle empty or generic prompts
    if (!prompt || prompt.trim() === '' ||
        prompt.toLowerCase() === 'create' ||
        prompt.toLowerCase() === 'generate' ||
        prompt.toLowerCase() === 'make') {
      // Create default prompts based on content type
      if (contentType === 'presentation' || contentType === 'slide-deck') {
        prompt = framework?.strategy?.objective || framework?.core?.objective || 'Company Overview Presentation'
      } else if (contentType === 'image' || contentType === 'infographic') {
        prompt = framework?.strategy?.narrative || framework?.core?.narrative || 'Professional business image'
      } else if (contentType === 'video') {
        prompt = framework?.strategy?.objective || 'Corporate introduction video'
      } else {
        prompt = framework?.strategy?.objective || framework?.core?.objective || 'Create professional content'
      }
    }

    setIsThinking(true)

    try {
      // Use the intelligent orchestrator for ALL content types
      console.log('Using intelligent orchestrator for content generation')

      // Include conversation history for context
      const conversationHistory = messages.slice(-20)

      const requestBody = {
        prompt: prompt,
        contentType: contentType,
        // Include more conversation history for better context (20-30 messages)
        conversation: conversationHistory.map(msg => ({
          role: msg.role,
          content: typeof msg.content === 'string' ? msg.content : msg.content?.text || ''
        })),
        organization: {
          id: organization?.id || 'default',
          name: organization?.name || 'Default Organization'
        },
        framework: framework || null,
        mode: determineMode(prompt, contentType), // Determine the mode based on request
        multiPart: isGeneratingMultiple ? {
          folder: currentFolder,
          pendingComponents: pendingComponents
        } : null
      }

      console.log(`Calling intelligent orchestrator for ${contentType}`)
      console.log('Request body:', JSON.stringify(requestBody, null, 2))

      const response = await fetch(`${SUPABASE_URL}/functions/v1/niv-content-robust`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          message: requestBody.prompt,
          conversationId: requestBody.conversationId || `conv-${Date.now()}`,
          conversationHistory: requestBody.conversation || [],
          context: {
            organization: requestBody.organization || {
              name: 'Company',
              industry: 'Technology'
            },
            requestedContentType: contentType
          }
        })
      })

      if (response.ok) {
        const result = await response.json()

        // Handle the orchestrator response
        handleOrchestratorResponse(result, contentType, config, prompt)

      } else {
        const errorText = await response.text()
        console.error('Orchestrator error:', errorText)
        throw new Error(`Service returned ${response.status}: ${errorText}`)
      }
    } catch (error) {
      console.error('Error generating content:', error)
      setMessages(prev => [...prev, {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: `❌ Error generating ${config.label}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        error: true
      }])
    } finally {
      setIsThinking(false)
    }
  }

  // Helper function to determine orchestration mode
  const determineMode = (prompt: string, contentType: string): string => {
    const lowerPrompt = prompt.toLowerCase()

    // Check if this is a continuation/refinement of existing work
    if (lowerPrompt.includes('add') || lowerPrompt.includes('also') ||
        lowerPrompt.includes('more') || lowerPrompt.includes('change') ||
        lowerPrompt.includes('update') || lowerPrompt.includes('edit') ||
        lowerPrompt.includes('revise') || lowerPrompt.includes('improve')) {
      return 'companion'  // Use companion mode for iterative refinement
    }

    // Check for campaign/plan keywords
    if (lowerPrompt.includes('campaign') || lowerPrompt.includes('plan') ||
        lowerPrompt.includes('strategy') || lowerPrompt.includes('media list')) {
      return 'campaign'
    }

    // Check for presentation keywords
    if (contentType === 'presentation' || contentType === 'slide-deck' ||
        lowerPrompt.includes('presentation') || lowerPrompt.includes('deck')) {
      return 'presentation'
    }

    // Check for suite keywords
    if (lowerPrompt.includes('suite') || lowerPrompt.includes('multiple') ||
        lowerPrompt.includes('package') || lowerPrompt.includes('all')) {
      return 'suite'
    }

    // Default to single content
    return 'single'
  }

  // Helper function to handle orchestrator response
  const handleOrchestratorResponse = (result: any, contentType: string, config: any, prompt: string) => {
    try {
      // Check if this is a multi-content response (campaign/suite)
      if (result.type === 'campaign' || result.type === 'suite' || result.type === 'plan') {
        // Handle multi-content response
        const contentItems = result.components || result.assets || []

        // Create folder name for this campaign/suite
        const folderName = result.name || `${result.type.charAt(0).toUpperCase() + result.type.slice(1)} - ${new Date().toLocaleDateString()}`

        // Create a summary message with all generated content
        let summaryMessage = `📂 **Created ${folderName}**\n\n`

        if (result.strategy) {
          summaryMessage += `**Strategy:**\n${result.strategy.objectives?.join(', ') || ''}\n\n`
        }

        if (contentItems.length > 0) {
          summaryMessage += `**Generated Assets:**\n`

          // Generate each component as a separate message
          contentItems.forEach((item: any, index: number) => {
            summaryMessage += `• ${item.type || item.label}: ${item.title || 'Ready'}\n`

            // Create individual content item for each component
            const componentItem: ContentItem = {
              id: `content-${Date.now()}-${index}`,
              type: item.type || 'text',
              content: item.content || item,
              title: item.title || `${item.type} - ${folderName}`,
              saved: false,
              timestamp: Date.now(),
              metadata: {
                createdAt: new Date(),
                organization: organization?.name,
                originalType: item.type,
                folder: folderName,
                prompt: prompt
              } as any
            }

            // Add each component as a separate message
            setTimeout(() => {
              setMessages(prev => [...prev, {
                id: `msg-${Date.now()}-${index}`,
                role: 'assistant',
                content: `✅ **${item.type || item.label} Generated**\n📂 ${folderName}`,
                contentItem: componentItem,
                timestamp: new Date(),
                showActions: true
              }])

              // Notify parent about each component
              if (onContentGenerated) {
                onContentGenerated(componentItem)
              }
            }, index * 500) // Stagger the messages slightly
          })
        }

        // Add the summary message
        setMessages(prev => [...prev, {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: summaryMessage,
          timestamp: new Date()
        }])

      } else {
        // Handle single content response - use existing logic
        handleSingleContentResponse(result, contentType, config, prompt)
      }
    } catch (error) {
      console.error('Error handling orchestrator response:', error)
      throw error
    }
  }

  // Helper function to handle single content responses
  const handleSingleContentResponse = (result: any, contentType: string, config: any, prompt: string) => {

    // Map ALL content types to workspace-compatible types
    const typeMap: Record<string, string> = {
      // Written Content
      'press-release': 'press-release',
      'blog-post': 'text',
      'thought-leadership': 'text',
      'case-study': 'text',
      'white-paper': 'text',
      'ebook': 'text',
      'qa-document': 'text',

      // Social & Digital
      'social-post': 'social-post',
      'linkedin-article': 'text',
      'twitter-thread': 'social-post',
      'instagram-caption': 'social-post',
      'facebook-post': 'social-post',

      // Email & Communications
      'email': 'email',
      'newsletter': 'email',
      'email-sequence': 'email',
      'internal-memo': 'text',

      // Executive & Strategic
      'exec-statement': 'text',
      'keynote-speech': 'text',
      'earnings-script': 'text',
      'investor-letter': 'text',

      // Media & PR
      'media-pitch': 'text',
      'media-kit': 'text',
      'op-ed': 'text',
      'bylined-article': 'text',
      'podcast-script': 'text',
      'interview-prep': 'text',

      // Visual Content
      'image': 'image',
      'video': 'video',
      'presentation': 'presentation',
      'infographic': 'image',
      'slide-deck': 'presentation',

      // Strategic & Messaging
      'messaging': 'text',
      'messaging-framework': 'text',
      'positioning': 'text',
      'talking-points': 'text',
      'campaign-plan': 'text',

      // Specialized
      'crisis-response': 'text',
      'product-launch': 'text',
      'event-promotion': 'text',
      'customer-story': 'text',
      'partnership-announcement': 'text',
      'award-announcement': 'text',
      'landing-page-copy': 'text'
    }

    // Handle different response formats
    let content: any
    let contentMessage: any

    if (contentType === 'image' || contentType === 'infographic') {
      // Handle image response - check for messages array format from niv-content-robust
      if (result.messages && Array.isArray(result.messages)) {
        // Process acknowledgment messages first
        result.messages.forEach((msg: any) => {
          if (msg.type === 'acknowledgment' && msg.message) {
            setMessages(prev => [...prev, {
              id: `msg-${Date.now()}-ack`,
              role: 'assistant',
              content: msg.message,
              timestamp: new Date()
            }])
          }
        })

        // Find the content message with the image URL
        const contentMsg = result.messages.find((msg: any) => msg.type === 'content' && msg.content)
        if (contentMsg && contentMsg.content) {
          content = contentMsg.content
          const imageContentItem: ContentItem = {
            id: `content-${Date.now()}`,
            type: 'image',
            content: content,
            saved: false,
            timestamp: Date.now(),
            metadata: {
              createdAt: new Date(),
              service: 'niv-content-robust',
              organization: organization?.name,
              originalType: contentType,
              prompt: prompt
            } as any
          }
          setCurrentContent(imageContentItem)
          contentMessage = {
            id: `msg-${Date.now()}`,
            role: 'assistant',
            content: `✅ Created your ${config.label}!`,
            contentItem: imageContentItem,
            timestamp: new Date(),
            showActions: true
          }
        }
      } else if (result.images && result.images.length > 0) {
        content = result.images[0].url
        const imageContentItem: ContentItem = {
          id: `content-${Date.now()}`,
          type: 'image',
          content: content,
          saved: false,
          timestamp: Date.now(),
          metadata: {
            createdAt: new Date(),
            service: 'niv-orchestrator-robust',
            organization: organization?.name,
            originalType: contentType,
            prompt: prompt
          } as any
        }
        setCurrentContent(imageContentItem)
        contentMessage = {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: `✅ Created your ${config.label}!`,
          contentItem: imageContentItem,
          timestamp: new Date(),
          showActions: true
        }
      } else if (result.fallback) {
        // Handle fallback case
        contentMessage = {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: `⚠️ Image generation unavailable. Here's a visual brief instead:\n\n${result.fallback.content}`,
          timestamp: new Date()
        }
      } else {
        throw new Error('No image generated')
      }
    } else if (contentType === 'video') {
      // Handle video response
      if (result.videos && result.videos.length > 0) {
        content = result.videos[0].url
      } else if (result.fallback) {
        content = result.fallback.content
      } else {
        content = result.content || 'Video generation pending'
      }
      const videoContentItem: ContentItem = {
        id: `content-${Date.now()}`,
        type: 'video',
        content: content,
        saved: false,
        timestamp: Date.now(),
        metadata: {
          createdAt: new Date(),
          service: 'niv-orchestrator-robust',
          organization: organization?.name,
          originalType: contentType
        } as any
      }
      setCurrentContent(videoContentItem)
      contentMessage = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: result.videos ? `✅ Created your ${config.label}!` : `⚠️ Video script created:\n\n${content}`,
        contentItem: videoContentItem,
        timestamp: new Date(),
        showActions: true
      }
    } else if (contentType === 'presentation' || contentType === 'slide-deck') {
      // Handle Gamma presentation response
      if (result.status === 'pending') {
        contentMessage = {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: `⏳ Creating your presentation...\n\nThis usually takes 30-60 seconds. I'll let you know when it's ready!`,
          timestamp: new Date(),
          showActions: false
        }
        if (result.generationId) {
          startPresentationPolling(result.generationId, null)
        }
      } else {
        const presentationItem: ContentItem = {
          id: `content-${Date.now()}`,
          type: 'presentation',
          content: result.gammaUrl || '',
          saved: false,
          timestamp: Date.now(),
          metadata: {
            createdAt: new Date(),
            service: 'niv-orchestrator-robust',
            organization: organization?.name,
            originalType: contentType,
            generationId: result.generationId,
            gammaUrl: result.gammaUrl,
            status: 'completed'
          } as any
        }
        setCurrentContent(presentationItem)
        contentMessage = {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: `✅ Created your ${config.label}!`,
          contentItem: presentationItem,
          timestamp: new Date(),
          showActions: true
        }
      }
    } else if (contentType === 'social-post') {
      // Handle social posts
      const socialContent = result.posts || result.content
      const socialItem: ContentItem = {
        id: `content-${Date.now()}`,
        type: 'social-post',
        content: socialContent,
        saved: false,
        timestamp: Date.now(),
        metadata: {
          createdAt: new Date(),
          service: 'niv-orchestrator-robust',
          organization: organization?.name,
          originalType: contentType,
          prompt: prompt
        } as any
      }
      setCurrentContent(socialItem)
      contentMessage = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: `✅ Created your social posts!`,
        contentItem: socialItem,
        timestamp: new Date(),
        showActions: true
      }
    } else if (contentType === 'email' || contentType === 'newsletter' || contentType === 'email-sequence') {
      // Handle email content
      const emailContent = result.emails || result.content
      const emailItem: ContentItem = {
        id: `content-${Date.now()}`,
        type: 'email',
        content: emailContent,
        saved: false,
        timestamp: Date.now(),
        metadata: {
          createdAt: new Date(),
          service: 'niv-orchestrator-robust',
          organization: organization?.name,
          originalType: contentType
        } as any
      }
      setCurrentContent(emailItem)
      contentMessage = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: `✅ Created your ${config.label}!`,
        contentItem: emailItem,
        timestamp: new Date(),
        showActions: true
      }
    } else {
      // Handle all text content
      const textContent = result.content || result.text || result.message || 'Content generated'
      const textItem: ContentItem = {
        id: `content-${Date.now()}`,
        type: typeMap[contentType] || 'text',
        content: textContent,
        title: result.title || prompt.substring(0, 100),
        saved: false,
        timestamp: Date.now(),
        metadata: {
          createdAt: new Date(),
          service: 'niv-orchestrator-robust',
          organization: organization?.name,
          originalType: contentType,
          prompt: prompt
        } as any
      }
      setCurrentContent(textItem)
      contentMessage = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: `✅ Created your ${config.label}!`,
        contentItem: textItem,
        timestamp: new Date(),
        showActions: true
      }
    }

    // Add the message to chat
    if (contentMessage) {
      setMessages(prev => [...prev, contentMessage])
      if (onContentGenerated && contentMessage.contentItem) {
        onContentGenerated(contentMessage.contentItem)
      }
    }
  }

  // Poll for Gamma presentation status
  const startPresentationPolling = async (generationId: string, contentItem: ContentItem | null) => {
    console.log('🔄 Starting presentation status polling for:', generationId)

    let attempts = 0
    const maxAttempts = 30  // Poll for up to 2 minutes (30 * 4 seconds)

    const pollInterval = setInterval(async () => {
      attempts++

      try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/gamma-presentation/status/${generationId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
          }
        })

        if (response.ok) {
          const status = await response.json()

          if (status.status === 'completed' && status.gammaUrl) {
            console.log('✅ Presentation ready:', status.gammaUrl)

            // Create the content item now that presentation is ready
            const presentationItem: ContentItem = {
              id: `content-${Date.now()}`,
              type: 'presentation',
              content: status.gammaUrl,  // Just store the URL
              saved: false,
              timestamp: Date.now(),
              metadata: {
                createdAt: new Date(),
                service: 'gamma-presentation',
                organization: organization?.name,
                originalType: 'presentation',
                generationId: generationId,
                gammaUrl: status.gammaUrl,
                exportUrls: status.exportUrls,
                status: 'completed'
              } as any
            }

            setCurrentContent(presentationItem)

            // Add success message with clickable link
            setMessages(prev => [...prev, {
              id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              role: 'assistant',
              content: `✅ **Your presentation is ready!**\n\n🔗 **[Open Presentation](${status.gammaUrl})**\n\n💡 You can export to PowerPoint or PDF directly from Gamma.`,
              contentItem: presentationItem,
              timestamp: new Date(),
              showActions: true  // Show actions now
            }])

            // Now trigger onContentGenerated to show workspace
            if (onContentGenerated) {
              onContentGenerated(presentationItem)
            }

            clearInterval(pollInterval)
          }
        }
      } catch (error) {
        console.error('Polling error:', error)
      }

      if (attempts >= maxAttempts) {
        console.log('⏱️ Polling timeout reached')
        setMessages(prev => [...prev, {
          id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          role: 'assistant',
          content: `⏱️ Presentation generation is taking longer than expected. Generation ID: ${generationId}`,
          timestamp: new Date()
        }])
        clearInterval(pollInterval)
      }
    }, 4000)  // Poll every 4 seconds
  }

  // Handle save to Memory Vault
  const handleSave = async (content: ContentItem) => {
    try {
      // Include folder in tags if present for organization
      const tags = [content.type, 'niv-generated']
      let folderName = content.metadata?.folder

      // If no folder, check if this is part of a multi-part generation
      if (!folderName && isGeneratingMultiple) {
        folderName = currentFolder
      }

      if (folderName) {
        tags.push(folderName)
      }

      // Save to Memory Vault edge function (which handles all content types now)
      const response = await fetch(`${SUPABASE_URL}/functions/v1/niv-memory-vault?action=save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          content: {
            organization_id: organization?.id || 'default',
            content_type: content.metadata?.originalType || content.type,
            title: content.title || `${content.type} - ${new Date().toLocaleDateString()}`,
            content: content.content,
            metadata: {
              ...content.metadata,
              generatedBy: 'niv',
              timestamp: new Date().toISOString(),
              prompt_used: content?.metadata?.prompt,
              model_used: 'claude-3-sonnet',
              framework_data: framework,
              folder: content.metadata?.folder // Include folder in metadata
            },
            tags: tags,
            status: 'saved',
            created_by: 'niv'
          }
        })
      })

      if (response.ok) {
        setMessages(prev => [...prev, {
          id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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
      {/* Multi-part Generation Status */}
      {isGeneratingMultiple && pendingComponents.length > 0 && (
        <div className="bg-blue-50 border-b border-blue-200 p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <FolderPlus className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">
                Generating Multiple Components
              </span>
            </div>
            {currentFolder && (
              <span className="text-xs text-blue-600">
                Folder: {currentFolder}
              </span>
            )}
          </div>
          <div className="text-xs text-blue-700">
            <ChevronRight className="w-3 h-3 inline" />
            Pending: {pendingComponents.join(', ')}
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <Sparkles className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">NIV Content Orchestrator</h3>
            <p className="text-gray-400">
              I create content using your real Supabase edge functions.
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
                            : msg.contentItem.content.url}
                          alt={msg.contentItem.title}
                          className="w-full h-auto rounded-lg max-h-96 object-contain"
                        />
                      </div>
                    ) : msg.contentItem.type === 'video' ? (
                      <div className="p-4">
                        <video
                          src={typeof msg.contentItem.content === 'string'
                            ? msg.contentItem.content
                            : msg.contentItem.content.url}
                          controls
                          className="w-full max-h-96 rounded-lg"
                        />
                      </div>
                    ) : msg.contentItem.type === 'presentation' ? (
                      <div className="p-4">
                        <a
                          href={typeof msg.contentItem.content === 'string'
                            ? msg.contentItem.content
                            : msg.contentItem.content.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300"
                        >
                          📊 Open Presentation
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
                          Save
                        </button>
                        <button
                          onClick={() => {
                            // Pass the content to parent to open in workspace - user must click
                            if (onContentGenerated) {
                              onContentGenerated(msg.contentItem)
                            }
                          }}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-md flex items-center gap-1.5"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          Open in Workspace
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