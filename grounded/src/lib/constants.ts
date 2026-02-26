export type AreaId =
  | 'spiritual'
  | 'mental_emotional'
  | 'physical'
  | 'recovery'
  | 'nivria'
  | 'joy_connection'

export interface AreaConfig {
  id: AreaId
  name: string
  icon: string
  color: string
  bgColor: string
}

export const LIFE_AREAS: AreaConfig[] = [
  { id: 'spiritual', name: 'Spiritual', icon: 'Star', color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
  { id: 'mental_emotional', name: 'Mental & Emotional', icon: 'Brain', color: 'text-purple-600', bgColor: 'bg-purple-50' },
  { id: 'physical', name: 'Physical', icon: 'Heart', color: 'text-red-500', bgColor: 'bg-red-50' },
  { id: 'recovery', name: 'Recovery', icon: 'Shield', color: 'text-green-600', bgColor: 'bg-green-50' },
  { id: 'nivria', name: 'NIVRIA', icon: 'Rocket', color: 'text-slate-600', bgColor: 'bg-slate-50' },
  { id: 'joy_connection', name: 'Joy & Connection', icon: 'Sun', color: 'text-amber-500', bgColor: 'bg-amber-50' },
]

export const AREA_MAP = Object.fromEntries(LIFE_AREAS.map((a) => [a.id, a])) as Record<AreaId, AreaConfig>

export const DEFAULT_ACTIVITIES: Record<AreaId, string[]> = {
  spiritual: ['Prayer', 'Meditation', 'Torah study', 'Gratitude journaling', 'Contemplation'],
  mental_emotional: ['Therapy session', 'Breathing exercises', 'CPTSD workbook', 'Emotional check-in', 'Mindfulness'],
  physical: ['Gym workout', 'Yoga', 'Walk outside', 'Stretching', 'Healthy meal prep'],
  recovery: ['NA meeting', 'Sponsor call', 'Step work', 'Recovery reading', 'Fellowship'],
  nivria: ['Coding session', 'Fundraising call', 'Strategy planning', 'Team standup', 'Product work'],
  joy_connection: ['Call a friend', 'Date night', 'Creative hobby', 'Social outing', 'Play with pets'],
}

export const DAILY_QUOTES = [
  "One day at a time.",
  "Progress, not perfection.",
  "You are exactly where you need to be.",
  "The only way out is through.",
  "Be gentle with yourself today.",
  "Courage is not the absence of fear.",
  "This too shall pass.",
  "You've survived 100% of your worst days.",
  "Breathe. You are enough.",
  "Small steps still move you forward.",
  "Healing is not linear.",
  "You are worthy of the love you give to others.",
  "Today is a gift. That's why it's called the present.",
  "Surrender doesn't mean giving up. It means letting go.",
  "Your story isn't over yet.",
  "What you water, grows.",
  "Rest is not a reward. It's a necessity.",
  "The wound is the place where the light enters.",
  "You don't have to have it all figured out.",
  "Just for today, I choose peace.",
]
