'use client'

import React, { useState, useRef, useEffect } from 'react'
import {
  Send, Loader2, Shield, Search, Globe, ChevronRight,
  Sparkles, Copy, Check, Brain
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

    // Auto-resize textarea back
    if (textareaRef.current) textareaRef.current.style.height = '44px'

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
    // Auto-resize
    const el = e.target
    el.style.height = '44px'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[var(--grey-800)]">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4" style={{ color: '#60a5fa' }} />
          <span className="text-sm font-semibold text-white" style={{ fontFamily: 'var(--font-display)' }}>
            Intelligence Analyst
          </span>
        </div>
        <p className="text-xs mt-0.5" style={{ color: '#71717a' }}>
          Ask questions, get briefings, commission deep reports
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="space-y-3 pt-4">
            <p className="text-xs uppercase tracking-wider font-medium" style={{ color: '#52525b' }}>
              Suggested questions
            </p>
            {SUGGESTED_PROMPTS.map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSend(prompt)}
                className="w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  color: '#a1a1aa',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
                onMouseEnter={e => {
                  (e.target as HTMLElement).style.backgroundColor = 'rgba(59,130,246,0.08)'
                  ;(e.target as HTMLElement).style.borderColor = 'rgba(59,130,246,0.2)'
                  ;(e.target as HTMLElement).style.color = '#93c5fd'
                }}
                onMouseLeave={e => {
                  (e.target as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.03)'
                  ;(e.target as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)'
                  ;(e.target as HTMLElement).style.color = '#a1a1aa'
                }}
              >
                <Search className="w-3 h-3 inline mr-2 opacity-50" />
                {prompt}
              </button>
            ))}
          </div>
        )}

        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[90%] rounded-lg px-3.5 py-2.5 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-blue-600/20 text-blue-100 border border-blue-500/20'
                  : 'text-[var(--grey-200)]'
              }`}
              style={msg.role === 'assistant' ? {
                backgroundColor: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)'
              } : undefined}
            >
              {/* Search indicator */}
              {msg.role === 'assistant' && msg.searchUsed && (
                <div className="flex items-center gap-1.5 mb-2 text-xs" style={{ color: '#60a5fa' }}>
                  <Globe className="w-3 h-3" />
                  <span>Searched live sources</span>
                </div>
              )}

              {/* Message content with basic markdown */}
              <div className="prose-sm whitespace-pre-wrap">
                {renderMarkdown(msg.content)}
              </div>

              {/* Actions for assistant messages */}
              {msg.role === 'assistant' && (
                <div className="flex items-center gap-2 mt-2.5 pt-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  <button
                    onClick={() => handleCopy(msg.content, msg.id)}
                    className="flex items-center gap-1 px-2 py-1 rounded text-xs transition-all hover:bg-white/5"
                    style={{ color: '#71717a' }}
                  >
                    {copiedId === msg.id
                      ? <><Check className="w-3 h-3" /> Copied</>
                      : <><Copy className="w-3 h-3" /> Copy</>
                    }
                  </button>

                  {msg.suggestsDeepReport && msg.reportTopic && (
                    <button
                      onClick={() => handleGenerateReport(msg.reportTopic!, msg.id)}
                      disabled={generatingReport === msg.id}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all"
                      style={{
                        backgroundColor: generatingReport === msg.id ? 'rgba(255,255,255,0.05)' : 'rgba(59,130,246,0.12)',
                        color: generatingReport === msg.id ? '#71717a' : '#93c5fd',
                        border: `1px solid ${generatingReport === msg.id ? 'rgba(255,255,255,0.08)' : 'rgba(59,130,246,0.25)'}`,
                      }}
                    >
                      {generatingReport === msg.id ? (
                        <><Loader2 className="w-3 h-3 animate-spin" /> Generating...</>
                      ) : (
                        <><Shield className="w-3 h-3" /> Generate Deep Report</>
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {isThinking && (
          <div className="flex justify-start">
            <div
              className="rounded-lg px-3.5 py-2.5 text-sm flex items-center gap-2"
              style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: '#71717a' }}
            >
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Analyzing...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-[var(--grey-800)]">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask about any geopolitical topic..."
            rows={1}
            className="flex-1 resize-none px-3 py-2.5 rounded-lg text-sm bg-[var(--grey-900)] text-white border border-[var(--grey-700)] focus:border-blue-500/50 focus:outline-none placeholder:text-[var(--grey-600)]"
            style={{ height: '44px', maxHeight: '120px' }}
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isThinking}
            className="shrink-0 p-2.5 rounded-lg transition-all disabled:opacity-30"
            style={{ backgroundColor: '#2563eb', color: '#fff' }}
          >
            <Send className="w-4 h-4" />
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

    // Headers
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

    // Bullet points
    if (line.match(/^[-*]\s/)) {
      elements.push(
        <div key={i} className="flex gap-2 ml-1">
          <span style={{ color: '#52525b' }}>-</span>
          <span>{formatInline(line.slice(2))}</span>
        </div>
      )
      continue
    }

    // Empty line = paragraph break
    if (line.trim() === '') {
      elements.push(<div key={i} className="h-2" />)
      continue
    }

    // Regular text
    elements.push(<div key={i}>{formatInline(line)}</div>)
  }

  return <>{elements}</>
}

function formatInline(text: string): React.ReactNode {
  // Bold
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="text-white font-medium">{part.slice(2, -2)}</strong>
    }
    return <span key={i}>{part}</span>
  })
}
