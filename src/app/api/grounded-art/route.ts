import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'

// DO NOT add: export const runtime = 'edge'
// Node.js runtime required for Sharp

// Allow up to 60s for AI image generation + overlay compositing
export const maxDuration = 60

const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co'
const GROUNDED_ART_FN = `${SUPABASE_URL}/functions/v1/grounded-art`

const OUTPUT_W = 1080
const OUTPUT_H = 1920

export async function POST(req: NextRequest) {
  try {
    const apiKey = req.headers.get('x-api-key')
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing API key' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({ action: 'generate' }))
    const action = body.action || 'generate'

    // Pass through non-generate actions directly to edge function
    if (action !== 'generate') {
      const res = await fetch(GROUNDED_ART_FN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': apiKey,
        },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      return NextResponse.json(data, { status: res.status })
    }

    // Step 1: Call edge function to generate art + title
    const genRes = await fetch(GROUNDED_ART_FN, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': apiKey,
      },
      body: JSON.stringify({ action: 'generate' }),
    })

    if (!genRes.ok) {
      const err = await genRes.text()
      return NextResponse.json(
        { error: 'Art generation failed', details: err },
        { status: genRes.status }
      )
    }

    const artData = await genRes.json()
    const { title, image_url } = artData

    if (!image_url || !title) {
      return NextResponse.json(
        { error: 'Missing image_url or title from generation', data: artData },
        { status: 500 }
      )
    }

    // Step 2: Fetch the raw image
    const imgRes = await fetch(image_url)
    if (!imgRes.ok) {
      return NextResponse.json(
        { error: `Failed to fetch image: ${imgRes.status}` },
        { status: 500 }
      )
    }
    const imgBuffer = Buffer.from(await imgRes.arrayBuffer())

    // Step 3: Create text overlay as a separate Sharp image, then composite
    // Sharp's SVG renderer has limited font support in serverless — use sans-serif
    // and the full SVG namespace for reliable rendering
    const escapedTitle = title
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')

    // Gradient scrim + large readable title text
    // Position: bottom area, above the lock screen flashlight/camera buttons
    // iPhone safe zone: buttons are at ~y=1800+, clock at ~y=200
    // Sweet spot for title: y=1620 (comfortably visible)
    const svgOverlay = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${OUTPUT_W}" height="${OUTPUT_H}">
  <defs>
    <linearGradient id="scrim" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="black" stop-opacity="0"/>
      <stop offset="100%" stop-color="black" stop-opacity="0.45"/>
    </linearGradient>
  </defs>
  <rect x="0" y="${OUTPUT_H - 650}" width="${OUTPUT_W}" height="650" fill="url(#scrim)"/>
  <text
    x="${OUTPUT_W / 2}"
    y="1620"
    text-anchor="middle"
    font-family="sans-serif"
    font-size="80"
    font-weight="300"
    fill="white"
    fill-opacity="0.92"
    letter-spacing="6"
  >${escapedTitle}</text>
</svg>`)

    const composited = await sharp(imgBuffer)
      .resize(OUTPUT_W, OUTPUT_H, { fit: 'cover' })
      .composite([{
        input: svgOverlay,
        top: 0,
        left: 0,
      }])
      .jpeg({ quality: 92 })
      .toBuffer()

    // Step 4: Return based on format
    const format = new URL(req.url).searchParams.get('format')

    if (format === 'image') {
      return new NextResponse(composited, {
        headers: {
          'Content-Type': 'image/jpeg',
          'Content-Disposition': 'inline; filename="grounded-art.jpg"',
        },
      })
    }

    // Default: return JSON with the original data + composited image as base64
    return NextResponse.json({
      ...artData,
      composited_image: `data:image/jpeg;base64,${composited.toString('base64')}`,
      overlay_applied: true,
    })
  } catch (err: any) {
    console.error('grounded-art-overlay error:', err)
    return NextResponse.json(
      { error: err.message || 'Internal error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ status: 'grounded-art overlay endpoint', method: 'POST required' })
}
