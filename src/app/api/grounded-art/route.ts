import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'

// DO NOT add: export const runtime = 'edge'
// Node.js runtime required for Sharp

const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co'
const GROUNDED_ART_FN = `${SUPABASE_URL}/functions/v1/grounded-art`

// iPhone lock screen safe zone: title needs to be above the clock/widgets
// but below the top notch area. Bottom third is safest — between the
// time display and the flashlight/camera buttons there's a sweet spot.
// 1080x1920 output. Title at y=1580 keeps it visible but not cut off.
const OUTPUT_W = 1080
const OUTPUT_H = 1920
const TITLE_Y = 1680

export async function POST(req: NextRequest) {
  try {
    const apiKey = req.headers.get('x-api-key')
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing API key' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
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

    // Step 3: Composite title overlay with Sharp
    const escapedTitle = title
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')

    const svgOverlay = `
      <svg width="${OUTPUT_W}" height="${OUTPUT_H}">
        <defs>
          <linearGradient id="scrim" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="black" stop-opacity="0"/>
            <stop offset="100%" stop-color="black" stop-opacity="0.35"/>
          </linearGradient>
        </defs>
        <rect x="0" y="${OUTPUT_H - 600}" width="${OUTPUT_W}" height="600" fill="url(#scrim)"/>
        <text
          x="${OUTPUT_W / 2}"
          y="${TITLE_Y}"
          text-anchor="middle"
          font-family="Georgia, 'Times New Roman', serif"
          font-size="72"
          font-weight="normal"
          fill="white"
          fill-opacity="0.9"
          letter-spacing="4"
        >${escapedTitle}</text>
      </svg>
    `

    const composited = await sharp(imgBuffer)
      .resize(OUTPUT_W, OUTPUT_H, { fit: 'cover' })
      .composite([{
        input: Buffer.from(svgOverlay),
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
