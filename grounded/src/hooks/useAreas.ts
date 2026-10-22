import { useCallback, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useGroundedStore } from '@/stores/groundedStore'
import { DEFAULT_AREAS } from '@/lib/constants'
import type { Area } from '@/types'

export interface AreaSetting extends Area {
  enabled: boolean
}

// This person's areas, in their order, only the ones they use. Falls back to the defaults until loaded.
export function useAreas(): Area[] {
  const areas = useGroundedStore((s) => s.areas)
  return areas ?? DEFAULT_AREAS
}

// Load the person's setup once per sign-in (mounted by the app shell and the welcome screen).
export function useUserSetup() {
  const { userId, onboarded, setSetup } = useGroundedStore()

  const load = useCallback(async () => {
    if (!userId) return
    const { data } = await supabase
      .from('grounded_user_settings')
      .select('areas, onboarded_at, display_name, calendar_id')
      .eq('user_id', userId)
      .maybeSingle()
    const all = (data?.areas as AreaSetting[] | null) ?? null
    setSetup({
      areas: all ? all.filter((a) => a.enabled !== false) : null,
      onboarded: !!data?.onboarded_at,
      displayName: data?.display_name ?? null,
      hasCalendar: !!data?.calendar_id,
    })
  }, [userId, setSetup])

  useEffect(() => {
    if (userId && onboarded === null) load()
  }, [userId, onboarded, load])

  return { onboarded, reload: load }
}
