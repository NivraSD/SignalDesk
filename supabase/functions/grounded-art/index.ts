import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts'
import { svg2png, initialize } from 'npm:svg2png-wasm@1.4.1'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const GOOGLE_API_KEY = Deno.env.get('GOOGLE_API_KEY')!
const GROUNDED_API_KEY = Deno.env.get('GROUNDED_API_KEY')!

// Gemini Flash Image — same model as grounded-orchestrate (proven working)
const IMAGEN_MODEL = 'gemini-2.5-flash-image'

// iPhone 17 Pro: 1206 x 2622 at 460ppi
const IMG_W = 1206
const IMG_H = 2622
// Title: centered, 1.5 inches (690px) from bottom
const TITLE_Y = IMG_H - 690

// ── WASM initialization (lazy, once) ──────────────────────────────────────────

let wasmReady = false
async function ensureWasm() {
  if (wasmReady) return
  const wasmResponse = await fetch('https://unpkg.com/svg2png-wasm@1.4.1/svg2png_wasm_bg.wasm')
  const wasmBuffer = await wasmResponse.arrayBuffer()
  await initialize(new Uint8Array(wasmBuffer))
  wasmReady = true
}

// ── Style Dimensions — grounded in real art movements & artists ──────────────

const REFERENCES = [
  'In the spirit of Mark Rothko — large soft-edged color fields that vibrate against each other, creating depth through layered translucent washes',
  'In the spirit of Gerhard Richter\'s abstracts — dragged paint creating accidental beauty, where color bleeds through scraped layers',
  'In the spirit of Agnes Martin — subtle grids and pale washes, barely-there lines on quiet fields, meditative minimalism',
  'In the spirit of Zao Wou-Ki — where Chinese ink painting meets Western abstraction, atmospheric space and gestural energy',
  'In the spirit of Helen Frankenthaler — stained canvas technique, color soaked into the surface rather than sitting on top',
  'In the spirit of Sean Scully — stacked blocks and bands of matte color, architectural but warm, painterly edges',
  'In the spirit of Clyfford Still — jagged vertical forms tearing through fields of color, raw and geological',
  'In the spirit of Tomma Abts — small geometric forms with complex layered color, precise but organic',
  'In the spirit of Hiroshi Sugimoto\'s seascapes — extreme simplicity, horizon dividing two infinite tones',
  'In the spirit of Pierre Soulages — working with black as a color of light, texture creating luminosity from darkness',
  'In the spirit of Lee Ufan — sparse marks on empty space, the tension between gesture and void',
  'In the spirit of Brice Marden — dense tangled lines over muted grounds, calligraphic energy trapped in oil paint',
]

const PALETTES = [
  'raw umber, burnt sienna, and unbleached titanium — like aged paper and rust',
  'ivory black layered over prussian blue with cadmium orange accents',
  'terre verte, naples yellow, and raw sienna — fresco palette',
  'payne\'s gray, cerulean, and titanium white — overcast coastal light',
  'mars violet, yellow ochre, and zinc white — muted warmth',
  'lamp black, indian red, and gold ochre — Rembrandt\'s shadows',
  'viridian, burnt umber, and flake white — deep forest interior',
  'cobalt blue, cadmium red deep, and ivory — tension through saturation',
  'neutral tint, sepia, and chinese white — ink and wash',
  'slate gray, warm white, and one punctuation of vermilion',
]

const TECHNIQUES = [
  'oil paint scraped with a palette knife, revealing underlayers',
  'thin glazes built up over weeks, luminous depth through transparency',
  'charcoal and gesso on raw linen, marks half-erased and redrawn',
  'encaustic wax with embedded pigment, surface catching light at angles',
  'sumi ink on wet paper, controlled accidents and feathered edges',
  'acrylic poured and tilted, gravity as collaborator',
  'graphite rubbed into textured paper, pressure variations creating form',
  'oil stick on canvas, thick gestural marks with visible hand pressure',
  'watercolor on sized paper, wet-into-wet blooms contained by dry edges',
  'gouache on toned paper, opaque strokes building from the middle values',
]

