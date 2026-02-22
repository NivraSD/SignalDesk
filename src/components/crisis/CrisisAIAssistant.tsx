'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Bot, Send, Loader2, AlertCircle, Shield, Sparkles, MessageSquare } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useAppStore } from '@/stores/useAppStore'

interface CrisisAIAssistantProps {
  crisis: any
  onUpdate: () => void
}

export default function CrisisAIAssistant({ crisis, onUpdate }: CrisisAIAssistantProps) {
  const { organization } = useAppStore()
  const [message, setMessage] = useState('')
  const [conversation, setConversation] = useState<Array<{ role: 'user' | 'assistant', content: string, timestamp: string }>>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
    }
  }

  useEffect(() => {
    if (conversation.length > 0) {
      scrollToBottom()
    }
  }, [conversation.length])

  // Auto-resize textarea
  const resizeTextarea = useCallback(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px'
  }, [])

  useEffect(() => {
    resizeTextarea()
  }, [message, resizeTextarea])

  const sendMessage = async () => {
    if (!message.trim() || loading) return
    if (!organization) {
      setError('Please select an organization first')
      return
    }

    const userMessage = message.trim()
    setMessage('')
    setLoading(true)
    setError('')

    const newConversation = [
      ...conversation,
      { role: 'user' as const, content: userMessage, timestamp: new Date().toISOString() }
    ]
    setConversation(newConversation)

    try {
      const historyToSend = newConversation.slice(0, -1)

      const { data, error: apiError } = await supabase.functions.invoke('niv-crisis-consultant', {
        body: {
          message: userMessage,
          organization_name: organization.name,
          conversation_history: historyToSend,
          crisis: crisis
        }
      })

      if (apiError) {
        setError(`Edge function error: ${JSON.stringify(apiError)}`)
        setLoading(false)
        return
      }

      if (!data || !data.response) {
        setError(`No response from AI. Got: ${JSON.stringify(data)}`)
        setLoading(false)
        return
      }

      setConversation([
        ...newConversation,
        { role: 'assistant', content: data.response, timestamp: new Date().toISOString() }
      ])
    } catch (err: any) {
      console.error('NIV Crisis Consultant error:', err)
      setError(err.message || 'Failed to get response')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const quickQuestions = [
    'What should I do right now?',
    'Who should I contact first?',
    'Draft a statement for employees',
    'What are the next 3 priorities?'
  ]

  return (
    <div className="bg-[var(--charcoal)] border border-zinc-800 rounded-xl flex flex-col h-[600px]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-800 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center relative">
            <span className="text-xs font-bold text-[var(--charcoal)]" style={{ fontFamily: 'var(--font-display)' }}>NIV</span>
            <div className="absolute top-0 right-0 w-0 h-0 border-l-[8px] border-l-transparent border-t-[8px] border-t-[var(--burnt-orange)]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>NIV Crisis Advisor</h3>
            <p className="text-xs text-[var(--grey-400)]">Available 24/7</p>
          </div>
        </div>
      </div>

      {/* Messages — fixed scrollable area */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
        {conversation.length === 0 && (
          <div className="text-center py-8">
            <Bot className="w-10 h-10 text-[var(--grey-600)] mx-auto mb-3" />
            <h4 className="text-sm font-semibold text-white mb-1" style={{ fontFamily: 'var(--font-display)' }}>Crisis Advisor Ready</h4>
            <p className="text-xs text-[var(--grey-400)] mb-4">
              Ask me what to do. I'll give you one specific action at a time.
            </p>
            <div className="space-y-1.5">
              {quickQuestions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => setMessage(action)}
                  className="block w-full text-left px-3 py-1.5 bg-zinc-800/50 hover:bg-zinc-800 rounded-lg text-xs text-[var(--grey-300)] transition-colors"
                >
                  {action}
                </button>
              ))}
            </div>
          </div>
        )}

        {conversation.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-lg px-3 py-2 ${
              msg.role === 'user'
                ? 'bg-[var(--burnt-orange)] text-white rounded-tr-none'
                : 'bg-zinc-800 text-[var(--grey-100)] rounded-tl-none'
            }`}>
              <div className="text-xs whitespace-pre-wrap leading-relaxed">{msg.content}</div>
              <div className="text-[10px] text-[var(--grey-500)] mt-1">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-zinc-800 text-[var(--grey-100)] rounded-lg rounded-tl-none px-3 py-2">
              <Loader2 className="w-4 h-4 animate-spin text-[var(--burnt-orange)]" />
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-900/20 border border-red-800 rounded-lg p-3 flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-semibold text-red-400">Error</div>
              <div className="text-xs text-red-300">{error}</div>
            </div>
          </div>
        )}
      </div>

      {/* Input — expanding textarea */}
      <div className="px-3 py-2 border-t border-zinc-800 flex-shrink-0">
        <div className="flex items-end space-x-2">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask for guidance..."
            rows={1}
            className="flex-1 bg-zinc-800 text-white text-sm px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--burnt-orange)] resize-none overflow-hidden leading-snug"
            disabled={loading}
            style={{ minHeight: '36px', maxHeight: '120px' }}
          />
          <button
            onClick={sendMessage}
            disabled={!message.trim() || loading}
            className="px-3 py-2 bg-[var(--burnt-orange)] hover:brightness-110 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex-shrink-0"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Quick Actions */}
        {conversation.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {quickQuestions.slice(0, 2).map((action, idx) => (
              <button
                key={idx}
                onClick={() => setMessage(action)}
                className="text-[10px] px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-[var(--grey-300)] rounded-full transition-colors flex items-center space-x-1"
              >
                <Sparkles className="w-2.5 h-2.5" />
                <span>{action}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
