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
  ChevronRight,
  ExternalLink,
  CheckCircle
} from 'lucide-react'
import type { NivStrategicFramework } from '@/types/niv-strategic-framework'
import type { ContentItem } from '@/types/content'
import { useAppStore } from '@/stores/useAppStore'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co'

interface NIVContentOrchestratorProps {
  framework?: NivStrategicFramework
  selectedContentType?: string
  onContentGenerated?: (content: ContentItem) => void
  onContentSave?: (content: ContentItem) => void
  className?: string
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string | { text?: string, image?: string, video?: string }
  timestamp: Date
  error?: boolean
  contentItem?: ContentItem
  strategy?: any
  generationId?: string
  presentationUrl?: string
  isAsync?: boolean
}

export default function NIVContentOrchestratorSimplified({
  framework,
  selectedContentType,
  onContentGenerated,
  onContentSave,
  className = ''
}: NIVContentOrchestratorProps) {
  const { organization } = useAppStore()
  const [messages, setMessages] = useState<Message[]>([{
    id: 'initial-greeting',
    role: 'assistant',
    content: `What would you like to create?`,
    timestamp: new Date()
  }])
  const [input, setInput] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const [conversationId] = useState(`conv-${Date.now()}`)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false)
  const [pendingStrategy, setPendingStrategy] = useState<any>(null)
  const [presentationPollingIds, setPresentationPollingIds] = useState<Set<string>>(new Set())
  const [awaitingWhat, setAwaitingWhat] = useState<'follow-up' | 'approval' | 'orchestration-approval' | null>(null)
  const [storedUnderstanding, setStoredUnderstanding] = useState<any>(null)
  const [storedResearch, setStoredResearch] = useState<any>(null)
  const [consultantPhase, setConsultantPhase] = useState<'discovery' | 'research' | 'strategy' | 'refinement' | 'execution' | null>(null)
  const [userAnswers, setUserAnswers] = useState<any>({})
  const [currentFramework, setCurrentFramework] = useState<any>(null)

  // NO MORE CANNED RESPONSES - NIV always thinks with Claude!

  // Scroll to bottom
  useEffect(() => {
    const chatContainer = messagesEndRef.current?.parentElement
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight
    }
  }, [messages])

  // SIMPLIFIED: Always call niv-content-robust
  const handleSend = async () => {
    if (!input.trim() || isThinking) return

    const userMessage = input.trim()
    setInput('')

    // Add user message to chat
    setMessages(prev => [...prev, {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    }])

    setIsThinking(true)

    try {
      console.log('🎯 Calling niv-content-robust with:', {
        message: userMessage,
        contentType: selectedContentType,
        hasFramework: !!framework
      })

      const authToken = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

      // Determine what to do based on awaiting state
      let specialHandling = null

      // If awaiting approval of proposal, kick off research
      if (awaitingWhat === 'approval' && userMessage.toLowerCase().match(/yes|yeah|sure|sounds good|go ahead|proceed/)) {
        const lastMessage = messages[messages.length - 1]
        if (lastMessage?.researchQuery) {
          specialHandling = {
            type: 'approved_proposal',
            researchQuery: lastMessage.researchQuery
          }
        } else if (currentFramework) {
          specialHandling = {
            type: 'approved_framework',
            framework: currentFramework
          }
        }
      }

      // Call niv-content-intelligent-v2 - Strategic Framework intelligence for content
      const response = await fetch(`${SUPABASE_URL}/functions/v1/niv-content-intelligent-v2`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          message: userMessage,
          approvedProposal: specialHandling?.type === 'approved_proposal' ? { researchQuery: specialHandling.researchQuery } : undefined,
          // Send FULL conversation history like Strategic Framework
          conversationHistory: messages.map(msg => ({
            role: msg.role,
            content: typeof msg.content === 'string' ? msg.content : msg.content?.text || '',
            analysis: msg.analysis,
            research: msg.research,
            framework: msg.framework,
            timestamp: msg.timestamp
          })),
          // Rich organization context
          organizationContext: organization || {
            name: 'OpenAI',
            industry: 'Technology',
            positioning: 'Leading AI company',
            strengths: ['Innovation', 'Research excellence'],
            narratives: []
          },
          context: {
            framework: currentFramework || framework
          }
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('NIV error:', errorText)
        throw new Error(`NIV failed: ${response.status}`)
      }

      const data = await response.json()
      console.log('NIV Response:', data)

      // Handle response based on mode (niv-content-intelligent-v2)
      if (data.success) {
        // QUESTION MODE - NIV needs specific information
        if (data.mode === 'question') {
          setMessages(prev => [...prev, {
            id: `msg-${Date.now()}`,
            role: 'assistant',
            content: data.message,
            timestamp: new Date()
          }])
          setAwaitingWhat('answer')
          setIsThinking(false)
          return
        }

        // NARRATIVE OPTIONS - NIV presents narrative choices
        if (data.mode === 'narrative_options') {
          setMessages(prev => [...prev, {
            id: `msg-${Date.now()}`,
            role: 'assistant',
            content: data.message,
            narrativeOptions: data.narrativeOptions,
            timestamp: new Date()
          }])
          setAwaitingWhat('narrative-choice')
          setIsThinking(false)
          return
        }

        // GENERATION COMPLETE - All content pieces created
        if (data.mode === 'generation_complete') {
          setMessages(prev => [...prev, {
            id: `msg-${Date.now()}`,
            role: 'assistant',
            content: data.message,
            timestamp: new Date()
          }])

          // Add each generated content piece
          if (data.generatedContent && Array.isArray(data.generatedContent)) {
            data.generatedContent.forEach((item: any, index: number) => {
              const contentItem: ContentItem = {
                id: `content-${Date.now()}-${index}`,
                type: item.type,
                content: typeof item.content === 'string' ? item.content : JSON.stringify(item.content),
                metadata: {
                  generatedBy: 'niv-content-intelligent-v2',
                  contentType: item.type,
                  organization: organization?.name
                },
                saved: false,
                timestamp: Date.now()
              }

              if (onContentGenerated) {
                onContentGenerated(contentItem)
              }

              setMessages(prev => [...prev, {
                id: `msg-${Date.now()}-content-${index}`,
                role: 'assistant',
                content: `**${item.type.replace('-', ' ').toUpperCase()}**`,
                timestamp: new Date(),
                contentItem
              }])
            })
          }

          // Show errors if any
          if (data.errors && data.errors.length > 0) {
            setMessages(prev => [...prev, {
              id: `msg-${Date.now()}-errors`,
              role: 'assistant',
              content: `⚠️ ${data.errors.length} piece(s) had errors:\n${data.errors.map((e: any) => `• ${e.type}: ${e.error}`).join('\n')}`,
              timestamp: new Date()
            }])
          }

          setAwaitingWhat(null)
          setIsThinking(false)
          return
        }

        // CONVERSATION MODE - General response
        if (data.mode === 'conversation') {
          setMessages(prev => [...prev, {
            id: `msg-${Date.now()}`,
            role: 'assistant',
            content: data.message,
            timestamp: new Date()
          }])
          setIsThinking(false)
          return
        }

        // PROPOSAL MODE - Consultant proposing an approach
        if (data.mode === 'proposal') {
          setMessages(prev => [...prev, {
            id: `msg-${Date.now()}`,
            role: 'assistant',
            content: data.message,
            proposedApproach: data.proposedApproach,
            researchQuery: data.researchQuery,
            timestamp: new Date()
          }])
          setAwaitingWhat('approval')
          setIsThinking(false)
          return
        }

        // CONSULTATION MODE - Needs user response
        if (data.mode === 'consultation') {
          setMessages(prev => [...prev, {
            id: `msg-${Date.now()}`,
            role: 'assistant',
            content: data.message,
            timestamp: new Date()
          }])
          setAwaitingWhat('follow-up')
          setIsThinking(false)
          return
        }

        // CONTENT DELIVERED - Simple creation complete
        if (data.mode === 'content_delivered') {
          setMessages(prev => [...prev, {
            id: `msg-${Date.now()}`,
            role: 'assistant',
            content: data.message,
            timestamp: new Date()
          }])

          if (data.content) {
            const contentItem: ContentItem = {
              id: `content-${Date.now()}`,
              type: data.contentType,
              content: typeof data.content === 'string' ? data.content : JSON.stringify(data.content),
              metadata: {
                generatedBy: 'niv-content-intelligent-v2',
                contentType: data.contentType,
                organization: organization?.name
              },
              saved: false,
              timestamp: Date.now()
            }

            if (onContentGenerated) {
              onContentGenerated(contentItem)
            }

            setMessages(prev => [...prev, {
              id: `msg-${Date.now()}-content`,
              role: 'assistant',
              content: '',
              timestamp: new Date(),
              contentItem
            }])
          }

          setAwaitingWhat(null)
          setIsThinking(false)
          return
        }

        // SIMPLE QUESTIONS MODE - Quick questions before generation
        if (data.mode === 'simple_questions') {
          setMessages(prev => [...prev, {
            id: `msg-${Date.now()}`,
            role: 'assistant',
            content: data.message,
            analysis: data.analysis,
            questions: data.questions,
            timestamp: new Date()
          }])

          // Store analysis for next phase
          setStoredUnderstanding(data.analysis)
          setAwaitingWhat('follow-up')

          // When user responds, we need to store their answers
          // This will be handled in the phase detection logic
          setIsThinking(false)
          return
        }

        // SIMPLE COMPLETE - Content generated from quick workflow
        if (data.mode === 'simple_complete') {
          setMessages(prev => [...prev, {
            id: `msg-${Date.now()}`,
            role: 'assistant',
            content: data.message,
            timestamp: new Date()
          }])

          if (data.content) {
            const contentItem: ContentItem = {
              id: `content-${Date.now()}`,
              type: data.contentType,
              content: typeof data.content === 'string' ? data.content : JSON.stringify(data.content),
              metadata: {
                generatedBy: 'niv-content-intelligent-v2',
                contentType: data.contentType,
                organization: organization?.name
              },
              saved: false,
              timestamp: Date.now()
            }

            if (onContentGenerated) {
              onContentGenerated(contentItem)
            }

            setMessages(prev => [...prev, {
              id: `msg-${Date.now()}-content`,
              role: 'assistant',
              content: '',
              timestamp: new Date(),
              contentItem
            }])
          }

          setAwaitingWhat(null)
          setUserAnswers({})
          setIsThinking(false)
          return
        }

        // COMPLEX QUESTIONS MODE - Questions + research in parallel
        if (data.mode === 'complex_questions') {
          setMessages(prev => [...prev, {
            id: `msg-${Date.now()}`,
            role: 'assistant',
            content: data.message,
            analysis: data.analysis,
            timestamp: new Date()
          }])

          // Store research query for later
          if (data.researchQuery) {
            setStoredResearch({ query: data.researchQuery })
          }

          setAwaitingWhat('follow-up')
          setIsThinking(false)
          return
        }

        // FRAMEWORK PRESENTATION - Strategic framework ready for approval
        if (data.mode === 'framework_presentation') {
          setMessages(prev => [...prev, {
            id: `msg-${Date.now()}`,
            role: 'assistant',
            content: data.message,
            framework: data.framework,
            timestamp: new Date()
          }])

          setCurrentFramework(data.framework)
          setAwaitingWhat('approval')
          setIsThinking(false)
          return
        }

        // GENERATION COMPLETE - All content pieces created
        if (data.mode === 'generation_complete') {
          setMessages(prev => [...prev, {
            id: `msg-${Date.now()}`,
            role: 'assistant',
            content: data.message,
            timestamp: new Date()
          }])

          // Add each generated content piece
          if (data.generatedContent && Array.isArray(data.generatedContent)) {
            data.generatedContent.forEach((item: any, index: number) => {
              const contentItem: ContentItem = {
                id: `content-${Date.now()}-${index}`,
                type: item.type,
                content: typeof item.content === 'string' ? item.content : JSON.stringify(item.content),
                metadata: {
                  generatedBy: 'niv-content-intelligent-v2',
                  contentType: item.type,
                  priority: item.priority,
                  purpose: item.purpose,
                  framework: data.framework,
                  organization: organization?.name
                },
                saved: false,
                timestamp: Date.now()
              }

              if (onContentGenerated) {
                onContentGenerated(contentItem)
              }

              setMessages(prev => [...prev, {
                id: `msg-${Date.now()}-${index}`,
                role: 'assistant',
                content: `**${item.type.replace('-', ' ').toUpperCase()}** (${item.priority} priority)`,
                timestamp: new Date(),
                contentItem
              }])
            })
          }

          // Show errors if any
          if (data.errors && data.errors.length > 0) {
            setMessages(prev => [...prev, {
              id: `msg-${Date.now()}-errors`,
              role: 'assistant',
              content: `⚠️ ${data.errors.length} piece(s) had generation errors:\n${data.errors.map((e: any) => `• ${e.type}: ${e.error}`).join('\n')}`,
              timestamp: new Date(),
              error: true
            }])
          }

          // Show next steps
          if (data.nextSteps) {
            const steps: string[] = []
            if (data.nextSteps.canRefine) steps.push('Request refinements to any piece')
            if (data.nextSteps.canExport) steps.push('Export as package')
            if (data.nextSteps.canCreatePresentation) steps.push('Package into Gamma presentation')

            if (steps.length > 0) {
              setMessages(prev => [...prev, {
                id: `msg-${Date.now()}-next`,
                role: 'assistant',
                content: `**Next Steps:**\n${steps.map(s => `• ${s}`).join('\n')}`,
                timestamp: new Date()
              }])
            }
          }

          // Reset workflow state
          setAwaitingWhat(null)
          setCurrentFramework(null)
          setUserAnswers({})
          setStoredResearch(null)
          setIsThinking(false)
          return
        }

        // CLARIFICATION MODE
        if (data.mode === 'clarification') {
          setMessages(prev => [...prev, {
            id: `msg-${Date.now()}`,
            role: 'assistant',
            content: data.message,
            timestamp: new Date()
          }])
          setIsThinking(false)
          return
        }

        // LEGACY HANDLERS (backward compatibility)
        // Handle discovery/clarification phase
        if (data.phase === 'discovery' || data.phase === 'clarification') {
          setMessages(prev => [...prev, {
            id: `msg-${Date.now()}`,
            role: 'assistant',
            content: data.message,
            questions: data.questions,
            intent: data.intent,
            timestamp: new Date()
          }])
          setConsultantPhase('discovery')
          setAwaitingWhat('follow-up')
          setIsThinking(false)
          return
        }

        // Handle research complete
        if (data.phase === 'research-complete') {
          setMessages(prev => [...prev, {
            id: `msg-${Date.now()}`,
            role: 'assistant',
            content: data.message,
            research: data.research,
            timestamp: new Date()
          }])
          setConsultantPhase(data.nextPhase)
          setIsThinking(false)
          // Auto-proceed to strategy
          setTimeout(() => handleSend(), 1000)
          return
        }

        // Handle strategy presentation
        if (data.phase === 'strategy-presentation' || data.phase === 'strategy-adjusted') {
          setMessages(prev => [...prev, {
            id: `msg-${Date.now()}`,
            role: 'assistant',
            content: data.message,
            framework: data.framework,
            timestamp: new Date()
          }])
          setCurrentFramework(data.framework)
          setConsultantPhase(data.nextPhase)
          setAwaitingWhat('approval')
          setIsThinking(false)
          return
        }

        // Handle approval confirmation
        if (data.phase === 'approved') {
          setMessages(prev => [...prev, {
            id: `msg-${Date.now()}`,
            role: 'assistant',
            content: data.message,
            timestamp: new Date()
          }])
          setConsultantPhase('execution')
          setAwaitingWhat(null)
          // Auto-proceed to execution
          setTimeout(() => handleSend(), 1000)
          return
        }

        // Handle execution complete
        if (data.phase === 'execution-complete') {
          setMessages(prev => [...prev, {
            id: `msg-${Date.now()}`,
            role: 'assistant',
            content: data.message,
            timestamp: new Date()
          }])

          // Add each generated piece
          data.content?.forEach((item: any, index: number) => {
            const contentItem: ContentItem = {
              id: `content-${Date.now()}-${index}`,
              type: item.type,
              content: typeof item.content === 'string' ? item.content : item.content?.text || JSON.stringify(item.content),
              metadata: {
                generatedBy: 'niv-content-consultant',
                contentType: item.type,
                label: item.label,
                framework: currentFramework,
                organization: organization?.name
              },
              saved: false,
              timestamp: Date.now()
            }

            if (onContentGenerated) {
              onContentGenerated(contentItem)
            }

            setMessages(prev => [...prev, {
              id: `msg-${Date.now()}-${index}`,
              role: 'assistant',
              content: `**${item.label}:**`,
              timestamp: new Date(),
              contentItem
            }])
          })

          // Show next steps
          if (data.orchestration?.nextSteps) {
            setMessages(prev => [...prev, {
              id: `msg-${Date.now()}-next`,
              role: 'assistant',
              content: `\n**Next Steps:**\n${data.orchestration.nextSteps.map((s: string) => `• ${s}`).join('\n')}`,
              timestamp: new Date()
            }])
          }

          setConsultantPhase(null)
          setAwaitingWhat(null)
          setCurrentFramework(null)
          setIsThinking(false)
          return
        }

        // OLD HANDLER (fallback):
        // Handle follow-up question
        if (data.mode === 'follow-up' && data.awaitingResponse) {
          console.log('❓ Follow-up question received:', data.message)

          setMessages(prev => [...prev, {
            id: `msg-${Date.now()}`,
            role: 'assistant',
            content: data.message,
            understanding: data.understanding, // Store understanding with this message
            research: data.research,           // Store research with this message
            timestamp: new Date()
          }])

          setAwaitingWhat('follow-up')
          if (data.understanding) {
            setStoredUnderstanding(data.understanding)
          }
          setIsThinking(false)
          return
        }

        // Handle strategic brief (waiting for approval)
        if (data.mode === 'strategic-brief' && data.awaitingApproval) {
          console.log('📋 Strategic brief received:', data.message)

          setMessages(prev => [...prev, {
            id: `msg-${Date.now()}`,
            role: 'assistant',
            content: data.message,
            understanding: data.understanding, // Store understanding with this message
            research: data.research,           // Store research with this message
            contentType: data.contentType,     // Store content type
            timestamp: new Date()
          }])

          setAwaitingWhat('approval')
          if (data.understanding) {
            setStoredUnderstanding(data.understanding)
          }
          if (data.research) {
            setStoredResearch(data.research)
          }
          setIsThinking(false)
          return
        }

        // Handle multi-content response (AND statements)
        if (data.mode === 'multi-content' && data.content && Array.isArray(data.content)) {
          console.log('📦 Multi-content response:', data.content)

          // Add assistant message
          setMessages(prev => [...prev, {
            id: `msg-${Date.now()}`,
            role: 'assistant',
            content: data.message || `Generated ${data.content.length} content pieces!`,
            timestamp: new Date()
          }])

          // Generate all content items
          data.content.forEach((item: any, index: number) => {
            const contentItem: ContentItem = {
              id: `content-${Date.now()}-${index}`,
              type: item.type,
              content: typeof item.content === 'string' ? item.content : item.content?.text || JSON.stringify(item.content),
              metadata: {
                generatedBy: 'niv-content-robust',
                contentType: item.type,
                label: item.label,
                organization: organization?.name,
                framework: framework?.title
              },
              saved: false,
              timestamp: Date.now()
            }

            // Trigger callback for each item
            if (onContentGenerated) {
              onContentGenerated(contentItem)
            }

            // Add to messages
            setMessages(prev => [...prev, {
              id: `msg-${Date.now()}-${index}`,
              role: 'assistant',
              content: `Here's your ${item.label}:`,
              timestamp: new Date(),
              contentItem
            }])
          })

          setIsThinking(false)
          setAwaitingWhat(null)
          setStoredUnderstanding(null)
          setStoredResearch(null)
          return
        }

        // Handle orchestration brief (multi-step package)
        if (data.mode === 'orchestration-brief' && data.awaitingApproval) {
          console.log('🎼 Orchestration brief received:', data.packageName)

          setMessages(prev => [...prev, {
            id: `msg-${Date.now()}`,
            role: 'assistant',
            content: data.message,
            understanding: data.understanding,
            orchestrationComponents: data.orchestrationComponents,
            packageType: data.packageType,
            packageName: data.packageName,
            timestamp: new Date()
          }])

          setAwaitingWhat('orchestration-approval')
          if (data.understanding) setStoredUnderstanding(data.understanding)
          setIsThinking(false)
          return
        }

        // Handle orchestration complete (all pieces generated)
        if (data.mode === 'orchestration-complete' && data.content && Array.isArray(data.content)) {
          console.log('🎉 Orchestration complete:', data.content.length, 'pieces')

          setMessages(prev => [...prev, {
            id: `msg-${Date.now()}`,
            role: 'assistant',
            content: data.message,
            timestamp: new Date()
          }])

          // Add each generated piece
          data.content.forEach((item: any, index: number) => {
            const contentItem: ContentItem = {
              id: `content-${Date.now()}-${index}`,
              type: item.type,
              content: typeof item.content === 'string' ? item.content : item.content?.text || JSON.stringify(item.content),
              metadata: {
                generatedBy: 'niv-content-intelligent',
                contentType: item.type,
                label: item.label,
                packageType: data.packageType,
                organization: organization?.name,
                framework: framework?.title
              },
              saved: false,
              timestamp: Date.now()
            }

            if (onContentGenerated) {
              onContentGenerated(contentItem)
            }

            setMessages(prev => [...prev, {
              id: `msg-${Date.now()}-${index}`,
              role: 'assistant',
              content: `${item.label}:`,
              timestamp: new Date(),
              contentItem
            }])
          })

          // Show orchestration next steps
          if (data.orchestration?.next_steps) {
            setMessages(prev => [...prev, {
              id: `msg-${Date.now()}-next`,
              role: 'assistant',
              content: `**Next Steps:**\n${data.orchestration.next_steps.map((s: string) => `• ${s}`).join('\n')}`,
              timestamp: new Date()
            }])
          }

          setAwaitingWhat(null)
          setStoredUnderstanding(null)
          setIsThinking(false)
          return
        }

        // Handle clarification mode (when NIV needs to know what content type)
        if (data.mode === 'clarification') {
          console.log('❓ Clarification needed:', data.message)

          setMessages(prev => [...prev, {
            id: `msg-${Date.now()}`,
            role: 'assistant',
            content: data.message,
            suggestedTypes: data.suggestedTypes,
            timestamp: new Date()
          }])

          setIsThinking(false)
          return
        }

        // Reset waiting states after successful generation
        setAwaitingWhat(null)
        setStoredUnderstanding(null)
        setStoredResearch(null)

        // Add NIV's message
        if (data.message) {
          setMessages(prev => [...prev, {
            id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            role: 'assistant',
            content: data.message,
            timestamp: new Date()
          }])
        }

        // Handle tool results (generated content)
        if (data.tool_results && Array.isArray(data.tool_results)) {
          for (const toolResult of data.tool_results) {
            if (toolResult.success) {
              // Handle different content types
              if (toolResult.content_type === 'image' && toolResult.image_url) {
                // Image generated
                setMessages(prev => [...prev, {
                  id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  role: 'assistant',
                  content: toolResult.image_url,
                  timestamp: new Date(),
                  contentItem: {
                    id: `image-${Date.now()}`,
                    type: 'image',
                    content: toolResult.image_url,
                    saved: false,
                    timestamp: Date.now()
                  }
                }])
              } else if (toolResult.content_type === 'media-plan') {
                // Media plan with multiple components
                for (const component of toolResult.components || []) {
                  if (component.success) {
                    setMessages(prev => [...prev, {
                      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                      role: 'assistant',
                      content: `✅ ${component.component}: Generated`,
                      timestamp: new Date(),
                      contentItem: {
                        id: `${component.component}-${Date.now()}`,
                        type: component.content_type as any,
                        content: component.content,
                        saved: false,
                        timestamp: Date.now()
                      }
                    }])
                  }
                }
              } else if (toolResult.content) {
                // Regular content
                setMessages(prev => [...prev, {
                  id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  role: 'assistant',
                  content: typeof toolResult.content === 'string' ? toolResult.content : JSON.stringify(toolResult.content),
                  timestamp: new Date(),
                  contentItem: {
                    id: `${toolResult.content_type}-${Date.now()}`,
                    type: toolResult.content_type as any,
                    content: toolResult.content,
                    saved: false,
                    timestamp: Date.now()
                  }
                }])
              }
            }
          }
        }

        // Legacy: Handle old messages format
        if (data.messages && Array.isArray(data.messages)) {
          // Process multiple messages (streaming effect)
          for (let i = 0; i < data.messages.length; i++) {
            const msg = data.messages[i]

            // Add delay between messages for natural feel
            if (i > 0) {
              await new Promise(resolve => setTimeout(resolve, 500))
            }

            // Handle different message types
            if (msg.type === 'strategy') {
              // Strategy proposal - requires confirmation
              setPendingStrategy(msg.strategy)
              setAwaitingConfirmation(true)
              setMessages(prev => [...prev, {
                id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                role: 'assistant',
                content: msg.message,
                timestamp: new Date(),
                strategy: msg.strategy
              }])
            } else if (msg.type === 'content') {
              // Content generated - handle ALL content types including images/videos
              let contentItem: ContentItem | undefined

              if (msg.content) {
                contentItem = {
                  id: `${msg.contentType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  title: msg.contentType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
                  type: msg.contentType as any,
                  content: msg.content,  // This is the actual content/URL
                  createdAt: new Date(),
                  status: 'completed' as const,
                  source: 'niv-content-robust',
                  folder: msg.folder || 'content',
                  savedPath: msg.savedPath
                }
              }

              // Show content with contentItem attached for display
              setMessages(prev => [...prev, {
                id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                role: 'assistant',
                content: msg.message,
                timestamp: new Date(),
                contentItem: contentItem  // This will trigger image/video display
              }])

              if (contentItem && onContentGenerated) {
                onContentGenerated(contentItem)
              }
            } else if (msg.type === 'presentation_started') {
              // Presentation generation started
              setMessages(prev => [...prev, {
                id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                role: 'assistant',
                content: msg.message,
                timestamp: new Date(),
                generationId: msg.generationId,
                isAsync: true
              }])

              if (msg.generationId) {
                startPresentationPolling(msg.generationId)
              }
            } else {
              // Regular message
              setMessages(prev => [...prev, {
                id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                role: 'assistant',
                content: msg.message,
                timestamp: new Date()
              }])
            }
          }
        } else if (data.content) {
          // Single content response
          setMessages(prev => [...prev, {
            id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            role: 'assistant',
            content: data.content,
            timestamp: new Date()
          }])
        } else if (data.message) {
          // Simple message response
          setMessages(prev => [...prev, {
            id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            role: 'assistant',
            content: data.message,
            timestamp: new Date()
          }])
        }

        // Reset states after successful processing
        if (awaitingConfirmation && userMessage.toLowerCase().includes('yes')) {
          setAwaitingConfirmation(false)
          setPendingStrategy(null)
        }
      } else {
        throw new Error(data.error || 'Failed to generate content')
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

  // Presentation polling
  const startPresentationPolling = async (generationId: string) => {
    if (presentationPollingIds.has(generationId)) return

    setPresentationPollingIds(prev => new Set(prev).add(generationId))

    const maxAttempts = 30 // 30 attempts = ~90 seconds
    let attempts = 0

    while (attempts < maxAttempts) {
      attempts++
      await new Promise(resolve => setTimeout(resolve, 3000)) // 3 second intervals

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
            // Update the message with the presentation URL
            setMessages(prev => prev.map(msg => {
              if (msg.generationId === generationId) {
                return {
                  ...msg,
                  content: `✅ Your presentation is ready! [Open in Gamma](${status.gammaUrl})`,
                  presentationUrl: status.gammaUrl,
                  isAsync: false
                }
              }
              return msg
            }))

            setPresentationPollingIds(prev => {
              const newSet = new Set(prev)
              newSet.delete(generationId)
              return newSet
            })
            break
          } else if (status.status === 'error' || status.status === 'not_found') {
            throw new Error(status.message || 'Presentation generation failed')
          }
        }
      } catch (error) {
        console.error('Polling error:', error)
        setMessages(prev => prev.map(msg => {
          if (msg.generationId === generationId) {
            return {
              ...msg,
              content: '❌ Presentation generation failed. Please try again.',
              isAsync: false,
              error: true
            }
          }
          return msg
        }))

        setPresentationPollingIds(prev => {
          const newSet = new Set(prev)
          newSet.delete(generationId)
          return newSet
        })
        break
      }
    }

    if (attempts >= maxAttempts) {
      setMessages(prev => prev.map(msg => {
        if (msg.generationId === generationId) {
          return {
            ...msg,
            content: '⏱️ Presentation is taking longer than expected. It may still be processing.',
            isAsync: false
          }
        }
        return msg
      }))
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSaveContent = async (contentItem: ContentItem) => {
    if (onContentSave) {
      onContentSave(contentItem)
    }
  }

  return (
    <div className={`niv-content-orchestrator flex flex-col h-full ${className}`}>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-3xl ${msg.role === 'user' ? 'order-2' : 'order-1'}`}>
              <div className="flex items-start gap-3">
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-black" />
                  </div>
                )}
                <div
                  className={`px-4 py-3 rounded-lg ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : msg.error
                      ? 'bg-red-50 text-red-900 border border-red-200'
                      : 'bg-gray-800 text-gray-100'
                  }`}
                >
                  <div className="prose prose-sm prose-invert max-w-none">
                    {typeof msg.content === 'string' && msg.content.split('\n').map((line, i) => (
                      <div key={i}>{line || <br />}</div>
                    ))}
                  </div>

                  {/* Display content items (images, videos, etc) */}
                  {msg.contentItem && (
                    <div className="mt-4">
                      {msg.contentItem.type === 'image' || msg.contentItem.type === 'infographic' ? (
                        <img
                          src={typeof msg.contentItem.content === 'string'
                            ? msg.contentItem.content
                            : msg.contentItem.content.url}
                          alt={msg.contentItem.title}
                          className="rounded-lg max-w-full h-auto"
                        />
                      ) : msg.contentItem.type === 'video' ? (
                        <video
                          src={typeof msg.contentItem.content === 'string'
                            ? msg.contentItem.content
                            : msg.contentItem.content.url}
                          controls
                          className="rounded-lg max-w-full h-auto"
                        />
                      ) : null}
                    </div>
                  )}

                  {msg.presentationUrl && (
                    <a
                      href={msg.presentationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 bg-yellow-500 hover:bg-yellow-400 text-black text-sm font-medium rounded-md"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Open in Gamma
                    </a>
                  )}

                  {msg.isAsync && (
                    <div className="flex items-center gap-2 mt-3 text-sm text-gray-400">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Generating presentation...
                    </div>
                  )}

                  {msg.contentItem && (
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => handleSaveContent(msg.contentItem!)}
                        className="px-3 py-1.5 bg-yellow-500 hover:bg-yellow-400 text-black text-sm font-medium rounded-md flex items-center gap-1.5"
                      >
                        <Save className="w-3.5 h-3.5" />
                        Save
                      </button>
                    </div>
                  )}
                </div>
                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0 order-2 ml-3">
                    <span className="text-xs font-medium text-gray-300">You</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {isThinking && (
          <div className="flex justify-start">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-black" />
              </div>
              <div className="px-4 py-3 rounded-lg bg-gray-800">
                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-800 p-4">
        {/* Waiting state indicator */}
        {awaitingWhat && (
          <div className="mb-3 px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-yellow-400" />
            <span className="text-sm text-yellow-400">
              {awaitingWhat === 'follow-up' && 'Awaiting your response to continue...'}
              {awaitingWhat === 'approval' && 'Awaiting your approval to proceed with generation...'}
              {awaitingWhat === 'orchestration-approval' && 'Awaiting your approval to generate all content pieces...'}
            </span>
          </div>
        )}

        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              awaitingWhat === 'follow-up'
                ? 'Answer the question above...'
                : awaitingWhat === 'approval'
                ? 'Type "yes" or "proceed" to approve, or suggest changes...'
                : selectedContentType
                ? `Tell me what to create...`
                : "What content would you like to create?"
            }
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500/50 resize-none"
            rows={2}
            disabled={isThinking}
          />
          <div className="flex flex-col gap-2">
            <button
              onClick={handleSend}
              disabled={!input.trim() || isThinking}
              className="px-6 py-3 bg-yellow-500 hover:bg-yellow-400 disabled:bg-gray-700 disabled:opacity-50 text-black rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              {awaitingWhat === 'approval' ? 'Approve' : 'Send'}
            </button>

            {/* Quick approve button for strategic brief */}
            {awaitingWhat === 'approval' && (
              <button
                onClick={() => {
                  setInput('Yes, proceed with this approach')
                  setTimeout(() => handleSend(), 100)
                }}
                disabled={isThinking}
                className="px-6 py-2 bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors flex items-center gap-2 text-sm"
              >
                <CheckCircle className="w-4 h-4" />
                Quick Approve
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}