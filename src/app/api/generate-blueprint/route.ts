import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 300 // 5 minutes for Vercel
export const dynamic = 'force-dynamic'

/**
 * Proxy for blueprint generation edge functions
 * Handles long-running requests (up to 5 minutes) that would timeout with supabase.functions.invoke
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { blueprintType, ...payload } = body

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
    const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return NextResponse.json(
        { error: 'Supabase configuration missing' },
        { status: 500 }
      )
    }

    // Route to appropriate blueprint generator based on campaign type
    const functionName = blueprintType === 'PR_CAMPAIGN'
      ? 'niv-pr-campaign-blueprint-generator'
      : 'niv-campaign-blueprint-orchestrator'

    console.log(`📋 Proxying ${functionName} request (${blueprintType})...`)

    // Forward to Supabase edge function with 5-minute timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 300000)

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
        console.error('Edge function error:', errorText)
        return NextResponse.json(
          { error: `Blueprint generation failed: ${response.statusText}` },
          { status: response.status }
        )
      }

      const data = await response.json()
      console.log('✅ Blueprint generated successfully')

      return NextResponse.json(data)

    } catch (fetchError: any) {
      clearTimeout(timeoutId)

      if (fetchError.name === 'AbortError') {
        console.error('Blueprint generation timed out after 5 minutes')
        return NextResponse.json(
          { error: 'Blueprint generation timed out after 5 minutes' },
          { status: 504 }
        )
      }

      throw fetchError
    }

  } catch (error: any) {
    console.error('Blueprint API route error:', error)
    return NextResponse.json(
      { error: error.message || 'Blueprint generation failed' },
      { status: 500 }
    )
  }
}
