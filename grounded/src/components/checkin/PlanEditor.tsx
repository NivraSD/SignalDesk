import { AREAS, TIME_OF_DAY } from '@/lib/constants'
import { useGroundedStore } from '@/stores/groundedStore'
import type { TomorrowSchedule } from '@/types'

// The per-area activity planner, shared by the evening check-in (plans tomorrow)
// and the morning check-in (re-plans today).
interface PlanEditorProps {
  when: 'today' | 'tomorrow'
  schedule: TomorrowSchedule
  onChange: (schedule: TomorrowSchedule) => void
  suggestions?: Record<string, { activity: string; timeOfDay: string; reason: string }> | null
}

export default function PlanEditor({ when, schedule, onChange, suggestions }: PlanEditorProps) {
  const { activityBank } = useGroundedStore()

  const updateArea = (areaId: string, field: string, value: unknown) => {
    onChange({
      ...schedule,
      areas: {
        ...schedule.areas,
        [areaId]: { ...(schedule.areas?.[areaId] || { activities: [] }), [field]: value },
      },
    })
  }

  const addActivity = (areaId: string, activity: string) => {
    const current = schedule.areas?.[areaId]?.activities || []
    updateArea(areaId, 'activities', [...current, { name: activity, timeOfDay: 'Morning', duration: '' }])
  }

  const removeActivity = (areaId: string, idx: number) => {
    const current = schedule.areas?.[areaId]?.activities || []
    updateArea(areaId, 'activities', current.filter((_, i) => i !== idx))
  }

  const updateActivity = (areaId: string, idx: number, field: string, value: string) => {
    const current = schedule.areas?.[areaId]?.activities || []
    updateArea(areaId, 'activities', current.map((a, i) => (i === idx ? { ...a, [field]: value } : a)))
  }

  return (
    <>
      <div className="space-y-2">
        <p className="text-stone-600 text-sm">Anything scheduled {when}?</p>
        <div className="flex gap-3">
          <button
            onClick={() => onChange({ ...schedule, hasScheduled: true })}
            className={`flex-1 py-2 rounded-lg border-2 text-sm ${
              schedule.hasScheduled === true
                ? 'border-stone-700 bg-stone-50'
                : 'border-stone-200'
            }`}
          >
            Yes
          </button>
          <button
            onClick={() => onChange({ ...schedule, hasScheduled: false, scheduledItems: '' })}
            className={`flex-1 py-2 rounded-lg border-2 text-sm ${
              schedule.hasScheduled === false
                ? 'border-stone-700 bg-stone-50'
                : 'border-stone-200'
            }`}
          >
            No
          </button>
        </div>
        {schedule.hasScheduled && (
          <input
            type="text"
            value={schedule.scheduledItems || ''}
            onChange={(e) => onChange({ ...schedule, scheduledItems: e.target.value })}
            placeholder="What's scheduled?"
            className="w-full p-3 border border-stone-200 rounded-lg text-sm"
          />
        )}
      </div>

      <div className="space-y-3 max-h-72 overflow-y-auto">
        {AREAS.map((area) => {
          const areaSchedule = schedule.areas?.[area.id] || { activities: [] }
          const suggestion = suggestions?.[area.id]
          return (
            <div key={area.id} className="p-3 bg-stone-50 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span style={{ color: area.color }}>{area.icon}</span>
                  <span className="text-xs font-medium text-stone-700">{area.name}</span>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => updateArea(area.id, 'intensity', 'light')}
                    className={`px-2 py-1 text-xs rounded ${
                      areaSchedule.intensity === 'light' ? 'bg-stone-300' : 'bg-stone-200'
                    }`}
                  >
                    Light
                  </button>
                  <button
                    onClick={() => updateArea(area.id, 'intensity', 'heavy')}
                    className={`px-2 py-1 text-xs rounded ${
                      areaSchedule.intensity === 'heavy'
                        ? 'bg-stone-700 text-white'
                        : 'bg-stone-200'
                    }`}
                  >
                    Heavy
                  </button>
                </div>
              </div>

              {/* AI reason hint */}
              {suggestion?.reason && (
                <p className="text-xs text-stone-400 italic">{suggestion.reason}</p>
              )}

              {(areaSchedule.activities || []).map((activity, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 bg-white rounded-lg text-xs">
                  <span className="flex-1 text-stone-700">{activity.name}</span>
                  <select
                    value={activity.timeOfDay}
                    onChange={(e) =>
                      updateActivity(area.id, idx, 'timeOfDay', e.target.value)
                    }
                    className="p-1 border rounded text-xs"
                  >
                    {TIME_OF_DAY.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={activity.duration || ''}
                    onChange={(e) =>
                      updateActivity(area.id, idx, 'duration', e.target.value)
                    }
                    placeholder="Time"
                    className="w-14 p-1 border rounded text-xs"
                  />
                  <button
                    onClick={() => removeActivity(area.id, idx)}
                    className="text-stone-400"
                  >
                    x
                  </button>
                </div>
              ))}

              <select
                value=""
                onChange={(e) => {
                  if (e.target.value) addActivity(area.id, e.target.value)
                }}
                className="w-full p-2 border border-stone-200 rounded-lg text-xs text-stone-500"
              >
                <option value="">+ Add activity...</option>
                {(activityBank[area.id] || []).map((a, idx) => (
                  <option key={idx} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
          )
        })}
      </div>

      <textarea
        value={schedule.intentions || ''}
        onChange={(e) => onChange({ ...schedule, intentions: e.target.value })}
        placeholder={`Any intentions for ${when}?`}
        className="w-full h-16 p-3 border border-stone-200 rounded-xl resize-none text-sm"
      />
    </>
  )
}
