import { useEffect } from 'react'
import { Calendar } from 'lucide-react'
import { useCalendar } from '@/hooks/useCalendar'

export default function CalendarPage() {
  const { events, loading, fetchTodayEvents } = useCalendar()

  useEffect(() => {
    fetchTodayEvents()
  }, []) // eslint-disable-line

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-light text-stone-700 text-center">Today&apos;s Calendar</h2>

      {loading && <p className="text-center text-stone-400 text-sm">Loading events...</p>}

      {!loading && events.length === 0 && (
        <div className="text-center py-8 text-stone-400">
          <Calendar size={32} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">No events today</p>
        </div>
      )}

      <div className="space-y-2">
        {events.map((event) => {
          const startTime = event.start.dateTime
            ? new Date(event.start.dateTime).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
              })
            : 'All day'
          const endTime = event.end.dateTime
            ? new Date(event.end.dateTime).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
              })
            : ''

          return (
            <div key={event.id} className="p-3 bg-white rounded-xl shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-1 h-full min-h-[2rem] bg-blue-400 rounded-full flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-stone-700">{event.summary}</p>
                  <p className="text-xs text-stone-500 mt-0.5">
                    {startTime}
                    {endTime && ` \u2013 ${endTime}`}
                  </p>
                  {event.description && (
                    <p className="text-xs text-stone-400 mt-1">{event.description}</p>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <button
        onClick={fetchTodayEvents}
        className="w-full py-2 text-sm text-stone-500 bg-stone-50 rounded-lg"
      >
        Refresh
      </button>
    </div>
  )
}
