import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const response = await fetch(`${SUPABASE_URL}/functions/v1/vertex-ai-visual`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
      body: JSON.stringify({
        type: 'image',  // IMPORTANT: specify type for vertex-ai-visual
        prompt: body.prompt,
        aspectRatio: body.aspectRatio || '16:9',
        style: body.style || 'professional',
        numberOfImages: 1
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Vertex AI Visual error:', errorText)
      throw new Error(`Edge function returned ${response.status}`)
    }

    const data = await response.json()

    // Handle the response format from vertex-ai-visual
    if (data.success && data.images && data.images.length > 0) {
      // Successfully generated image
      return NextResponse.json({
        success: true,
        content: {
          imageUrl: data.images[0].url,
          prompt: data.prompt,
          metadata: {
            ...data.images[0].metadata,
            style: body.style || 'professional'
          }
        }
      })
    } else if (data.fallback) {
      // Fallback response
      console.log('Using fallback response:', data.fallback)
      // Return a placeholder or error message
      return NextResponse.json({
        success: false,
        error: data.error || 'Image generation failed',
        content: {
          // Use a data URL instead of external service to avoid DNS issues
          imageUrl: `data:image/svg+xml;base64,${Buffer.from(`
            <svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
              <rect width="800" height="600" fill="#f3f4f6"/>
              <text x="400" y="280" font-family="Arial, sans-serif" font-size="24" fill="#6b7280" text-anchor="middle">
                Image Generation in Progress
              </text>
              <text x="400" y="320" font-family="Arial, sans-serif" font-size="16" fill="#9ca3af" text-anchor="middle">
                ${data.fallback?.instructions || 'Please try a different prompt'}
              </text>
            </svg>
          `).toString('base64')}`,
          prompt: body.prompt,
          metadata: {
            fallback: true,
            message: data.fallback.instructions
          }
        }
      })
    } else {
      throw new Error('Unexpected response format from vertex-ai-visual')
    }

  } catch (error) {
    console.error('Image generation error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate image'
    }, { status: 500 })
  }
}