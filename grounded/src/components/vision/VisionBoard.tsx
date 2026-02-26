import { useEffect, useRef } from 'react'
import { Plus, X } from 'lucide-react'
import { useVisionBoard } from '@/hooks/useVisionBoard'

export default function VisionBoard() {
  const { items, loading, loadItems, uploadImage, removeImage } = useVisionBoard()
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => { loadItems() }, [loadItems])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      await uploadImage(file)
    } catch (err) {
      console.error('Upload error:', err)
    }
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-8 pb-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-light text-stone-800">Vision Board</h1>
        <button onClick={() => fileRef.current?.click()} className="p-2 rounded-full bg-stone-800 text-white">
          <Plus size={18} />
        </button>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
      </div>

      {loading ? (
        <div className="text-center text-stone-400 text-sm py-10">Loading...</div>
      ) : items.length === 0 ? (
        <div className="text-center text-stone-400 text-sm py-10">
          Add images that inspire your vision for the future.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {items.map((item) => (
            <div key={item.id} className="relative aspect-square rounded-xl overflow-hidden group">
              <img src={item.image_url} alt="" className="w-full h-full object-cover" />
              <button
                onClick={() => removeImage(item.id)}
                className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
