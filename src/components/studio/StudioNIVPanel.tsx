'use client'

import React, { useState, useRef, useEffect } from 'react'
import {
  Send,
  Loader2,
  Save,
  Copy,
  Check,
  ExternalLink,
  FileText
} from 'lucide-react'
import type { ContentItem } from '@/components/execute/ExecuteTabProduction'
import { useAppStore } from '@/stores/useAppStore'

// Content mode expertise mapping
const CONTENT_MODE_EXPERTISE: Record<string, {
  expertise: string
  questions: string[]
}> = {
  'press-release': {
    expertise: 'AP style, newsworthiness, journalist perspective',
    questions: ["What's the news angle?", "Who are the key stakeholders?", "What data points to include?"]
  },
  'social-post': {
    expertise: 'Platform optimization, engagement, viral mechanics',
    questions: ["Which platforms?", "What's the core message?", "Include visuals?"]
  },
  'image': {
    expertise: 'Visual composition, brand aesthetics',
    questions: ["What's the concept?", "For social, web, or print?", "Brand colors?"]
  },
  'crisis-response': {
    expertise: 'Crisis comms, stakeholder management',
    questions: ["What's the situation?", "Who's affected?", "What actions are we taking?"]
  },
  'presentation': {
    expertise: 'Executive storytelling, visual narrative',
    questions: ["What's the topic?", "Who's the audience?", "Key outcomes?"]
  }
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  metadata?: any
  contentItem?: ContentItem
  showActions?: boolean
  error?: boolean
}

interface StudioNIVPanelProps {
  selectedContentType: string
  onContentGenerated: (content: ContentItem) => void
  onContentSave: (content: ContentItem) => void
  workspaceContent?: ContentItem | null // Content currently being edited
}

