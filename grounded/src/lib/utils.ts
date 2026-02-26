import { format, startOfDay, isToday, isYesterday, differenceInDays } from 'date-fns'
import { DAILY_QUOTES } from './constants'

export function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 5) return 'Good evening'
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export function getDailyQuote(): string {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  )
  return DAILY_QUOTES[dayOfYear % DAILY_QUOTES.length]
}

export function todayDate(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  if (isToday(d)) return 'Today'
  if (isYesterday(d)) return 'Yesterday'
  const days = differenceInDays(startOfDay(new Date()), startOfDay(d))
  if (days < 7) return format(d, 'EEEE')
  return format(d, 'MMM d')
}

export function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hour12 = h % 12 || 12
  return `${hour12}:${String(m).padStart(2, '0')} ${ampm}`
}

export function scoreColor(score: number): string {
  if (score >= 4) return 'text-green-600'
  if (score >= 3) return 'text-amber-500'
  return 'text-red-500'
}

export function scoreBg(score: number): string {
  if (score >= 4) return 'bg-green-100'
  if (score >= 3) return 'bg-amber-100'
  return 'bg-red-100'
}

export function averageScores(areas: Record<string, { score?: number }>): number {
  const scores = Object.values(areas).map((a) => a.score ?? 0).filter((s) => s > 0)
  if (scores.length === 0) return 0
  return Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
}
