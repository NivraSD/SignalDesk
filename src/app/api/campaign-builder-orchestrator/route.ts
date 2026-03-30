import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'
export const maxDuration = 300

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zskaxjtyuaqazydouifp.supabase.co'
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Env check:', {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseServiceKey,
        url: supabaseUrl?.substring(0, 20)
      })
      throw new Error('Missing Supabase configuration')
    }

    // Call the orchestrator edge function
    const response = await fetch(
      `${supabaseUrl}/functions/v1/niv-campaign-builder-orchestrator`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`
        },
        body: JSON.stringify(body)
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Orchestrator error:', errorText)
      throw new Error(`Orchestrator failed: ${response.status}`)
    }

    const data = await response.json()

    return NextResponse.json(data)

  } catch (error) {
    console.error('API route error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
