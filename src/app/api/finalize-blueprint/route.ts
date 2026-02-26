import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 300 // 5 minutes for Vercel
export const dynamic = 'force-dynamic'

/**
 * Finalize blueprint after async stakeholder orchestration completes
 * Calls the finalizer edge function to generate execution and merge all parts
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
    const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return NextResponse.json(
        { error: 'Supabase configuration missing' },
        { status: 500 }
      )
    }

    console.log('📋 Calling blueprint finalizer...')

    // Call finalizer edge function
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 300000) // 5 minutes

    try {
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/niv-campaign-blueprint-finalize`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'apikey': SUPABASE_ANON_KEY
          },
          body: JSON.stringify(body),
          signal: controller.signal
        }
      )

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Blueprint finalizer error:', errorText)
        return NextResponse.json(
          { error: `Blueprint finalization failed: ${response.statusText}` },
          { status: response.status }
        )
      }

      const data = await response.json()
      console.log('✅ Blueprint finalized successfully')

      return NextResponse.json(data)

    } catch (fetchError: any) {
      clearTimeout(timeoutId)

      if (fetchError.name === 'AbortError') {
        console.error('Blueprint finalization timed out after 5 minutes')
        return NextResponse.json(
          { error: 'Blueprint finalization timed out after 5 minutes' },
          { status: 504 }
        )
      }

      throw fetchError
    }

  } catch (error: any) {
    console.error('Blueprint finalization API route error:', error)
    return NextResponse.json(
      { error: error.message || 'Blueprint finalization failed' },
      { status: 500 }
    )
  }
}
