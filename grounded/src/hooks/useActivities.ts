import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useGroundedStore } from '@/stores/groundedStore'
import { DEFAULT_ACTIVITY_BANK } from '@/lib/constants'
import type { Activity } from '@/types'

// Starter ideas are saved at most once per person per session, even if two screens load at once.
const seededFor = new Set<string>()

export function useActivities() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const { userId, activityBank, setActivityBank } = useGroundedStore()
  const savedAreas = useGroundedStore((st) => st.areas) // null until this person's setup loads

  const loadActivities = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    const { data, error } = await supabase
      .from('grounded_activities')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })

    if (!error && data) {
      let rows: Activity[] = data
      // First time: save the starter ideas as their own, for the areas they use, so every one
      // can be removed and adding their own never wipes the rest.
      if (rows.length === 0 && savedAreas && !seededFor.has(userId)) {
        seededFor.add(userId)
        const starter = savedAreas.flatMap((area) =>
          (DEFAULT_ACTIVITY_BANK[area.id] || []).map((name) => ({ user_id: userId, area_id: area.id, name, is_default: true }))
        )
        if (starter.length) {
          const { data: seeded } = await supabase.from('grounded_activities').insert(starter).select()
          rows = seeded ?? []
        }
      }
      setActivities(rows)
      const bank: Record<string, string[]> = {}
      rows.forEach((a: Activity) => {
        if (!bank[a.area_id]) bank[a.area_id] = []
        if (!bank[a.area_id].includes(a.name)) {
          bank[a.area_id].push(a.name)
        }
      })
      setActivityBank(bank)
    }
    setLoading(false)
  }, [userId, setActivityBank, savedAreas])

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
