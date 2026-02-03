import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

export async function POST(request: NextRequest) {
  try {
    const { contentId } = await request.json()

    if (!contentId) {
      return NextResponse.json(
        { success: false, error: 'contentId is required' },
        { status: 400 }
      )
    }

    // Fetch the content item
    const { data: content, error: fetchError } = await supabase
      .from('content_library')
      .select('id, title, content, content_type, cover_image_url')
      .eq('id', contentId)
      .single()

    if (fetchError || !content) {
      return NextResponse.json(
        { success: false, error: 'Content not found' },
        { status: 404 }
      )
    }

    // Only generate for thought-leadership
    if (content.content_type !== 'thought-leadership') {
      return NextResponse.json(
        { success: false, error: 'Cover images are only generated for thought-leadership content' },
        { status: 400 }
      )
    }

    // Skip if already has a cover image
    if (content.cover_image_url) {
      return NextResponse.json({
        success: true,
        coverImageUrl: content.cover_image_url,
        skipped: true,
      })
    }

    // Build prompt from title + first 200 chars of content body
    const bodyText = typeof content.content === 'string'
      ? content.content
      : content.content?.body || content.content?.text || content.content?.content || ''
    const snippet = bodyText.slice(0, 200).replace(/\n/g, ' ').trim()

    const prompt = `Professional editorial cover image for an article titled '${content.title}'. ${snippet ? `Topic: ${snippet}.` : ''} Abstract, modern, warm earth tones, dark background. No text, no faces.`

    // Call Vertex AI edge function (same pattern as /api/visual/image/route.ts)
    const response = await fetch(`${SUPABASE_URL}/functions/v1/vertex-ai-visual`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
      body: JSON.stringify({
        type: 'image',
        prompt,
        aspectRatio: '16:9',
        style: 'professional',
        numberOfImages: 1,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Vertex AI Visual error:', errorText)
      throw new Error(`Edge function returned ${response.status}`)
    }

    const data = await response.json()

    if (!data.success || !data.images || data.images.length === 0) {
      throw new Error('Image generation did not return a valid image')
    }

    const imageUrl = data.images[0].url

    // Write the cover image URL back to content_library
    const { error: updateError } = await supabase
      .from('content_library')
      .update({ cover_image_url: imageUrl })
      .eq('id', contentId)

    if (updateError) {
      console.error('Failed to save cover image URL:', updateError)
      throw new Error('Failed to save cover image URL')
    }

    return NextResponse.json({
      success: true,
      coverImageUrl: imageUrl,
    })
  } catch (error) {
    console.error('Cover image generation error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to generate cover image' },
      { status: 500 }
    )
  }
}
