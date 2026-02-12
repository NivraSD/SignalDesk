import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!
const VOYAGE_API_KEY = Deno.env.get('VOYAGE_API_KEY')!

// ── AI Persona ──────────────────────────────────────────────────────────────

const PERSONA = `You are the guide within Grounded — a thoughtful, spiritually-grounded companion who walks alongside the user in their daily life and recovery journey.

Important context: The user lives with Complex PTSD (CPTSD). You understand what this means — the nervous system dysregulation, the windows of tolerance, the way trauma shows up in daily life. You hold this awareness naturally without making every conversation about it. You never pathologize, never use clinical language, and never treat them as fragile. You understand that recovery isn't linear and that some days the bravest thing is just showing up.

Your character:
- Spiritual but not preachy — you draw from wisdom traditions, philosophy, and contemplative practice naturally
- Intellectually curious — you can engage deeply with ideas, concepts, and questions
- Kind and warm — your tone is that of a wise friend, never clinical or detached
- You are NOT a therapist. You don't diagnose, treat, or use clinical language
- You are a companion for reflection, growth, and honest conversation

Your role:
- Help the user process thoughts and experiences through reflective dialogue
- Offer feedback, perspectives, and gentle challenges when appropriate
- Ask good questions that deepen understanding
- Celebrate progress and normalize struggle without dismissing it
- Connect today's experiences to larger patterns and growth
- Help with planning and prioritization when asked
- You know their activity bank (activities they value in each life area) — use these when suggesting plans or activities

You have access to the user's check-in history, journal entries, tasks, activity bank, and behavioral patterns. You remember past conversations. You know their goals, rules, and preferences. You track their progress across 6 life areas: Spiritual, Mental/Emotional, Physical, Recovery, NIVRIA, Joy/Connection.

Creating journal entries:
When the user asks you to save something as a journal entry (a thought, task, or event), include this marker in your response:
<<<JOURNAL:{"entry_type":"thought","content":"the content here"}>>>
Valid entry_types: "thought", "task", "event". The content should capture the essence of what they want saved. You can include multiple entries. After the marker, acknowledge that you've saved it.

Communication style:
- Conversational, not formal. Concise — respect the user's time.
- Use paragraph form, not bullet points (unless specifically helpful)
- Don't repeat back what the user just said
- Don't start messages with "I" frequently
- Keep responses under 150 words unless the topic warrants depth`

// ── Google Calendar Helper ───────────────────────────────────────────────────

const GOOGLE_SERVICE_ACCOUNT_JSON = Deno.env.get('GOOGLE_SERVICE_ACCOUNT')
let GOOGLE_SA: any = null
try { if (GOOGLE_SERVICE_ACCOUNT_JSON) GOOGLE_SA = JSON.parse(GOOGLE_SERVICE_ACCOUNT_JSON) } catch {}

const CALENDAR_ID = 'jl@nivria.ai'

async function getGoogleAccessToken(): Promise<string | null> {
  if (!GOOGLE_SA) return null
  const now = Math.floor(Date.now() / 1000)
  const header = { alg: 'RS256', typ: 'JWT' }
  const payload = {
    iss: GOOGLE_SA.client_email,
    scope: 'https://www.googleapis.com/auth/calendar.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }
  const encoder = new TextEncoder()
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  const payloadB64 = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  const unsignedToken = `${headerB64}.${payloadB64}`

  const pemContents = GOOGLE_SA.private_key.replace(/-----BEGIN PRIVATE KEY-----/, '').replace(/-----END PRIVATE KEY-----/, '').replace(/\s/g, '')
  const binaryKey = Uint8Array.from(atob(pemContents), (c: string) => c.charCodeAt(0))
  const cryptoKey = await crypto.subtle.importKey('pkcs8', binaryKey, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign'])
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, encoder.encode(unsignedToken))
  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  const jwt = `${unsignedToken}.${signatureB64}`

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  })
  const tokenData = await tokenResponse.json()
  return tokenData.access_token || null
}

