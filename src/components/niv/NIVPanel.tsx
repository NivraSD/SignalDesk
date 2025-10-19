'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Brain, Send, Sparkles, Loader, AlertCircle, CheckCircle, TrendingUp, Target, FileText, Zap } from 'lucide-react'
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
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Initialize with welcome message
  useEffect(() => {
    setMessages([{
      id: '1',
      role: 'niv',
      content: `Hi, I'm NIV - your strategic campaign planner. What would you like to work on today?`,
      timestamp: new Date(),
      type: 'text'
    }])
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }

  useEffect(() => {
    // Only scroll if user is near bottom (prevents scroll jumping while typing)
    const messagesContainer = messagesEndRef.current?.parentElement
    if (messagesContainer) {
      const isNearBottom = messagesContainer.scrollHeight - messagesContainer.scrollTop - messagesContainer.clientHeight < 100
      if (isNearBottom) {
        scrollToBottom()
      }
    }
  }, [messages])

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
      const conversationId = `niv-panel-${Date.now()}`

      // STAGE 1: Get acknowledgment
      console.log('📨 Stage 1: Requesting acknowledgment...')
      const ackResponse = await fetch('/api/niv-orchestrator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          conversationId: conversationId,
          organizationId: organization?.id || '1',
          stage: 'acknowledge',
          organizationContext: {
            name: organization?.name || 'Unknown',
            industry: organization?.industry || 'Technology'
          },
          framework: framework || null
        })
      })

      if (!ackResponse.ok) {
        throw new Error(`NIV acknowledgment error: ${ackResponse.status}`)
      }

      const ackData = await ackResponse.json()
      console.log('✅ Acknowledgment received:', ackData.message)

      // Show acknowledgment immediately
      const ackMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'niv',
        content: ackData.message || 'I understand. Let me gather that information for you.',
        timestamp: new Date(),
        type: 'text'
      }
      setMessages(prev => [...prev, ackMessage])

      // STAGE 2: Get research results
      console.log('🔍 Stage 2: Executing research...')
      const response = await fetch('/api/niv-orchestrator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          conversationId: conversationId,
          organizationId: organization?.id || '1',
          stage: 'research',
          organizationContext: {
            name: organization?.name || 'Unknown',
            industry: organization?.industry || 'Technology'
          },
          framework: framework || null
        })
      })

      if (!response.ok) {
        throw new Error(`NIV orchestrator error: ${response.status}`)
      }

      const data = await response.json()
      console.log('✅ Research complete:', data)

      // Process NIV response
      const nivMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'niv',
        content: data.response || data.message || 'I processed your request successfully.',
        timestamp: new Date(),
        type: 'text',
        data: data
      }

      // Add actions based on response type
      if (data.action) {
        nivMessage.actions = []

        if (data.action.type === 'campaign_ready') {
          nivMessage.actions.push({
            label: 'Open Campaign Planner',
            type: 'primary',
            icon: <FileText className="w-4 h-4" />,
            action: () => {
              if (onCampaignGenerated && data.action.data.blueprint) {
                onCampaignGenerated(data.action.data.blueprint)
              }
              // Open campaign planner component with V4 blueprint data
              const event = new CustomEvent('addComponentToCanvas', {
                detail: {
                  moduleId: 'campaign-planner',
                  action: 'window',
                  data: {
                    blueprint: data.action.data.blueprint
                  }
                }
              })
              window.dispatchEvent(event)
            }
          })
          nivMessage.actions.push({
            label: 'View Blueprint',
            type: 'secondary',
            icon: <Sparkles className="w-4 h-4" />,
            action: () => {
              // Show blueprint in a new message
              const blueprintMessage: Message = {
                id: (Date.now() + 2).toString(),
                role: 'niv',
                content: formatBlueprint(data.action.data.blueprint),
                timestamp: new Date(),
                type: 'data',
                data: data.action.data.blueprint
              }
              setMessages(prev => [...prev, blueprintMessage])
            }
          })
        }

        if (data.action.type === 'opportunities_found' && data.opportunities) {
          nivMessage.actions.push({
            label: 'View Opportunities',
            type: 'primary',
            icon: <Target className="w-4 h-4" />,
            action: () => {
              if (onOpportunityDetected && data.opportunities) {
                onOpportunityDetected(data.opportunities)
              }
              // Open opportunities tab
              const event = new CustomEvent('addComponentToCanvas', {
                detail: { moduleId: 'opportunities', action: 'window' }
              })
              window.dispatchEvent(event)
            }
          })
        }

        if (data.action.type === 'content_ready') {
          nivMessage.actions.push({
            label: 'View Content',
            type: 'primary',
            icon: <Zap className="w-4 h-4" />,
            action: () => {
              // Open execute tab
              const event = new CustomEvent('addComponentToCanvas', {
                detail: { moduleId: 'execute', action: 'window' }
              })
              window.dispatchEvent(event)
            }
          })
        }
      }

      setMessages(prev => [...prev, nivMessage])

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
      {/* Header */}
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

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg ${
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
      <div className="p-4 border-t border-gray-700 bg-gray-900/50">
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isProcessing}
            placeholder="Ask NIV about campaigns, opportunities, intelligence..."
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
        <p className="text-xs text-gray-500 mt-2">
          Powered by V4 orchestrator - CASCADE, MIRROR, CHORUS, TROJAN, NETWORK patterns supported
        </p>
      </div>
    </div>
  )
}
