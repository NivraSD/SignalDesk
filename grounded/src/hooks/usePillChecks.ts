import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useGroundedStore } from '@/stores/groundedStore'
import type { PillChecks, PillSlot } from '@/types'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL

export function usePillChecks(day: string) {
  const [checks, setChecks] = useState<PillChecks>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { userId } = useGroundedStore()

  const loadChecks = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    const { data, error } = await supabase
      .from('grounded_pill_checks')
      .select('slot, taken_at')
      .eq('user_id', userId)
      .eq('day', day)

    if (error) setError(error.message)
    else {
      setError(null)
      const next: PillChecks = {}
      for (const row of data ?? []) next[row.slot as PillSlot] = row.taken_at
      setChecks(next)
    }
    setLoading(false)
  }, [userId, day])

  useEffect(() => {
    loadChecks()
  }, [loadChecks])

  // Optimistic: the tap updates immediately, and rolls back if the write fails.
  const toggleSlot = async (slot: PillSlot) => {
    if (!userId) return
    const prev = checks
    const taken = !checks[slot]
    const takenAt = new Date().toISOString()
    setChecks((c) => {
      const next = { ...c }
      if (taken) next[slot] = takenAt
      else delete next[slot]
      return next
    })

    const { error } = taken
      ? await supabase.from('grounded_pill_checks').upsert({ user_id: userId, day, slot, taken_at: takenAt })
      : await supabase.from('grounded_pill_checks').delete().eq('user_id', userId).eq('day', day).eq('slot', slot)

    if (error) {
      setChecks(prev)
      setError(error.message)
    } else setError(null)
  }

  const emailSummary = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Not authenticated')

    const response = await fetch(`${SUPABASE_URL}/functions/v1/grounded-pill-summary`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ day }),
    })
    const result = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(result.error || `HTTP ${response.status}`)
    return result as { sentTo: string }
  }

  return { checks, loading, error, toggleSlot, emailSummary, loadChecks }
}
