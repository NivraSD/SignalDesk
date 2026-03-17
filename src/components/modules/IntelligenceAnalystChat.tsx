'use client'

import React, { useState, useRef, useEffect } from 'react'
import {
  Send, Loader2, Shield, Search, Globe,
  Copy, Check, Brain
} from 'lucide-react'
import { useAppStore } from '@/stores/useAppStore'
import { PublicAffairsService } from '@/lib/services/publicAffairsService'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  searchUsed?: boolean
  suggestsDeepReport?: boolean
  reportTopic?: string
}

interface IntelligenceAnalystChatProps {
  onReportCreated?: (report: any) => void
}

const SUGGESTED_PROMPTS = [
  'What are the key geopolitical risks this week?',
  'Brief me on the latest trade policy developments',
  'What regulatory changes should we be watching?',
  'Analyze the current media narrative around AI regulation',
]

export default function IntelligenceAnalystChat({ onReportCreated }: IntelligenceAnalystChatProps) {
  const { organization } = useAppStore()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [generatingReport, setGeneratingReport] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (text?: string) => {
    const msg = text || input.trim()
    if (!msg || isThinking) return

    const userMessage: Message = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: msg,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsThinking(true)

    if (textareaRef.current) textareaRef.current.style.height = '40px'

    try {
      const response = await fetch('/api/niv/intelligence-analyst', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          history: messages.map(m => ({ role: m.role, content: m.content })),
          context: {
            organization_name: organization?.name || 'Organization',
            organization_id: organization?.id || '',
            industry: organization?.industry || 'General',
            profile: organization?.profile_data
          }
        })
      })

      if (!response.ok) throw new Error('Request failed')

      const data = await response.json()

      const assistantMessage: Message = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        searchUsed: data.search_used,
        suggestsDeepReport: data.suggests_deep_report,
        reportTopic: data.suggests_deep_report ? msg : undefined
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (err) {
      console.error('Chat error:', err)
      setMessages(prev => [...prev, {
        id: `e-${Date.now()}`,
        role: 'assistant',
        content: 'I encountered an error processing your request. Please try again.',
        timestamp: new Date()
      }])
    } finally {
      setIsThinking(false)
    }
  }

  const handleGenerateReport = async (topic: string, messageId: string) => {
    if (!organization?.id || generatingReport) return
    setGeneratingReport(messageId)

    try {
      const report = await PublicAffairsService.createFromTopic(organization.id, topic)
      PublicAffairsService.startResearch(
        report.id, organization.id, organization.name, organization.industry || 'General'
      ).catch(err => console.error('Research pipeline error:', err))
      onReportCreated?.(report)
    } catch (err) {
      console.error('Error creating report:', err)
    } finally {
      setGeneratingReport(null)
    }
  }

  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    e.target.style.height = '40px'
    e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px'
  }

  const NivAvatar = ({ size = 28 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 28 28" style={{ display: 'block', flexShrink: 0 }}>
      <rect width="28" height="28" rx="6" fill="#faf9f7" />
      <text x="4" y="19" fontFamily="Space Grotesk, sans-serif" fontWeight="700" fontSize="14" fill="#1a1a1a">NIV</text>
      <polygon points="22,0 28,0 28,6" fill="#c75d3a" />
    </svg>
  )

  return (
    <div className="bg-[var(--charcoal)] flex flex-col overflow-hidden h-full">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center relative">
            <span className="text-sm font-bold text-[var(--charcoal)]" style={{ fontFamily: 'var(--font-display)' }}>NIV</span>
            <div className="absolute top-0 right-0 w-0 h-0 border-l-[10px] border-l-transparent border-t-[10px] border-t-[var(--burnt-orange)]" />
          </div>
          <div>
            <h3 className="font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>Intelligence Analyst</h3>
            <p className="text-xs text-[var(--grey-400)]">Live search · Deep reports</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="space-y-2 pt-2">
            <p className="text-[10px] uppercase tracking-wider font-semibold mb-3" style={{ color: 'var(--grey-600)' }}>
              Suggested questions
            </p>
            {SUGGESTED_PROMPTS.map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSend(prompt)}
                className="w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all hover:bg-[var(--burnt-orange)]/8 hover:border-[var(--burnt-orange)]/20"
                style={{
                  backgroundColor: 'var(--grey-900)',
                  color: 'var(--grey-300)',
                  border: '1px solid var(--grey-800)',
                }}
              >
                <Search className="w-3 h-3 inline mr-2 opacity-40" />
                {prompt}
              </button>
            ))}
          </div>
        )}

        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[90%] ${msg.role === 'user' ? '' : ''}`}>
              {/* NIV avatar for assistant */}
              {msg.role === 'assistant' && (
                <div className="flex items-center gap-2 mb-1">
                  <NivAvatar />
                </div>
              )}

              <div
                className="rounded-xl px-3.5 py-2.5 relative group"
                style={{
                  background: msg.role === 'user' ? 'var(--burnt-orange)' : 'var(--grey-900)',
                }}
              >
                {/* Search indicator */}
                {msg.role === 'assistant' && msg.searchUsed && (
                  <div className="flex items-center gap-1.5 mb-2 text-xs" style={{ color: 'var(--burnt-orange)' }}>
                    <Globe className="w-3 h-3" />
                    <span>Searched live sources</span>
                  </div>
                )}

                {/* Message content */}
                <div className="text-sm whitespace-pre-wrap break-words" style={{
                  color: msg.role === 'user' ? 'var(--white)' : 'var(--grey-200)',
                  lineHeight: 1.5,
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word',
                }}>
                  {renderMarkdown(msg.content)}
                </div>

                {/* Copy button (hover) */}
                {msg.role === 'assistant' && (
                  <button
                    onClick={() => handleCopy(msg.content, msg.id)}
                    className="absolute top-2 right-2 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: 'var(--grey-800)' }}
                  >
                    {copiedId === msg.id
                      ? <Check className="w-3 h-3" style={{ color: 'var(--success)' }} />
                      : <Copy className="w-3 h-3" style={{ color: 'var(--grey-400)' }} />
                    }
                  </button>
                )}

                {/* Actions for assistant messages */}
                {msg.role === 'assistant' && msg.suggestsDeepReport && msg.reportTopic && (
                  <div className="flex items-center gap-2 mt-2.5 pt-2 border-t" style={{ borderColor: 'var(--grey-800)' }}>
                    <button
                      onClick={() => handleGenerateReport(msg.reportTopic!, msg.id)}
                      disabled={generatingReport === msg.id}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
                      style={{
                        backgroundColor: generatingReport === msg.id ? 'var(--grey-800)' : 'rgba(199, 93, 58, 0.12)',
                        color: generatingReport === msg.id ? 'var(--grey-500)' : 'var(--burnt-orange)',
                        border: `1px solid ${generatingReport === msg.id ? 'var(--grey-700)' : 'rgba(199, 93, 58, 0.25)'}`,
                      }}
                    >
                      {generatingReport === msg.id ? (
                        <><Loader2 className="w-3 h-3 animate-spin" /> Generating...</>
                      ) : (
                        <><Shield className="w-3 h-3" /> Generate Deep Report</>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Timestamp */}
              <div className="text-xs mt-1 px-1" style={{ color: 'var(--grey-600)' }}>
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}

        {isThinking && (
          <div className="flex justify-start">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="relative" style={{ width: 28, height: 28, flexShrink: 0 }}>
                  <NivAvatar />
                  <div
                    className="absolute inset-0 flex items-center justify-center rounded-md"
                    style={{ background: 'rgba(250, 249, 247, 0.85)' }}
                  >
                    <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: 'var(--charcoal)' }} />
                  </div>
                </div>
              </div>
              <div className="rounded-xl px-3.5 py-2.5" style={{ background: 'var(--grey-900)' }}>
                <span className="text-sm" style={{ color: 'var(--grey-400)' }}>Analyzing...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-zinc-800 flex-shrink-0">
        <div className="flex space-x-2 items-end">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask about any geopolitical topic..."
            rows={1}
            className="flex-1 bg-zinc-800 text-white px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--burnt-orange)] resize-none overflow-hidden placeholder:text-[var(--grey-600)]"
            style={{ minHeight: '40px', maxHeight: '200px' }}
            disabled={isThinking}
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isThinking}
            className="px-4 py-2.5 bg-[var(--burnt-orange)] hover:brightness-110 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center flex-shrink-0"
            style={{ height: '40px' }}
          >
            {isThinking ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

/** Simple markdown rendering for bold, italic, headers, and lists */
function renderMarkdown(text: string): React.ReactNode {
  if (!text) return null

  const lines = text.split('\n')
  const elements: React.ReactNode[] = []

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i]

    if (line.startsWith('### ')) {
      elements.push(
        <div key={i} className="font-semibold text-white mt-3 mb-1" style={{ fontSize: '0.8125rem' }}>
          {formatInline(line.slice(4))}
        </div>
      )
      continue
    }
    if (line.startsWith('## ')) {
      elements.push(
        <div key={i} className="font-semibold text-white mt-3 mb-1" style={{ fontSize: '0.875rem' }}>
          {formatInline(line.slice(3))}
        </div>
      )
      continue
    }

    if (line.match(/^[-*]\s/)) {
      elements.push(
        <div key={i} className="flex gap-2 ml-1">
          <span style={{ color: 'var(--grey-600)' }}>-</span>
          <span>{formatInline(line.slice(2))}</span>
        </div>
      )
      continue
    }

    if (line.trim() === '') {
      elements.push(<div key={i} className="h-2" />)
      continue
    }

    elements.push(<div key={i}>{formatInline(line)}</div>)
  }

  return <>{elements}</>
}

function formatInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="text-white font-medium">{part.slice(2, -2)}</strong>
    }
    return <span key={i}>{part}</span>
  })
}
