import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Simple GET endpoint for iOS Shortcuts
// GET /api/grounded-art/wallpaper?key=API_KEY
// Returns JSON: { title, image_url }
// Shortcut uses native "Overlay Text on Image" for the title

export const maxDuration = 10

const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const GROUNDED_API_KEY = 'd677fcd4-7d0f-4e99-b53e-5243e9f99fea'

export async function GET(req: NextRequest) {
  const key = new URL(req.url).searchParams.get('key')
  if (key !== GROUNDED_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
      return NextResponse.json({ error: 'No art found' }, { status: 404 })
    }

    return NextResponse.json({
      title: latest.title,
      image_url: latest.image_url,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
