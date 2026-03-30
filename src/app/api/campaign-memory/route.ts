import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, ...params } = body

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/niv-campaign-memory?action=${action}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify(params)
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Campaign memory error:', errorText)
      throw new Error(`Memory operation failed: ${response.status}`)
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

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const action = searchParams.get('action')
    const orgId = searchParams.get('orgId')

    if (!action || !orgId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/niv-campaign-memory?action=${action}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify({ orgId })
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Campaign memory error:', errorText)
      throw new Error(`Memory operation failed: ${response.status}`)
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
