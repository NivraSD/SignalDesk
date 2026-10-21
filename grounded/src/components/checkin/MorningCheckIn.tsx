import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AREAS } from '@/lib/constants'
import { getYesterday } from '@/lib/utils'
import { useCheckins } from '@/hooks/useCheckins'
import { useMorningCheckin } from '@/hooks/useMorningCheckin'
import PlanEditor from './PlanEditor'
import type { TomorrowSchedule } from '@/types'

// Morning check-in: present-only. How you're arriving right now, which plan today follows,
// and one intention. Nothing here looks back at yesterday's performance.

const BODY = ['Heavy', 'Tired', 'Okay', 'Steady', 'Strong']
const MIND = ['Scattered', 'Anxious', 'Flat', 'Clear', 'Calm']
const STEPS = 3

const hasActivities = (s: TomorrowSchedule | null | undefined) =>
  !!s && Object.values(s.areas || {}).some((a) => a.activities?.length)

function Chips({ options, value, onSelect }: { options: string[]; value?: string | null; onSelect: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o}
          onClick={() => onSelect(o)}
          className={`px-3 py-1.5 rounded-full border text-sm ${
            value === o ? 'border-stone-700 bg-stone-700 text-white' : 'border-stone-200 text-stone-600'
          }`}
        >
          {o}
        </button>
      ))}
    </div>
  )
}

export default function MorningCheckIn() {
  const navigate = useNavigate()
  const { checkIns } = useCheckins()
  const { morning, loading, saveMorning } = useMorningCheckin()

  const lastNightPlan = checkIns.find((c) => c.checkin_date === getYesterday())?.tomorrow_schedule ?? null

  const [step, setStep] = useState(0)
  const [body, setBody] = useState<string | null>(null)
  const [mind, setMind] = useState<string | null>(null)
  const [word, setWord] = useState('')
  const [choice, setChoice] = useState<'keep' | 'new' | null>(null)
  const [plan, setPlan] = useState<TomorrowSchedule>({ areas: {} })
  const [intention, setIntention] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Editing an existing morning check-in: start from what was saved.
  useEffect(() => {
    if (!morning) return
    setBody(morning.body ?? null)
    setMind(morning.mind ?? null)
    setWord(morning.word ?? '')
    setChoice(morning.plan_choice)
    if (morning.today_schedule) setPlan(morning.today_schedule)
    setIntention(morning.intention ?? '')
  }, [morning])

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
      body,
      mind,
      word: word.trim() || null,
      plan_choice: canKeep ? choice ?? 'keep' : 'new',
      today_schedule: plan,
      intention: intention.trim() || null,
    })
    setSaving(false)
    if (error) setError(error.message)
    else navigate('/')
  }

  if (loading) return <div className="py-12 text-center text-stone-400 text-sm">…</div>

  return (
    <div className="space-y-5">
      <div className="flex gap-1">
        {Array.from({ length: STEPS }, (_, i) => (
          <div key={i} className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-stone-600' : 'bg-stone-200'}`} />
        ))}
      </div>

      {step === 0 && (
        <div className="space-y-5">
          <div className="text-center space-y-1">
            <h2 className="text-xl font-light text-stone-700">Good morning</h2>
            <p className="text-stone-400 text-sm">Take one slow breath. Just notice where you are right now.</p>
          </div>

          <div className="space-y-2">
            <p className="text-stone-600 text-sm">Your body, right now</p>
            <Chips options={BODY} value={body} onSelect={setBody} />
          </div>

          <div className="space-y-2">
            <p className="text-stone-600 text-sm">Your mind, right now</p>
            <Chips options={MIND} value={mind} onSelect={setMind} />
          </div>

          <div className="space-y-2">
            <p className="text-stone-600 text-sm">One word for how you&apos;re arriving</p>
            <input
              type="text"
              value={word}
              onChange={(e) => setWord(e.target.value)}
              placeholder="optional"
              className="w-full p-3 border border-stone-200 rounded-lg text-sm"
            />
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-5">
          <div className="text-center">
            <h2 className="text-xl font-light text-stone-700">Today&apos;s plan</h2>
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
        </div>
      )}

      {step === 2 && (
        <div className="space-y-5">
          <div className="text-center space-y-1">
            <h2 className="text-xl font-light text-stone-700">One intention</h2>
            <p className="text-stone-400 text-sm">Just for today, I will…</p>
          </div>
          <textarea
            value={intention}
            onChange={(e) => setIntention(e.target.value)}
            placeholder="be patient with myself"
            className="w-full h-24 p-3 border border-stone-200 rounded-xl resize-none text-sm"
          />
          {error && <p className="text-xs text-red-600">Couldn&apos;t save: {error}</p>}
        </div>
      )}

      <div className="flex justify-between">
        <button
          onClick={() => (step === 0 ? navigate('/') : setStep((s) => s - 1))}
          className="px-4 py-2 text-stone-500"
        >
          {step === 0 ? 'Cancel' : 'Back'}
        </button>
        {step < STEPS - 1 ? (
          <button
            onClick={() => {
              if (step === 1 && canKeep && !choice) setChoice('keep')
              setStep((s) => s + 1)
            }}
            className="px-6 py-2 bg-stone-700 text-white rounded-lg"
          >
            Next
          </button>
        ) : (
          <button onClick={finish} disabled={saving} className="px-6 py-2 bg-stone-700 text-white rounded-lg disabled:opacity-50">
            {saving ? 'Saving…' : 'Begin the day'}
          </button>
        )}
      </div>
    </div>
  )
}
