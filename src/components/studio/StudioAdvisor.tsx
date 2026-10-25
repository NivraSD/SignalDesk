'use client'

// NIV in Studio: the same advisor as /niv, but it can see the document in the editor (including
// unsaved changes) and edit it. Edits land in the editor immediately with Undo; saving to the vault
// stays with the person. Each saved document keeps its own thread with NIV.
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Send, Loader2, Sparkles, Undo2, FileText, ExternalLink, Search } from 'lucide-react'
import Rich from '@/components/advisor/Rich'
import CopyButton from '@/components/advisor/CopyButton'
import DeckCard from '@/components/advisor/DeckCard'
import type { StudioWorkspaceRef } from './StudioWorkspace'

type Msg = { id: string; role: 'user' | 'assistant'; content: string; meta?: any; created_at: string }
type Job = { id: string; status: string; input?: { question?: string } }

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

interface Props {
  organizationId: string | undefined
  workspaceContent: any | null
  workspaceRef: React.RefObject<StudioWorkspaceRef | null>
  onNewContent: (item: any) => void
}

export default function StudioAdvisor({ organizationId, workspaceContent, workspaceRef, onNewContent }: Props) {
  const docId: string | null = (() => {
    const id = workspaceContent?.metadata?.sourceContentId || workspaceContent?.id
    return typeof id === 'string' && UUID.test(id) ? id : null
  })()
  const docKey = docId || workspaceContent?.id || 'none'

  const [messages, setMessages] = useState<Msg[]>([])
  const [jobs, setJobs] = useState<Job[]>([])
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastEdit, setLastEdit] = useState<{ before: string; summary: string } | null>(null)
  const [drafting, setDrafting] = useState<string | null>(null)
  const endRef = useRef<HTMLDivElement>(null)

  const load = useCallback(async () => {
    if (!organizationId) return
    if (!docId && !conversationId) { setMessages([]); setJobs([]); return }
    const q = docId ? `documentId=${docId}` : `conversationId=${conversationId}`
    const r = await fetch(`/api/niv-workspace?organizationId=${organizationId}&${q}`)
    const j = await r.json().catch(() => ({}))
    if (r.ok) {
      setMessages(j.messages || [])
      setJobs(j.jobs || [])
      if (j.conversationId) setConversationId(j.conversationId)
    }
  }, [organizationId, docId, conversationId])

  // New document in the editor: start from its own thread.
  useEffect(() => {
    setConversationId(null)
    setLastEdit(null)
    setMessages([])
  }, [docKey])
  useEffect(() => { load() }, [docKey]) // eslint-disable-line react-hooks/exhaustive-deps

  const building = messages.some((m) => m.meta?.deck?.status === 'generating')
  useEffect(() => {
    if (!jobs.length && !building) return
    const t = setInterval(load, 5000)
    return () => clearInterval(t)
  }, [jobs.length, building, load])

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages.length, sending])

  const applyEdit = (text: string, summary: string) => {
    const before = workspaceRef.current?.getText() ?? ''
    if (workspaceContent && workspaceRef.current) {
      workspaceRef.current.setText(text)
      setLastEdit({ before, summary })
    } else {
      // Nothing open: NIV's new piece opens in the editor.
      const title = (text.match(/^#\s+(.+)$/m)?.[1] || 'NIV draft').slice(0, 120)
      onNewContent({ id: `niv-${Date.now()}`, type: 'document', title, content: text, status: 'draft', source: 'niv', metadata: { generatedAt: new Date().toISOString(), source: 'niv' } })
    }
  }

  const send = async (text: string) => {
    const message = text.trim()
    if (!message || sending || !organizationId) return
    setInput('')
    setSending(true)
    setError(null)
    const temp: Msg = { id: `temp-${Date.now()}`, role: 'user', content: message, created_at: new Date().toISOString() }
    setMessages((prev) => [...prev, temp])
    try {
      const r = await fetch('/api/niv-workspace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          conversationId,
          message,
          document: {
            id: docId,
            title: workspaceContent?.title || '',
            content_type: workspaceContent?.type || '',
            text: workspaceRef.current?.getText() ?? '',
          },
        }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(r.status === 504 ? 'That took too long. Try again.' : j.error || 'Something went wrong.')
      setMessages((prev) => [...prev.filter((m) => m.id !== temp.id), ...j.messages])
      if (j.conversationId) setConversationId(j.conversationId)
      if (j.jobs?.length) setJobs((prev) => [...prev, ...j.jobs])
      if (j.docEdit?.text) applyEdit(j.docEdit.text, j.docEdit.summary)
    } catch (e) {
      setMessages((prev) => prev.filter((m) => m.id !== temp.id))
      setInput(message)
      setError(e instanceof Error ? e.message : 'Something went wrong.')
    }
    setSending(false)
  }

  const undo = () => {
    if (!lastEdit || !workspaceRef.current) return
    workspaceRef.current.setText(lastEdit.before)
    setLastEdit(null)
  }

  const draft = async (messageId: string) => {
    if (!organizationId) return
    setDrafting(messageId)
    try {
      const r = await fetch('/api/advisor/draft', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ organizationId, messageId }) })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(j.error || 'Could not create the draft.')
      if (j.content) onNewContent({ id: j.content.id, type: j.content.content_type, title: j.content.title, content: j.content.content, folder: j.content.folder, metadata: { ...(j.content.metadata || {}), sourceContentId: j.content.id } })
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create the draft.')
    }
    setDrafting(null)
  }

  const starters = workspaceContent
    ? ['Tighten this and cut anything generic', 'Check this against our policies and brand rules', 'Make the opening stronger']
    : ['Write a short LinkedIn post about our NIV beta', 'Draft talking points for a client renewal call']

  return (
    <div className="h-full flex flex-col rounded-xl border border-[var(--grey-800)] bg-[var(--grey-900,#141414)] overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--grey-800)] flex items-center justify-between">
        <span className="text-[0.65rem] uppercase tracking-[0.15em] text-[var(--burnt-orange)] flex items-center gap-1.5" style={{ fontFamily: 'var(--font-display)' }}>
          <Sparkles className="w-3 h-3" /> NIV
        </span>
        <span className="text-[11px] text-[var(--grey-500)] truncate max-w-[60%]" title={workspaceContent?.title}>
          {workspaceContent ? `Editing: ${workspaceContent.title || 'Untitled'}` : 'No document open'}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 text-sm text-[var(--grey-300)] leading-relaxed">
        {!messages.length && (
          <div className="space-y-3">
            <p className="text-[var(--grey-400)]">
              {workspaceContent ? "I can see what's in the editor. Ask me to review it or change it, and I'll edit it directly." : 'Ask me to write something and it will open here in the editor.'}
            </p>
            <div className="flex flex-col gap-2">
              {starters.map((s) => (
                <button key={s} onClick={() => send(s)} className="text-left px-3 py-2 rounded-lg border border-[var(--grey-700)] hover:border-[var(--burnt-orange)]">{s}</button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <div key={m.id} className={m.role === 'user' ? 'flex justify-end' : ''}>
            {m.role === 'user' ? (
              <div className="max-w-[85%] px-3 py-2 rounded-lg bg-[var(--grey-800)] text-white whitespace-pre-wrap">{m.content}</div>
            ) : (
              <div className="space-y-2">
                <Rich text={m.content} />
                {m.meta?.doc_edit_summary && <div className="text-[11px] text-[var(--burnt-orange)]">Edited the document: {m.meta.doc_edit_summary}</div>}
                <CopyButton text={m.content} />
                {m.meta?.doc_sources?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {m.meta.doc_sources.map((s: any) => (
                      <span key={s.document_id} className="text-[11px] px-2 py-0.5 rounded-full border border-[var(--grey-700)] text-[var(--grey-400)]">{s.title}{s.version ? ` v${s.version}` : ''}</span>
                    ))}
                  </div>
                )}
                {m.meta?.proposal && organizationId && (
                  m.meta.deck ? (
                    <DeckCard organizationId={organizationId} messageId={m.id} deck={m.meta.deck} onReady={load} />
                  ) : m.meta.drafted_content_id ? (
                    <span className="text-[11px] text-[var(--grey-500)] inline-flex items-center gap-1"><ExternalLink className="w-3 h-3" /> Opened in the editor</span>
                  ) : (
                    <button onClick={() => draft(m.id)} disabled={!!drafting} className="text-xs px-3 py-1.5 rounded-md bg-[var(--burnt-orange)] text-white inline-flex items-center gap-1.5 disabled:opacity-50">
                      {drafting === m.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
                      {drafting === m.id ? 'Drafting…' : 'Draft it'}
                    </button>
                  )
                )}
                {m.meta?.deck_ready && organizationId && <DeckCard organizationId={organizationId} messageId={m.id} deck={m.meta.deck_ready} />}
              </div>
            )}
          </div>
        ))}

        {sending && <div className="text-[var(--grey-500)] flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Working…</div>}
        {jobs.map((j) => (
          <div key={j.id} className="text-xs text-[var(--grey-500)] flex items-center gap-2"><Search className="w-3.5 h-3.5 animate-pulse" /> Looking into: {j.input?.question?.slice(0, 80) || '…'}</div>
        ))}
        {error && <div className="text-xs text-red-400">{error}</div>}
        <div ref={endRef} />
      </div>

      {lastEdit && (
        <div className="px-4 py-2 border-t border-[var(--grey-800)] flex items-center justify-between text-[11px] text-[var(--grey-400)]">
          <span className="truncate">NIV edited the document: {lastEdit.summary}</span>
          <button onClick={undo} className="inline-flex items-center gap-1 text-[var(--burnt-orange)] hover:underline flex-none ml-2"><Undo2 className="w-3.5 h-3.5" /> Undo</button>
        </div>
      )}

      <form onSubmit={(e) => { e.preventDefault(); send(input) }} className="p-3 border-t border-[var(--grey-800)] flex items-end gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input) } }}
          rows={2}
          maxLength={6000}
          placeholder={workspaceContent ? 'Ask NIV to review or edit this…' : 'Ask NIV to write something…'}
          className="flex-1 resize-none bg-[var(--grey-800)] border border-[var(--grey-700)] rounded-lg px-3 py-2 text-sm text-white placeholder:text-[var(--grey-500)] focus:outline-none focus:border-[var(--burnt-orange)]"
        />
        <button type="submit" disabled={sending || !input.trim()} aria-label="Send" className="p-2.5 rounded-lg bg-[var(--burnt-orange)] text-white disabled:opacity-40"><Send className="w-4 h-4" /></button>
      </form>
    </div>
  )
}
