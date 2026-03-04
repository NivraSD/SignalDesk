import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AREAS, TIME_OF_DAY } from '@/lib/constants'
import { getToday } from '@/lib/utils'
import { useCheckins } from '@/hooks/useCheckins'
import { useGroundedStore } from '@/stores/groundedStore'
import { useGroundedAI } from '@/hooks/useGroundedAI'
import type { CheckIn, AreaCheckInData, TomorrowSchedule } from '@/types'

export default function CheckInFlow() {
  const navigate = useNavigate()
  const { todayCheckIn, saveCheckIn } = useCheckins()
  const { activityBank } = useGroundedStore()
  const { loading: aiLoading, getSuggestions } = useGroundedAI()
  const [aiSuggestions, setAiSuggestions] = useState<Record<string, { activity: string; timeOfDay: string; reason: string }> | null>(null)
  const [suggestionsLoaded, setSuggestionsLoaded] = useState(false)

  const [step, setStep] = useState(0)
  const [data, setData] = useState<CheckIn>(
    todayCheckIn || {
      checkin_date: getToday(),
      areas: {},
      journal: '',
      tomorrow_schedule: { areas: {} },
    }
  )

  const currentArea = AREAS[step]
  const isJournalStep = step === AREAS.length
  const isTomorrowStep = step === AREAS.length + 1
  const areaData: AreaCheckInData = currentArea ? data.areas[currentArea.id] || {} : {}

  const updateArea = (field: string, value: unknown) => {
    if (!currentArea) return
    setData((prev) => ({
      ...prev,
      areas: {
        ...prev.areas,
        [currentArea.id]: { ...prev.areas[currentArea.id], [field]: value },
      },
    }))
  }

  const updateTomorrowArea = (areaId: string, field: string, value: unknown) => {
    setData((prev) => ({
      ...prev,
      tomorrow_schedule: {
        ...prev.tomorrow_schedule,
        areas: {
          ...prev.tomorrow_schedule.areas,
          [areaId]: { ...(prev.tomorrow_schedule.areas?.[areaId] || {}), [field]: value },
        },
      },
    }))
  }

  const addTomorrowActivity = (areaId: string, activity: string) => {
    const current = data.tomorrow_schedule.areas?.[areaId]?.activities || []
    updateTomorrowArea(areaId, 'activities', [
      ...current,
      { name: activity, timeOfDay: 'Morning', duration: '' },
    ])
  }

  const removeTomorrowActivity = (areaId: string, idx: number) => {
    const current = data.tomorrow_schedule.areas?.[areaId]?.activities || []
    updateTomorrowArea(
      areaId,
      'activities',
      current.filter((_, i) => i !== idx)
    )
  }

  const updateTomorrowActivity = (areaId: string, idx: number, field: string, value: string) => {
    const current = data.tomorrow_schedule.areas?.[areaId]?.activities || []
    const updated = current.map((a, i) => (i === idx ? { ...a, [field]: value } : a))
    updateTomorrowArea(areaId, 'activities', updated)
  }

  const nextStep = async () => {
    if (isTomorrowStep) {
      await saveCheckIn(data)
      navigate('/feedback')
    } else {
      setStep((s) => s + 1)
    }
  }

  const prevStep = () => setStep((s) => Math.max(0, s - 1))

  // Journal step
  if (isJournalStep) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-xl font-light text-stone-700">Free Write</h2>
          <p className="text-stone-500 text-sm mt-1">Whatever&apos;s on your mind.</p>
        </div>
        <textarea
          value={data.journal}
          onChange={(e) => setData((prev) => ({ ...prev, journal: e.target.value }))}
          placeholder="How are you really doing today?"
          className="w-full h-40 p-4 border border-stone-200 rounded-xl resize-none text-sm"
        />
        <div className="flex justify-between">
          <button onClick={prevStep} className="px-4 py-2 text-stone-500">
            Back
          </button>
          <button onClick={nextStep} className="px-6 py-2 bg-stone-700 text-white rounded-lg">
            Plan Tomorrow
          </button>
        </div>
      </div>
    )
  }

  // Load AI suggestions when entering tomorrow step
  const loadSuggestions = async () => {
    if (suggestionsLoaded) return
    setSuggestionsLoaded(true)
    const result = await getSuggestions(data, activityBank)
    if (result) {
      setAiSuggestions(result)
      // Pre-populate areas that don't already have activities
      setData((prev) => {
        const newAreas = { ...prev.tomorrow_schedule.areas }
        for (const [areaId, suggestion] of Object.entries(result)) {
          if (!newAreas[areaId]?.activities?.length) {
            newAreas[areaId] = {
              ...newAreas[areaId],
              activities: [{ name: suggestion.activity, timeOfDay: suggestion.timeOfDay, duration: '' }],
            }
          }
        }
        return { ...prev, tomorrow_schedule: { ...prev.tomorrow_schedule, areas: newAreas } }
      })
    }
  }

  // Tomorrow planning step
  if (isTomorrowStep) {
    // Trigger AI suggestions on mount
    if (!suggestionsLoaded) loadSuggestions()

    return (
      <div className="space-y-5">
        <div className="text-center">
          <h2 className="text-xl font-light text-stone-700">Plan Tomorrow</h2>
          {aiLoading && (
            <p className="text-stone-400 text-xs mt-1 animate-pulse">AI is suggesting activities...</p>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-stone-600 text-sm">Anything scheduled tomorrow?</p>
          <div className="flex gap-3">
            <button
              onClick={() =>
                setData((prev) => ({
                  ...prev,
                  tomorrow_schedule: { ...prev.tomorrow_schedule, hasScheduled: true },
                }))
              }
              className={`flex-1 py-2 rounded-lg border-2 text-sm ${
                (data.tomorrow_schedule as TomorrowSchedule & { hasScheduled?: boolean }).hasScheduled === true
                  ? 'border-stone-700 bg-stone-50'
                  : 'border-stone-200'
              }`}
            >
              Yes
            </button>
            <button
              onClick={() =>
                setData((prev) => ({
                  ...prev,
                  tomorrow_schedule: {
                    ...prev.tomorrow_schedule,
                    hasScheduled: false,
                    scheduledItems: '',
                  },
                }))
              }
              className={`flex-1 py-2 rounded-lg border-2 text-sm ${
                (data.tomorrow_schedule as TomorrowSchedule & { hasScheduled?: boolean }).hasScheduled === false
                  ? 'border-stone-700 bg-stone-50'
                  : 'border-stone-200'
              }`}
            >
              No
            </button>
          </div>
          {(data.tomorrow_schedule as TomorrowSchedule & { hasScheduled?: boolean }).hasScheduled && (
            <input
              type="text"
              value={data.tomorrow_schedule.scheduledItems || ''}
              onChange={(e) =>
                setData((prev) => ({
                  ...prev,
                  tomorrow_schedule: { ...prev.tomorrow_schedule, scheduledItems: e.target.value },
                }))
              }
              placeholder="What's scheduled?"
              className="w-full p-3 border border-stone-200 rounded-lg text-sm"
            />
          )}
        </div>

        <div className="space-y-3 max-h-72 overflow-y-auto">
          {AREAS.map((area) => {
            const areaSchedule = data.tomorrow_schedule.areas?.[area.id] || { activities: [] }
            const suggestion = aiSuggestions?.[area.id]
            return (
              <div key={area.id} className="p-3 bg-stone-50 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span style={{ color: area.color }}>{area.icon}</span>
                    <span className="text-xs font-medium text-stone-700">{area.name}</span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => updateTomorrowArea(area.id, 'intensity', 'light')}
                      className={`px-2 py-1 text-xs rounded ${
                        areaSchedule.intensity === 'light' ? 'bg-stone-300' : 'bg-stone-200'
                      }`}
                    >
                      Light
                    </button>
                    <button
                      onClick={() => updateTomorrowArea(area.id, 'intensity', 'heavy')}
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
                        updateTomorrowActivity(area.id, idx, 'timeOfDay', e.target.value)
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
                        updateTomorrowActivity(area.id, idx, 'duration', e.target.value)
                      }
                      placeholder="Time"
                      className="w-14 p-1 border rounded text-xs"
                    />
                    <button
                      onClick={() => removeTomorrowActivity(area.id, idx)}
                      className="text-stone-400"
                    >
                      x
                    </button>
                  </div>
                ))}

                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value) addTomorrowActivity(area.id, e.target.value)
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
          value={data.tomorrow_schedule.intentions || ''}
          onChange={(e) =>
            setData((prev) => ({
              ...prev,
              tomorrow_schedule: { ...prev.tomorrow_schedule, intentions: e.target.value },
            }))
          }
          placeholder="Any intentions for tomorrow?"
          className="w-full h-16 p-3 border border-stone-200 rounded-xl resize-none text-sm"
        />

        <div className="flex justify-between">
          <button onClick={prevStep} className="px-4 py-2 text-stone-500">
            Back
          </button>
          <button onClick={nextStep} className="px-6 py-2 bg-stone-700 text-white rounded-lg">
            Complete
          </button>
        </div>
      </div>
    )
  }

  // Area check-in step
  return (
    <div className="space-y-5">
      {/* Progress bar */}
      <div className="flex gap-1">
        {AREAS.map((_, idx) => (
          <div
            key={idx}
            className={`h-1 flex-1 rounded-full ${idx <= step ? 'bg-stone-600' : 'bg-stone-200'}`}
          />
        ))}
      </div>

      <div className="text-center">
        <div className="text-3xl mb-2" style={{ color: currentArea.color }}>
          {currentArea.icon}
        </div>
        <h2 className="text-xl font-light text-stone-700">{currentArea.name}</h2>
        <p className="text-stone-500 text-sm mt-1">{currentArea.description}</p>
        {currentArea.isGrounding && (
          <p className="text-amber-700 text-xs mt-2 italic">Your grounding layer</p>
        )}
      </div>

      {/* Score */}
      <div className="space-y-2">
        <p className="text-stone-600 text-sm">How do you feel about this area today?</p>
        <div className="flex justify-between">
          {[1, 2, 3, 4, 5].map((score) => (
            <button
              key={score}
              onClick={() => updateArea('score', score)}
              className={`w-11 h-11 rounded-full border-2 ${
                areaData.score === score
                  ? 'border-stone-700 bg-stone-700 text-white'
                  : 'border-stone-200 text-stone-400'
              }`}
            >
              {score}
            </button>
          ))}
        </div>
        <div className="flex justify-between text-xs text-stone-400 px-1">
          <span>struggling</span>
          <span>solid</span>
        </div>
      </div>

      {/* Did something */}
      <div className="space-y-2">
        <p className="text-stone-600 text-sm">
          Did you do anything for {currentArea.name.toLowerCase()} today?
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => updateArea('didSomething', true)}
            className={`flex-1 py-2.5 rounded-lg border-2 ${
              areaData.didSomething === true ? 'border-stone-700 bg-stone-50' : 'border-stone-200'
            }`}
          >
            Yes
          </button>
          <button
            onClick={() => updateArea('didSomething', false)}
            className={`flex-1 py-2.5 rounded-lg border-2 ${
              areaData.didSomething === false ? 'border-stone-700 bg-stone-50' : 'border-stone-200'
            }`}
          >
            No
          </button>
        </div>
      </div>

      {/* What did you do — multiple activities */}
      {areaData.didSomething === true && (
        <div className="space-y-2">
          <p className="text-stone-600 text-sm">What did you do?</p>
          {(areaData.activities || []).map((act, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="flex-1 p-2.5 bg-stone-50 rounded-lg text-sm text-stone-700">
                {act}
              </span>
              <button
                onClick={() => {
                  const updated = (areaData.activities || []).filter((_, i) => i !== idx)
                  updateArea('activities', updated)
                }}
                className="text-stone-400 text-sm px-2"
              >
                x
              </button>
            </div>
          ))}
          <select
            value=""
            onChange={(e) => {
              if (e.target.value) {
                const current = areaData.activities || []
                updateArea('activities', [...current, e.target.value])
              }
            }}
            className="w-full p-3 border border-stone-200 rounded-lg text-sm"
          >
            <option value="">+ Add from activity bank...</option>
            {(activityBank[currentArea.id] || [])
              .filter((a) => !(areaData.activities || []).includes(a))
              .map((a, idx) => (
                <option key={idx} value={a}>{a}</option>
              ))}
          </select>
          <div className="flex gap-2">
            <input
              type="text"
              id={`custom-activity-${currentArea.id}`}
              placeholder="Or type a custom activity..."
              className="flex-1 p-3 border border-stone-200 rounded-lg text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const input = e.target as HTMLInputElement
                  if (input.value.trim()) {
                    const current = areaData.activities || []
                    updateArea('activities', [...current, input.value.trim()])
                    input.value = ''
                  }
                }
              }}
            />
            <button
              onClick={() => {
                const input = document.getElementById(`custom-activity-${currentArea.id}`) as HTMLInputElement
                if (input?.value.trim()) {
                  const current = areaData.activities || []
                  updateArea('activities', [...current, input.value.trim()])
                  input.value = ''
                }
              }}
              className="px-3 py-2 bg-stone-200 rounded-lg text-sm text-stone-600"
            >
              Add
            </button>
          </div>
        </div>
      )}

      {/* Reason not done */}
      {areaData.didSomething === false && (
        <div className="space-y-2">
          <p className="text-stone-600 text-sm">
            Was there a reason? <span className="text-stone-400">(optional)</span>
          </p>
          <input
            type="text"
            value={areaData.reasonNotDone || ''}
            onChange={(e) => updateArea('reasonNotDone', e.target.value)}
            placeholder="No pressure..."
            className="w-full p-3 border border-stone-200 rounded-lg text-sm"
          />
        </div>
      )}

      {/* Notes */}
      <div className="space-y-2">
        <p className="text-stone-600 text-sm">
          Anything else to add? <span className="text-stone-400">(optional)</span>
        </p>
        <input
          type="text"
          value={areaData.notes || ''}
          onChange={(e) => updateArea('notes', e.target.value)}
          placeholder="Notes, thoughts..."
          className="w-full p-3 border border-stone-200 rounded-lg text-sm"
        />
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-2">
        <button
          onClick={prevStep}
          className={`px-4 py-2 text-stone-500 ${step === 0 ? 'invisible' : ''}`}
        >
          Back
        </button>
        <button onClick={nextStep} className="px-6 py-2 bg-stone-700 text-white rounded-lg">
          {step === AREAS.length - 1 ? 'Continue' : 'Next'}
        </button>
      </div>
    </div>
  )
}
