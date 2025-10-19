import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const response = await fetch(`${SUPABASE_URL}/functions/v1/google-visual-generation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
      body: JSON.stringify({
        ...body,
        type: 'video',
        duration: body.duration || 30,
        style: body.style || 'professional'
      })
    })

    if (!response.ok) {
      throw new Error(`Edge function returned ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json({
      success: true,
      content: {
        videoUrl: data.videoUrl || data.url || data.video,
        jobId: data.jobId,
        status: data.status || 'processing',
        metadata: data.metadata
      }
    })

  } catch (error) {
    console.error('Video generation error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate video'
    }, { status: 500 })
  }
}