import { DAYS_OF_WEEK } from './constants'
import type { Reminder } from '@/types'

// Build a Google Calendar URL for adding a reminder as a recurring event
export function buildCalendarUrl(reminder: Reminder) {
  let rrule = ''
  if (reminder.frequency === 'daily') {
    rrule = 'RRULE:FREQ=DAILY'
  } else if (reminder.frequency === 'weekdays') {
    rrule = 'RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR'
  } else if (reminder.frequency === 'weekends') {
    rrule = 'RRULE:FREQ=WEEKLY;BYDAY=SA,SU'
  } else if (reminder.frequency === 'weekly' && reminder.days?.length) {
    const dayMap = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA']
    rrule = `RRULE:FREQ=WEEKLY;BYDAY=${dayMap[reminder.days[0]]}`
  } else if (reminder.frequency === 'custom' && reminder.days?.length) {
    const dayMap = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA']
    const byDay = reminder.days.map((d) => dayMap[d]).join(',')
    rrule = `RRULE:FREQ=WEEKLY;BYDAY=${byDay}`
  }

  const title = encodeURIComponent(`Grounded: ${reminder.title}`)
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&recur=${encodeURIComponent(rrule)}`
}

// Build Google Calendar link for the daily plan
export function buildDailyPlanCalendarUrl(
  scheduledItems: string | undefined,
  areaPlans: { areaName: string; activities: { name: string; timeOfDay: string }[] }[],
  intentions: string | undefined
) {
  const parts: string[] = []
  if (scheduledItems) parts.push(`Scheduled: ${scheduledItems}`)
  areaPlans.forEach(({ areaName, activities }) => {
    if (activities.length) {
      parts.push(`${areaName}: ${activities.map((a) => `${a.name} (${a.timeOfDay})`).join(', ')}`)
    }
  })
  if (intentions) parts.push(`Intention: ${intentions}`)

  const title = encodeURIComponent('Grounded - Daily Plan')
  const details = encodeURIComponent(parts.join('\n'))
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}`
}
