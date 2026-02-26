import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useVisionBoard } from '@/hooks/useVisionBoard'

export default function VisionBoard() {
  const navigate = useNavigate()
  const { items, addImage, removeImage } = useVisionBoard()
  const [isEditing, setIsEditing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) await addImage(file)
    e.target.value = ''
  }

  return (
    <div className="space-y-4">
      <button onClick={() => navigate('/')} className="text-stone-500 text-sm">
        &larr; Back
      </button>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-light text-stone-700">Vision Board</h2>
        {items.length > 0 && (
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="text-xs text-stone-500"
          >
            {isEditing ? 'Done' : 'Edit'}
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        {items.map((item) => (
          <div key={item.id} className="relative aspect-square group">
            <img
              src={item.image_url}
              alt=""
              className="w-full h-full object-cover rounded-lg shadow-sm"
            />
            {isEditing && (
              <button
                onClick={() => item.id && removeImage(item.id)}
                className="absolute top-1 right-1 w-5 h-5 bg-black/60 text-white rounded-full flex items-center justify-center text-xs"
              >
                x
              </button>
            )}
          </div>
        ))}
        {(isEditing || items.length === 0) && items.length < 16 && (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="aspect-square border-2 border-dashed border-stone-300 rounded-lg flex items-center justify-center text-stone-400 bg-stone-50"
          >
            <span className="text-xl">+</span>
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {items.length === 0 && !isEditing && (
        <button
          onClick={() => setIsEditing(true)}
          className="w-full py-6 border-2 border-dashed border-stone-300 rounded-xl text-stone-400"
        >
          <span className="text-xl block mb-1">+</span>
          <span className="text-sm">Add vision board images</span>
        </button>
      )}
    </div>
  )
}
