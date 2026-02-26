import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { pattern, concept, knowledge, organizationId } = body

    console.log('Campaign Builder: Calling niv-campaign-orchestrator for', pattern, 'pattern')

    // Call the niv-campaign-orchestrator edge function
    const response = await fetch(`${SUPABASE_URL}/functions/v1/niv-campaign-orchestrator`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        pattern: pattern || 'CASCADE',
        concept: concept || {},
        knowledge: knowledge || {},
        organizationId: organizationId || '1'
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Campaign orchestrator error:', response.status, errorText)
      return NextResponse.json(
        { error: 'Campaign orchestrator error', details: errorText },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)

  } catch (error) {
    console.error('Campaign Builder API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
