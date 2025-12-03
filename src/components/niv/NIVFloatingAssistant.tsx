'use client'

import React, { useState, useEffect, useRef } from 'react'
import { X, Send, Loader } from 'lucide-react'
import { useAppStore } from '@/stores/useAppStore'

interface Message {
  id: string
  role: 'user' | 'niv'
  content: string
}

export default function NIVFloatingAssistant() {
  const { organization } = useAppStore()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'niv', content: "Hi! I'm NIV, your strategic advisor. How can I help you today?" }
  ])
  const [input, setInput] = useState('')
  const [processing, setProcessing] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Reset messages when organization changes
  useEffect(() => {
    if (organization) {
      setMessages([
        { id: '1', role: 'niv', content: `Hi! I'm NIV, your strategic advisor. How can I help you with ${organization.name} today?` }
      ])
    }
  }, [organization?.id])

  // Auto-resize textarea
  const resizeTextarea = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '50px' // Reset to minimum
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 150) + 'px'
    }
  }

  // Reset textarea height
  const resetTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '50px'
    }
  }

  const handleSend = async () => {
    if (!input.trim() || processing) return

    const userMessage = input.trim()
    const newUserMsg: Message = { id: `user-${Date.now()}`, role: 'user', content: userMessage }
    setMessages(prev => [...prev, newUserMsg])
    setInput('')
    resetTextareaHeight() // Reset textarea to original size
    setProcessing(true)

    try {
      const response = await fetch('/api/niv-orchestrator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          organizationId: organization?.id,
          context: 'global',
          conversationHistory: messages.slice(-10).map(m => ({
            role: m.role === 'user' ? 'user' : 'assistant',
            content: m.content
          }))
        })
      })

      if (response.ok) {
        const data = await response.json()
        const nivResponse = data.response || data.message || "I'm processing your request..."
        setMessages(prev => [...prev, {
          id: `niv-${Date.now()}`,
          role: 'niv',
          content: nivResponse
        }])
      } else {
        setMessages(prev => [...prev, {
          id: `niv-${Date.now()}`,
          role: 'niv',
          content: "I apologize, I encountered an issue processing your request. Please try again."
        }])
      }
    } catch (error) {
      console.error('NIV error:', error)
      setMessages(prev => [...prev, {
        id: `niv-${Date.now()}`,
        role: 'niv',
        content: "I'm having trouble connecting. Please try again in a moment."
      }])
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '80px',
        right: '24px',
        zIndex: 1000
      }}
    >
      {/* Expanded Panel */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            bottom: '88px',
            right: 0,
            width: '550px',
            maxHeight: 'calc(100vh - 200px)',
            height: '650px',
            background: 'var(--charcoal)',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          {/* Panel Header */}
          <div
            style={{
              padding: '16px',
              background: 'var(--charcoal)',
              borderBottom: '1px solid var(--grey-800)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '45px',
                  height: '45px',
                  background: 'var(--white)',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '16px',
                    fontWeight: 700,
                    color: 'var(--charcoal)'
                  }}
                >
                  NIV
                </span>
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: 0,
                    height: 0,
                    borderStyle: 'solid',
                    borderWidth: '0 10px 10px 0',
                    borderColor: 'transparent var(--burnt-orange) transparent transparent'
                  }}
                />
              </div>
              <div>
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    color: 'var(--white)'
                  }}
                >
                  NIV
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--grey-500)' }}>
                  Strategic Advisor
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                width: '32px',
                height: '32px',
                background: 'var(--grey-800)',
                border: 'none',
                borderRadius: '8px',
                color: 'var(--grey-400)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Panel Body - Messages */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            {messages.map(msg => (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  gap: '12px',
                  flexDirection: msg.role === 'user' ? 'row-reverse' : 'row'
                }}
              >
                {msg.role === 'niv' && (
                  <div
                    style={{
                      width: '35px',
                      height: '35px',
                      background: 'var(--white)',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      position: 'relative'
                    }}
                  >
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--charcoal)' }}>NIV</span>
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        width: 0,
                        height: 0,
                        borderStyle: 'solid',
                        borderWidth: '0 6px 6px 0',
                        borderColor: 'transparent var(--burnt-orange) transparent transparent'
                      }}
                    />
                  </div>
                )}
                <div
                  style={{
                    maxWidth: '80%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    fontSize: '0.875rem',
                    lineHeight: '1.5',
                    background: msg.role === 'user' ? 'var(--burnt-orange)' : 'var(--grey-800)',
                    color: 'var(--white)'
                  }}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {processing && (
              <div style={{ display: 'flex', gap: '12px' }}>
                <div
                  style={{
                    width: '35px',
                    height: '35px',
                    background: 'var(--white)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <Loader className="w-4 h-4 animate-spin" style={{ color: 'var(--charcoal)' }} />
                </div>
                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: '12px',
                    background: 'var(--grey-800)',
                    color: 'var(--grey-400)',
                    fontSize: '0.875rem'
                  }}
                >
                  Thinking...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Panel Input */}
          <div
            style={{
              padding: '16px',
              borderTop: '1px solid var(--grey-800)',
              display: 'flex',
              gap: '12px',
              background: 'var(--grey-900)',
              alignItems: 'flex-end'
            }}
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value)
                resizeTextarea()
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              placeholder="Ask NIV anything..."
              rows={1}
              style={{
                flex: 1,
                background: 'var(--charcoal)',
                border: '1px solid var(--grey-800)',
                borderRadius: '10px',
                padding: '14px 16px',
                fontSize: '0.9rem',
                color: 'var(--white)',
                outline: 'none',
                resize: 'none',
                minHeight: '50px',
                maxHeight: '150px',
                lineHeight: '1.4',
                overflow: 'hidden'
              }}
            />
            <button
              onClick={handleSend}
              disabled={processing || !input.trim()}
              style={{
                width: '50px',
                height: '50px',
                background: 'var(--burnt-orange)',
                border: 'none',
                borderRadius: '10px',
                color: 'var(--white)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: processing || !input.trim() ? 0.5 : 1,
                flexShrink: 0,
                alignSelf: 'flex-end'
              }}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Floating Bubble */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '60px',
          height: '60px',
          background: 'var(--white)',
          borderRadius: '15px',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
          transition: 'all 0.3s ease',
          position: 'relative',
          overflow: 'visible'
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: 0,
            height: 0,
            borderStyle: 'solid',
            borderWidth: '0 15px 15px 0',
            borderColor: 'transparent var(--burnt-orange) transparent transparent',
            borderTopRightRadius: '15px'
          }}
        />
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '19px',
            fontWeight: 700,
            color: 'var(--charcoal)',
            letterSpacing: '-0.5px'
          }}
        >
          NIV
        </span>
        {/* Online indicator */}
        <div
          style={{
            position: 'absolute',
            top: '-3px',
            left: '-3px',
            width: '13px',
            height: '13px',
            background: '#22c55e',
            borderRadius: '50%',
            border: '2px solid var(--white)'
          }}
        />
      </button>
    </div>
  )
}
