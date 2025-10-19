import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 120 // 2 minutes max per function call
export const dynamic = 'force-dynamic'

/**
 * Proxy for blueprint generation edge functions
 * Avoids CORS issues with client-side supabase.functions.invoke()
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { functionName, ...payload } = body

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
    const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return NextResponse.json(
        { error: 'Supabase configuration missing' },
        { status: 500 }
      )
    }

    if (!functionName) {
      return NextResponse.json(
        { error: 'Function name required' },
        { status: 400 }
      )
    }

    console.log(`📋 Proxying ${functionName} request...`)

    // Forward to Supabase edge function with 2-minute timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 120000)

    try {
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/${functionName}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'apikey': SUPABASE_ANON_KEY
          },
          body: JSON.stringify(payload),
          signal: controller.signal
        }
      )

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`${functionName} error:`, errorText)
        return NextResponse.json(
          { error: `${functionName} failed: ${response.statusText}` },
          { status: response.status }
        )
      }

      const data = await response.json()
      console.log(`✅ ${functionName} completed successfully`)

      return NextResponse.json(data)

    } catch (fetchError: any) {
      clearTimeout(timeoutId)

      if (fetchError.name === 'AbortError') {
        console.error(`${functionName} timed out after 2 minutes`)
        return NextResponse.json(
          { error: `${functionName} timed out after 2 minutes` },
          { status: 504 }
        )
      }

      throw fetchError
    }

  } catch (error: any) {
    console.error('Blueprint function proxy error:', error)
    return NextResponse.json(
      { error: error.message || 'Blueprint function call failed' },
      { status: 500 }
    )
  }
}
