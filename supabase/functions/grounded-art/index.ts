import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const GOOGLE_API_KEY = Deno.env.get('GOOGLE_API_KEY')!
const GROUNDED_API_KEY = Deno.env.get('GROUNDED_API_KEY')!

const GEMINI_TEXT = 'gemini-2.5-flash'
const GEMINI_IMAGE = 'gemini-2.5-flash-image'

// ── Step 1: Conceive the piece — title, emotion, and visual direction as one ──

// SEEDS_BY_REGISTER — feelings grouped by the emotional *territory* they
// occupy. The generator picks a register first, then a seed within it,
// then tells Gemini which register to stay in — otherwise every title
// drifts back to the "motion / on-the-verge" default that dominated the
// original single flat SEEDS array.
const SEEDS_BY_REGISTER: Record<string, string[]> = {
  // Becoming / threshold / on-the-verge — the original register.
  motion: [
    'the tension of something about to begin',
    'the relief of finally letting go of control',
    'restlessness that wants to become movement',
    'the ache of a project left half-finished',
    'the heaviness right before a breakthrough',
    'momentum building from nothing',
    'returning to something you abandoned',
    'the courage it takes to start ugly',
    'the pull of something unresolved',
    'the energy just after a decision',
    'a door you keep walking past',
    'the silence before honest work begins',
  ],
  // States that are, not states that are becoming.
  stillness: [
    'a room the light always finds',
    'weight settling into a chair',
    'stillness that isn\'t waiting for anything',
    'the shape a habit leaves behind',
    'a garden nobody asked for',
    'ordinary hours doing nothing in particular',
    'the quiet of enough',
    'something at rest actually resting',
    'the strange peace of accepting imperfection',
  ],
  // What lingers when something is gone, or almost gone.
  absence: [
    'a name you almost remember',
    'the room after everyone has left',
    'objects that outlived their purpose',
    'a sound that used to mean home',
    'furniture from a house you don\'t own anymore',
    'the space someone used to occupy',
    'a smell that returns you somewhere',
    'the outline of what isn\'t there',
  ],
  // Weather, time, light — the ambient conditions we live inside.
  atmosphere: [
    'the first cold morning of autumn',
    'long light at the end of the day',
    'the hour when weather turns',
    'a summer that lasted too long',
    'winter thinking about spring',
    'grey days running into one another',
    'light through a window in the afternoon',
    'the specific quality of a saturday morning',
    'the pressure right before rain',
  ],
  // Embodied, tactile, physical.
  sensation: [
    'warm water on tired hands',
    'the weight of an old book',
    'cold air on skin used to warmth',
    'wet earth after rain',
    'the give of an old chair',
    'a stone kept warm by the sun',
    'the sharp edge of clean sheets',
  ],
  // Noticing, missing, mistaking, seeing.
  perception: [
    'noticing what you\'d walked past for years',
    'looking up at exactly the wrong moment',
    'a detail you weren\'t supposed to see',
    'catching your own reflection unaware',
    'seeing a familiar thing at a strange angle',
    'the second before you understand',
    'realizing you\'ve been listening to the wrong voice',
  ],
  // Scale, ordinariness, being-in-time.
  existential: [
    'being small under a very large sky',
    'the strangeness of being here at all',
    'ordinary time passing extraordinarily',
    'briefly aware of your whole life',
    'the size of a single moment',
    'holding two contradictions at once',
    'wanting to create but not knowing what',
  ],
}

function pickSeed(): { seed: string; register: string } {
  const registers = Object.keys(SEEDS_BY_REGISTER)
  const register = registers[Math.floor(Math.random() * registers.length)]
  const bank = SEEDS_BY_REGISTER[register]
  const seed = bank[Math.floor(Math.random() * bank.length)]
  return { seed, register }
}

