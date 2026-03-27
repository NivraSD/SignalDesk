import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { compositeWallpaper } from '@/lib/grounded-overlay'

// Simple GET endpoint for Shortcuts
// GET /api/grounded-art/wallpaper?key=YOUR_KEY
// Returns: composited JPEG image directly

export const maxDuration = 30

const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const GROUNDED_API_KEY = process.env.GROUNDED_API_KEY || 'd677fcd4-7d0f-4e99-b53e-5243e9f99fea'

export async function GET(req: NextRequest) {
  const key = new URL(req.url).searchParams.get('key')
  if (key !== GROUNDED_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    const { data: latest } = await supabase
      .from('grounded_art_pieces')
      .select('id, title, image_url, composited_url')
      .eq('user_id', 'aa40db0f-ec2f-45cc-840f-e227c830e175')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!latest) {
      return NextResponse.json({ error: 'No art found' }, { status: 404 })
    }

    // If composited version exists, redirect to it
    if (latest.composited_url) {
      return NextResponse.redirect(latest.composited_url)
    }

    // Otherwise composite on the fly
    const imgRes = await fetch(latest.image_url)
    const imgBuffer = Buffer.from(await imgRes.arrayBuffer())
    const composited = await compositeWallpaper(imgBuffer, latest.title)

    return new NextResponse(composited, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'no-cache',
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
