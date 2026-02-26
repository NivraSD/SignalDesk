import { useState } from 'react'
import { callEdgeFunction } from '@/lib/supabase'
import { useAuth } from './useAuth'
import type { CheckIn, SuggestedActivity } from '@/types'
import type { AreaId } from '@/lib/constants'

export function useGroundedAI() {
  const [loading, setLoading] = useState(false)
  const { session } = useAuth()

  async function getReflection(checkIn: CheckIn): Promise<string | null> {
    if (!session?.access_token) return null
    setLoading(true)
    try {
      const data = await callEdgeFunction('grounded-chat', {
        action: 'reflection',
        checkIn: { checkin_date: checkIn.checkin_date, areas: checkIn.areas, journal: checkIn.journal },
      }, session.access_token)
      return data.reflection ?? null
    } catch (e) {
      console.error('Reflection error:', e)
      return null
    } finally {
      setLoading(false)
    }
  }

  async function getSuggestions(
    checkIn: CheckIn,
    activityBank: Record<AreaId, string[]>
  ): Promise<Record<AreaId, SuggestedActivity> | null> {
    if (!session?.access_token) return null
    setLoading(true)
    try {
      const data = await callEdgeFunction('grounded-chat', {
        action: 'suggest-plan',
        checkIn: { checkin_date: checkIn.checkin_date, areas: checkIn.areas, journal: checkIn.journal },
        activityBank,
      }, session.access_token)
      return data.suggestions ?? null
    } catch (e) {
      console.error('Suggest-plan error:', e)
      return null
    } finally {
      setLoading(false)
    }
  }

  async function updateProfile(): Promise<string | null> {
    if (!session?.access_token) return null
    try {
      const data = await callEdgeFunction('grounded-chat', { action: 'update-profile' }, session.access_token)
      return data.profile ?? null
    } catch (e) {
      console.error('Profile update error:', e)
      return null
    }
  }

  return { loading, getReflection, getSuggestions, updateProfile }
}
