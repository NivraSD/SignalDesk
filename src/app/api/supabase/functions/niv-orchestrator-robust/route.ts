import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration')
    }

    // Strategic framework generation can take 3-4 minutes (research + analysis + framework)
    // Set timeout high enough to allow complete orchestration
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 240000) // 240 second timeout (4 minutes)

    const response = await fetch(`${supabaseUrl}/functions/v1/niv-orchestrator-robust`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify(body),
      signal: controller.signal
    }).catch(err => {
      if (err.name === 'AbortError') {
        throw new Error('Request timeout - NIV is taking longer than expected. Please try again.')
      }
      throw err
    }).finally(() => {
      clearTimeout(timeoutId)
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      console.error(`NIV orchestrator returned ${response.status}:`, errorText)

      // Provide fallback responses for common scenarios
      if (response.status === 504 || response.status === 502) {
        throw new Error('NIV service is temporarily unavailable. Please try again in a moment.')
      }
      throw new Error(`NIV orchestrator error: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)

  } catch (error) {
    console.error('NIV API route error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Sorry, I encountered an issue processing your request. Please try again.'
      },
      { status: 500 }
    )
  }
}