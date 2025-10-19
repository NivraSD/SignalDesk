import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 60 // 1 minute should be enough for positioning
export const dynamic = 'force-dynamic'

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

    console.log('📊 Proxying positioning request...')

    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/niv-campaign-positioning`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY
        },
        body: JSON.stringify(body)
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Positioning generation error:', errorText)
      return NextResponse.json(
        { error: `Positioning generation failed: ${response.statusText}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('✅ Positioning options generated')

    return NextResponse.json(data)

  } catch (error: any) {
    console.error('Positioning API route error:', error)
    return NextResponse.json(
      { error: error.message || 'Positioning generation failed' },
      { status: 500 }
    )
  }
}
