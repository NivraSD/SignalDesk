import type { Area, TomorrowSchedule } from '@/types'

// Turning plan items ("Morning", "Afternoon", or an exact "08:15") into calendar events.
// Shared by the Home schedule and the check-ins, so both place events the same way.

export const TIME_TO_HOUR: Record<string, number> = {
  morning: 7, 'mid-morning': 9, afternoon: 13,
  evening: 18, night: 20, anytime: 10,
}

export function timeToDisplayTime(time: string): string {
  if (time.includes(':')) return time
  const hour = TIME_TO_HOUR[time.toLowerCase()]
  if (hour !== undefined) return `${String(hour).padStart(2, '0')}:00`
  return '10:00'
}

type CreateEvent = (e: { summary: string; startTime: string; endTime: string; exactTime?: boolean }) => Promise<{ error?: string } | undefined>

// Add every not-yet-added activity in a plan to the calendar for `date` (YYYY-MM-DD), one at a
// time so each sees the ones before it. Returns the plan with added items marked, and a count of
// failures. Vague times are placed in the next free slot; exact times are kept.
export async function addPlanToCalendar(
  plan: TomorrowSchedule,
  date: string,
  areas: Area[],
  createEvent: CreateEvent
): Promise<{ plan: TomorrowSchedule; added: number; failed: number }> {
  const next: TomorrowSchedule = { ...plan, areas: { ...plan.areas } }
  let added = 0
  let failed = 0
  for (const area of areas) {
    const areaPlan = next.areas?.[area.id]
    if (!areaPlan?.activities?.length) continue
    const activities = [...areaPlan.activities]
    for (let i = 0; i < activities.length; i++) {
      const a = activities[i]
      if (a.addedToCalendar) continue
      const timeLabel = a.timeOfDay
      const [h, m] = timeToDisplayTime(timeLabel).split(':').map(Number)
      const start = new Date(`${date}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`)
      const result = await createEvent({
        summary: `${area.icon} ${a.name}`,
        startTime: start.toISOString(),
        endTime: new Date(start.getTime() + 60 * 60 * 1000).toISOString(),
        exactTime: timeLabel.includes(':'),
      })
      if (result && !result.error) {
        activities[i] = { ...a, addedToCalendar: true }
        added++
      } else failed++
    }
    next.areas[area.id] = { ...areaPlan, activities }
  }
  return { plan: next, added, failed }
}
