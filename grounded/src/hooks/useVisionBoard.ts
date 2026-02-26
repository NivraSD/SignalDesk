import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useGroundedStore } from '@/stores/groundedStore'
import type { VisionBoardItem } from '@/types'

export function useVisionBoard() {
  const [items, setItems] = useState<VisionBoardItem[]>([])
  const [loading, setLoading] = useState(true)
  const { userId } = useGroundedStore()

  const loadItems = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    const { data, error } = await supabase
      .from('grounded_vision_board')
      .select('*')
      .eq('user_id', userId)
      .order('position_order', { ascending: true })

    if (!error && data) setItems(data)
    setLoading(false)
  }, [userId])

  useEffect(() => {
    loadItems()
  }, [loadItems])

  const addImage = async (file: File) => {
    if (!userId) return
    const fileName = `${userId}/${Date.now()}-${file.name}`
    const { error: uploadError } = await supabase.storage
      .from('grounded-images')
      .upload(fileName, file)

    if (uploadError) return { error: uploadError }

    const { data: urlData } = supabase.storage.from('grounded-images').getPublicUrl(fileName)
    const imageUrl = urlData.publicUrl

    const { data, error } = await supabase
      .from('grounded_vision_board')
      .insert({
        user_id: userId,
        image_url: imageUrl,
        position_order: items.length,
      })
      .select()
      .single()

    if (!error && data) setItems((prev) => [...prev, data])
    return { data, error }
  }

  const removeImage = async (id: string) => {
    const item = items.find((i) => i.id === id)
    if (item) {
      // Extract path from URL for storage deletion
      const url = new URL(item.image_url)
      const storagePath = url.pathname.split('/object/public/grounded-images/')[1]
      if (storagePath) {
        await supabase.storage.from('grounded-images').remove([storagePath])
      }
    }
    const { error } = await supabase.from('grounded_vision_board').delete().eq('id', id)
    if (!error) setItems((prev) => prev.filter((i) => i.id !== id))
  }

  return { items, loading, addImage, removeImage, loadItems }
}
