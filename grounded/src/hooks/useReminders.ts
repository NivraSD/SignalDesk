import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useGroundedStore } from '@/stores/groundedStore'
import type { Reminder } from '@/types'

export function useReminders() {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [loading, setLoading] = useState(false)
  const userId = useGroundedStore((s) => s.userId)

  const loadReminders = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    const { data } = await supabase
      .from('grounded_reminders')
      .select('*')
      .eq('user_id', userId)
      .order('time', { ascending: true })
    setReminders((data ?? []) as Reminder[])
    setLoading(false)
  }, [userId])

  async function createReminder(r: Pick<Reminder, 'title' | 'time' | 'frequency'> & { days?: number[] }) {
    if (!userId) return null
    const { data, error } = await supabase
      .from('grounded_reminders')
      .insert({ ...r, user_id: userId, enabled: true })
      .select()
      .single()
    if (error) throw error
    setReminders((prev) => [...prev, data as Reminder])
    return data as Reminder
  }

  async function toggleReminder(id: string, enabled: boolean) {
    const { error } = await supabase
      .from('grounded_reminders')
      .update({ enabled })
      .eq('id', id)
    if (error) throw error
    setReminders((prev) => prev.map((r) => (r.id === id ? { ...r, enabled } : r)))
  }

  async function deleteReminder(id: string) {
    const { error } = await supabase.from('grounded_reminders').delete().eq('id', id)
    if (error) throw error
    setReminders((prev) => prev.filter((r) => r.id !== id))
  }

  return { reminders, loading, loadReminders, createReminder, toggleReminder, deleteReminder }
}
