import { useNavigate } from 'react-router-dom'
import { CONTRIBUTE_URL } from '@/lib/constants'

// How Grounded works, section by section. Plain language; nothing here asks anything of the reader.

const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: 'What Grounded is',
    body: [
      'A quiet structure for your day: a few small moments of contact with the parts of your life that matter, spread across the day.',
      'There are no streaks to break and nothing to fall behind on. Use one part or all of it. If you leave for a week, it’s still here when you come back.',
    ],
  },
  {
    title: 'Home',
    body: [
      'Home reads top to bottom: a quote to sit with, your vision board (the why), then your day — the morning check-in, the pill tracker if you use it, today’s schedule, and the evening check-in.',
    ],
  },
  {
    title: 'Your areas',
    body: [
      'Grounded checks in with you about a handful of areas — spiritual, mental and emotional, physical, recovery, work or school, joy and connection. Rename them or turn some off in Settings → Your areas.',
    ],
  },
  {
    title: 'Morning check-in',
    body: [
      'About now, not yesterday. For each area: how does it feel right now (1 to 5), and what’s present for you there.',
      'Then today’s plan — keep the one you made last night, or make a new one — and one intention for the day.',
    ],
  },
  {
    title: 'Evening check-in',
    body: [
      'A look back at the day, area by area: how it felt, whether you did anything for it, and any notes. Then a free write, and a plan for tomorrow that shows up on Home in the morning.',
    ],
  },
  {
    title: 'Today’s schedule',
    body: [
      'Your plan for today and tomorrow, plus any tasks and events you add. Tick things off as you go. With a calendar connected, add items to Google Calendar in one tap.',
    ],
  },
  {
    title: 'Add',
    body: [
      'Capture a thought, a task, or an event. Tasks and events can go on your schedule and, with a time, onto your calendar exactly when you set them.',
    ],
  },
  {
    title: 'Chat',
    body: [
      'A companion that knows your check-ins, your plans, and what you’ve shared in About you. It remembers what you forget and helps you see patterns. It isn’t a therapist and doesn’t diagnose.',
      'Clear chat (Settings) clears the conversation from your screen. Nothing is deleted, and the companion still remembers.',
    ],
  },
  {
    title: 'Activities',
    body: [
      'The things you do for each area. Grounded suggests from this list when you plan. It starts with a few ideas — remove what doesn’t fit and add what you actually do.',
    ],
  },
  {
    title: 'History',
    body: ['Your past check-ins, week by week, so you can see how each area has been going over time.'],
  },
  {
    title: 'Lock screen art',
    body: [
      'Grounded makes new art through the day, each piece with a short title. Put it on your lock screen with the Shortcuts app (Settings → Lock screen art).',
      'The point is the small moment of connecting the image to its title. That few seconds of noticing is the whole exercise — it doesn’t have to be hard, and it doesn’t try to change how you feel.',
    ],
  },
  {
    title: 'Pill tracker',
    body: ['Four quick checks a day — morning, afternoon, evening, night. Email yourself a day’s summary if you like. Turn it off in Settings if you don’t need it.'],
  },
  {
    title: 'Your information',
    body: [
      'What you write in Grounded belongs to your account and isn’t shown to other people. About you (Settings) shows what you’ve shared and what Grounded has learned from your check-ins and chats — change or remove anything there.',
    ],
  },
]

export default function AboutPage() {
  const navigate = useNavigate()
  return (
    <div className="space-y-5">
      <button onClick={() => navigate(-1)} className="text-stone-500 text-sm">
        &larr; Back
      </button>
      <h2 className="text-xl font-light text-stone-700 text-center">How Grounded works</h2>

      <div className="bg-white rounded-xl shadow-sm divide-y divide-stone-100">
        {SECTIONS.map((s) => (
          <section key={s.title} className="p-4 space-y-1.5">
            <h3 className="text-sm font-medium text-stone-700">{s.title}</h3>
            {s.body.map((p, i) => (
              <p key={i} className="text-sm text-stone-500 leading-relaxed">
                {p}
              </p>
            ))}
          </section>
        ))}
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm space-y-1.5">
        <h3 className="text-sm font-medium text-stone-700">If you’re in crisis</h3>
        <p className="text-sm text-stone-500 leading-relaxed">
          Grounded isn’t emergency help. In the US, call or text <b>988</b> (Suicide &amp; Crisis Lifeline) any time, or
          call <b>911</b>. Outside the US, contact your local emergency number.
        </p>
      </div>

      {CONTRIBUTE_URL && (
        <div className="bg-white rounded-xl p-4 shadow-sm flex items-center justify-between gap-3">
          <p className="text-sm text-stone-500">Grounded is free. Modest contributions go a long way.</p>
          <a href={CONTRIBUTE_URL} target="_blank" rel="noopener noreferrer" className="flex-none text-xs px-3 py-1.5 rounded-full bg-stone-700 text-white">
            Contribute
          </a>
        </div>
      )}
    </div>
  )
}
