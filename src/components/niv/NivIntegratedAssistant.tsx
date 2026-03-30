'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Brain, Send, Sparkles, ChevronUp, ChevronDown, Zap } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/stores/useAppStore'

interface Message {
  id: string
  role: 'user' | 'niv'
  content: string
  timestamp: Date
  actions?: Array<{
    label: string
    action: () => void
  }>
}

interface NivIntegratedAssistantProps {
  module: 'intelligence' | 'opportunities' | 'plan' | 'execute' | 'memoryVault'
  embedded?: boolean // Can be embedded in a component or standalone
}

export default function NivIntegratedAssistant({ module, embedded = false }: NivIntegratedAssistantProps) {
  const { intelligenceData, opportunities, activeModule } = useAppStore()
  const [isExpanded, setIsExpanded] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Module-specific configuration
  const moduleConfig = {
    intelligence: {
      personality: "Intelligence Analyst",
      color: "from-blue-600 to-cyan-600",
      prompts: [
        "What's happening with our competitors right now?",
        "Find PR opportunities from today's news",
        "Show me narrative vacuums we can fill"
      ],
      greeting: "I'm your Intelligence Analyst. I can help you discover market insights, track competitors, and identify opportunities."
    },
    opportunities: {
      personality: "Strategic PR Advisor",
      color: "from-violet-600 to-purple-600",
      prompts: [
        "Which opportunity should I act on first?",
        "Generate a complete campaign for this",
        "What's the urgency window?"
      ],
      greeting: "I'm your Strategic PR Advisor. Let's prioritize opportunities and create winning campaigns."
    },
    plan: {
      personality: "Campaign Planner",
      color: "from-green-600 to-emerald-600",
      prompts: [
        "Create a campaign timeline",
        "Map stakeholder engagement",
        "Show compliance requirements"
      ],
      greeting: "I'm your Campaign Planner. I'll help you organize timelines, resources, and stakeholder strategies."
    },
    execute: {
      personality: "Content Creator",
      color: "from-orange-600 to-red-600",
      prompts: [
        "Generate press release",
        "Build media list",
        "Create social content"
      ],
      greeting: "I'm your Content Creator. Ready to generate content, build media lists, and prepare exports."
    },
    memoryVault: {
      personality: "Pattern Analyst",
      color: "from-indigo-600 to-blue-600",
      prompts: [
        "What patterns are emerging?",
        "Find similar past campaigns",
        "Show success metrics"
      ],
      greeting: "I'm your Pattern Analyst. I help you learn from past campaigns and identify winning strategies."
    }
  }

  const config = moduleConfig[module]

  // Initialize with module-specific greeting
  useEffect(() => {
    setMessages([{
      id: '1',
      role: 'niv',
      content: config.greeting,
      timestamp: new Date()
    }])
    setSuggestedPrompts(config.prompts)
  }, [module])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = (text?: string) => {
    const messageText = text || input
    if (!messageText.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsTyping(true)

    // Simulate NIV response with module-specific logic
    setTimeout(() => {
      const nivResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'niv',
        content: getModuleSpecificResponse(messageText, module),
        timestamp: new Date(),
        actions: getResponseActions(messageText, module)
      }
      setMessages(prev => [...prev, nivResponse])
      setIsTyping(false)
    }, 800 + Math.random() * 700)
  }

  const getModuleSpecificResponse = (input: string, module: string): string => {
    // Module-specific responses based on context
    switch(module) {
      case 'intelligence':
        return `Analyzing real-time data... I found 3 competitive movements and 2 narrative vacuums.
                The most urgent is a competitor vulnerability window closing in 48 hours.`

      case 'opportunities':
        return `I've prioritized your opportunities by impact and urgency.
                The top opportunity has a 95% success probability if executed within 24 hours.`

      case 'plan':
        return `I've mapped out a 2-week campaign timeline with 5 key milestones.
                Critical path includes stakeholder engagement by Day 3.`

      case 'execute':
        return `Content suite generated: Press release (450 words),
                5 social posts, and media list with 15 targeted journalists.`

      case 'memoryVault':
        return `Pattern detected: Similar campaigns had 73% higher success
                when launched on Tuesday mornings. Applying this learning.`

      default:
        return "Processing your request with context-aware intelligence..."
    }
  }

  const getResponseActions = (input: string, module: string): any[] => {
    // Provide actionable buttons based on response
    switch(module) {
      case 'intelligence':
        return [
          { label: "View Full Analysis", action: () => console.log("Opening analysis") },
          { label: "Generate Response", action: () => console.log("Generating response") }
        ]
      case 'opportunities':
        return [
          { label: "Execute Campaign", action: () => console.log("Executing") },
          { label: "See Details", action: () => console.log("Showing details") }
        ]
      default:
        return []
    }
  }

  if (embedded) {
    // Embedded version for integration within components
    return (
      <div className="bg-gray-900/50 rounded-lg border border-gray-700 overflow-hidden">
        {/* Collapsible Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`w-full p-3 bg-gradient-to-r ${config.color} flex items-center justify-between hover:opacity-90 transition-opacity`}
        >
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-white" />
            <span className="text-white font-semibold text-sm">NIV - {config.personality}</span>
            {isTyping && <span className="text-white/70 text-xs animate-pulse">thinking...</span>}
          </div>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-white" />
          ) : (
            <ChevronDown className="w-4 h-4 text-white" />
          )}
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              {/* Messages Area */}
              <div className="h-64 overflow-y-auto p-3 space-y-2 bg-gray-950/50">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-2 rounded-lg text-sm ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-800 text-gray-200'
                      }`}
                    >
                      {message.content}
                      {message.actions && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {message.actions.map((action, idx) => (
                            <button
                              key={idx}
                              onClick={action.action}
                              className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded text-xs transition-colors"
                            >
                              {action.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-gray-800 text-gray-200 p-2 rounded-lg">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Suggested Prompts */}
              <div className="px-3 py-2 border-t border-gray-700">
                <div className="flex gap-1 flex-wrap">
                  {suggestedPrompts.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(prompt)}
                      className="px-2 py-1 bg-gray-800 hover:bg-gray-700 rounded text-xs text-gray-300 transition-colors flex items-center gap-1"
                    >
                      <Zap className="w-3 h-3" />
                      {prompt.substring(0, 30)}...
                    </button>
                  ))}
                </div>
              </div>

              {/* Input Area */}
              <div className="p-3 border-t border-gray-700">
                <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={`Ask about ${module}...`}
                    className="flex-1 px-3 py-2 bg-gray-800 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none text-sm"
                  />
                  <button
                    type="submit"
                    className={`px-4 py-2 bg-gradient-to-r ${config.color} text-white rounded-lg hover:opacity-90 transition-opacity flex items-center gap-1`}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  // Standalone version (similar structure but different styling)
  return (
    <div className="w-full max-w-2xl mx-auto bg-gray-900 rounded-lg shadow-xl border border-gray-700">
      {/* Full implementation similar to embedded but with larger sizing */}
      {/* ... */}
    </div>
  )
}