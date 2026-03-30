import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// GET /api/grounded-art/wallpaper?key=API_KEY — returns JSON {title, image_url}
// GET /api/grounded-art/wallpaper?key=API_KEY&get=title — returns plain text title
// GET /api/grounded-art/wallpaper?key=API_KEY&get=image — redirects to image

export const maxDuration = 10

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

    const { data: latest } = await supabase
      .from('grounded_art_pieces')
      .select('title, image_url')
      .eq('user_id', 'aa40db0f-ec2f-45cc-840f-e227c830e175')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!latest) {
      return new Response('No art found', { status: 404 })
    }

    if (get === 'title') {
      return new Response(latest.title, {
        headers: { 'Content-Type': 'text/plain' },
      })
    }

    if (get === 'image') {
      return NextResponse.redirect(latest.image_url)
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
