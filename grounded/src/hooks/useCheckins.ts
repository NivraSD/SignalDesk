import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useGroundedStore } from '@/stores/groundedStore'
import { getToday } from '@/lib/utils'
import type { CheckIn } from '@/types'

export function useCheckins() {
  const [checkIns, setCheckIns] = useState<CheckIn[]>([])
  const [loading, setLoading] = useState(true)
  const { todayCheckIn, setTodayCheckIn, userId } = useGroundedStore()

  const loadCheckIns = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    const { data, error } = await supabase
      .from('grounded_checkins')
      .select('*')
      .eq('user_id', userId)
      .order('checkin_date', { ascending: false })
      .limit(60)

    if (!error && data) {
      setCheckIns(data)
      const today = data.find((c: CheckIn) => c.checkin_date === getToday())
      if (today) setTodayCheckIn(today)
    }
    setLoading(false)
  }, [userId, setTodayCheckIn])

  useEffect(() => {
    loadCheckIns()
  }, [loadCheckIns])

  const saveCheckIn = async (data: CheckIn) => {
    if (!userId) return
    const record = {
      user_id: userId,
      checkin_date: data.checkin_date || getToday(),
      areas: data.areas,
      journal: data.journal,
      tomorrow_schedule: data.tomorrow_schedule,
      offline_id: data.offline_id || crypto.randomUUID(),
    }

    const { data: saved, error } = await supabase
      .from('grounded_checkins')
      .upsert(record, { onConflict: 'user_id,checkin_date' })
      .select()
      .single()

    if (!error && saved) {
      setTodayCheckIn(saved)
      await loadCheckIns()
    }
    return { data: saved, error }
  }

  return { checkIns, todayCheckIn, loading, saveCheckIn, loadCheckIns }
}
