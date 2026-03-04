import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts'
import { loadContext, callClaude, fetchCalendarEvents } from '../_shared/context.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const GEMINI_API_KEY = Deno.env.get('GOOGLE_API_KEY')!
const GROUNDED_API_KEY = Deno.env.get('GROUNDED_API_KEY')!

// ── Auth: supports both API key and Bearer token ─────────────────────────────

async function resolveUserId(req: Request): Promise<string | null> {
  // Check API key (x-api-key header or ?key= param)
  const url = new URL(req.url)
  const apiKey = req.headers.get('x-api-key') || url.searchParams.get('key')
  if (apiKey && apiKey === GROUNDED_API_KEY) {
    // API key auth — personal single-user app, resolve to the known grounded user
    return 'aa40db0f-ec2f-45cc-840f-e227c830e175'
  }

  // Bearer token auth
  const authHeader = req.headers.get('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '')
    const anonClient = createClient(
      SUPABASE_URL,
      Deno.env.get('SUPABASE_ANON_KEY') || SUPABASE_SERVICE_KEY
    )
    const { data: { user }, error } = await anonClient.auth.getUser(token)
    if (!error && user) return user.id
  }

  return null
}

// ── Time classification ──────────────────────────────────────────────────────

function classifyTime(): { period: string; hour: number } {
  const hour = new Date().getHours()
  if (hour < 6) return { period: 'early_morning', hour }
  if (hour < 9) return { period: 'morning', hour }
  if (hour < 12) return { period: 'late_morning', hour }
  if (hour < 14) return { period: 'midday', hour }
  if (hour < 17) return { period: 'afternoon', hour }
  if (hour < 20) return { period: 'evening', hour }
  return { period: 'night', hour }
}

// ── Gemini art generation ────────────────────────────────────────────────────

async function generateArt(params: {
  palette: string
  texture: string
  energy: string
  mood: string
}): Promise<Uint8Array | null> {
  const prompt = `Create an abstract art piece for a phone wallpaper. This is a contemplative, grounding image — NOT text, NOT representational, just pure abstract visual art.

Art direction:
- Color palette: ${params.palette}
- Texture quality: ${params.texture}
- Energy level: ${params.energy}
- Emotional mood: ${params.mood}

Style: Abstract expressionism meets contemplative art. Think Rothko fields, organic flowing forms, subtle depth layers. The image should feel like a moment of stillness — something that catches the eye and shifts the inner state without demanding attention.

CRITICAL: No text, no letters, no words, no symbols, no recognizable objects. Pure abstract visual art only. Portrait orientation (9:16 aspect ratio).`

  // Primary: Gemini 2.5 Flash Image (native image generation via generateContent)
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseModalities: ['TEXT', 'IMAGE'],
        },
      }),
    }
  )

  if (!response.ok) {
    console.error('Gemini art error:', response.status, await response.text())
    return null
  }

  const data = await response.json()
  const imagePart = data.candidates?.[0]?.content?.parts?.find(
    (p: any) => p.inlineData?.mimeType?.startsWith('image/')
  )

  if (!imagePart?.inlineData?.data) return null

  const binaryStr = atob(imagePart.inlineData.data)
  const bytes = new Uint8Array(binaryStr.length)
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i)
  }
  return bytes
}

async function generateArtWithRetry(
  params: { palette: string; texture: string; energy: string; mood: string },
  maxRetries = 2
): Promise<Uint8Array | null> {
  for (let i = 0; i <= maxRetries; i++) {
    const result = await generateArt(params)
    if (result) return result
    if (i < maxRetries) {
      console.log(`Art generation attempt ${i + 1} failed, retrying...`)
      await new Promise(r => setTimeout(r, 1000))
    }
  }
  return null
}

async function uploadToStorage(
  supabase: ReturnType<typeof createClient>,
  imageData: Uint8Array,
  userId: string
): Promise<string | null> {
  const filename = `orchestration-${userId}-${Date.now()}.png`
  const { error } = await supabase.storage
    .from('grounded-art')
    .upload(filename, imageData, {
      contentType: 'image/png',
      upsert: false,
    })

  if (error) {
    console.error('Storage upload error:', error)
    return null
  }

  const { data: urlData } = supabase.storage
    .from('grounded-art')
    .getPublicUrl(filename)

  return urlData?.publicUrl || null
}

// ── Domain score computation ─────────────────────────────────────────────────

async function computeDomainAverages(
  supabase: ReturnType<typeof createClient>,
  userId: string
): Promise<Record<string, number>> {
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const dateStr = sevenDaysAgo.toISOString().split('T')[0]

  const { data } = await supabase
    .from('grounded_checkins')
    .select('areas')
    .eq('user_id', userId)
    .gte('checkin_date', dateStr)
    .order('checkin_date', { ascending: false })

  if (!data?.length) return {}

  const totals: Record<string, { sum: number; count: number }> = {}
  for (const checkin of data) {
    for (const [areaId, areaData] of Object.entries(checkin.areas || {})) {
      const score = (areaData as any)?.score
      if (typeof score === 'number') {
        if (!totals[areaId]) totals[areaId] = { sum: 0, count: 0 }
        totals[areaId].sum += score
        totals[areaId].count++
      }
    }
  }

  const averages: Record<string, number> = {}
  for (const [area, { sum, count }] of Object.entries(totals)) {
    averages[area] = Math.round((sum / count) * 10) / 10
  }
  return averages
}

