import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { blueprint, organizationId, organizationName } = body

    console.log('Campaign Execution: Starting V4 campaign execution for', organizationName)

    // Extract vectors and content types from V4 blueprint
    const vectors = blueprint.vectors || []
    const contentTypes = blueprint.contentStrategy?.autoExecutableContent?.contentTypes || []
    const pattern = blueprint.pattern || 'CASCADE'

    // Call the campaign-execution-orchestrator edge function
    // This orchestrates multi-vector campaign execution according to NIV V4 architecture
    const response = await fetch(`${SUPABASE_URL}/functions/v1/campaign-execution-orchestrator`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        source: 'campaign',
        sourceId: `campaign-${Date.now()}`,
        executionPlan: {
          type: 'multi_vector',
          pattern: pattern,
          vectors: vectors,
          contentTypes: contentTypes
        },
        organizationId: organizationId
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Campaign execution error:', response.status, errorText)
      return NextResponse.json(
        { error: 'Campaign execution failed', details: errorText },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('Campaign execution completed:', data)

    return NextResponse.json(data)

  } catch (error) {
    console.error('Campaign Execution API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
