'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Bot, Send, Loader2, AlertCircle, Shield, Sparkles, MessageSquare } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useAppStore } from '@/stores/useAppStore'

export default function NivCrisisConsultant() {
  const { organization } = useAppStore()
  const [message, setMessage] = useState('')
  const [conversation, setConversation] = useState<Array<{ role: 'user' | 'assistant', content: string, timestamp: string }>>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    // Find the scrollable messages container
    const messagesContainer = document.querySelector('.niv-crisis-messages-container')
    if (messagesContainer && messagesEndRef.current) {
      const isNearBottom = messagesContainer.scrollHeight - messagesContainer.scrollTop - messagesContainer.clientHeight < 100
      if (isNearBottom) {
        // Scroll within the container, not the whole page
        messagesContainer.scrollTop = messagesContainer.scrollHeight
      }
    }
  }

  useEffect(() => {
    // Only auto-scroll on new messages, not on initial load
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
          conversation_history: historyToSend // Send the conversation history for context
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
    'How should we prepare for a data breach?',
    'What are the most common crisis scenarios for our industry?',
    'Create a crisis communication plan outline',
    'What should be in our crisis team?',
    'How do we handle social media crises?',
    'Develop a media statement template'
  ]

  return (
    <div className="h-full flex flex-col bg-gray-950">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-800 bg-gradient-to-r from-purple-900/20 to-gray-900/50">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">NIV Crisis Consultant</h2>
            <p className="text-sm text-gray-400">Expert crisis management guidance</p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 niv-crisis-messages-container">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Welcome Message */}
          {conversation.length === 0 && (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Bot className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Crisis Management Expert</h3>
              <p className="text-gray-400 mb-8 max-w-md mx-auto">
                I'm here to help you prepare for and manage crises. Ask me anything about crisis planning, prevention, or response strategies.
              </p>

              <div className="grid grid-cols-2 gap-3 max-w-2xl mx-auto">
                {quickQuestions.map((question, idx) => (
                  <button
                    key={idx}
                    onClick={() => setMessage(question)}
                    className="text-left p-4 bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-purple-500/50 rounded-xl transition-all group"
                  >
                    <div className="flex items-start space-x-3">
                      <Sparkles className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-gray-300 group-hover:text-white transition-colors">
                        {question}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Conversation */}
          {conversation.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-6 py-4 ${
                  msg.role === 'user'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-900 border border-gray-800 text-gray-100'
                }`}
              >
                <div className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</div>
                <div className={`text-xs mt-2 ${msg.role === 'user' ? 'text-purple-200' : 'text-gray-500'}`}>
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}

          {/* Loading */}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-900 border border-gray-800 rounded-lg px-6 py-4">
                <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
              </div>
            </div>
          )}

          {/* Error */}
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
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-800 bg-gray-900/50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex space-x-3">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="Ask about crisis management..."
              className="flex-1 bg-gray-800 text-white px-6 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              disabled={loading}
            />
            <button
              onClick={sendMessage}
              disabled={!message.trim() || loading}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center space-x-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>Send</span>
                </>
              )}
            </button>
          </div>

          {/* Quick Suggestions */}
          {conversation.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {quickQuestions.slice(0, 3).map((question, idx) => (
                <button
                  key={idx}
                  onClick={() => setMessage(question)}
                  className="text-xs px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-full transition-colors flex items-center space-x-1"
                >
                  <MessageSquare className="w-3 h-3" />
                  <span>{question}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
