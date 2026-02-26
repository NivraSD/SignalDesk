import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useGroundedStore } from '@/stores/groundedStore'
import { DEFAULT_ACTIVITY_BANK } from '@/lib/constants'
import type { Activity } from '@/types'

export function useActivities() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const { userId, activityBank, setActivityBank } = useGroundedStore()

  const loadActivities = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    const { data, error } = await supabase
      .from('grounded_activities')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })

    if (!error && data) {
      setActivities(data)
      // Build activity bank grouped by area
      const bank: Record<string, string[]> = { ...DEFAULT_ACTIVITY_BANK }
      data.forEach((a: Activity) => {
        if (!bank[a.area_id]) bank[a.area_id] = []
        if (!bank[a.area_id].includes(a.name)) {
          bank[a.area_id].push(a.name)
        }
      })
      setActivityBank(bank)
    } else if (Object.keys(activityBank).length === 0) {
      setActivityBank(DEFAULT_ACTIVITY_BANK)
    }
    setLoading(false)
  }, [userId, setActivityBank, activityBank])

  useEffect(() => {
    loadActivities()
  }, [loadActivities])

  const addActivity = async (areaId: string, name: string) => {
    if (!userId) return
    const { data, error } = await supabase
      .from('grounded_activities')
      .insert({ user_id: userId, area_id: areaId, name, is_default: false })
      .select()
      .single()

    if (!error && data) {
      setActivities((prev) => [...prev, data])
      setActivityBank({
        ...activityBank,
        [areaId]: [...(activityBank[areaId] || []), name],
      })
    }
  }

  const removeActivity = async (id: string) => {
    const activity = activities.find((a) => a.id === id)
    const { error } = await supabase.from('grounded_activities').delete().eq('id', id)
    if (!error && activity) {
      setActivities((prev) => prev.filter((a) => a.id !== id))
      setActivityBank({
        ...activityBank,
        [activity.area_id]: (activityBank[activity.area_id] || []).filter(
          (n) => n !== activity.name
        ),
      })
    }
  }

  return { activities, activityBank, loading, addActivity, removeActivity, loadActivities }
}
