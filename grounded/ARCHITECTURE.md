# Grounded - Architecture Overview

Personal wellness and recovery tracker PWA. Built with React 19 + TypeScript + Tailwind CSS + Vite. Supabase backend. Claude AI for reflections, chat, and planning. Voyage AI for semantic memory.

**Live:** https://grounded-sepia.vercel.app
**Supabase:** zskaxjtyuaqazydouifp.supabase.co
**Edge functions live in:** `/Users/jonathanliebowitz/Desktop/signaldesk-v3/supabase/functions/`

---

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19, TypeScript 5.9, Vite 7, Tailwind CSS 4 |
| State | Zustand (persisted activity bank), React hooks |
| Routing | React Router 7 |
| Backend | Supabase (Postgres + Auth + Storage + Edge Functions) |
| AI | Claude Sonnet 4 (reflections, chat, planning), Voyage AI `voyage-3-large` (1024D embeddings) |
| Offline | Dexie.js (IndexedDB), vite-plugin-pwa (service worker) |
| Calendar | Google Calendar API v3 via service account |
| Deploy | Vercel (frontend), Supabase (functions + DB) |
| Icons | Lucide React |

---

## 6 Life Areas

| Area | Icon | Focus |
|------|------|-------|
| Spiritual | Star of David | Prayer, meditation, God connection |
| Mental/Emotional | Diamond | Therapy, CPTSD work, emotional regulation |
| Physical | Circle | Gym, nutrition, movement |
| Recovery | Triangle | NA meetings, sponsor, step work |
| NIVRIA | Diamond outline | Work sessions, fundraising, CTO conversations |
| Joy/Connection | Sun | Friends, fun, social (weekly cadence) |

Defined in `src/lib/constants.ts` as `AREAS[]`.

---

## Routes

| Path | Component | Purpose |
|------|-----------|---------|
| `/` | HomePage | Dashboard: quote, vision board, pyramid, today's schedule, check-in status |
| `/checkin` | CheckInFlow | Multi-step wizard: score each area, journal, plan tomorrow |
| `/feedback` | FeedbackView | AI-generated reflection after check-in |
| `/journal` | JournalPage | Create/manage thoughts, tasks, events |
| `/chat` | ChatPage | AI companion chat with semantic memory |
| `/vision` | VisionBoard | Image grid (Supabase Storage) |
| `/activities` | ActivityBankManager | Manage activity bank per area |
| `/calendar` | CalendarPage | View Google Calendar events |
| `/reminders` | RemindersPage | Create/manage recurring reminders |
| `/history` | HistoryPage | Past check-ins + weekly score averages |
| `/settings` | SettingsPage | AI rules & guidance, user prefs, logout |
| `/login` | LoginPage | Email/password auth |

Bottom nav: Home, Add, Chat, Activities, History

---

## Database Tables

All tables use RLS (users can only access their own rows).

### Core Tables

| Table | Key Columns | Purpose |
|-------|-------------|---------|
| `grounded_checkins` | user_id, checkin_date (unique pair), areas (JSONB), journal, tomorrow_schedule (JSONB) | Daily check-in data |
| `grounded_journal_entries` | user_id, entry_type (thought/task/event), content, entry_date, entry_time, completed, notes, completion_notes | Journal entries |
| `grounded_activities` | user_id, area_id, name, is_default | Activity bank |
| `grounded_vision_board` | user_id, image_url, position_order | Vision board images |
| `grounded_reminders` | user_id, title, time, frequency, days (JSONB), enabled | Recurring reminders |
| `grounded_user_settings` | user_id (unique), display_name, timezone, google_calendar_enabled | User preferences |
| `grounded_google_tokens` | user_id (unique), access_token, refresh_token, expires_at | Calendar OAuth tokens |

### AI Memory Tables

