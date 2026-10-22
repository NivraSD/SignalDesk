import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useGroundedStore } from '@/stores/groundedStore'

// Google Calendar, connected by sharing: the person shares their calendar with Grounded's service
// account, then taps Connect. The server only allows the calendar matching their login email.
// (A "Sign in with Google" option comes later, once Google verifies the app.)

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL

async function call(action: string, payload: Record<string, unknown> = {}) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Not signed in')
  const r = await fetch(`${SUPABASE_URL}/functions/v1/grounded-calendar`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...payload }),
  })
  const j = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`)
  return j
}

export default function CalendarConnect() {
  const { userId, hasCalendar } = useGroundedStore()
  const [calendarId, setCalendarId] = useState<string | null>(null)
  const [share, setShare] = useState<{ serviceAccount: string; email: string } | null>(null)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!userId) return
    supabase.from('grounded_user_settings').select('calendar_id').eq('user_id', userId).maybeSingle()
      .then(({ data }) => setCalendarId(data?.calendar_id ?? null))
  }, [userId, hasCalendar])

  useEffect(() => {
    if (open && !share) call('share-address').then(setShare).catch((e) => setError(e.message))
  }, [open, share])

  const connect = async () => {
    setBusy(true)
    setError(null)
    try {
      const r = await call('connect')
      setCalendarId(r.calendarId)
      useGroundedStore.setState({ hasCalendar: true })
      setOpen(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not connect')
    }
    setBusy(false)
  }

  const disconnect = async () => {
    setBusy(true)
    setError(null)
    try {
      await call('disconnect')
      setCalendarId(null)
      useGroundedStore.setState({ hasCalendar: false })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not disconnect')
    }
    setBusy(false)
  }

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard blocked: the address is selectable */
    }
  }

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <span>
          <span className="block text-sm font-medium text-stone-700">Google Calendar</span>
          <span className="block text-xs text-stone-400">
            {calendarId ? `Connected: ${calendarId}` : 'Add plans and events to your calendar'}
          </span>
        </span>
        {calendarId ? (
          <button onClick={disconnect} disabled={busy} className="flex-none text-xs px-3 py-1.5 rounded-full border border-stone-200 text-stone-600 disabled:opacity-50">
            {busy ? '…' : 'Disconnect'}
          </button>
        ) : (
          <button onClick={() => setOpen((v) => !v)} className="flex-none text-xs px-3 py-1.5 rounded-full bg-stone-700 text-white">
            {open ? 'Close' : 'Connect'}
          </button>
        )}
      </div>

      {!calendarId && open && (
        <div className="bg-stone-50 rounded-lg p-3 space-y-3 text-xs text-stone-600">
          <ol className="list-decimal pl-4 space-y-2">
            <li>
              Open{' '}
              <a href="https://calendar.google.com/calendar/r/settings" target="_blank" rel="noopener noreferrer" className="underline">
                Google Calendar settings
              </a>{' '}
              on a computer, signed in as <b>{share?.email ?? 'your Grounded email'}</b>. Under <b>Settings for my calendars</b>, pick your calendar.
            </li>
            <li>
              In <b>Share with specific people</b>, add this address with <b>Make changes to events</b>:
              {share && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="flex-1 min-w-0 break-all select-all text-[11px] text-stone-500">{share.serviceAccount}</span>
                  <button onClick={() => copy(share.serviceAccount)} className="flex-none px-2.5 py-1 rounded-full bg-stone-700 text-white">
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
              )}
            </li>
            <li>Come back here and tap Connect.</li>
          </ol>
          <button onClick={connect} disabled={busy} className="w-full py-2 bg-stone-700 text-white rounded-lg text-sm disabled:opacity-50">
            {busy ? 'Checking…' : 'Connect'}
          </button>
        </div>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
