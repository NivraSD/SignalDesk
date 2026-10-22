import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useChat } from '@/hooks/useChat'

export default function ChatPage() {
  const navigate = useNavigate()
  const { messages, loading, hasMore, loadingEarlier, loadHistory, loadEarlier, sendMessage } = useChat()
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const lastIdRef = useRef<string | undefined>(undefined)
  const prependHeightRef = useRef<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState<number | null>(null)

  // Fit the chat to what's actually visible: above the keyboard while typing (iOS shrinks the
  // visual viewport), above the bottom nav otherwise. A fixed 100dvh formula left a gap when the
  // nav hid for typing and ignored the keyboard entirely.
  useEffect(() => {
    const vv = window.visualViewport
    const update = () =>
      requestAnimationFrame(() => {
        const el = containerRef.current
        if (!el) return
        const typing = document.activeElement === inputRef.current
        const nav = document.querySelector('.bottom-nav') as HTMLElement | null
        const navH = !typing && nav ? nav.getBoundingClientRect().height : 0
        const top = el.getBoundingClientRect().top + window.scrollY
        const visible = vv?.height ?? window.innerHeight
        setHeight(Math.max(200, Math.floor(visible - top - navH - 8)))
        window.scrollTo(0, 0) // iOS scrolls the page up on focus; the chat already fits, so undo it
      })
    update()
    vv?.addEventListener('resize', update)
    window.addEventListener('focusin', update)
    window.addEventListener('focusout', update)
    window.addEventListener('resize', update)
    return () => {
      vv?.removeEventListener('resize', update)
      window.removeEventListener('focusin', update)
      window.removeEventListener('focusout', update)
      window.removeEventListener('resize', update)
    }
  }, [])
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    loadHistory()
  }, []) // eslint-disable-line

  // New message at the bottom → scroll down. Older page added on top → keep the view where it was.
  useEffect(() => {
    const el = scrollRef.current
    if (el && prependHeightRef.current !== null) {
      el.scrollTop += el.scrollHeight - prependHeightRef.current
      prependHeightRef.current = null
    }
    const lastId = messages[messages.length - 1]?.id
    if (lastId !== lastIdRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: lastIdRef.current ? 'smooth' : 'auto' })
      lastIdRef.current = lastId
    }
  }, [messages])

  const handleLoadEarlier = async () => {
    prependHeightRef.current = scrollRef.current?.scrollHeight ?? null
    await loadEarlier()
  }

  const handleSend = async () => {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    // Reset textarea height
    if (inputRef.current) inputRef.current.style.height = 'auto'
    await sendMessage(text)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    // Grow with the message; past half the visible chat it scrolls inside so the conversation stays in view.
    el.style.height = Math.min(el.scrollHeight, Math.max(120, (height ?? 400) / 2)) + 'px'
  }

  return (
    <div ref={containerRef} className="flex flex-col" style={{ height: height ?? undefined }}>
      {/* Header */}
      <div className="flex items-center justify-between px-1 pb-3">
        <button onClick={() => navigate('/')} className="text-stone-500 text-sm">
          &larr; Back
        </button>
        <h2 className="text-lg font-light text-stone-700">Grounded</h2>
        <button
          onClick={() => navigate('/settings')}
          className="text-stone-400 text-xs"
        >
          Rules
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 pb-2">
        {hasMore && (
          <div className="text-center">
            <button
              onClick={handleLoadEarlier}
              disabled={loadingEarlier}
              className="text-xs px-3 py-1.5 bg-stone-100 rounded-full text-stone-500 disabled:opacity-50"
            >
              {loadingEarlier ? 'Loading…' : 'Show earlier messages'}
            </button>
          </div>
        )}
        {messages.length === 0 && !loading && (
          <div className="text-center py-12 space-y-3">
            <p className="text-stone-500 text-sm">What's on your mind?</p>
            <div className="flex flex-wrap justify-center gap-2">
              {[
                'How am I doing this week?',
                'Help me plan tomorrow',
                'I want to talk something through',
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => {
                    setInput(suggestion)
                    inputRef.current?.focus()
                  }}
                  className="text-xs px-3 py-1.5 bg-stone-100 rounded-full text-stone-600"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-stone-700 text-white rounded-br-md'
                  : 'bg-stone-100 text-stone-700 rounded-bl-md'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-stone-100 text-stone-400 px-3 py-2 rounded-2xl rounded-bl-md text-sm">
              Thinking...
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-stone-200 pt-2 pb-1">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Share a thought, ask a question..."
            rows={1}
            className="flex-1 resize-none p-2.5 border border-stone-200 rounded-xl text-sm bg-white focus:outline-none focus:border-stone-400"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="px-4 py-2.5 bg-stone-700 text-white rounded-xl text-sm disabled:opacity-40 flex-shrink-0"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
