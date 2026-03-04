import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getYesterday } from '@/lib/utils'
import { useCheckins } from '@/hooks/useCheckins'
import { useVisionBoard } from '@/hooks/useVisionBoard'
import DailyQuote from './DailyQuote'
import PyramidSection from './PyramidSection'
import TodaySchedule from './TodaySchedule'


export default function HomePage() {
  const navigate = useNavigate()
  const { checkIns, todayCheckIn } = useCheckins()
  const { items: visionItems, addImage, removeImage } = useVisionBoard()
  const [isEditingVision, setIsEditingVision] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const yesterdayCheckIn = checkIns.find((c) => c.checkin_date === getYesterday())
  const todaySchedule = yesterdayCheckIn?.tomorrow_schedule ?? null
  const tomorrowSchedule = todayCheckIn?.tomorrow_schedule ?? null

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) await addImage(file)
    e.target.value = ''
  }

  return (
    <div className="space-y-4">
      <DailyQuote />

      {/* Vision Board */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs text-stone-400 uppercase tracking-wide">Vision Board</span>
          <button
            onClick={() => setIsEditingVision(!isEditingVision)}
            className="text-xs text-stone-500"
          >
            {isEditingVision ? 'Done' : 'Edit'}
          </button>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {visionItems.map((item) => (
            <div key={item.id} className="relative aspect-square">
              <img
                src={item.image_url}
                alt=""
                className="w-full h-full object-cover rounded-lg shadow-sm"
              />
              {isEditingVision && (
                <button
                  onClick={() => item.id && removeImage(item.id)}
                  className="absolute top-1 right-1 w-5 h-5 bg-black/60 text-white rounded-full flex items-center justify-center text-xs"
                >
                  x
                </button>
              )}
            </div>
          ))}
          {(isEditingVision || visionItems.length === 0) && visionItems.length < 16 && (
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
      </div>

      <div className="bg-white rounded-2xl p-3 shadow-sm">
        <PyramidSection />
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <TodaySchedule
          todaySchedule={todaySchedule}
          tomorrowSchedule={tomorrowSchedule}
        />
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm">
        {todayCheckIn ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-stone-700">Checked in today</p>
              <span className="text-green-600">{'\u2713'}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => navigate('/feedback')}
                className="flex-1 py-2.5 bg-stone-700 text-white rounded-lg text-sm"
              >
                Reflection
              </button>
              <button
                onClick={() => navigate('/checkin')}
                className="py-2.5 px-4 border border-stone-200 rounded-lg text-sm"
              >
                Edit
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-stone-600">Ready for today&apos;s check-in?</p>
            <button
              onClick={() => navigate('/checkin')}
              className="w-full py-2.5 bg-stone-700 text-white rounded-lg text-sm"
            >
              Begin Check-In
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
