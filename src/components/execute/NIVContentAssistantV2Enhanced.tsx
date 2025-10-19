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
  Image as ImageIcon,
  Video,
  Users,
  Download,
  Search,
  Globe,
  Zap,
  TrendingUp,
  Shield,
  Palette,
  Film,
  Camera
} from 'lucide-react'
import type { ContentType, ContentGenerationRequest, ContentItem, AudienceType } from '@/types/content'
import { ContentGenerationService } from '@/services/ContentGenerationService'
import { MediaDisplay } from './MediaDisplay'
import { useAppStore } from '@/stores/useAppStore'
import { useNivStrategyV2 } from '@/hooks/useNivStrategyV2'

type ExtendedContentType = ContentType | 'image' | 'video' | 'media-list'

interface NIVContentAssistantV2EnhancedProps {
  contentType?: ExtendedContentType
  framework?: any
  onContentGenerated: (content: ContentItem | any) => void
  onCancel: () => void
}

interface Message {
  id: string
  role: 'user' | 'niv' | 'tool'
  content: string
  timestamp: Date
  structured?: any
  suggestions?: Suggestion[]
  contentType?: ExtendedContentType
  generatedContent?: ContentItem | any
  mediaContent?: {
    url: string
    type: 'image' | 'video'
    metadata?: any
  }
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

const EXTENDED_CONTENT_TYPE_ICONS: Record<ExtendedContentType, any> = {
  'press-release': Megaphone,
  'social-post': Hash,
  'exec-statement': Briefcase,
  'crisis-response': AlertTriangle,
  'email': Mail,
  'qa-doc': FileQuestion,
  'media-pitch': Mic,
  'thought-leadership': BookOpen,
  'presentation': Presentation,
  'messaging': MessageSquare,
  'image': ImageIcon,
  'video': Video,
  'media-list': Users
}

const EXTENDED_CONTENT_TYPE_LABELS: Record<ExtendedContentType, string> = {
  'press-release': 'Press Release',
  'social-post': 'Social Media Post',
  'exec-statement': 'Executive Statement',
  'crisis-response': 'Crisis Response',
  'email': 'Email Campaign',
  'qa-doc': 'Q&A Document',
  'media-pitch': 'Media Pitch',
  'thought-leadership': 'Thought Leadership',
  'presentation': 'Presentation',
  'messaging': 'Messaging Framework',
  'image': 'Image',
  'video': 'Video',
  'media-list': 'Media List'
}

interface ConversationContext {
  contentType?: ExtendedContentType
  needsMoreInfo: boolean
  hasImageContext?: boolean
  hasVideoContext?: boolean
  hasPresentationContext?: boolean
  hasMediaListContext?: boolean
  imageDetails?: {
    style?: string
    aspectRatio?: string
    purpose?: string
    elements?: string[]
  }
  videoDetails?: {
    duration?: number
    style?: string
    message?: string
    scenes?: string[]
  }
  presentationDetails?: {
    audience?: string
    numCards?: number
    tone?: string
    themeName?: string
  }
}

export default function NIVContentAssistantV2Enhanced({
  contentType: initialContentType,
  framework,
  onContentGenerated,
  onCancel
}: NIVContentAssistantV2EnhancedProps) {
  const { organization } = useAppStore()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [conversationContext, setConversationContext] = useState<ConversationContext>({
    contentType: initialContentType,
    needsMoreInfo: false
  })
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const [hasInitialized, setHasInitialized] = useState(false)
  const [conversationId] = useState(`content-${Date.now()}`)

  useEffect(() => {
    // Initial greeting based on content type - only run once
    if (!hasInitialized && initialContentType) {
      const greeting = getInitialGreeting(initialContentType)
      const message: Message = {
        id: generateMessageId('niv'),
        role: 'niv',
        content: greeting,
        timestamp: new Date(),
        suggestions: getInitialSuggestions()
      }
      setMessages([message])
      setHasInitialized(true)
    }
  }, [hasInitialized, initialContentType])  // eslint-disable-line react-hooks/exhaustive-deps

  const getInitialGreeting = (type?: ExtendedContentType): string => {
    const orgName = organization?.name || 'your organization'

    if (type === 'press-release') {
      return `Hello! I'm NIV, your strategic content partner. I see you want to create a press release for ${orgName}.\n\nI have access to your strategic framework and can craft something truly newsworthy. What's the big announcement? A product launch, partnership, milestone, or something else?\n\nFeel free to share as much or as little as you'd like - I will guide us through the process.`
    }
    if (type === 'image') {
      return `Great choice! Visual content makes a huge impact. I will help you create a professional image for ${orgName}.\n\nWhat kind of visual do you need? An infographic with data, a hero image for an announcement, social media graphics, or something else?\n\nDescribe your vision and I will bring it to life with AI.`
    }
    if (type === 'video') {
      return `Video content is incredibly powerful! Let's create something compelling for ${orgName}.\n\nWhat story do you want to tell? I can generate up to 60 seconds - perfect for a teaser, explainer, or executive message.\n\nShare your concept and I will help shape it into engaging video content.`
    }
    if (type === 'media-list') {
      return `Smart move - targeted outreach is key to PR success. I will compile a strategic media list for ${orgName}.\n\nWhat's your story angle? Are you announcing something new, responding to industry trends, or positioning thought leadership?\n\nThe more specific you are about your news, the better I can target the right journalists.`
    }
    if (type === 'social-post') {
      return `Social media is where conversations happen! I will help you create engaging posts for ${orgName}.\n\nWhat's the message? Are we announcing news, sharing insights, or building community?\n\nTell me what you want to communicate and I will optimize it for maximum engagement.`
    }
    if (type === 'exec-statement') {
      return `Executive statements carry weight and build trust. I will help craft an authentic message for ${orgName}'s leadership.\n\nWhat's the context? An important announcement, response to events, or vision for the future?\n\nShare the situation and I will create a statement that resonates with your stakeholders.`
    }
    if (type) {
      return `I'm NIV, here to help you create a compelling ${EXTENDED_CONTENT_TYPE_LABELS[type]} for ${orgName}.\n\n${framework ? "I see you have a strategic framework ready - excellent! I will use that to ensure our content aligns with your objectives." : "Let's start with understanding your goals."}\n\nWhat's the key message you want to convey?`
    }
    return `Hi! I'm NIV, your strategic content partner. I can help you create press releases, social posts, executive statements, visual content, and more.\n\n${framework ? "I notice you have a strategic framework ready - that's perfect for creating aligned content!" : "What would you like to create today?"}\n\nJust tell me what you need and I will guide you through the process.`
  }

  const getInitialSuggestions = (): Suggestion[] => {
    if (initialContentType === 'image') {
      return [
        {
          label: 'Hero image for announcement',
          action: () => handleInput('Create a hero image for our product announcement'),
          icon: Camera
        },
        {
          label: 'Social media visual',
          action: () => handleInput('Generate a social media image with our key message'),
          icon: ImageIcon
        },
        {
          label: 'Infographic style',
          action: () => handleInput('Create an infographic showing our key metrics'),
          icon: Palette
        }
      ]
    }
    if (initialContentType === 'video') {
      return [
        {
          label: '15-second teaser',
          action: () => handleInput('Create a 15-second teaser video for our launch'),
          icon: Film
        },
        {
          label: '30-second explainer',
          action: () => handleInput('Generate a 30-second explainer video'),
          icon: Video
        },
        {
          label: 'Executive message',
          action: () => handleInput('Create a video for executive announcement'),
          icon: Briefcase
        }
      ]
    }
    if (initialContentType === 'media-list') {
      return [
        {
          label: 'Tech journalists',
          action: () => handleInput('Find tech journalists covering AI and enterprise software'),
          icon: Users
        },
        {
          label: 'Industry analysts',
          action: () => handleInput('Create a list of industry analysts and thought leaders'),
          icon: TrendingUp
        }
      ]
    }
    return []
  }

  const generateMessageId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  const addNivMessage = (content: string, suggestions?: Suggestion[]) => {
    const message: Message = {
      id: generateMessageId('niv'),
      role: 'niv',
      content,
      timestamp: new Date(),
      suggestions
    }
    setMessages(prev => [...prev, message])
    setIsTyping(false)
  }

  const handleInput = async (text: string) => {
    if (!text.trim()) return

    // Add user message
    const userMessage: Message = {
      id: generateMessageId('user'),
      role: 'user',
      content: text,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsTyping(true)

    // Use NIV orchestrator for content-focused conversation
    await handleWithNIV(text)
  }

  const handleWithNIV = async (userInput: string) => {
    try {
      // Build a proper content-focused message for NIV
      const contentContext = `I'm creating ${conversationContext.contentType ? `a ${EXTENDED_CONTENT_TYPE_LABELS[conversationContext.contentType]}` : 'content'} for ${organization?.name || 'my organization'}. ${framework ? `We have a strategic framework with objective: "${framework.strategy?.objective}"` : ''}`

      // Prepare conversation history for NIV
      const conversationHistory = messages.map(m => ({
        role: m.role === 'niv' ? 'assistant' : 'user',
        content: m.content
      }))

      // Call NIV orchestrator with content creation focus
      const response = await fetch('/api/niv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `[Content Creation Context] ${contentContext}\n\nUser request: ${userInput}`,
          conversationId: conversationId,
          mode: 'content', // Signal content creation mode
          organizationName: organization?.name,
          conversationHistory: conversationHistory.slice(-10), // Keep last 10 messages
          context: {
            contentType: conversationContext.contentType,
            framework: framework,
            isContentGeneration: true
          }
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('NIV response error:', errorData)
        throw new Error('NIV service unavailable')
      }

      const data = await response.json()
      const nivResponse = data.response || data.message || ''

      // Check if NIV is suggesting to generate content
      const shouldGenerate =
        nivResponse.toLowerCase().includes('let me create') ||
        nivResponse.toLowerCase().includes('let me generate') ||
        nivResponse.toLowerCase().includes('i\'ll create') ||
        nivResponse.toLowerCase().includes('i\'ll generate') ||
        nivResponse.toLowerCase().includes('here\'s your') ||
        nivResponse.toLowerCase().includes('here is your')

      if (shouldGenerate && conversationContext.contentType) {
        // NIV is ready to generate - show message then generate
        addNivMessage(nivResponse)
        setIsTyping(true)

        // Small delay for UX
        await new Promise(resolve => setTimeout(resolve, 1000))

        // Generate the actual content
        await performContentGeneration(userInput, nivResponse)
      } else {
        // Continue conversation
        addNivMessage(nivResponse, getContentSuggestions(userInput, nivResponse))
      }

      // Check if NIV provided research or insights
      if (data.toolResults) {
        handleToolResults(data.toolResults)
      }

    } catch (error) {
      console.error('NIV conversation error:', error)
      // Fallback to direct content generation
      addNivMessage(
        `I understand you want to create ${conversationContext.contentType ? `a ${EXTENDED_CONTENT_TYPE_LABELS[conversationContext.contentType]}` : 'content'}. Let me help you with that.\n\nCould you tell me more about:\n• The key message or announcement\n• Your target audience\n• Any specific points to include`,
        [
          {
            label: 'Generate with current info',
            action: () => performContentGeneration(userInput, ''),
            icon: Sparkles
          },
          {
            label: 'Let me add details',
            action: () => inputRef.current?.focus(),
            icon: Edit3
          }
        ]
      )
    } finally {
      setIsTyping(false)
    }
  }

  // Handle any tool results from NIV (research, etc.)
  const handleToolResults = (toolResults: any) => {
    if (toolResults.researchFindings) {
      // NIV did research - could display this in UI
      console.log('NIV research:', toolResults.researchFindings)
    }
    if (toolResults.strategy) {
      // NIV generated a strategy
      console.log('NIV strategy:', toolResults.strategy)
    }
  }

  const handleSmartFallback = async (userInput: string) => {
    // Smart fallback that analyzes user input and responds appropriately
    const input = userInput.toLowerCase()
    const contentType = conversationContext.contentType

    // Analyze intent
    if (input.includes('help') || input.includes('what') || input.includes('how')) {
      addNivMessage(
        `I can help you create a ${contentType ? EXTENDED_CONTENT_TYPE_LABELS[contentType] : 'variety of content'}.\n\n` +
        `Just tell me:\n` +
        `• What you want to announce or communicate\n` +
        `• Who your audience is\n` +
        `• Any specific points to include\n\n` +
        `For example: "We're launching a new AI product next week" or "I need to respond to recent industry news"`,
        getSmartSuggestions(userInput)
      )
    } else if (input.includes('launch') || input.includes('announce') || input.includes('release')) {
      // User is talking about an announcement
      setConversationContext({ ...conversationContext, needsMoreInfo: true })
      await performContentGeneration(
        userInput,
        'Based on your announcement, I will create appropriate content.'
      )
    } else if (input.includes('create') || input.includes('generate') || input.includes('write')) {
      // Direct generation request
      await performContentGeneration(userInput, 'Generating your content now...')
    } else {
      // Default: assume they're providing information for content
      addNivMessage(
        `Got it! Based on what you've shared about "${userInput}", I can help create content.\n\n` +
        `Would you like me to generate it now, or do you want to add more details?`,
        [
          {
            label: 'Generate now',
            action: () => performContentGeneration(userInput, ''),
            icon: Sparkles
          },
          {
            label: 'Add more details',
            action: () => {
              inputRef.current?.focus()
            },
            icon: Edit3
          }
        ]
      )
    }
  }

  const getContentSuggestions = (userInput: string, nivResponse: string): Suggestion[] => {
    const suggestions: Suggestion[] = []
    const contentType = conversationContext.contentType

    // Always offer to generate if we have a content type
    if (contentType) {
      suggestions.push({
        label: `Generate ${EXTENDED_CONTENT_TYPE_LABELS[contentType]}`,
        action: () => performContentGeneration(userInput, ''),
        icon: Sparkles
      })
    }

    // If NIV asked a question, offer quick responses
    if (nivResponse.includes('?')) {
      if (nivResponse.toLowerCase().includes('audience')) {
        suggestions.push({
          label: 'Media & journalists',
          action: () => handleInput('Our audience is media and journalists'),
          icon: Users
        },
        {
          label: 'Customers & users',
          action: () => handleInput('Our audience is customers and users'),
          icon: Users
        })
      }

      if (nivResponse.toLowerCase().includes('tone') || nivResponse.toLowerCase().includes('style')) {
        suggestions.push({
          label: 'Professional & authoritative',
          action: () => handleInput('Professional and authoritative tone'),
          icon: Briefcase
        },
        {
          label: 'Friendly & approachable',
          action: () => handleInput('Friendly and approachable tone'),
          icon: MessageSquare
        })
      }
    }

    // Research option
    if (!nivResponse.toLowerCase().includes('research')) {
      suggestions.push({
        label: 'Research this topic',
        action: () => handleInput('Can you research current news and trends about this?'),
        icon: Search
      })
    }

    // Framework option
    if (framework && !userInput.toLowerCase().includes('framework')) {
      suggestions.push({
        label: 'Use our framework',
        action: () => handleInput(`Use our strategic framework: ${framework.strategy?.objective}`),
        icon: Brain
      })
    }

    return suggestions
  }

  const performContentGeneration = async (prompt: string, context: string) => {
    const type = conversationContext.contentType

    if (!type) {
      addNivMessage(
        'What type of content would you like to create?',
        CONTENT_TYPES.slice(0, 6).map(ct => ({
          label: ct.label,
          action: () => {
            setConversationContext({ ...conversationContext, contentType: ct.type })
            handleInput(`I want to create a ${ct.label}`)
          },
          icon: EXTENDED_CONTENT_TYPE_ICONS[ct.type]
        }))
      )
      return
    }

    setIsTyping(true)

    try {
      // Route to appropriate generation method
      if (type === 'image') {
        await generateImage(prompt, 'professional', '16:9')
      } else if (type === 'video') {
        await generateVideo(prompt, 30, 'corporate')
      } else if (type === 'presentation') {
        await generatePresentation(prompt, 'professional', 12)
      } else if (type === 'media-list') {
        await handleMediaListGeneration(prompt)
      } else {
        // For text content, use the MCP edge functions
        await generateTextContentWithMCP(type as ContentType, prompt)
      }
    } catch (error) {
      console.error('Content generation error:', error)
      addNivMessage('I encountered an issue generating the content. Let me try a different approach...')
    } finally {
      setIsTyping(false)
    }
  }

  // Generate text content using MCP edge functions
  const generateTextContentWithMCP = async (type: ContentType, prompt: string) => {
    try {
      // Build comprehensive context from conversation
      const conversationContext = messages.map(m => m.content).join('\n')

      const request: ContentGenerationRequest = {
        type,
        prompt: `${prompt}\n\nConversation context:\n${conversationContext}`,
        context: {
          framework: framework,
          organization: organization || undefined
        },
        options: {
          audience: ['professional'] as AudienceType[],
          tone: 'professional',
          includeCallToAction: true
        }
      }

      // Use the MCP content generation service
      const result = await ContentGenerationService.generateContent(request)

      if (result.content) {
        // Show the generated content
        const contentItem: ContentItem = {
          id: generateMessageId('content'),
          type,
          title: result.title || `Generated ${EXTENDED_CONTENT_TYPE_LABELS[type]}`,
          content: result.content,
          status: 'review',
          priority: 'medium',
          createdAt: new Date(),
          updatedAt: new Date(),
          version: 1,
          tags: result.metadata?.tags || [],
          metadata: result.metadata
        }

        addNivMessage(
          `Here's your ${EXTENDED_CONTENT_TYPE_LABELS[type]}:\n\n${result.content}`,
          [
            {
              label: 'Perfect! Save it',
              action: () => {
                onContentGenerated(contentItem)
                addNivMessage('Great! Your content has been saved to the library. What would you like to create next?')
              },
              icon: Save
            },
            {
              label: 'Refine this',
              action: () => {
                addNivMessage('What would you like me to adjust? You can ask for changes to tone, length, specific sections, or anything else.')
                inputRef.current?.focus()
              },
              icon: Edit3
            },
            {
              label: 'Generate another version',
              action: () => generateTextContentWithMCP(type, prompt),
              icon: Wand2
            }
          ]
        )

        // Store the generated content in messages
        setMessages(prev => [...prev, {
          id: generateMessageId('generated'),
          role: 'niv',
          content: '',
          timestamp: new Date(),
          contentType: type,
          generatedContent: contentItem
        }])
      }
    } catch (error) {
      console.error('MCP content generation error:', error)
      throw error
    }
  }

  const getContextualSuggestions = (userInput: string, claudeResponse: string): Suggestion[] => {
    const suggestions: Suggestion[] = []

    // Dynamic suggestions based on conversation
    if (claudeResponse.includes('?')) {
      // Claude asked a question, provide quick answers
      suggestions.push({
        label: 'Generate with current info',
        action: () => performContentGeneration(userInput, claudeResponse),
        icon: Sparkles
      })
    }

    if (framework && !userInput.toLowerCase().includes('framework')) {
      suggestions.push({
        label: 'Use strategic framework',
        action: () => handleInput('Use the strategic framework to guide the content'),
        icon: Brain
      })
    }

    return suggestions
  }

  const handleFallbackConversation = async (text: string) => {
    // Fallback to original structured approach if Claude fails
    if (conversationContext.contentType === 'image') {
      await handleImageGeneration(text)
    } else if (conversationContext.contentType === 'video') {
      await handleVideoGeneration(text)
    } else if (conversationContext.contentType === 'presentation') {
      await handlePresentationGeneration(text)
    } else if (conversationContext.contentType === 'media-list') {
      await handleMediaListGeneration(text)
    } else {
      await generateTextContent(conversationContext.contentType as ContentType, text)
    }
  }

  const handleImageGeneration = async (prompt: string) => {
    // Check if this is an infographic request that needs more details
    const isInfographic = prompt.toLowerCase().includes('infographic') ||
                         prompt.toLowerCase().includes('data visualization') ||
                         prompt.toLowerCase().includes('chart') ||
                         prompt.toLowerCase().includes('statistics')

    // Gather context if needed
    if (!conversationContext.hasImageContext && isInfographic) {
      addNivMessage(
        "I will help you create a compelling infographic! To make it informative and visually appealing, please provide:\n\n" +
        `📊 **Data Points**: What specific numbers, percentages, or trends?\n` +
        `📈 **Key Message**: What's the main story or insight?\n` +
        `🎨 **Visual Style**: Corporate, modern, minimalist, or colorful?\n` +
        `📝 **Text Elements**: Headlines, labels, or callouts needed?\n\n` +
        `For example: "Show 150% growth from 2020-2024, $50B market size, top 5 companies with market share"\n\n` +
        `The more specific you are, the better the result!`,
        [
          {
            label: "I will provide details",
            action: () => {
              setConversationContext({
                ...conversationContext,
                hasImageContext: false // Keep asking for details
              })
            },
            icon: Edit3
          },
          {
            label: 'Generate with AI assumptions',
            action: async () => {
              setConversationContext({
                ...conversationContext,
                hasImageContext: true,
                imageDetails: { style: 'professional', aspectRatio: '16:9' }
              })
              // Enhance with placeholder data
              const enrichedPrompt = `${prompt} with specific data points, trend lines, percentage breakdowns, and clear visual hierarchy`
              await generateImage(enrichedPrompt, 'professional', '16:9')
            },
            icon: Sparkles
          }
        ]
      )
      return
    } else if (!conversationContext.hasImageContext) {
      // For non-infographic images
      addNivMessage(
        `Great! To create the perfect image, let me understand your needs:\n\n` +
        `• What style do you prefer? (professional, artistic, photorealistic)\n` +
        `• What aspect ratio? (16:9 for presentations, 1:1 for social, 9:16 for stories)\n` +
        `• What key elements should be included?\n` +
        `• Any colors or brand guidelines?\n\n` +
        `Share these details or just describe what you envision!`,
        [
          {
            label: 'Professional style, 16:9',
            action: () => {
              setConversationContext({
                ...conversationContext,
                hasImageContext: true,
                imageDetails: { style: 'professional', aspectRatio: '16:9' }
              })
              generateImage(prompt, 'professional', '16:9')
            },
            icon: Palette
          },
          {
            label: 'Generate with defaults',
            action: () => generateImage(prompt, 'professional', '16:9'),
            icon: Sparkles
          }
        ]
      )
      return
    }

    // Generate the image with context
    await generateImage(prompt, conversationContext.imageDetails?.style, conversationContext.imageDetails?.aspectRatio)
  }

  const handleVideoGeneration = async (prompt: string) => {
    // Gather context if needed
    if (!conversationContext.hasVideoContext) {
      addNivMessage(
        `Perfect! For your video, I need to know:\n\n` +
        `• How long? (15, 30, or 60 seconds)\n` +
        `• What style? (corporate, cinematic, animated)\n` +
        `• What's the key message or story?\n` +
        `• Any specific scenes you envision?\n\n` +
        `Tell me your vision and I will create it!`,
        [
          {
            label: '15-second corporate',
            action: () => {
              setConversationContext({
                ...conversationContext,
                hasVideoContext: true,
                videoDetails: { duration: 15, style: 'corporate' }
              })
              generateVideo(prompt, 15, 'corporate')
            },
            icon: Film
          },
          {
            label: '30-second cinematic',
            action: () => {
              setConversationContext({
                ...conversationContext,
                hasVideoContext: true,
                videoDetails: { duration: 30, style: 'cinematic' }
              })
              generateVideo(prompt, 30, 'cinematic')
            },
            icon: Video
          }
        ]
      )
      return
    }

    // Generate the video
    await generateVideo(
      prompt,
      conversationContext.videoDetails?.duration,
      conversationContext.videoDetails?.style
    )
  }

  const handlePresentationGeneration = async (prompt: string) => {
    // Gather context if needed
    if (!conversationContext.hasPresentationContext) {
      addNivMessage(
        `Perfect! I will help you create a professional presentation. To make it impactful:\n\n` +
        `• What's the main topic or objective?\n` +
        `• Who's your audience? (investors, team, customers, executives)\n` +
        `• How many slides do you need? (10-15 is typical)\n` +
        `• What style? (professional, creative, minimal, bold)\n` +
        `• Any specific data or metrics to include?\n\n` +
        `Share these details or describe your presentation needs!`,
        [
          {
            label: 'Investor deck (12 slides)',
            action: () => {
              setConversationContext({
                ...conversationContext,
                hasPresentationContext: true,
                presentationDetails: {
                  audience: 'investors',
                  numCards: 12,
                  tone: 'professional'
                }
              })
              generatePresentation(prompt || 'Investor presentation', 'investors', 12)
            },
            icon: Presentation
          },
          {
            label: 'Team update (10 slides)',
            action: () => {
              setConversationContext({
                ...conversationContext,
                hasPresentationContext: true,
                presentationDetails: {
                  audience: 'team',
                  numCards: 10,
                  tone: 'casual'
                }
              })
              generatePresentation(prompt || 'Team update presentation', 'team', 10)
            },
            icon: Presentation
          }
        ]
      )
      return
    }

    // Generate the presentation
    await generatePresentation(
      prompt,
      conversationContext.presentationDetails?.audience,
      conversationContext.presentationDetails?.numCards
    )
  }

  const generatePresentation = async (title: string, audience = 'general', numCards = 10) => {
    setIsTyping(true)

    try {
      addNivMessage("Creating your presentation with Gamma AI. This will take 1-2 minutes...")

      const response = await fetch('/api/supabase/functions/gamma-presentation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          framework,
          format: 'presentation',
          options: {
            numCards,
            audience,
            tone: conversationContext.presentationDetails?.tone || 'professional',
            imageSource: 'ai',
            themeName: 'auto'
          }
        })
      })

      const result = await response.json()

      if (result.success) {
        addNivMessage(
          `✨ Your presentation is ready! It includes ${numCards} professionally designed slides with AI-generated visuals.\n\n` +
          `You can view, edit, and export it from Gamma.`,
          [
            {
              label: 'Open in Gamma',
              action: () => window.open(result.gammaUrl, '_blank'),
              icon: Presentation
            },
            {
              label: 'Check Status',
              action: () => checkPresentationStatus(result.generationId),
              icon: Zap
            },
            {
              label: 'Create Another',
              action: () => {
                setConversationContext({ ...conversationContext, hasPresentationContext: false })
                setInput('')
              },
              icon: Wand2
            }
          ]
        )

        // Save to content library
        onContentGenerated({
          id: result.generationId,
          type: 'presentation' as ContentType,
          title,
          content: result.gammaUrl,
          status: 'completed',
          metadata: {
            gammaUrl: result.gammaUrl,
            generationId: result.generationId,
            creditsUsed: result.creditsUsed,
            audience,
            numCards
          }
        })
      } else if (result.fallback) {
        addNivMessage(
          `I will create a presentation outline for you:\n\n${result.fallback.instructions}`,
          [
            {
              label: 'Copy outline',
              action: () => navigator.clipboard.writeText(result.fallback.instructions),
              icon: Copy
            }
          ]
        )
      }
    } catch (error) {
      addNivMessage("I encountered an issue creating the presentation. Let's try again with different details.")
    } finally {
      setIsTyping(false)
    }
  }

  const checkPresentationStatus = async (generationId: string) => {
    try {
      const response = await fetch(`/api/supabase/functions/gamma-presentation?id=${generationId}`)
      const status = await response.json()

      if (status.success && status.status === 'completed') {
        addNivMessage(
          "✅ Your presentation is fully generated and ready for export!",
          status.exportUrls ? [
            {
              label: 'Download PDF',
              action: () => window.open(status.exportUrls.pdf, '_blank'),
              icon: Download
            },
            {
              label: 'Download PPTX',
              action: () => window.open(status.exportUrls.pptx, '_blank'),
              icon: Download
            }
          ] : []
        )
      } else {
        addNivMessage(`Presentation status: ${status.status || 'Processing...'}`)
      }
    } catch (error) {
      addNivMessage("Couldn't check status. The presentation should be ready in Gamma soon.")
    }
  }

  const handleMediaListGeneration = async (prompt: string) => {
    setIsTyping(true)

    try {
      const response = await fetch('/api/supabase/functions/media-list-generation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: prompt,
          framework,
          organization: organization?.name || 'Organization',
          tier1Count: 15,
          tier2Count: 30
        })
      })

      const result = await response.json()

      if (result.success) {
        addNivMessage(
          `I have compiled a targeted media list with ${result.tier1Count + result.tier2Count} contacts:`,
          [
            {
              label: 'Export as CSV',
              action: () => exportMediaList(result.mediaTargets, 'csv'),
              icon: Download
            },
            {
              label: 'Save to Library',
              action: () => onContentGenerated(result),
              icon: Save
            }
          ]
        )

        // Show the media list
        setMessages(prev => [...prev, {
          id: generateMessageId('media-list'),
          role: 'niv',
          content: formatMediaList(result.mediaTargets),
          timestamp: new Date(),
          generatedContent: result
        }])
      }
    } catch (error) {
      addNivMessage("I had trouble generating the media list. Could you try again with more details?")
    } finally {
      setIsTyping(false)
    }
  }

  const generateImage = async (prompt: string, style = 'professional', aspectRatio = '16:9') => {
    setIsTyping(true)

    try {
      // First, enhance the prompt using Claude
      addNivMessage("Let me create a detailed visual specification for your image...")

      const enhancedPrompt = await enhanceImagePrompt(prompt, style)

      // Show the enhanced prompt to user
      addNivMessage(
        `I have prepared a detailed prompt for your ${prompt.includes('infographic') ? 'infographic' : 'image'}:\n\n` +
        `"${enhancedPrompt}"\n\n` +
        `Generating the image now...`
      )

      const response = await fetch('/api/supabase/functions/content-visual-generation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'image',
          prompt: enhancedPrompt, // Use the enhanced prompt
          originalPrompt: prompt,  // Keep original for reference
          style,
          aspectRatio,
          framework
        })
      })

      const result = await response.json()

      if (result.success && result.images) {
        const image = result.images[0]

        addNivMessage(
          "Here's your generated image:",
          [
            {
              label: 'Generate another version',
              action: () => generateImage(prompt, style, aspectRatio),
              icon: Wand2
            },
            {
              label: 'Download',
              action: () => downloadImage(image.url),
              icon: Download
            },
            {
              label: 'Save to Library',
              action: () => onContentGenerated({ type: 'image', ...image }),
              icon: Save
            }
          ]
        )

        // Add image to messages
        setMessages(prev => [...prev, {
          id: generateMessageId('image'),
          role: 'niv',
          content: '',
          timestamp: new Date(),
          mediaContent: {
            url: image.url,
            type: 'image',
            metadata: image.metadata
          }
        }])
      } else if (result.fallback) {
        addNivMessage(
          `I will create a visual brief for you to work with:\n\n${result.fallback.content}\n\n` +
          `This can be created manually or with other design tools.`,
          [
            {
              label: 'Copy brief',
              action: () => navigator.clipboard.writeText(result.fallback.content),
              icon: Copy
            },
            {
              label: 'Try different prompt',
              action: () => setInput(''),
              icon: Wand2
            }
          ]
        )
      }
    } catch (error) {
      addNivMessage("I encountered an issue generating the image. Let's try a different approach.")
    } finally {
      setIsTyping(false)
    }
  }

  const generateVideo = async (prompt: string, duration = 15, style = 'corporate') => {
    setIsTyping(true)

    try {
      const response = await fetch('/api/supabase/functions/content-visual-generation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'video',
          prompt,
          duration,
          style,
          framework
        })
      })

      const result = await response.json()

      if (result.success && result.jobId) {
        addNivMessage(
          `Your ${duration}-second video is being generated. This typically takes ${result.estimatedTime}.\n\n` +
          `I will notify you when it is ready!`,
          [
            {
              label: 'Check status',
              action: () => checkVideoStatus(result.jobId),
              icon: Loader2
            },
            {
              label: 'Generate another',
              action: () => generateVideo(prompt, duration, style),
              icon: Film
            }
          ]
        )

        // Start polling for video completion
        pollVideoStatus(result.jobId)
      } else if (result.fallback) {
        addNivMessage(
          `Here's a video script you can use for production:\n\n${result.fallback.content}\n\n` +
          `Duration: ${duration} seconds\nStyle: ${style}`,
          [
            {
              label: 'Copy script',
              action: () => navigator.clipboard.writeText(result.fallback.content),
              icon: Copy
            }
          ]
        )
      }
    } catch (error) {
      addNivMessage("Video generation encountered an issue. Let me provide a script instead.")
    } finally {
      setIsTyping(false)
    }
  }

  const pollVideoStatus = async (jobId: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/webhooks/veo/${jobId}`)
        const data = await response.json()

        if (data.status === 'completed' && data.videoUrl) {
          clearInterval(interval)

          addNivMessage(
            "Your video is ready!",
            [
              {
                label: 'Download',
                action: () => downloadVideo(data.videoUrl),
                icon: Download
              },
              {
                label: 'Save to Library',
                action: () => onContentGenerated({ type: 'video', url: data.videoUrl }),
                icon: Save
              }
            ]
          )

          // Add video to messages
          setMessages(prev => [...prev, {
            id: generateMessageId('video'),
            role: 'niv',
            content: '',
            timestamp: new Date(),
            mediaContent: {
              url: data.videoUrl,
              type: 'video',
              metadata: data.metadata
            }
          }])
        }
      } catch (error) {
        console.error('Error polling video status:', error)
      }
    }, 10000)

    // Stop polling after 5 minutes
    setTimeout(() => clearInterval(interval), 300000)
  }

  const checkVideoStatus = async (jobId: string) => {
    // Implementation for manual status check
    console.log('Checking video status:', jobId)
  }

  const generateTextContent = async (type: ContentType, prompt: string) => {
    try {
      // First, have a conversation to understand the context
      const conversationalPrompts: Record<ContentType, string> = {
        'press-release': `Great! Let me help craft a compelling press release. To make it newsworthy and impactful, I need to understand:\n\n📰 **The News**: What's the announcement? (Product launch, partnership, milestone, etc.)\n🎯 **The Hook**: Why should journalists care? What makes this unique?\n📊 **Key Facts**: Any specific numbers, dates, or achievements?\n💬 **Quotes**: Who should be quoted? (CEO, customers, partners?)\n\nShare what you have in mind, and I will shape it into a professional press release.`,
        'social-post': `Perfect! Let me create engaging social content. Quick questions:\n\n🎯 **Platform**: LinkedIn, Twitter/X, Instagram, or multi-platform?\n🎨 **Tone**: Professional, casual, inspirational, or educational?\n📌 **Goal**: Awareness, engagement, clicks, or conversions?\n#️⃣ **Hashtags**: Any specific ones to include?\n\nTell me about your message and I will optimize it for maximum impact.`,
        'exec-statement': `I will help craft an executive statement that resonates. Let me understand:\n\n👤 **Executive**: Who's speaking? (CEO, CTO, founder?)\n🎤 **Context**: Internal announcement, public statement, or crisis response?\n🎯 **Audience**: Employees, investors, customers, or media?\n💡 **Key Message**: What's the core point they need to convey?\n\nShare the context and I will create an authentic, impactful statement.`,
        'crisis-response': `This is important - let me help you respond effectively. I need to know:\n\n🚨 **Situation**: What happened? (Brief factual summary)\n⏰ **Timeline**: When did this occur? How urgent is the response?\n👥 **Stakeholders**: Who's affected? (Customers, employees, partners)\n✅ **Actions**: What steps are you taking to address it?\n\nThe more context you provide, the better I can help craft a measured, appropriate response.`,
        'email': `Let me craft an effective email campaign. Tell me about:\n\n📧 **Type**: Newsletter, announcement, nurture, or promotional?\n👥 **Audience**: Who are we reaching? (Prospects, customers, partners)\n🎯 **Call-to-Action**: What do you want recipients to do?\n📊 **Personalization**: Any segments or custom fields to use?\n\nDescribe your campaign goals and I will create compelling email content.`,
        'qa-doc': `I will prepare a comprehensive Q&A document. Help me understand:\n\n📋 **Topic**: What's the subject? (Product, announcement, issue)\n🎯 **Audience**: Internal teams, media, customers, or public?\n❓ **Known Questions**: Any specific concerns to address?\n📊 **Depth**: Quick FAQs or detailed responses?\n\nShare the topic and any specific questions you anticipate.`,
        'media-pitch': `Let me craft a pitch that gets noticed. I need to know:\n\n📰 **Story Angle**: What's your unique hook?\n🎯 **Target Media**: Tech, business, trade, or mainstream?\n⏰ **Timing**: Any embargo or launch date?\n📊 **Assets**: What can you offer? (Interviews, data, visuals)\n\nTell me your story and I will create a pitch that journalists want to cover.`,
        'thought-leadership': `Let's establish your thought leadership. Tell me:\n\n🧠 **Topic**: What industry insight or trend?\n👤 **Author**: Who's the thought leader?\n🎯 **Angle**: Contrarian, visionary, analytical, or educational?\n📊 **Evidence**: Any data, case studies, or examples?\n\nShare your perspective and I will craft content that positions you as an industry leader.`,
        'messaging': `I will help develop your core messaging. Let's define:\n\n🎯 **Purpose**: Brand messaging, product positioning, or campaign?\n👥 **Audience**: Who needs to understand this?\n💡 **Differentiation**: What makes you unique?\n🗣️ **Voice**: How should it sound? (Bold, trustworthy, innovative)\n\nDescribe what you need to communicate and I will create clear, consistent messaging.`
      }

      // Show conversational prompt if we haven't gathered context yet
      if (!conversationContext.needsMoreInfo && conversationalPrompts[type]) {
        addNivMessage(
          conversationalPrompts[type],
          [
            {
              label: 'I have all the details',
              action: () => {
                setConversationContext({ ...conversationContext, needsMoreInfo: true })
                actuallyGenerateContent(type, prompt)
              },
              icon: ChevronRight
            },
            {
              label: 'Use my framework',
              action: () => {
                setConversationContext({ ...conversationContext, needsMoreInfo: true })
                actuallyGenerateContent(type, prompt, true)
              },
              icon: Brain
            }
          ]
        )
        return
      }

      // Generate the actual content
      await actuallyGenerateContent(type, prompt)
    } catch (error) {
      console.error('Text generation error:', error)
      addNivMessage('I encountered an issue. Could you provide more details about what you need?')
    } finally {
      setIsTyping(false)
    }
  }

  const actuallyGenerateContent = async (type: ContentType, prompt: string, useFramework = false) => {
    setIsTyping(true)

    try {
      // Build request with framework if available
      const request: ContentGenerationRequest = {
        type,
        prompt: useFramework && framework ?
          `Using this strategic framework: ${JSON.stringify(framework)}\n\nCreate: ${prompt}` :
          prompt,
        context: {
          framework: useFramework ? framework : undefined,
          organization: organization || undefined
        },
        options: {
          audience: ['professional'] as AudienceType[],
          tone: 'professional'
        }
      }

      // Use static method
      const result = await ContentGenerationService.generateContent(request)

      if (result.content) {
        // Show the generated content with options
        addNivMessage(
          `Here's your ${EXTENDED_CONTENT_TYPE_LABELS[type]}:\n\n${result.content}`,
          [
            {
              label: 'Perfect! Save it',
              action: () => {
                onContentGenerated(result)
                addNivMessage('Saved to your content library! What would you like to create next?')
              },
              icon: Check
            },
            {
              label: 'Refine this',
              action: () => {
                setConversationContext({ ...conversationContext, needsMoreInfo: false })
                addNivMessage('What would you like to adjust? Be specific about the changes you need.')
              },
              icon: Edit3
            },
            {
              label: 'Try different angle',
              action: () => actuallyGenerateContent(type, prompt, useFramework),
              icon: Wand2
            }
          ]
        )

        // Store as generated content
        setMessages(prev => [...prev, {
          id: generateMessageId('content'),
          role: 'niv',
          content: '',
          timestamp: new Date(),
          contentType: type,
          generatedContent: result
        }])
      }
    } catch (error) {
      console.error('Content generation error:', error)
      addNivMessage('Let me try a different approach. Can you tell me more about what you need?')
    } finally {
      setIsTyping(false)
    }
  }

  const formatMediaList = (targets: any[]): string => {
    const tier1 = targets.filter(t => t.tier === 1)
    const tier2 = targets.filter(t => t.tier === 2)

    return `**Tier 1 Targets (${tier1.length})**\n` +
      tier1.map(t => `• ${t.name} - ${t.outlet} (${t.beat})`).join('\n') +
      `\n\n**Tier 2 Targets (${tier2.length})**\n` +
      tier2.map(t => `• ${t.name} - ${t.outlet} (${t.beat})`).join('\n')
  }

  const exportMediaList = (targets: any[], format: string) => {
    // Export logic
    console.log('Exporting media list as', format)
  }

  const downloadImage = (url: string) => {
    const link = document.createElement('a')
    link.href = url
    link.download = `image-${Date.now()}.png`
    link.click()
  }

  const downloadVideo = (url: string) => {
    const link = document.createElement('a')
    link.href = url
    link.download = `video-${Date.now()}.mp4`
    link.click()
  }

  // Enhance image prompt using Claude for better Vertex AI results
  const enhanceImagePrompt = async (userPrompt: string, style: string): Promise<string> => {
    try {
      const response = await fetch('/api/niv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: `You are an expert at creating detailed image generation prompts for Google's Imagen 3 AI model. Convert this user request into a highly detailed, specific prompt that will generate a high-quality image.

User request: "${userPrompt}"
Style: ${style}

Rules for the enhanced prompt:
1. Be extremely specific about visual elements, composition, and layout
2. For infographics: specify exact data points, chart types, labels, and visual hierarchy
3. Include color schemes, lighting, and artistic style
4. Mention specific objects, text overlays, and their positions
5. Keep it under 150 words but be very detailed
6. Focus on visual description, not conceptual explanation
7. For data visualizations: specify exact numbers, percentages, trends

Generate ONLY the enhanced prompt, nothing else. Make it photorealistic and professional.`
          }],
          mode: 'prompt-enhancement',
          temperature: 0.3
        })
      })

      if (response.ok) {
        const data = await response.json()
        return data.content || userPrompt // Fallback to original if enhancement fails
      }
    } catch (error) {
      console.error('Error enhancing prompt:', error)
    }

    // Fallback: basic enhancement
    if (userPrompt.toLowerCase().includes('infographic')) {
      return `Professional infographic design: ${userPrompt}. Clean layout with data visualization, charts, statistics, icons, modern color scheme (blues and grays), clear typography, organized sections with headers, white background, corporate style, high resolution, detailed labels and legends.`
    }

    return `${style} style image: ${userPrompt}. High quality, detailed, professional composition, good lighting, sharp focus.`
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleInput(input)
  }

  useEffect(() => {
    // Only scroll if there are new messages and the user isn't scrolled up
    if (messages.length > 0) {
      const scrollContainer = messagesEndRef.current?.parentElement
      if (scrollContainer) {
        const isNearBottom = scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight < 100
        if (isNearBottom || messages.length === 1) {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
        }
      }
    }
  }, [messages])

  return (
    <div className="niv-content-assistant h-full flex flex-col bg-gray-900">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/10 rounded-lg">
              <Brain className="w-6 h-6 text-yellow-500" />
            </div>
            <div>
              <h3 className="font-semibold text-white">NIV Content Assistant</h3>
              <p className="text-sm text-gray-400">
                {conversationContext.contentType
                  ? `Creating ${EXTENDED_CONTENT_TYPE_LABELS[conversationContext.contentType]}`
                  : 'Ready to create'
                }
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map(message => (
          <div key={message.id} className={`message ${message.role}`}>
            {message.role === 'niv' && (
              <div className="flex items-start gap-3">
                <div className="p-2 bg-yellow-500/10 rounded-lg">
                  <Sparkles className="w-5 h-5 text-yellow-500" />
                </div>
                <div className="flex-1">
                  <div className="prose prose-invert max-w-none">
                    <p className="text-gray-200 whitespace-pre-wrap">{message.content}</p>
                  </div>

                  {/* Display media content */}
                  {message.mediaContent && (
                    <div className="mt-4">
                      <MediaDisplay
                        mediaUrl={message.mediaContent.url}
                        mediaType={message.mediaContent.type}
                        metadata={message.mediaContent.metadata}
                      />
                    </div>
                  )}

                  {/* Suggestions */}
                  {message.suggestions && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {message.suggestions.map((suggestion, idx) => (
                        <button
                          key={idx}
                          onClick={suggestion.action}
                          className="px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center gap-2 text-sm transition-colors"
                        >
                          {suggestion.icon && <suggestion.icon className="w-4 h-4" />}
                          <span>{suggestion.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {message.role === 'user' && (
              <div className="flex justify-end">
                <div className="max-w-xl bg-yellow-500/10 px-4 py-3 rounded-lg">
                  <p className="text-gray-200">{message.content}</p>
                </div>
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex items-center gap-2 text-gray-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>NIV is thinking...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-800">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSubmit(e)
              }
            }}
            placeholder={
              conversationContext.contentType === 'image'
                ? "Describe the image you want..."
                : conversationContext.contentType === 'video'
                ? "Describe your video concept..."
                : "Type your message..."
            }
            className="flex-1 px-4 py-3 bg-gray-800 text-white rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-yellow-500"
            rows={2}
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="px-4 py-2 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  )
}