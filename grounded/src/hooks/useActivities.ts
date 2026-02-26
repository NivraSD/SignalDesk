import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useGroundedStore } from '@/stores/groundedStore'
import { DEFAULT_ACTIVITIES, type AreaId } from '@/lib/constants'
import type { Activity } from '@/types'

export function useActivities() {
  const [loading, setLoading] = useState(false)
  const { userId, activityBank, setActivityBank } = useGroundedStore()

  const loadActivities = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    const { data } = await supabase
      .from('grounded_activities')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })

    if (data && data.length > 0) {
      setActivityBank(data as Activity[])
    }
    setLoading(false)
  }, [userId, setActivityBank])

  async function seedDefaults() {
    if (!userId) return
    const rows = Object.entries(DEFAULT_ACTIVITIES).flatMap(([area, names]) =>
      names.map((name) => ({ user_id: userId, area_id: area, name, is_default: true }))
    )
    const { data } = await supabase.from('grounded_activities').insert(rows).select()
    if (data) setActivityBank(data as Activity[])
  }

  async function addActivity(areaId: AreaId, name: string) {
    if (!userId) return
    const { data, error } = await supabase
      .from('grounded_activities')
      .insert({ user_id: userId, area_id: areaId, name, is_default: false })
      .select()
      .single()
    if (error) throw error
    setActivityBank([...activityBank, data as Activity])
  }

  async function removeActivity(id: string) {
    const { error } = await supabase.from('grounded_activities').delete().eq('id', id)
    if (error) throw error
    setActivityBank(activityBank.filter((a) => a.id !== id))
  }

  function getActivitiesByArea(areaId: AreaId): Activity[] {
    return activityBank.filter((a) => a.area_id === areaId)
  }

  function getActivityNamesByArea(): Record<AreaId, string[]> {
    const result = {} as Record<AreaId, string[]>
    for (const area of Object.keys(DEFAULT_ACTIVITIES) as AreaId[]) {
      result[area] = activityBank.filter((a) => a.area_id === area).map((a) => a.name)
      if (result[area].length === 0) result[area] = DEFAULT_ACTIVITIES[area]
    }
    return result
  }

  return { activityBank, loading, loadActivities, seedDefaults, addActivity, removeActivity, getActivitiesByArea, getActivityNamesByArea }
}
