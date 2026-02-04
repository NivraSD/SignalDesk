import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { contentId, regenerate } = body

    if (!contentId) {
      return NextResponse.json(
        { success: false, error: 'contentId is required' },
        { status: 400 }
      )
    }

    // Fetch the content item + org name
    const { data: content, error: fetchError } = await supabase
      .from('content_library')
      .select('id, title, content, content_type, cover_image_url, organization_id')
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

    // Skip if already has a cover image (unless regenerating)
    if (content.cover_image_url && !regenerate) {
      return NextResponse.json({
        success: true,
        coverImageUrl: content.cover_image_url,
        skipped: true,
      })
    }

    // Get org name for context
    let orgName = ''
    if (content.organization_id) {
      const { data: org } = await supabase
        .from('organizations')
        .select('name')
        .eq('id', content.organization_id)
        .single()
      orgName = org?.name || ''
    }

    // Extract content body for Claude to read
    const bodyText = typeof content.content === 'string'
      ? content.content
      : content.content?.body || content.content?.text || content.content?.content || ''
    // Give Claude enough of the article to understand the topic (first 2000 chars)
    const articleExcerpt = bodyText.slice(0, 2000).trim()

    // Send to niv-content-intelligent-v2 — Claude will read the article and craft the image prompt
    const nivMessage = `Generate a cover image for this thought leadership article being published to the Nivria Media Network.

Title: ${content.title}
${orgName ? `Organization: ${orgName}` : ''}

Article content:
${articleExcerpt}

Create a professional editorial cover image that captures the core theme and mood of this article. The image should work as a 16:9 hero image on a dark-themed publication page. Abstract and conceptual — no text, no faces, no people.`

    console.log('Sending to niv-content-intelligent-v2 for cover image generation...')

    const nivResponse = await fetch(
      `${SUPABASE_URL}/functions/v1/niv-content-intelligent-v2`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          message: nivMessage,
          conversationHistory: [],
          organizationContext: {
            organizationId: content.organization_id || 'system',
            organizationName: orgName || 'Nivria',
            conversationId: `cover-img-${contentId}-${Date.now()}`,
          },
          stage: 'full',
        }),
      }
    )

    if (!nivResponse.ok) {
      const errorText = await nivResponse.text()
      console.error('niv-content-intelligent-v2 error:', nivResponse.status, errorText)
      throw new Error(`Content intelligence returned ${nivResponse.status}`)
    }

    const nivData = await nivResponse.json()
    console.log('niv-content-intelligent-v2 response mode:', nivData.mode)

    // Extract the image URL from the response
    const imageUrl = nivData.imageUrl || nivData.image_url || null

    if (!imageUrl || typeof imageUrl !== 'string') {
      throw new Error(nivData.error || nivData.message || 'No image was generated — Claude may not have called the image tool')
    }

    // If it's a data URL, upload to Supabase Storage for a proper public URL
    let coverImageUrl: string

    if (imageUrl.startsWith('data:')) {
      const match = imageUrl.match(/^data:(image\/\w+);base64,(.+)$/)
      if (!match) {
        throw new Error('Invalid data URL format from image generation')
      }

      const mimeType = match[1]
      const imageBase64 = match[2]
      const ext = mimeType === 'image/jpeg' ? 'jpg' : 'png'
      const filePath = `cover-images/${contentId}-${Date.now()}.${ext}`
      const imageBuffer = Buffer.from(imageBase64, 'base64')

      // Ensure the bucket exists
      await supabase.storage.createBucket('cover-images', {
        public: true,
        fileSizeLimit: 10 * 1024 * 1024,
      }).catch(() => {})

      const { error: uploadError } = await supabase.storage
        .from('cover-images')
        .upload(filePath, imageBuffer, {
          contentType: mimeType,
          upsert: true,
        })

      if (uploadError) {
        console.error('Storage upload error:', uploadError)
        // Fall back to data URL stored directly
        coverImageUrl = imageUrl
      } else {
        const { data: { publicUrl } } = supabase.storage
          .from('cover-images')
          .getPublicUrl(filePath)
        coverImageUrl = publicUrl
      }
    } else {
      // Already a proper URL (e.g. GCS, storage URL)
      coverImageUrl = imageUrl
    }

    // Update content_library with the cover image URL
    const { error: updateError } = await supabase
      .from('content_library')
      .update({ cover_image_url: coverImageUrl })
      .eq('id', contentId)

    if (updateError) {
      console.error('Failed to save cover image URL:', updateError)
    }

    return NextResponse.json({
      success: true,
      coverImageUrl,
    })
  } catch (error) {
    console.error('Cover image generation error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to generate cover image' },
      { status: 500 }
    )
  }
}
