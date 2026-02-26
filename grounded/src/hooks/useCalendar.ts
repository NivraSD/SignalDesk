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

  // Create a calendar event
  const createEvent = async (eventData: {
    summary: string
    description?: string
    startTime: string
    endTime: string
  }) => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    const result = await callCalendarAPI({
      action: 'create-event',
      event: {
        summary: eventData.summary,
        description: eventData.description,
        start: { dateTime: eventData.startTime, timeZone: tz },
        end: { dateTime: eventData.endTime, timeZone: tz },
      },
    })
    return result
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
