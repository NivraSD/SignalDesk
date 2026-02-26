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
        tool: 'generate_blog_post',
        arguments: {
          title: body.title || body.headline || 'Blog Post',
          topic: body.topic || body.prompt || body.message || 'Generate blog content',
          outline: body.outline || [],
          targetAudience: body.audience || body.targetAudience || 'General audience',
          wordCount: body.wordCount || 800,
          style: body.style || 'educational',
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
        style: data.style,
        seoScore: data.seoScore
      }
    })

  } catch (error) {
    console.error('Blog post generation error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate blog post'
    }, { status: 500 })
  }
}