// APPROACHES — the *visual medium* is chosen up front rather than always
// defaulting to abstract painting. Each entry gives Gemini a distinctive
// starting posture (medium + technique + palette bias). This is the
// primary lever for varying what pieces actually LOOK like.
const APPROACHES = [
  {
    medium: 'expressionist oil painting',
    style: 'thick impasto with palette knife scrapes, visible canvas weave, paint drips and buildup',
    palette_hint: 'saturated oil pigments with luminous physical mixing on the surface',
  },
  {
    medium: 'long-exposure photograph of moving fog',
    style: 'silky atmospheric blur, no distinct horizon, layered depth suggested by tonal shifts',
    palette_hint: 'restrained tonal range, mostly monochrome with one warm or cool bleed',
  },
  {
    medium: 'macro photograph of weathered material',
    style: 'sharp focus on oxidized copper, peeling paint, cracked plaster, or rusted iron — the surface treated as landscape',
    palette_hint: 'earthy oxidation tones with unexpected verdigris or ultramarine seepage',
  },
  {
    medium: 'silver gelatin darkroom print',
    style: 'high-contrast black and white with visible film grain, deep shadow-well, luminous highlights',
    palette_hint: 'true monochrome — luminance only, no colour',
  },
  {
    medium: 'cyanotype on textured paper',
    style: 'sun-exposed prussian blue with organic soft edges and fibrous paper texture visible',
    palette_hint: 'monochromatic blue against pale paper cream',
  },
  {
    medium: 'sumi ink on wet mulberry paper',
    style: 'controlled bleed, single deliberate gesture, generous negative space, feathered edges',
    palette_hint: 'ink black on translucent cream — nothing else',
  },
  {
    medium: 'chiaroscuro shadow study',
    style: 'a single volume of light against deep dark space, hard edge softened by atmospheric distance',
    palette_hint: 'near-black with one warm light source, minimal transition',
  },
  {
    medium: 'gouache and gesso on raw linen',
    style: 'matte surface with layered erasures, drawn marks half-obscured, subtle underlying grid or scaffold',
    palette_hint: 'muted earth tones with a single unexpected accent',
  },
  {
    medium: 'photograph of moving water at dusk',
    style: 'long exposure blur of a shore, river, or tidal edge — atmospheric perspective, no distinct horizon',
    palette_hint: 'cool blues and greys with warm western sky bleed',
  },
  {
    medium: 'analog 35mm film landscape at first light',
    style: 'grainy film, muted colours, distant weather, no distinct subject',
    palette_hint: 'faded film palette — sepias, washed blues, soft greens',
  },
  {
    medium: 'watercolor bleed on cold-press paper',
    style: 'controlled accidents, layered washes, salt marks, tide lines from the drying process',
    palette_hint: 'transparent washes creating luminous depth through overlap',
  },
  {
    medium: 'graphite and eraser on paper',
    style: 'soft smudged marks, ghosted erasures, minimal composition with weight settled in one quadrant',
    palette_hint: 'graphite greys and paper cream — nothing else',
  },
  {
    medium: 'window at dusk seen from outside',
    style: 'a single warm interior glow through blurred glass, cold exterior atmosphere, no visible occupants',
    palette_hint: 'cool blue-grey exterior with amber warmth from within',
  },
  {
    medium: 'cast shadow of an offscreen object',
    style: 'a shadow at oblique angle on a textured surface — the thing casting it is not shown',
    palette_hint: 'muted daylight with a single warm/cool tension',
  },
  {
    medium: 'mixed media on found paper',
    style: 'torn edges, tape residue, ink stains, stitched marks — a palimpsest of prior work showing through',
    palette_hint: 'aged cream with layered muted tones, nothing bright',
  },
]

function pickApproach() {
  return APPROACHES[Math.floor(Math.random() * APPROACHES.length)]
}

interface ArtConcept {
  title: string
  emotion: string
  register: string
  medium: string
  style: string
  palette: string
  composition: string
}

// Short guidance for each register — tells Gemini how to stay in the
// intended emotional territory. Without this, titles drift toward
// motion/threshold defaults regardless of which seed was picked.
const REGISTER_GUIDANCE: Record<string, string> = {
  motion: 'a becoming, a threshold, something on the verge — verbs of transition are natural here',
  stillness: 'a state that IS, not a state becoming — resist verbs of motion, resist "about to"',
  absence: 'what remains after something is gone — traces, echoes, empty spaces',
  atmosphere: 'ambient conditions — weather, time of day, the quality of a season or an hour',
  sensation: 'physical, embodied, tactile — what a body notices, not what a mind thinks',
  perception: 'the act of seeing / missing / noticing — cognitive shift, not motion',
  existential: 'scale, ordinariness, being-in-time — the strangeness of being here at all',
}

