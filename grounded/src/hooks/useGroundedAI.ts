import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { CheckIn } from '@/types'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL

export function useGroundedAI() {
  const [loading, setLoading] = useState(false)

  const callAI = async (action: string, payload: Record<string, unknown>) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return { error: 'Not authenticated' }

    const response = await fetch(`${SUPABASE_URL}/functions/v1/grounded-chat`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action, ...payload }),
    })

    return await response.json()
  }

  const getReflection = async (checkIn: CheckIn): Promise<string | null> => {
    setLoading(true)
    try {
      const result = await callAI('reflection', { checkIn })
      return result.reflection || null
    } catch (err) {
      console.error('AI reflection error:', err)
      return null
    } finally {
      setLoading(false)
    }
  }

  const getSuggestions = async (
    checkIn: CheckIn,
    activityBank: Record<string, string[]>
  ): Promise<Record<string, { activity: string; timeOfDay: string; reason: string }> | null> => {
    setLoading(true)
    try {
      const result = await callAI('suggest-plan', { checkIn, activityBank })
      return result.suggestions || null
    } catch (err) {
      console.error('AI suggestions error:', err)
      return null
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async () => {
    try {
      await callAI('update-profile', {})
    } catch (err) {
      console.error('Profile update error:', err)
    }
  }

  return { loading, getReflection, getSuggestions, updateProfile, callAI }
}
