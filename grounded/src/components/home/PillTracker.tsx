import { useState } from 'react'
import { Check, ChevronLeft, ChevronRight } from 'lucide-react'
import { PILL_SLOTS, TIMEZONE } from '@/lib/constants'
import { getToday, shiftDay, toDayISO } from '@/lib/utils'
import { usePillChecks } from '@/hooks/usePillChecks'

const fmtTime = (iso: string) =>
  new Intl.DateTimeFormat('en-US', { timeZone: TIMEZONE, hour: 'numeric', minute: '2-digit' }).format(new Date(iso))

const fmtDay = (iso: string) =>
  new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', weekday: 'short', month: 'short', day: 'numeric' }).format(new Date(iso + 'T00:00:00Z'))

export default function PillTracker() {
  const today = getToday()
  const [day, setDay] = useState(today)
  const { checks, loading, error, toggleSlot, emailSummary } = usePillChecks(day)
  const [sendStatus, setSendStatus] = useState<{ msg: string; err?: boolean } | null>(null)
  const [sending, setSending] = useState(false)

  const takenCount = PILL_SLOTS.filter((s) => checks[s.id]).length

  const changeDay = (n: number) => {
    setDay((d) => shiftDay(d, n))
    setSendStatus(null)
  }

  const handleSend = async () => {
    setSending(true)
    setSendStatus(null)
    try {
      const { sentTo } = await emailSummary()
      setSendStatus({ msg: `Sent to ${sentTo}` })
    } catch (e) {
      setSendStatus({ msg: e instanceof Error ? e.message : 'Send failed', err: true })
    }
    setSending(false)
  }

  // Ticking off an earlier day records "now", so only show the time when it was taken on that day.
  const takenLabel = (iso: string) => (toDayISO(new Date(iso)) === day ? `Taken ${fmtTime(iso)}` : 'Taken')

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-stone-400 uppercase tracking-wide">
          Pills {!loading && <span className="normal-case tracking-normal">· {takenCount} of 4</span>}
        </span>
        <div className="flex items-center gap-1">
          <button onClick={() => changeDay(-1)} aria-label="Previous day" className="p-1 text-stone-500">
            <ChevronLeft size={16} />
          </button>
          <span className="text-xs text-stone-600 w-20 text-center tabular-nums">
            {day === today ? 'Today' : fmtDay(day)}
          </span>
          <button
            onClick={() => changeDay(1)}
            disabled={day >= today}
            aria-label="Next day"
            className="p-1 text-stone-500 disabled:opacity-30"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {PILL_SLOTS.map((slot) => {
          const at = checks[slot.id]
          return (
            <button
              key={slot.id}
              onClick={() => toggleSlot(slot.id)}
              disabled={loading}
              aria-pressed={!!at}
              className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-colors disabled:opacity-50 ${
                at ? 'bg-green-50 border-green-600/40' : 'bg-stone-50 border-stone-200'
              }`}
            >
              <span
                className={`flex-none w-6 h-6 rounded-md border-2 flex items-center justify-center ${
                  at ? 'bg-green-600 border-green-600 text-white' : 'border-stone-300 text-transparent'
                }`}
              >
                <Check size={14} strokeWidth={3} />
              </span>
              <span className="min-w-0">
                <span className="block text-sm text-stone-800">{slot.label}</span>
                <span className="block text-xs text-stone-500 tabular-nums">{at ? takenLabel(at) : 'Not yet'}</span>
              </span>
            </button>
          )
        })}
      </div>

      {error && <p className="text-xs text-red-600">Couldn&apos;t save: {error}</p>}

      <div className="flex items-center justify-between gap-3">
        <span className={`text-xs ${sendStatus?.err ? 'text-red-600' : 'text-stone-500'}`}>{sendStatus?.msg}</span>
        <button
          onClick={handleSend}
          disabled={sending || loading}
          className="flex-none py-1.5 px-3 border border-stone-200 rounded-lg text-xs text-stone-700 disabled:opacity-50"
        >
          {sending ? 'Sending…' : 'Email summary'}
        </button>
      </div>
    </div>
  )
}
