import { useState, useCallback } from 'react'
import { supabase, SUPABASE_URL } from '@/lib/supabase'
import { useGroundedStore } from '@/stores/groundedStore'
import type { VisionItem } from '@/types'

export function useVisionBoard() {
  const [items, setItems] = useState<VisionItem[]>([])
  const [loading, setLoading] = useState(false)
  const userId = useGroundedStore((s) => s.userId)

  const loadItems = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    const { data } = await supabase
      .from('grounded_vision_board')
      .select('*')
      .eq('user_id', userId)
      .order('position_order', { ascending: true })
    setItems((data ?? []) as VisionItem[])
    setLoading(false)
  }, [userId])

  async function uploadImage(file: File) {
    if (!userId) return null
    const path = `${userId}/${Date.now()}-${file.name}`
    const { error: uploadError } = await supabase.storage
      .from('grounded-images')
      .upload(path, file)
    if (uploadError) throw uploadError

    const imageUrl = `${SUPABASE_URL}/storage/v1/object/public/grounded-images/${path}`
    const nextOrder = items.length

    const { data, error } = await supabase
      .from('grounded_vision_board')
      .insert({ user_id: userId, image_url: imageUrl, position_order: nextOrder })
      .select()
      .single()
    if (error) throw error
    setItems((prev) => [...prev, data as VisionItem])
    return data as VisionItem
  }

  async function removeImage(id: string) {
    const { error } = await supabase.from('grounded_vision_board').delete().eq('id', id)
    if (error) throw error
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  return { items, loading, loadItems, uploadImage, removeImage }
}