async function fetchCalendarEvents(date: string): Promise<string> {
  try {
    const accessToken = await getGoogleAccessToken()
    if (!accessToken) return ''

    const timeMin = `${date}T00:00:00Z`
    const timeMax = `${date}T23:59:59Z`
    const params = new URLSearchParams({ singleEvents: 'true', orderBy: 'startTime', timeMin, timeMax })
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDAR_ID)}/events?${params}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )
    const data = await response.json()
    const events = data.items || []
    if (events.length === 0) return ''

    const lines = events.map((e: any) => {
      const start = e.start?.dateTime ? new Date(e.start.dateTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : 'All day'
      const end = e.end?.dateTime ? new Date(e.end.dateTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : ''
      return `- ${start}${end ? ` – ${end}` : ''}: ${e.summary || '(no title)'}`
    })
    return lines.join('\n')
  } catch (e) {
    console.error('Calendar fetch for suggestions failed:', e)
    return ''
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

async function getEmbedding(text: string): Promise<number[]> {
  const resp = await fetch('https://api.voyageai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${VOYAGE_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'voyage-3-large',
      input: [text.substring(0, 32000)],
      input_type: 'query',
    }),
  })
  if (!resp.ok) throw new Error(`Voyage API error: ${resp.status}`)
  const data = await resp.json()
  return data.data[0].embedding
}

async function embedAndStore(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  contentType: string,
  contentId: string,
  text: string
) {
  try {
    const embedding = await getEmbedding(text)
    await supabase.from('grounded_embeddings').insert({
      user_id: userId,
      content_type: contentType,
      content_id: contentId,
      content_text: text.substring(0, 2000),
      embedding: `[${embedding.join(',')}]`,
    })
  } catch (e) {
    console.error('Embed failed:', e)
  }
}

async function searchSimilar(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  queryText: string,
  limit = 5
) {
  try {
    const embedding = await getEmbedding(queryText)
    const { data } = await supabase.rpc('grounded_match_embeddings', {
      query_embedding: `[${embedding.join(',')}]`,
      match_user_id: userId,
      match_count: limit,
      match_threshold: 0.3,
    })
    return data || []
  } catch (e) {
    console.error('Similarity search failed:', e)
    return []
  }
}

async function loadContext(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  queryText?: string
) {
  // Run all context queries in parallel
  const [profileRes, rulesRes, checkinsRes, journalRes, activitiesRes, similarRes] = await Promise.all([
    supabase
      .from('grounded_user_profile')
      .select('profile_context, patterns')
      .eq('user_id', userId)
      .single(),
    supabase
      .from('grounded_user_rules')
      .select('rule_text, category')
      .eq('user_id', userId)
      .eq('is_active', true),
    supabase
      .from('grounded_checkins')
      .select('checkin_date, areas, journal, tomorrow_schedule')
      .eq('user_id', userId)
      .order('checkin_date', { ascending: false })
      .limit(7),
    supabase
      .from('grounded_journal_entries')
      .select('entry_type, content, entry_date, entry_time, notes, completion_notes')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(15),
    supabase
      .from('grounded_activities')
      .select('area_id, name')
      .eq('user_id', userId),
    queryText ? searchSimilar(supabase, userId, queryText, 5) : Promise.resolve([]),
  ])

  const parts: string[] = []

  // User profile
  if (profileRes.data?.profile_context) {
    parts.push(`## User Profile\n${profileRes.data.profile_context}`)
  }

  // User rules
  if (rulesRes.data?.length) {
    parts.push(
      `## User's Rules & Preferences\n${rulesRes.data.map((r: { rule_text: string }) => `- ${r.rule_text}`).join('\n')}`
    )
  }

  // Recent check-ins
  if (checkinsRes.data?.length) {
    const text = checkinsRes.data
      .map((c: { checkin_date: string; areas: Record<string, { score?: number }>; journal?: string }) => {
        const areas = Object.entries(c.areas || {})
          .map(([id, d]) => `${id}: ${d.score || '?'}/5`)
          .join(', ')
        return `${c.checkin_date}: ${areas}${c.journal ? ` | "${c.journal.substring(0, 80)}"` : ''}`
      })
      .join('\n')
    parts.push(`## Recent Check-ins (last 7 days)\n${text}`)
  }

  // Recent journal entries
  if (journalRes.data?.length) {
    const text = journalRes.data
      .map(
        (j: { entry_type: string; entry_date: string; content: string; notes?: string }) =>
          `[${j.entry_type}] ${j.entry_date}: ${j.content.substring(0, 100)}${j.notes ? ` (note: ${j.notes.substring(0, 50)})` : ''}`
      )
      .join('\n')
    parts.push(`## Recent Journal Entries\n${text}`)
  }

  // Activity bank
  if (activitiesRes.data?.length) {
    const byArea: Record<string, string[]> = {}
    for (const a of activitiesRes.data) {
      if (!byArea[a.area_id]) byArea[a.area_id] = []
      byArea[a.area_id].push(a.name)
    }
    const text = Object.entries(byArea)
      .map(([area, acts]) => `- ${area}: ${acts.join(', ')}`)
      .join('\n')
    parts.push(`## Activity Bank (activities they value)\n${text}`)
  }

  // Semantically similar past context
  if (similarRes.length) {
    parts.push(
      `## Relevant Past Context (from memory)\n${similarRes.map((r: { content_text: string }) => r.content_text.substring(0, 200)).join('\n---\n')}`
    )
  }

  return parts.join('\n\n')
}