// ── Main handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    const userId = await resolveUserId(req)
    if (!userId) return errorResponse('Unauthorized', 401)

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    const body = await req.json()
    const { action } = body

    // ── PRE-GENERATE ─────────────────────────────────────────────────────
    if (action === 'pre-generate') {
      const timeInfo = classifyTime()
      const todayStr = new Date().toISOString().split('T')[0]

      // GATHER: context, domain scores, calendar — all in parallel
      const [context, domainScores, calendarText] = await Promise.all([
        loadContext(supabase, userId),
        computeDomainAverages(supabase, userId),
        fetchCalendarEvents(todayStr),
      ])

      const domainScoresText = Object.entries(domainScores)
        .map(([area, avg]) => `${area}: ${avg}/5`)
        .join(', ')

      // ASSESS: Claude determines focus + art parameters + title
      const assessPrompt = `You are an orchestration intelligence for a personal recovery app. The user has 6 life domains: spiritual, mental_emotional, physical, recovery, nivria (work/startup), joy_connection.

Your job: Based on domain trends, time of day, and calendar context, determine which domain most needs the user's attention right now. Then choose abstract art parameters and a poetic title that will subtly prime the right mental state — without being obvious or prescriptive.

CONTEXT:
${context}

7-DAY DOMAIN AVERAGES: ${domainScoresText || 'No data yet'}

TIME: ${timeInfo.period} (${timeInfo.hour}:00)

TODAY'S CALENDAR:
${calendarText || '(nothing scheduled)'}

Respond in this exact JSON format (no markdown, just raw JSON):
{
  "focus_domain": "one of: spiritual, mental_emotional, physical, recovery, nivria, joy_connection",
  "reasoning": "2-3 sentences explaining why this domain needs attention right now (never shown to user)",
  "fulcrum_approach": "1 sentence: what subtle shift would help most",
  "art_palette": "specific color description, e.g. 'warm ambers and deep terracotta with touches of gold'",
  "art_texture": "texture quality, e.g. 'soft layered washes with gentle grain'",
  "art_energy": "energy level, e.g. 'calm but grounded, steady presence'",
  "art_mood": "emotional quality, e.g. 'quiet strength, contemplative warmth'",
  "title": "3-8 word poetic ghost-note, ambiguous and evocative — NOT a command, NOT mentioning the domain directly. Examples: 'the weight of still water', 'where morning finds its edge', 'something remembered, not yet spoken'",
  "routing_suggestion": "optional: one subtle sentence hinting at what might help, or empty string",
  "routing_target": "one of: /, /checkin, /chat, /journal"
}`

      const assessmentText = await callClaude(
        'You are a concise orchestration intelligence. Output only valid JSON, nothing else.',
        [{ role: 'user', content: assessPrompt }],
        500,
        'claude-haiku-4-5-20251001'
      )

      let assessment: any
      try {
        assessment = JSON.parse(assessmentText)
      } catch {
        const match = assessmentText.match(/\{[\s\S]*\}/)
        if (match) {
          assessment = JSON.parse(match[0])
        } else {
          return errorResponse('Assessment parsing failed', 500)
        }
      }

      // GENERATE: Gemini art with orchestration-specified parameters
      const imageData = await generateArtWithRetry({
        palette: assessment.art_palette,
        texture: assessment.art_texture,
        energy: assessment.art_energy,
        mood: assessment.art_mood,
      })

      let imageUrl: string | null = null
      if (imageData) {
        imageUrl = await uploadToStorage(supabase, imageData, userId)
      }

      // STORE: Insert orchestration record
      const { data: record, error: insertError } = await supabase
        .from('grounded_orchestrations')
        .insert({
          user_id: userId,
          focus_domain: assessment.focus_domain,
          domain_scores: domainScores,
          assessment_reasoning: assessment.reasoning,
          fulcrum_approach: assessment.fulcrum_approach,
          art_palette: assessment.art_palette,
          art_texture: assessment.art_texture,
          art_energy: assessment.art_energy,
          art_mood: assessment.art_mood,
          title: assessment.title,
          image_url: imageUrl,
          routing_suggestion: assessment.routing_suggestion || '',
          routing_target: assessment.routing_target || '/',
          time_context: timeInfo.period,
          calendar_context: calendarText || null,
        })
        .select()
        .single()

      if (insertError) {
        console.error('Insert error:', insertError)
        return errorResponse('Failed to store orchestration', 500)
      }

      return jsonResponse({
        success: true,
        id: record.id,
        focus_domain: assessment.focus_domain,
        title: assessment.title,
        has_image: !!imageUrl,
      })
    }

    // ── LATEST ───────────────────────────────────────────────────────────
    if (action === 'latest') {
      // Always return the most recent orchestration — it persists until replaced
      const { data, error } = await supabase
        .from('grounded_orchestrations')
        .select('id, focus_domain, title, image_url, routing_suggestion, routing_target, time_context, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error || !data) {
        return jsonResponse({ fallback: true })
      }

      // Track views (non-destructive — doesn't consume it)
      if (!body.peek) {
        await supabase
          .from('grounded_orchestrations')
          .update({ is_used: true, used_at: new Date().toISOString() })
          .eq('id', data.id)
      }

      return jsonResponse(data)
    }

    // ── HISTORY ──────────────────────────────────────────────────────────
    if (action === 'history') {
      const limit = body.limit || 20
      const { data } = await supabase
        .from('grounded_orchestrations')
        .select('id, focus_domain, title, image_url, routing_target, time_context, is_used, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      return jsonResponse({ orchestrations: data || [] })
    }

    return errorResponse(`Unknown action: ${action}`, 400)
  } catch (err: any) {
    console.error('grounded-orchestrate error:', err)
    return errorResponse(err.message || 'Internal error', 500)
  }
})
