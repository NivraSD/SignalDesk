import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AREAS } from '@/lib/constants'
import { useCheckins } from '@/hooks/useCheckins'
import { useGroundedAI } from '@/hooks/useGroundedAI'

export default function FeedbackView() {
  const navigate = useNavigate()
  const { todayCheckIn } = useCheckins()
  const { loading, getReflection } = useGroundedAI()
  const [reflection, setReflection] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (todayCheckIn && !loaded) {
      setLoaded(true)
      getReflection(todayCheckIn).then(setReflection)
    }
  }, [todayCheckIn, loaded]) // eslint-disable-line

  if (!todayCheckIn) {
    return (
      <div className="text-center py-12">
        <p className="text-stone-500">Complete today&apos;s check-in first.</p>
        <button onClick={() => navigate('/')} className="mt-4 text-stone-600 underline text-sm">
          Go back
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <button onClick={() => navigate('/')} className="text-stone-500 text-sm">
        &larr; Back
      </button>
      <h2 className="text-xl font-light text-stone-700 text-center">Today&apos;s Reflection</h2>

      {/* Area summary cards */}
      <div className="grid grid-cols-3 gap-2">
        {AREAS.map((area) => {
          const areaData = todayCheckIn.areas?.[area.id]
          if (!areaData?.score) return null
          return (
            <div key={area.id} className="bg-white rounded-xl p-3 shadow-sm text-center">
              <span style={{ color: area.color }} className="text-lg block">
                {area.icon}
              </span>
              <span className="text-xs text-stone-500 block mt-0.5">{area.name}</span>
              <span className="text-sm font-medium text-stone-700">{areaData.score}/5</span>
            </div>
          )
        })}
      </div>

      {/* AI Reflection */}
      <div className="bg-white rounded-2xl p-5 shadow-sm">
        {loading ? (
          <div className="text-center py-6">
            <p className="text-stone-400 text-sm animate-pulse">Writing your reflection...</p>
          </div>
        ) : reflection ? (
          <div className="space-y-3">
            <p className="text-xs text-stone-400 uppercase tracking-wide">Your reflection</p>
            <div className="text-sm text-stone-700 leading-relaxed whitespace-pre-wrap">
              {reflection}
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-stone-500 text-sm">Reflection unavailable right now.</p>
            <button
              onClick={() => {
                setLoaded(false)
              }}
              className="mt-2 text-xs text-stone-600 underline"
            >
              Try again
            </button>
          </div>
        )}
      </div>

      {/* Journal excerpt */}
      {todayCheckIn.journal && (
        <div className="p-4 bg-stone-50 rounded-xl">
          <p className="text-xs text-stone-400 mb-1">You wrote:</p>
          <p className="text-sm text-stone-600">{todayCheckIn.journal}</p>
        </div>
      )}
    </div>
  )
}
