import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { CalendarEvent } from '@/types'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL

// Calendar ID to use - user's email (the calendar they shared with the service account)
const CALENDAR_ID = 'jl@nivria.ai'

export function useCalendar() {
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
      body: JSON.stringify({ calendarId: CALENDAR_ID, ...payload }),
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

  // Create a calendar event, moving it to the next free slot that day if the requested time is taken.
  // Returns the created event plus `movedFrom` (original start ISO) when it had to shift.
  const createEvent = async (eventData: {
    summary: string
    description?: string
    startTime: string
    endTime: string
  }) => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
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

    // Walk forward from the requested start, jumping past any overlapping event, until the slot is clear.
    let start = requestedStart.getTime()
    for (const b of busy) {
      if (b.start < start + duration && b.end > start) start = Math.max(start, b.end)
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
    return start !== requestedStart.getTime() ? { ...result, movedFrom: requestedStart.toISOString() } : result
  }

  return {
    events,
    loading,
    error,
    isCalendarConnected: true, // Always "connected" with service account
    fetchTodayEvents,
    createEvent,
  }
}
