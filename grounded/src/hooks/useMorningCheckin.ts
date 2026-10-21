import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useGroundedStore } from '@/stores/groundedStore'
import { getToday } from '@/lib/utils'
import type { MorningCheckIn } from '@/types'

export function useMorningCheckin() {
  const [morning, setMorning] = useState<MorningCheckIn | null>(null)
  const [loading, setLoading] = useState(true)
  const { userId } = useGroundedStore()

  const loadMorning = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    const { data, error } = await supabase
      .from('grounded_morning_checkins')
      .select('*')
      .eq('user_id', userId)
      .eq('checkin_date', getToday())
      .maybeSingle()

    if (!error) setMorning(data)
    setLoading(false)
  }, [userId])

  useEffect(() => {
    loadMorning()
  }, [loadMorning])

  const saveMorning = async (entry: Omit<MorningCheckIn, 'user_id' | 'checkin_date' | 'created_at' | 'updated_at'>) => {
    if (!userId) return { error: new Error('Not signed in') }
    const { data, error } = await supabase
      .from('grounded_morning_checkins')
      .upsert({
        ...entry,
        user_id: userId,
        checkin_date: getToday(),
        today_schedule: entry.plan_choice === 'new' ? entry.today_schedule : null,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (!error && data) setMorning(data)
    return { data, error }
  }

  return { morning, loading, saveMorning, loadMorning }
}
