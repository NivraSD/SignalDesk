import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Use executive talking points for messaging frameworks
    const response = await fetch(`${SUPABASE_URL}/functions/v1/mcp-content`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
      body: JSON.stringify({
        tool: 'generate_executive_talking_points',
        arguments: {
          occasion: 'conference', // Messaging frameworks are for public communication
          topic: body.topic || body.prompt || body.message || 'Messaging Framework',
          audience: body.audience || 'Multiple stakeholders',
          duration: 30, // Comprehensive messaging framework
          keyMessages: body.keyMessages || [
            'Core value proposition',
            'Key differentiators',
            'Proof points',
            'Call to action'
          ],
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
        occasion: 'messaging-framework',
        keyMessages: data.keyMessages
      }
    })

  } catch (error) {
    console.error('Messaging framework generation error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate'
    }, { status: 500 })
  }
}