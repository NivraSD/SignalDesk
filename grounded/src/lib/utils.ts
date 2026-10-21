import { DAILY_QUOTES, DAYS_OF_WEEK, TIMEZONE } from './constants'
import type { Area, CheckIn, Reminder } from '@/types'

// All "what day is it" logic runs in TIMEZONE, not UTC — otherwise the date flips at 8pm Eastern.
export const toDayISO = (d: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE }).format(d)

export const getToday = () => toDayISO(new Date())

// Add n days to a YYYY-MM-DD string.
export const shiftDay = (iso: string, n: number) => {
  const d = new Date(iso + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

export const getYesterday = () => shiftDay(getToday(), -1)

export const getTomorrow = () => shiftDay(getToday(), 1)

export const getGreeting = () => {
  const hour = Number(new Intl.DateTimeFormat('en-US', { timeZone: TIMEZONE, hour: 'numeric', hourCycle: 'h23' }).format(new Date()))
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export const getDailyQuote = () => {
  const today = new Date()
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
  )
  return DAILY_QUOTES[dayOfYear % DAILY_QUOTES.length]
}

export const getWeekDates = (weekOffset = 0) => {
  const today = getToday()
  const dayOfWeek = new Date(today + 'T00:00:00Z').getUTCDay()
  const startOfWeek = shiftDay(today, -dayOfWeek + weekOffset * 7)
  return Array.from({ length: 7 }, (_, i) => shiftDay(startOfWeek, i))
}

export const getFrequencyLabel = (reminder: Reminder) => {
  if (reminder.frequency === 'daily') return 'Daily'
  if (reminder.frequency === 'weekdays') return 'Weekdays'
  if (reminder.frequency === 'weekends') return 'Weekends'
  if (reminder.frequency === 'weekly') return `Weekly (${DAYS_OF_WEEK[reminder.days?.[0]] || 'Sun'})`
  if (reminder.frequency === 'custom' && reminder.days?.length) {
    return reminder.days.map((d) => DAYS_OF_WEEK[d]).join(', ')
  }
  return 'Custom'
}

// Simple fallback feedback (used when AI reflection is unavailable)
export const generateFeedback = (checkIn: CheckIn | null, area: Area) => {
  const areaData = checkIn?.areas?.[area.id]
  if (!areaData) return null

  const { score, didSomething, activities, whatDidYouDo } = areaData
  const activityList = activities?.length ? activities : whatDidYouDo ? [whatDidYouDo] : []

  if (didSomething && activityList.length > 0) {
    return { type: 'praise' as const, message: `You did ${activityList.length} thing${activityList.length > 1 ? 's' : ''} for ${area.name.toLowerCase()} today: ${activityList.join(', ')}.` }
  }

  if (didSomething) {
    return { type: 'praise' as const, message: `You engaged with ${area.name.toLowerCase()} today.` }
  }

  if (score && score <= 2) {
    return { type: 'support' as const, message: `It's okay to have hard days with ${area.name.toLowerCase()}.` }
  }

  if (!didSomething && areaData.reasonNotDone) {
    return { type: 'acknowledge' as const, message: `You noted: "${areaData.reasonNotDone}"` }
  }

  return null
}

export const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

export const formatTime = (timeStr: string) => {
  const [hours, minutes] = timeStr.split(':')
  const h = parseInt(hours)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${minutes} ${ampm}`
}
