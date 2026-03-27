import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import { createClient } from '@supabase/supabase-js'

// Node.js runtime — Sharp needs it
export const maxDuration = 60

const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const GROUNDED_API_KEY = process.env.GROUNDED_API_KEY || 'd677fcd4-7d0f-4e99-b53e-5243e9f99fea'
const GROUNDED_ART_FN = `${SUPABASE_URL}/functions/v1/grounded-art`
const CRON_SECRET = process.env.CRON_SECRET

const OUTPUT_W = 1080
const OUTPUT_H = 1920

export async function GET(req: NextRequest) {
  // Verify cron auth (Vercel sends this header)
  const authHeader = req.headers.get('authorization')
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Step 1: Generate art + title via edge function
    console.log('[cron] Generating new art piece...')
    const genRes = await fetch(GROUNDED_ART_FN, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': GROUNDED_API_KEY,
      },
      body: JSON.stringify({ action: 'generate' }),
    })

    if (!genRes.ok) {
      const err = await genRes.text()
      console.error('[cron] Generation failed:', err)
      return NextResponse.json({ error: 'Generation failed', details: err }, { status: 500 })
    }

    const artData = await genRes.json()
    const { id, title, image_url } = artData
    console.log(`[cron] Generated: "${title}" — ${image_url}`)

    // Step 2: Fetch raw image
    const imgRes = await fetch(image_url)
    if (!imgRes.ok) {
      return NextResponse.json({ error: `Failed to fetch image: ${imgRes.status}` }, { status: 500 })
    }
    const imgBuffer = Buffer.from(await imgRes.arrayBuffer())

    // Step 3: Composite title overlay with Sharp
    const escapedTitle = title
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')

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
      .composite([{ input: svgOverlay, top: 0, left: 0 }])
      .jpeg({ quality: 92 })
      .toBuffer()

    console.log(`[cron] Composited image: ${composited.length} bytes`)

    // Step 4: Upload composited image to storage
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    const fileName = `aa40db0f-ec2f-45cc-840f-e227c830e175/composited/${crypto.randomUUID()}.jpg`

    const { error: uploadError } = await supabase.storage
      .from('grounded-art')
      .upload(fileName, composited, { contentType: 'image/jpeg', upsert: false })

    if (uploadError) {
      console.error('[cron] Upload error:', uploadError)
      return NextResponse.json({ error: 'Upload failed', details: uploadError.message }, { status: 500 })
    }

    const { data: urlData } = supabase.storage.from('grounded-art').getPublicUrl(fileName)
    const compositedUrl = urlData.publicUrl
    console.log(`[cron] Composited URL: ${compositedUrl}`)

    // Step 5: Update the DB record with composited URL
    const { error: updateError } = await supabase
      .from('grounded_art_pieces')
      .update({ composited_url: compositedUrl })
      .eq('id', id)

    if (updateError) {
      // Column might not exist yet — that's ok, we'll add it
      console.warn('[cron] Update composited_url failed (column may not exist):', updateError.message)
    }

    return NextResponse.json({
      success: true,
      id,
      title,
      raw_url: image_url,
      composited_url: compositedUrl,
    })
  } catch (err: any) {
    console.error('[cron] Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
