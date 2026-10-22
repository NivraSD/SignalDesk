import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { DEFAULT_AREAS } from '@/lib/constants'
import { useGroundedStore } from '@/stores/groundedStore'
import type { AreaSetting } from '@/hooks/useAreas'

// First run, about a minute: what to call you, and which areas of life Grounded tracks.
// Everything else (your story, people, what helps) is optional and can come later.

export default function WelcomePage() {
  const navigate = useNavigate()
  const { userId, setSetup } = useGroundedStore()
  const [params] = useSearchParams()
  const [step, setStep] = useState(params.has('areas') ? 1 : 0)
  const [name, setName] = useState('')
  const [areas, setAreas] = useState<AreaSetting[]>(DEFAULT_AREAS.map((a) => ({ ...a, enabled: true })))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [editing, setEditing] = useState(false)

  // Editing later: start from what's saved, not the defaults.
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

  const finish = async () => {
    if (!userId) return
    setSaving(true)
    setError(null)
    const cleaned = areas.map((a) => ({ ...a, name: a.name.trim() || DEFAULT_AREAS.find((d) => d.id === a.id)!.name }))
    const { error } = await supabase.from('grounded_user_settings').upsert(
      {
        user_id: userId,
        display_name: name.trim() || null,
        areas: cleaned,
        ...(editing ? {} : { onboarded_at: new Date().toISOString() }),
      },
      { onConflict: 'user_id' }
    )
    setSaving(false)
    if (error) {
      setError(error.message)
      return
    }
    setSetup({ areas: cleaned.filter((a) => a.enabled), onboarded: true, displayName: name.trim() || null })
    // New people go on to make the activity list their own; editing later just returns home.
    navigate(editing ? '/' : '/activities?first', { replace: true })
  }

  return (
    <div className="min-h-[100dvh] bg-stone-100 pt-safe-header">
      <div className="max-w-lg mx-auto p-6 space-y-6">
        {step === 0 && (
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
            <button onClick={() => setStep(1)} className="w-full py-2.5 bg-stone-700 text-white rounded-lg text-sm">
              Next
            </button>
          </div>
        )}

        {step === 1 && (
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

            <div className="flex justify-between">
              <button
                onClick={() => (editing && params.has('areas') ? navigate('/settings') : setStep(0))}
                className="px-4 py-2 text-stone-500 text-sm"
              >
                Back
              </button>
              <button
                onClick={finish}
                disabled={saving}
                className="px-6 py-2 bg-stone-700 text-white rounded-lg text-sm disabled:opacity-50"
              >
                {saving ? 'Saving…' : editing ? 'Save' : 'Begin'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
