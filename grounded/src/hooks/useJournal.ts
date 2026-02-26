import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useGroundedStore } from '@/stores/groundedStore'
import type { JournalEntry } from '@/types'

export function useJournal() {
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [loading, setLoading] = useState(true)
  const { userId } = useGroundedStore()

  const loadEntries = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    const { data, error } = await supabase
      .from('grounded_journal_entries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100)

    if (!error && data) setEntries(data)
    setLoading(false)
  }, [userId])

  useEffect(() => {
    loadEntries()
  }, [loadEntries])

  const addEntry = async (entry: Omit<JournalEntry, 'id' | 'user_id' | 'created_at'>) => {
    if (!userId) return
    const { data, error } = await supabase
      .from('grounded_journal_entries')
      .insert({ ...entry, user_id: userId })
      .select()
      .single()

    if (!error && data) {
      setEntries((prev) => [data, ...prev])
    }
    return { data, error }
  }

  const updateEntry = async (id: string, updates: Partial<Pick<JournalEntry, 'content' | 'entry_date' | 'entry_time' | 'notes' | 'completion_notes' | 'added_to_calendar'>>) => {
    const { error } = await supabase
      .from('grounded_journal_entries')
      .update(updates)
      .eq('id', id)
    if (!error) {
      setEntries((prev) =>
        prev.map((e) => (e.id === id ? { ...e, ...updates } : e))
      )
    }
    return { error }
  }

  const deleteEntry = async (id: string) => {
    const { error } = await supabase.from('grounded_journal_entries').delete().eq('id', id)
    if (!error) setEntries((prev) => prev.filter((e) => e.id !== id))
  }

  const toggleComplete = async (id: string) => {
    const entry = entries.find((e) => e.id === id)
    if (!entry) return
    const { error } = await supabase
      .from('grounded_journal_entries')
      .update({ completed: !entry.completed })
      .eq('id', id)
    if (!error) {
      setEntries((prev) =>
        prev.map((e) => (e.id === id ? { ...e, completed: !e.completed } : e))
      )
    }
  }

  return { entries, loading, addEntry, updateEntry, deleteEntry, toggleComplete, loadEntries }
}
