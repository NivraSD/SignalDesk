import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useGroundedStore } from '@/stores/groundedStore'
import type { Reminder } from '@/types'

export function useReminders() {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [loading, setLoading] = useState(true)
  const { userId } = useGroundedStore()

  const loadReminders = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    const { data, error } = await supabase
      .from('grounded_reminders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })

    if (!error && data) setReminders(data)
    setLoading(false)
  }, [userId])

  useEffect(() => {
    loadReminders()
  }, [loadReminders])

  const addReminder = async (reminder: Omit<Reminder, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!userId) return
    const { data, error } = await supabase
      .from('grounded_reminders')
      .insert({ ...reminder, user_id: userId })
      .select()
      .single()

    if (!error && data) setReminders((prev) => [...prev, data])
    return { data, error }
  }

  const updateReminder = async (id: string, updates: Partial<Reminder>) => {
    const { error } = await supabase
      .from('grounded_reminders')
      .update(updates)
      .eq('id', id)

    if (!error) {
      setReminders((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates } : r)))
    }
  }

  const deleteReminder = async (id: string) => {
    const { error } = await supabase.from('grounded_reminders').delete().eq('id', id)
    if (!error) setReminders((prev) => prev.filter((r) => r.id !== id))
  }

  return { reminders, loading, addReminder, updateReminder, deleteReminder, loadReminders }
}
