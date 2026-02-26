import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useGroundedStore } from '@/stores/groundedStore'
import type { JournalEntry } from '@/types'

export function useJournal() {
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [loading, setLoading] = useState(false)
  const userId = useGroundedStore((s) => s.userId)

  const loadEntries = useCallback(async (limit = 50) => {
    if (!userId) return
    setLoading(true)
    const { data } = await supabase
      .from('grounded_journal_entries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)
    setEntries((data ?? []) as JournalEntry[])
    setLoading(false)
  }, [userId])

  async function createEntry(entry: Pick<JournalEntry, 'entry_type' | 'content'> & { entry_date?: string; entry_time?: string }) {
    if (!userId) return null
    const { data, error } = await supabase
      .from('grounded_journal_entries')
      .insert({ ...entry, user_id: userId, entry_date: entry.entry_date ?? new Date().toISOString().slice(0, 10) })
      .select()
      .single()
    if (error) throw error
    setEntries((prev) => [data as JournalEntry, ...prev])
    return data as JournalEntry
  }

  async function toggleComplete(id: string, completed: boolean) {
    const { error } = await supabase
      .from('grounded_journal_entries')
      .update({ completed })
      .eq('id', id)
    if (error) throw error
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, completed } : e)))
  }

  async function deleteEntry(id: string) {
    const { error } = await supabase
      .from('grounded_journal_entries')
      .delete()
      .eq('id', id)
    if (error) throw error
    setEntries((prev) => prev.filter((e) => e.id !== id))
  }

  return { entries, loading, loadEntries, createEntry, toggleComplete, deleteEntry }
}
