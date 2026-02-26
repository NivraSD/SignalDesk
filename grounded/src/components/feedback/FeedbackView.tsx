import { useLocation, useNavigate } from 'react-router-dom'
import { Home, MessageCircle } from 'lucide-react'
import { LIFE_AREAS } from '@/lib/constants'
import type { CheckIn } from '@/types'

export default function FeedbackView() {
  const navigate = useNavigate()
  const location = useLocation()
  const { reflection, checkIn } = (location.state ?? {}) as { reflection?: string; checkIn?: CheckIn }

  if (!checkIn) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-20 text-center">
        <p className="text-stone-400 text-sm">No check-in data. Complete a check-in first.</p>
        <button onClick={() => navigate('/')} className="mt-4 text-stone-600 underline text-sm">Go Home</button>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-8 pb-6 space-y-6">
      <h1 className="text-2xl font-light text-stone-800">Your Reflection</h1>

      {/* Score summary */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {LIFE_AREAS.map((area) => {
          const score = checkIn.areas[area.id]?.score ?? 0
          return (
            <div key={area.id} className={`${area.bgColor} rounded-lg px-3 py-2 text-center shrink-0`}>
              <div className={`text-lg font-semibold ${area.color}`}>{score}</div>
              <div className="text-[10px] text-stone-500">{area.name}</div>
            </div>
          )
        })}
      </div>

      {/* AI Reflection */}
      {reflection ? (
        <div className="bg-white rounded-2xl p-5 border border-stone-200">
          <div className="prose prose-sm prose-stone max-w-none">
            {reflection.split('\n').map((p, i) => (
              <p key={i} className="text-stone-700 text-sm leading-relaxed mb-3 last:mb-0">{p}</p>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-5 border border-stone-200 text-center text-stone-400 text-sm">
          Reflection couldn't be generated. Try chatting with your AI companion instead.
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={() => navigate('/')}
          className="flex-1 py-3 rounded-xl bg-stone-800 text-white font-medium flex items-center justify-center gap-2"
        >
          <Home size={16} /> Home
        </button>
        <button
          onClick={() => navigate('/chat')}
          className="flex-1 py-3 rounded-xl bg-white border border-stone-200 text-stone-700 font-medium flex items-center justify-center gap-2"
        >
          <MessageCircle size={16} /> Chat
        </button>
      </div>
    </div>
  )
}
