import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? '/onboarding'

  const supabase = await createClient()

  const forwardedHost = request.headers.get('x-forwarded-host')
  const isLocalEnv = process.env.NODE_ENV === 'development'

  const getRedirectUrl = (path: string) => {
    if (isLocalEnv) return `${origin}${path}`
    if (forwardedHost) return `https://${forwardedHost}${path}`
    return `${origin}${path}`
  }

  // Handle email confirmation with token_hash
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as 'email' | 'signup' | 'recovery' | 'invite' | 'magiclink' | 'email_change',
    })

    if (error) {
      console.error('OTP verification error:', error)
      return NextResponse.redirect(`${origin}/auth/error#error=${error.message}`)
    }

    return NextResponse.redirect(getRedirectUrl(next))
  }

  // Handle OAuth/PKCE callback with code
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('Code exchange error:', error)
      return NextResponse.redirect(`${origin}/auth/error#error=${encodeURIComponent(error.message)}`)
    }

    return NextResponse.redirect(getRedirectUrl(next))
  }

  // If no valid params, redirect to error page
  return NextResponse.redirect(`${origin}/auth/error#error=no_code_or_token`)
}
