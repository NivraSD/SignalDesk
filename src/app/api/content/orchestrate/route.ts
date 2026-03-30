import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Call the niv-content-robust edge function for content generation
    const response = await fetch(`${SUPABASE_URL}/functions/v1/niv-content-robust`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
      body: JSON.stringify({
        message: body.prompt || body.message,
        conversationId: body.conversationId || `conv-${Date.now()}`,
        conversationHistory: body.conversation || [],
        context: {
          organization: body.organization || {
            name: body.companyName || 'Company',
            industry: body.industry || 'Technology',
            description: body.companyDescription
          },
          requestedContentType: body.contentType,
          framework: body.framework,
          opportunity: body.opportunity
        }
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Orchestrator error:', errorText)
      throw new Error(`Edge function returned ${response.status}: ${errorText}`)
    }

    const data = await response.json()

    // Return the orchestrated response with all components
    return NextResponse.json({
      success: true,
      ...data,
      message: data.message || data.acknowledgment,
      components: data.deliveryTracking || data.components || {},
      content: data.content || data
    })

  } catch (error) {
    console.error('Content orchestration error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to orchestrate content generation'
    }, { status: 500 })
  }
}