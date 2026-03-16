import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { token } = await request.json()

    // Simple token gate — not a password, just prevents bots/crawlers
    if (token !== 'palantir-fellowship-2026') {
      return NextResponse.json({ error: 'Invalid access' }, { status: 403 })
    }

    const supabase = createServiceClient()

    const email = 'trial@palantir.com'

    // Generate a magic link for the demo user
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email,
    })

    if (error) {
      console.error('Magic link generation error:', error)
      return NextResponse.json({ error: 'Failed to generate access link' }, { status: 500 })
    }

    // The hashed_token and type can be used with the existing callback
    const properties = data?.properties
    const hashedToken = properties?.hashed_token

    if (!hashedToken) {
      return NextResponse.json({ error: 'No token generated' }, { status: 500 })
    }

    return NextResponse.json({
      redirect: `/auth/callback?token_hash=${hashedToken}&type=magiclink&next=/dashboard`
    })
  } catch (err) {
    console.error('Demo access error:', err)
    return NextResponse.json({ error: 'Access failed' }, { status: 500 })
  }
}
