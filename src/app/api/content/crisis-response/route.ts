import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Use press release tool with crisis-specific tone
    const response = await fetch(`${SUPABASE_URL}/functions/v1/mcp-content`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
      body: JSON.stringify({
        tool: 'generate_press_release',
        arguments: {
          headline: body.headline || body.title || 'Company Response',
          subheadline: body.subheadline || 'Official Statement',
          keyPoints: body.keyPoints || [body.prompt || body.message || 'Crisis response statement'],
          quotes: body.quotes || [],
          boilerplate: body.boilerplate || '',
          tone: 'formal' // Crisis responses are formal and measured
        }
      })
    })

    if (!response.ok) {
      throw new Error(`Edge function returned ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json({
      success: true,
      content: data.content || data,
      metadata: {
        headline: data.headline,
        wordCount: data.wordCount,
        tone: 'crisis-response'
      }
    })

  } catch (error) {
    console.error('Crisis response generation error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate'
    }, { status: 500 })
  }
}