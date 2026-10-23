// The Art tab: one captioned piece (1080x1920 JPEG, title on black bars) for the signed-in viewer.
// Draws from the shared library, unseen-by-this-viewer first (grounded_pick_art_card), separately
// from the lock-screen Shortcut's rotation.
//   GET /api/art-card   Authorization: Bearer <Supabase JWT>   -> image/jpeg, title in X-Art-Title
import { createClient } from '@supabase/supabase-js'
import { compositeWallpaper, loadCaptionFont } from './_lib/overlay.js'

export async function GET(request: Request): Promise<Response> {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) return new Response('Not signed in', { status: 401 })
  const noStore = { 'Cache-Control': 'no-store' }

  try {
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const { data: { user } } = await supabase.auth.getUser(token)
    if (!user) return new Response('Not signed in', { status: 401 })

    const { data, error } = await supabase.rpc('grounded_pick_art_card', { p_viewer: user.id })
    if (error) throw error
    const piece = (data as { id: string; title: string; image_url: string }[] | null)?.[0]
    if (!piece) return new Response('No art yet', { status: 404 })

    const [font, img] = await Promise.all([
      loadCaptionFont(),
      fetch(piece.image_url).then(async (r) => {
        if (!r.ok) throw new Error(`image fetch ${r.status}`)
        return Buffer.from(await r.arrayBuffer())
      }),
    ])
    const jpeg = await compositeWallpaper(img, piece.title, font)
    return new Response(new Uint8Array(jpeg), {
      headers: {
        'Content-Type': 'image/jpeg',
        'X-Art-Title': encodeURIComponent(piece.title),
        'Access-Control-Expose-Headers': 'X-Art-Title',
        ...noStore,
      },
    })
  } catch (err) {
    return new Response(err instanceof Error ? err.message : 'Error', { status: 500 })
  }
}
