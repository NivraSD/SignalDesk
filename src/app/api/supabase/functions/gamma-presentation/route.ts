import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration')
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/gamma-presentation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Gamma presentation error:', errorText)
      throw new Error(`Presentation generation failed: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)

  } catch (error) {
    console.error('Gamma presentation API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        fallback: {
          type: 'presentation_outline',
          instructions: 'Manual presentation creation required'
        }
      },
      { status: 500 }
    )
  }
}

// Status check endpoint
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const generationId = searchParams.get('id')

    if (!generationId) {
      return NextResponse.json(
        { success: false, error: 'Generation ID required' },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    const response = await fetch(
      `${supabaseUrl}/functions/v1/gamma-presentation/status/${generationId}`,
      {
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`
        }
      }
    )

    const data = await response.json()
    return NextResponse.json(data)

  } catch (error) {
    console.error('Status check error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to check status' },
      { status: 500 }
    )
  }
}