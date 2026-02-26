import { useState, useCallback } from 'react'
import { callEdgeFunction } from '@/lib/supabase'
import { useAuth } from './useAuth'
import type { CalendarEvent } from '@/types'

export function useCalendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(false)
  const { session } = useAuth()

  const loadEvents = useCallback(async (date?: string) => {
    if (!session?.access_token) return
    setLoading(true)
    const d = date ?? new Date().toISOString().slice(0, 10)
    try {
      const data = await callEdgeFunction('grounded-calendar', {
        action: 'get-events',
        timeMin: `${d}T00:00:00Z`,
        timeMax: `${d}T23:59:59Z`,
      }, session.access_token)
      setEvents(data.items ?? [])
    } catch (e) {
      console.error('Calendar load error:', e)
    }
    setLoading(false)
  }, [session?.access_token])

  async function createEvent(event: { summary: string; start: string; end: string; description?: string }) {
    if (!session?.access_token) return null
    try {
      const data = await callEdgeFunction('grounded-calendar', {
        action: 'create-event',
        event: {
          summary: event.summary,
          start: { dateTime: event.start, timeZone: 'America/New_York' },
          end: { dateTime: event.end, timeZone: 'America/New_York' },
          description: event.description,
        },
      }, session.access_token)
      setEvents((prev) => [...prev, data])
      return data as CalendarEvent
    } catch (e) {
      console.error('Create event error:', e)
      return null
    }
  }

  async function deleteEvent(eventId: string) {
    if (!session?.access_token) return
    try {
      await callEdgeFunction('grounded-calendar', {
        action: 'delete-event',
        eventId,
      }, session.access_token)
      setEvents((prev) => prev.filter((e) => e.id !== eventId))
    } catch (e) {
      console.error('Delete event error:', e)
    }
  }

  return { events, loading, loadEvents, createEvent, deleteEvent }
}
