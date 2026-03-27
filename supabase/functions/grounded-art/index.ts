import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const GOOGLE_API_KEY = Deno.env.get('GOOGLE_API_KEY')!
const GROUNDED_API_KEY = Deno.env.get('GROUNDED_API_KEY')!

const GEMINI_TEXT = 'gemini-2.5-flash'
const GEMINI_IMAGE = 'gemini-2.5-flash-image'

// ── Emotionally evocative title generation (THE INTERVENTION) ────────────────
// The title is the ghost note. It creates the ambiguous gap that makes
// the brain reach toward action. It's not an art label — it's a provocation.

const EMOTIONAL_REGISTERS = [
  'the quiet tension before starting something difficult',
  'the feeling of potential energy — something about to shift',
  'the strange comfort of being mid-process, not finished',
  'the pull toward something you keep avoiding',
  'the moment stillness becomes unbearable in a good way',
  'the weight of an idea that hasn\'t been expressed yet',
  'what it feels like to finally stop resisting',
  'the gap between knowing and doing',
  'the texture of a day that could go either way',
  'the particular energy of early momentum',
  'permission you didn\'t know you needed',
  'what clarity feels like before the words arrive',
  'the restlessness that precedes creation',
  'the feeling of returning to something abandoned',
  'the moment right before commitment',
  'the strange relief of choosing one direction',
  'what it means to move without a plan',
  'the difference between waiting and preparing',
  'the tension between comfort and growth',
  'the first mark on a blank surface',
]

async function generateTitle(recentTitles: string[]): Promise<string> {
  const register = EMOTIONAL_REGISTERS[Math.floor(Math.random() * EMOTIONAL_REGISTERS.length)]

  const avoidSection = recentTitles.length > 0
    ? `\nPhrases already used (do NOT repeat or closely resemble): ${recentTitles.slice(0, 20).join(', ')}`
    : ''

  const prompt = `You are generating a short emotionally evocative phrase (2-5 words) that will appear on an abstract painting used as a phone wallpaper.

This phrase is NOT a title for art. It's a provocation — something that creates an ambiguous emotional gap in the viewer's mind. Something that makes the brain reach toward meaning, toward action, toward resolution.

The emotional register for this one: ${register}

Rules:
- 2 to 5 words, lowercase, no punctuation
- Must feel like something you'd pause on — not inspirational poster language
- NOT generic poetry ("whispers of dawn", "silent echoes") — that's cliché
- NOT commands or instructions ("start now", "keep going")
- NOT art labels ("blue study", "composition in grey")
- Think more like: "what hasn't been built yet" or "the weight before moving" or "permission to start rough" or "almost ready isn't ready"
- Ambiguous enough that the viewer's brain completes the meaning based on what's alive in them
- Should create a slight tension — not comfortable, not uncomfortable${avoidSection}

Return ONLY the phrase, nothing else.`

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_TEXT}:generateContent?key=${GOOGLE_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 1.2, maxOutputTokens: 50 }
      })
    }
  )

  if (!response.ok) throw new Error(`Title generation failed: ${response.status}`)
  const data = await response.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || ''
  return text.replace(/^["']|["']$/g, '').replace(/\.$/,'').toLowerCase() || 'what comes next'
}

// ── Art Generation — driven by the title's emotional content ─────────────────

const VISUAL_LANGUAGES = [
  'Mark Rothko — large soft-edged color fields vibrating against each other, depth through translucent washes',
  'Gerhard Richter — dragged paint, accidental beauty, color bleeding through scraped layers',
  'Agnes Martin — subtle grids, pale washes, barely-there lines, meditative minimalism',
  'Zao Wou-Ki — Chinese ink meets Western abstraction, atmospheric space, gestural energy',
  'Helen Frankenthaler — stained canvas, color soaked into surface rather than sitting on top',
  'Pierre Soulages — black as a color of light, texture creating luminosity from darkness',
  'Sean Scully — stacked blocks and bands of matte color, architectural but warm',
  'Clyfford Still — jagged vertical forms tearing through fields of color, raw and geological',
  'Lee Ufan — sparse marks on empty space, tension between gesture and void',
  'Hiroshi Sugimoto — extreme simplicity, horizon dividing two infinite tones',
]

const TECHNIQUES = [
  'oil paint scraped with a palette knife, revealing underlayers',
  'thin glazes built up over weeks, luminous depth through transparency',
  'charcoal and gesso on raw linen, marks half-erased and redrawn',
  'sumi ink on wet paper, controlled accidents and feathered edges',
  'oil stick on canvas, thick gestural marks with visible hand pressure',
  'encaustic wax with embedded pigment, surface catching light at angles',
  'gouache on toned paper, opaque strokes building from middle values',
  'acrylic poured and tilted, gravity as collaborator',
]

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

async function generateArt(title: string): Promise<{ imageBase64: string; mimeType: string }> {
  const artist = pickRandom(VISUAL_LANGUAGES)
  const technique = pickRandom(TECHNIQUES)

  const prompt = `Create an abstract painting that embodies the feeling of: "${title}"

This image should be the VISUAL TEXTURE of that phrase. If someone saw this painting and read those words together, both should feel inevitable — like they belong together.

Visual language: ${artist}
Technique: ${technique}

This must look like a photograph of a real physical painting — visible brushstrokes, scrapes, material texture, canvas grain, paint buildup. The imperfection of a human hand.

NOT digital art. No perfect gradients, no glow effects, no lens flares, no neon, no fractals.
No people, faces, hands, bodies, silhouettes, or recognizable objects.

ABSOLUTE RULES:
- ZERO text, letters, words, numbers, symbols, signatures, watermarks anywhere in the image
- Fill the ENTIRE canvas edge to edge — no blank margins, borders, or empty space
- Portrait orientation (9:16 aspect ratio)
- Pure abstract visual art that FEELS like the phrase "${title}"`

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_IMAGE}:generateContent?key=${GOOGLE_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseModalities: ['TEXT', 'IMAGE'] }
      })
    }
  )

  if (!response.ok) {
    const errText = await response.text()
    console.error('Image generation error:', response.status, errText.substring(0, 500))
    throw new Error(`RETRY: Image generation error: ${response.status}`)
  }

  const data = await response.json()
  const parts = data.candidates?.[0]?.content?.parts || []
  const imagePart = parts.find((p: any) => p.inlineData?.mimeType?.startsWith('image/'))

  if (!imagePart?.inlineData?.data) {
    console.error('No image in response:', parts.map((p: any) => Object.keys(p)))
    throw new Error('RETRY: No image data in response')
  }

  return {
    imageBase64: imagePart.inlineData.data,
    mimeType: imagePart.inlineData.mimeType,
  }
}

