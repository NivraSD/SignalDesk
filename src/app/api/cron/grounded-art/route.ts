import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { compositeWallpaper } from '@/lib/grounded-overlay'

export const maxDuration = 60

const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const GROUNDED_API_KEY = process.env.GROUNDED_API_KEY || 'd677fcd4-7d0f-4e99-b53e-5243e9f99fea'
const GROUNDED_ART_FN = `${SUPABASE_URL}/functions/v1/grounded-art`
const CRON_SECRET = process.env.CRON_SECRET

const USER_ID = 'aa40db0f-ec2f-45cc-840f-e227c830e175'

export async function GET(req: NextRequest) {
  // Verify cron auth
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

    // Step 2: Fetch raw image and composite
    const imgRes = await fetch(image_url)
    const imgBuffer = Buffer.from(await imgRes.arrayBuffer())
    const composited = await compositeWallpaper(imgBuffer, title)
    console.log(`[cron] Composited: ${composited.length} bytes`)

    // Step 3: Upload composited image
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    const fileName = `${USER_ID}/composited/${crypto.randomUUID()}.jpg`

    const { error: uploadError } = await supabase.storage
      .from('grounded-art')
      .upload(fileName, composited, { contentType: 'image/jpeg', upsert: false })

    if (uploadError) {
      console.error('[cron] Upload error:', uploadError)
      return NextResponse.json({ error: 'Upload failed', details: uploadError.message }, { status: 500 })
    }

    const { data: urlData } = supabase.storage.from('grounded-art').getPublicUrl(fileName)
    const compositedUrl = urlData.publicUrl

    // Step 4: Update DB record
    await supabase
      .from('grounded_art_pieces')
      .update({ composited_url: compositedUrl })
      .eq('id', id)

    console.log(`[cron] Done: "${title}" → ${compositedUrl}`)

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
