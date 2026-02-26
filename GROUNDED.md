# Grounded

     A personal wellness and recovery companion — built as a mobile-first progressive web app, installed directly to the home
     screen.

     Grounded was designed for someone navigating complex trauma recovery, addiction, and the daily work of staying present. It
     combines structured daily check-ins, an AI companion with deep personal context, activity planning, journaling, and a vision
     board into a single tool that lives in your pocket.

     ---

     ## What It Does

     ### Daily Check-Ins
     Score yourself across six life areas each day. Each area gets a 1-5 rating, activity tracking, and optional notes. The check-in
      ends with a free-write journal and a plan for tomorrow.

     **The six areas:**
     - **Spiritual** — Prayer, meditation, connection to God
     - **Mental/Emotional** — Therapy, CPTSD work, emotional regulation
     - **Physical** — Gym, nutrition, movement, walking the dog
     - **Recovery** — NA meetings, sponsor work, step work, honesty
     - **NIVRIA** — Building the company, 5 hours/day of consistent work
     - **Joy/Connection** — Friends, fun, social life (weekly cadence)

     ### AI Companion
     A conversational AI that knows you — not generically, but specifically. It loads your profile, recent check-ins, journal
     entries, activity bank, personal rules, and semantically similar past conversations before every response.

     The companion is designed to be direct, warm, research-informed, and honest. It doesn't do toxic positivity or empty
     affirmations. It can recognize patterns, connect present experiences to underlying dynamics, and sit with hard things without
     rushing to fix them.

     It can also create journal entries mid-conversation — say "save that as a thought" or "add that to my tasks" and it writes
     directly to your journal.

     ### AI Reflections
     After each check-in, the AI generates a personalized reflection — acknowledging what you did, noticing patterns across areas,
     and offering perspective grounded in your actual context. Not a generic wellness blurb.

     ### Tomorrow's Plan
     At the end of each check-in, plan tomorrow. The AI can suggest activities from your personal activity bank based on today's
     scores and what's been working. Suggestions come with reasoning — not just "go to the gym" but why, given what today looked
     like.

     ### Today's Schedule
     The homepage merges everything into a unified timeline: planned activities from yesterday's check-in, journal tasks and events,
      and tomorrow's plan if you've already checked in today. Each item can be edited, completed with feedback notes, or dismissed.

     ### Journal
     Three types of entries — thoughts, tasks, and events. Tasks can be marked complete with optional notes about how it went.
     Events can be added to Google Calendar. The chatbot can create entries too.

     ### Activity Bank
     A personal library of activities organized by life area. Populated with defaults (prayer, meditation, gym, NA meetings, etc.)
     and customizable. The AI references this when making suggestions.

     ### Vision Board
     Upload images that represent what you're working toward. Displayed as a grid on the homepage. Stored in cloud storage.

     ### History
     View past check-ins by week. See average scores per area, days engaged, and patterns over time.

     ### Rules & Guidance
     Tell the AI what matters to you. Rules like "don't push exercise on bad days" or "prioritize morning routines" or "I value
     stoic philosophy" are stored and injected into every AI interaction.

     ---

     ## How It's Built

     **Frontend:** React 19, TypeScript, Tailwind CSS, Vite. Installable as a PWA with offline caching via service worker.

     **Backend:** Supabase — Postgres database, authentication, file storage, and edge functions (Deno).

     **AI:** Claude (Sonnet) for all conversations, reflections, and planning. Voyage AI for semantic embeddings that let the AI
     search past context by meaning, not just recency.

     **Calendar:** Google Calendar integration via service account for viewing and creating events.

     **State:** Zustand for local state, Dexie.js (IndexedDB) for offline support.

     **Deployment:** Vercel (frontend), Supabase (backend + edge functions).

     ---

     ## The AI Memory System

     The AI doesn't start from scratch each conversation. It loads:

     1. **Your profile** — a living document of who you are, your patterns, your history, what helps and what doesn't
     2. **Your rules** — explicit guidance you've set about how the AI should interact with you
     3. **Recent check-ins** — the last 7 days of scores, activities, and journal entries
     4. **Recent journal entries** — your latest thoughts, tasks, and events
     5. **Your activity bank** — what activities are available to suggest
     6. **Semantic memory** — vector embeddings of past conversations and check-ins, searched by similarity to the current topic

     This means the AI can say "that sounds like the invisibility pattern again" or "you haven't scored physical above a 2 in four
     days" because it actually has the context to do so.

     ---

     ## Why It Exists

     Most wellness apps are built for people who need a nudge to drink more water. This one was built for someone doing the hardest
     work of their life — processing developmental trauma, maintaining recovery, building a company, and trying to show up for the
     people they love — who needed a tool that could hold all of that at once and actually pay attention.
