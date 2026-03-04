import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AREAS } from '@/lib/constants'
import { getWeekDates, getToday } from '@/lib/utils'
import { useCheckins } from '@/hooks/useCheckins'
import type { CheckIn } from '@/types'

function WeeklyReview({
  checkIns,
  weekDates,
}: {
  checkIns: CheckIn[]
  weekDates: string[]
}) {
  const weekCheckIns = checkIns.filter((c) => weekDates.includes(c.checkin_date))

  if (weekCheckIns.length === 0) {
    return <p className="text-stone-400 text-sm text-center py-4">No check-ins this week yet.</p>
  }

  const areaStats: Record<string, { avgScore: string; daysEngaged: number; totalDays: number }> = {}
  AREAS.forEach((area) => {
    const scores = weekCheckIns
      .map((c) => c.areas?.[area.id]?.score)
      .filter((s): s is number => typeof s === 'number')
    const engaged = weekCheckIns.filter((c) => c.areas?.[area.id]?.didSomething).length
    areaStats[area.id] = {
      avgScore: scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : '-',
      daysEngaged: engaged,
      totalDays: weekCheckIns.length,
    }
  })

  return (
    <div className="space-y-3">
      <h3 className="font-medium text-stone-700 text-center">Week Summary</h3>
      <p className="text-xs text-stone-500 text-center">{weekCheckIns.length} of 7 days checked in</p>

      <div className="grid grid-cols-2 gap-2">
        {AREAS.map((area) => {
          const stats = areaStats[area.id]
          return (
            <div key={area.id} className="p-3 bg-stone-50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <span style={{ color: area.color }}>{area.icon}</span>
                <span className="text-xs font-medium text-stone-700">{area.name}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-stone-500">Avg: {stats.avgScore}/5</span>
                <span className="text-stone-500">
                  {stats.daysEngaged}/{stats.totalDays} days
                </span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="p-3 bg-amber-50 rounded-lg">
        <p className="text-xs text-amber-800">
          <span className="font-medium">Joy/Connection</span> is a weekly focus. Did you make time
          for friends, fun, or meeting new people this week?
        </p>
      </div>
    </div>
  )
}

export default function HistoryPage() {
  const navigate = useNavigate()
  const { checkIns } = useCheckins()
  const [weekOffset, setWeekOffset] = useState(0)
  const weekDates = getWeekDates(weekOffset)
  const weekStart = new Date(weekDates[0]).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
  const weekEnd = new Date(weekDates[6]).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })

  return (
    <div className="space-y-4">
      <button onClick={() => navigate('/')} className="text-stone-500 text-sm">
        &larr; Back
      </button>
      <h2 className="text-xl font-light text-stone-700 text-center">History</h2>

      <div className="flex items-center justify-between bg-white rounded-xl p-3 shadow-sm">
        <button onClick={() => setWeekOffset((w) => w - 1)} className="px-3 py-1 text-stone-600">
          &larr;
        </button>
        <span className="text-sm font-medium text-stone-700">
          {weekStart} - {weekEnd}
        </span>
        <button
          onClick={() => setWeekOffset((w) => Math.min(0, w + 1))}
          className={`px-3 py-1 ${weekOffset >= 0 ? 'text-stone-300' : 'text-stone-600'}`}
          disabled={weekOffset >= 0}
        >
          &rarr;
        </button>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm">
        <WeeklyReview checkIns={checkIns} weekDates={weekDates} />
      </div>

      <div className="space-y-2">
        {weekDates.map((date) => {
          const checkIn = checkIns.find((c) => c.checkin_date === date)
          const isToday = date === getToday()

          return (
            <div
              key={date}
              className={`p-3 rounded-xl ${checkIn ? 'bg-white shadow-sm' : 'bg-stone-50'}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`text-sm font-medium ${isToday ? 'text-amber-700' : 'text-stone-700'}`}
                >
                  {new Date(date).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                  {isToday && ' (Today)'}
                </span>
                {checkIn && <span className="text-green-600 text-xs">{'\u2713'}</span>}
              </div>

              {checkIn ? (
                <div>
                  <div className="flex gap-1.5 flex-wrap mb-2">
                    {AREAS.map((area) => {
                      const score = checkIn.areas?.[area.id]?.score
                      const didIt = checkIn.areas?.[area.id]?.didSomething
                      return (
                        <div
                          key={area.id}
                          className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs"
                          style={{
                            backgroundColor: score ? `${area.color}20` : '#f5f5f4',
                            color: score ? area.color : '#a8a29e',
                          }}
                        >
                          <span>{area.icon}</span>
                          <span>{score || '-'}</span>
                          {didIt && <span>{'\u2713'}</span>}
                        </div>
                      )
                    })}
                  </div>
                  {checkIn.journal && (
                    <p className="text-stone-500 text-xs italic border-l-2 border-stone-200 pl-2">
                      {checkIn.journal.slice(0, 60)}
                      {checkIn.journal.length > 60 ? '...' : ''}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-stone-400 text-xs">No check-in</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
