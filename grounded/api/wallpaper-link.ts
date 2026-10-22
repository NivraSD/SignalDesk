// Returns the signed-in person's wallpaper links (they carry the wallpaper key, so they're never
// shipped in the app bundle). Art is still single-person, so only the owner gets links for now.
import { createClient } from '@supabase/supabase-js'

const OWNER_ID = 'aa40db0f-ec2f-45cc-840f-e227c830e175'

export async function GET(request: Request): Promise<Response> {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return new Response('Not signed in', { status: 401 })
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data: { user } } = await supabase.auth.getUser(token)
  if (!user) return new Response('Not signed in', { status: 401 })
  if (user.id !== OWNER_ID) return Response.json({ available: false }, { headers: { 'Cache-Control': 'no-store' } })

  const base = `${new URL(request.url).origin}/api/wallpaper?key=${process.env.GROUNDED_WALLPAPER_KEY}`
  return Response.json(
    { available: true, captioned: `${base}&get=captioned`, title: `${base}&get=title`, image: `${base}&get=image` },
    { headers: { 'Cache-Control': 'no-store' } }
  )
}