const COMPOSITIONS = [
  'a single dominant form offset to one side, breathing space around it',
  'horizon line at the lower third, weight settled at the bottom',
  'centered vertical axis with asymmetric marks breaking the symmetry',
  'all-over field with no focal point — the eye wanders continuously',
  'diagonal tension from corner to corner, energy in transit',
  'dense activity in one quadrant fading to open space',
  'repeated rhythm of similar forms at irregular intervals',
  'one decisive gesture across a quiet ground',
  'layered veils of color with edges that never quite align',
  'negative space as the primary subject, marks defining its boundary',
]

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function buildPromptSeed() {
  return {
    reference: pickRandom(REFERENCES),
    palette: pickRandom(PALETTES),
    technique: pickRandom(TECHNIQUES),
    composition: pickRandom(COMPOSITIONS),
  }
}

// ── Title Generation (Gemini Flash — text only, fast) ────────────────────────

async function generateTitle(seed: ReturnType<typeof buildPromptSeed>, recentTitles: string[]): Promise<string> {
  const avoidSection = recentTitles.length > 0
    ? `\nTitles already used (do NOT repeat): ${recentTitles.slice(0, 15).join(', ')}`
    : ''

  const prompt = `Generate a short poetic title (2-4 words) for an abstract artwork with these qualities:
- Style: ${seed.reference.split('—')[1]?.trim() || seed.reference}
- Palette: ${seed.palette.split('—')[0]?.trim()}
- Technique: ${seed.technique}

The title should be evocative, lowercase, no punctuation. Like a gallery wall label.${avoidSection}

Return ONLY the title, nothing else.`

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GOOGLE_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 1.0, maxOutputTokens: 50 }
      })
    }
  )

  if (!response.ok) throw new Error(`Title generation failed: ${response.status}`)
  const data = await response.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || ''
  return text.replace(/^["']|["']$/g, '').replace(/\.$/,'') || 'untitled'
}

// ── Art Generation (Gemini Flash Image — same as grounded-orchestrate) ───────

async function generateArt(seed: ReturnType<typeof buildPromptSeed>): Promise<{ imageBase64: string; mimeType: string }> {
  const prompt = `A piece of abstract art that looks like it was made by a real painter, not by AI. It should feel like a photograph of a physical painting — with real texture, real imperfection, real materiality.

This is NOT digital art. Real paintings have visible brushstrokes, scrapes, drips, and material texture. Slight imperfections — uneven edges, paint buildup, canvas grain showing through. Color mixing that happens physically on the surface. A sense of the artist's hand.

No people, faces, hands, bodies, or silhouettes. No recognizable objects — pure abstraction. No digital effects, lens flares, perfect gradients, glow effects, neon, or fractal patterns.

${seed.reference}

Palette: ${seed.palette}
Technique: ${seed.technique}
Composition: ${seed.composition}

CRITICAL: No text, no letters, no words, no symbols. Pure abstract visual art only. Portrait orientation (9:16 aspect ratio).

Do NOT include any text, words, letters, or writing in the image.`

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${IMAGEN_MODEL}:generateContent?key=${GOOGLE_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseModalities: ['TEXT', 'IMAGE'],
        }
      })
    }
  )

  if (!response.ok) {
    const errText = await response.text()
    console.error('Image generation error:', response.status, errText.substring(0, 500))
    throw new Error(`Image generation error: ${response.status}`)
  }

  const data = await response.json()

  // Extract image from Gemini response — uses inlineData (camelCase, REST API format)
  const parts = data.candidates?.[0]?.content?.parts || []
  const imagePart = parts.find((p: any) => p.inlineData?.mimeType?.startsWith('image/'))

  if (!imagePart?.inlineData?.data) {
    console.error('No image in response parts:', parts.map((p: any) => Object.keys(p)))
    throw new Error('RETRY: No image data in response')
  }

  return {
    imageBase64: imagePart.inlineData.data,
    mimeType: imagePart.inlineData.mimeType,
  }
}

