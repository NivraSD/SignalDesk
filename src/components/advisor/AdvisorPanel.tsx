'use client'

// NIV advisor panel for an open opportunity. One voice: NIV answers, and when it hands something
// off to be looked into, the finding arrives here as a follow-up message (Realtime, with polling
// while work is in progress). Drafts NIV proposes are created only when "Draft it" is clicked,
// then open in Studio for editing.
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { X, Send, Loader2, Sparkles, FileText, ExternalLink, Search } from 'lucide-react'
import { createAuthClient } from '@/lib/supabase/auth-client'

type Msg = { id: string; role: 'user' | 'assistant'; content: string; meta?: any; created_at: string }
type Job = { id: string; status: string; input?: { question?: string } }

interface Props {
  organizationId: string
  opportunity: { id: string; title: string }
  onClose: () => void
  onOpenInStudio?: (item: any) => void
}

// Minimal formatting for NIV's replies: paragraphs, **bold**, bullets, links.
function Rich({ text }: { text: string }) {
  const inline = (s: string, key: number) => {
    const parts: React.ReactNode[] = []
    const re = /\*\*([^*]+)\*\*|\[([^\]]+)\]\((https?:[^)\s]+)\)|(https?:\/\/[^\s)]+)/g
    let last = 0
    let m: RegExpExecArray | null
    let i = 0
    while ((m = re.exec(s))) {
      if (m.index > last) parts.push(s.slice(last, m.index))
      if (m[1]) parts.push(<strong key={`${key}-${i++}`} className="text-[var(--grey-100,#f5f5f4)]">{m[1]}</strong>)
      else {
        const href = m[3] || m[4]
        parts.push(
          <a key={`${key}-${i++}`} href={href} target="_blank" rel="noopener noreferrer" className="underline text-[var(--burnt-orange)] break-all">
            {m[2] || href.replace(/^https?:\/\/(www\.)?/, '').slice(0, 40)}
          </a>
        )
      }
      last = m.index + m[0].length
    }
    if (last < s.length) parts.push(s.slice(last))
    return parts
  }
  const blocks = text.split(/\n{2,}/)
  return (
    <div className="space-y-2">
      {blocks.map((b, bi) => {
        const lines = b.split('\n')
        if (lines.every((l) => /^\s*([-*•]|\d+[.)])\s+/.test(l))) {
          return (
            <ul key={bi} className="list-disc pl-4 space-y-1">
              {lines.map((l, li) => <li key={li}>{inline(l.replace(/^\s*([-*•]|\d+[.)])\s+/, ''), bi * 100 + li)}</li>)}
            </ul>
          )
        }
        if (/^#{1,4}\s/.test(b)) return <p key={bi} className="font-semibold text-[var(--grey-200,#e7e5e4)]">{inline(b.replace(/^#{1,4}\s/, ''), bi)}</p>
        return <p key={bi} className="whitespace-pre-wrap">{inline(b, bi)}</p>
      })}
    </div>
  )
}

const STARTERS = ['Is this a good opportunity?', "What's missing or unsupported?", 'What would you do first?']

