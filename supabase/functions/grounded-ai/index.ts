import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    // Verify JWT
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return errorResponse('Missing authorization header', 401)

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await createClient(
      SUPABASE_URL,
      Deno.env.get('SUPABASE_ANON_KEY') || SUPABASE_SERVICE_KEY
    ).auth.getUser(token)

    if (authError || !user) return errorResponse('Unauthorized', 401)

    const { action, checkIn, activityBank } = await req.json()

    // Generate AI reflection after check-in
    if (action === 'reflection') {
      if (!checkIn) return errorResponse('Missing checkIn data', 400)

      const areasText = Object.entries(checkIn.areas || {}).map(([areaId, data]: [string, any]) => {
        const activities = data.activities?.length ? data.activities.join(', ') : data.whatDidYouDo || 'nothing logged'
        const did = data.didSomething ? `Did: ${activities}` : `Didn't engage${data.reasonNotDone ? ` (${data.reasonNotDone})` : ''}`
        return `- ${areaId}: Score ${data.score || '?'}/5. ${did}${data.notes ? `. Notes: ${data.notes}` : ''}`
      }).join('\n')

      const journalText = checkIn.journal ? `\nJournal entry: "${checkIn.journal}"` : ''

      const prompt = `You are a compassionate wellness coach for someone in recovery. They just completed their daily check-in across 6 life areas (Spiritual, Mental/Emotional, Physical, Recovery, NIVRIA, Joy/Connection).

Here's their check-in data:
${areasText}
${journalText}

Write a thoughtful, personalized 3-4 paragraph reflection. Be warm but not saccharine. Acknowledge specific things they did or felt. If they struggled somewhere, normalize it without dismissing it. If they showed up in an area, name what that means. End with one gentle, specific encouragement for tomorrow.

Do NOT use bullet points or headers. Write in a natural, conversational voice like a supportive friend who truly understands recovery. Keep it under 200 words.`

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 400,
          messages: [{ role: 'user', content: prompt }],
        }),
      })

      const result = await response.json()
      const reflection = result.content?.[0]?.text || ''
      return jsonResponse({ reflection })
    }

    // Generate AI tomorrow plan suggestions
    if (action === 'suggest-plan') {
      if (!checkIn || !activityBank) return errorResponse('Missing checkIn or activityBank', 400)

      const areasText = Object.entries(checkIn.areas || {}).map(([areaId, data]: [string, any]) => {
        const activities = data.activities?.length ? data.activities.join(', ') : data.whatDidYouDo || 'none'
        return `- ${areaId}: Score ${data.score || '?'}/5, did: ${activities}`
      }).join('\n')

      const bankText = Object.entries(activityBank || {}).map(([areaId, activities]: [string, any]) => {
        return `- ${areaId}: ${(activities as string[]).join(', ')}`
      }).join('\n')

      const prompt = `You are a wellness coach helping someone in recovery plan their tomorrow. Based on their check-in today and their activity bank, suggest ONE specific activity per life area for tomorrow.

Today's check-in:
${areasText}

Their activity bank (activities they enjoy/value):
${bankText}

For each of the 6 areas (spiritual, mental_emotional, physical, recovery, nivria, joy_connection), suggest exactly ONE activity from their bank that would be most beneficial given how today went. If they scored low, suggest something gentle. If they scored high, suggest something that builds on momentum.

Also suggest a time of day (Morning, Afternoon, Evening) for each.

Respond in this exact JSON format (no markdown, just raw JSON):
{
  "suggestions": {
    "spiritual": { "activity": "...", "timeOfDay": "Morning", "reason": "one sentence why" },
    "mental_emotional": { "activity": "...", "timeOfDay": "...", "reason": "..." },
    "physical": { "activity": "...", "timeOfDay": "...", "reason": "..." },
    "recovery": { "activity": "...", "timeOfDay": "...", "reason": "..." },
    "nivria": { "activity": "...", "timeOfDay": "...", "reason": "..." },
    "joy_connection": { "activity": "...", "timeOfDay": "...", "reason": "..." }
  }
}`

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 600,
          messages: [{ role: 'user', content: prompt }],
        }),
      })

      const result = await response.json()
      const text = result.content?.[0]?.text || '{}'
      try {
        const parsed = JSON.parse(text)
        return jsonResponse(parsed)
      } catch {
        // Try extracting JSON from the response
        const match = text.match(/\{[\s\S]*\}/)
        if (match) {
          return jsonResponse(JSON.parse(match[0]))
        }
        return jsonResponse({ suggestions: {}, raw: text })
      }
    }

    return errorResponse(`Unknown action: ${action}`, 400)
  } catch (err) {
    console.error('grounded-ai error:', err)
    return errorResponse(err.message || 'Internal error', 500)
  }
})
