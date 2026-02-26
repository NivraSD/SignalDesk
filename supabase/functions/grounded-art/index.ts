import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const GOOGLE_API_KEY = Deno.env.get('GOOGLE_API_KEY')!

// ── Style Dimensions ────────────────────────────────────────────────────────

const PALETTES = [
  'warm earth tones — terracotta, ochre, burnt sienna',
  'cool ocean blues — cerulean, teal, seafoam, deep navy',
  'muted pastels — dusty rose, sage, lavender, cream',
  'deep jewel tones — emerald, sapphire, amethyst, ruby',
  'monochrome with one accent — grays and charcoals with a single vivid color',
  'sunset gradients — coral, amber, magenta fading into indigo',
  'storm grays — slate, pewter, silver with flashes of white',
  'forest depths — moss, pine, umber, gold-green',
  'desert warmth — sand, rust, bone white, turquoise',
  'arctic light — ice blue, white, pale violet, silver',
]

const TEXTURES = [
  'fluid watercolor bleeding at the edges',
  'sharp geometric fragments and clean lines',
  'soft diffused light through frosted glass',
  'heavy impasto with visible brushstrokes and texture',
  'ink wash with controlled gradients',
  'torn paper collage with layered depths',
  'smoke and vapor dissolving into space',
  'woven textile patterns and organic fibers',
  'cracked earth and natural erosion patterns',
  'crystalline formations catching light',
]

const ENERGIES = [
  'still and contemplative, like a held breath',
  'dynamic and swirling, caught mid-motion',
  'tension between order and chaos',
  'slow dissolve, one state becoming another',
  'emerging from darkness into quiet light',
  'gentle drift, like something carried by water',
  'gathering — things moving toward a center',
  'expanding outward from a single point',
  'suspended — frozen between falling and rising',
  'rhythmic pulse, like a heartbeat made visible',
]

const MOODS = [
  'melancholy beauty — sadness that holds something precious',
  'quiet resilience — standing steady without force',
  'the weight before relief — pressure about to lift',
  'something shifting — the moment between what was and what will be',
  'holding on — tenderness in persistence',
  'unresolved but present — sitting with what is',
  'small wonder — noticing something usually missed',
  'earned stillness — rest after effort',
  'gentle defiance — softness as strength',
  'the space after letting go',
]

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function buildPromptSeed() {
  return {
    palette: pickRandom(PALETTES),
    texture: pickRandom(TEXTURES),
    energy: pickRandom(ENERGIES),
    mood: pickRandom(MOODS),
  }
}

// ── Gemini Image Generation ─────────────────────────────────────────────────

