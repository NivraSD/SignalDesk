import type { Area, PyramidLevel, DailyQuote, FrequencyOption } from '@/types'

// Starting areas for someone new. Each person's own areas live in grounded_user_settings.areas
// (renamed, turned off, reordered in the welcome). Ids are stable keys for check-in data.
export const DEFAULT_AREAS: Area[] = [
  { id: 'spiritual', name: 'Spiritual', icon: '\u2726', color: '#8B7355', description: 'Prayer, meditation, faith, connection to something larger', isGrounding: true },
  { id: 'mental_emotional', name: 'Mental/Emotional', icon: '\u25C8', color: '#6B8E8E', description: 'Therapy, regulation, naming what you feel' },
  { id: 'physical', name: 'Physical', icon: '\u25CB', color: '#7A9B76', description: 'Movement, food, sleep, your body' },
  { id: 'recovery', name: 'Recovery', icon: '\u25B3', color: '#9B8AA6', description: 'Meetings, sponsor, program, staying sober' },
  { id: 'work', name: 'Work/School', icon: '\u25C7', color: '#8B9EAB', description: "What you're building, studying, or showing up for" },
  { id: 'joy_connection', name: 'Joy/Connection', icon: '\u2600', color: '#C4A574', description: 'Fun, friends, people who feel good to be around', isWeekly: true },
]

export const PYRAMID_LEVELS: PyramidLevel[] = [
  { text: 'God, Humility, Gratitude', width: '55%', bg: 'from-amber-600 to-amber-700' },
  { text: 'Prayer and Meditation', width: '70%', bg: 'from-amber-500 to-amber-600' },
  { text: 'Discipline', width: '85%', bg: 'from-amber-400 to-amber-500' },
  { text: 'Goals', width: '100%', bg: 'from-amber-300 to-amber-400' },
]

export const TIMEZONE = 'America/New_York'

export const TIME_OF_DAY = ['Morning', 'Afternoon', 'Evening', 'Night']

export const PILL_SLOTS = [
  { id: 'morning', label: 'Morning' },
  { id: 'afternoon', label: 'Afternoon' },
  { id: 'evening', label: 'Evening' },
  { id: 'night', label: 'Night' },
] as const
export const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export const FREQUENCY_OPTIONS: FrequencyOption[] = [
  { id: 'daily', label: 'Daily' },
  { id: 'weekdays', label: 'Weekdays' },
  { id: 'weekends', label: 'Weekends' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'custom', label: 'Custom days' },
]

export const DAILY_QUOTES: DailyQuote[] = [
  { text: "Just for today, I will try to live through this day only.", source: "NA Literature" },
  { text: "Progress, not perfection.", source: "Recovery Wisdom" },
  { text: "You don't have to see the whole staircase, just take the first step.", source: "Recovery Principle" },
  { text: "One day at a time.", source: "NA Foundation" },
  { text: "The opposite of addiction is connection.", source: "Johann Hari" },
  { text: "This too shall pass.", source: "Jewish Proverb" },
  { text: "You are not obligated to complete the work, but neither are you free to abandon it.", source: "Pirkei Avot" },
  { text: "Where there is no struggle, there is no strength.", source: "Jewish Teaching" },
  { text: "The world is a narrow bridge. The main thing is not to be afraid.", source: "Rabbi Nachman" },
  { text: "Feelings are just visitors. Let them come and go.", source: "Mooji" },
  { text: "You are not your trauma. You are the one who survived it.", source: "Healing Wisdom" },
  { text: "Healing is not linear.", source: "Trauma Recovery" },
  { text: "The wound is the place where the light enters you.", source: "Rumi" },
  { text: "Be where you are, not where you think you should be.", source: "Mindfulness Teaching" },
  { text: "You are allowed to be both a masterpiece and a work in progress.", source: "Sophia Bush" },
  { text: "Start where you are. Use what you have. Do what you can.", source: "Arthur Ashe" },
  { text: "Breathe. You're going to be okay.", source: "Grounding Wisdom" },
]

// Starting activity ideas for someone new (each person's own list lives in grounded_activities).
export const DEFAULT_ACTIVITY_BANK: Record<string, string[]> = {
  spiritual: ['5 minutes of quiet/breathing', '10 minutes of prayer', '10 minutes of meditation', 'Read something spiritual', 'Gratitude list'],
  mental_emotional: ["Name one emotion you're feeling", 'Journal for 10 minutes', 'Grounding exercise', 'Process something in writing', 'Therapy session'],
  physical: ['Stretch for 5 minutes', '20-minute walk', 'Workout', 'Cook a real meal', 'Drink enough water', 'Get to bed on time'],
  recovery: ['Daily reading', 'Call your sponsor', 'Go to a meeting', 'Step work', 'Reach out to someone in the program'],
  work: ['One focused hour', 'Clear one small task', 'Plan tomorrow', 'Ask for help with something', 'Study session'],
  joy_connection: ['Text a friend', 'Make plans with someone', 'Do something just for fun', 'Time outside', 'Call family'],
}

export const DEFAULT_REMINDERS = [
  { id: '1', title: 'Look at your vision', time: '08:00', frequency: 'daily' as const, days: [] as number[], enabled: true },
  { id: '2', title: 'Evening check-in', time: '20:00', frequency: 'daily' as const, days: [] as number[], enabled: true },
]