export default function StudioNIVPanel({
  selectedContentType,
  onContentGenerated,
  onContentSave,
  workspaceContent
}: StudioNIVPanelProps) {
  const { organization } = useAppStore()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)
  const [conversationId] = useState(`conv-${Date.now()}`)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [hasShownWelcome, setHasShownWelcome] = useState(false)

  // Track the last content ID we acknowledged
  const [lastAcknowledgedContentId, setLastAcknowledgedContentId] = useState<string | null>(null)

  // Show welcome message on mount OR acknowledge edited content
  useEffect(() => {
    // If we have workspace content from Memory Vault that we haven't acknowledged yet
    if (workspaceContent?.metadata?.sourceContentId &&
        workspaceContent.metadata.sourceContentId !== lastAcknowledgedContentId) {
      const contentTitle = workspaceContent.title || 'this content'
      const contentType = workspaceContent.type?.replace(/-/g, ' ') || 'content'

      // Extract preview of content
      let contentPreview = ''
      if (typeof workspaceContent.content === 'string') {
        contentPreview = workspaceContent.content.substring(0, 200)
        if (workspaceContent.content.length > 200) contentPreview += '...'
      } else if (workspaceContent.content?.text) {
        contentPreview = workspaceContent.content.text.substring(0, 200)
        if (workspaceContent.content.text.length > 200) contentPreview += '...'
      }

      setMessages([{
        id: `msg-edit-context-${Date.now()}`,
        role: 'assistant',
        content: `I see you're editing "${contentTitle}" (${contentType}).\n\n${contentPreview ? `**Current content preview:**\n${contentPreview}\n\n` : ''}How can I help? I can:\n• Improve or refine the messaging\n• Adjust the tone or style\n• Add more detail or make it more concise\n• Suggest alternative approaches\n\nJust tell me what changes you'd like!`,
        timestamp: new Date(),
        metadata: { editContext: true, sourceContentId: workspaceContent.metadata.sourceContentId }
      }])
      setLastAcknowledgedContentId(workspaceContent.metadata.sourceContentId)
      setHasShownWelcome(true)
    } else if (!hasShownWelcome && !workspaceContent?.metadata?.sourceContentId) {
      setMessages([{
        id: `msg-welcome-${Date.now()}`,
        role: 'assistant',
        content: `I'm NIV, your content strategist. I can help you create any type of content — press releases, social posts, presentations, images, videos, and more.\n\nJust tell me what you need, or select a content type from the sidebar for more guidance.`,
        timestamp: new Date(),
        metadata: { welcome: true }
      }])
      setHasShownWelcome(true)
    }
  }, [hasShownWelcome, workspaceContent, lastAcknowledgedContentId])

  // Handle content type selection - add acknowledgment to existing messages
  useEffect(() => {
    if (selectedContentType) {
      const modeConfig = CONTENT_MODE_EXPERTISE[selectedContentType]

      let acknowledgment = ''
      switch(selectedContentType) {
        case 'press-release':
          acknowledgment = "I'll help you create a press release. What's the announcement - product launch, partnership, milestone, or something else?"
          break
        case 'social-post':
          acknowledgment = "Let's create social media content. What's the message? Which platforms - LinkedIn, Twitter, Instagram?"
          break
        case 'image':
          acknowledgment = "I'll create an image using Google Imagen. Describe what you envision - the concept, style, and purpose."
          break
        case 'video':
          acknowledgment = "I'll generate a video using Google Veo. What's the story or message?"
          break
        case 'presentation':
          acknowledgment = "I'll create a presentation using Gamma. What's the topic and who's your audience?"
          break
        case 'crisis-response':
          acknowledgment = "I understand the urgency. Let's craft a crisis response. What's the situation?"
          break
        case 'email':
          acknowledgment = "I'll create an email campaign. What's the purpose - announcement, newsletter, or nurture sequence?"
          break
        default:
          acknowledgment = `I'll help you create ${selectedContentType.replace(/-/g, ' ')}. ${modeConfig?.questions[0] || 'What do you need?'}`
      }

      // Add to existing messages instead of replacing
      setMessages(prev => [...prev, {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: acknowledgment,
        timestamp: new Date(),
        metadata: { contentType: selectedContentType }
      }])
    }
  }, [selectedContentType])

  // Scroll to bottom
  useEffect(() => {
    const chatContainer = messagesEndRef.current?.parentElement
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight
    }
  }, [messages])

  // Handle send message
  const handleSend = async () => {
    if (!input.trim() || isThinking || isGenerating) return

    const userMessage = input.trim()
    setInput('')

    // Reset textarea height to default
    if (textareaRef.current) {
      textareaRef.current.style.height = '40px'
    }

    // Add user message
    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMsg])

    setIsThinking(true)

    try {
      // Call niv-content-intelligent-v2
      const response = await callNIVContentIntelligent(userMessage)

      if (response) {
        processResponse(response)
      }
    } catch (error) {
      console.error('NIV error:', error)
      setMessages(prev => [...prev, {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        error: true
      }])
    } finally {
      setIsThinking(false)
    }
  }

  // Call NIV Content Intelligent V2 edge function
  const callNIVContentIntelligent = async (userMessage: string) => {
    // Include workspace content context if editing existing content
    const editingContext = workspaceContent?.metadata?.sourceContentId ? {
      isEditing: true,
      sourceContentId: workspaceContent.metadata.sourceContentId,
      contentTitle: workspaceContent.title,
      contentType: workspaceContent.type,
      currentContent: typeof workspaceContent.content === 'string'
        ? workspaceContent.content
        : workspaceContent.content?.text || JSON.stringify(workspaceContent.content),
      folder: workspaceContent.metadata?.folder
    } : null

    const basePayload = {
      message: userMessage,
      conversationHistory: messages.map(m => ({
        role: m.role,
        content: m.content
      })),
      organizationContext: {
        conversationId,
        organizationId: organization?.id,
        organizationName: organization?.name
      },
      editingContext // Include editing context if present
    }

    // Step 1: Get acknowledgment
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 70000)

    const ackResponse = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/niv-content-intelligent-v2`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ ...basePayload, stage: 'acknowledge' }),
        signal: controller.signal
      }
    )

    clearTimeout(timeoutId)

    let ackData
    if (ackResponse.ok) {
      ackData = await ackResponse.json()
      console.log('NIV Acknowledgment:', ackData.message)

      // Show acknowledgment
      setMessages(prev => [...prev, {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: ackData.message,
        timestamp: new Date(),
        metadata: { acknowledgment: true }
      }])
    }

    // If ack is asking a question, wait for user (don't call full stage)
    // Mark as already handled so processResponse doesn't duplicate
    if (ackData?.mode === 'question' || ackData?.mode === 'dialogue' || ackData?.awaitingResponse) {
      return { ...ackData, _alreadyHandled: true }
    }

    // Step 2: Get full response
    setIsGenerating(true)

    const controller2 = new AbortController()
    const timeoutId2 = setTimeout(() => controller2.abort(), 120000)

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/niv-content-intelligent-v2`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ ...basePayload, stage: 'full' }),
        signal: controller2.signal
      }
    )

    clearTimeout(timeoutId2)
    setIsGenerating(false)

    if (!response.ok) {
      throw new Error(`Backend error: ${response.statusText}`)
    }

    return await response.json()
  }

  // Process response from NIV
  const processResponse = (response: any) => {
    console.log('Processing response mode:', response.mode)

    // Skip if already handled by acknowledgment stage
    if (response._alreadyHandled) {
      console.log('Response already handled by acknowledgment stage, skipping')
      return
    }

    switch (response.mode) {
      case 'question':
      case 'dialogue':
        setMessages(prev => [...prev, {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: response.message,
          timestamp: new Date(),
          metadata: { awaitingResponse: true }
        }])
        break

      case 'content_generated':
        handleContentGenerated(response)
        break

      case 'generation_complete':
        handleGenerationComplete(response)
        break

      case 'image_generated':
        handleImageGenerated(response)
        break

      case 'video_generated':
        handleVideoGenerated(response)
        break

      case 'presentation_generating':
        handlePresentationGenerating(response)
        break

      case 'presentation_generated':
        handlePresentationGenerated(response)
        break

      default:
        // Generic response
        if (response.message) {
          setMessages(prev => [...prev, {
            id: `msg-${Date.now()}`,
            role: 'assistant',
            content: response.message,
            timestamp: new Date()
          }])
        }

        // Check for generated content in response
        if (response.generatedContent?.length > 0) {
          handleGenerationComplete(response)
        }
    }
  }

  // Extract title from content body when API doesn't provide one
  const extractTitleFromContent = (content: any): string | undefined => {
    const text = typeof content === 'string' ? content : content?.text || content?.body || ''
    if (!text) return undefined
    // Try markdown heading
    const headingMatch = text.match(/^#\s+(.+)$/m)
    if (headingMatch) return headingMatch[1].trim()
    // Try first non-empty line, truncated
    const firstLine = text.split('\n').find((l: string) => l.trim().length > 0)
    if (firstLine && firstLine.trim().length > 0) return firstLine.trim().slice(0, 120)
    return undefined
  }

  // Handle content generated
  const handleContentGenerated = (response: any) => {
    const contentItem: ContentItem = {
      id: `content-${Date.now()}`,
      type: response.contentType || selectedContentType,
      content: response.content,
      title: response.title || extractTitleFromContent(response.content),
      metadata: response.metadata,
      saved: false,
      timestamp: Date.now()
    }

    // Add message
    setMessages(prev => [...prev, {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: `Created ${response.contentType || selectedContentType}. View and edit in the workspace.`,
      timestamp: new Date(),
      contentItem,
      showActions: true
    }])

    // Send to workspace
    onContentGenerated(contentItem)
  }

  // Handle generation complete (multiple items)
  const handleGenerationComplete = (response: any) => {
    response.generatedContent?.forEach((item: any, index: number) => {
      setTimeout(() => {
        // Handle image items specially - they have imageUrl instead of content
        const isImage = item.type === 'image'
        const imageUrl = item.imageUrl || item.url

        const uniqueId = `${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`
        const contentItem: ContentItem = {
          id: `content-${uniqueId}`,
          type: item.type || item.contentType,
          content: isImage ? { imageUrl } : item.content,
          title: item.title || item.message || extractTitleFromContent(isImage ? null : item.content),
          metadata: isImage ? { type: 'image', imageUrl, prompt: item.imagePrompt } : item.metadata,
          saved: false,
          timestamp: Date.now()
        }

        setMessages(prev => [...prev, {
          id: `msg-${uniqueId}`,
          role: 'assistant',
          content: item.message || `Created ${item.type}`,
          timestamp: new Date(),
          metadata: isImage ? { type: 'image', imageUrl } : undefined,
          contentItem,
          showActions: true
        }])

        // Send to workspace - prioritize images, otherwise send first item
        if (isImage || index === 0) {
          onContentGenerated(contentItem)
        }
      }, index * 200)
    })
  }

  // Handle image generated
  const handleImageGenerated = (response: any) => {
    const imageUrl = typeof response.imageUrl === 'string'
      ? response.imageUrl
      : response.imageUrl?.url || response.images?.[0]

    if (!imageUrl) {
      setMessages(prev => [...prev, {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: 'Failed to generate image',
        timestamp: new Date(),
        error: true
      }])
      return
    }

    const contentItem: ContentItem = {
      id: `content-${Date.now()}`,
      type: 'image',
      content: { imageUrl },
      metadata: { type: 'image', imageUrl, prompt: response.prompt },
      saved: false,
      timestamp: Date.now()
    }

    setMessages(prev => [...prev, {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: response.message || 'Generated image',
      timestamp: new Date(),
      metadata: { type: 'image', imageUrl },
      contentItem,
      showActions: true
    }])

    onContentGenerated(contentItem)
  }

  // Handle video generated
  const handleVideoGenerated = (response: any) => {
    const videoUrl = typeof response.videoUrl === 'string'
      ? response.videoUrl
      : response.videos?.[0]?.url

    if (!videoUrl) {
      setMessages(prev => [...prev, {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: 'Failed to generate video',
        timestamp: new Date(),
        error: true
      }])
      return
    }

    const contentItem: ContentItem = {
      id: `content-${Date.now()}`,
      type: 'video',
      content: { videoUrl },
      title: response.title || 'Generated Video',
      metadata: { type: 'video', videoUrl, prompt: response.prompt, duration: response.duration },
      saved: false,
      timestamp: Date.now()
    }

    setMessages(prev => [...prev, {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: response.message || 'Generated video',
      timestamp: new Date(),
      metadata: { type: 'video', videoUrl },
      contentItem,
      showActions: true
    }])

    onContentGenerated(contentItem)
  }

  // Handle presentation generating
  const handlePresentationGenerating = (response: any) => {
    setMessages(prev => [...prev, {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: response.message || 'Generating presentation...',
      timestamp: new Date(),
      metadata: { type: 'presentation', status: 'generating' }
    }])

    // Start polling
    if (response.generationId) {
      pollPresentationStatus(response.generationId)
    }
  }

  // Handle presentation generated
  const handlePresentationGenerated = (response: any) => {
    const contentItem: ContentItem = {
      id: `content-${Date.now()}`,
      type: 'presentation',
      content: { url: response.presentationUrl },
      metadata: {
        type: 'presentation',
        url: response.presentationUrl,
        pptx_url: response.pptx_url
      },
      saved: false,
      timestamp: Date.now()
    }

    setMessages(prev => [...prev, {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: response.message || 'Presentation created!',
      timestamp: new Date(),
      metadata: { type: 'presentation', url: response.presentationUrl },
      contentItem,
      showActions: true
    }])

    onContentGenerated(contentItem)
  }

  // Poll presentation status
  const pollPresentationStatus = async (generationId: string) => {
    let attempts = 0
    const maxAttempts = 60

    const interval = setInterval(async () => {
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

          if (data.status === 'complete' || data.status === 'completed') {
            clearInterval(interval)
            handlePresentationGenerated({
              message: 'Presentation ready!',
              presentationUrl: data.gammaUrl || data.url,
              pptx_url: data.exportUrls?.pptx
            })
          } else if (data.status === 'failed') {
            clearInterval(interval)
            setMessages(prev => [...prev, {
              id: `msg-${Date.now()}`,
              role: 'assistant',
              content: 'Presentation generation failed',
              timestamp: new Date(),
              error: true
            }])
          }
        }
      } catch (error) {
        console.error('Poll error:', error)
      }

      if (attempts >= maxAttempts) {
        clearInterval(interval)
      }
    }, 3000)
  }

  // Handle copy message
  const handleCopyMessage = async (content: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedMessageId(messageId)
      setTimeout(() => setCopiedMessageId(null), 2000)
    } catch (error) {
      console.error('Copy failed:', error)
    }
  }

  // Handle save content
  const handleSaveContent = async (contentItem: ContentItem) => {
    try {
      const response = await fetch('/api/content-library/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: {
            type: contentItem.type,
            title: contentItem.title || `${contentItem.type} - ${new Date().toLocaleDateString()}`,
            content: contentItem.content,
            organization_id: organization?.id,
            timestamp: new Date().toISOString()
          },
          metadata: contentItem.metadata
        })
      })

      const result = await response.json()
      if (result.success) {
        onContentSave({ ...contentItem, saved: true })
        setMessages(prev => [...prev, {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: 'Saved to Memory Vault',
          timestamp: new Date()
        }])
      }
    } catch (error) {
      console.error('Save error:', error)
    }
  }

  return (
    <div className="bg-[var(--charcoal)] border border-zinc-800 rounded-xl flex flex-col overflow-hidden h-full max-h-[calc(100vh-120px)]">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center relative">
              <span className="text-sm font-bold text-[var(--charcoal)]" style={{ fontFamily: 'var(--font-display)' }}>NIV</span>
              <div className="absolute top-0 right-0 w-0 h-0 border-l-[10px] border-l-transparent border-t-[10px] border-t-[var(--burnt-orange)]" />
            </div>
            <div>
              <h3 className="font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>NIV Content Advisor</h3>
              <p className="text-xs text-[var(--grey-400)]">Available 24/7</p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-full ${msg.role === 'user' ? 'order-2' : 'order-1'}`}>
              {msg.role === 'assistant' && (
                <div className="flex items-center gap-2 mb-1">
                  <svg width="28" height="28" viewBox="0 0 28 28">
                    <rect width="28" height="28" rx="6" fill="#faf9f7" />
                    <text
                      x="4"
                      y="19"
                      fontFamily="Space Grotesk, sans-serif"
                      fontWeight="700"
                      fontSize="14"
                      fill="#1a1a1a"
                    >
                      NIV
                    </text>
                    <polygon points="22,0 28,0 28,6" fill="#c75d3a" />
                  </svg>
                </div>
              )}

              <div
                className={`rounded-xl px-3.5 py-2.5 relative group ${
                  msg.role === 'user'
                    ? ''
                    : msg.error
                    ? ''
                    : ''
                }`}
                style={{
                  background: msg.role === 'user'
                    ? 'var(--burnt-orange)'
                    : msg.error
                    ? 'rgba(239, 68, 68, 0.1)'
                    : 'var(--grey-900)',
                  border: msg.error ? '1px solid rgba(239, 68, 68, 0.3)' : undefined
                }}
              >
                <p
                  className="text-sm whitespace-pre-wrap break-words"
                  style={{
                    color: msg.role === 'user' ? 'var(--white)' : 'var(--grey-200)',
                    lineHeight: 1.5,
                    wordBreak: 'break-word',
                    overflowWrap: 'break-word'
                  }}
                >
                  {msg.content}
                </p>

                {/* Copy button */}
                {msg.role === 'assistant' && (
                  <button
                    onClick={() => handleCopyMessage(msg.content, msg.id)}
                    className="absolute top-2 right-2 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: 'var(--grey-800)' }}
                  >
                    {copiedMessageId === msg.id ? (
                      <Check className="w-3 h-3" style={{ color: 'var(--success)' }} />
                    ) : (
                      <Copy className="w-3 h-3" style={{ color: 'var(--grey-400)' }} />
                    )}
                  </button>
                )}

                {/* Image preview */}
                {msg.metadata?.type === 'image' && msg.metadata?.imageUrl && (
                  <img
                    src={msg.metadata.imageUrl}
                    alt="Generated"
                    className="mt-2 rounded-lg w-full"
                  />
                )}

                {/* Presentation link */}
                {msg.metadata?.type === 'presentation' && msg.metadata?.url && (
                  <a
                    href={msg.metadata.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
                    style={{ background: 'var(--grey-800)', color: 'var(--white)' }}
                  >
                    <ExternalLink className="w-4 h-4" />
                    View Presentation
                  </a>
                )}

                {/* Actions */}
                {msg.showActions && msg.contentItem && (
                  <div className="flex gap-2 mt-3 pt-2 border-t" style={{ borderColor: 'var(--grey-800)' }}>
                    <button
                      onClick={() => handleSaveContent(msg.contentItem!)}
                      className="px-2.5 py-1.5 text-xs rounded flex items-center gap-1"
                      style={{
                        background: 'var(--grey-800)',
                        color: 'var(--grey-300)',
                        fontFamily: 'var(--font-display)'
                      }}
                    >
                      <Save className="w-3 h-3" />
                      Save
                    </button>
                    <button
                      onClick={() => onContentGenerated(msg.contentItem!)}
                      className="px-2.5 py-1.5 text-xs rounded flex items-center gap-1"
                      style={{
                        background: 'var(--grey-800)',
                        color: 'var(--grey-300)',
                        fontFamily: 'var(--font-display)'
                      }}
                    >
                      <FileText className="w-3 h-3" />
                      Edit
                    </button>
                  </div>
                )}
              </div>

              <div className="text-xs mt-1 px-1" style={{ color: 'var(--grey-600)' }}>
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}

        {/* Thinking/Generating indicator */}
        {(isThinking || isGenerating) && (
          <div className="flex justify-start">
            <div>
              <div className="flex items-center gap-2 mb-1">
                {/* NIV avatar with spinner overlay */}
                <div className="relative" style={{ width: 28, height: 28, flexShrink: 0 }}>
                  <svg width="28" height="28" viewBox="0 0 28 28" style={{ display: 'block' }}>
                    <rect width="28" height="28" rx="6" fill="#faf9f7" />
                    <text
                      x="4"
                      y="19"
                      fontFamily="Space Grotesk, sans-serif"
                      fontWeight="700"
                      fontSize="14"
                      fill="#1a1a1a"
                    >
                      NIV
                    </text>
                    <polygon points="22,0 28,0 28,6" fill="#c75d3a" />
                  </svg>
                  {/* Spinner overlay */}
                  <div
                    className="absolute inset-0 flex items-center justify-center rounded-md"
                    style={{ background: 'rgba(250, 249, 247, 0.85)' }}
                  >
                    <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: 'var(--charcoal)' }} />
                  </div>
                </div>
              </div>
              <div
                className="rounded-xl px-3.5 py-2.5"
                style={{ background: 'var(--grey-900)' }}
              >
                <span className="text-sm" style={{ color: 'var(--grey-400)' }}>
                  {isGenerating ? 'Generating...' : 'Thinking...'}
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 pb-8 mb-[5vh] border-t border-zinc-800 flex-shrink-0">
        <div className="flex space-x-2 items-end">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
              // Auto-expand textarea
              e.target.style.height = 'auto'
              e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px'
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder={
              selectedContentType
                ? `Tell me about your ${selectedContentType.replace(/-/g, ' ')}...`
                : 'What would you like to create?'
            }
            className="flex-1 bg-zinc-800 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--burnt-orange)] resize-none overflow-hidden"
            style={{ minHeight: '40px', maxHeight: '200px' }}
            disabled={isThinking || isGenerating}
            rows={1}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isThinking || isGenerating}
            className="px-4 py-2 bg-[var(--burnt-orange)] hover:brightness-110 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center space-x-2 flex-shrink-0"
            style={{ height: '40px' }}
          >
            {isThinking || isGenerating ? (
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
