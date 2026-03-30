import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Use executive talking points tool for Q&A format
    const response = await fetch(`${SUPABASE_URL}/functions/v1/mcp-content`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
      body: JSON.stringify({
        tool: 'generate_executive_talking_points',
        arguments: {
          occasion: 'internal_meeting', // Q&A documents are often for internal use
          topic: body.topic || body.prompt || body.message || 'Q&A Document',
          audience: body.audience || 'Internal team',
          duration: 15, // Typical Q&A session duration
          keyMessages: body.keyMessages || ['Address common questions'],
          anticipatedQuestions: body.questions || body.anticipatedQuestions || [
            'What are the key points?',
            'How does this affect our team?',
            'What are the next steps?'
          ]
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
        occasion: 'q&a-document',
        duration: data.duration,
        prepTime: data.prepTime
      }
    })

  } catch (error) {
    console.error('Q&A document generation error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate'
    }, { status: 500 })
  }
}