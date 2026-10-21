import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Each run serves a different piece from the library (see grounded_pick_wallpaper).
// GET /api/grounded-art/wallpaper?key=API_KEY — returns JSON {title, image_url}
// GET /api/grounded-art/wallpaper?key=API_KEY&get=title — returns plain text title
// GET /api/grounded-art/wallpaper?key=API_KEY&get=image — redirects to image

export const maxDuration = 10
export const dynamic = 'force-dynamic'

const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const GROUNDED_API_KEY = 'd677fcd4-7d0f-4e99-b53e-5243e9f99fea'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const key = url.searchParams.get('key')
  const get = url.searchParams.get('get')

  if (key !== GROUNDED_API_KEY) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    // A different piece from the whole library each Shortcut run (unseen first). Calls within 30s
    // of a pick get the same piece, so the Shortcut's separate title + image requests stay paired.
    const { data: picked, error } = await supabase.rpc('grounded_pick_wallpaper', {
      p_user: 'aa40db0f-ec2f-45cc-840f-e227c830e175',
      p_window_seconds: 30,
    })
    if (error) throw error
    const latest = (picked as { id: string; title: string; image_url: string }[] | null)?.[0]

    if (!latest) {
      return new Response('No art found', { status: 404 })
    }

    if (get === 'title') {
      return new Response(latest.title, {
        headers: { 'Content-Type': 'text/plain', 'Cache-Control': 'no-store' },
      })
    }

    if (get === 'image') {
      const res = NextResponse.redirect(latest.image_url)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    // Default: return both as JSON
    return NextResponse.json({
      title: latest.title,
      image_url: latest.image_url,
    })
  } catch (err: any) {
    return new Response(err.message, { status: 500 })
  }
}