const TITLE_EXAMPLES_BY_REGISTER: Record<string, string[]> = {
  motion: ['closer than it feels', 'the door not opened', 'what hasn\'t been built yet'],
  stillness: ['a room the light always finds', 'the quiet of enough', 'weight settled in a chair'],
  absence: ['the space someone used to occupy', 'a name almost remembered', 'furniture from before'],
  atmosphere: ['saturday morning quality', 'the hour when weather turns', 'long light at the end'],
  sensation: ['warm water on tired hands', 'the give of an old chair', 'stone kept warm by sun'],
  perception: ['seeing at a strange angle', 'the second before understanding', 'walked past for years'],
  existential: ['being small under a large sky', 'the size of a single moment', 'briefly aware of everything'],
}

async function conceiveArt(recentTitles: string[]): Promise<ArtConcept> {
  const { seed, register } = pickSeed()
  const approach = pickApproach()
  const guidance = REGISTER_GUIDANCE[register] || ''
  const titleExamples = (TITLE_EXAMPLES_BY_REGISTER[register] || [])
    .map(t => `"${t}"`)
    .join(', ')

  const avoidList = recentTitles.length > 0
    ? `\nDo NOT use or closely resemble these recent titles: ${recentTitles.join(', ')}`
    : ''

  const prompt = `Create a concept for a visual piece.

The REGISTER for this piece: ${register} — ${guidance}.
The STARTING FEELING: "${seed}"

The MEDIUM has already been chosen: a ${approach.medium}.
The STYLE for that medium: ${approach.style}
The PALETTE bias: ${approach.palette_hint}

Your job: give the piece a title, name its emotional tone, refine the palette, and describe composition. Stay firmly in the "${register}" register — resist drifting to becoming/motion language if that isn't the register. The piece is NOT a painting unless the medium above says so — respect the medium.

Respond with EXACTLY 4 lines, no labels, no extra text:
Line 1: An evocative 3-5 word phrase (lowercase, no punctuation) in the ${register} register — examples in this register: ${titleExamples}${avoidList}
Line 2: The specific emotion the piece should evoke (one sentence)
Line 3: Refined colour palette (build on the palette bias, be specific with 3-5 colours or tonal moves)
Line 4: Composition — where the visual weight sits, what the eye finds first, what's held back

ONLY these 4 lines. Nothing else.`

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
    register,
    medium: approach.medium,
    style: approach.style,
    palette: lines[2]?.replace(/^\d+[.:)\s]*/g, '').replace(/^(palette|colors?|line\s*3)[:\s]*/i, '').trim() || approach.palette_hint,
    composition: lines[3]?.replace(/^\d+[.:)\s]*/g, '').replace(/^(composition|line\s*4)[:\s]*/i, '').trim() || 'weight settled off-centre with quiet edges',
  }

  return concept
}

// ── Step 2: Generate art from the unified concept ────────────────────────────

async function generateArt(concept: ArtConcept): Promise<{ imageBase64: string; mimeType: string }> {
  const prompt = `Create a ${concept.medium}. This is a single emotional experience — the image and the feeling are inseparable.

THE MEDIUM: ${concept.medium}
THE STYLE: ${concept.style}
THE FEELING: ${concept.emotion}
THE PALETTE: ${concept.palette}
THE COMPOSITION: ${concept.composition}

The piece should look genuinely like the medium above — respect its physical materiality (paper fibres, film grain, ink bleed, canvas weave, atmospheric depth, weathered surface — whichever applies). Not digital slickness. Not generic "abstract art." The specific medium, with all its inherent imperfections and marks.

It should make the viewer FEEL something before they can name what it is. Evoke the same inner state as the phrase "${concept.title}" — not illustrate those words, but let the feeling arrive first.

RULES:
- ZERO text, letters, words, numbers, symbols, signatures, or watermarks anywhere.
- Fill the ENTIRE frame edge to edge — no margins, borders, or empty space.
- Portrait orientation (9:16).
- No literal recognisable objects (no logos, no vehicles, no clocks, no faces, no readable places). Suggested or abstracted forms are welcome — a threshold, a horizon, a light source, a cast shadow, a body of water, a doorway — as long as they invite interpretation rather than describe.
- Ambiguity over specificity: the viewer should wonder what they're looking at.`

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
