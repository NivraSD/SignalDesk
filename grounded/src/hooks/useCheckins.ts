import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useGroundedStore } from '@/stores/groundedStore'
import { todayDate } from '@/lib/utils'
import type { CheckIn } from '@/types'

export function useCheckins() {
  const [loading, setLoading] = useState(false)
  const { userId, todayCheckIn, setTodayCheckIn } = useGroundedStore()

  const loadToday = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    const { data } = await supabase
      .from('grounded_checkins')
      .select('*')
      .eq('user_id', userId)
      .eq('checkin_date', todayDate())
      .maybeSingle()
    setTodayCheckIn(data as CheckIn | null)
    setLoading(false)
  }, [userId, setTodayCheckIn])

  async function saveCheckIn(checkin: Partial<CheckIn>) {
    if (!userId) return null
    const payload = { ...checkin, user_id: userId, checkin_date: todayDate() }

    if (todayCheckIn?.id) {
      const { data, error } = await supabase
        .from('grounded_checkins')
        .update(payload)
        .eq('id', todayCheckIn.id)
        .select()
        .single()
      if (error) throw error
      setTodayCheckIn(data as CheckIn)
      return data as CheckIn
    } else {
      const { data, error } = await supabase
        .from('grounded_checkins')
        .insert(payload)
        .select()
        .single()
      if (error) throw error
      setTodayCheckIn(data as CheckIn)
      return data as CheckIn
    }
  }

  async function loadHistory(limit = 30): Promise<CheckIn[]> {
    if (!userId) return []
    const { data } = await supabase
      .from('grounded_checkins')
      .select('*')
      .eq('user_id', userId)
      .order('checkin_date', { ascending: false })
      .limit(limit)
    return (data ?? []) as CheckIn[]
  }

  return { todayCheckIn, loading, loadToday, saveCheckIn, loadHistory }
}
