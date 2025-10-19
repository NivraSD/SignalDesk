import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, conversationId, organizationId, organizationContext, framework } = body

    console.log('NIV Panel API: Calling niv-orchestrator-robust')

    // Call the niv-orchestrator-robust edge function
    const response = await fetch(`${SUPABASE_URL}/functions/v1/niv-orchestrator-robust`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        message,
        conversationId: conversationId || `niv-panel-${Date.now()}`,
        organizationId: organizationId || '1',
        organizationContext: organizationContext || {
          name: 'Unknown',
          industry: 'Technology'
        },
        framework: framework || null
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('NIV orchestrator error:', response.status, errorText)
      return NextResponse.json(
        { error: 'NIV orchestrator error', details: errorText },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)

  } catch (error) {
    console.error('NIV Panel API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
