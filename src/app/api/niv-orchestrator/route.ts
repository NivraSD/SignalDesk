import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, conversationId, organizationId, organizationContext, framework, stage, conversationHistory } = body

    console.log(`NIV Panel API: Calling niv-advisor (stage: ${stage || 'full'})`)
    console.log(`NIV Panel API: organizationId from frontend: "${organizationId}"`)
    console.log(`NIV Panel API: conversationHistory length: ${(conversationHistory || []).length}`)

    // Build context exactly like niv-orchestrator-robust - pass organizationId through
    const context: any = {
      activeModule: 'intelligence',
      sessionId: conversationId || `niv-${Date.now()}`
    }

    // IMPORTANT: Only add organizationId if it's NOT '1' (which is a placeholder)
    // Pass it through so edge function can use it for mcp-discovery lookup
    if (organizationId && organizationId !== '1') {
      context.organizationId = organizationId
      console.log(`✅ Using real organizationId: ${organizationId}`)
    } else {
      console.warn(`⚠️ No valid organizationId provided, edge function will handle default`)
    }

    // Add organization name and other context if available
    if (organizationContext?.name) {
      context.organizationName = organizationContext.name
      context.organization = organizationContext.name
    }
    if (organizationContext?.industry) {
      context.industry = organizationContext.industry
    }
    if (organizationContext?.competitors) {
      context.competitors = organizationContext.competitors
    }

    // Call niv-advisor (conversational advisor - Phase 5)
    const response = await fetch(`${SUPABASE_URL}/functions/v1/niv-advisor`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        message,
        conversationId: conversationId || `niv-${Date.now()}`,
        conversationHistory: conversationHistory || [], // FORWARD from frontend instead of hardcoded empty!
        stage: stage || 'full',
        sessionId: conversationId || `niv-${Date.now()}`,
        context
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
