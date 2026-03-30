import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const GOOGLE_API_KEY = Deno.env.get('GOOGLE_API_KEY')!
const GROUNDED_API_KEY = Deno.env.get('GROUNDED_API_KEY')!

const GEMINI_TEXT = 'gemini-2.5-flash'
const GEMINI_IMAGE = 'gemini-2.5-flash-image'

// ── Step 1: Conceive the piece — title, emotion, and visual direction as one ──

const SEEDS = [
  'the tension of something about to begin',
  'the relief of finally letting go of control',
  'restlessness that wants to become movement',
  'the ache of a project left half-finished',
  'clarity arriving uninvited',
  'the heaviness right before a breakthrough',
  'wanting to create but not knowing what',
  'the strange peace of accepting imperfection',
  'momentum building from nothing',
  'returning to something you abandoned',
  'the courage it takes to start ugly',
  'sitting with discomfort instead of escaping it',
  'the difference between stalling and preparing',
  'feeling ready but not starting',
  'the pull of something unresolved',
  'choosing difficulty over comfort',
  'a door you keep walking past',
  'the energy just after a decision',
  'holding two contradictions at once',
  'the silence before honest work begins',
]

const FALLBACK_PALETTES = [
  'burnt sienna, prussian blue, and raw umber — warm against cold',
  'ivory black layered over cadmium orange with titanium white accents',
  'payne\'s gray, cerulean, and naples yellow — coastal tension',
  'mars violet, raw sienna, and zinc white — bruised warmth',
  'viridian, burnt umber, and flake white — forest floor',
]

const FALLBACK_TEXTURES = [
  'oil paint scraped with a palette knife, revealing underlayers',
  'charcoal and gesso on raw linen, marks half-erased and redrawn',
  'thick oil stick marks with visible hand pressure',
  'sumi ink on wet paper, controlled accidents and feathered edges',
  'thin glazes built up in layers, luminous depth through transparency',
]

const FALLBACK_COMPOSITIONS = [
  'dense energy in the center fading to quiet edges',
  'diagonal tension pulling from corner to corner',
  'a single dominant form offset to one side, space breathing around it',
  'horizon line in the lower third, weight settled at the bottom',
  'layered veils of color with edges that never quite align',
]

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

interface ArtConcept {
  title: string
  emotion: string
  palette: string
  texture: string
  composition: string
}

async function conceiveArt(recentTitles: string[]): Promise<ArtConcept> {
  const seed = SEEDS[Math.floor(Math.random() * SEEDS.length)]

  const avoidList = recentTitles.length > 0
    ? `\nDo NOT use or closely resemble these recent titles: ${recentTitles.join(', ')}`
    : ''

  const prompt = `Create a concept for an abstract painting. Starting feeling: "${seed}"

Respond with EXACTLY 5 lines, no labels, no extra text:
Line 1: An evocative 3-5 word phrase (lowercase, no punctuation) that creates emotional tension — like "what hasn't been built yet" or "closer than it feels"${avoidList}
Line 2: The specific emotion to evoke (one sentence)
Line 3: Color palette using real pigment names (3-5 colors)
Line 4: Paint texture and technique
Line 5: Composition and where the visual energy sits

ONLY these 5 lines. Nothing else.`

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_TEXT}:generateContent?key=${GOOGLE_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.95, maxOutputTokens: 500 }
      })
    }
  )

  if (!response.ok) throw new Error(`Concept generation failed: ${response.status}`)
  const data = await response.json()

  // Gemini 2.5 Flash may have thinking parts — find the actual text part
  const allParts = data.candidates?.[0]?.content?.parts || []
  console.log('Response parts:', allParts.length, allParts.map((p: any) => ({ hasText: !!p.text, thought: p.thought, len: p.text?.length })))

  // Get the last text part that isn't a thought
  const textPart = allParts.filter((p: any) => p.text && !p.thought).pop()
  const text = (textPart?.text || allParts[allParts.length - 1]?.text || '').trim()

  // Parse as lines
  console.log('Raw concept text:', text.substring(0, 500))
  const lines = text.split('\n').map((l: string) => l.trim()).filter((l: string) => l.length > 0)

  if (lines.length < 1 || !lines[0]) {
    console.error('Empty response:', text)
    throw new Error('Concept generation returned empty')
  }

  // Clean title: remove any numbering, quotes, labels
  let title = lines[0]
    .replace(/^\d+[.:)\s]*/g, '')
    .replace(/^(title|line\s*1)[:\s]*/i, '')
    .replace(/^["']|["']$/g, '')
    .replace(/[.!?,;:'"]/g, '')
    .toLowerCase()
    .trim()

  // Enforce 3+ words
  if (title.split(/\s+/).length < 3) {
    title = 'not yet but almost'
  }

  const concept: ArtConcept = {
    title,
    emotion: lines[1]?.replace(/^\d+[.:)\s]*/g, '').replace(/^(emotion|line\s*2)[:\s]*/i, '').trim() || seed,
    palette: lines[2]?.replace(/^\d+[.:)\s]*/g, '').replace(/^(palette|colors?|line\s*3)[:\s]*/i, '').trim() || pickRandom(FALLBACK_PALETTES),
    texture: lines[3]?.replace(/^\d+[.:)\s]*/g, '').replace(/^(texture|technique|line\s*4)[:\s]*/i, '').trim() || pickRandom(FALLBACK_TEXTURES),
    composition: lines[4]?.replace(/^\d+[.:)\s]*/g, '').replace(/^(composition|line\s*5)[:\s]*/i, '').trim() || pickRandom(FALLBACK_COMPOSITIONS),
  }

  return concept
}

