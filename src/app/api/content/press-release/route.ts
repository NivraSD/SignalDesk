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
        tool: 'generate_press_release',
        arguments: {
          headline: body.headline || body.title || 'Company Announcement',
          subheadline: body.subheadline || body.subtitle || '',
          keyPoints: body.keyPoints || [body.prompt || body.message || 'Generate press release content'],
          quotes: body.quotes || [],
          boilerplate: body.boilerplate || body.organization || '',
          tone: body.tone || 'formal'
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
        tone: data.tone
      }
    })

  } catch (error) {
    console.error('Press release generation error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate press release'
    }, { status: 500 })
  }
}