// ── Text Overlay (programmatic — pixel-perfect every time) ───────────────────

async function overlayTitle(
  imageBase64: string,
  mimeType: string,
  title: string
): Promise<{ imageBase64: string; mimeType: string }> {
  await ensureWasm()

  const fontSize = Math.round(IMG_H * 0.012) // ~31px — small gallery label
  const escapedTitle = title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${IMG_W}" height="${IMG_H}">
  <image href="data:${mimeType};base64,${imageBase64}" width="${IMG_W}" height="${IMG_H}" />
  <text
    x="${IMG_W / 2}"
    y="${TITLE_Y}"
    text-anchor="middle"
    font-family="Helvetica, Arial, sans-serif"
    font-weight="300"
    font-size="${fontSize}"
    fill="white"
    fill-opacity="0.45"
    letter-spacing="2"
  >${escapedTitle}</text>
</svg>`

  const pngBuffer = await svg2png(svg, { width: IMG_W, height: IMG_H })

  // Convert Uint8Array to base64
  let binary = ''
  for (let i = 0; i < pngBuffer.length; i++) {
    binary += String.fromCharCode(pngBuffer[i])
  }
  const composited = btoa(binary)

  return { imageBase64: composited, mimeType: 'image/png' }
}

// ── Retry wrapper ────────────────────────────────────────────────────────────

async function generateArtWithRetry(
  seed: ReturnType<typeof buildPromptSeed>,
  maxRetries = 3
): Promise<{ imageBase64: string; mimeType: string }> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Art generation attempt ${attempt}/${maxRetries}`)
      return await generateArt(seed)
    } catch (e: any) {
      if (e.message?.startsWith('RETRY:') && attempt < maxRetries) {
        console.log(`No image returned, retrying (${attempt}/${maxRetries})...`)
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

// ── Auth Helper (same pattern as grounded-orchestrate) ──────────────────────

async function resolveUserId(req: Request): Promise<string | null> {
  const url = new URL(req.url)
  const apiKey = req.headers.get('x-api-key') || url.searchParams.get('key')

  // API key auth — simple env var comparison, hardcoded user (single-user app)
  if (apiKey && apiKey === GROUNDED_API_KEY) {
    return 'aa40db0f-ec2f-45cc-840f-e227c830e175'
  }

  // Bearer token auth (frontend/Supabase client)
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
      const body = await req.json()
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

      const seed = buildPromptSeed()
      console.log('Art seed:', JSON.stringify(seed))

      // Step 1: Generate title (Gemini Flash — fast, text-only)
      console.log('Generating title...')
      const title = await generateTitle(seed, recentTitles)
      console.log('Title:', title)

      // Step 2: Generate art (Gemini 2.5 Flash Image)
      console.log('Generating art...')
      const artResult = await generateArtWithRetry(seed)

      // Step 3: Try to overlay title programmatically
      let finalImage = artResult
      let overlayApplied = false
      try {
        console.log('Compositing title overlay...')
        finalImage = await overlayTitle(artResult.imageBase64, artResult.mimeType, title)
        overlayApplied = true
        console.log('Title overlay applied successfully')
      } catch (overlayErr: any) {
        console.error('Title overlay failed (returning raw image):', overlayErr.message)
      }

      // Step 4: Upload
      const imageUrl = await uploadToStorage(supabase, userId, finalImage.imageBase64, finalImage.mimeType)
      console.log('Uploaded to:', imageUrl)

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

      // For Shortcuts: return actual image bytes
      if (url.searchParams.get('format') === 'image') {
        const imgResponse = await fetch(record.image_url)
        const imgBytes = await imgResponse.arrayBuffer()
        return new Response(imgBytes, {
          headers: {
            ...corsHeaders,
            'Content-Type': imgResponse.headers.get('Content-Type') || 'image/png',
            'Content-Disposition': `inline; filename="grounded-art.png"`,
          },
        })
      }

      return jsonResponse({
        id: record.id,
        title: record.title,
        image_url: record.image_url,
        created_at: record.created_at,
        overlay_applied: overlayApplied,
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