| Table | Key Columns | Purpose |
|-------|-------------|---------|
| `grounded_chat_messages` | user_id, role (user/assistant), content, metadata (JSONB) | Chat history |
| `grounded_user_profile` | user_id (unique), profile_context (text), patterns (JSONB) | Living AI profile document (accumulated context) |
| `grounded_user_rules` | user_id, rule_text, category, is_active | User-defined rules that guide AI behavior |
| `grounded_embeddings` | user_id, content_type, content_id, content_text, embedding (vector(1024)), metadata | Semantic memory via pgvector |

### Key Functions

| Function | Purpose |
|----------|---------|
| `grounded_match_embeddings(query_embedding, user_id, match_count, threshold)` | Vector similarity search over user's embeddings |

### Storage

- **Bucket:** `grounded-images` (public, 10MB limit)
- **Path pattern:** `{user_id}/{timestamp}-{filename}`

---

## Edge Functions

All deployed from `signaldesk-v3/supabase/functions/`. All require Bearer token auth.

### `grounded-chat` (Unified AI Brain)

The main AI function. Single endpoint, multiple actions.

**Persona:** Spiritual, academic, kind companion. Aware of CPTSD. Not a therapist. Uses activity bank for suggestions. Can create journal entries from conversation.

| Action | Input | Output | What it does |
|--------|-------|--------|--------------|
| `chat` | `{ message }` | `{ message, journal_entries_created[] }` | Full context chat (profile, rules, check-ins, journal, activity bank, vector search). Parses `<<<JOURNAL:{...}>>>` markers to create entries. |
| `get-history` | — | `{ messages[] }` | Returns recent chat messages |
| `reflection` | `{ checkIn }` | `{ reflection }` | Generates AI reflection on today's check-in |
| `suggest-plan` | `{ checkIn, activityBank }` | `{ suggestions }` | Suggests 1-2 activities per area for tomorrow |
| `update-profile` | — | `{ success }` | Claude rewrites living profile from recent check-ins + conversations |
| `embed-content` | `{ content, content_type, content_id }` | `{ success }` | Embeds content via Voyage AI, stores in grounded_embeddings |

**Context loading** (`loadContext()`): Fetches in parallel — user profile, rules, last 7 check-ins, last 15 journal entries, activity bank, top 5 vector-similar past entries.

### `grounded-calendar`

| Action | Input | Output |
|--------|-------|--------|
| `get-events` | `{ calendarId, timeMin, timeMax }` | `{ items[] }` |
| `create-event` | `{ calendarId, event }` | `{ id }` |

Uses Google service account (no user OAuth needed). Calendar ID: `jl@nivria.ai`.

### `grounded-google-auth`

| Action | Input | Output |
|--------|-------|--------|
| `exchange` | `{ code, redirect_uri }` | `{ access_token, expires_in }` |
| `refresh` | — | `{ access_token, expires_in }` |

### `grounded-ai` (Legacy)

Older standalone AI function. `grounded-chat` supersedes this for most actions.

---

## Hooks

| Hook | State | Key Methods |
|------|-------|-------------|
| `useAuth` | user, loading | signIn, signUp, signOut |
| `useCheckins` | checkIns[], todayCheckIn | loadCheckIns, saveCheckIn |
| `useJournal` | entries[], loading | addEntry, updateEntry, deleteEntry, toggleComplete |
| `useChat` | messages[], loading, historyLoaded | loadHistory, sendMessage, clearHistory |
| `useGroundedAI` | — | getReflection, getSuggestions, updateProfile, callAI |
| `useActivities` | activities[], activityBank | loadActivities, addActivity, removeActivity |
| `useCalendar` | — | fetchTodayEvents, createEvent |
| `useVisionBoard` | items[] | loadItems, addImage, removeImage |
| `useReminders` | reminders[], loading | loadReminders, addReminder, updateReminder, deleteReminder |

---

## Key Components

### `TodaySchedule` (Homepage)
Merges 3 data sources into a unified timeline:
1. Today's planned activities (from yesterday's check-in `tomorrow_schedule`)
2. Tomorrow's planned activities (from today's check-in)
3. Journal tasks/events for today

Features: inline editing, completion with feedback notes, dismiss items, add to Google Calendar. Items sorted by time of day. Color-coded by area.

