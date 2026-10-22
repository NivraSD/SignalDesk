import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { CalendarEvent } from '@/types'
import { useGroundedStore } from '@/stores/groundedStore'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL

export function useCalendar() {
  const hasCalendar = useGroundedStore((s) => s.hasCalendar)
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const callCalendarAPI = async (payload: Record<string, unknown>) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Not authenticated')

    const response = await fetch(`${SUPABASE_URL}/functions/v1/grounded-calendar`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload), // the server uses the signed-in person's own calendar
    })

    return await response.json()
  }

  // Fetch today's events
  const fetchTodayEvents = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const now = new Date()
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString()

      const result = await callCalendarAPI({
        action: 'get-events',
        timeMin: startOfDay,
        timeMax: endOfDay,
      })

      if (result.error) {
        setError(result.error)
      } else {
        setEvents(result.items || [])
      }
    } catch (err: any) {
      setError(err.message)
    }
    setLoading(false)
  }, []) // eslint-disable-line

  // Create a calendar event. Vague plan times ("Morning" -> 7:00) are placed in the next free, not-yet-passed
  // slot that day; an exact time the user typed (exactTime) is used as entered, even if it overlaps.
  // Returns the created event plus `movedFrom` (original start ISO) and `movedBecause` when it had to shift.
  const createEvent = async (eventData: {
    summary: string
    description?: string
    startTime: string
    endTime: string
    exactTime?: boolean
  }) => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (eventData.exactTime) {
      return callCalendarAPI({
        action: 'create-event',
        event: {
          summary: eventData.summary,
          description: eventData.description,
          start: { dateTime: eventData.startTime, timeZone: tz },
          end: { dateTime: eventData.endTime, timeZone: tz },
        },
      })
    }
    const requestedStart = new Date(eventData.startTime)
    const duration = new Date(eventData.endTime).getTime() - requestedStart.getTime()

    const dayStart = new Date(requestedStart)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(dayStart)
    dayEnd.setDate(dayEnd.getDate() + 1)

    const existing = await callCalendarAPI({
      action: 'get-events',
      timeMin: dayStart.toISOString(),
      timeMax: dayEnd.toISOString(),
    })
    if (existing.error) return { error: `Couldn't check calendar: ${existing.error}` }

    // Only timed, busy, non-cancelled events block a slot.
    const busy = ((existing.items || []) as CalendarEvent[])
      .filter((e) => e.start.dateTime && e.end.dateTime && e.status !== 'cancelled' && (e as { transparency?: string }).transparency !== 'transparent')
      .map((e) => ({ start: new Date(e.start.dateTime!).getTime(), end: new Date(e.end.dateTime!).getTime() }))
      .sort((a, b) => a.start - b.start)

    // Never schedule in the past: a "Morning" (7:00) item added at 9:30 goes in at the next quarter hour.
    const QUARTER = 15 * 60 * 1000
    const nextQuarter = Math.ceil(Date.now() / QUARTER) * QUARTER
    let start = Math.max(requestedStart.getTime(), nextQuarter)
    const wasPast = start !== requestedStart.getTime()

    // Walk forward from there, jumping past any overlapping event, until the slot is clear.
    let wasBusy = false
    for (const b of busy) {
      if (b.start < start + duration && b.end > start) {
        start = Math.max(start, b.end)
        wasBusy = true
      }
    }
    const latestEnd = new Date(dayStart)
    latestEnd.setHours(23, 0, 0, 0)
    if (start + duration > latestEnd.getTime()) {
      return { error: 'No free slot left that day' }
    }

    const result = await callCalendarAPI({
      action: 'create-event',
      event: {
        summary: eventData.summary,
        description: eventData.description,
        start: { dateTime: new Date(start).toISOString(), timeZone: tz },
        end: { dateTime: new Date(start + duration).toISOString(), timeZone: tz },
      },
    })
    if (result.error) return result
    if (start === requestedStart.getTime()) return result
    // Why it moved, for the UI: the requested time had passed, or it was taken (busy wins if both).
    return { ...result, movedFrom: requestedStart.toISOString(), movedBecause: wasBusy ? 'busy' : wasPast ? 'past' : 'busy' }
  }

  return {
    events,
    loading,
    error,
    isCalendarConnected: hasCalendar, // set per person in grounded_user_settings.calendar_id
    fetchTodayEvents,
    createEvent,
  }
}
