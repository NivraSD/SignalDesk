import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { OrchestrationResult } from '@/types'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL

export function useOrchestration() {
  const [loading, setLoading] = useState(true)
  const [orchestration, setOrchestration] = useState<OrchestrationResult | null>(null)

  const callOrchestrate = async (action: string, payload: Record<string, unknown> = {}) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return { error: 'Not authenticated' }

    const response = await fetch(`${SUPABASE_URL}/functions/v1/grounded-orchestrate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action, ...payload }),
    })

    return await response.json()
  }

  const fetchLatest = useCallback(async (): Promise<OrchestrationResult | null> => {
    setLoading(true)
    try {
      const result = await callOrchestrate('latest')
      if (result.fallback) {
        setOrchestration(null)
        return null
      }
      setOrchestration(result)
      return result
    } catch (err) {
      console.error('Orchestration fetch error:', err)
      setOrchestration(null)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchHistory = useCallback(async (limit = 20) => {
    try {
      const result = await callOrchestrate('history', { limit })
      return result.orchestrations || []
    } catch (err) {
      console.error('Orchestration history error:', err)
      return []
    }
  }, [])

  return { loading, orchestration, fetchLatest, fetchHistory }
}
