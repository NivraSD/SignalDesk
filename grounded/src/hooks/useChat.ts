import { useState, useCallback } from 'react'
import { callEdgeFunction } from '@/lib/supabase'
import { useAuth } from './useAuth'
import type { ChatMessage } from '@/types'

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const { session } = useAuth()

  const loadHistory = useCallback(async () => {
    if (!session?.access_token) return
    setLoading(true)
    try {
      const data = await callEdgeFunction('grounded-chat', { action: 'get-history' }, session.access_token)
      setMessages(data.messages ?? [])
    } catch (e) {
      console.error('Failed to load chat history:', e)
    }
    setLoading(false)
  }, [session?.access_token])

  async function sendMessage(message: string): Promise<string | null> {
    if (!session?.access_token || !message.trim()) return null
    setSending(true)

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: message,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMsg])

    try {
      const data = await callEdgeFunction('grounded-chat', { action: 'chat', message }, session.access_token)
      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.message,
        created_at: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, assistantMsg])
      return data.message
    } catch (e) {
      console.error('Chat error:', e)
      return null
    } finally {
      setSending(false)
    }
  }

  return { messages, loading, sending, loadHistory, sendMessage }
}
