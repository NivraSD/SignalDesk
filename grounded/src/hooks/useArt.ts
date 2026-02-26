import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { ArtPiece } from '@/types'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL

export function useArt() {
  const [pieces, setPieces] = useState<ArtPiece[]>([])
  const [generating, setGenerating] = useState(false)
  const [loading, setLoading] = useState(false)

  const callArt = async (payload: Record<string, unknown>) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Not authenticated')

    const response = await fetch(`${SUPABASE_URL}/functions/v1/grounded-art`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`Art API error: ${response.status} ${text}`)
    }

    return await response.json()
  }

  const loadHistory = useCallback(async (limit = 20) => {
    setLoading(true)
    try {
      const data = await callArt({ action: 'history', limit })
      setPieces(data.pieces ?? [])
    } catch (e) {
      console.error('Art history error:', e)
    }
    setLoading(false)
  }, []) // eslint-disable-line

  const generate = async (): Promise<ArtPiece | null> => {
    setGenerating(true)
    try {
      const data = await callArt({ action: 'generate' })
      const piece: ArtPiece = {
        id: data.id,
        title: data.title,
        image_url: data.image_url,
        created_at: data.created_at,
      }
      setPieces((prev) => [piece, ...prev])
      return piece
    } catch (e) {
      console.error('Art generation error:', e)
      return null
    } finally {
      setGenerating(false)
    }
  }

  return { pieces, generating, loading, loadHistory, generate }
}
