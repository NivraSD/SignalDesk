'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Brain, Send, Sparkles, Loader, AlertCircle, CheckCircle, TrendingUp, Target, FileText, Zap, Copy, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/stores/useAppStore'

interface Message {
  id: string
  role: 'user' | 'niv'
  content: string
  timestamp: Date
  type?: 'text' | 'action' | 'data'
  actions?: Array<{
    label: string
    type: 'primary' | 'secondary'
    icon?: React.ReactNode
    action: () => void
  }>
  data?: any
}

interface NIVPanelProps {
  embedded?: boolean
  onCampaignGenerated?: (blueprint: any) => void
  onOpportunityDetected?: (opportunities: any[]) => void
}

export default function NIVPanel({ embedded = false, onCampaignGenerated, onOpportunityDetected }: NIVPanelProps) {
  const { organization, framework } = useAppStore()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentTool, setCurrentTool] = useState<string | null>(null)
  const [conversationId] = useState(`niv-${Date.now()}`) // PERSISTENT conversation ID for entire session
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Initialize with welcome message
  useEffect(() => {
    setMessages([{
      id: '1',
      role: 'niv',
      content: `Hi, I'm NIV - how can I help you today?`,
      timestamp: new Date(),
      type: 'text'
    }])
  }, [])

  // Clear conversation when organization changes
  useEffect(() => {
    if (organization) {
      console.log(`🔄 NIVPanel: Organization changed to ${organization.name}, clearing conversation`)
      setMessages([{
        id: '1',
        role: 'niv',
        content: `Hi, I'm NIV - how can I help you with ${organization.name} today?`,
        timestamp: new Date(),
        type: 'text'
      }])
      setInput('')
      setIsProcessing(false)
      setCurrentTool(null)
    }
  }, [organization?.id])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }

  useEffect(() => {
    // Always scroll to bottom when new messages arrive
    scrollToBottom()
  }, [messages])

  // Build conversation history from messages for backend
  const buildConversationHistory = () => {
    return messages
      .filter(m => !(m.role === 'niv' && m.content.includes("Hi, I'm NIV"))) // Skip welcome message
      .map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content
      }))
  }

  // Poll Gamma presentation status (like Execute component does)
  const pollGammaStatus = async (generationId: string, messageId: string) => {
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
    const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    let attempts = 0
    const maxAttempts = 60 // 60 attempts * 3 seconds = 3 minutes max

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 3000)) // Wait 3 seconds
      attempts++

      try {
        const response = await fetch(
          `${SUPABASE_URL}/functions/v1/gamma-presentation?generationId=${generationId}`,
          {
            headers: {
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
          }
        )

        if (response.ok) {
          const statusData = await response.json()

          if (statusData.status === 'complete' || statusData.status === 'completed') {
            // Presentation is ready!
            const finalUrl = statusData.gammaUrl || statusData.presentationUrl || statusData.url || statusData.webUrl

            // Update the message with the final link
            setMessages(prev => prev.map(msg => {
              if (msg.id === messageId) {
                return {
                  ...msg,
                  content: `✅ **Your Gamma presentation is ready!**\n\n[Open Presentation](${finalUrl})`,
                  actions: [
                    {
                      label: 'Open Presentation',
                      type: 'primary' as const,
                      icon: <Target className="w-4 h-4" />,
                      action: () => window.open(finalUrl, '_blank')
                    }
                  ]
                }
              }
              return msg
            }))

            return // Exit polling
          } else if (statusData.status === 'failed' || statusData.status === 'error') {
            // Generation failed
            setMessages(prev => prev.map(msg => {
              if (msg.id === messageId) {
                return {
                  ...msg,
                  content: `❌ Gamma presentation generation failed: ${statusData.error || 'Unknown error'}`
                }
              }
              return msg
            }))
            return
          }
          // If still pending, continue polling
        }
      } catch (error) {
        console.error('Gamma polling error:', error)
        // Continue polling even if one attempt fails
      }
    }

    // Timeout
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        return {
          ...msg,
          content: `⏱️ Gamma presentation generation timed out after 3 minutes. Please check the Gamma dashboard.`
        }
      }
      return msg
    }))
  }

  const handleSend = async (text?: string) => {
    const messageText = text || input
    if (!messageText.trim() || isProcessing) return

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
      type: 'text'
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsProcessing(true)

    try {
      // Build conversation history BEFORE adding current message
      const conversationHistory = buildConversationHistory()
      console.log(`📜 Conversation history: ${conversationHistory.length} messages`)

      // Step 1: Quick acknowledgment (like Execute module)
      console.log('🤖 Getting quick acknowledgment...')
      const ackResponse = await fetch('/api/niv-orchestrator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          conversationId: conversationId, // PERSISTENT ID - same for entire session
          conversationHistory: conversationHistory, // SEND FULL HISTORY
          organizationId: organization?.id || '1',
          organizationContext: {
            name: organization?.name || 'Unknown',
            industry: organization?.industry || 'Technology',
            competitors: organization?.competitors || []
          },
          stage: 'acknowledge' // Quick acknowledgment first
        })
      })

      if (ackResponse.ok) {
        const ackData = await ackResponse.json()
        if (ackData.message) {
          // Show acknowledgment message
          const ackMessage: Message = {
            id: (Date.now() + 0.5).toString(),
            role: 'niv',
            content: ackData.message,
            timestamp: new Date(),
            type: 'text'
          }
          setMessages(prev => [...prev, ackMessage])
        }
      }

      // Step 2: Full processing
      console.log('🤖 Processing full request...')
      const response = await fetch('/api/niv-orchestrator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          conversationId: conversationId, // SAME PERSISTENT ID
          conversationHistory: conversationHistory, // SAME FULL HISTORY
          organizationId: organization?.id || '1',
          organizationContext: {
            name: organization?.name || 'Unknown',
            industry: organization?.industry || 'Technology',
            competitors: organization?.competitors || []
          }
          // No stage parameter = 'full' processing
        })
      })

      if (!response.ok) {
        throw new Error(`NIV orchestrator error: ${response.status}`)
      }

      const data = await response.json()
      console.log('✅ Processing complete:', data)
      console.log('🎯 Response type:', data.type, '| gammaGenerationId:', data.gammaGenerationId)

      // Process NIV response
      const nivMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'niv',
        content: data.response || data.message || 'I processed your request successfully.',
        timestamp: new Date(),
        type: 'text',
        data: data
      }

      // Add actions based on response type from niv-advisor
      if (data.action) {
        nivMessage.actions = []

        // Content generation action
        if (data.action.type === 'content_generation') {
          nivMessage.actions.push({
            label: 'View in Memory Vault',
            type: 'primary',
            icon: <FileText className="w-4 h-4" />,
            action: () => {
              const event = new CustomEvent('addComponentToCanvas', {
                detail: { moduleId: 'memoryvault', action: 'window' }
              })
              window.dispatchEvent(event)
            }
          })
        }

        // Open campaign planner action
        if (data.action.type === 'open_campaign_planner') {
          nivMessage.actions.push({
            label: 'Open Campaign Builder',
            type: 'primary',
            icon: <FileText className="w-4 h-4" />,
            action: () => {
              if (onCampaignGenerated && data.action.data?.blueprint) {
                onCampaignGenerated(data.action.data.blueprint)
              }
              const event = new CustomEvent('addComponentToCanvas', {
                detail: {
                  moduleId: 'campaign-planner',
                  action: 'window',
                  data: data.action.data
                }
              })
              window.dispatchEvent(event)
            }
          })
        }

        // Open module action (opportunities, intelligence, execute, etc.)
        if (data.action.type === 'open_module') {
          const moduleId = data.action.data?.module || 'opportunities'
          const moduleLabels: Record<string, string> = {
            'opportunities': 'Open Opportunities',
            'campaign-planner': 'Open Campaign Builder',
            'intelligence': 'Open Intelligence',
            'memoryvault': 'Open Memory Vault',
            'execute': 'Open Execute',
            'crisis': 'Open Crisis Management',
            'plan': 'Open Strategic Planning'
          }

          nivMessage.actions.push({
            label: moduleLabels[moduleId] || 'Open Module',
            type: 'primary',
            icon: <Target className="w-4 h-4" />,
            action: () => {
              const event = new CustomEvent('addComponentToCanvas', {
                detail: {
                  moduleId: moduleId,
                  action: 'window',
                  data: data.action.data?.context
                }
              })
              window.dispatchEvent(event)
            }
          })
        }

        // Execute opportunity action (special case of open_module)
        if (data.action.type === 'execute_opportunity') {
          nivMessage.actions.push({
            label: 'Execute Opportunity',
            type: 'primary',
            icon: <Zap className="w-4 h-4" />,
            action: () => {
              const event = new CustomEvent('addComponentToCanvas', {
                detail: {
                  moduleId: 'opportunities',
                  action: 'window',
                  data: { context: 'execution' }
                }
              })
              window.dispatchEvent(event)
            }
          })
        }
      }

      setMessages(prev => [...prev, nivMessage])

      // If this is a Gamma presentation being generated, start polling
      if (data.type === 'gamma_generating' && data.gammaGenerationId) {
        console.log('🚀 Starting Gamma polling for:', data.gammaGenerationId)
        pollGammaStatus(data.gammaGenerationId, nivMessage.id)
      } else {
        console.log('⏭️ Not starting Gamma polling - type:', data.type, 'generationId:', data.gammaGenerationId)
      }

      // Show tool status if available
      if (data.tools_used) {
        setCurrentTool(data.tools_used[data.tools_used.length - 1])
        setTimeout(() => setCurrentTool(null), 3000)
      }

    } catch (error) {
      console.error('NIV Panel error:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'niv',
        content: `I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        timestamp: new Date(),
        type: 'text'
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCopyMessage = async (messageContent: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(messageContent)
      setCopiedMessageId(messageId)
      // Reset copied state after 2 seconds
      setTimeout(() => setCopiedMessageId(null), 2000)
    } catch (error) {
      console.error('Failed to copy message:', error)
    }
  }

  const formatBlueprint = (blueprint: any): string => {
    if (!blueprint) return 'Blueprint data unavailable'

    return `## ${blueprint.pattern} Campaign Blueprint

**Objective:** ${blueprint.strategy?.objective || 'Not specified'}

**Narrative:** ${blueprint.strategy?.narrative || 'Not specified'}

**Key Messages:**
${blueprint.strategy?.keyMessages?.map((msg: string, i: number) => `${i + 1}. ${msg}`).join('\n') || 'None'}

**Vectors:** ${blueprint.vectors?.length || 0} stakeholder groups
**Content Types:** ${blueprint.contentStrategy?.autoExecutableContent?.contentTypes?.length || 0} types
**Total Pieces:** ${blueprint.contentStrategy?.autoExecutableContent?.totalPieces || 0}

**Timeline:** ${blueprint.timeline?.total_duration || 'Not specified'}`
  }

  return (
    <div className={`flex flex-col h-full ${embedded ? 'bg-gray-900/50' : 'bg-gray-900'} ${!embedded && 'rounded-lg border border-gray-700'}`}>
      {/* Header - only show when not embedded */}
      {!embedded && (
        <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gradient-to-r from-purple-900/30 to-pink-900/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold">NIV - Strategic Campaign Planner</h3>
              <p className="text-xs text-gray-400">AI-Powered Campaign Intelligence</p>
            </div>
          </div>
          {currentTool && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/20 rounded-full">
              <Loader className="w-3 h-3 text-purple-400 animate-spin" />
              <span className="text-xs text-purple-400">{currentTool}</span>
            </div>
          )}
        </div>
      )}

      {/* Show tool indicator when embedded */}
      {embedded && currentTool && (
        <div className="flex items-center justify-end px-4 py-2 border-b border-gray-700">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/20 rounded-full">
            <Loader className="w-3 h-3 text-purple-400 animate-spin" />
            <span className="text-xs text-purple-400">{currentTool}</span>
          </div>
        </div>
      )}

      {/* Messages Area - flex-1 ensures it expands to fill available space */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg group relative ${
                message.role === 'user'
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white'
                  : message.type === 'data'
                  ? 'bg-gray-800 border border-gray-700'
                  : 'bg-gray-800 text-gray-200'
              }`}
            >
              <div className="p-3">
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {message.content}
                </div>
              </div>

              {/* Copy button - only show for NIV messages */}
              {message.role === 'niv' && (
                <button
                  onClick={() => handleCopyMessage(message.content, message.id)}
                  className="absolute top-2 right-2 p-1.5 bg-gray-700/80 hover:bg-gray-600 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Copy message"
                >
                  {copiedMessageId === message.id ? (
                    <Check className="w-3.5 h-3.5 text-green-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-gray-300" />
                  )}
                </button>
              )}

              {message.actions && message.actions.length > 0 && (
                <div className="px-3 pb-3 flex flex-wrap gap-2">
                  {message.actions.map((action, idx) => (
                    <button
                      key={idx}
                      onClick={action.action}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        action.type === 'primary'
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {action.icon}
                      {action.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-gray-800 text-gray-200 p-3 rounded-lg">
              <div className="flex items-center gap-3">
                <Loader className="w-4 h-4 animate-spin text-purple-400" />
                <span className="text-sm">Processing with NIV orchestrator...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 p-4 border-t border-gray-700 bg-gray-900/50">
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isProcessing}
            placeholder="Ask NIV about campaigns, opportunities, intelligence..."
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            style={{ resize: 'none', minHeight: '40px', maxHeight: '200px' }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement
              target.style.height = 'auto'
              target.style.height = Math.min(target.scrollHeight, 200) + 'px'
            }}
            className="flex-1 px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={isProcessing || !input.trim()}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <Loader className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
