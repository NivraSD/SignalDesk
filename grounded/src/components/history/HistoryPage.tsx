import { useEffect, useState } from 'react'
import { useCheckins } from '@/hooks/useCheckins'
import { LIFE_AREAS, AREA_MAP } from '@/lib/constants'
import { formatDate, averageScores, scoreColor } from '@/lib/utils'
import type { CheckIn } from '@/types'

export default function HistoryPage() {
  const { loadHistory } = useCheckins()
  const [history, setHistory] = useState<CheckIn[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<CheckIn | null>(null)

  useEffect(() => {
    loadHistory(30).then((data) => { setHistory(data); setLoading(false) })
  }, [loadHistory])

  // Weekly averages
  const weeklyAvg = history.length > 0
    ? Math.round((history.slice(0, 7).reduce((sum, c) => sum + averageScores(c.areas), 0) / Math.min(history.length, 7)) * 10) / 10
    : 0

  if (selected) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-8 pb-6">
        <button onClick={() => setSelected(null)} className="text-sm text-stone-400 mb-4">&larr; Back</button>
        <h2 className="text-xl font-light text-stone-800 mb-4">{formatDate(selected.checkin_date)}</h2>
        <div className="space-y-3">
          {LIFE_AREAS.map((area) => {
            const d = selected.areas[area.id]
            if (!d) return null
            return (
              <div key={area.id} className="bg-white rounded-xl p-4 border border-stone-200">
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm font-medium ${area.color}`}>{area.name}</span>
                  <span className={`text-lg font-semibold ${scoreColor(d.score)}`}>{d.score}/5</span>
                </div>
                {d.activities.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {d.activities.map((a) => (
                      <span key={a} className={`text-[10px] px-2 py-0.5 rounded-full ${area.bgColor} ${area.color}`}>{a}</span>
                    ))}
                  </div>
                )}
                {d.notes && <p className="text-xs text-stone-500 mt-2">{d.notes}</p>}
              </div>
            )
          })}
          {selected.journal && (
            <div className="bg-white rounded-xl p-4 border border-stone-200">
              <span className="text-xs text-stone-400 mb-1 block">Journal</span>
              <p className="text-sm text-stone-700">{selected.journal}</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-8 pb-6">
      <h1 className="text-2xl font-light text-stone-800 mb-2">History</h1>

      {/* Weekly summary */}
      {history.length > 0 && (
        <div className="bg-white rounded-2xl p-4 border border-stone-200 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-sm text-stone-500">7-day average</span>
            <span className={`text-2xl font-semibold ${scoreColor(weeklyAvg)}`}>{weeklyAvg}/5</span>
          </div>
          <div className="flex gap-1 mt-3">
            {history.slice(0, 7).reverse().map((c) => {
              const avg = averageScores(c.areas)
              const height = Math.max(avg / 5 * 100, 10)
              return (
                <div key={c.id} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full bg-stone-100 rounded-full h-16 flex items-end">
                    <div
                      className={`w-full rounded-full ${avg >= 4 ? 'bg-green-400' : avg >= 3 ? 'bg-amber-400' : 'bg-red-400'}`}
                      style={{ height: `${height}%` }}
                    />
                  </div>
                  <span className="text-[9px] text-stone-400">
                    {new Date(c.checkin_date).toLocaleDateString([], { weekday: 'narrow' })}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Check-in list */}
      {loading ? (
        <div className="text-center text-stone-400 text-sm py-10">Loading...</div>
      ) : history.length === 0 ? (
        <div className="text-center text-stone-400 text-sm py-10">No check-ins yet.</div>
      ) : (
        <div className="space-y-2">
          {history.map((c) => {
            const avg = averageScores(c.areas)
            return (
              <button
                key={c.id}
                onClick={() => setSelected(c)}
                className="w-full bg-white rounded-xl p-4 border border-stone-200 text-left flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-medium text-stone-700">{formatDate(c.checkin_date)}</p>
                  <div className="flex gap-1 mt-1">
                    {LIFE_AREAS.map((area) => (
                      <span
                        key={area.id}
                        className={`w-5 h-5 rounded text-[10px] flex items-center justify-center font-medium ${area.bgColor} ${area.color}`}
                      >
                        {c.areas[area.id]?.score ?? '-'}
                      </span>
                    ))}
                  </div>
                </div>
                <span className={`text-lg font-semibold ${scoreColor(avg)}`}>{avg}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
