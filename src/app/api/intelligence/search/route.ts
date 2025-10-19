import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const response = await fetch(`${SUPABASE_URL}/functions/v1/niv-fireplexity`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
      body: JSON.stringify({
        ...body,
        sources: body.sources || ['web', 'news', 'social'],
        timeframe: body.timeframe || '30d'
      })
    })

    if (!response.ok) {
      throw new Error(`Edge function returned ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json({
      success: true,
      findings: data.articles || data.findings || [],
      sources: data.sources || [],
      metadata: data.metadata
    })

  } catch (error) {
    console.error('Intelligence search error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to search intelligence'
    }, { status: 500 })
  }
}