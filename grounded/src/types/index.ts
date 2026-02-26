import type { AreaId } from '@/lib/constants'

export interface AreaScore {
  score: number
  didSomething?: boolean
  activities: string[]
  whatDidYouDo?: string
  reasonNotDone?: string
  notes?: string
}

export interface CheckIn {
  id: string
  user_id: string
  checkin_date: string
  areas: Record<AreaId, AreaScore>
  journal?: string
  tomorrow_schedule?: Record<AreaId, SuggestedActivity>
  offline_id?: string
  created_at: string
  updated_at?: string
}

export interface SuggestedActivity {
  activity: string
  timeOfDay: string
  reason: string
}

export interface JournalEntry {
  id: string
  user_id: string
  entry_type: 'thought' | 'task' | 'event'
  content: string
  entry_date: string
  entry_time?: string
  completed?: boolean
  notes?: string
  completion_notes?: string
  created_at: string
}

export interface Activity {
  id: string
  user_id: string
  area_id: AreaId
  name: string
  is_default: boolean
  created_at: string
}

export interface ArtPiece {
  id: string
  user_id?: string
  title: string
  image_url: string
  prompt_seed?: { palette: string; texture: string; energy: string; mood: string }
  created_at: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export interface Reminder {
  id: string
  user_id: string
  title: string
  time: string
  frequency: 'daily' | 'weekdays' | 'weekends' | 'weekly' | 'custom'
  days?: number[]
  enabled: boolean
  google_event_id?: string
  created_at: string
  updated_at?: string
}

export interface VisionItem {
  id: string
  user_id: string
  image_url: string
  position_order: number
  created_at: string
}

export interface UserProfile {
  id: string
  user_id: string
  profile_context: string
  patterns?: Record<string, unknown>
  last_updated_at: string
  created_at: string
}

export interface UserRule {
  id: string
  user_id: string
  rule_text: string
  category: string
  is_active: boolean
  created_at: string
}

export interface CalendarEvent {
  id: string
  summary: string
  start: { dateTime?: string; date?: string; timeZone?: string }
  end: { dateTime?: string; date?: string; timeZone?: string }
  description?: string
}

export interface UserSettings {
  id: string
  user_id: string
  display_name?: string
  timezone: string
  google_calendar_enabled: boolean
  created_at: string
  updated_at?: string
}
