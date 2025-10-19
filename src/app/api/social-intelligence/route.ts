import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      organization_id,
      time_range = '24h',
      platforms = ['twitter', 'reddit', 'linkedin'],
      tool = 'monitor_all_platforms'
    } = body

    console.log('📡 Social Intelligence API called:', {
      organization_id,
      time_range,
      platforms,
      tool
    })

    // Call the MCP edge function
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/mcp-social-intelligence`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
        },
        body: JSON.stringify({
          tool,
          arguments: {
            organization_id,
            time_range,
            platforms,
            include_sentiment: true
          }
        })
      }
    )

    if (!response.ok) {
      const error = await response.text()
      console.error('MCP Error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch social intelligence' },
        { status: response.status }
      )
    }

    const data = await response.json()

    if (!data.success) {
      return NextResponse.json(
        { error: data.error || 'Unknown error' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      signals: data.results.signals || [],
      total_signals: data.results.total_signals || 0,
      platform_breakdown: data.results.platform_breakdown || {},
      sentiment_analysis: data.results.sentiment_analysis || null,
      organization_id,
      time_range
    })

  } catch (error: any) {
    console.error('Social Intelligence API Error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const organization_id = searchParams.get('organization_id') || 'Tesla'
  const time_range = searchParams.get('time_range') || '24h'
  const platforms = searchParams.get('platforms')?.split(',') || ['twitter', 'reddit', 'linkedin']

  // Redirect to POST handler
  return POST(new NextRequest(req.url, {
    method: 'POST',
    body: JSON.stringify({ organization_id, time_range, platforms })
  }))
}