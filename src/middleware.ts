import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Skip middleware for API routes - let them handle their own auth
  const path = request.nextUrl.pathname
  if (path.startsWith('/api/')) {
    return NextResponse.next()
  }

  try {
    let supabaseResponse = NextResponse.next({
      request,
    })

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => {
              request.cookies.set(name, value)
            })
            supabaseResponse = NextResponse.next({
              request,
            })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    // Refresh session if expired
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Public paths that don't require authentication
    const publicPaths = ['/auth/login', '/auth/signup', '/auth/reset-password', '/auth/callback', '/auth/error', '/auth/update-password', '/platform', '/contact', '/thoughts', '/media', '/org']
    const isPublicPath = publicPaths.some(publicPath => path.startsWith(publicPath))

    // If user is not signed in and trying to access protected route, redirect to login
    if (!user && !isPublicPath && path !== '/') {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/auth/login'
      redirectUrl.searchParams.set('next', path)
      return NextResponse.redirect(redirectUrl)
    }

    // If user is signed in and trying to access auth pages, redirect to onboarding
    // But allow access to public content pages (blog, media network) for everyone
    const mediaNetworkPaths = ['/thoughts', '/media', '/org']
    const isMediaNetworkPath = mediaNetworkPaths.some(p => path.startsWith(p))
    if (user && isPublicPath && path !== '/auth/callback' && !isMediaNetworkPath) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/onboarding'
      return NextResponse.redirect(redirectUrl)
    }

    return supabaseResponse
  } catch (error) {
    // Log the error but don't crash - return a basic response
    console.error('Middleware error:', error)
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes that handle their own auth
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