export default function AdvisorPanel({ organizationId, opportunity, onClose, onOpenInStudio }: Props) {
  const [messages, setMessages] = useState<Msg[]>([])
  const [jobs, setJobs] = useState<Job[]>([])
  const [threadId, setThreadId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [drafting, setDrafting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const endRef = useRef<HTMLDivElement>(null)
  const supabase = useMemo(() => createAuthClient(), [])

  const load = useCallback(async () => {
    const r = await fetch(`/api/advisor?organizationId=${organizationId}&opportunityId=${opportunity.id}`)
    const j = await r.json().catch(() => ({}))
    if (!r.ok) {
      setError(j.error || 'Could not load NIV.')
      return
    }
    setThreadId(j.thread?.id || null)
    setMessages(j.messages || [])
    setJobs(j.jobs || [])
    setError(null)
  }, [organizationId, opportunity.id])

  useEffect(() => {
    setLoading(true)
    setMessages([])
    load().finally(() => setLoading(false))
  }, [load])

  // Live updates: new messages (e.g. findings coming back) and job status.
  useEffect(() => {
    if (!threadId) return
    const channel = supabase
      .channel(`advisor-${threadId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'advisor_messages', filter: `thread_id=eq.${threadId}` }, (payload: any) => {
        const m = payload.new as Msg
        setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]))
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'advisor_jobs', filter: `thread_id=eq.${threadId}` }, (payload: any) => {
        const j = payload.new as Job
        setJobs((prev) => (j.status === 'done' || j.status === 'failed' ? prev.filter((x) => x.id !== j.id) : prev.map((x) => (x.id === j.id ? j : x))))
      })
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [threadId, supabase])

  // Fallback poll while something is being looked into (Realtime can miss events).
  useEffect(() => {
    if (!jobs.length) return
    const t = setInterval(load, 5000)
    return () => clearInterval(t)
  }, [jobs.length, load])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, jobs.length, sending])

  const send = async (text: string) => {
    const message = text.trim()
    if (!message || sending) return
    setInput('')
    setSending(true)
    setError(null)
    const temp: Msg = { id: `temp-${Date.now()}`, role: 'user', content: message, created_at: new Date().toISOString() }
    setMessages((prev) => [...prev, temp])
    try {
      const r = await fetch('/api/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId, opportunityId: opportunity.id, message }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(r.status === 504 ? 'That took too long. Try again.' : j.error || 'Something went wrong.')
      setMessages((prev) => {
        const rest = prev.filter((m) => m.id !== temp.id)
        const fresh = (j.messages as Msg[]).filter((m) => !rest.some((x) => x.id === m.id))
        return [...rest, ...fresh]
      })
      if (j.jobs?.length) setJobs((prev) => [...prev, ...j.jobs])
    } catch (e) {
      setMessages((prev) => prev.filter((m) => m.id !== temp.id))
      setInput(message)
      setError(e instanceof Error ? e.message : 'Something went wrong.')
    }
    setSending(false)
  }

  const draft = async (messageId: string) => {
    setDrafting(messageId)
    setError(null)
    try {
      const r = await fetch('/api/advisor/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId, messageId }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(j.error || 'Could not create the draft.')
      setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, meta: { ...m.meta, drafted_content_id: j.content.id, drafted: j.content } } : m)))
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create the draft.')
    }
    setDrafting(null)
  }

  const openDraft = async (contentId: string) => {
    if (!onOpenInStudio) return
    const { data } = await supabase.from('content_library').select('id, title, content_type, content, folder, metadata').eq('id', contentId).maybeSingle()
    if (data) onOpenInStudio(data)
  }

  return (
    <aside className="fixed right-0 top-0 bottom-0 z-40 w-full sm:w-[420px] bg-[var(--grey-900)] border-l border-[var(--grey-800)] flex flex-col shadow-2xl">
      <div className="px-5 py-4 border-b border-[var(--grey-800)] flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[0.65rem] uppercase tracking-[0.15em] text-[var(--burnt-orange)] flex items-center gap-1.5" style={{ fontFamily: 'var(--font-display)' }}>
            <Sparkles className="w-3 h-3" /> NIV
          </div>
          <div className="text-sm text-[var(--grey-300)] truncate mt-1" title={opportunity.title}>{opportunity.title}</div>
        </div>
        <button onClick={onClose} aria-label="Close NIV" className="text-[var(--grey-500)] hover:text-[var(--grey-300)]">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 text-sm text-[var(--grey-300)] leading-relaxed">
        {loading && <div className="text-[var(--grey-500)] flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>}

        {!loading && !messages.length && (
          <div className="space-y-3">
            <p className="text-[var(--grey-400)]">I've got this opportunity open with you. Ask me anything about it, or start here:</p>
            <div className="flex flex-col gap-2">
              {STARTERS.map((s) => (
                <button key={s} onClick={() => send(s)} className="text-left px-3 py-2 rounded-lg border border-[var(--grey-700)] text-[var(--grey-300)] hover:border-[var(--burnt-orange)]">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <div key={m.id} className={m.role === 'user' ? 'flex justify-end' : ''}>
            {m.role === 'user' ? (
              <div className="max-w-[85%] px-3 py-2 rounded-lg bg-[var(--grey-800)] text-[var(--grey-200,#e7e5e4)] whitespace-pre-wrap">{m.content}</div>
            ) : (
              <div className="space-y-2">
                <Rich text={m.content} />
                {m.meta?.taste_saved?.length > 0 && (
                  <div className="text-[11px] text-[var(--grey-500)]">Noted: {m.meta.taste_saved.join('; ')}</div>
                )}
                {m.meta?.sources?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {m.meta.sources.slice(0, 5).map((s: { title: string; url: string }) => (
                      <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer" className="text-[11px] px-2 py-0.5 rounded-full border border-[var(--grey-700)] text-[var(--grey-400)] hover:text-[var(--burnt-orange)] max-w-full truncate" title={s.title}>
                        {s.title.slice(0, 48)}
                      </a>
                    ))}
                  </div>
                )}
                {m.meta?.proposal && (
                  <div className="rounded-lg border border-[var(--grey-700)] p-3 space-y-2">
                    <div className="text-xs text-[var(--grey-400)]">
                      <span className="uppercase tracking-wide text-[var(--burnt-orange)]">{m.meta.proposal.content_type.replace(/-/g, ' ')}</span> · {m.meta.proposal.angle}
                    </div>
                    {m.meta.drafted_content_id ? (
                      <button onClick={() => openDraft(m.meta.drafted_content_id)} disabled={!onOpenInStudio} className="text-xs px-3 py-1.5 rounded-md bg-[var(--grey-800)] text-[var(--grey-200,#e7e5e4)] inline-flex items-center gap-1.5 disabled:opacity-50">
                        <ExternalLink className="w-3.5 h-3.5" /> Open in Studio
                      </button>
                    ) : (
                      <button onClick={() => draft(m.id)} disabled={!!drafting} className="text-xs px-3 py-1.5 rounded-md bg-[var(--burnt-orange)] text-white inline-flex items-center gap-1.5 disabled:opacity-50">
                        {drafting === m.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
                        {drafting === m.id ? 'Drafting…' : 'Draft it'}
                      </button>
                    )}
                  </div>
                )}
                {m.meta?.drafted_content_id && !m.meta?.proposal && onOpenInStudio && (
                  <button onClick={() => openDraft(m.meta.drafted_content_id)} className="text-xs px-3 py-1.5 rounded-md bg-[var(--grey-800)] text-[var(--grey-200,#e7e5e4)] inline-flex items-center gap-1.5">
                    <ExternalLink className="w-3.5 h-3.5" /> Open in Studio
                  </button>
                )}
              </div>
            )}
          </div>
        ))}

        {sending && <div className="text-[var(--grey-500)] flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Thinking…</div>}
        {jobs.map((j) => (
          <div key={j.id} className="text-xs text-[var(--grey-500)] flex items-center gap-2">
            <Search className="w-3.5 h-3.5 animate-pulse" /> Looking into: {j.input?.question?.slice(0, 90) || '…'}
          </div>
        ))}
        {error && <div className="text-xs text-red-400">{error}</div>}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          send(input)
        }}
        className="p-4 border-t border-[var(--grey-800)] flex items-end gap-2"
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              send(input)
            }
          }}
          rows={2}
          maxLength={4000}
          placeholder="Ask NIV about this opportunity…"
          className="flex-1 resize-none bg-[var(--grey-800)] border border-[var(--grey-700)] rounded-lg px-3 py-2 text-sm text-[var(--grey-200,#e7e5e4)] placeholder:text-[var(--grey-500)] focus:outline-none focus:border-[var(--burnt-orange)]"
        />
        <button type="submit" disabled={sending || !input.trim()} aria-label="Send" className="p-2.5 rounded-lg bg-[var(--burnt-orange)] text-white disabled:opacity-40">
          <Send className="w-4 h-4" />
        </button>
      </form>
    </aside>
  )
}
