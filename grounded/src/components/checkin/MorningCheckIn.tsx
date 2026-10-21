import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AREAS } from '@/lib/constants'
import { getYesterday } from '@/lib/utils'
import { useCheckins } from '@/hooks/useCheckins'
import { useMorningCheckin } from '@/hooks/useMorningCheckin'
import PlanEditor from './PlanEditor'
import type { MorningAreaData, TomorrowSchedule } from '@/types'

// Morning check-in: the same six areas as the evening, asked in the present tense
// (how each area feels right now, not what got done), then which plan today follows,
// then one intention.

const hasActivities = (s: TomorrowSchedule | null | undefined) =>
  !!s && Object.values(s.areas || {}).some((a) => a.activities?.length)

export default function MorningCheckIn() {
  const navigate = useNavigate()
  const { checkIns } = useCheckins()
  const { morning, loading, saveMorning } = useMorningCheckin()

  const lastNightPlan = checkIns.find((c) => c.checkin_date === getYesterday())?.tomorrow_schedule ?? null

  const [step, setStep] = useState(0)
  const [areas, setAreas] = useState<Record<string, MorningAreaData>>({})
  const [choice, setChoice] = useState<'keep' | 'new' | null>(null)
  const [plan, setPlan] = useState<TomorrowSchedule>({ areas: {} })
  const [intention, setIntention] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Editing an existing morning check-in: start from what was saved.
  useEffect(() => {
    if (!morning) return
    setAreas(morning.areas || {})
    setChoice(morning.plan_choice)
    if (morning.today_schedule) setPlan(morning.today_schedule)
    setIntention(morning.intention ?? '')
  }, [morning])

  const currentArea = AREAS[step]
  const isPlanStep = step === AREAS.length
  const isIntentionStep = step === AREAS.length + 1
  const areaData: MorningAreaData = currentArea ? areas[currentArea.id] || {} : {}

  const updateArea = (field: keyof MorningAreaData, value: unknown) => {
    if (!currentArea) return
    setAreas((prev) => ({ ...prev, [currentArea.id]: { ...prev[currentArea.id], [field]: value } }))
  }

  // No plan from last night means there's nothing to keep — go straight to making one.
  const canKeep = hasActivities(lastNightPlan)

  const startNewPlan = () => {
    setChoice('new')
    if (!hasActivities(plan) && lastNightPlan) {
      // Start from last night's plan so it's an edit, not a retype. Its intentions were for "tomorrow"; drop them.
      setPlan({ ...lastNightPlan, intentions: '' })
    }
  }

  const finish = async () => {
    setSaving(true)
    setError(null)
    const { error } = await saveMorning({
      areas,
      plan_choice: canKeep ? choice ?? 'keep' : 'new',
      today_schedule: plan,
      intention: intention.trim() || null,
    })
    setSaving(false)
    if (error) setError(error.message)
    else navigate('/')
  }

  const next = () => {
    if (isPlanStep && canKeep && !choice) setChoice('keep')
    setStep((s) => s + 1)
  }
  const back = () => (step === 0 ? navigate('/') : setStep((s) => s - 1))

  if (loading) return <div className="py-12 text-center text-stone-400 text-sm">…</div>

  const progress = (
    <div className="flex gap-1">
      {Array.from({ length: AREAS.length + 2 }, (_, idx) => (
        <div key={idx} className={`h-1 flex-1 rounded-full ${idx <= step ? 'bg-stone-600' : 'bg-stone-200'}`} />
      ))}
    </div>
  )

  const nav = (
    <div className="flex justify-between pt-2">
      <button onClick={back} className="px-4 py-2 text-stone-500">
        {step === 0 ? 'Cancel' : 'Back'}
      </button>
      {isIntentionStep ? (
        <button onClick={finish} disabled={saving} className="px-6 py-2 bg-stone-700 text-white rounded-lg disabled:opacity-50">
          {saving ? 'Saving…' : 'Begin the day'}
        </button>
      ) : (
        <button onClick={next} className="px-6 py-2 bg-stone-700 text-white rounded-lg">
          {step === AREAS.length - 1 ? 'Continue' : 'Next'}
        </button>
      )}
    </div>
  )

  // Today's plan: keep last night's, or make a new one
  if (isPlanStep) {
    return (
      <div className="space-y-5">
        {progress}
        <div className="text-center">
          <h2 className="text-xl font-light text-stone-700">Today&apos;s Plan</h2>
        </div>

        {canKeep && choice !== 'new' && (
          <div className="space-y-3">
            <p className="text-stone-600 text-sm">Last night you planned:</p>
            <div className="p-3 bg-stone-50 rounded-xl space-y-1.5">
              {AREAS.flatMap((area) =>
                (lastNightPlan?.areas?.[area.id]?.activities || []).map((a, i) => (
                  <div key={`${area.id}-${i}`} className="flex items-center gap-2 text-xs">
                    <span style={{ color: area.color }}>{area.icon}</span>
                    <span className="flex-1 text-stone-700">{a.name}</span>
                    <span className="text-stone-400">{a.duration || a.timeOfDay}</span>
                  </div>
                ))
              )}
              {lastNightPlan?.scheduledItems && (
                <p className="text-xs text-stone-500 pt-1">Scheduled: {lastNightPlan.scheduledItems}</p>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setChoice('keep')}
                className={`flex-1 py-2.5 rounded-lg border-2 text-sm ${
                  choice === 'keep' ? 'border-stone-700 bg-stone-50' : 'border-stone-200'
                }`}
              >
                Keep this plan
              </button>
              <button onClick={startNewPlan} className="flex-1 py-2.5 rounded-lg border-2 border-stone-200 text-sm">
                Make a new plan
              </button>
            </div>
          </div>
        )}

        {(!canKeep || choice === 'new') && (
          <div className="space-y-4">
            {canKeep && (
              <button onClick={() => setChoice('keep')} className="text-xs text-stone-500">
                &larr; Keep last night&apos;s plan instead
              </button>
            )}
            <PlanEditor when="today" schedule={plan} onChange={setPlan} />
          </div>
        )}

        {nav}
      </div>
    )
  }

  // One intention
  if (isIntentionStep) {
    return (
      <div className="space-y-5">
        {progress}
        <div className="text-center space-y-1">
          <h2 className="text-xl font-light text-stone-700">One Intention</h2>
          <p className="text-stone-400 text-sm">Just for today, I will…</p>
        </div>
        <textarea
          value={intention}
          onChange={(e) => setIntention(e.target.value)}
          placeholder="be patient with myself"
          className="w-full h-24 p-3 border border-stone-200 rounded-xl resize-none text-sm"
        />
        {error && <p className="text-xs text-red-600">Couldn&apos;t save: {error}</p>}
        {nav}
      </div>
    )
  }

  // Area step — same layout as the evening, present tense
  return (
    <div className="space-y-5">
      {progress}

      {step === 0 && (
        <p className="text-center text-stone-400 text-sm">Good morning. Take one slow breath before you start.</p>
      )}

      <div className="text-center">
        <div className="text-3xl mb-2" style={{ color: currentArea.color }}>
          {currentArea.icon}
        </div>
        <h2 className="text-xl font-light text-stone-700">{currentArea.name}</h2>
        <p className="text-stone-500 text-sm mt-1">{currentArea.description}</p>
        {currentArea.isGrounding && <p className="text-amber-700 text-xs mt-2 italic">Your grounding layer</p>}
      </div>

      <div className="space-y-2">
        <p className="text-stone-600 text-sm">How does this area feel right now?</p>
        <div className="flex justify-between">
          {[1, 2, 3, 4, 5].map((score) => (
            <button
              key={score}
              onClick={() => updateArea('score', score)}
              className={`w-11 h-11 rounded-full border-2 ${
                areaData.score === score ? 'border-stone-700 bg-stone-700 text-white' : 'border-stone-200 text-stone-400'
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

      <div className="space-y-2">
        <p className="text-stone-600 text-sm">
          What&apos;s present for you here? <span className="text-stone-400">(optional)</span>
        </p>
        <input
          type="text"
          value={areaData.note || ''}
          onChange={(e) => updateArea('note', e.target.value)}
          placeholder="Whatever's here this morning..."
          className="w-full p-3 border border-stone-200 rounded-lg text-sm"
        />
      </div>

      {nav}
    </div>
  )
}
