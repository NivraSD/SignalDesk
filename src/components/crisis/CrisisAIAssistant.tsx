'use client'

import React, { useState, useRef, useEffect } from 'react'
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
  const messagesEndRef = useRef<HTMLDivElement>(null)

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

    // Add user message to conversation
    const newConversation = [
      ...conversation,
      { role: 'user' as const, content: userMessage, timestamp: new Date().toISOString() }
    ]
    setConversation(newConversation)

    try {
      const historyToSend = newConversation.slice(0, -1)
      console.log('🤖 Calling niv-crisis-consultant with:', {
        message: userMessage,
        organization: organization.name,
        historyLength: historyToSend.length,
        history: historyToSend
      })

      // Call the crisis consultant edge function
      const { data, error: apiError } = await supabase.functions.invoke('niv-crisis-consultant', {
        body: {
          message: userMessage,
          organization_name: organization.name,
          conversation_history: historyToSend
        }
      })

      console.log('Response from edge function:', { data, apiError })

      if (apiError) {
        console.error('❌ Edge function error:', apiError)
        setError(`Edge function error: ${JSON.stringify(apiError)}`)
        setLoading(false)
        return
      }

      if (!data || !data.response) {
        console.error('❌ No response data:', data)
        setError(`No response from AI. Got: ${JSON.stringify(data)}`)
        setLoading(false)
        return
      }

      const aiResponse = data.response
      console.log('✅ Got AI response:', aiResponse.substring(0, 100))

      setConversation([
        ...newConversation,
        { role: 'assistant', content: aiResponse, timestamp: new Date().toISOString() }
      ])
    } catch (err: any) {
      console.error('NIV Crisis Consultant error:', err)
      setError(err.message || 'Failed to get response')
    } finally {
      setLoading(false)
    }
  }

  const quickQuestions = [
    'What should I do right now?',
    'Who should I contact first?',
    'Draft a statement for employees',
    'What are the next 3 priorities?'
  ]

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-white">Crisis AI Advisor</h3>
            <p className="text-xs text-gray-400">Directive, actionable guidance</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {conversation.length === 0 && (
          <div className="text-center py-12">
            <Bot className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-white mb-2">AI Crisis Advisor Ready</h4>
            <p className="text-sm text-gray-400 mb-6">
              Ask me what to do. I'll give you one specific action at a time.
            </p>
            <div className="space-y-2">
              <div className="text-xs text-gray-500 uppercase font-semibold mb-2">Quick Actions</div>
              {quickQuestions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => setMessage(action)}
                  className="block w-full text-left px-4 py-2 bg-gray-800/50 hover:bg-gray-800 rounded-lg text-sm text-gray-300 transition-colors"
                >
                  {action}
                </button>
              ))}
            </div>
          </div>
        )}

        {conversation.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-lg px-4 py-2 ${
              msg.role === 'user'
                ? 'bg-blue-600 text-white rounded-tr-none'
                : 'bg-gray-800 text-gray-100 rounded-tl-none'
            }`}>
              <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
              <div className="text-xs text-gray-500 mt-2">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-800 text-gray-100 rounded-lg rounded-tl-none px-4 py-3">
              <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-red-400">Error</div>
              <div className="text-sm text-red-300">{error}</div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-800">
        <div className="flex space-x-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="Ask for guidance..."
            className="flex-1 bg-gray-800 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={!message.trim() || loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center space-x-2"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Quick Actions Buttons */}
        {conversation.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {quickQuestions.slice(0, 2).map((action, idx) => (
              <button
                key={idx}
                onClick={() => setMessage(action)}
                className="text-xs px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-full transition-colors flex items-center space-x-1"
              >
                <Sparkles className="w-3 h-3" />
                <span>{action}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
