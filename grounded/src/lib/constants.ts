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

// Real lines from real people, attributed as precisely as we can. No anonymous "wisdom", no
// misattributions. Add freely; every quote is shown once before any repeats.
export const DAILY_QUOTES: DailyQuote[] = [
  { text: "You are not obligated to complete the work, but neither are you free to desist from it.", source: "Rabbi Tarfon, Pirkei Avot 2:16" },
  { text: "The whole world is a very narrow bridge, and the main thing is not to be afraid.", source: "Rabbi Nachman of Breslov" },
  { text: "If I am not for myself, who will be for me? And if I am only for myself, what am I? And if not now, when?", source: "Hillel, Pirkei Avot 1:14" },
  { text: "Who is strong? One who masters their own impulse.", source: "Ben Zoma, Pirkei Avot 4:1" },
  { text: "Who is rich? One who is content with their portion.", source: "Ben Zoma, Pirkei Avot 4:1" },
  { text: "Do not judge your fellow until you have stood in their place.", source: "Hillel, Pirkei Avot 2:4" },
  { text: "Say little and do much.", source: "Shammai, Pirkei Avot 1:15" },
  { text: "There is nothing so whole as a broken heart.", source: "The Kotzker Rebbe" },
  { text: "This too is for the good.", source: "Nachum Ish Gamzu, Talmud Taanit 21a" },
  { text: "Everything can be taken from a man but one thing: the last of the human freedoms, to choose one's attitude in any given set of circumstances.", source: "Viktor Frankl, Man's Search for Meaning" },
  { text: "He who has a why to live for can bear almost any how.", source: "Nietzsche, quoted by Viktor Frankl" },
  { text: "How we spend our days is, of course, how we spend our lives.", source: "Annie Dillard, The Writing Life" },
  { text: "Tell me, what is it you plan to do with your one wild and precious life?", source: "Mary Oliver, \"The Summer Day\"" },
  { text: "You do not have to be good. You do not have to walk on your knees for a hundred miles through the desert, repenting.", source: "Mary Oliver, \"Wild Geese\"" },
  { text: "Instructions for living a life: Pay attention. Be astonished. Tell about it.", source: "Mary Oliver, \"Sometimes\"" },
  { text: "The best way out is always through.", source: "Robert Frost, \"A Servant to Servants\"" },
  { text: "There is a crack in everything. That's how the light gets in.", source: "Leonard Cohen, \"Anthem\"" },
  { text: "Nothing ever goes away until it has taught us what we need to know.", source: "Pema Chödrön, When Things Fall Apart" },
  { text: "You are the sky. Everything else is just the weather.", source: "Pema Chödrön" },
  { text: "You can't stop the waves, but you can learn to surf.", source: "Jon Kabat-Zinn, Wherever You Go, There You Are" },
  { text: "The curious paradox is that when I accept myself just as I am, then I can change.", source: "Carl Rogers, On Becoming a Person" },
  { text: "Courage is not the absence of despair; it is, rather, the capacity to move ahead in spite of despair.", source: "Rollo May, The Courage to Create" },
  { text: "Rock bottom became the solid foundation on which I rebuilt my life.", source: "J.K. Rowling, Harvard commencement, 2008" },
  { text: "There is no greater agony than bearing an untold story inside you.", source: "Maya Angelou, I Know Why the Caged Bird Sings" },
  { text: "I can be changed by what happens to me. But I refuse to be reduced by it.", source: "Maya Angelou, Letter to My Daughter" },
  { text: "\"Hope\" is the thing with feathers that perches in the soul.", source: "Emily Dickinson" },
  { text: "Anything that's human is mentionable, and anything that is mentionable can be more manageable.", source: "Fred Rogers" },
  { text: "Not everything that is faced can be changed, but nothing can be changed until it is faced.", source: "James Baldwin" },
  { text: "Caring for myself is not self-indulgence, it is self-preservation.", source: "Audre Lorde, A Burst of Light" },
  { text: "I took a deep breath and listened to the old brag of my heart. I am, I am, I am.", source: "Sylvia Plath, The Bell Jar" },
  { text: "Let everything happen to you: beauty and terror. Just keep going. No feeling is final.", source: "Rainer Maria Rilke, Book of Hours" },
  { text: "Be patient toward all that is unsolved in your heart and try to love the questions themselves.", source: "Rainer Maria Rilke, Letters to a Young Poet" },
  { text: "Perhaps all the dragons in our lives are princesses who are only waiting to see us act, just once, with beauty and courage.", source: "Rainer Maria Rilke, Letters to a Young Poet" },
  { text: "The cure for anything is salt water: sweat, tears or the sea.", source: "Isak Dinesen" },
  { text: "In the depth of winter, I finally learned that within me there lay an invincible summer.", source: "Albert Camus, \"Return to Tipasa\"" },
  { text: "Almost everything will work again if you unplug it for a few minutes, including you.", source: "Anne Lamott" },
  { text: "Just take it bird by bird.", source: "Anne Lamott, Bird by Bird" },
  { text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", source: "Will Durant, on Aristotle" },
  { text: "We suffer more often in imagination than in reality.", source: "Seneca, Letters to Lucilius" },
  { text: "The impediment to action advances action. What stands in the way becomes the way.", source: "Marcus Aurelius, Meditations" },
  { text: "Waste no more time arguing about what a good man should be. Be one.", source: "Marcus Aurelius, Meditations" },
  { text: "People are disturbed not by things, but by their opinions about things.", source: "Epictetus, Enchiridion" },
  { text: "The world breaks everyone and afterward many are strong at the broken places.", source: "Ernest Hemingway, A Farewell to Arms" },
  { text: "Feelings come and go like clouds in a windy sky. Conscious breathing is my anchor.", source: "Thich Nhat Hanh" },
  { text: "Grant me the serenity to accept the things I cannot change, courage to change the things I can, and wisdom to know the difference.", source: "The Serenity Prayer, Reinhold Niebuhr" },
  { text: "We claim spiritual progress rather than spiritual perfection.", source: "Alcoholics Anonymous" },
  { text: "We will not regret the past nor wish to shut the door on it.", source: "Alcoholics Anonymous" },
  { text: "It may be that when we no longer know what to do, we have come to our real work.", source: "Wendell Berry, \"The Real Work\"" },
  { text: "This being human is a guest house. Every morning a new arrival.", source: "Rumi, tr. Coleman Barks" },
  { text: "Before you know what kindness really is, you must lose things.", source: "Naomi Shihab Nye, \"Kindness\"" },
  { text: "Anything or anyone that does not bring you alive is too small for you.", source: "David Whyte, \"Sweet Darkness\"" },
  { text: "We're all just walking each other home.", source: "Ram Dass" },
  { text: "Notice when you are happy, and exclaim or murmur or think at some point, \"If this isn't nice, I don't know what is.\"", source: "Kurt Vonnegut" },
  { text: "It is good to have an end to journey toward; but it is the journey that matters, in the end.", source: "Ursula K. Le Guin, The Left Hand of Darkness" },
  { text: "All we have to decide is what to do with the time that is given us.", source: "J.R.R. Tolkien, The Fellowship of the Ring" },
  { text: "Rarely, if ever, are any of us healed in isolation. Healing is an act of communion.", source: "bell hooks, All About Love" },
  { text: "Life can only be understood backwards; but it must be lived forwards.", source: "Søren Kierkegaard" },
  { text: "Here is the world. Beautiful and terrible things will happen. Don't be afraid.", source: "Frederick Buechner" },
  { text: "Won't you celebrate with me what I have shaped into a kind of life?", source: "Lucille Clifton" },
  { text: "Hold fast to dreams, for if dreams die, life is a broken-winged bird that cannot fly.", source: "Langston Hughes, \"Dreams\"" },
  { text: "The opposite of addiction is connection.", source: "Johann Hari" },
  { text: "Owning our story and loving ourselves through that process is the bravest thing we'll ever do.", source: "Brené Brown, The Gifts of Imperfection" },
  { text: "I am large, I contain multitudes.", source: "Walt Whitman, \"Song of Myself\"" },
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
