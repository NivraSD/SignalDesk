import { useEffect, useState } from 'react'
import { Plus, X, Bell, BellOff, Trash2 } from 'lucide-react'
import { useReminders } from '@/hooks/useReminders'
import { formatTime } from '@/lib/utils'

export default function RemindersPage() {
  const { reminders, loading, loadReminders, createReminder, toggleReminder, deleteReminder } = useReminders()
  const [showAdd, setShowAdd] = useState(false)
  const [title, setTitle] = useState('')
  const [time, setTime] = useState('09:00')
  const [frequency, setFrequency] = useState<'daily' | 'weekdays' | 'weekends'>('daily')

  useEffect(() => { loadReminders() }, [loadReminders])

  async function handleCreate() {
    if (!title.trim()) return
    await createReminder({ title: title.trim(), time, frequency })
    setTitle('')
    setShowAdd(false)
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-8 pb-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-light text-stone-800">Reminders</h1>
        <button onClick={() => setShowAdd(!showAdd)} className="p-2 rounded-full bg-stone-800 text-white">
          {showAdd ? <X size={18} /> : <Plus size={18} />}
        </button>
      </div>

      {showAdd && (
        <div className="bg-white rounded-2xl p-4 border border-stone-200 mb-4 space-y-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Reminder title"
            className="w-full px-3 py-2 rounded-lg bg-stone-50 text-sm focus:outline-none"
            autoFocus
          />
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-stone-50 text-sm focus:outline-none"
          />
          <div className="flex gap-2">
            {(['daily', 'weekdays', 'weekends'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFrequency(f)}
                className={`flex-1 py-2 rounded-lg text-xs font-medium capitalize ${
                  frequency === f ? 'bg-stone-800 text-white' : 'bg-stone-50 text-stone-500'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <button onClick={handleCreate} className="w-full py-2.5 rounded-xl bg-stone-800 text-white text-sm font-medium">
            Create Reminder
          </button>
        </div>
      )}

      {loading ? (
        <div className="text-center text-stone-400 text-sm py-10">Loading...</div>
      ) : reminders.length === 0 ? (
        <div className="text-center text-stone-400 text-sm py-10">No reminders. Create one to stay on track.</div>
      ) : (
        <div className="space-y-2">
          {reminders.map((r) => (
            <div key={r.id} className="bg-white rounded-xl p-4 border border-stone-200 flex items-center gap-3">
              <button onClick={() => toggleReminder(r.id, !r.enabled)}>
                {r.enabled ? <Bell size={18} className="text-stone-700" /> : <BellOff size={18} className="text-stone-300" />}
              </button>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${r.enabled ? 'text-stone-700' : 'text-stone-400'}`}>{r.title}</p>
                <p className="text-xs text-stone-400">{formatTime(r.time)} &middot; {r.frequency}</p>
              </div>
              <button onClick={() => deleteReminder(r.id)} className="text-stone-300 hover:text-red-400">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
