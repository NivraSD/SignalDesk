import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, Plus, Calendar, Settings } from 'lucide-react'
import { useCheckins } from '@/hooks/useCheckins'
import { useCalendar } from '@/hooks/useCalendar'
import { getGreeting, getDailyQuote, averageScores } from '@/lib/utils'
import { LIFE_AREAS, AREA_MAP } from '@/lib/constants'

export default function HomePage() {
  const navigate = useNavigate()
  const { todayCheckIn, loadToday } = useCheckins()
  const { events, loadEvents } = useCalendar()

  useEffect(() => { loadToday() }, [loadToday])
  useEffect(() => { loadEvents() }, [loadEvents])

  const hasCheckedIn = !!todayCheckIn?.areas
  const avg = hasCheckedIn ? averageScores(todayCheckIn!.areas) : 0

  return (
    <div className="max-w-lg mx-auto px-4 pt-12 pb-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-light text-stone-800">{getGreeting()}</h1>
          <p className="text-stone-400 text-sm mt-1 italic">"{getDailyQuote()}"</p>
        </div>
        <button onClick={() => navigate('/settings')} className="p-2 text-stone-400">
          <Settings size={20} />
        </button>
      </div>

      {/* Check-in Card */}
      {hasCheckedIn ? (
        <div className="bg-white rounded-2xl p-5 border border-stone-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} className="text-green-500" />
              <span className="text-sm font-medium text-stone-700">Today's Check-in</span>
            </div>
            <span className="text-lg font-semibold text-stone-800">{avg}/5</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {LIFE_AREAS.map((area) => {
              const score = todayCheckIn!.areas[area.id]?.score ?? 0
              return (
                <div key={area.id} className={`${area.bgColor} rounded-lg p-2 text-center`}>
                  <div className={`text-lg font-semibold ${area.color}`}>{score}</div>
                  <div className="text-[10px] text-stone-500 truncate">{area.name}</div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <button
          onClick={() => navigate('/checkin')}
          className="w-full bg-stone-800 text-white rounded-2xl p-5 text-left"
        >
          <div className="text-lg font-medium">Start Today's Check-in</div>
          <div className="text-stone-300 text-sm mt-1">How are you doing across your 6 areas?</div>
        </button>
      )}

      {/* Today's Schedule */}
      {events.length > 0 && (
        <div className="bg-white rounded-2xl p-5 border border-stone-200">
          <div className="flex items-center gap-2 mb-3">
            <Calendar size={16} className="text-stone-400" />
            <span className="text-sm font-medium text-stone-700">Today's Schedule</span>
          </div>
          <div className="space-y-2">
            {events.slice(0, 4).map((ev) => (
              <div key={ev.id} className="flex items-center gap-3 text-sm">
                <span className="text-stone-400 w-16 shrink-0">
                  {ev.start.dateTime
                    ? new Date(ev.start.dateTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
                    : 'All day'}
                </span>
                <span className="text-stone-700 truncate">{ev.summary}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tomorrow's Plan */}
      {todayCheckIn?.tomorrow_schedule && (
        <div className="bg-white rounded-2xl p-5 border border-stone-200">
          <span className="text-sm font-medium text-stone-700">Tomorrow's Plan</span>
          <div className="mt-3 space-y-2">
            {Object.entries(todayCheckIn.tomorrow_schedule).map(([areaId, plan]) => (
              <div key={areaId} className="flex items-center gap-2 text-sm">
                <span className={`w-2 h-2 rounded-full ${AREA_MAP[areaId as keyof typeof AREA_MAP]?.bgColor?.replace('bg-', 'bg-') ?? 'bg-stone-200'}`} />
                <span className="text-stone-500 w-16 shrink-0 text-xs">{plan.timeOfDay}</span>
                <span className="text-stone-700">{plan.activity}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => navigate('/journal')} className="bg-white rounded-xl p-4 border border-stone-200 text-left">
          <Plus size={18} className="text-stone-400 mb-1" />
          <div className="text-sm font-medium text-stone-700">New Thought</div>
        </button>
        <button onClick={() => navigate('/chat')} className="bg-white rounded-xl p-4 border border-stone-200 text-left">
          <div className="text-sm font-medium text-stone-700">Talk to AI</div>
          <div className="text-xs text-stone-400 mt-0.5">Your companion</div>
        </button>
      </div>
    </div>
  )
}
