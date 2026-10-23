// Returns the signed-in person's lock-screen wallpaper links. Each person has their own private key
// (made on first request); the links carry it, so they're never shipped in the app bundle. The original
// owner keeps the original key so an existing Shortcut keeps working.
import { createClient } from '@supabase/supabase-js'
import { randomBytes } from 'node:crypto'

const OWNER_ID = 'aa40db0f-ec2f-45cc-840f-e227c830e175'

export async function GET(request: Request): Promise<Response> {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) return new Response('Not signed in', { status: 401 })
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data: { user } } = await supabase.auth.getUser(token)
  if (!user) return new Response('Not signed in', { status: 401 })

  let key = user.id === OWNER_ID ? process.env.GROUNDED_WALLPAPER_KEY : null
  if (!key) {
    const { data } = await supabase.from('grounded_user_settings').select('wallpaper_key').eq('user_id', user.id).maybeSingle()
    key = data?.wallpaper_key ?? null
    if (!key) {
      key = randomBytes(24).toString('hex')
      const { error } = await supabase
        .from('grounded_user_settings')
        .upsert({ user_id: user.id, wallpaper_key: key }, { onConflict: 'user_id' })
      if (error) return new Response(error.message, { status: 500 })
    }
  }

  const base = `${new URL(request.url).origin}/api/wallpaper?key=${key}`
  return Response.json(
    { available: true, captioned: `${base}&get=captioned`, title: `${base}&get=title`, image: `${base}&get=image` },
    { headers: { 'Cache-Control': 'no-store' } }
  )
}
