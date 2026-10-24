'use client'

// NIV: the company's second brain. Ask how things work here, what's allowed, what we've done
// before, what's happening in the market; NIV answers from the company's documents (with
// citations, respecting who can see what), the Hub's intelligence and research, and can draft the
// work. Company documents live in the Memory Vault under Company/.
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Send, Loader2, Sparkles, FileText, ExternalLink, Search, ArrowLeft, BookOpen } from 'lucide-react'
import { useAppStore } from '@/stores/useAppStore'
import { createAuthClient } from '@/lib/supabase/auth-client'
import Rich from '@/components/advisor/Rich'
import DeckCard from '@/components/advisor/DeckCard'

type Msg = { id: string; role: 'user' | 'assistant'; content: string; meta?: any; created_at: string }
type Job = { id: string; status: string; input?: { question?: string } }
type Conversation = { id: string; title: string; updated_at: string }

const STARTERS = [
  'What do I need to know before booking travel for a client meeting?',
  'How do discount approvals work, and when have we made exceptions?',
  "What's changed in our policies recently?",
  "What's happening with our competitors this week, and how should we respond?",
]

export default function NivPage() {
  const router = useRouter()
  const { organization } = useAppStore()
  const supabase = useMemo(() => createAuthClient(), [])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Msg[]>([])
  const [jobs, setJobs] = useState<Job[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [drafting, setDrafting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const endRef = useRef<HTMLDivElement>(null)
  const orgId = organization?.id

  const loadConversations = useCallback(async () => {
    if (!orgId) return
    const r = await fetch(`/api/niv-workspace?organizationId=${orgId}`)
    const j = await r.json().catch(() => ({}))
    if (r.ok) setConversations(j.conversations || [])
    else if (r.status === 401) router.push('/auth/login')
    else setError(j.error || 'Could not load NIV.')
  }, [orgId, router])

  const loadConversation = useCallback(async (id: string) => {
    if (!orgId) return
    const r = await fetch(`/api/niv-workspace?organizationId=${orgId}&conversationId=${id}`)
    const j = await r.json().catch(() => ({}))
    if (r.ok) {
      setMessages(j.messages || [])
      setJobs(j.jobs || [])
    }
  }, [orgId])

  useEffect(() => { loadConversations() }, [loadConversations])
  useEffect(() => {
    if (conversationId) loadConversation(conversationId)
    else { setMessages([]); setJobs([]) }
  }, [conversationId, loadConversation])

  // While something is being looked into, poll for the follow-up (simple and reliable here).
  useEffect(() => {
    if (!jobs.length || !conversationId) return
    const t = setInterval(() => loadConversation(conversationId), 5000)
    return () => clearInterval(t)
  }, [jobs.length, conversationId, loadConversation])

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages.length, jobs.length, sending])

  const send = async (text: string) => {
    const message = text.trim()
    if (!message || sending || !orgId) return
    setInput('')
    setSending(true)
    setError(null)
    const temp: Msg = { id: `temp-${Date.now()}`, role: 'user', content: message, created_at: new Date().toISOString() }
    setMessages((prev) => [...prev, temp])
    try {
      const r = await fetch('/api/niv-workspace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId: orgId, conversationId, message }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(r.status === 504 ? 'That took too long. Try again.' : j.error || 'Something went wrong.')
      setMessages((prev) => [...prev.filter((m) => m.id !== temp.id), ...j.messages])
      if (j.jobs?.length) setJobs((prev) => [...prev, ...j.jobs])
      if (!conversationId) {
        setConversationId(j.conversationId)
        loadConversations()
      }
    } catch (e) {
      setMessages((prev) => prev.filter((m) => m.id !== temp.id))
      setInput(message)
      setError(e instanceof Error ? e.message : 'Something went wrong.')
    }
    setSending(false)
  }

  const draft = async (messageId: string) => {
    if (!orgId) return
    setDrafting(messageId)
    setError(null)
    try {
      const r = await fetch('/api/advisor/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId: orgId, messageId }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(j.error || 'Could not create the draft.')
      if (j.deck) setMessages((prev) => prev.map((x) => (x.id === messageId ? { ...x, meta: { ...x.meta, deck: j.deck } } : x)))
      else if (conversationId) await loadConversation(conversationId)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create the draft.')
    }
    setDrafting(null)
  }

  const openInStudio = (contentId: string) => router.push(`/studio?contentId=${contentId}`)

  if (!orgId) {
    return <div className="min-h-screen bg-[var(--charcoal,#1f1f1f)] text-[var(--grey-400)] flex items-center justify-center text-sm">Choose an organization in the dashboard first.</div>
  }

  return (
    <div className="h-screen flex bg-[var(--grey-900,#141414)] text-[var(--grey-300)]">
      {/* Conversations */}
      <aside className="hidden md:flex w-72 flex-col border-r border-[var(--grey-800)]">
        <div className="px-4 py-4 border-b border-[var(--grey-800)] flex items-center justify-between">
          <button onClick={() => router.push('/dashboard')} className="text-[var(--grey-500)] hover:text-[var(--grey-300)] inline-flex items-center gap-1.5 text-xs">
            <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
          </button>
          <span className="text-[0.65rem] uppercase tracking-[0.15em] text-[var(--burnt-orange)] flex items-center gap-1.5" style={{ fontFamily: 'var(--font-display)' }}>
            <Sparkles className="w-3 h-3" /> NIV
          </span>
        </div>
        <div className="p-3">
          <button onClick={() => setConversationId(null)} className="w-full text-sm px-3 py-2 rounded-lg border border-[var(--grey-700)] hover:border-[var(--burnt-orange)] inline-flex items-center gap-2">
            <Plus className="w-4 h-4" /> New conversation
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-0.5">
          {conversations.map((c) => (
            <button
              key={c.id}
              onClick={() => setConversationId(c.id)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm truncate ${c.id === conversationId ? 'bg-[var(--grey-800)] text-white' : 'hover:bg-[var(--grey-800)]/60'}`}
              title={c.title}
            >
              {c.title}
            </button>
          ))}
        </div>
        <button onClick={() => router.push('/dashboard')} className="m-3 text-xs text-[var(--grey-500)] hover:text-[var(--grey-300)] inline-flex items-center gap-1.5" title="Company documents live in the Memory Vault under Company/">
          <BookOpen className="w-3.5 h-3.5" /> Company documents: Memory Vault › Company
        </button>
      </aside>

      {/* Chat */}
      <main className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-5 py-8 space-y-6 text-[15px] leading-relaxed">
            {!messages.length && (
              <div className="space-y-5 pt-10">
                <h1 className="text-2xl text-white" style={{ fontFamily: 'var(--font-display)' }}>What are you working on?</h1>
                <p className="text-[var(--grey-400)] text-sm">
                  I know {organization?.name}'s policies, precedent and research (only what you're allowed to see), what's happening in the market, and how you like to work. I'll cite where answers come from.
                </p>
                <div className="grid sm:grid-cols-2 gap-2">
                  {STARTERS.map((s) => (
                    <button key={s} onClick={() => send(s)} className="text-left text-sm px-3 py-2.5 rounded-lg border border-[var(--grey-700)] hover:border-[var(--burnt-orange)]">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m) => (
              <div key={m.id} className={m.role === 'user' ? 'flex justify-end' : ''}>
                {m.role === 'user' ? (
                  <div className="max-w-[80%] px-4 py-2.5 rounded-2xl bg-[var(--grey-800)] text-white whitespace-pre-wrap">{m.content}</div>
                ) : (
                  <div className="space-y-3">
                    <Rich text={m.content} />
                    {m.meta?.doc_sources?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {m.meta.doc_sources.map((s: any) => (
                          <span key={s.document_id} className={`text-[11px] px-2 py-0.5 rounded-full border ${s.status === 'current' ? 'border-[var(--grey-700)] text-[var(--grey-400)]' : 'border-amber-800 text-amber-400'}`}>
                            {s.title}{s.version ? ` v${s.version}` : ''}{s.status !== 'current' ? ` · ${s.status}` : ''}
                          </span>
                        ))}
                      </div>
                    )}
                    {m.meta?.sources?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {m.meta.sources.slice(0, 5).map((s: { title: string; url: string }) => (
                          <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer" className="text-[11px] px-2 py-0.5 rounded-full border border-[var(--grey-700)] text-[var(--grey-400)] hover:text-[var(--burnt-orange)] max-w-full truncate">
                            {s.title.slice(0, 56)}
                          </a>
                        ))}
                      </div>
                    )}
                    {m.meta?.taste_saved?.length > 0 && <div className="text-[11px] text-[var(--grey-500)]">Noted: {m.meta.taste_saved.join('; ')}</div>}
                    {m.meta?.proposal && (
                      <div className="rounded-lg border border-[var(--grey-700)] p-3 space-y-2">
                        <div className="text-xs text-[var(--grey-400)]">
                          <span className="uppercase tracking-wide text-[var(--burnt-orange)]">{m.meta.proposal.content_type.replace(/-/g, ' ')}</span> · {m.meta.proposal.angle}
                        </div>
                        {m.meta.deck ? (
                          <DeckCard organizationId={orgId} messageId={m.id} deck={m.meta.deck} onReady={() => conversationId && loadConversation(conversationId)} onOpenInStudio={openInStudio} />
                        ) : m.meta.drafted_content_id ? (
                          <button onClick={() => openInStudio(m.meta.drafted_content_id)} className="text-xs px-3 py-1.5 rounded-md bg-[var(--grey-800)] text-white inline-flex items-center gap-1.5">
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
                    {m.meta?.drafted_content_id && !m.meta?.proposal && !m.meta?.deck_ready && (
                      <button onClick={() => openInStudio(m.meta.drafted_content_id)} className="text-xs px-3 py-1.5 rounded-md bg-[var(--grey-800)] text-white inline-flex items-center gap-1.5">
                        <ExternalLink className="w-3.5 h-3.5" /> Open in Studio
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}

            {sending && <div className="text-[var(--grey-500)] flex items-center gap-2 text-sm"><Loader2 className="w-4 h-4 animate-spin" /> Checking…</div>}
            {jobs.map((j) => (
              <div key={j.id} className="text-xs text-[var(--grey-500)] flex items-center gap-2">
                <Search className="w-3.5 h-3.5 animate-pulse" /> Looking into: {j.input?.question?.slice(0, 100) || '…'}
              </div>
            ))}
            {error && <div className="text-xs text-red-400">{error}</div>}
            <div ref={endRef} />
          </div>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); send(input) }} className="border-t border-[var(--grey-800)]">
          <div className="max-w-3xl mx-auto px-5 py-4 flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input) } }}
              rows={2}
              maxLength={6000}
              placeholder="Ask NIV anything about your work…"
              className="flex-1 resize-none bg-[var(--grey-800)] border border-[var(--grey-700)] rounded-xl px-4 py-3 text-sm text-white placeholder:text-[var(--grey-500)] focus:outline-none focus:border-[var(--burnt-orange)]"
            />
            <button type="submit" disabled={sending || !input.trim()} aria-label="Send" className="p-3 rounded-xl bg-[var(--burnt-orange)] text-white disabled:opacity-40">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