async function callClaude(
  systemPrompt: string,
  messages: { role: string; content: string }[],
  maxTokens = 800
) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: maxTokens,
      system: systemPrompt,
      messages,
    }),
  })
  const result = await response.json()
  return result.content?.[0]?.text || ''
}

// ── Main handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    // Auth
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return errorResponse('Missing authorization header', 401)

    const token = authHeader.replace('Bearer ', '')
    const anonClient = createClient(
      SUPABASE_URL,
      Deno.env.get('SUPABASE_ANON_KEY') || SUPABASE_SERVICE_KEY
    )
    const {
      data: { user },
      error: authError,
    } = await anonClient.auth.getUser(token)
    if (authError || !user) return errorResponse('Unauthorized', 401)

    const userId = user.id
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    const { action, ...payload } = await req.json()

    // ── CHAT ────────────────────────────────────────────────────────────────
    if (action === 'chat') {
      const { message } = payload

      // Load context + recent chat history in parallel
      const [context, historyRes] = await Promise.all([
        loadContext(supabase, userId, message),
        supabase
          .from('grounded_chat_messages')
          .select('role, content')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(20),
      ])

      const chatHistory = (historyRes.data || []).reverse()
      const systemPrompt = `${PERSONA}\n\n---\n\n${context}`
      const messages = [...chatHistory, { role: 'user', content: message }]

      const rawResponse = await callClaude(systemPrompt, messages)

      // Parse journal entry markers from response
      const journalPattern = /<<<JOURNAL:(.*?)>>>/gs
      const journalEntries: { entry_type: string; content: string }[] = []
      let match
      while ((match = journalPattern.exec(rawResponse)) !== null) {
        try {
          const entry = JSON.parse(match[1])
          if (entry.content) {
            journalEntries.push({
              entry_type: entry.entry_type || 'thought',
              content: entry.content,
            })
          }
        } catch { /* skip malformed */ }
      }

      // Create journal entries in DB
      const today = new Date().toISOString().split('T')[0]
      for (const entry of journalEntries) {
        await supabase.from('grounded_journal_entries').insert({
          user_id: userId,
          entry_type: entry.entry_type,
          content: entry.content,
          entry_date: today,
          completed: false,
        })
      }

      // Clean markers from the display message
      const assistantMessage = rawResponse.replace(/<<<JOURNAL:.*?>>>/gs, '').trim()

      // Save messages to history
      await supabase.from('grounded_chat_messages').insert([
        { user_id: userId, role: 'user', content: message },
        { user_id: userId, role: 'assistant', content: assistantMessage },
      ])

      // Embed user message in background (fire and forget)
      embedAndStore(supabase, userId, 'chat', crypto.randomUUID(), message)

      return jsonResponse({
        message: assistantMessage,
        journal_entries_created: journalEntries.length > 0 ? journalEntries : undefined,
      })
    }

    // ── REFLECTION (post check-in) ──────────────────────────────────────────
    if (action === 'reflection') {
      const { checkIn } = payload
      if (!checkIn) return errorResponse('Missing checkIn data', 400)

      const context = await loadContext(supabase, userId)

      const areasText = Object.entries(checkIn.areas || {})
        .map(([areaId, data]: [string, any]) => {
          const activities = data.activities?.length
            ? data.activities.join(', ')
            : data.whatDidYouDo || 'nothing logged'
          const did = data.didSomething
            ? `Did: ${activities}`
            : `Didn't engage${data.reasonNotDone ? ` (${data.reasonNotDone})` : ''}`
          return `- ${areaId}: Score ${data.score || '?'}/5. ${did}${data.notes ? `. Notes: ${data.notes}` : ''}`
        })
        .join('\n')

      const journalText = checkIn.journal ? `\nJournal entry: "${checkIn.journal}"` : ''

      const reflectionPrompt = `The user just completed their daily check-in. Write a thoughtful, personalized 3-4 paragraph reflection.

Here's their check-in:
${areasText}
${journalText}

Be warm but not saccharine. Acknowledge specific things they did or felt. If they struggled somewhere, normalize it without dismissing it. If they showed up in an area, name what that means. End with one gentle, specific encouragement for tomorrow.

Write in a natural, conversational voice. Keep it under 200 words.`

      const systemPrompt = `${PERSONA}\n\n---\n\n${context}`
      const reflection = await callClaude(
        systemPrompt,
        [{ role: 'user', content: reflectionPrompt }],
        400
      )

      // Embed the check-in content for future memory
      const embedText = `Check-in ${checkIn.checkin_date}: ${areasText}${journalText}`
      embedAndStore(supabase, userId, 'checkin', checkIn.checkin_date || crypto.randomUUID(), embedText)

      // Also embed the reflection
      embedAndStore(supabase, userId, 'reflection', crypto.randomUUID(), reflection)

      return jsonResponse({ reflection })
    }

    // ── SUGGEST PLAN ────────────────────────────────────────────────────────
    if (action === 'suggest-plan') {
      const { checkIn, activityBank } = payload
      if (!checkIn || !activityBank) return errorResponse('Missing checkIn or activityBank', 400)

      // Fetch tomorrow's calendar events and context in parallel
      const tomorrowDate = new Date()
      tomorrowDate.setDate(tomorrowDate.getDate() + 1)
      const tomorrowStr = tomorrowDate.toISOString().split('T')[0]

      const [context, calendarText] = await Promise.all([
        loadContext(supabase, userId),
        fetchCalendarEvents(tomorrowStr),
      ])

      const areasText = Object.entries(checkIn.areas || {})
        .map(([areaId, data]: [string, any]) => {
          const activities = data.activities?.length
            ? data.activities.join(', ')
            : data.whatDidYouDo || 'none'
          return `- ${areaId}: Score ${data.score || '?'}/5, did: ${activities}`
        })
        .join('\n')

      const bankText = Object.entries(activityBank || {})
        .map(
          ([areaId, activities]: [string, any]) =>
            `- ${areaId}: ${(activities as string[]).join(', ')}`
        )
        .join('\n')

      const calendarSection = calendarText
        ? `\n\nThe user's calendar for tomorrow (${tomorrowStr}):\n${calendarText}\n\nIMPORTANT: Schedule activities around these existing commitments. Don't suggest activities during times that conflict with calendar events. Reference the calendar when explaining your time suggestions.`
        : ''

      const planPrompt = `Based on the user's check-in today, their activity bank, their calendar, and what you know about their patterns and preferences, suggest ONE specific activity per life area for tomorrow.

Today's check-in:
${areasText}

Their activity bank:
${bankText}${calendarSection}

For each of the 6 areas (spiritual, mental_emotional, physical, recovery, nivria, joy_connection), suggest exactly ONE activity from their bank that would be most beneficial. If they scored low, suggest something gentle. If high, build on momentum. Suggest a specific time of day (Morning, Afternoon, Evening) that works around their calendar.

Respond in this exact JSON format (no markdown, just raw JSON):
{
  "suggestions": {
    "spiritual": { "activity": "...", "timeOfDay": "Morning", "reason": "one sentence" },
    "mental_emotional": { "activity": "...", "timeOfDay": "...", "reason": "..." },
    "physical": { "activity": "...", "timeOfDay": "...", "reason": "..." },
    "recovery": { "activity": "...", "timeOfDay": "...", "reason": "..." },
    "nivria": { "activity": "...", "timeOfDay": "...", "reason": "..." },
    "joy_connection": { "activity": "...", "timeOfDay": "...", "reason": "..." }
  }
}`

      const systemPrompt = `${PERSONA}\n\n---\n\n${context}`
      const text = await callClaude(systemPrompt, [{ role: 'user', content: planPrompt }], 600)

      try {
        const parsed = JSON.parse(text)
        return jsonResponse(parsed)
      } catch {
        const match = text.match(/\{[\s\S]*\}/)
        if (match) return jsonResponse(JSON.parse(match[0]))
        return jsonResponse({ suggestions: {}, raw: text })
      }
    }

    // ── UPDATE PROFILE ──────────────────────────────────────────────────────
    if (action === 'update-profile') {
      // Load current profile and recent data
      const [profileRes, checkinsRes, chatRes] = await Promise.all([
        supabase
          .from('grounded_user_profile')
          .select('profile_context, patterns')
          .eq('user_id', userId)
          .single(),
        supabase
          .from('grounded_checkins')
          .select('checkin_date, areas, journal')
          .eq('user_id', userId)
          .order('checkin_date', { ascending: false })
          .limit(14),
        supabase
          .from('grounded_chat_messages')
          .select('role, content, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(30),
      ])

      const currentProfile = profileRes.data?.profile_context || ''

      const checkinsText = (checkinsRes.data || [])
        .map((c: any) => {
          const areas = Object.entries(c.areas || {})
            .map(([id, d]: [string, any]) => `${id}:${d.score || '?'}`)
            .join(', ')
          return `${c.checkin_date}: ${areas}${c.journal ? ` "${c.journal.substring(0, 80)}"` : ''}`
        })
        .join('\n')

      const recentChat = (chatRes.data || [])
        .reverse()
        .map((m: any) => `${m.role}: ${m.content.substring(0, 100)}`)
        .join('\n')

      const updatePrompt = `You are maintaining a living profile document about this user. Update the profile based on new data.

Current profile:
${currentProfile || '(empty — this is the first profile build)'}

Recent check-ins (last 14 days):
${checkinsText || '(none)'}

Recent conversations:
${recentChat || '(none)'}

Write an updated profile (max 500 words) that captures:
- Who they are: personality, values, what matters to them
- Patterns: what areas they're strong/weak in, consistency trends
- Goals and aspirations they've expressed
- Things that help them vs things that don't
- Key life context (work, relationships, challenges)
- Recovery-specific observations

Preserve important existing information. Add new insights. Remove anything no longer relevant. Write in third person ("The user...").`

      const updatedProfile = await callClaude(
        'You are a concise profile writer. Output only the profile text, nothing else.',
        [{ role: 'user', content: updatePrompt }],
        800
      )

      // Upsert profile
      await supabase.from('grounded_user_profile').upsert(
        {
          user_id: userId,
          profile_context: updatedProfile,
          last_updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )

      return jsonResponse({ profile: updatedProfile })
    }

    // ── GET HISTORY ─────────────────────────────────────────────────────────
    if (action === 'get-history') {
      // Fetch most recent 100 messages (ordered newest first), then reverse for chronological display
      const { data } = await supabase
        .from('grounded_chat_messages')
        .select('id, role, content, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100)

      // Reverse to show oldest first (chronological order for chat UI)
      const messages = (data || []).reverse()
      return jsonResponse({ messages })
    }

    // ── EMBED CONTENT ───────────────────────────────────────────────────────
    if (action === 'embed-content') {
      const { contentType, contentId, text } = payload
      if (!contentType || !text) return errorResponse('Missing contentType or text', 400)

      await embedAndStore(
        supabase,
        userId,
        contentType,
        contentId || crypto.randomUUID(),
        text
      )

      return jsonResponse({ success: true })
    }

    return errorResponse(`Unknown action: ${action}`, 400)
  } catch (err: any) {
    console.error('grounded-chat error:', err)
    return errorResponse(err.message || 'Internal error', 500)
  }
})
