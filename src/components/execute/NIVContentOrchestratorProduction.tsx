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
  Search,
  Zap
} from 'lucide-react'
import type { NivStrategicFramework } from '@/types/niv-strategic-framework'
import type { ContentItem } from '@/types/content'
import { useAppStore } from '@/stores/useAppStore'

// Content Routing Map - Maps content types to services
const CONTENT_ROUTING_MAP: Record<string, {
  service: string
  complexity: 'simple' | 'medium' | 'complex'
  workflow: 'direct' | 'orchestrated'
  api?: string
  tool?: string
  outputs?: string[]
}> = {
  'media-plan': {
    service: 'niv-content-intelligent-v2',
    complexity: 'complex',
    workflow: 'orchestrated',
    outputs: ['press-release', 'media-list', 'media-pitch', 'qa-document', 'social-posts']
  },
  'campaign': {
    service: 'niv-content-intelligent-v2',
    complexity: 'complex',
    workflow: 'orchestrated',
    outputs: ['multiple-pieces']
  },
  'presentation': {
    service: 'niv-content-intelligent-v2',
    complexity: 'complex',
    workflow: 'orchestrated'
  },
  'deck': {
    service: 'gamma-presentation',
    complexity: 'medium',
    workflow: 'direct',
    api: 'gamma'
  },
  'image': {
    service: 'vertex-ai-visual',
    complexity: 'simple',
    workflow: 'direct',
    api: 'vertex'
  },
  'visual': {
    service: 'vertex-ai-visual',
    complexity: 'simple',
    workflow: 'direct',
    api: 'vertex'
  },
  'video': {
    service: 'vertex-ai-visual',
    complexity: 'medium',
    workflow: 'direct',
    api: 'veo'
  },
  'social-post': {
    service: 'mcp-content',
    complexity: 'simple',
    workflow: 'direct',
    tool: 'generate_social_posts'
  },
  'press-release': {
    service: 'mcp-content',
    complexity: 'simple',
    workflow: 'direct',
    tool: 'generate_press_release'
  },
  'article': {
    service: 'mcp-content',
    complexity: 'simple',
    workflow: 'direct',
    tool: 'generate_article'
  },
  'email': {
    service: 'mcp-content',
    complexity: 'simple',
    workflow: 'direct',
    tool: 'generate_email'
  },
  'crisis-response': {
    service: 'niv-content-intelligent-v2',
    complexity: 'complex',
    workflow: 'orchestrated'
  }
}

// Content Routing Agent
class ContentRoutingAgent {
  static route(contentType: string, userMessage: string, context: any) {
    const route = CONTENT_ROUTING_MAP[contentType]

    if (!route) {
      // Unknown type - use orchestrator to figure it out
      return {
        service: 'niv-content-intelligent-v2',
        handler: 'handleComplexContent',
        metadata: { contentType, unknown: true }
      }
    }

    switch (route.workflow) {
      case 'orchestrated':
        return {
          service: route.service,
          handler: 'handleComplexContent',
          metadata: route
        }

      case 'direct':
        if (route.api === 'gamma') {
          return {
            service: route.service,
            handler: 'handleGammaPresentation',
            metadata: route
          }
        } else if (route.api === 'vertex') {
          return {
            service: route.service,
            handler: 'handleVertexImage',
            metadata: route
          }
        } else if (route.api === 'veo') {
          return {
            service: route.service,
            handler: 'handleVertexVideo',
            metadata: route
          }
        } else if (route.tool) {
          return {
            service: route.service,
            handler: 'handleMCPContent',
            tool: route.tool,
            metadata: route
          }
        }
        break
    }

    // Fallback
    return {
      service: 'niv-content-intelligent-v2',
      handler: 'handleComplexContent',
      metadata: route
    }
  }
}

// Content Concept State - Like NIVOrchestratorRobust
interface ContentConceptState {
  conversationId: string
  stage: 'exploring' | 'defining' | 'researching' | 'creating' | 'refining' | 'complete'

  contentConcept: {
    type?: string
    purpose?: string
    audience?: string[]
    tone?: string
    keyMessages?: string[]
    distribution?: string[]
    deadline?: string
    constraints?: string[]
  }

  // Orchestration context from framework/opportunity
  orchestrationContext?: {
    framework?: NivStrategicFramework
    opportunity?: any
    playbook?: any
    priorityLevel?: 'immediate' | 'high' | 'medium' | 'low'
  }

  // Track conversation
  elementsDiscussed: string[]
  elementsConfirmed: string[]
  elementsNeeded: string[]

  // Research and intelligence
  researchHistory: any[]
  competitiveContext?: any

  // User preferences
  userPreferences: {
    wants: string[]
    doesNotWant: string[]
    examples: string[]
    brandGuidelines?: any
  }

  // Full conversation
  fullConversation: Array<{
    role: 'user' | 'assistant' | 'system'
    content: string
    timestamp: Date
    metadata?: any
  }>

  // Generated content
  generatedContent: Array<{
    id: string
    type: string
    content: any
    metadata: any
    timestamp: number
    saved: boolean
  }>

  confidence: number
  lastUpdate: number
}

// Content mode expertise mapping
const CONTENT_MODE_EXPERTISE: Record<string, {
  expertise: string
  questions: string[]
  structure?: string[]
  considerations?: string[]
  urgency?: string
}> = {
  'press-release': {
    expertise: 'AP style, newsworthiness, journalist perspective',
    questions: [
      "What's the news angle - product, partnership, milestone, or crisis?",
      "Who are the key stakeholders we need to quote?",
      "What data points or proof can we include?",
      "Is there an embargo date or immediate release?"
    ],
    structure: ['headline', 'subhead', 'lead', 'body', 'boilerplate', 'contact']
  },
  'social-post': {
    expertise: 'Platform optimization, engagement, viral mechanics',
    questions: [
      "Which platforms - LinkedIn, Twitter, Instagram, TikTok?",
      "What's the core message or moment?",
      "Should we include visuals or video?",
      "Any hashtags or mentions to include?"
    ],
    considerations: ['character limits', 'platform tone', 'optimal timing']
  },
  'image': {
    expertise: 'Visual composition, brand aesthetics, usage rights',
    questions: [
      "What's the concept or scene you envision?",
      "Is this for social, web, print, or presentation?",
      "Any brand colors or style guidelines?",
      "Should it include text or be purely visual?"
    ]
  },
  'crisis-response': {
    expertise: 'Crisis comms, stakeholder management, reputation',
    questions: [
      "What's the situation and how urgent?",
      "Who are the affected stakeholders?",
      "What actions are we taking to address it?",
      "Do we need legal review before publishing?"
    ],
    urgency: 'IMMEDIATE'
  }
}

interface NIVContentOrchestratorProps {
  framework?: NivStrategicFramework
  opportunity?: any
  selectedContentType?: string
  onContentGenerated?: (content: ContentItem) => void
  onContentSave?: (content: ContentItem) => void
  onQueueUpdate?: (items: any[]) => void
  className?: string
}