// ── Retry wrapper ────────────────────────────────────────────────────────────

async function generateArtWithRetry(title: string, maxRetries = 3): Promise<{ imageBase64: string; mimeType: string }> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Art generation attempt ${attempt}/${maxRetries}`)
      return await generateArt(title)
    } catch (e: any) {
      if (e.message?.startsWith('RETRY:') && attempt < maxRetries) {
        console.log(`Retrying (${attempt}/${maxRetries})...`)
        continue
      }
      throw new Error(e.message?.replace('RETRY: ', '') || 'Art generation failed')
    }
  }
  throw new Error('Art generation failed after retries')
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

  const binaryString = atob(imageBase64)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }

  const { error: uploadError } = await supabase.storage
    .from('grounded-art')
    .upload(fileName, bytes, { contentType: mimeType, upsert: false })

  if (uploadError) {
    console.error('Storage upload error:', uploadError)
    throw new Error(`Storage upload failed: ${uploadError.message}`)
  }

  const { data: urlData } = supabase.storage.from('grounded-art').getPublicUrl(fileName)
  return urlData.publicUrl
}

// ── Auth ─────────────────────────────────────────────────────────────────────

async function resolveUserId(req: Request): Promise<string | null> {
  const url = new URL(req.url)
  const apiKey = req.headers.get('x-api-key') || url.searchParams.get('key')

  if (apiKey && apiKey === GROUNDED_API_KEY) {
    return 'aa40db0f-ec2f-45cc-840f-e227c830e175'
  }

  const authHeader = req.headers.get('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '')
    const anonClient = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY') || SUPABASE_SERVICE_KEY)
    const { data: { user }, error } = await anonClient.auth.getUser(token)
    if (!error && user) return user.id
  }

  return null
}

// ── Main Handler ────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    const userId = await resolveUserId(req)
    if (!userId) return errorResponse('Unauthorized', 401)

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    let action = 'generate'
    let payload: Record<string, unknown> = {}

    if (req.method === 'POST') {
      const body = await req.json().catch(() => ({}))
      action = body.action || 'generate'
      const { action: _, ...rest } = body
      payload = rest
    }

    const url = new URL(req.url)
    if (url.searchParams.get('action')) {
      action = url.searchParams.get('action')!
    }

    // ── GENERATE ──────────────────────────────────────────────────────────
    if (action === 'generate') {
      // Get recent titles to avoid repetition
      const { data: recentPieces } = await supabase
        .from('grounded_art_pieces')
        .select('title')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20)

      const recentTitles = (recentPieces || []).map((p: { title: string }) => p.title)

      // Step 1: Title FIRST — the emotional provocation
      console.log('Generating evocative title...')
      const title = await generateTitle(recentTitles)
      console.log('Title:', title)

      // Step 2: Art driven by the title's feeling
      console.log('Generating art from title...')
      const artResult = await generateArtWithRetry(title)

      // Step 3: Upload raw image
      const imageUrl = await uploadToStorage(supabase, userId, artResult.imageBase64, artResult.mimeType)
      console.log('Uploaded:', imageUrl)

      // Step 4: Save to DB
      const { data: record, error: insertError } = await supabase
        .from('grounded_art_pieces')
        .insert({ user_id: userId, title, image_url: imageUrl })
        .select('id, title, image_url, created_at')
        .single()

      if (insertError) {
        console.error('DB insert error:', insertError)
        throw new Error(`Failed to save: ${insertError.message}`)
      }

      return jsonResponse({
        id: record.id,
        title: record.title,
        image_url: record.image_url,
        created_at: record.created_at,
      })
    }

    // ── LATEST ────────────────────────────────────────────────────────────
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
      const limit = Math.min(Number(payload.limit) || 20, 100)

      const { data: pieces, error: queryError } = await supabase
        .from('grounded_art_pieces')
        .select('id, title, image_url, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (queryError) throw new Error(`Failed to fetch history: ${queryError.message}`)

      return jsonResponse({ pieces: pieces || [] })
    }

    return errorResponse(`Unknown action: ${action}`, 400)
  } catch (err: any) {
    console.error('grounded-art error:', err)
    return errorResponse(err.message || 'Internal error', 500)
  }
})
