import { useState } from 'react'
import { AREAS } from '@/lib/constants'
import { useJournal } from '@/hooks/useJournal'
import { useCalendar } from '@/hooks/useCalendar'
import { getToday } from '@/lib/utils'
import type { TomorrowSchedule } from '@/types'

// Unified item type for the merged list
interface UnifiedItem {
  id: string
  label: string
  icon?: string
  iconColor?: string
  timeLabel: string
  sortOrder: number
  source: 'plan-today' | 'plan-tomorrow' | 'journal'
  completed?: boolean
  addedToCalendar: boolean
  journalId?: string
  entryType?: 'task' | 'event'
  notes?: string | null
  completionNotes?: string | null
  targetDate: string
}

const TIME_TO_HOUR: Record<string, number> = {
  'morning': 7, 'mid-morning': 9, 'afternoon': 13,
  'evening': 18, 'night': 20, 'anytime': 10,
}

function timeToSortOrder(time: string): number {
  if (time.includes(':')) {
    const [h, m] = time.split(':').map(Number)
    return h * 60 + m
  }
  const hour = TIME_TO_HOUR[time.toLowerCase()] ?? 10
  return hour * 60
}

function timeToDisplayTime(time: string): string {
  if (time.includes(':')) return time
  const hour = TIME_TO_HOUR[time.toLowerCase()]
  if (hour !== undefined) return `${String(hour).padStart(2, '0')}:00`
  return '10:00'
}

const DISMISSED_KEY = 'grounded-dismissed-plan-items'

function getDismissed(): Set<string> {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY)
    return raw ? new Set(JSON.parse(raw)) : new Set()
  } catch { return new Set() }
}

function saveDismissed(set: Set<string>) {
  localStorage.setItem(DISMISSED_KEY, JSON.stringify([...set]))
}

interface TodayScheduleProps {
  todaySchedule: TomorrowSchedule | null | undefined
  tomorrowSchedule: TomorrowSchedule | null | undefined
}

