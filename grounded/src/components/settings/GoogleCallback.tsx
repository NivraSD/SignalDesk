import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useGroundedStore } from '@/stores/groundedStore'

// Google sends people back here after "Sign in with Google". On an iPhone home-screen app this page
// opens in a separate browser view that isn't signed in to Grounded, so the server identifies the
// person from the one-time `state` instead of a session.

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export default function GoogleCallback() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<'working' | 'done' | 'error'>('working')
  const [message, setMessage] = useState('')
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true
    const q = new URLSearchParams(window.location.search)
    const code = q.get('code')
    const state = q.get('state')
    if (q.get('error') || !code || !state) {
      setStatus('error')
      setMessage(q.get('error') === 'access_denied' ? 'Google Calendar was not connected.' : 'Something went wrong with Google sign-in.')
      return
    }
    ;(async () => {
      const r = await fetch(`${SUPABASE_URL}/functions/v1/grounded-calendar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${ANON_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'oauth-exchange', code, state, redirectUri: `${window.location.origin}/oauth/google` }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) {
        setStatus('error')
        setMessage(j.error || 'Could not connect Google Calendar.')
        return
      }
      useGroundedStore.setState({ hasCalendar: true })
      const { data: { session } } = await supabase.auth.getSession()
      // Signed in here (a normal browser): go straight back. Otherwise ask them to return to the app.
      if (session) navigate(j.returnTo || '/settings', { replace: true })
      else {
        setStatus('done')
        setMessage(j.calendarId ? `Connected ${j.calendarId}.` : 'Connected.')
      }
    })()
  }, [navigate])

  return (
    <div className="min-h-[100dvh] bg-stone-100 flex items-center justify-center p-6">
      <div className="max-w-sm text-center space-y-3">
        <h1 className="text-lg font-light text-stone-700">Google Calendar</h1>
        {status === 'working' && <p className="text-sm text-stone-400">Connecting…</p>}
        {status === 'done' && (
          <>
            <p className="text-sm text-stone-600">{message}</p>
            <p className="text-sm text-stone-500">You can close this and go back to Grounded.</p>
          </>
        )}
        {status === 'error' && (
          <>
            <p className="text-sm text-stone-600">{message}</p>
            <p className="text-sm text-stone-500">Close this and try again from Grounded (Settings → Google Calendar).</p>
          </>
        )}
      </div>
    </div>
  )
}
