import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useGroundedStore } from '@/stores/groundedStore'
import { CONSENT_VERSION } from '@/lib/constants'

// Asked once before using Grounded (and again if the Terms or Privacy Policy change).
export default function ConsentPage() {
  const navigate = useNavigate()
  const { signOut } = useAuth()
  const { userId, onboarded, setConsented } = useGroundedStore()
  const [agreed, setAgreed] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const agree = async () => {
    if (!userId) return
    setSaving(true)
    setError(null)
    const { error } = await supabase
      .from('grounded_user_settings')
      .upsert({ user_id: userId, consented_at: new Date().toISOString(), consent_version: CONSENT_VERSION }, { onConflict: 'user_id' })
    setSaving(false)
    if (error) return setError(error.message)
    setConsented(true)
    navigate(onboarded ? '/' : '/welcome', { replace: true })
  }

  return (
    <div className="min-h-[100dvh] bg-stone-100 px-4 pt-safe-header pb-10">
      <div className="max-w-lg mx-auto space-y-5 pt-8">
        <h1 className="text-xl font-light text-stone-700 text-center">Before you start</h1>

        <div className="bg-white rounded-xl shadow-sm p-4 space-y-3 text-sm text-stone-600 leading-relaxed">
          <p>
            Grounded is a personal wellness companion. It isn&apos;t therapy, medical care, or emergency help. If you&apos;re in
            crisis, call or text <b>988</b> or call <b>911</b>.
          </p>
          <p>
            What you write is stored in your account and shared with the AI services that power the companion, only to
            make Grounded work for you. It&apos;s never sold or used for ads. You can ask us to delete everything at any time.
          </p>
          <p>
            Please read the{' '}
            <Link to="/privacy" className="underline">Privacy Policy</Link> and{' '}
            <Link to="/terms" className="underline">Terms of Use</Link>.
          </p>
        </div>

        <label className="flex items-start gap-3 text-sm text-stone-700">
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5 w-4 h-4 accent-stone-700" />
          I&apos;m 18 or older, and I agree to the Terms of Use and Privacy Policy.
        </label>

        {error && <p className="text-xs text-red-600">{error}</p>}

        <button onClick={agree} disabled={!agreed || saving} className="w-full py-3 bg-stone-700 text-white rounded-lg text-sm disabled:opacity-40">
          {saving ? 'Saving…' : 'Continue'}
        </button>
        <button onClick={() => signOut()} className="w-full text-xs text-stone-400">
          Sign out
        </button>
      </div>
    </div>
  )
}