async function generateArt(
  seed: ReturnType<typeof buildPromptSeed>,
  recentTitles: string[]
): Promise<{ imageBase64: string; mimeType: string; title: string }> {
  const avoidSection = recentTitles.length > 0
    ? `\n\nTITLES ALREADY USED — do not repeat these or anything similar:\n${recentTitles.map(t => `- "${t}"`).join('\n')}`
    : ''

  const prompt = `Create an abstract, non-representational artwork. This is for a contemplative lock screen — it should be visually arresting but calm enough to glance at daily.

STRICT RULES:
- NO people, faces, hands, bodies, or silhouettes
- NO text, letters, numbers, or symbols
- NO recognizable objects (no trees, buildings, animals, etc.)
- Pure abstraction only — shapes, colors, light, texture, movement

STYLE DIRECTION FOR THIS PIECE:
- Color palette: ${seed.palette}
- Texture: ${seed.texture}
- Energy: ${seed.energy}
- Emotional quality: ${seed.mood}

The image should feel like it belongs in a museum of contemplative art. Portrait orientation (9:16 aspect ratio) optimized for a phone lock screen.

Also provide a short poetic title (3-8 words) that evokes the emotional quality without being literal or describing what's in the image. The title should feel like a line from a poem. Format it exactly as:
TITLE: <your title here>${avoidSection}`

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${GOOGLE_API_KEY}`

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseModalities: ['IMAGE', 'TEXT'],
        temperature: 1.0,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
      },
    }),
  })

  if (!response.ok) {
    const errText = await response.text()
    console.error('Gemini API error:', response.status, errText)
    throw new Error(`Gemini API error: ${response.status}`)
  }

  const data = await response.json()
  const parts = data.candidates?.[0]?.content?.parts
  if (!parts || parts.length === 0) {
    throw new Error('No content in Gemini response')
  }

  let imageBase64 = ''
  let mimeType = 'image/png'
  let textContent = ''

  for (const part of parts) {
    if (part.inlineData?.data) {
      imageBase64 = part.inlineData.data
      mimeType = part.inlineData.mimeType || 'image/png'
    }
    if (part.text) {
      textContent += part.text
    }
  }

  if (!imageBase64) {
    throw new Error('No image data in Gemini response')
  }

  // Extract title from text
  let title = 'Untitled Moment'
  const titleMatch = textContent.match(/TITLE:\s*(.+)/i)
  if (titleMatch) {
    title = titleMatch[1].trim().replace(/^["']|["']$/g, '')
  }

  return { imageBase64, mimeType, title }
}

// ── Storage Upload ──────────────────────────────────────────────────────────

async function uploadToStorage(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  imageBase64: string,
  mimeType: string
): Promise<string> {
  const fileExt = mimeType.includes('jpeg') || mimeType.includes('jpg') ? 'jpg' : 'png'
  const fileName = `${userId}/${crypto.randomUUID()}.${fileExt}`

  // Decode base64 to Uint8Array
  const binaryString = atob(imageBase64)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }

  const { error: uploadError } = await supabase.storage
    .from('grounded-art')
    .upload(fileName, bytes, {
      contentType: mimeType,
      upsert: false,
    })

  if (uploadError) {
    console.error('Storage upload error:', uploadError)
    throw new Error(`Storage upload failed: ${uploadError.message}`)
  }

  const { data: urlData } = supabase.storage
    .from('grounded-art')
    .getPublicUrl(fileName)

  return urlData.publicUrl
}

// ── Auth Helper ─────────────────────────────────────────────────────────────

async function resolveUserId(req: Request): Promise<string | null> {
  // Option 1: API key via x-api-key header or ?key= query param
  const url = new URL(req.url)
  const apiKey = req.headers.get('x-api-key') || url.searchParams.get('key')
  if (apiKey) {
    const svc = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    const { data } = await svc
      .from('grounded_api_keys')
      .select('user_id')
      .eq('api_key', apiKey)
      .eq('is_active', true)
      .single()
    return data?.user_id ?? null
  }

  // Option 2: Supabase Bearer token
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return null

  const token = authHeader.replace('Bearer ', '')
  const anonClient = createClient(
    SUPABASE_URL,
    Deno.env.get('SUPABASE_ANON_KEY') || SUPABASE_SERVICE_KEY
  )
  const { data: { user }, error } = await anonClient.auth.getUser(token)
  if (error || !user) return null
  return user.id
}

// ── Main Handler ────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    const userId = await resolveUserId(req)
    if (!userId) return errorResponse('Unauthorized', 401)

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    // For GET requests (Shortcuts), default to generate
    let action = 'generate'
    let payload: Record<string, unknown> = {}

    if (req.method === 'POST') {
      const body = await req.json()
      action = body.action || 'generate'
      const { action: _, ...rest } = body
      payload = rest
    }

    // Check for ?action= override (for Shortcuts)
    const url = new URL(req.url)
    if (url.searchParams.get('action')) {
      action = url.searchParams.get('action')!
    }

    // ── GENERATE ──────────────────────────────────────────────────────────
    if (action === 'generate') {
      // Fetch recent titles to avoid repetition
      const { data: recentPieces } = await supabase
        .from('grounded_art_pieces')
        .select('title')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20)

      const recentTitles = (recentPieces || []).map((p: { title: string }) => p.title)

      // Build random style seed
      const seed = buildPromptSeed()
      console.log('Art seed:', JSON.stringify(seed))

      // Generate image + title via Gemini
      const { imageBase64, mimeType, title } = await generateArt(seed, recentTitles)
      console.log('Generated title:', title)

      // Upload to Supabase Storage
      const imageUrl = await uploadToStorage(supabase, userId, imageBase64, mimeType)
      console.log('Uploaded to:', imageUrl)

      // Insert record
      const { data: record, error: insertError } = await supabase
        .from('grounded_art_pieces')
        .insert({
          user_id: userId,
          title,
          image_url: imageUrl,
          prompt_seed: seed,
        })
        .select('id, title, image_url, created_at')
        .single()

      if (insertError) {
        console.error('DB insert error:', insertError)
        throw new Error(`Failed to save art piece: ${insertError.message}`)
      }

      // For Shortcuts: return just the image URL as plain text
      if (url.searchParams.get('format') === 'url') {
        return new Response(record.image_url, {
          headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
        })
      }

      return jsonResponse({
        id: record.id,
        title: record.title,
        image_url: record.image_url,
        created_at: record.created_at,
      })
    }

    // ── LATEST (for Shortcuts wallpaper fetch) ──────────────────────────
    if (action === 'latest') {
      const { data: latest } = await supabase
        .from('grounded_art_pieces')
        .select('id, title, image_url, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (!latest) return errorResponse('No art pieces found', 404)

      if (url.searchParams.get('format') === 'url') {
        return new Response(latest.image_url, {
          headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
        })
      }

      return jsonResponse(latest)
    }

    // ── HISTORY ───────────────────────────────────────────────────────────
    if (action === 'history') {
      const limit = Math.min(payload.limit || 20, 100)

      const { data: pieces, error: queryError } = await supabase
        .from('grounded_art_pieces')
        .select('id, title, image_url, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (queryError) {
        console.error('History query error:', queryError)
        throw new Error(`Failed to fetch history: ${queryError.message}`)
      }

      return jsonResponse({ pieces: pieces || [] })
    }

    return errorResponse(`Unknown action: ${action}`, 400)
  } catch (err: any) {
    console.error('grounded-art error:', err)
    return errorResponse(err.message || 'Internal error', 500)
  }
})
