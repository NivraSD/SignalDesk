import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { LIFE_AREAS, type AreaId } from '@/lib/constants'
import { useCheckins } from '@/hooks/useCheckins'
import { useActivities } from '@/hooks/useActivities'
import { useGroundedAI } from '@/hooks/useGroundedAI'
import type { AreaScore, CheckIn } from '@/types'

const SCORES = [1, 2, 3, 4, 5]

export default function CheckInFlow() {
  const navigate = useNavigate()
  const { saveCheckIn } = useCheckins()
  const { getActivitiesByArea, getActivityNamesByArea } = useActivities()
  const { getReflection, getSuggestions } = useGroundedAI()

  const [step, setStep] = useState(0) // 0-5 = areas, 6 = journal, 7 = saving
  const [areas, setAreas] = useState<Record<AreaId, AreaScore>>(() => {
    const init = {} as Record<AreaId, AreaScore>
    LIFE_AREAS.forEach((a) => { init[a.id] = { score: 0, didSomething: undefined, activities: [], notes: '' } })
    return init
  })
  const [journal, setJournal] = useState('')
  const [saving, setSaving] = useState(false)

  const currentArea = step < 6 ? LIFE_AREAS[step] : null

  function updateArea(field: Partial<AreaScore>) {
    if (!currentArea) return
    setAreas((prev) => ({ ...prev, [currentArea.id]: { ...prev[currentArea.id], ...field } }))
  }

  function toggleActivity(name: string) {
    if (!currentArea) return
    const current = areas[currentArea.id].activities
    const next = current.includes(name) ? current.filter((a) => a !== name) : [...current, name]
    updateArea({ activities: next })
  }

  async function handleFinish() {
    setSaving(true)
    setStep(7)
    try {
      const saved = await saveCheckIn({ areas, journal: journal || undefined })
      if (saved) {
        // Fire reflection + suggestions in parallel, navigate to feedback
        const [reflection, suggestions] = await Promise.allSettled([
          getReflection(saved),
          getSuggestions(saved, getActivityNamesByArea()),
        ])

        const reflectionText = reflection.status === 'fulfilled' ? reflection.value : null
        const suggestionsData = suggestions.status === 'fulfilled' ? suggestions.value : null

        if (suggestionsData) {
          await saveCheckIn({ tomorrow_schedule: suggestionsData })
        }

        navigate('/feedback', { state: { reflection: reflectionText, checkIn: saved }, replace: true })
      }
    } catch (e) {
      console.error('Check-in save error:', e)
      setSaving(false)
    }
  }

  const canAdvance = currentArea ? areas[currentArea.id].score > 0 : true

  // Saving state
  if (step === 7) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-20 text-center">
        <div className="animate-pulse text-stone-400 text-sm">Saving your check-in and generating reflection...</div>
      </div>
    )
  }

  // Journal step
  if (step === 6) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-8 pb-6">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => setStep(5)} className="p-2 text-stone-400"><ArrowLeft size={20} /></button>
          <span className="text-xs text-stone-400">Step 7 of 7</span>
          <div className="w-10" />
        </div>

        <h2 className="text-xl font-light text-stone-800 mb-2">Anything on your mind?</h2>
        <p className="text-sm text-stone-400 mb-4">Free-form thoughts, reflections, or gratitude.</p>

        <textarea
          value={journal}
          onChange={(e) => setJournal(e.target.value)}
          rows={6}
          placeholder="Write freely..."
          className="w-full p-4 rounded-xl bg-white border border-stone-200 text-stone-800 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-300 resize-none"
        />

        <button
          onClick={handleFinish}
          disabled={saving}
          className="w-full mt-6 py-3 rounded-xl bg-stone-800 text-white font-medium flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Check size={18} /> Complete Check-in
        </button>
      </div>
    )
  }

  // Area scoring steps
  const area = currentArea!
  const areaData = areas[area.id]
  const availableActivities = getActivitiesByArea(area.id).map((a) => a.name)
  const activityList = availableActivities.length > 0 ? availableActivities : []

  return (
    <div className="max-w-lg mx-auto px-4 pt-8 pb-6">
      {/* Progress */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => step > 0 ? setStep(step - 1) : navigate(-1)} className="p-2 text-stone-400">
          <ArrowLeft size={20} />
        </button>
        <span className="text-xs text-stone-400">Step {step + 1} of 7</span>
        <div className="w-10" />
      </div>

      {/* Progress bar */}
      <div className="w-full h-1 bg-stone-200 rounded-full mb-8">
        <div className="h-full bg-stone-700 rounded-full transition-all" style={{ width: `${((step + 1) / 7) * 100}%` }} />
      </div>

      <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium mb-4 ${area.bgColor} ${area.color}`}>
        {area.name}
      </div>

      <h2 className="text-xl font-light text-stone-800 mb-6">
        How's your {area.name.toLowerCase()} today?
      </h2>

      {/* Score selector */}
      <div className="flex gap-3 mb-6">
        {SCORES.map((s) => (
          <button
            key={s}
            onClick={() => updateArea({ score: s })}
            className={`flex-1 py-3 rounded-xl text-lg font-semibold transition-all ${
              areaData.score === s
                ? 'bg-stone-800 text-white scale-105'
                : 'bg-white border border-stone-200 text-stone-500'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Did something? */}
      {areaData.score > 0 && (
        <div className="space-y-4">
          <div className="flex gap-3">
            <button
              onClick={() => updateArea({ didSomething: true })}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                areaData.didSomething === true ? 'bg-green-100 text-green-700 border-green-200' : 'bg-white text-stone-500'
              } border`}
            >
              Yes, I did something
            </button>
            <button
              onClick={() => updateArea({ didSomething: false })}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                areaData.didSomething === false ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-white text-stone-500'
              } border`}
            >
              Not today
            </button>
          </div>

          {/* Activities */}
          {areaData.didSomething && activityList.length > 0 && (
            <div>
              <p className="text-xs text-stone-400 mb-2">What did you do?</p>
              <div className="flex flex-wrap gap-2">
                {activityList.map((name) => (
                  <button
                    key={name}
                    onClick={() => toggleActivity(name)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      areaData.activities.includes(name)
                        ? `${area.bgColor} ${area.color} border-transparent`
                        : 'bg-white border-stone-200 text-stone-500'
                    } border`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <textarea
            value={areaData.notes ?? ''}
            onChange={(e) => updateArea({ notes: e.target.value })}
            rows={2}
            placeholder="Any notes? (optional)"
            className="w-full p-3 rounded-xl bg-white border border-stone-200 text-sm text-stone-700 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-300 resize-none"
          />
        </div>
      )}

      {/* Next */}
      <button
        onClick={() => setStep(step + 1)}
        disabled={!canAdvance}
        className="w-full mt-6 py-3 rounded-xl bg-stone-800 text-white font-medium flex items-center justify-center gap-2 disabled:opacity-30 transition-opacity"
      >
        Next <ArrowRight size={16} />
      </button>
    </div>
  )
}