export default function NIVContentOrchestratorProduction({
  framework,
  opportunity,
  selectedContentType,
  onContentGenerated,
  onContentSave,
  onQueueUpdate,
  className = ''
}: NIVContentOrchestratorProps) {
  const { organization } = useAppStore()
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  // UI state for routing responses
  const [showNarrativeSelector, setShowNarrativeSelector] = useState(false)
  const [narrativeOptions, setNarrativeOptions] = useState<any[]>([])
  const [generatedContent, setGeneratedContent] = useState<any[]>([])

  // Content concept state management
  const [conceptState, setConceptState] = useState<ContentConceptState>({
    conversationId: `conv-${Date.now()}`,
    stage: 'exploring',
    contentConcept: {},
    elementsDiscussed: [],
    elementsConfirmed: [],
    elementsNeeded: [],
    researchHistory: [],
    userPreferences: {
      wants: [],
      doesNotWant: [],
      examples: []
    },
    fullConversation: [],
    generatedContent: [],
    confidence: 0,
    lastUpdate: Date.now()
  })

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Handle content type selection - IMMEDIATE ACKNOWLEDGMENT
  useEffect(() => {
    if (selectedContentType) {
      const modeConfig = CONTENT_MODE_EXPERTISE[selectedContentType]

      // Update concept state
      setConceptState(prev => ({
        ...prev,
        contentConcept: { ...prev.contentConcept, type: selectedContentType },
        stage: 'defining',
        elementsNeeded: ['purpose', 'audience', 'key messages']
      }))

      // Build acknowledgment message
      let acknowledgment = ''
      switch(selectedContentType) {
        case 'press-release':
          acknowledgment = "I'll help you create a press release. What's the announcement - product launch, partnership, milestone, or something else?"
          break
        case 'social-post':
          acknowledgment = "Perfect! I'll create social media content. What's the message or moment we're sharing? And which platforms - LinkedIn, Twitter, Instagram?"
          break
        case 'image':
          acknowledgment = "I'll create an image using Google Imagen through our visual service. Describe what you envision - the concept, style, and purpose."
          break
        case 'video':
          acknowledgment = "I'll generate a video using Google Veo. What's the story or message? How long should it be?"
          break
        case 'presentation':
          acknowledgment = "I'll create a presentation using Gamma. What's the topic and who's your audience?"
          break
        case 'crisis-response':
          acknowledgment = "I understand the urgency. Let's craft a crisis response immediately. What's the situation and who are we addressing?"
          break
        case 'email':
          acknowledgment = "I'll create an email campaign. What's the purpose - announcement, newsletter, or nurture sequence? Who's the audience?"
          break
        default:
          acknowledgment = `I'll help you create ${selectedContentType}. ${modeConfig?.questions[0] || 'What do you need?'}`
      }

      // Add acknowledgment message
      setMessages([{
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: acknowledgment,
        timestamp: new Date(),
        metadata: {
          contentType: selectedContentType,
          expertise: modeConfig?.expertise
        }
      }])
    }
  }, [selectedContentType])

  // Handle framework activation
  useEffect(() => {
    if (framework && !conceptState.orchestrationContext?.framework) {
      console.log('NIV: Framework received:', framework)

      // Update concept state with framework
      setConceptState(prev => ({
        ...prev,
        orchestrationContext: {
          ...prev.orchestrationContext,
          framework,
          priorityLevel: framework.strategy?.urgency || 'medium'
        },
        stage: 'creating'
      }))

      // Populate queue from framework content needs
      if (framework.strategy?.content_needs?.priority_content) {
        const queueItems = framework.strategy.content_needs.priority_content.map((item: string, idx: number) => ({
          id: `queue-${Date.now()}-${idx}`,
          content: item,
          priority: 'high',
          source: 'framework',
          status: 'pending'
        }))

        if (onQueueUpdate) {
          onQueueUpdate(queueItems)
        }

        // Acknowledge framework
        const frameworkMessage = {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: `I've received the strategic framework for "${framework.strategy.objective}". I can see ${queueItems.length} priority content pieces to create. Would you like to start with the first one or bulk generate all?`,
          timestamp: new Date(),
          metadata: {
            framework: true,
            queueItems
          }
        }

        setMessages(prev => [...prev, frameworkMessage])
      }
    }
  }, [framework])

  // Handle opportunity execution
  useEffect(() => {
    if (opportunity && !conceptState.orchestrationContext?.opportunity) {
      console.log('NIV: Opportunity received:', opportunity)

      // Update concept state with opportunity
      setConceptState(prev => ({
        ...prev,
        orchestrationContext: {
          ...prev.orchestrationContext,
          opportunity,
          playbook: opportunity.playbook,
          priorityLevel: opportunity.urgency || 'high'
        },
        stage: 'creating'
      }))

      // Auto-execute playbook if it exists
      if (opportunity.playbook) {
        executeOpportunityPlaybook(opportunity)
      }
    }
  }, [opportunity])

  // Scroll to bottom - only within the chat container, not the entire page
  useEffect(() => {
    // Instead of scrollIntoView which can jump the whole page,
    // we'll scroll the chat container itself
    const chatContainer = messagesEndRef.current?.parentElement
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight
    }
  }, [messages])

  // Execute opportunity playbook
  const executeOpportunityPlaybook = async (opp: any) => {
    const { playbook, category } = opp

    const oppMessage = {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: `Executing ${category} opportunity: "${opp.title}". I'll create content for ${playbook.channels.join(', ')} with your key messages.`,
      timestamp: new Date(),
      metadata: { opportunity: true }
    }

    setMessages(prev => [...prev, oppMessage])

    // Generate content for each channel
    for (const channel of playbook.channels) {
      await generateContentForChannel(channel, {
        keyMessages: playbook.key_messages,
        audience: playbook.target_audience,
        template: playbook.template_id
      })
    }
  }

  // MCP Orchestration - determine which MCPs to use
  const selectMCPs = (intent: any, contentType?: string) => {
    const mcps: string[] = []

    // Research MCPs
    if (intent.requiresResearch || intent.competitive) {
      mcps.push('niv-fireplexity')
    }

    // Content generation MCPs based on type
    const type = contentType || conceptState.contentConcept.type
    switch(type) {
      case 'press-release':
      case 'thought-leadership':
      case 'qa-doc':
        mcps.push('mcp-content')
        break
      case 'social-post':
        mcps.push('mcp-social')
        break
      case 'email':
        mcps.push('mcp-campaigns')
        break
      case 'crisis-response':
        mcps.push('mcp-crisis')
        break
      case 'media-pitch':
        mcps.push('mcp-media')
        break
      case 'messaging':
        mcps.push('mcp-narratives')
        break
      case 'image':
        mcps.push('vertex-ai-visual')
        break
      case 'video':
        mcps.push('google-visual-generation')
        break
      case 'presentation':
        mcps.push('gamma-presentation')
        break
    }

    // Storage MCPs
    mcps.push('niv-memory-vault', 'content-library')

    return mcps
  }

  // Detect user intent from message
  const detectIntent = (message: string) => {
    const lower = message.toLowerCase()

    return {
      isGenerationRequest:
        lower.includes('create') ||
        lower.includes('make') ||
        lower.includes('generate') ||
        lower.includes('write') ||
        lower.includes('draft'),

      requiresResearch:
        lower.includes('research') ||
        lower.includes('find') ||
        lower.includes('competitor') ||
        lower.includes('what are others'),

      isBulkRequest:
        lower.includes('all') ||
        lower.includes('bulk') ||
        lower.includes('everything'),

      isRefinement:
        lower.includes('change') ||
        lower.includes('edit') ||
        lower.includes('update') ||
        lower.includes('revise')
    }
  }

  // Generate content for a specific channel
  const generateContentForChannel = async (channel: string, context: any) => {
    setIsGenerating(true)

    try {
      // Determine content type based on channel
      let contentType = 'social-post'
      let endpoint = '/api/content/social-post'

      if (channel === 'media' || channel === 'press') {
        contentType = 'press-release'
        endpoint = '/api/content/press-release'
      } else if (channel === 'email') {
        contentType = 'email'
        endpoint = '/api/content/email-campaign'
      }

      // Call the appropriate API endpoint
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Create ${contentType} with key messages: ${context.keyMessages?.join(', ')}`,
          audience: context.audience,
          organization: organization?.name || 'OpenAI',
          organizationId: organization?.id,
          framework: conceptState.orchestrationContext?.framework,
          template: context.template
        })
      })

      if (response.ok) {
        const result = await response.json()

        // Store generated content
        const contentItem = {
          id: `content-${Date.now()}`,
          type: contentType,
          content: result.content || result,
          metadata: {
            channel,
            ...context
          },
          timestamp: Date.now(),
          saved: false
        }

        setConceptState(prev => ({
          ...prev,
          generatedContent: [...prev.generatedContent, contentItem],
          stage: 'refining'
        }))

        // Notify parent
        console.log('📤 Notifying parent with content item:', contentItem)
        if (onContentGenerated) {
          onContentGenerated(contentItem as any)
        } else {
          console.error('❌ onContentGenerated callback not provided!')
        }

        // Add success message
        const successMsg = {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: `✅ Created ${contentType} for ${channel}. You can edit it in the workspace below.`,
          timestamp: new Date(),
          contentItem
        }

        setMessages(prev => [...prev, successMsg])

        return contentItem
      }
    } catch (error) {
      console.error('Generation error:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  // Handler implementations
  const handleComplexContent = async (userMessage: string, contentType: string) => {
    console.log('🎯 Routing to niv-content-intelligent-v2 for:', contentType)

    console.log('📊 Organization from store:', organization)

    const basePayload = {
      message: userMessage,
      conversationHistory: messages.map(m => ({
        role: m.role,
        content: m.content
      })),
      organizationContext: {
        conversationId: conceptState.conversationId,
        organizationId: organization?.id || 'OpenAI',
        organizationName: organization?.name || 'OpenAI'
      }
    }

    console.log('📤 Sending organizationContext:', basePayload.organizationContext)

    // Step 1: Get immediate acknowledgment
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 70000) // 70 second timeout for cold starts

    const ackResponse = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/niv-content-intelligent-v2`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          ...basePayload,
          stage: 'acknowledge'
        }),
        signal: controller.signal
      }
    )

    clearTimeout(timeoutId)

    let ackData
    if (ackResponse.ok) {
      ackData = await ackResponse.json()
      console.log('✅ NIV Acknowledgment:', ackData.message)

      // Show acknowledgment immediately
      setMessages(prev => [...prev, {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: ackData.message,
        timestamp: new Date(),
        metadata: { acknowledgment: true }
      }])
    }

    // Step 2: ONLY call full stage if acknowledgment is just understanding
    // If ack is asking a question or presenting options, STOP here and wait for user
    if (ackData?.mode === 'question' || ackData?.mode === 'strategy_options' || ackData?.mode === 'dialogue' || ackData?.awaitingResponse) {
      console.log('⏸️  Waiting for user response, not calling full stage')
      return ackData // Return the question/options, don't proceed
    }

    // Step 2: Get full response (only if not waiting for user input)
    console.log('📞 Calling FULL stage with payload:', {
      message: userMessage,
      conversationHistoryLength: messages.length,
      lastMessages: messages.slice(-3).map(m => ({ role: m.role, content: m.content ? m.content.substring(0, 100) : '' }))
    })

    const controller2 = new AbortController()
    const timeoutId2 = setTimeout(() => controller2.abort(), 120000) // 120 second timeout for presentation generation

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/niv-content-intelligent-v2`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          ...basePayload,
          stage: 'full'
        }),
        signal: controller2.signal
      }
    )

    clearTimeout(timeoutId2)

    if (!response.ok) {
      throw new Error(`Backend error: ${response.statusText}`)
    }

    const fullData = await response.json()
    console.log('📥 FULL stage response MODE:', fullData.mode)
    console.log('📥 Has generatedContent?', !!fullData.generatedContent)
    console.log('📥 Content count:', fullData.generatedContent?.length)
    console.log('📥 FULL RESPONSE DATA:', JSON.stringify(fullData, null, 2))

    return fullData
  }

  const handleGammaPresentation = async (userMessage: string) => {
    console.log('📊 Routing to Gamma for presentation')

    // Step 1: Initiate generation WITH CAPTURE
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/gamma-presentation`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          topic: userMessage,
          context: {
            organization: organization?.name || 'OpenAI',
            conversationHistory: messages.slice(-3).map(m => m.content)
          },
          // NEW: Enable capture to SignalDesk
          capture: true,
          organization_id: organization?.id || 'f3b7f0e4-8c9d-4a1e-9b2f-5d6e7f8a9b0c', // default org ID
          campaign_id: null // TODO: Link to campaign if available
        })
      }
    )

    if (!response.ok) {
      throw new Error(`Gamma error: ${response.statusText}`)
    }

    const initialData = await response.json()
    console.log('📊 Initial Gamma response:', initialData)

    // If we got a generationId, poll for completion
    if (initialData.generationId) {
      const generationId = initialData.generationId
      let attempts = 0
      const maxAttempts = 60 // 60 attempts * 3 seconds = 180 seconds max (3 minutes)

      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 3000)) // Wait 3 seconds

        console.log(`📊 Polling Gamma status (attempt ${attempts + 1}/${maxAttempts})`)

        // Check status
        const statusResponse = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/gamma-presentation?generationId=${generationId}`,
          {
            headers: {
              'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
            }
          }
        )

        if (statusResponse.ok) {
          const statusData = await statusResponse.json()
          console.log('📊 Status response:', statusData)

          if (statusData.status === 'complete' || statusData.status === 'completed') {
            console.log('✅ Gamma presentation complete!')
            const finalUrl = statusData.gammaUrl || statusData.presentationUrl || statusData.url || statusData.webUrl
            console.log('📊 Final presentation URL:', finalUrl)

            // NEW: Log capture status
            if (statusData.captured) {
              console.log('💾 Presentation captured to SignalDesk!', {
                capturedId: statusData.capturedId,
                pptxUrl: statusData.exportUrls?.pptx
              })
            } else {
              console.log('⚠️ Presentation was not captured (capture may have failed)')
            }

            return {
              ...statusData,
              presentationUrl: finalUrl,
              url: finalUrl,
              gammaUrl: finalUrl,
              captured: statusData.captured,
              capturedId: statusData.capturedId
            }
          } else if (statusData.status === 'failed' || statusData.status === 'error') {
            throw new Error(`Gamma generation failed: ${statusData.error || 'Unknown error'}`)
          }
          // If still pending, continue polling
        }

        attempts++
      }

      // Timeout
      throw new Error('Gamma presentation generation timed out after 3 minutes')
    }

    // If no generationId, return as-is (already complete)
    return initialData
  }

  const handleVertexImage = async (userMessage: string) => {
    console.log('🎨 Routing to Vertex AI for image')

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/vertex-ai-visual`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          type: 'image',
          prompt: userMessage,
          organization: organization?.name || 'OpenAI'
        })
      }
    )

    if (!response.ok) {
      throw new Error(`Vertex error: ${response.statusText}`)
    }

    const data = await response.json()
    console.log('🎨 Vertex response:', data)

    // Extract the actual image URL from the response
    // The edge function returns { imageUrl: string } or { images: string[] }
    let imageUrl = null

    if (typeof data.imageUrl === 'string') {
      imageUrl = data.imageUrl
    } else if (data.images && Array.isArray(data.images) && data.images.length > 0) {
      imageUrl = data.images[0]
    } else if (data.imageUrl && typeof data.imageUrl === 'object') {
      // If imageUrl is an object with metadata, look for the actual URL
      console.warn('⚠️ imageUrl is an object, not a string:', data.imageUrl)
      // Try to find URL in common fields
      imageUrl = data.imageUrl.url || data.imageUrl.imageUrl || data.imageUrl.src
    }

    if (!imageUrl) {
      console.error('❌ Could not extract image URL from response:', data)
      throw new Error('Failed to get image URL from Vertex AI response')
    }

    console.log('✅ Extracted image URL:', imageUrl)

    return {
      ...data,
      imageUrl,
      prompt: userMessage
    }
  }

  const handleVertexVideo = async (userMessage: string) => {
    console.log('🎬 Routing to Vertex AI (Veo) for video')

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/vertex-ai-visual`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          type: 'video',
          prompt: userMessage,
          duration: 10, // Default 10 seconds
          aspectRatio: '16:9',
          style: 'corporate'
        })
      }
    )

    if (!response.ok) {
      throw new Error(`Veo error: ${response.statusText}`)
    }

    const data = await response.json()
    console.log('🎬 Veo response:', data)

    // Handle fallback case (video script instead of actual video)
    if (!data.success && data.fallback) {
      console.log('📝 Veo fallback - returning video script')
      return {
        success: false,
        videoScript: data.fallback.content,
        fallback: data.fallback,
        prompt: userMessage,
        fallbackType: data.fallback.type
      }
    }

    // Extract video URL from successful response
    let videoUrl = null

    if (data.videos && Array.isArray(data.videos) && data.videos.length > 0) {
      videoUrl = data.videos[0].url
    } else if (data.videoUrl) {
      videoUrl = data.videoUrl
    }

    if (!videoUrl && !data.fallback) {
      console.error('❌ Could not extract video URL from response:', data)
      throw new Error('Failed to get video URL from Veo response')
    }

    console.log('✅ Extracted video URL:', videoUrl)

    return {
      ...data,
      videoUrl,
      prompt: userMessage
    }
  }

  const handleMCPContent = async (userMessage: string, tool: string) => {
    console.log('📝 Routing to mcp-content with tool:', tool)

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/mcp-content`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          tool: tool,
          parameters: {
            prompt: userMessage,
            organization: organization?.name || 'OpenAI',
            context: {
              conversationHistory: messages.slice(-3).map(m => m.content),
              tone: conceptState.contentConcept.tone,
              keyMessages: conceptState.contentConcept.keyMessages
            }
          }
        })
      }
    )

    if (!response.ok) {
      throw new Error(`MCP Content error: ${response.statusText}`)
    }

    return await response.json()
  }

  const processResponse = (response: any, routing: any) => {
    // ORCHESTRATOR RESPONSES
    if (routing.service === 'niv-content-intelligent-v2') {
      if (response.mode === 'question') {
        setMessages(prev => [...prev, {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: response.message,
          timestamp: new Date(),
          metadata: { awaitingResponse: true }
        }])
      }
      else if (response.mode === 'strategy_options') {
        setMessages(prev => [...prev, {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: response.message,
          timestamp: new Date(),
          metadata: { strategyOptions: response.strategyOptions }
        }])
        // TODO: Add strategy selector UI when needed
      }
      else if (response.mode === 'dialogue') {
        setMessages(prev => [...prev, {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: response.message,
          timestamp: new Date(),
          metadata: {
            awaitingDialogue: true,
            strategyOptions: response.strategyOptions || response.dialogueOptions
          }
        }])
      }
      else if (response.mode === 'strategy_document') {
        console.log('📋 STRATEGY DOCUMENT - Displaying for review')

        // Store the strategy document for later use
        setConceptState(prev => ({
          ...prev,
          orchestrationContext: {
            ...prev.orchestrationContext,
            approvedStrategy: response.strategyDocument
          }
        }))

        // Display the strategy document with action buttons
        setMessages(prev => [...prev, {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: response.message,
          timestamp: new Date(),
          metadata: {
            strategyDocument: response.strategyDocument,
            awaitingApproval: true,
            showStrategyActions: true
          }
        }])
      }
      else if (response.mode === 'presentation_outline') {
        console.log('📊 PRESENTATION OUTLINE - Displaying for review')

        // Store the presentation outline for later use
        setConceptState(prev => ({
          ...prev,
          orchestrationContext: {
            ...prev.orchestrationContext,
            approvedStrategy: response.presentationOutline
          }
        }))

        // Display the outline with action buttons
        setMessages(prev => [...prev, {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: response.message,
          timestamp: new Date(),
          metadata: {
            presentationOutline: response.presentationOutline,
            awaitingApproval: true,
            showPresentationActions: true
          }
        }])
      }
      else if (response.mode === 'image_generated') {
        console.log('🎨 IMAGE GENERATED')

        // Extract actual image URL from response
        let imageUrl = null

        if (typeof response.imageUrl === 'string') {
          imageUrl = response.imageUrl
        } else if (response.imageUrl && typeof response.imageUrl === 'object') {
          // If imageUrl is an object with metadata, extract the URL
          console.log('⚠️ imageUrl is object, extracting URL:', response.imageUrl)
          imageUrl = response.imageUrl.url || response.imageUrl.imageUrl || response.imageUrl.src

          // If still no URL found, check if there's an images array
          if (!imageUrl && response.images && Array.isArray(response.images)) {
            imageUrl = response.images[0]
          }
        } else if (response.images && Array.isArray(response.images) && response.images.length > 0) {
          imageUrl = response.images[0]
        }

        if (!imageUrl) {
          console.error('❌ Could not extract image URL from orchestrator response:', response)
          imageUrl = null // Will show error in UI
        } else {
          console.log('✅ Extracted image URL:', imageUrl)
        }

        setMessages(prev => [...prev, {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: imageUrl ? (response.message || 'Here\'s your generated image:') : '❌ Failed to extract image URL from response',
          timestamp: new Date(),
          metadata: {
            type: 'image',
            imageUrl,
            prompt: response.prompt || response.imageUrl?.metadata?.prompt
          },
          error: !imageUrl
        }])
      }
      else if (response.mode === 'content_generated') {
        console.log('📝 CONTENT GENERATED:', response.contentType)

        // For media-list, use the formatted message instead of raw content object
        const displayContent = response.contentType === 'media-list'
          ? response.message
          : `**${response.contentType.replace('-', ' ').toUpperCase()}**\n\n${response.content}`

        setMessages(prev => [...prev, {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: displayContent,
          timestamp: new Date(),
          contentItem: {
            type: response.contentType,
            content: response.content,
            metadata: {}
          },
          showActions: true
        }])
      }
      else if (response.mode === 'presentation_generating') {
        console.log('⏳ PRESENTATION GENERATING - Starting to poll')

        // Show initial message
        const pollingMessageId = `msg-${Date.now()}`
        setMessages(prev => [...prev, {
          id: pollingMessageId,
          role: 'assistant',
          content: response.message,
          timestamp: new Date(),
          metadata: {
            type: 'presentation',
            status: 'generating',
            generationId: response.generationId
          }
        }])

        // Start polling for completion
        pollPresentationStatus(response.generationId, pollingMessageId, response.metadata.topic)
      }
      else if (response.mode === 'presentation_generated') {
        console.log('🎤 PRESENTATION GENERATED')

        setMessages(prev => [...prev, {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: `${response.message}\n\n[View Presentation](${response.presentationUrl})`,
          timestamp: new Date(),
          metadata: {
            type: 'presentation',
            url: response.presentationUrl
          }
        }])
      }
      else if (response.mode === 'generation_complete') {
        console.log('✅ GENERATION COMPLETE - Displaying content pieces:', response.generatedContent?.length)

        // Display completion message
        setMessages(prev => [...prev, {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: response.message,
          timestamp: new Date()
        }])

        // Display each content piece as a separate message
        if (response.generatedContent && Array.isArray(response.generatedContent)) {
          response.generatedContent.forEach((item: any, index: number) => {
            setTimeout(() => {
              setMessages(prev => [...prev, {
                id: `msg-${Date.now()}-${index}`,
                role: 'assistant',
                content: `**${item.type.replace('-', ' ').toUpperCase()}**\n\n${item.content}`,
                timestamp: new Date(),
                contentItem: {
                  type: item.type,
                  content: item.content,
                  metadata: response.metadata
                },
                showActions: true
              }])
            }, index * 100) // Small delay between pieces for UX
          })

          setGeneratedContent(response.generatedContent)
        }
      }
      else {
        setMessages(prev => [...prev, {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: response.message || response.response,
          timestamp: new Date()
        }])
      }
    }

    // GAMMA RESPONSES
    else if (routing.service === 'gamma-presentation') {
      if (response.presentationUrl || response.url) {
        setMessages(prev => [...prev, {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: `I've created your presentation! [View Presentation](${response.presentationUrl || response.url})`,
          timestamp: new Date(),
          metadata: {
            type: 'presentation',
            url: response.presentationUrl || response.url,
            slides: response.slides
          }
        }])
      } else {
        setMessages(prev => [...prev, {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: response.message || 'Presentation created successfully',
          timestamp: new Date()
        }])
      }
    }

    // VERTEX RESPONSES
    else if (routing.service === 'vertex-ai-visual') {
      if (response.imageUrl || response.images) {
        setMessages(prev => [...prev, {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: 'Here\'s your generated image:',
          timestamp: new Date(),
          metadata: {
            type: 'image',
            imageUrl: response.imageUrl || response.images?.[0],
            images: response.images
          }
        }])
      }
    }

    // VERTEX VIDEO (VEO) RESPONSES
    else if (routing.service === 'vertex-ai-visual') {
      if (response.videoUrl) {
        // Successful video generation
        setMessages(prev => [...prev, {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: 'Here\'s your generated video:',
          timestamp: new Date(),
          metadata: {
            type: 'video',
            videoUrl: response.videoUrl,
            prompt: response.prompt
          }
        }])
      } else if (response.videoScript && response.fallback) {
        // Fallback case - video script generated instead
        setMessages(prev => [...prev, {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: `I couldn't generate the video with Google Veo at this moment, but here's a video script you can use:\n\n**${response.videoScript.title || 'Video Script'}**\n\n${response.videoScript.content || response.videoScript}`,
          timestamp: new Date(),
          metadata: {
            type: 'video-script',
            fallback: true,
            videoScript: response.videoScript,
            prompt: response.prompt
          }
        }])
      }
    }

    // MCP CONTENT RESPONSES
    else if (routing.service === 'mcp-content') {
      setMessages(prev => [...prev, {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: response.content || response.result || JSON.stringify(response),
        timestamp: new Date(),
        metadata: {
          type: routing.tool,
          generatedContent: response
        }
      }])
    }

    // Update conversation state
    setConceptState(prev => ({
      ...prev,
      fullConversation: [...prev.fullConversation, {
        role: 'assistant',
        content: response.message || response.content || 'Response received',
        timestamp: new Date()
      }]
    }))
  }

  // MAIN HANDLER WITH ROUTING
  const handleSend = async () => {
    if (!input.trim() || isThinking) return

    const userMessage = input.trim()
    setInput('')

    // Add user message
    const userMsg = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMsg])

    // Update conversation state
    setConceptState(prev => ({
      ...prev,
      fullConversation: [...prev.fullConversation, {
        role: 'user',
        content: userMessage,
        timestamp: new Date()
      }],
      lastUpdate: Date.now()
    }))

    setIsThinking(true)

    try {
      const contentType = conceptState.contentConcept.type

      // GET ROUTING DECISION
      const routing = ContentRoutingAgent.route(contentType || '', userMessage, {
        organization,
        research: conceptState.researchHistory,
        framework: conceptState.orchestrationContext?.framework
      })

      console.log('🚦 Routing decision:', routing)

      // EXECUTE APPROPRIATE HANDLER
      let response
      switch (routing.handler) {
        case 'handleComplexContent':
          response = await handleComplexContent(userMessage, contentType || '')
          break

        case 'handleGammaPresentation':
          response = await handleGammaPresentation(userMessage)
          break

        case 'handleVertexImage':
          response = await handleVertexImage(userMessage)
          break

        case 'handleVertexVideo':
          response = await handleVertexVideo(userMessage)
          break

        case 'handleMCPContent':
          response = await handleMCPContent(userMessage, routing.tool || '')
          break

        default:
          // Fallback to orchestrator
          response = await handleComplexContent(userMessage, contentType || '')
      }

      // PROCESS RESPONSE BASED ON TYPE
      processResponse(response, routing)

    } catch (error) {
      console.error('❌ Routing error:', error)
      setMessages(prev => [...prev, {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: `I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        timestamp: new Date(),
        error: true
      }])
    } finally {
      setIsThinking(false)
    }
  }

  // Research using intelligence MCP
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

        console.log('Research response:', data)

        // Store research in concept state
        const findings = data.findings || data.results || []
        const sources = data.sources || []

        setConceptState(prev => ({
          ...prev,
          researchHistory: [...prev.researchHistory, {
            query,
            findings: findings,
            sources: sources,
            timestamp: Date.now()
          }]
        }))

        // Add research message with better error handling
        let researchContent = '📚 Research findings:\n\n'

        if (findings && findings.length > 0) {
          researchContent += findings.slice(0, 5).map((f: any) => {
            // Handle different possible response formats
            const title = f.title || f.headline || f.name || ''
            const summary = f.summary || f.description || f.snippet || f.content || ''
            const source = f.source || f.url || ''

            let item = `• ${title}`
            if (summary) item += `\n  ${summary.substring(0, 150)}...`
            if (source) item += `\n  Source: ${source}`

            return item
          }).join('\n\n')

          researchContent += '\n\nWould you like me to create content based on this research?'
        } else {
          researchContent = '📚 I completed the research but didn\'t find specific results for your query. Would you like me to:\n\n'
          researchContent += '• Try a different search query?\n'
          researchContent += '• Create content based on general knowledge?\n'
          researchContent += '• Help you refine what you\'re looking for?'
        }

        const researchMsg = {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: researchContent,
          timestamp: new Date(),
          metadata: { research: data }
        }

        setMessages(prev => [...prev, researchMsg])
      }
    } catch (error) {
      console.error('Research error:', error)
    }
  }

  // Generate content using appropriate API endpoint
  const generateContent = async (type: string, context: any) => {
    setIsGenerating(true)

    try {
      // Map content type to API endpoint - map similar types to existing endpoints
      const endpointMap: Record<string, string> = {
        // Written Content
        'press-release': '/api/content/press-release',
        'blog-post': '/api/content/blog-post',
        'thought-leadership': '/api/content/thought-leadership',
        'case-study': '/api/content/thought-leadership', // Use thought-leadership for case studies
        'white-paper': '/api/content/thought-leadership', // Use thought-leadership for white papers
        'ebook': '/api/content/thought-leadership', // Use thought-leadership for ebooks
        'qa-document': '/api/content/qa-document',
        'qa-doc': '/api/content/qa-document',

        // Social & Digital
        'social-post': '/api/content/social-post',
        'linkedin-article': '/api/content/thought-leadership', // Use thought-leadership for LinkedIn articles
        'twitter-thread': '/api/content/social-post', // Use social-post for Twitter threads
        'instagram-caption': '/api/content/social-post', // Use social-post for Instagram
        'facebook-post': '/api/content/social-post', // Use social-post for Facebook

        // Email & Campaigns
        'email': '/api/content/email-campaign',
        'email-campaign': '/api/content/email-campaign',
        'newsletter': '/api/content/email-campaign', // Use email for newsletters
        'drip-sequence': '/api/content/email-campaign', // Use email for drip sequences
        'cold-outreach': '/api/content/email-campaign', // Use email for cold outreach

        // Executive & Crisis
        'executive-statement': '/api/content/executive-statement',
        'board-presentation': '/api/visual/presentation', // Use presentation for board decks
        'investor-update': '/api/content/executive-statement', // Use executive statement
        'crisis-response': '/api/content/crisis-response',
        'apology-statement': '/api/content/crisis-response', // Use crisis-response

        // Media & PR
        'media-pitch': '/api/content/media-pitch',
        'media-kit': '/api/content/media-pitch', // Use media-pitch for media kits
        'podcast-pitch': '/api/content/media-pitch', // Use media-pitch for podcast pitches
        'tv-interview-prep': '/api/content/qa-document', // Use Q&A for interview prep

        // Strategy & Messaging
        'messaging': '/api/content/messaging-framework',
        'messaging-framework': '/api/content/messaging-framework',
        'brand-narrative': '/api/content/messaging-framework', // Use messaging framework
        'value-proposition': '/api/content/messaging-framework', // Use messaging framework
        'competitive-positioning': '/api/content/messaging-framework', // Use messaging framework

        // Visual Content
        'image': '/api/visual/image',
        'infographic': '/api/visual/image', // Use image generation for infographics
        'video': '/api/visual/video',
        'presentation': '/api/visual/presentation',
        'social-graphics': '/api/visual/image' // Use image generation for social graphics
      }

      const endpoint = endpointMap[type]
      if (!endpoint) {
        throw new Error(`Unknown content type: ${type}`)
      }

      // Add logging to debug the issue
      console.log(`Generating ${type} with context:`, context)

      // Adjust context based on content type for better results
      switch(type) {
        case 'twitter-thread':
          context.platform = 'Twitter'
          context.format = 'thread'
          context.characterLimit = 280
          break
        case 'instagram-caption':
          context.platform = 'Instagram'
          context.includeHashtags = true
          context.emojiStyle = 'moderate'
          break
        case 'facebook-post':
          context.platform = 'Facebook'
          context.length = 'medium'
          break
        case 'linkedin-article':
          context.platform = 'LinkedIn'
          context.professional = true
          context.length = 'long'
          break
        case 'board-presentation':
        case 'presentation':
          // Make sure we have a title or content
          if (!context.title && !context.content && !context.prompt) {
            context.title = 'Strategic Presentation'
            context.content = 'Create a comprehensive presentation'
          }
          break
        case 'newsletter':
          context.format = 'newsletter'
          context.sections = true
          break
        case 'drip-sequence':
          context.format = 'email sequence'
          context.numberOfEmails = 5
          break
        case 'cold-outreach':
          context.format = 'cold email'
          context.personalized = true
          break
        case 'tv-interview-prep':
          context.format = 'interview Q&A'
          context.mediaType = 'television'
          break
        case 'infographic':
          context.visualType = 'infographic'
          context.dataPoints = true
          break
        case 'social-graphics':
          context.visualType = 'social media graphics'
          context.multipleVersions = true
          break
      }

      console.log('🔄 Calling API:', endpoint, 'with context:', context)

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(context)
      })

      console.log('📥 API Response:', response.status, response.ok)

      if (response.ok) {
        const result = await response.json()
        console.log('✅ API Result:', result)

        // Handle different content types appropriately
        let content
        if (type === 'image') {
          // For images, extract the URL properly
          content = {
            url: result.content?.imageUrl || result.content?.url || result.imageUrl || result.url,
            prompt: context.prompt
          }
        } else if (type === 'video') {
          content = {
            url: result.content?.videoUrl || result.content?.url || result.videoUrl || result.url,
            prompt: context.prompt
          }
        } else if (type === 'presentation') {
          content = {
            url: result.content?.presentationUrl || result.content?.url || result.presentationUrl || result.url,
            prompt: context.prompt
          }
        } else {
          // For text content
          content = result.content || result
        }

        // Create content item
        const contentItem = {
          id: `content-${Date.now()}`,
          type,
          content,
          metadata: {
            ...context,
            generatedAt: new Date().toISOString()
          },
          timestamp: Date.now(),
          saved: false
        }

        // Update concept state
        setConceptState(prev => ({
          ...prev,
          generatedContent: [...prev.generatedContent, contentItem],
          stage: prev.stage === 'creating' ? 'refining' : prev.stage
        }))

        // Notify parent
        console.log('📤 Notifying parent with content item:', contentItem)
        if (onContentGenerated) {
          onContentGenerated(contentItem as any)
        } else {
          console.error('❌ onContentGenerated callback not provided!')
        }

        // Add success message with specific content type names
        const contentTypeNames: Record<string, string> = {
          'twitter-thread': 'Twitter thread',
          'instagram-caption': 'Instagram caption',
          'facebook-post': 'Facebook post',
          'linkedin-article': 'LinkedIn article',
          'board-presentation': 'board presentation',
          'newsletter': 'newsletter',
          'drip-sequence': 'email drip sequence',
          'cold-outreach': 'cold outreach email',
          'tv-interview-prep': 'TV interview Q&A prep',
          'infographic': 'infographic',
          'social-graphics': 'social media graphics'
        }

        const displayName = contentTypeNames[type] || type.replace('-', ' ')
        let successContent = `✅ I've created your ${displayName}! You can see it in the workspace below. Would you like to edit, save, or create another version?`

        // Special messages for specific types
        if ((type === 'presentation' || type === 'board-presentation') && content?.url) {
          successContent = `✅ I've created your ${displayName} using Gamma!\n\n🔗 View your presentation: ${content.url}\n\nYou can edit it directly in Gamma or create another version.`

          // NEW: Add capture notification
          if (content?.captured) {
            successContent += `\n\n💾 **Saved to SignalDesk!** This presentation has been captured and is now searchable in your library.`
          }
        } else if ((type === 'image' || type === 'infographic' || type === 'social-graphics') && content?.url) {
          successContent = `✅ I've generated your ${displayName}! It's displayed in the workspace below.`
        } else if (type === 'video' && content?.url) {
          successContent = `✅ I've created your video! You can view it in the workspace below.`
        } else if (type === 'twitter-thread') {
          successContent = `✅ I've created your Twitter thread! Each tweet is within the 280 character limit. You can copy and paste it directly to Twitter.`
        } else if (type === 'drip-sequence') {
          successContent = `✅ I've created your email drip sequence! You'll find 5 emails ready to use in your campaign.`
        }

        const successMsg = {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: successContent,
          timestamp: new Date(),
          contentItem,
          showActions: true
        }

        setMessages(prev => [...prev, successMsg])

        return contentItem
      } else {
        // Try to get error details
        let errorDetails = `Service returned ${response.status}`
        try {
          const errorData = await response.json()
          errorDetails = errorData.error || errorData.message || errorDetails
        } catch {
          // Use status text if can't parse JSON
        }
        throw new Error(errorDetails)
      }
    } catch (error) {
      console.error('Generation error:', error)

      // More detailed error message for debugging
      let errorContent = `❌ Failed to generate ${type}: `
      if (error instanceof Error) {
        errorContent += error.message
        if (error.message.includes('500')) {
          errorContent += '\n\nThis might be a temporary issue with the generation service. Please try again in a moment.'
        }
      } else {
        errorContent += 'Unknown error occurred'
      }

      const errorMsg = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: errorContent,
        timestamp: new Date(),
        error: true
      }
      setMessages(prev => [...prev, errorMsg])
    } finally {
      setIsGenerating(false)
    }
  }

  // Save content to both storage systems
  const handleSave = async (content: any) => {
    try {
      // Save to Content Library (which also handles Memory Vault)
      const saveResponse = await fetch('/api/content-library/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: {
            type: content.type,
            title: content.title || `${content.type} - ${new Date().toLocaleDateString()}`,
            content: content.content,
            organization_id: organization?.id,
            framework_data: conceptState.orchestrationContext?.framework,
            workflow_content_generation: {
              enabled: true,
              tasks: ['saved'],
              priority: conceptState.orchestrationContext?.priorityLevel
            }
          },
          metadata: content.metadata
        })
      })

      if (saveResponse.ok) {
        // Update saved status
        setConceptState(prev => ({
          ...prev,
          generatedContent: prev.generatedContent.map(item =>
            item.id === content.id ? {...item, saved: true} : item
          )
        }))

        // Success message
        const saveMsg = {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: '✅ Content saved to Memory Vault and Content Library successfully!',
          timestamp: new Date()
        }

        setMessages(prev => [...prev, saveMsg])

        if (onContentSave) {
          onContentSave(content)
        }
      } else {
        const error = await saveResponse.json()
        throw new Error(error.error || 'Save failed')
      }
    } catch (error) {
      console.error('Save error:', error)
      const errorMsg = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: `❌ Failed to save: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        error: true
      }
      setMessages(prev => [...prev, errorMsg])
    }
  }

  // Build system prompt for Claude
  const buildSystemPrompt = () => {
    const currentDate = new Date().toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    })

    return `You are NIV, an elite Content Orchestrator for ${organization?.name || 'OpenAI'}.
Today is ${currentDate}.

IDENTITY:
You are a senior content strategist with deep expertise in PR, marketing, and strategic communications.

CURRENT CONTEXT:
- Selected Content Type: ${conceptState.contentConcept.type || 'None'}
- Stage: ${conceptState.stage}
- Organization: ${organization?.name || 'OpenAI'}
${conceptState.orchestrationContext?.framework ?
  `- Framework Objective: ${conceptState.orchestrationContext.framework.strategy?.objective}` : ''}
${conceptState.orchestrationContext?.opportunity ?
  `- Opportunity: ${conceptState.orchestrationContext.opportunity.title}` : ''}

CAPABILITIES:
- Content Generation: press releases, social posts, emails, executive statements
- Visual Creation: images (Google Imagen), videos (Google Veo), presentations (Gamma)
- Research: competitive analysis, trend research, media monitoring
- Storage: Memory Vault and Content Library

CONVERSATION APPROACH:
- Acknowledge content type selection immediately
- Ask specific, contextual questions
- Guide users through content creation
- Offer to research when helpful
- Always offer to save or edit after generation

IMPORTANT:
- Be conversational and helpful
- Use your expertise to guide content strategy
- Generate content only when explicitly asked
- Maintain context throughout the conversation`
  }

  // Poll presentation status
  const pollPresentationStatus = async (generationId: string, messageId: string, topic: string) => {
    let attempts = 0
    const maxAttempts = 40 // 40 attempts * 3 seconds = 2 minutes max

    const pollInterval = setInterval(async () => {
      attempts++

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/gamma-presentation?generationId=${generationId}`,
          {
            headers: {
              'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
            }
          }
        )

        if (response.ok) {
          const data = await response.json()
          console.log(`📊 Poll ${attempts}/${maxAttempts}:`, data.status)

          if (data.status === 'completed' || data.gammaUrl) {
            clearInterval(pollInterval)

            // Update the message with the final URL AND show auto-execute options
            setMessages(prev => prev.map(msg =>
              msg.id === messageId
                ? {
                    ...msg,
                    content: `✅ Your presentation "${topic}" is ready!\n\n[View in Gamma](${data.gammaUrl})`,
                    metadata: {
                      ...msg.metadata,
                      status: 'completed',
                      url: data.gammaUrl,
                      presentationTopic: topic,
                      showAutoExecuteActions: true  // Enable action buttons
                    }
                  }
                : msg
            ))

            console.log('🎯 Presentation complete - ready for auto-execute of additional formats')
          } else if (data.status === 'failed' || data.status === 'error') {
            clearInterval(pollInterval)

            setMessages(prev => prev.map(msg =>
              msg.id === messageId
                ? {
                    ...msg,
                    content: `❌ Presentation generation failed: ${data.message || 'Unknown error'}`,
                    error: true
                  }
                : msg
            ))
          }
        }

        if (attempts >= maxAttempts) {
          clearInterval(pollInterval)
          setMessages(prev => prev.map(msg =>
            msg.id === messageId
              ? {
                  ...msg,
                  content: `⏱️ Presentation is still generating. Check your Gamma dashboard or try again in a moment.`,
                  metadata: {
                    ...msg.metadata,
                    status: 'timeout'
                  }
                }
              : msg
          ))
        }
      } catch (error) {
        console.error('Polling error:', error)
      }
    }, 3000) // Poll every 3 seconds
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className={`niv-content-orchestrator flex flex-col h-full ${className}`}>
      {/* Messages Area - FLEX GROW */}
      <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <Sparkles className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">NIV Content Orchestrator</h3>
            <p className="text-gray-400">
              I'm your elite content strategist with access to all content creation services.
            </p>
            <p className="text-gray-500 mt-2 text-sm">
              Select a content type on the left or tell me what you need to create.
            </p>
          </div>
        )}

        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-3xl ${msg.role === 'user' ? 'order-2' : 'order-1'}`}>
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

                {/* Show generated image */}
                {msg.metadata?.type === 'image' && msg.metadata?.imageUrl && (
                  <div className="mt-4">
                    <img
                      src={msg.metadata.imageUrl}
                      alt="Generated image"
                      className="rounded-lg max-w-full h-auto border border-gray-700"
                    />
                    <div className="flex gap-2 mt-3 pt-3 border-gray-700">
                      <button
                        onClick={async () => {
                          try {
                            console.log('💾 Saving image to vault:', msg.metadata?.imageUrl)
                            const response = await fetch('/api/content-library/save', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                content: {
                                  type: 'image',
                                  title: `Generated Image - ${new Date().toLocaleDateString()}`,
                                  content: msg.metadata?.imageUrl,
                                  organization_id: organization?.id,
                                  timestamp: new Date().toISOString()
                                },
                                metadata: {
                                  prompt: msg.metadata?.prompt,
                                  imageUrl: msg.metadata?.imageUrl,
                                  organizationId: organization?.id,
                                  source: 'niv-content-v2'
                                }
                              })
                            })

                            const result = await response.json()
                            if (result.success) {
                              console.log('✅ Image saved to content library:', result.id)
                              // Show success feedback
                              setMessages(prev => [...prev, {
                                id: `msg-${Date.now()}`,
                                role: 'assistant',
                                content: '✅ Image saved to Memory Vault',
                                timestamp: new Date()
                              }])
                            } else {
                              console.error('❌ Failed to save image:', result.error)
                              setMessages(prev => [...prev, {
                                id: `msg-${Date.now()}`,
                                role: 'assistant',
                                content: `❌ Failed to save: ${result.error}`,
                                timestamp: new Date(),
                                error: true
                              }])
                            }
                          } catch (error) {
                            console.error('❌ Save error:', error)
                            setMessages(prev => [...prev, {
                              id: `msg-${Date.now()}`,
                              role: 'assistant',
                              content: '❌ Failed to save image',
                              timestamp: new Date(),
                              error: true
                            }])
                          }
                        }}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-md flex items-center gap-1.5"
                      >
                        <Save className="w-3.5 h-3.5" />
                        Save to Vault
                      </button>
                    </div>
                  </div>
                )}

                {/* Show generated video */}
                {msg.metadata?.type === 'video' && msg.metadata?.videoUrl && (
                  <div className="mt-4">
                    <video
                      src={msg.metadata.videoUrl}
                      controls
                      className="rounded-lg max-w-full h-auto border border-gray-700"
                      style={{ maxHeight: '500px' }}
                    >
                      Your browser does not support the video tag.
                    </video>
                    <div className="flex gap-2 mt-3 pt-3 border-gray-700">
                      <button
                        onClick={async () => {
                          try {
                            console.log('💾 Saving video to vault:', msg.metadata?.videoUrl)
                            const response = await fetch('/api/content-library/save', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                content: {
                                  type: 'video',
                                  title: `Generated Video - ${new Date().toLocaleDateString()}`,
                                  content: msg.metadata?.videoUrl,
                                  organization_id: organization?.id,
                                  timestamp: new Date().toISOString()
                                },
                                metadata: {
                                  prompt: msg.metadata?.prompt,
                                  videoUrl: msg.metadata?.videoUrl,
                                  organizationId: organization?.id,
                                  source: 'niv-content-v2'
                                }
                              })
                            })

                            const result = await response.json()
                            if (result.success) {
                              console.log('✅ Video saved to content library:', result.id)
                              setMessages(prev => [...prev, {
                                id: `msg-${Date.now()}`,
                                role: 'assistant',
                                content: '✅ Video saved to Memory Vault',
                                timestamp: new Date()
                              }])
                            } else {
                              console.error('❌ Failed to save video:', result.error)
                              setMessages(prev => [...prev, {
                                id: `msg-${Date.now()}`,
                                role: 'assistant',
                                content: `❌ Failed to save: ${result.error}`,
                                timestamp: new Date(),
                                error: true
                              }])
                            }
                          } catch (error) {
                            console.error('❌ Save error:', error)
                            setMessages(prev => [...prev, {
                              id: `msg-${Date.now()}`,
                              role: 'assistant',
                              content: '❌ Failed to save video',
                              timestamp: new Date(),
                              error: true
                            }])
                          }
                        }}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-md flex items-center gap-1.5"
                      >
                        <Save className="w-3.5 h-3.5" />
                        Save to Vault
                      </button>
                    </div>
                  </div>
                )}

                {/* Show generated presentation */}
                {msg.metadata?.type === 'presentation' && msg.metadata?.url && (
                  <div className="mt-4 p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <Presentation className="w-5 h-5 text-purple-400" />
                      <span className="text-purple-400 font-medium">Presentation Created</span>
                    </div>
                    <a
                      href={msg.metadata.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 underline inline-flex items-center gap-1"
                    >
                      View Presentation →
                    </a>
                    <div className="flex gap-2 mt-3 pt-3 border-t border-purple-500/30">
                      <button
                        onClick={async () => {
                          try {
                            console.log('💾 Saving presentation to vault:', msg.metadata?.url)
                            const response = await fetch('/api/content-library/save', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                content: {
                                  type: 'presentation',
                                  title: `Generated Presentation - ${new Date().toLocaleDateString()}`,
                                  content: msg.metadata?.url,
                                  organization_id: organization?.id,
                                  timestamp: new Date().toISOString()
                                },
                                metadata: {
                                  url: msg.metadata?.url,
                                  slides: msg.metadata?.slides,
                                  organizationId: organization?.id,
                                  source: 'niv-content-v2'
                                }
                              })
                            })

                            const result = await response.json()
                            if (result.success) {
                              console.log('✅ Presentation saved to content library:', result.id)
                              setMessages(prev => [...prev, {
                                id: `msg-${Date.now()}`,
                                role: 'assistant',
                                content: '✅ Presentation saved to Memory Vault',
                                timestamp: new Date()
                              }])
                            } else {
                              console.error('❌ Failed to save presentation:', result.error)
                              setMessages(prev => [...prev, {
                                id: `msg-${Date.now()}`,
                                role: 'assistant',
                                content: `❌ Failed to save: ${result.error}`,
                                timestamp: new Date(),
                                error: true
                              }])
                            }
                          } catch (error) {
                            console.error('❌ Save error:', error)
                            setMessages(prev => [...prev, {
                              id: `msg-${Date.now()}`,
                              role: 'assistant',
                              content: '❌ Failed to save presentation',
                              timestamp: new Date(),
                              error: true
                            }])
                          }
                        }}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-md flex items-center gap-1.5"
                      >
                        <Save className="w-3.5 h-3.5" />
                        Save to Vault
                      </button>
                    </div>

                    {/* Auto-execute actions when presentation is complete */}
                    {msg.metadata?.showAutoExecuteActions && (
                      <div className="mt-4 pt-4 border-t border-purple-500/30">
                        <p className="text-sm text-purple-300 mb-3 font-medium">
                          📄 Generate additional formats:
                        </p>
                        <div className="grid grid-cols-1 gap-2">
                          <button
                            onClick={() => {
                              setInput(`Create a 1-page executive summary based on the "${msg.metadata?.presentationTopic}" presentation`)
                              setTimeout(() => handleSend(), 100)
                            }}
                            className="px-3 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 hover:border-purple-500/50 text-purple-200 text-sm rounded-md flex items-center gap-2 transition-colors"
                          >
                            <FileText className="w-4 h-4" />
                            <span>Executive Summary (1-pager)</span>
                          </button>
                          <button
                            onClick={() => {
                              setInput(`Create detailed speaker notes for the "${msg.metadata?.presentationTopic}" presentation`)
                              setTimeout(() => handleSend(), 100)
                            }}
                            className="px-3 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 hover:border-purple-500/50 text-purple-200 text-sm rounded-md flex items-center gap-2 transition-colors"
                          >
                            <Mic className="w-4 h-4" />
                            <span>Speaker Notes</span>
                          </button>
                          <button
                            onClick={() => {
                              setInput(`Create a detailed report version of the "${msg.metadata?.presentationTopic}" presentation`)
                              setTimeout(() => handleSend(), 100)
                            }}
                            className="px-3 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 hover:border-purple-500/50 text-purple-200 text-sm rounded-md flex items-center gap-2 transition-colors"
                          >
                            <BookOpen className="w-4 h-4" />
                            <span>Detailed Report</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Show strategy options */}
                {msg.metadata?.strategyOptions && (
                  <div className="mt-4 space-y-3">
                    {msg.metadata.strategyOptions.map((strategy: any) => (
                      <div
                        key={strategy.id}
                        className="border border-gray-700 rounded-lg p-4 hover:border-yellow-500/50 cursor-pointer transition-colors"
                        onClick={() => {
                          setInput(`I choose strategy ${strategy.id}: ${strategy.name}`)
                        }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-yellow-500">{strategy.name}</h4>
                          <span className="text-xs text-gray-500">Option {strategy.id}</span>
                        </div>
                        <p className="text-sm text-gray-300 mb-3">{strategy.description}</p>
                        <div className="mb-2">
                          <span className="text-xs font-medium text-gray-400">Target Media:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {strategy.targetMedia.map((media: string, idx: number) => (
                              <span key={idx} className="text-xs bg-gray-700 px-2 py-1 rounded">
                                {media}
                              </span>
                            ))}
                          </div>
                        </div>
                        <p className="text-xs text-gray-400 italic">{strategy.rationale}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Show actions for strategy document */}
                {msg.metadata?.showStrategyActions && msg.metadata?.strategyDocument && (
                  <div className="flex gap-2 mt-4 pt-3 border-t border-gray-700">
                    <button
                      onClick={() => {
                        setInput('Generate all materials based on this strategy')
                        // Auto-submit
                        setTimeout(() => {
                          const submitBtn = document.querySelector('button[type="submit"]') as HTMLButtonElement
                          submitBtn?.click()
                        }, 100)
                      }}
                      className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-sm rounded-md flex items-center gap-2 font-medium"
                    >
                      <Sparkles className="w-4 h-4" />
                      Generate Materials
                    </button>
                    <button
                      onClick={() => {
                        setInput('I want to make some changes to the strategy')
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-md flex items-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Edit Strategy
                    </button>
                  </div>
                )}

                {/* Show actions for presentation outline */}
                {msg.metadata?.showPresentationActions && msg.metadata?.presentationOutline && (
                  <div className="flex gap-2 mt-4 pt-3 border-t border-gray-700">
                    <button
                      onClick={() => {
                        setInput('Looks great! Generate the presentation in Gamma')
                        // Auto-submit
                        setTimeout(() => {
                          const submitBtn = document.querySelector('button[type="submit"]') as HTMLButtonElement
                          submitBtn?.click()
                        }, 100)
                      }}
                      className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-sm rounded-md flex items-center gap-2 font-medium"
                    >
                      <Presentation className="w-4 h-4" />
                      Generate in Gamma
                    </button>
                    <button
                      onClick={() => {
                        setInput('I want to adjust the outline - ')
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-md flex items-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Revise Outline
                    </button>
                  </div>
                )}

                {/* Show actions for generated content */}
                {msg.contentItem && msg.showActions && (
                  <div className="flex gap-2 mt-3 pt-3 border-t border-gray-700">
                    <button
                      onClick={async () => {
                        try {
                          console.log('💾 Saving content to vault:', msg.contentItem)
                          const response = await fetch('/api/content-library/save', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              content: {
                                type: msg.contentItem.type,
                                title: `${msg.contentItem.type.replace('-', ' ').toUpperCase()} - ${new Date().toLocaleDateString()}`,
                                content: msg.contentItem.content,
                                organization_id: organization?.id,
                                timestamp: new Date().toISOString()
                              },
                              metadata: {
                                ...msg.contentItem.metadata,
                                organizationId: organization?.id,
                                source: 'niv-content-v2'
                              }
                            })
                          })

                          const result = await response.json()
                          if (result.success) {
                            console.log('✅ Content saved to content library:', result.id)
                            setMessages(prev => [...prev, {
                              id: `msg-${Date.now()}`,
                              role: 'assistant',
                              content: '✅ Content saved to Memory Vault',
                              timestamp: new Date()
                            }])
                          } else {
                            console.error('❌ Failed to save content:', result.error)
                            setMessages(prev => [...prev, {
                              id: `msg-${Date.now()}`,
                              role: 'assistant',
                              content: `❌ Failed to save: ${result.error}`,
                              timestamp: new Date(),
                              error: true
                            }])
                          }
                        } catch (error) {
                          console.error('❌ Save error:', error)
                          setMessages(prev => [...prev, {
                            id: `msg-${Date.now()}`,
                            role: 'assistant',
                            content: '❌ Failed to save content',
                            timestamp: new Date(),
                            error: true
                          }])
                        }
                      }}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-md flex items-center gap-1.5"
                    >
                      <Save className="w-3.5 h-3.5" />
                      Save to Vault
                    </button>
                    <button
                      onClick={() => {
                        console.log('Open in workspace:', msg.contentItem)
                        if (msg.contentItem && onContentGenerated) {
                          onContentGenerated(msg.contentItem)
                        }
                      }}
                      className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-md flex items-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Edit in Workspace
                    </button>
                  </div>
                )}

                <div className="text-xs text-gray-500 mt-2">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>
        ))}

        {(isThinking || isGenerating) && (
          <div className="flex justify-start">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-yellow-500" />
                <span className="text-sm text-gray-400">
                  {isGenerating ? 'Generating content...' : 'NIV is thinking...'}
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area - FIXED HEIGHT, EXPANDING TEXTAREA */}
      <div className="flex-shrink-0 border-t border-gray-800 p-4">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
              // Auto-resize textarea - but prevent page jumps
              const target = e.target as HTMLTextAreaElement
              const scrollPos = window.scrollY
              target.style.height = 'auto'
              target.style.height = Math.min(target.scrollHeight, 200) + 'px'
              window.scrollTo(0, scrollPos)
            }}
            onKeyDown={handleKeyDown}
            placeholder={
              selectedContentType
                ? `Tell me about your ${selectedContentType}...`
                : "What content would you like to create?"
            }
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500/50 resize-none overflow-y-auto transition-all"
            style={{
              minHeight: '52px',
              maxHeight: '200px'
            }}
            rows={1}
            disabled={isThinking || isGenerating}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isThinking || isGenerating}
            className="px-6 py-3 bg-yellow-500 hover:bg-yellow-400 disabled:bg-gray-700 disabled:opacity-50 text-black rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            Send
          </button>
        </div>

        {/* Quick actions */}
        {conceptState.orchestrationContext?.framework && (
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => {
                const firstItem = conceptState.orchestrationContext?.framework?.strategy?.content_needs?.priority_content?.[0]
                if (firstItem) {
                  setInput(`Create ${firstItem}`)
                  handleSend()
                }
              }}
              className="text-xs px-3 py-1 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg flex items-center gap-1"
            >
              <Zap className="w-3 h-3" />
              Generate Next Priority
            </button>
            <button
              onClick={() => performResearch('competitive analysis')}
              className="text-xs px-3 py-1 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg flex items-center gap-1"
            >
              <Search className="w-3 h-3" />
              Research First
            </button>
          </div>
        )}
      </div>
    </div>
  )
}