import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { format, addDays, subDays } from 'date-fns'
import { useCalendar } from '@/hooks/useCalendar'

export default function CalendarPage() {
  const { events, loading, loadEvents, createEvent } = useCalendar()
  const [date, setDate] = useState(new Date())
  const [showAdd, setShowAdd] = useState(false)
  const [newSummary, setNewSummary] = useState('')
  const [newTime, setNewTime] = useState('09:00')

  const dateStr = format(date, 'yyyy-MM-dd')

  useEffect(() => { loadEvents(dateStr) }, [dateStr, loadEvents])

  async function handleAdd() {
    if (!newSummary.trim()) return
    const start = `${dateStr}T${newTime}:00`
    const [h, m] = newTime.split(':').map(Number)
    const endH = String(h + 1).padStart(2, '0')
    const end = `${dateStr}T${endH}:${String(m).padStart(2, '0')}:00`
    await createEvent({ summary: newSummary.trim(), start, end })
    setNewSummary('')
    setShowAdd(false)
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-8 pb-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-light text-stone-800">Calendar</h1>
        <button onClick={() => setShowAdd(!showAdd)} className="p-2 rounded-full bg-stone-800 text-white">
          <Plus size={18} />
        </button>
      </div>

      {/* Date navigation */}
      <div className="flex items-center justify-between bg-white rounded-xl p-3 border border-stone-200 mb-4">
        <button onClick={() => setDate(subDays(date, 1))} className="p-1 text-stone-400"><ChevronLeft size={20} /></button>
        <span className="text-sm font-medium text-stone-700">{format(date, 'EEEE, MMM d')}</span>
        <button onClick={() => setDate(addDays(date, 1))} className="p-1 text-stone-400"><ChevronRight size={20} /></button>
      </div>

      {/* Add event */}
      {showAdd && (
        <div className="bg-white rounded-xl p-4 border border-stone-200 mb-4 space-y-3">
          <input
            value={newSummary}
            onChange={(e) => setNewSummary(e.target.value)}
            placeholder="Event name"
            className="w-full px-3 py-2 rounded-lg bg-stone-50 text-sm focus:outline-none"
            autoFocus
          />
          <input
            type="time"
            value={newTime}
            onChange={(e) => setNewTime(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-stone-50 text-sm focus:outline-none"
          />
          <button onClick={handleAdd} className="w-full py-2 rounded-lg bg-stone-800 text-white text-sm font-medium">
            Add Event
          </button>
        </div>
      )}

      {/* Events */}
      {loading ? (
        <div className="text-center text-stone-400 text-sm py-10">Loading...</div>
      ) : events.length === 0 ? (
        <div className="text-center text-stone-400 text-sm py-10">No events for this day.</div>
      ) : (
        <div className="space-y-2">
          {events.map((ev) => (
            <div key={ev.id} className="bg-white rounded-xl p-4 border border-stone-200">
              <div className="flex items-center gap-3">
                <div className="w-1 h-8 bg-stone-300 rounded-full shrink-0" />
                <div>
                  <p className="text-sm font-medium text-stone-700">{ev.summary}</p>
                  <p className="text-xs text-stone-400">
                    {ev.start.dateTime
                      ? `${new Date(ev.start.dateTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} - ${new Date(ev.end.dateTime!).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
                      : 'All day'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
