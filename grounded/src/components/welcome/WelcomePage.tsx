import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { DEFAULT_AREAS } from '@/lib/constants'
import { useGroundedStore } from '@/stores/groundedStore'
import type { AreaSetting } from '@/hooks/useAreas'
import { StoryFields, STORY_SECTIONS, type Story, type StorySectionId } from '@/components/you/storySections'
import CalendarConnect from '@/components/settings/CalendarConnect'

// First-time setup. Name and areas, then optional steps (About you, pill tracker, calendar) that
// can each be skipped, then the activity list. Everything here can be changed later in Settings.
// "/welcome?areas" reuses the areas step alone for editing from Settings.

const STEPS = ['name', 'areas', 'story', 'pills', 'calendar'] as const

export default function WelcomePage() {
  const navigate = useNavigate()
  const { userId, setSetup, setShowPills } = useGroundedStore()
  const [params] = useSearchParams()
  const areasOnly = params.has('areas')
  const [step, setStep] = useState(areasOnly ? 1 : 0)
  const [name, setName] = useState('')
  const [areas, setAreas] = useState<AreaSetting[]>(DEFAULT_AREAS.map((a) => ({ ...a, enabled: true })))
  const [story, setStory] = useState<Story>({})
  const [pills, setPills] = useState<boolean | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)

  // Start from what's saved (editing later, or resuming a half-finished setup).
  useEffect(() => {
    if (!userId) return
    supabase
      .from('grounded_user_settings')
      .select('areas, display_name, onboarded_at')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.areas) setAreas(data.areas as AreaSetting[])
        if (data?.display_name) setName(data.display_name)
        setEditing(!!data?.onboarded_at)
      })
  }, [userId])

  const enabledCount = areas.filter((a) => a.enabled).length
  const update = (id: string, patch: Partial<AreaSetting>) =>
    setAreas((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)))
  const cleanedAreas = () =>
    areas.map((a) => ({ ...a, name: a.name.trim() || DEFAULT_AREAS.find((d) => d.id === a.id)?.name || a.name }))

  const run = async (work: () => Promise<{ error: { message: string } | null } | void>) => {
    setSaving(true)
    setError(null)
    const result = await work()
    setSaving(false)
    if (result && result.error) {
      setError(result.error.message)
      return false
    }
    return true
  }

  // Name + areas are saved when leaving the areas step (setup isn't marked finished until the end).
  const saveAreas = () =>
    run(async () => {
      if (!userId) return
      const cleaned = cleanedAreas()
      const res = await supabase
        .from('grounded_user_settings')
        .upsert({ user_id: userId, display_name: name.trim() || null, areas: cleaned }, { onConflict: 'user_id' })
      if (!res.error) setSetup({ areas: cleaned.filter((a) => a.enabled), onboarded: editing, displayName: name.trim() || null })
      return res
    })

  const saveStory = () =>
    run(async () => {
      if (!userId) return
      const rows = STORY_SECTIONS.filter((s) => (story[s.id] ?? '').trim()).map((s) => ({
        user_id: userId,
        section: s.id,
        content: (story[s.id] ?? '').trim(),
        updated_at: new Date().toISOString(),
      }))
      if (!rows.length) return
      return await supabase.from('grounded_user_story').upsert(rows)
    })

  const finish = () =>
    run(async () => {
      if (!userId) return
      const showPills = pills ?? true
      const res = await supabase
        .from('grounded_user_settings')
        .upsert({ user_id: userId, show_pills: showPills, onboarded_at: new Date().toISOString() }, { onConflict: 'user_id' })
      if (!res.error) {
        setShowPills(showPills)
        setSetup({ areas: cleanedAreas().filter((a) => a.enabled), onboarded: true, displayName: name.trim() || null })
        navigate('/activities?first', { replace: true })
      }
      return res
    })

  const next = async () => {
    const current = STEPS[step]
    if (current === 'areas') {
      if (!(await saveAreas())) return
      if (areasOnly) return navigate('/settings', { replace: true })
    }
    if (current === 'story' && !(await saveStory())) return
    if (current === 'calendar') return void finish()
    setStep((s) => s + 1)
  }

  const back = () => (areasOnly ? navigate('/settings') : setStep((s) => Math.max(0, s - 1)))

  const progress = !areasOnly && step > 0 && (
    <div className="flex gap-1" aria-hidden="true">
      {STEPS.map((_, i) => (
        <div key={i} className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-stone-600' : 'bg-stone-200'}`} />
      ))}
    </div>
  )

  const nav = (label: string, skippable = false) => (
    <div className="flex items-center justify-between gap-3">
      <button onClick={back} className="px-4 py-2 text-stone-500 text-sm">
        Back
      </button>
      <div className="flex items-center gap-3">
        {skippable && (
          <button onClick={() => (STEPS[step] === 'calendar' ? void finish() : setStep((s) => s + 1))} className="text-sm text-stone-500">
            Skip
          </button>
        )}
        <button onClick={next} disabled={saving} className="px-6 py-2 bg-stone-700 text-white rounded-lg text-sm disabled:opacity-50">
          {saving ? 'Saving…' : label}
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-[100dvh] bg-stone-100 pt-safe-header">
      <div className="max-w-lg mx-auto p-6 space-y-6">
        {progress}

        {STEPS[step] === 'name' && (
          <div className="space-y-6 pt-8">
            <div className="space-y-2">
              <h1 className="text-2xl font-light text-stone-700">Welcome to Grounded</h1>
              <p className="text-stone-500 text-sm">
                A quiet structure for your day. Nothing here can be failed, and everything can be skipped.
              </p>
            </div>
            <div className="space-y-2">
              <label htmlFor="welcome-name" className="text-stone-600 text-sm">
                What should Grounded call you? <span className="text-stone-400">(optional)</span>
              </label>
              <input
                id="welcome-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="given-name"
                className="w-full p-3 border border-stone-200 rounded-lg text-sm bg-white"
              />
            </div>
            <button onClick={next} className="w-full py-2.5 bg-stone-700 text-white rounded-lg text-sm">
              Next
            </button>
          </div>
        )}

        {STEPS[step] === 'areas' && (
          <div className="space-y-5">
            <div className="space-y-1">
              <h2 className="text-xl font-light text-stone-700">Your areas</h2>
              <p className="text-stone-500 text-sm">
                Grounded checks in with you about these parts of life. Rename any to fit you, and turn off what
                doesn&apos;t apply. You can change them later.
              </p>
            </div>
            <div className="space-y-2">
              {areas.map((area) => (
                <div
                  key={area.id}
                  className={`p-3 rounded-xl border bg-white flex items-start gap-3 ${
                    area.enabled ? 'border-stone-200' : 'border-stone-100 opacity-50'
                  }`}
                >
                  <span className="text-lg pt-1.5" style={{ color: area.color }} aria-hidden="true">
                    {area.icon}
                  </span>
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <input
                      id={`area-${area.id}`}
                      type="text"
                      value={area.name}
                      onChange={(e) => update(area.id, { name: e.target.value })}
                      disabled={!area.enabled}
                      aria-label={`Name for ${area.name}`}
                      className="w-full p-1.5 -ml-1.5 rounded text-sm font-medium text-stone-700 bg-transparent focus:bg-stone-50"
                    />
                    <p className="text-xs text-stone-400">{area.description}</p>
                  </div>
                  <button
                    onClick={() => update(area.id, { enabled: !area.enabled })}
                    disabled={area.enabled && enabledCount === 1}
                    aria-pressed={area.enabled}
                    className="flex-none text-xs px-2.5 py-1 rounded-full border border-stone-200 text-stone-600 disabled:opacity-40"
                  >
                    {area.enabled ? 'On' : 'Off'}
                  </button>
                </div>
              ))}
            </div>
            {error && <p className="text-xs text-red-600">Couldn&apos;t save: {error}</p>}
            {nav(areasOnly ? 'Save' : 'Next')}
          </div>
        )}

        {STEPS[step] === 'story' && (
          <div className="space-y-5">
            <div className="space-y-1">
              <h2 className="text-xl font-light text-stone-700">About you</h2>
              <p className="text-stone-500 text-sm">
                Only what you choose to share, in your own words. It helps Grounded&apos;s companion understand you.
                Skip any of it — you can add more anytime in Settings.
              </p>
            </div>
            <StoryFields story={story} onChange={(id: StorySectionId, value) => setStory((p) => ({ ...p, [id]: value }))} />
            {error && <p className="text-xs text-red-600">Couldn&apos;t save: {error}</p>}
            {nav('Next', true)}
          </div>
        )}

        {STEPS[step] === 'pills' && (
          <div className="space-y-5">
            <div className="space-y-1">
              <h2 className="text-xl font-light text-stone-700">Pill tracker</h2>
              <p className="text-stone-500 text-sm">
                Do you want to track daily pills or medication? Home gets four quick checks — morning, afternoon,
                evening, night.
              </p>
            </div>
            <div className="flex gap-3">
              {[true, false].map((v) => (
                <button
                  key={String(v)}
                  onClick={() => setPills(v)}
                  aria-pressed={pills === v}
                  className={`flex-1 py-2.5 rounded-lg border-2 text-sm bg-white ${pills === v ? 'border-stone-700' : 'border-stone-200'}`}
                >
                  {v ? 'Yes, show it' : 'No thanks'}
                </button>
              ))}
            </div>
            {nav('Next', true)}
          </div>
        )}

        {STEPS[step] === 'calendar' && (
          <div className="space-y-5">
            <div className="space-y-1">
              <h2 className="text-xl font-light text-stone-700">Google Calendar</h2>
              <p className="text-stone-500 text-sm">
                Connect your calendar so plans and events can go straight onto it. Optional — you can do this later in
                Settings.
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm">
              <CalendarConnect />
            </div>
            {error && <p className="text-xs text-red-600">Couldn&apos;t save: {error}</p>}
            {nav('Finish', true)}
          </div>
        )}
      </div>
    </div>
  )
}
