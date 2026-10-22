import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useGroundedStore } from '@/stores/groundedStore'
import { StoryFields, type StorySectionId } from './storySections'

// "About you": what a person chooses to tell Grounded, in their own words, plus what Grounded has
// learned from their check-ins and chats — visible and correctable. Every section is optional.

type SectionId = StorySectionId

export default function AboutYouPage() {
  const navigate = useNavigate()
  const { userId } = useGroundedStore()
  const [story, setStory] = useState<Partial<Record<SectionId, string>>>({})
  const [profile, setProfile] = useState<string>('')
  const [hasProfile, setHasProfile] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [saved, setSaved] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const lastSaved = useRef<Partial<Record<SectionId, string>>>({})
  const lastProfile = useRef('')

  useEffect(() => {
    if (!userId) return
    ;(async () => {
      const [storyRes, profileRes] = await Promise.all([
        supabase.from('grounded_user_story').select('section, content').eq('user_id', userId),
        supabase.from('grounded_user_profile').select('profile_context').eq('user_id', userId).maybeSingle(),
      ])
      const s: Partial<Record<SectionId, string>> = {}
      for (const row of storyRes.data ?? []) s[row.section as SectionId] = row.content
      setStory(s)
      lastSaved.current = { ...s }
      const p = profileRes.data?.profile_context ?? ''
      setProfile(p)
      lastProfile.current = p
      setHasProfile(!!profileRes.data)
      setLoaded(true)
    })()
  }, [userId])

  const flash = (msg: string) => {
    setSaved(msg)
    setTimeout(() => setSaved(null), 1500)
  }

  // Save a section when the field loses focus, only if it changed.
  const saveSection = async (id: SectionId) => {
    if (!userId) return
    const content = (story[id] ?? '').trim()
    if (content === (lastSaved.current[id] ?? '').trim()) return
    setError(null)
    const { error } = await supabase
      .from('grounded_user_story')
      .upsert({ user_id: userId, section: id, content, updated_at: new Date().toISOString() })
    if (error) setError(error.message)
    else {
      lastSaved.current[id] = content
      flash('Saved')
    }
  }

  const saveProfile = async () => {
    if (!userId || !hasProfile || profile === lastProfile.current) return
    setError(null)
    const { error } = await supabase
      .from('grounded_user_profile')
      .update({ profile_context: profile, last_updated_at: new Date().toISOString() })
      .eq('user_id', userId)
    if (error) setError(error.message)
    else {
      lastProfile.current = profile
      flash('Saved')
    }
  }

  return (
    <div className="space-y-5">
      <button onClick={() => navigate('/settings')} className="text-stone-500 text-sm">
        &larr; Back
      </button>
      <div className="space-y-1">
        <h2 className="text-xl font-light text-stone-700 text-center">About you</h2>
        <p className="text-stone-500 text-sm text-center">
          Only what you choose to share. Everything here is optional and private to you.
        </p>
      </div>

      <div className="h-5 text-center text-xs" aria-live="polite">
        {error ? <span className="text-red-600">Couldn&apos;t save: {error}</span> : saved && <span className="text-stone-400">{saved}</span>}
      </div>

      <StoryFields
        story={story}
        onChange={(id, value) => setStory((prev) => ({ ...prev, [id]: value }))}
        onBlur={saveSection}
        disabled={!loaded}
      />

      <div className="bg-white rounded-xl p-4 shadow-sm space-y-2">
        <label htmlFor="learned" className="block text-sm font-medium text-stone-700">
          What Grounded has learned
        </label>
        <p className="text-xs text-stone-400">
          Grounded keeps these notes from your check-ins and conversations. Correct or remove anything that&apos;s wrong.
        </p>
        {hasProfile ? (
          <textarea
            id="learned"
            value={profile}
            onChange={(e) => setProfile(e.target.value)}
            onBlur={saveProfile}
            rows={10}
            className="w-full p-3 border border-stone-200 rounded-lg text-sm resize-y"
          />
        ) : (
          <p className="text-sm text-stone-500">{loaded ? 'Nothing yet. This fills in as you use Grounded.' : '…'}</p>
        )}
      </div>
    </div>
  )
}