// ── Step 2: Generate art from the unified concept ────────────────────────────

async function generateArt(concept: ArtConcept): Promise<{ imageBase64: string; mimeType: string }> {
  const prompt = `Create an abstract painting. This is a single emotional experience — the image and the feeling are inseparable.

THE FEELING: ${concept.emotion}

THE PALETTE: ${concept.palette}

THE TEXTURE: ${concept.texture}

THE COMPOSITION: ${concept.composition}

This must look like a photograph of a REAL physical painting. Not digital art. Real paint on real canvas:
- Visible brushstrokes, palette knife marks, scrapes
- Paint buildup, drips, canvas grain showing through
- The imperfection and materiality of a human hand
- Color mixing that happened physically on the surface

The painting should make the viewer FEEL something before they can name what it is. It should create the same emotional response as the phrase "${concept.title}" — not illustrate those words, but evoke the same inner state.

ABSOLUTE RULES:
- ZERO text, letters, words, numbers, symbols, signatures, or watermarks anywhere
- Fill the ENTIRE canvas edge to edge — no margins, borders, or empty space
- Portrait orientation (9:16)
- Pure abstraction — no people, faces, objects, or recognizable forms`

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

async function generateArtWithRetry(concept: ArtConcept, maxRetries = 3): Promise<{ imageBase64: string; mimeType: string }> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await generateArt(concept)
    } catch (e: any) {
      if (e.message?.startsWith('RETRY:') && attempt < maxRetries) {
        console.log(`Retrying art generation (${attempt}/${maxRetries})...`)
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

  if (uploadError) throw new Error(`Storage upload failed: ${uploadError.message}`)

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
      const { data: recentPieces } = await supabase
        .from('grounded_art_pieces')
        .select('title')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20)

      const recentTitles = (recentPieces || []).map((p: { title: string }) => p.title)

      // Single creative act: conceive the whole piece
      console.log('Conceiving art piece...')
      const concept = await conceiveArt(recentTitles)
      console.log('Concept:', JSON.stringify(concept))

      // Generate art driven by the unified concept
      console.log('Generating art...')
      const artResult = await generateArtWithRetry(concept)

      // Upload
      const imageUrl = await uploadToStorage(supabase, userId, artResult.imageBase64, artResult.mimeType)

      // Save
      const { data: record, error: insertError } = await supabase
        .from('grounded_art_pieces')
        .insert({
          user_id: userId,
          title: concept.title,
          image_url: imageUrl,
          prompt_seed: concept,
        })
        .select('id, title, image_url, created_at')
        .single()

      if (insertError) throw new Error(`Failed to save: ${insertError.message}`)

      return jsonResponse({
        id: record.id,
        title: record.title,
        image_url: record.image_url,
        created_at: record.created_at,
        concept,
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