export default function TodaySchedule({ todaySchedule, tomorrowSchedule }: TodayScheduleProps) {
  const { entries, addEntry, updateEntry, deleteEntry, toggleComplete } = useJournal()
  const { createEvent } = useCalendar()
  const today = getToday()
  const tomorrow = (() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0] })()
  const [calendarAdded, setCalendarAdded] = useState<Set<string>>(new Set())
  const [addingId, setAddingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [dismissed, setDismissed] = useState<Set<string>>(getDismissed)

  // Edit state for expanded item
  const [editLabel, setEditLabel] = useState('')
  const [editDate, setEditDate] = useState('')
  const [editTime, setEditTime] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [saving, setSaving] = useState(false)

  // Completion feedback state
  const [completingId, setCompletingId] = useState<string | null>(null)
  const [completionNotesValue, setCompletionNotesValue] = useState('')

  // When expanding an item, populate edit fields
  const expandItem = (item: UnifiedItem) => {
    if (expandedId === item.id) {
      setExpandedId(null)
      return
    }
    setExpandedId(item.id)
    setEditLabel(item.label)
    setEditDate(item.targetDate)
    setEditTime(timeToDisplayTime(item.timeLabel))
    setEditNotes(item.notes || '')
  }

  // Build unified list — everything is date-anchored
  const items: UnifiedItem[] = []

  // Yesterday's check-in planned these for TODAY
  if (todaySchedule) {
    for (const area of AREAS) {
      const areaSchedule = todaySchedule.areas?.[area.id]
      if (!areaSchedule?.activities?.length) continue
      for (const activity of areaSchedule.activities) {
        const id = `today-${area.id}-${activity.name}`
        if (dismissed.has(id)) continue
        items.push({
          id,
          label: activity.name,
          icon: area.icon,
          iconColor: area.color,
          timeLabel: activity.timeOfDay,
          sortOrder: timeToSortOrder(activity.timeOfDay),
          source: 'plan-today',
          addedToCalendar: false,
          targetDate: today,
        })
      }
    }
  }

  // Today's check-in planned these for TOMORROW
  if (tomorrowSchedule) {
    for (const area of AREAS) {
      const areaSchedule = tomorrowSchedule.areas?.[area.id]
      if (!areaSchedule?.activities?.length) continue
      for (const activity of areaSchedule.activities) {
        const id = `tmrw-${area.id}-${activity.name}`
        if (dismissed.has(id)) continue
        items.push({
          id,
          label: activity.name,
          icon: area.icon,
          iconColor: area.color,
          timeLabel: activity.timeOfDay,
          sortOrder: timeToSortOrder(activity.timeOfDay),
          source: 'plan-tomorrow',
          addedToCalendar: false,
          targetDate: tomorrow,
        })
      }
    }
  }

  // Journal tasks/events for today
  const todayEntries = entries.filter(
    (e) => (e.entry_type === 'task' || e.entry_type === 'event') && e.entry_date === today
  )
  for (const entry of todayEntries) {
    items.push({
      id: `journal-${entry.id}`,
      label: entry.content,
      timeLabel: entry.entry_time || 'Anytime',
      sortOrder: entry.entry_time ? timeToSortOrder(entry.entry_time) : 600,
      source: 'journal',
      completed: entry.completed,
      addedToCalendar: entry.added_to_calendar || false,
      journalId: entry.id,
      entryType: entry.entry_type as 'task' | 'event',
      notes: entry.notes,
      completionNotes: entry.completion_notes,
      targetDate: today,
    })
  }

  const todayItems = items.filter((i) => i.targetDate === today).sort((a, b) => a.sortOrder - b.sortOrder)
  const tomorrowItems = items.filter((i) => i.targetDate === tomorrow).sort((a, b) => a.sortOrder - b.sortOrder)

  if (todayItems.length === 0 && tomorrowItems.length === 0) {
    return (
      <div className="text-center py-4 text-stone-400 text-sm">
        No plan yet. Complete a check-in to plan tomorrow, or add tasks.
      </div>
    )
  }

  const addToCalendar = async (item: UnifiedItem) => {
    setAddingId(item.id)
    const displayTime = timeToDisplayTime(item.timeLabel)
    const [h, m] = displayTime.split(':').map(Number)
    const startTime = new Date(`${item.targetDate}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`)
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000)

    const result = await createEvent({
      summary: item.icon ? `${item.icon} ${item.label}` : item.label,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
    })

    if (result && !result.error) {
      setCalendarAdded((prev) => new Set(prev).add(item.id))
      // Update journal entry if it has one
      if (item.journalId) {
        await updateEntry(item.journalId, { added_to_calendar: true })
      }
    }
    setAddingId(null)
  }

  const removeItem = async (item: UnifiedItem) => {
    if (item.journalId) {
      // Journal item — delete from DB
      await deleteEntry(item.journalId)
    } else {
      // Plan item — dismiss locally
      const next = new Set(dismissed)
      next.add(item.id)
      setDismissed(next)
      saveDismissed(next)
    }
    setExpandedId(null)
  }

  // Handle marking an item complete (with feedback prompt)
  const handleComplete = async (item: UnifiedItem) => {
    if (item.journalId) {
      // Journal item — toggle complete
      if (!item.completed) {
        await toggleComplete(item.journalId)
        setCompletingId(item.id)
        setCompletionNotesValue('')
      } else {
        await toggleComplete(item.journalId)
        setCompletingId(null)
      }
    } else {
      // Plan item — create journal entry, mark complete, show feedback
      const result = await addEntry({
        entry_type: 'task',
        content: item.label,
        entry_date: item.targetDate,
        entry_time: timeToDisplayTime(item.timeLabel) || null,
        completed: true,
        added_to_calendar: calendarAdded.has(item.id),
        notes: null,
      })
      // Dismiss original plan item
      const next = new Set(dismissed)
      next.add(item.id)
      setDismissed(next)
      saveDismissed(next)
      // Show completion feedback for the new journal entry
      if (result?.data?.id) {
        setCompletingId(`journal-${result.data.id}`)
        setCompletionNotesValue('')
      }
    }
  }

  const saveCompletionNotes = async (item: UnifiedItem) => {
    if (item.journalId && completionNotesValue.trim()) {
      await updateEntry(item.journalId, { completion_notes: completionNotesValue.trim() })
    }
    setCompletingId(null)
    setCompletionNotesValue('')
  }

  const saveEdit = async (item: UnifiedItem) => {
    setSaving(true)
    if (item.journalId) {
      // Update existing journal entry
      await updateEntry(item.journalId, {
        content: editLabel,
        entry_date: editDate || item.targetDate,
        entry_time: editTime || null,
        notes: editNotes || null,
      })
    } else {
      // Plan item — create a journal entry from it, then dismiss the plan item
      await addEntry({
        entry_type: 'task',
        content: editLabel,
        entry_date: editDate || item.targetDate,
        entry_time: editTime || null,
        completed: false,
        added_to_calendar: calendarAdded.has(item.id),
        notes: editNotes || null,
      })
      // Dismiss original plan item
      const next = new Set(dismissed)
      next.add(item.id)
      setDismissed(next)
      saveDismissed(next)
    }
    setSaving(false)
    setExpandedId(null)
  }

  const renderItem = (item: UnifiedItem) => {
    const isAdded = calendarAdded.has(item.id) || item.addedToCalendar
    const isAdding = addingId === item.id
    const isExpanded = expandedId === item.id
    const isCompleting = completingId === item.id

    return (
      <div key={item.id} className="bg-stone-50 rounded-lg overflow-hidden">
        {/* Main row */}
        <div className="flex items-center gap-2 p-2">
          {/* Checkbox — all items can be completed */}
          <button
            onClick={() => handleComplete(item)}
            className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center ${
              item.completed ? 'bg-stone-700 border-stone-700' : 'border-stone-300'
            }`}
          >
            {item.completed && <span className="text-white text-[10px]">{'\u2713'}</span>}
          </button>

          {/* Area icon for plan items */}
          {item.icon && (
            <span style={{ color: item.iconColor }} className="text-sm flex-shrink-0">{item.icon}</span>
          )}

          {/* Label — tap to expand */}
          <button
            onClick={() => expandItem(item)}
            className={`text-xs text-stone-600 flex-1 text-left ${item.completed ? 'line-through opacity-50' : ''}`}
          >
            {item.label}
            {item.notes && <span className="text-stone-400 ml-1">&#128221;</span>}
          </button>

          {/* Time */}
          <span className="text-xs text-stone-400 flex-shrink-0">{item.timeLabel}</span>

          {/* Calendar button */}
          <button
            onClick={() => addToCalendar(item)}
            disabled={isAdded || isAdding}
            className={`text-[10px] flex-shrink-0 px-1.5 py-0.5 rounded ${
              isAdded ? 'text-green-500' : 'text-blue-500 bg-blue-50'
            }`}
          >
            {isAdded ? '\u2713' : isAdding ? '...' : '+cal'}
          </button>

          {/* Expand chevron */}
          <button
            onClick={() => expandItem(item)}
            className="text-stone-400 text-xs flex-shrink-0 px-0.5"
          >
            {isExpanded ? '\u25B2' : '\u25BC'}
          </button>
        </div>

        {/* Completion feedback panel */}
        {isCompleting && (
          <div className="px-3 pb-2 pt-1 border-t border-green-200 bg-green-50 flex items-center gap-2">
            <input
              type="text"
              value={completionNotesValue}
              onChange={(e) => setCompletionNotesValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && saveCompletionNotes(item)}
              placeholder="How did it go? (optional)"
              autoFocus
              className="flex-1 text-xs p-1.5 border border-green-200 rounded-lg bg-white"
            />
            <button
              onClick={() => saveCompletionNotes(item)}
              className="text-xs text-green-700 px-2 py-1 bg-green-100 rounded-lg"
            >
              Done
            </button>
            <button
              onClick={() => setCompletingId(null)}
              className="text-xs text-stone-400"
            >
              Skip
            </button>
          </div>
        )}

        {/* Completion notes display */}
        {item.completionNotes && !isCompleting && !isExpanded && (
          <div className="px-3 pb-2 text-xs text-green-700 italic">
            {'\u2713'} {item.completionNotes}
          </div>
        )}

        {/* Expanded edit panel */}
        {isExpanded && (
          <div className="px-3 pb-3 pt-1 border-t border-stone-200 space-y-2">
            {/* Edit label */}
            <input
              type="text"
              value={editLabel}
              onChange={(e) => setEditLabel(e.target.value)}
              className="w-full text-sm p-2 border border-stone-200 rounded-lg"
              placeholder="Task name"
            />

            {/* Date & Time */}
            <div className="flex items-center gap-2">
              <label className="text-xs text-stone-500 w-12">Date</label>
              <input
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                className="flex-1 text-sm p-2 border border-stone-200 rounded-lg"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-stone-500 w-12">Time</label>
              <input
                type="time"
                value={editTime}
                onChange={(e) => setEditTime(e.target.value)}
                className="flex-1 text-sm p-2 border border-stone-200 rounded-lg"
              />
            </div>

            {/* Notes */}
            <textarea
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              className="w-full text-sm p-2 border border-stone-200 rounded-lg resize-none h-16"
              placeholder="Add notes..."
            />

            {/* Action buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => saveEdit(item)}
                disabled={saving || !editLabel.trim()}
                className="flex-1 py-1.5 bg-stone-700 text-white rounded-lg text-xs disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => removeItem(item)}
                className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs"
              >
                Remove
              </button>
              <button
                onClick={() => setExpandedId(null)}
                className="px-3 py-1.5 bg-stone-100 text-stone-600 rounded-lg text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {todayItems.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-stone-700 text-sm">Today</h3>
            <button
              onClick={async () => {
                for (const item of todayItems) {
                  if (!calendarAdded.has(item.id) && !item.addedToCalendar) {
                    await addToCalendar(item)
                  }
                }
              }}
              className="text-xs bg-stone-100 px-3 py-1 rounded-full text-stone-600"
            >
              + All to Calendar
            </button>
          </div>
          <div className="space-y-1.5">
            {todayItems.map(renderItem)}
          </div>
        </div>
      )}

      {tomorrowItems.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-stone-700 text-sm">Tomorrow</h3>
            <button
              onClick={async () => {
                for (const item of tomorrowItems) {
                  if (!calendarAdded.has(item.id) && !item.addedToCalendar) {
                    await addToCalendar(item)
                  }
                }
              }}
              className="text-xs bg-stone-100 px-3 py-1 rounded-full text-stone-600"
            >
              + All to Calendar
            </button>
          </div>
          <div className="space-y-1.5">
            {tomorrowItems.map(renderItem)}
          </div>
        </div>
      )}

      {/* Intentions */}
      {todaySchedule?.intentions && (
        <div className="p-2 bg-blue-50 rounded-lg text-xs text-blue-800">
          <span className="font-medium">Today&apos;s intention: </span>
          {todaySchedule.intentions}
        </div>
      )}
      {tomorrowSchedule?.intentions && (
        <div className="p-2 bg-blue-50 rounded-lg text-xs text-blue-800">
          <span className="font-medium">Tomorrow&apos;s intention: </span>
          {tomorrowSchedule.intentions}
        </div>
      )}
    </div>
  )
}
