import type { Area, DailyQuote, FrequencyOption } from '@/types'

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


export const TIMEZONE = 'America/New_York'

// Stripe Payment Link for contributions ("customer chooses what to pay"). Empty = the About section hides it.
export const CONTRIBUTE_URL = '/api/contribute'

// Bump when the Terms or Privacy Policy change in a way people should agree to again.
export const CONSENT_VERSION = '2026-10-22'
export const CONTACT_EMAIL = 'hello@groundedproject.app'

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

// Starting activity ideas for someone new, saved to their own list when they start (so every one can
// be removed). Each area runs from tiny to bigger, so there's always an easy way in.
export const DEFAULT_ACTIVITY_BANK: Record<string, string[]> = {
  spiritual: ['One slow breath, on purpose', 'Two minutes of quiet', 'Name one thing you’re grateful for', 'Step outside and look up', 'Pray or meditate for 10 minutes', 'Read something that steadies you', 'Write a short gratitude list'],
  mental_emotional: ['Name what you’re feeling', 'Five-senses grounding', 'Write for 5 minutes, no editing', 'Notice one thought without arguing with it', 'Tell someone how you’re really doing', 'Phone in another room for an hour', 'Therapy, or prep for your next session'],
  physical: ['Drink a glass of water', 'Stretch for 2 minutes', 'Eat something real', 'Shower and get dressed', '10-minute walk', 'Get outside in daylight', 'Move however feels good for 20 minutes', 'Lights out at a set time'],
  recovery: ['Read a daily meditation', 'Say the Serenity Prayer', 'Text someone in the program', 'Call your sponsor', 'Go to a meeting', 'Work a step for 20 minutes', 'Help someone else'],
  work: ['Pick the one thing that matters today', 'Clear one small task', '25 focused minutes', 'Answer one message you’ve been putting off', 'Plan tomorrow in 5 minutes', 'Ask for help with something stuck', 'Study for 30 minutes'],
  joy_connection: ['Listen to a song you love', 'Send a message to a friend', 'Spend time with an animal', 'Make plans for this week', 'Try something new and small', 'Call family', 'Do something just because it’s fun'],
}

export const DEFAULT_REMINDERS = [
  { id: '1', title: 'Look at your vision', time: '08:00', frequency: 'daily' as const, days: [] as number[], enabled: true },
  { id: '2', title: 'Evening check-in', time: '20:00', frequency: 'daily' as const, days: [] as number[], enabled: true },
]
