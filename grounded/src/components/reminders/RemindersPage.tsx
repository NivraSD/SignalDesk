import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FREQUENCY_OPTIONS, DAYS_OF_WEEK } from '@/lib/constants'
import { getFrequencyLabel } from '@/lib/utils'
import { buildCalendarUrl } from '@/lib/google-calendar'
import { useReminders } from '@/hooks/useReminders'
import type { Reminder } from '@/types'

export default function RemindersPage() {
  const navigate = useNavigate()
  const { reminders, addReminder, updateReminder, deleteReminder } = useReminders()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newReminder, setNewReminder] = useState<Omit<Reminder, 'id' | 'user_id' | 'created_at' | 'updated_at'>>({
    title: '',
    time: '09:00',
    frequency: 'daily',
    days: [],
    enabled: true,
  })

  const handleAdd = async () => {
    if (!newReminder.title.trim()) return
    await addReminder(newReminder)
    setNewReminder({ title: '', time: '09:00', frequency: 'daily', days: [], enabled: true })
    setShowAddForm(false)
  }

  const toggleDay = (days: number[], dayIndex: number) => {
    return days.includes(dayIndex) ? days.filter((d) => d !== dayIndex) : [...days, dayIndex].sort()
  }

  const ReminderForm = ({
    reminder,
    onChange,
    isNew,
  }: {
    reminder: typeof newReminder
    onChange: (r: typeof newReminder) => void
    isNew: boolean
  }) => (
    <div className="space-y-4 p-4 bg-white rounded-xl shadow-sm">
      <input
        type="text"
        value={reminder.title}
        onChange={(e) => onChange({ ...reminder, title: e.target.value })}
        placeholder="Reminder title..."
        className="w-full p-3 border border-stone-200 rounded-lg text-sm"
      />
      <div className="flex items-center gap-3">
        <label className="text-sm text-stone-600">Time:</label>
        <input
          type="time"
          value={reminder.time}
          onChange={(e) => onChange({ ...reminder, time: e.target.value })}
          className="p-2 border border-stone-200 rounded-lg text-sm"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm text-stone-600">Frequency:</label>
        <div className="flex flex-wrap gap-2">
          {FREQUENCY_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() =>
                onChange({
                  ...reminder,
                  frequency: opt.id as Reminder['frequency'],
                  days: opt.id === 'weekly' ? [0] : [],
                })
              }
              className={`px-3 py-1.5 rounded-full text-xs ${
                reminder.frequency === opt.id
                  ? 'bg-stone-700 text-white'
                  : 'bg-stone-100 text-stone-600'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {(reminder.frequency === 'weekly' || reminder.frequency === 'custom') && (
        <div className="space-y-2">
          <label className="text-sm text-stone-600">
            {reminder.frequency === 'weekly' ? 'Which day?' : 'Which days?'}
          </label>
          <div className="flex gap-1">
            {DAYS_OF_WEEK.map((day, idx) => (
              <button
                key={day}
                onClick={() => {
                  if (reminder.frequency === 'weekly') {
                    onChange({ ...reminder, days: [idx] })
                  } else {
                    onChange({ ...reminder, days: toggleDay(reminder.days, idx) })
                  }
                }}
                className={`w-10 h-10 rounded-full text-xs ${
                  (reminder.days || []).includes(idx)
                    ? 'bg-stone-700 text-white'
                    : 'bg-stone-100 text-stone-600'
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2">
        {isNew ? (
          <>
            <button
              onClick={() => setShowAddForm(false)}
              className="flex-1 py-2 border border-stone-200 rounded-lg text-sm text-stone-600"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              className="flex-1 py-2 bg-stone-700 text-white rounded-lg text-sm"
            >
              Add Reminder
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => editingId && deleteReminder(editingId)}
              className="py-2 px-4 text-red-600 text-sm"
            >
              Delete
            </button>
            <button
              onClick={() => {
                const url = buildCalendarUrl(reminder as Reminder)
                window.open(url, '_blank')
              }}
              className="flex-1 py-2 border border-stone-200 rounded-lg text-sm text-stone-600"
            >
              + Calendar
            </button>
            <button
              onClick={() => setEditingId(null)}
              className="flex-1 py-2 bg-stone-700 text-white rounded-lg text-sm"
            >
              Done
            </button>
          </>
        )}
      </div>
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/')} className="text-stone-500 text-sm">
          &larr; Back
        </button>
        <h2 className="text-lg font-light text-stone-700">Reminders</h2>
        <div className="w-12" />
      </div>

      <p className="text-sm text-stone-500 text-center">
        Set reminders to stay grounded. Add them to your calendar for notifications.
      </p>

      <div className="space-y-2">
        {reminders.map((reminder) =>
          editingId === reminder.id ? (
            <ReminderForm
              key={reminder.id}
              reminder={reminder}
              onChange={(updated) => reminder.id && updateReminder(reminder.id, updated)}
              isNew={false}
            />
          ) : (
            <div key={reminder.id} className="p-4 bg-white rounded-xl shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        reminder.id && updateReminder(reminder.id, { enabled: !reminder.enabled })
                      }
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        reminder.enabled
                          ? 'bg-stone-700 border-stone-700'
                          : 'border-stone-300'
                      }`}
                    >
                      {reminder.enabled && <span className="text-white text-xs">{'\u2713'}</span>}
                    </button>
                    <span
                      className={`font-medium text-stone-700 ${!reminder.enabled && 'opacity-50'}`}
                    >
                      {reminder.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 ml-7">
                    <span className="text-xs text-stone-500">{reminder.time}</span>
                    <span className="text-xs text-stone-400">&bull;</span>
                    <span className="text-xs text-stone-500">{getFrequencyLabel(reminder)}</span>
                  </div>
                </div>
                <button
                  onClick={() => setEditingId(reminder.id || null)}
                  className="text-stone-400 text-sm px-2"
                >
                  Edit
                </button>
              </div>
            </div>
          )
        )}
      </div>

      {showAddForm ? (
        <ReminderForm reminder={newReminder} onChange={setNewReminder} isNew={true} />
      ) : (
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full py-3 border-2 border-dashed border-stone-300 rounded-xl text-stone-500 text-sm"
        >
          + Add Reminder
        </button>
      )}
    </div>
  )
}
