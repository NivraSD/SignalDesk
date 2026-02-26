import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Use blog post tool with thought leadership style
    const response = await fetch(`${SUPABASE_URL}/functions/v1/mcp-content`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
      body: JSON.stringify({
        tool: 'generate_blog_post',
        arguments: {
          title: body.title || body.headline || 'Thought Leadership Article',
          topic: body.topic || body.prompt || body.message || 'Industry insights',
          outline: body.outline || [],
          targetAudience: body.audience || 'Industry leaders and decision makers',
          wordCount: body.wordCount || 1200,
          style: 'thought_leadership',
          includeCTA: body.includeCTA !== false
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
        title: data.title,
        wordCount: data.wordCount,
        style: 'thought-leadership',
        seoScore: data.seoScore
      }
    })

  } catch (error) {
    console.error('Thought leadership generation error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate'
    }, { status: 500 })
  }
}