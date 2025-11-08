'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Brain, Send, X as CloseIcon, Minimize2, Maximize2, Sparkles, Move, Save, FileText, ArrowRight } from 'lucide-react'
import { motion, AnimatePresence, useDragControls } from 'framer-motion'
import { useAppStore } from '@/stores/useAppStore'
import { NivIntelligenceDisplay } from './NivIntelligenceDisplay'
import { useNivStrategyV2 } from '@/hooks/useNivStrategyV2'
import type { NivStrategy } from '@/types/niv-strategy'

interface Message {
  id: string
  role: 'user' | 'niv'
  content: string
  structured?: any
  timestamp: Date
  strategy?: NivStrategy // Added to attach strategies to messages
}

export default function NivChatbot() {
  const { intelligenceData, opportunities, activeModule, organization } = useAppStore()
  const {
    saveStrategy,
    currentStrategy,
    createStrategyFromResponse,
    getRecentStrategies,
    useDatabase
  } = useNivStrategyV2()
  const [isOpen, setIsOpen] = useState(true)
  const [isMinimized, setIsMinimized] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'niv',
      content: "Hello! I'm NIV, your strategic orchestrator. I can see the Intelligence Hub is ready. Would you like me to help you run an analysis or review opportunities?",
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const dragControls = useDragControls()

  // Set initial position after mount - bottom right corner but not overlapping
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPosition({ x: window.innerWidth - 420, y: 80 })  // Top right instead of bottom
    }
  }, [])

  const scrollToBottom = () => {
    // Only scroll if the chat window is already near the bottom
    const chatContainer = messagesEndRef.current?.parentElement
    if (chatContainer) {
      const isNearBottom = chatContainer.scrollHeight - chatContainer.scrollTop - chatContainer.clientHeight < 100
      if (isNearBottom) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    const currentInput = input
    setInput('')
    setIsTyping(true)

    try {
      // Prepare conversation history (last 5 messages for context)
      const conversationHistory = messages.slice(-5).map(msg => ({
        role: msg.role,
        content: msg.content,
        structured: msg.structured // Include structured data if present
      }))

      // Check if this is a complex query that needs acknowledgment
      const isComplexQuery = currentInput.toLowerCase().includes('research') ||
                            currentInput.toLowerCase().includes('analyze') ||
                            currentInput.toLowerCase().includes('campaign') ||
                            currentInput.toLowerCase().includes('generate') ||
                            currentInput.length > 50

      // Step 1: Get immediate acknowledgment (only for complex queries)
      if (isComplexQuery) {
        const ackResponse = await fetch('/api/supabase/functions/niv-orchestrator-robust', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: currentInput,
          sessionId: 'chatbot-session',
          stage: 'acknowledge',
          conversationHistory,
          context: {
            activeModule,
            intelligenceData: intelligenceData?.status,
            opportunityCount: opportunities?.length || 0,
            organizationId: organization?.id || 'OpenAI'
          }
        })
      })

      if (ackResponse.ok) {
        const ackData = await ackResponse.json()
        console.log('NIV Acknowledgment:', ackData)

        // Show acknowledgment immediately
        const nivAck: Message = {
          id: (Date.now() + 1).toString(),
          role: 'niv',
          content: ackData.message,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, nivAck])
        }
      }

      // Step 2: Get research results (always runs)
      const response = await fetch('/api/supabase/functions/niv-orchestrator-robust', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: currentInput,
          sessionId: 'chatbot-session',
          stage: 'research',  // ← FIXED: Changed from 'full' to 'research'
          conversationHistory,
          context: {
            activeModule,
            intelligenceData: intelligenceData?.status,
            opportunityCount: opportunities?.length || 0,
            organizationId: organization?.id || 'OpenAI'
          }
        })
      })

      if (response.ok) {
        const data = await response.json()
        console.log('NIV Response:', data)

        // Handle multiple messages from backend (e.g., acknowledgment + content)
        if (data.messages && Array.isArray(data.messages)) {
          console.log('Processing multiple messages:', data.messages.length)

          for (const msg of data.messages) {
            if (msg.type === 'content' && msg.content) {
              // This is the actual content (image, video, etc.)
              const contentMessage: Message = {
                id: Date.now().toString() + Math.random(),
                role: 'niv',
                content: msg.content, // The image URL or video URL
                timestamp: new Date()
              }
              setMessages(prev => [...prev, contentMessage])
            } else if (msg.message) {
              // Regular message (acknowledgment, status, etc.)
              const textMessage: Message = {
                id: Date.now().toString() + Math.random(),
                role: 'niv',
                content: msg.message,
                timestamp: new Date()
              }
              setMessages(prev => [...prev, textMessage])
            }
          }

          setIsTyping(false)
          return
        }

        // Check if this is a strategic framework response
        if (data.type === 'strategic-framework' && data.framework) {
          console.log('🎯 Strategic Framework Generated:', data.framework)

          // Create strategy from NIV response
          const strategy = createStrategyFromResponse(
            data.message,
            data.toolResults || data.structured,
            organization?.id || 'default',
            organization?.name || 'Organization'
          )

          // Save strategy to Memory Vault (with localStorage fallback)
          const strategyId = await saveStrategy(strategy, organization?.id)
          console.log('💾 Strategy saved with ID:', strategyId)

          // Send to Intelligence component via postMessage
          window.postMessage({
            type: 'niv-strategic-framework',
            framework: data.framework,
            discovery: data.discovery,
            readyForHandoff: data.readyForHandoff,
            strategyId: strategyId // Include strategy ID for reference
          }, '*')

          // Also store in message for display
          // DON'T include structured field - it forces message through NivIntelligenceDisplay
          // which only shows limited sections. Let it display as plain formatted text.
          const nivResponse: Message = {
            id: (Date.now() + 2).toString(),
            role: 'niv',
            content: data.message || `Strategic framework generated: ${data.framework.strategy.objective}`,
            // structured field removed - we want plain text display with all sections
            strategy: strategy, // Attach strategy to message
            timestamp: new Date()
          }
          setMessages(prev => [...prev, nivResponse])
        } else {
          // Regular intelligence response
          // Log persona if present
          if (data.persona) {
            console.log(`NIV Persona: ${data.persona.title} (${data.persona.module} mode)`)
          }

          // Only include structured data if it has meaningful content
          // (research, toolResults, opportunities, etc.)
          const hasUsefulStructuredData = data.structured && (
            data.structured.research?.findings ||
            data.structured.toolResults ||
            data.structured.opportunities ||
            data.structured.analysis ||
            data.structured.competitors ||
            data.structured.framework
          )

          const nivResponse: Message = {
            id: (Date.now() + 2).toString(),
            role: 'niv',
            content: data.message || 'Sorry, I encountered an issue processing your request.',
            structured: hasUsefulStructuredData ? data.structured : undefined,
            timestamp: new Date()
          }

          console.log('Message structured:', nivResponse.structured)
          setMessages(prev => [...prev, nivResponse])
        }
      } else {
        throw new Error('NIV response failed')
      }
    } catch (error) {
      console.error('NIV Error:', error)

      // Fallback to local response
      const nivResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'niv',
        content: getNivResponse(currentInput),
        timestamp: new Date()
      }
      setMessages(prev => [...prev, nivResponse])
    }

    setIsTyping(false)
  }

  const getNivResponse = (userInput: string): string => {
    const input = userInput.toLowerCase()
    
    // Context-aware responses based on Intelligence Hub state
    if (input.includes('run') || input.includes('start') || input.includes('analysis')) {
      if (intelligenceData?.status === 'running') {
        return "The Intelligence Hub is already running an analysis. Current stage: processing competitive intelligence. Estimated completion in 90 seconds."
      }
      return "I'll trigger the Intelligence Hub analysis for you. This will run through 7 stages: Discovery → PR Filtering → Relevance Scoring → Entity Extraction → Competitive Intel → Market Trends → Opportunity Engine. Click 'Run Analysis' in the Intelligence Hub to start."
    }
    
    if (input.includes('intelligence') || input.includes('pipeline') || input.includes('hub')) {
      if (intelligenceData?.status === 'completed') {
        return "The Intelligence Hub has completed its analysis. Key findings:\n• 3 competitive threats detected\n• 2 cascade opportunities identified\n• 5 high-priority action items\n\nWould you like me to generate strategic responses?"
      }
      return "The Intelligence Hub is ready to analyze your market landscape. It uses a 7-stage pipeline from our Enhanced MCP Architecture. Would you like me to start an analysis?"
    }
    
    if (input.includes('opportunity') || input.includes('opportunities')) {
      const oppCount = opportunities?.length || 0
      if (oppCount > 0) {
        return `I've identified ${oppCount} active opportunities. The most urgent expires in 48 hours - a competitor vulnerability window. Shall I prepare an execution plan?`
      }
      return "Run the Intelligence Hub first to identify opportunities. The Opportunity Engine will analyze market dynamics and generate actionable playbooks."
    }
    
    if (input.includes('campaign') || input.includes('execute')) {
      return "I can generate a complete campaign in 35 seconds - including press release, social posts, and media list. First, let's identify the best opportunity through the Intelligence Hub analysis."
    }
    
    if (input.includes('help')) {
      return `I'm NIV, your strategic orchestrator. I'm integrated with:\n• Intelligence Hub (${intelligenceData ? 'Active' : 'Ready'})\n• Opportunity Engine (${opportunities.length} opportunities)\n• Campaign Generator\n• Strategic Planning\n\nI notice you're on the ${activeModule} module. How can I help you leverage it?`
    }
    
    if (input.includes('executive') || input.includes('synthesis')) {
      return "The Executive Synthesis combines two parallel analyses:\n1. Competitive & Stakeholder Intelligence (Marcus & Victoria Chen personas)\n2. Market Trends & Cascade Detection\n\nRun the Intelligence Hub to generate your executive report."
    }
    
    return `Based on the current ${activeModule} module, I recommend focusing on market intelligence gathering. The Intelligence Hub can process 15+ sources in 2-3 minutes. Would you like to start?`
  }

  if (!isOpen) {
    return (
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 w-14 h-14 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-full shadow-2xl flex items-center justify-center group hover:scale-110 transition-transform"
        style={{ boxShadow: '0 0 30px rgba(139, 92, 246, 0.5)' }}
      >
        <Brain className="w-7 h-7 text-white" />
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
      </motion.button>
    )
  }

  const startDrag = (e: React.PointerEvent) => {
    dragControls.start(e)
  }

  return (
    <motion.div
      drag
      dragControls={dragControls}
      dragMomentum={false}
      dragElastic={0}
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, x: position.x, y: position.y }}
      onDragEnd={(e, info) => {
        setPosition({
          x: position.x + info.offset.x,
          y: position.y + info.offset.y
        })
      }}
      className="fixed w-96 bg-gray-900/95 backdrop-blur-xl rounded-lg shadow-2xl border border-violet-500/30"
      style={{
        height: isMinimized ? 'auto' : '500px',
        boxShadow: '0 0 40px rgba(139, 92, 246, 0.3)',
        left: 0,
        top: 0,
        zIndex: 10  // Reduced from 60 to integrate with other components
      }}
    >
      {/* Header - Draggable */}
      <div 
        className="bg-gradient-to-r from-violet-600 to-indigo-600 p-3 rounded-t-lg cursor-move"
        onPointerDown={startDrag}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Move className="w-4 h-4 text-white/60" />
            <div className="relative">
              <Brain className="w-6 h-6 text-white" />
              <Sparkles className="w-3 h-3 text-yellow-300 absolute -top-1 -right-1 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1">
                <h3 className="text-white font-bold text-sm">NIV</h3>
                <div className={`w-2 h-2 rounded-full ${useDatabase ? 'bg-green-400' : 'bg-yellow-400'}`} title={useDatabase ? 'Memory Vault Connected' : 'Using Local Storage'} />
              </div>
              <p className="text-white/80 text-xs">
                {activeModule === 'intelligence' ? 'Chief Intelligence Analyst' :
                 activeModule === 'opportunities' ? 'Strategic Advisor' :
                 activeModule === 'plan' ? 'Campaign Architect' :
                 activeModule === 'execute' ? 'Tactical Commander' :
                 activeModule === 'memoryvault' ? 'Knowledge Keeper' :
                 'Strategic Orchestrator'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1" onPointerDown={(e) => e.stopPropagation()}>
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 hover:bg-white/20 rounded transition-colors"
            >
              {isMinimized ? (
                <Maximize2 className="w-4 h-4 text-white" />
              ) : (
                <Minimize2 className="w-4 h-4 text-white" />
              )}
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/20 rounded transition-colors"
            >
              <CloseIcon className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ height: 'calc(500px - 120px)' }}>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-violet-600 text-white'
                      : 'bg-gray-800 text-gray-200 border border-violet-500/20'
                  }`}
                >
                  {message.role === 'niv' && (
                    <div className="flex items-center gap-1 mb-1">
                      <Brain className="w-3 h-3 text-violet-400" />
                      <span className="text-xs text-violet-400 font-semibold">NIV</span>
                    </div>
                  )}
                  {message.role === 'niv' && message.structured ? (
                    <div>
                      <div className="text-xs text-yellow-400 mb-2">🎯 Structured Response Detected</div>
                      <NivIntelligenceDisplay response={{
                        message: message.content,
                        structured: message.structured
                      }} />
                    </div>
                  ) : (
                    <div>
                      {/* Check if content is an image URL */}
                      {message.content && (message.content.startsWith('data:image') || message.content.startsWith('http') && (message.content.includes('.png') || message.content.includes('.jpg') || message.content.includes('.jpeg') || message.content.includes('.gif'))) ? (
                        <div>
                          <div className="text-xs text-violet-400 mb-2">🖼️ Image Generated</div>
                          <img
                            src={message.content}
                            alt="Generated content"
                            className="rounded-lg max-w-full h-auto"
                            style={{ maxHeight: '400px' }}
                          />
                        </div>
                      ) : (
                        <div>
                          <div className="text-xs text-red-400 mb-2">📝 Plain Text Response</div>
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Display strategy and workflow buttons if available */}
                  {message.strategy && (
                    <div className="mt-3 pt-3 border-t border-violet-500/20">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4 text-violet-400" />
                        <span className="text-xs font-semibold text-violet-400">Strategic Framework</span>
                      </div>

                      <div className="space-y-2">
                        {/* Strategy Summary */}
                        <div className="text-xs text-gray-300">
                          <p className="font-semibold">{message.strategy.strategy.objective}</p>
                          <p className="text-gray-400 mt-1">Confidence: {Math.round(message.strategy.research.confidence * 100)}%</p>
                        </div>

                        {/* Workflow Buttons */}
                        <div className="flex flex-wrap gap-2 mt-3">
                          <button
                            onClick={() => {
                              window.postMessage({
                                type: 'execute-workflow',
                                workflow: 'campaignIntelligence',
                                strategy: message.strategy
                              }, '*')
                            }}
                            className="px-2 py-1 text-xs bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 rounded flex items-center gap-1"
                          >
                            <ArrowRight className="w-3 h-3" />
                            Campaign
                          </button>

                          <button
                            onClick={() => {
                              window.postMessage({
                                type: 'execute-workflow',
                                workflow: 'contentGeneration',
                                strategy: message.strategy
                              }, '*')
                            }}
                            className="px-2 py-1 text-xs bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 rounded flex items-center gap-1"
                          >
                            <ArrowRight className="w-3 h-3" />
                            Content
                          </button>

                          <button
                            onClick={() => {
                              window.postMessage({
                                type: 'execute-workflow',
                                workflow: 'strategicPlanning',
                                strategy: message.strategy
                              }, '*')
                            }}
                            className="px-2 py-1 text-xs bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 rounded flex items-center gap-1"
                          >
                            <ArrowRight className="w-3 h-3" />
                            Planning
                          </button>
                        </div>

                        {/* Save Indicator */}
                        <div className="flex items-center gap-1 text-xs text-green-400 mt-2">
                          <Save className="w-3 h-3" />
                          <span>Saved locally</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <p className="text-xs opacity-60 mt-1">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-800 border border-violet-500/20 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Brain className="w-3 h-3 text-violet-400" />
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-gray-800">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask NIV for strategic guidance..."
                className="flex-1 bg-gray-800 text-gray-200 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white p-2 rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </motion.div>
  )
}