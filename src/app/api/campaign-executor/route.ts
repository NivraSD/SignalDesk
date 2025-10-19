import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    console.log('🎯 Campaign Executor API Route called')
    console.log('  blueprintId:', body.blueprintId)
    console.log('  campaignType:', body.campaignType)
    console.log('  orgId:', body.orgId)
    console.log('  Has blueprint:', !!body.blueprint)
    console.log('  Blueprint keys:', body.blueprint ? Object.keys(body.blueprint) : 'none')

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/niv-campaign-executor`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify(body)
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Campaign executor error response:', errorText)
      console.error('   Status:', response.status)
      console.error('   Status Text:', response.statusText)
      throw new Error(`Executor failed: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log('✅ Campaign executor success:', {
      contentGenerated: data.contentGenerated,
      success: data.success
    })

    return NextResponse.json(data)

  } catch (error) {
    console.error('❌ API route error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
