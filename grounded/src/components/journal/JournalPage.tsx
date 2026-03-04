import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useJournal } from '@/hooks/useJournal'
import { useCalendar } from '@/hooks/useCalendar'
import { getToday } from '@/lib/utils'
import type { JournalEntry } from '@/types'

export default function JournalPage() {
  const navigate = useNavigate()
  const { entries, addEntry, deleteEntry, toggleComplete } = useJournal()
  const { isCalendarConnected, createEvent } = useCalendar()
  const [newEntry, setNewEntry] = useState<{
    type: 'thought' | 'task' | 'event'
    content: string
    date: string
    time: string
    addToCalendar: boolean
  }>({ type: 'thought', content: '', date: getToday(), time: '', addToCalendar: false })
  const [filter, setFilter] = useState('all')
  const [saving, setSaving] = useState(false)

  const handleAdd = async () => {
    if (!newEntry.content.trim()) return
    setSaving(true)

    const entryData: Omit<JournalEntry, 'id' | 'user_id' | 'created_at'> = {
      entry_type: newEntry.type,
      content: newEntry.content,
      entry_date: newEntry.date,
      entry_time: newEntry.time || null,
      completed: false,
      added_to_calendar: false,
    }

    // Add to calendar if requested
    if (newEntry.addToCalendar && isCalendarConnected && newEntry.time) {
      const startTime = `${newEntry.date}T${newEntry.time}:00`
      const [h, m] = newEntry.time.split(':').map(Number)
      const endH = h + 1
      const endTime = `${newEntry.date}T${String(endH).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`

      const result = await createEvent({
        summary: newEntry.content,
        startTime: new Date(`${startTime}`).toISOString(),
        endTime: new Date(`${endTime}`).toISOString(),
      })

      if (result && !result.error) {
        entryData.added_to_calendar = true
      }
    }

    await addEntry(entryData)
    setNewEntry({ type: 'thought', content: '', date: getToday(), time: '', addToCalendar: false })
    setSaving(false)
  }

  const filteredEntries = entries.filter((e) => filter === 'all' || e.entry_type === filter)

  return (
    <div className="space-y-4">
      <button onClick={() => navigate('/')} className="text-stone-500 text-sm">
        &larr; Back
      </button>
      <h2 className="text-xl font-light text-stone-700 text-center">Add Entry</h2>

      {/* New entry form */}
      <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex gap-2">
          {(['thought', 'task', 'event'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setNewEntry({ ...newEntry, type })}
              className={`px-3 py-1 rounded-full text-xs capitalize ${
                newEntry.type === type ? 'bg-stone-700 text-white' : 'bg-stone-100 text-stone-600'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        <textarea
          value={newEntry.content}
          onChange={(e) => setNewEntry({ ...newEntry, content: e.target.value })}
          placeholder={
            newEntry.type === 'thought'
              ? "What's on your mind?"
              : newEntry.type === 'task'
                ? 'What needs to be done?'
                : "What's happening?"
          }
          className="w-full h-24 p-3 border border-stone-200 rounded-lg resize-none text-sm"
        />

        {(newEntry.type === 'task' || newEntry.type === 'event') && (
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                type="date"
                value={newEntry.date}
                onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
                className="flex-1 p-2 border border-stone-200 rounded-lg text-sm"
              />
              <input
                type="time"
                value={newEntry.time}
                onChange={(e) => setNewEntry({ ...newEntry, time: e.target.value })}
                className="flex-1 p-2 border border-stone-200 rounded-lg text-sm"
                placeholder="Time (optional)"
              />
            </div>

            {isCalendarConnected && newEntry.time && (
              <label className="flex items-center gap-2 text-sm text-stone-600">
                <input
                  type="checkbox"
                  checked={newEntry.addToCalendar}
                  onChange={(e) => setNewEntry({ ...newEntry, addToCalendar: e.target.checked })}
                  className="rounded border-stone-300"
                />
                Add to Google Calendar
              </label>
            )}
          </div>
        )}

        <button
          onClick={handleAdd}
          disabled={saving || !newEntry.content.trim()}
          className="w-full py-2 bg-stone-700 text-white rounded-lg text-sm disabled:opacity-50"
        >
          {saving ? 'Adding...' : 'Add Entry'}
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {['all', 'thought', 'task', 'event'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-full text-xs capitalize ${
              filter === f ? 'bg-stone-700 text-white' : 'bg-stone-100 text-stone-600'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Entries */}
      <div className="space-y-2">
        {filteredEntries.length === 0 && (
          <p className="text-center text-stone-400 text-sm py-8">No entries yet.</p>
        )}

        {filteredEntries.map((entry) => (
          <div
            key={entry.id}
            className={`p-3 bg-white rounded-xl shadow-sm ${entry.completed ? 'opacity-50' : ''}`}
          >
            <div className="flex items-start gap-3">
              {entry.entry_type === 'task' && (
                <button
                  onClick={() => entry.id && toggleComplete(entry.id)}
                  className={`w-5 h-5 rounded border-2 flex-shrink-0 mt-0.5 flex items-center justify-center ${
                    entry.completed
                      ? 'bg-stone-700 border-stone-700'
                      : 'border-stone-300'
                  }`}
                >
                  {entry.completed && <span className="text-white text-xs">{'\u2713'}</span>}
                </button>
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                      entry.entry_type === 'thought'
                        ? 'bg-blue-100 text-blue-700'
                        : entry.entry_type === 'task'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-purple-100 text-purple-700'
                    }`}
                  >
                    {entry.entry_type}
                  </span>
                  {entry.entry_date && entry.entry_type !== 'thought' && (
                    <span className="text-xs text-stone-400">
                      {new Date(entry.entry_date + 'T12:00:00').toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                      {entry.entry_time && ` at ${entry.entry_time}`}
                    </span>
                  )}
                  {entry.added_to_calendar && (
                    <span className="text-xs text-blue-500">cal</span>
                  )}
                </div>
                <p className={`text-sm text-stone-700 ${entry.completed ? 'line-through' : ''}`}>
                  {entry.content}
                </p>
              </div>
              <button
                onClick={() => entry.id && deleteEntry(entry.id)}
                className="text-stone-400 text-xs"
              >
                x
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