### `CheckInFlow` (Multi-step wizard)
Steps 0-5: Score each area (1-5), mark activities done, select from activity bank.
Step 6: Free-write journal.
Step 7: Plan tomorrow (with optional AI suggestions).
Saves to `grounded_checkins`, then navigates to `/feedback`.

### `ChatPage`
Auto-scrolling chat with suggestion chips on empty state. Auto-resize textarea. Shift+Enter for newline. Shows notification when AI creates journal entries from conversation.

### `SettingsPage`
AI Rules & Guidance section: CRUD for user rules that are injected into AI system prompt. Toggle active/inactive. Examples: "Prioritize morning routines", "Don't push exercise on bad days".

---

## File Structure

```
grounded/
├── src/
│   ├── App.tsx                    # Routes + auth guard
│   ├── main.tsx                   # Entry point
│   ├── components/
│   │   ├── shell/                 # AppShell, BottomNav
│   │   ├── auth/                  # LoginPage
│   │   ├── home/                  # HomePage, DailyQuote, PyramidSection, TodaySchedule
│   │   ├── checkin/               # CheckInFlow
│   │   ├── feedback/              # FeedbackView
│   │   ├── journal/               # JournalPage
│   │   ├── chat/                  # ChatPage
│   │   ├── vision/                # VisionBoard
│   │   ├── activities/            # ActivityBankManager
│   │   ├── calendar/              # CalendarPage
│   │   ├── reminders/             # RemindersPage
│   │   ├── history/               # HistoryPage
│   │   └── settings/              # SettingsPage
│   ├── hooks/                     # 9 custom hooks (see table above)
│   ├── stores/
│   │   └── groundedStore.ts       # Zustand (userId, todayCheckIn, activityBank)
│   ├── types/
│   │   └── index.ts               # All TypeScript interfaces
│   └── lib/
│       ├── supabase.ts            # Supabase client init
│       ├── constants.ts           # AREAS, quotes, defaults, activity bank
│       ├── utils.ts               # Date/time helpers, greeting, quote rotation
│       ├── offline-db.ts          # Dexie IndexedDB schema
│       └── google-calendar.ts     # Calendar URL builders
├── public/icons/                  # PWA icons (192, 512, maskable)
├── vite.config.ts                 # Vite + PWA + Tailwind config
├── vercel.json                    # SPA rewrite rule
└── .env                           # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY

signaldesk-v3/supabase/
├── functions/
│   ├── grounded-chat/index.ts     # Unified AI brain
│   ├── grounded-calendar/index.ts # Google Calendar service account
│   ├── grounded-google-auth/index.ts # OAuth token exchange
│   └── grounded-ai/index.ts       # Legacy AI function
└── migrations/
    ├── 20260130_grounded_schema.sql      # Core tables
    └── 20260201_grounded_ai_memory.sql   # AI memory tables + pgvector
```

---

## Environment Variables

### Frontend (`.env`)
```
VITE_SUPABASE_URL=https://zskaxjtyuaqazydouifp.supabase.co
VITE_SUPABASE_ANON_KEY=...
```

### Edge Functions (Supabase secrets)
```
ANTHROPIC_API_KEY        # Claude API
VOYAGE_API_KEY           # Voyage AI embeddings
GOOGLE_SERVICE_ACCOUNT   # Google Calendar service account JSON
SUPABASE_URL             # Auto-provided
SUPABASE_SERVICE_ROLE_KEY # Auto-provided
```

---

## Migrations

Run in order in Supabase SQL Editor:

1. `20260130_grounded_schema.sql` — Core tables, RLS, storage bucket
2. `20260201_grounded_ai_memory.sql` — AI memory tables, pgvector, embedding function, journal columns (notes, completion_notes)

---

## Deploy Commands

```bash
# Frontend
cd ~/Desktop/grounded && npx vercel --yes --prod

# Edge functions
cd ~/Desktop/signaldesk-v3 && /opt/homebrew/bin/supabase functions deploy grounded-chat --project-ref zskaxjtyuaqazydouifp

# DB migrations
# Run SQL files in Supabase Dashboard SQL Editor
```
