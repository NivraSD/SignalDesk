import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import { createClient } from '@supabase/supabase-js'

// Node.js runtime for Sharp
export const maxDuration = 60

const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const GROUNDED_ART_FN = `${SUPABASE_URL}/functions/v1/grounded-art`

const OUTPUT_W = 1080
const OUTPUT_H = 1920

function compositeOverlay(title: string): Buffer {
  const escaped = title
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${OUTPUT_W}" height="${OUTPUT_H}">
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
  >${escaped}</text>
</svg>`)
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = req.headers.get('x-api-key')
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing API key' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({ action: 'generate' }))
    const action = body.action || 'generate'
    const format = new URL(req.url).searchParams.get('format')

    // ── LATEST WITH OVERLAY — for Shortcut wallpaper ──────────────────
    // Returns pre-composited image if available, otherwise composites on the fly
    if (action === 'latest') {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

      const { data: latest } = await supabase
        .from('grounded_art_pieces')
        .select('id, title, image_url, composited_url, created_at')
        .eq('user_id', 'aa40db0f-ec2f-45cc-840f-e227c830e175')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (!latest) {
        return NextResponse.json({ error: 'No art pieces found' }, { status: 404 })
      }

      // If format=image, return the actual image bytes
      if (format === 'image') {
        // Prefer pre-composited, fall back to on-the-fly
        const imageSource = latest.composited_url || latest.image_url
        const imgRes = await fetch(imageSource)
        const imgBuffer = Buffer.from(await imgRes.arrayBuffer())

        // If no composited version, overlay now
        if (!latest.composited_url && latest.title) {
          const composited = await sharp(imgBuffer)
            .resize(OUTPUT_W, OUTPUT_H, { fit: 'cover' })
            .composite([{ input: compositeOverlay(latest.title), top: 0, left: 0 }])
            .jpeg({ quality: 92 })
            .toBuffer()

          return new NextResponse(composited, {
            headers: { 'Content-Type': 'image/jpeg' },
          })
        }

        return new NextResponse(imgBuffer, {
          headers: { 'Content-Type': imgRes.headers.get('Content-Type') || 'image/jpeg' },
        })
      }

      return NextResponse.json(latest)
    }

    // ── GENERATE — creates new piece with overlay ─────────────────────
    if (action === 'generate') {
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
        return NextResponse.json({ error: 'Generation failed', details: err }, { status: genRes.status })
      }

      const artData = await genRes.json()
      const { title, image_url } = artData

      if (!image_url || !title) {
        return NextResponse.json({ error: 'Missing image_url or title', data: artData }, { status: 500 })
      }

      // Fetch and composite
      const imgRes = await fetch(image_url)
      const imgBuffer = Buffer.from(await imgRes.arrayBuffer())

      const composited = await sharp(imgBuffer)
        .resize(OUTPUT_W, OUTPUT_H, { fit: 'cover' })
        .composite([{ input: compositeOverlay(title), top: 0, left: 0 }])
        .jpeg({ quality: 92 })
        .toBuffer()

      if (format === 'image') {
        return new NextResponse(composited, {
          headers: {
            'Content-Type': 'image/jpeg',
            'Content-Disposition': 'inline; filename="grounded-art.jpg"',
          },
        })
      }

      return NextResponse.json({
        ...artData,
        composited_image: `data:image/jpeg;base64,${composited.toString('base64')}`,
        overlay_applied: true,
      })
    }

    // ── Pass other actions through to edge function ───────────────────
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

  } catch (err: any) {
    console.error('grounded-art error:', err)
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'grounded-art endpoint',
    actions: {
      'POST {action: "generate"}': 'Generate new art piece with title overlay',
      'POST {action: "latest"} + ?format=image': 'Get latest composited wallpaper as JPEG',
      'POST {action: "history"}': 'List past pieces',
    },
    shortcut_url: 'POST /api/grounded-art?format=image with X-API-KEY header, body: {action: "latest"}',
  })
}
