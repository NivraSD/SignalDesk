import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const response = await fetch(`${SUPABASE_URL}/functions/v1/gamma-presentation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
      body: JSON.stringify({
        ...body,
        slides: body.slideCount || 10,
        template: body.template || 'corporate',
        includeCharts: true
      })
    })

    if (!response.ok) {
      throw new Error(`Edge function returned ${response.status}`)
    }

    const data = await response.json()

    // Handle Gamma's response - it might be pending
    let presentationUrl = data.gammaUrl || data.url || data.presentationUrl

    // If no URL yet but we have a generation ID, construct the URL
    if (!presentationUrl && data.generationId) {
      presentationUrl = `https://gamma.app/docs/${data.generationId}`
    }

    return NextResponse.json({
      success: true,
      content: {
        presentationUrl: presentationUrl,
        embedUrl: data.embedUrl,
        slideCount: data.slideCount || data.metadata?.numCards,
        metadata: {
          ...data.metadata,
          generationId: data.generationId,
          status: data.status,
          message: data.message
        }
      }
    })

  } catch (error) {
    console.error('Presentation generation error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate presentation'
    }, { status: 500 })
  }
}