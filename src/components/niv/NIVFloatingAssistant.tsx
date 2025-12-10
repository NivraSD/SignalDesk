'use client'

import React, { useState, useEffect, useRef } from 'react'
import { X, Send, Loader } from 'lucide-react'
import { useAppStore } from '@/stores/useAppStore'

interface Message {
  id: string
  role: 'user' | 'niv'
  content: string
  data?: any
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

  // Render message content with markdown links as clickable elements
  const renderMessageContent = (content: string) => {
    // Match markdown links: [text](url)
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
    const parts: (string | JSX.Element)[] = []
    let lastIndex = 0
    let match

    while ((match = linkRegex.exec(content)) !== null) {
      // Add text before the link
      if (match.index > lastIndex) {
        parts.push(content.slice(lastIndex, match.index))
      }

      const [, linkText, url] = match
      const isGammaLink = url.includes('gamma.app')

      if (isGammaLink) {
        // Styled button for Gamma presentations - orange to match platform
        parts.push(
          <a
            key={match.index}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              marginTop: '12px',
              padding: '12px 20px',
              background: 'var(--burnt-orange)',
              color: 'white',
              borderRadius: '10px',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '0.9rem',
              boxShadow: '0 4px 12px rgba(217, 119, 6, 0.3)',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(217, 119, 6, 0.4)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(217, 119, 6, 0.3)'
            }}
          >
            <span style={{ fontSize: '1.1rem' }}>🎨</span>
            {linkText}
            <span style={{ fontSize: '0.8rem' }}>→</span>
          </a>
        )
      } else {
        // Regular styled link
        parts.push(
          <a
            key={match.index}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: 'var(--burnt-orange)',
              textDecoration: 'underline'
            }}
          >
            {linkText}
          </a>
        )
      }

      lastIndex = match.index + match[0].length
    }

    // Add remaining text
    if (lastIndex < content.length) {
      parts.push(content.slice(lastIndex))
    }

    // Handle newlines
    return parts.map((part, i) => {
      if (typeof part === 'string') {
        return part.split('\n').map((line, j, arr) => (
          <React.Fragment key={`${i}-${j}`}>
            {line}
            {j < arr.length - 1 && <br />}
          </React.Fragment>
        ))
      }
      return part
    })
  }

  // Poll Gamma presentation status
  // Pass capture params on each poll since Edge Functions are stateless
  const pollGammaStatus = async (generationId: string, messageId: string, captureParams?: { organization_id?: string, title?: string }) => {
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
    const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    console.log('🚀 Starting Gamma polling for:', generationId, 'with capture params:', captureParams)
    let attempts = 0
    const maxAttempts = 60 // 60 attempts * 3 seconds = 3 minutes max

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 3000))
      attempts++
      console.log(`🔄 Gamma poll attempt ${attempts}/${maxAttempts}`)

      try {
        // Use POST with capture params so gamma-presentation can save to Memory Vault
        const response = await fetch(
          `${SUPABASE_URL}/functions/v1/gamma-presentation`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({
              generationId,
              capture: true,
              organization_id: captureParams?.organization_id,
              title: captureParams?.title,
              campaign_folder: 'NIV Advisor'
            })
          }
        )

        if (response.ok) {
          const statusData = await response.json()
          console.log('📊 Gamma status:', statusData.status)

          if (statusData.status === 'complete' || statusData.status === 'completed') {
            const finalUrl = statusData.gammaUrl || statusData.presentationUrl || statusData.url || statusData.webUrl
            console.log('✅ Gamma complete! URL:', finalUrl)

            setMessages(prev => prev.map(msg => {
              if (msg.id === messageId) {
                return {
                  ...msg,
                  content: `✅ Your Gamma presentation is ready!\n\n🔗 [Open Presentation](${finalUrl})`
                }
              }
              return msg
            }))
            return
          } else if (statusData.status === 'failed' || statusData.status === 'error') {
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
        }
      } catch (error) {
        console.error('Gamma polling error:', error)
      }
    }

    // Timeout
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        return {
          ...msg,
          content: `⏱️ Gamma presentation generation timed out. Please check the Gamma dashboard.`
        }
      }
      return msg
    }))
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
          organizationContext: {
            name: organization?.name || 'Unknown',
            industry: organization?.industry || 'Technology',
            competitors: organization?.competitors || []
          },
          context: 'global',
          conversationHistory: messages.slice(-10).map(m => ({
            role: m.role === 'user' ? 'user' : 'assistant',
            content: m.content,
            // Pass outline/type back so backend can find it for confirmation
            ...(m.data?.outline && { outline: m.data.outline }),
            ...(m.data?.type && { type: m.data.type })
          }))
        })
      })

      if (response.ok) {
        const data = await response.json()
        console.log('🎯 NIV response type:', data.type, '| gammaGenerationId:', data.gammaGenerationId)

        const nivResponse = data.response || data.message || "I'm processing your request..."
        const messageId = `niv-${Date.now()}`

        setMessages(prev => [...prev, {
          id: messageId,
          role: 'niv',
          content: nivResponse,
          data: data
        }])

        // If Gamma presentation is being generated, start polling
        // Pass capture params so gamma-presentation can save to Memory Vault
        if (data.type === 'gamma_generating' && data.gammaGenerationId) {
          pollGammaStatus(data.gammaGenerationId, messageId, {
            organization_id: organization?.id,
            title: data.outline?.topic || data.outline?.title || 'NIV Presentation'
          })
        }
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
        bottom: '24px',
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
            width: '525px',
            maxHeight: 'calc(100vh - 150px)',
            height: '700px',
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
                  {renderMessageContent(msg.content)}
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
        data-tour="niv-assistant"
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
