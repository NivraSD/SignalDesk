import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [historyLoaded, setHistoryLoaded] = useState(false)

  const callChat = async (action: string, payload: Record<string, unknown> = {}) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return { error: 'Not authenticated' }

    const response = await fetch(`${SUPABASE_URL}/functions/v1/grounded-chat`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action, ...payload }),
    })

    return await response.json()
  }

  const loadHistory = useCallback(async () => {
    if (historyLoaded) return
    const result = await callChat('get-history')
    if (result.messages) {
      setMessages(result.messages)
    }
    setHistoryLoaded(true)
  }, [historyLoaded])

  const sendMessage = async (text: string) => {
    if (!text.trim()) return

    // Optimistically add user message
    const tempUserMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, tempUserMsg])
    setLoading(true)

    try {
      const result = await callChat('chat', { message: text })

      if (result.message) {
        const assistantMsg: ChatMessage = {
          id: `resp-${Date.now()}`,
          role: 'assistant',
          content: result.message,
          created_at: new Date().toISOString(),
        }
        setMessages((prev) => [...prev, assistantMsg])

        // Show journal entry creation notification
        if (result.journal_entries_created?.length) {
          const count = result.journal_entries_created.length
          const notifMsg: ChatMessage = {
            id: `notif-${Date.now()}`,
            role: 'assistant',
            content: `\u2705 Saved ${count} journal ${count === 1 ? 'entry' : 'entries'} to your thoughts`,
            created_at: new Date().toISOString(),
          }
          setMessages((prev) => [...prev, notifMsg])
        }
      }
    } catch (err) {
      console.error('Chat error:', err)
      // Add error message
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: 'Something went wrong. Please try again.',
          created_at: new Date().toISOString(),
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const clearHistory = async () => {
    // Just clear local state; messages remain in DB for context
    setMessages([])
    setHistoryLoaded(false)
  }

  return { messages, loading, historyLoaded, loadHistory, sendMessage, clearHistory }
}
