import { useState, useCallback } from 'react'
import { callEdgeFunction } from '@/lib/supabase'
import { useAuth } from './useAuth'
import type { ArtPiece } from '@/types'

export function useArt() {
  const [pieces, setPieces] = useState<ArtPiece[]>([])
  const [generating, setGenerating] = useState(false)
  const [loading, setLoading] = useState(false)
  const { session } = useAuth()

  const loadHistory = useCallback(async (limit = 20) => {
    if (!session?.access_token) return
    setLoading(true)
    try {
      const data = await callEdgeFunction('grounded-art', { action: 'history', limit }, session.access_token)
      setPieces(data.pieces ?? [])
    } catch (e) {
      console.error('Art history error:', e)
    }
    setLoading(false)
  }, [session?.access_token])

  async function generate(): Promise<ArtPiece | null> {
    if (!session?.access_token) return null
    setGenerating(true)
    try {
      const data = await callEdgeFunction('grounded-art', { action: 'generate' }, session.access_token)
      const piece: ArtPiece = { id: data.id, title: data.title, image_url: data.image_url, created_at: data.created_at }
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
