// Life areas
export interface Area {
  id: string
  name: string
  icon: string
  color: string
  description: string
  isGrounding?: boolean
  isWeekly?: boolean
}

// Check-in data per area
export interface AreaCheckInData {
  score?: number
  didSomething?: boolean
  whatDidYouDo?: string       // legacy single value
  activities?: string[]       // multiple activities
  reasonNotDone?: string
  notes?: string
}

// Scheduled activity for tomorrow
export interface ScheduledActivity {
  name: string
  timeOfDay: string
  duration?: string
}

// Area schedule for tomorrow
export interface AreaSchedule {
  intensity?: 'light' | 'heavy'
  activities: ScheduledActivity[]
}

// Tomorrow schedule
export interface TomorrowSchedule {
  hasScheduled?: boolean
  scheduledItems?: string
  areas: Record<string, AreaSchedule>
  intentions?: string
}

// Full check-in record
export interface CheckIn {
  id?: string
  user_id?: string
  checkin_date: string
  areas: Record<string, AreaCheckInData>
  journal: string
  tomorrow_schedule: TomorrowSchedule
  offline_id?: string
  created_at?: string
  updated_at?: string
}

// Journal entry
export interface JournalEntry {
  id?: string
  user_id?: string
  entry_type: 'thought' | 'task' | 'event'
  content: string
  entry_date: string
  entry_time?: string | null
  completed?: boolean
  added_to_calendar?: boolean
  notes?: string | null
  completion_notes?: string | null
  created_at?: string
}

// Reminder
export interface Reminder {
  id?: string
  user_id?: string
  title: string
  time: string
  frequency: 'daily' | 'weekdays' | 'weekends' | 'weekly' | 'custom'
  days: number[]
  enabled: boolean
  google_event_id?: string
  created_at?: string
  updated_at?: string
}

// Activity bank item
export interface Activity {
  id?: string
  user_id?: string
  area_id: string
  name: string
  is_default: boolean
  created_at?: string
}

// Vision board item
export interface VisionBoardItem {
  id?: string
  user_id?: string
  image_url: string
  position_order: number
  created_at?: string
}

// Google tokens
export interface GoogleTokens {
  id?: string
  user_id?: string
  access_token: string
  refresh_token: string
  expires_at: string
  scope: string
}

// User settings
export interface UserSettings {
  id?: string
  user_id?: string
  display_name: string
  timezone: string
  google_calendar_enabled: boolean
}

// Google Calendar event
export interface CalendarEvent {
  id: string
  summary: string
  description?: string
  start: { dateTime?: string; date?: string }
  end: { dateTime?: string; date?: string }
  status?: string
}

// Daily quote
export interface DailyQuote {
  text: string
  source: string
}

// Pyramid level
export interface PyramidLevel {
  text: string
  width: string
  bg: string
}

// Frequency option
export interface FrequencyOption {
  id: string
  label: string
}

// Orchestration result (on-open screen)
export interface OrchestrationResult {
  id: string
  focus_domain: string
  title: string
  image_url: string
  routing_suggestion: string
  routing_target: string
  time_context: string
  created_at: string
  fallback?: boolean
}
