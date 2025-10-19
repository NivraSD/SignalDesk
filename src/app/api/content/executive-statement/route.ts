import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Call the mcp-content edge function with the correct tool format
    const response = await fetch(`${SUPABASE_URL}/functions/v1/mcp-content`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
      body: JSON.stringify({
        tool: 'generate_executive_talking_points',
        arguments: {
          occasion: body.occasion || 'internal_meeting',
          topic: body.topic || body.prompt || body.message || 'Executive statement',
          audience: body.audience || 'Stakeholders',
          duration: body.duration || 5,
          keyMessages: body.keyMessages || [body.prompt || 'Key executive message'],
          anticipatedQuestions: body.anticipatedQuestions || []
        }
      })
    })

    if (!response.ok) {
      throw new Error(`Edge function returned ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json({
      success: true,
      content: data.talkingPoints || data.content || data,
      metadata: {
        occasion: data.occasion,
        duration: data.duration,
        prepTime: data.prepTime
      }
    })

  } catch (error) {
    console.error('Executive statement generation error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate'
    }, { status: 500 })
  }
}