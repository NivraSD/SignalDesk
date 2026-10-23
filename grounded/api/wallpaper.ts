// Grounded wallpaper for the iOS Shortcut. Each run serves a different piece from the library,
// unseen first; calls within 30s get the same piece so a Shortcut that asks for the title and the
// image separately stays paired. KEY is either a person's own wallpaper_key (grounded_user_settings,
// their own rotation via grounded_pick_wallpaper_for) or the original owner key (GROUNDED_WALLPAPER_KEY,
// the owner's existing rotation via grounded_pick_wallpaper).
//   GET /api/wallpaper?key=KEY                 -> JSON { title, image_url }
//   GET /api/wallpaper?key=KEY&get=title       -> plain-text title
//   GET /api/wallpaper?key=KEY&get=image       -> redirect to the raw image
//   GET /api/wallpaper?key=KEY&get=captioned   -> 1080x1920 JPEG, title on black bars (one call)
import { createClient } from '@supabase/supabase-js'
import { compositeWallpaper, loadCaptionFont } from './_lib/overlay.js'

const OWNER_ID = 'aa40db0f-ec2f-45cc-840f-e227c830e175' // the art library's owner, and the original key's rotation

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const key = url.searchParams.get('key') || ''
  if (key.length < 20) return new Response('Unauthorized', { status: 401 })
  const get = url.searchParams.get('get')
  const noStore = { 'Cache-Control': 'no-store' }

  try {
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    let pick
    if (key === process.env.GROUNDED_WALLPAPER_KEY) {
      pick = await supabase.rpc('grounded_pick_wallpaper', { p_user: OWNER_ID, p_window_seconds: 30 })
    } else {
      const { data: owner } = await supabase.from('grounded_user_settings').select('user_id').eq('wallpaper_key', key).maybeSingle()
      if (!owner) return new Response('Unauthorized', { status: 401 })
      pick = await supabase.rpc('grounded_pick_wallpaper_for', { p_viewer: owner.user_id, p_window_seconds: 30 })
    }
    const { data, error } = pick
    if (error) throw error
    const piece = (data as { id: string; title: string; image_url: string }[] | null)?.[0]
    if (!piece) return new Response('No art found', { status: 404 })

    if (get === 'title') {
      return new Response(piece.title, { headers: { 'Content-Type': 'text/plain', ...noStore } })
    }
    if (get === 'image') {
      return new Response(null, { status: 307, headers: { Location: piece.image_url, ...noStore } })
    }
    if (get === 'captioned') {
      const [font, img] = await Promise.all([
        loadCaptionFont(),
        fetch(piece.image_url).then(async (r) => {
          if (!r.ok) throw new Error(`image fetch ${r.status}`)
          return Buffer.from(await r.arrayBuffer())
        }),
      ])
      const jpeg = await compositeWallpaper(img, piece.title, font)
      return new Response(new Uint8Array(jpeg), { headers: { 'Content-Type': 'image/jpeg', ...noStore } })
    }
    return Response.json({ title: piece.title, image_url: piece.image_url }, { headers: noStore })
  } catch (err) {
    return new Response(err instanceof Error ? err.message : 'Error', { status: 500 })
  }
}
