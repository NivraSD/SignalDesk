import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY

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

    if (!GOOGLE_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'GOOGLE_API_KEY is not configured. Add it to your environment variables.' },
        { status: 500 }
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

    // Skip if already has a cover image (unless regenerating)
    if (content.cover_image_url && !regenerate) {
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

    const prompt = `Generate a professional editorial cover image for an article titled '${content.title}'. ${snippet ? `Topic: ${snippet}.` : ''} Abstract, modern, warm earth tones, dark background. No text, no faces, no people. Wide 16:9 aspect ratio composition.`

    // Call Gemini 2.5 Flash Image via Google AI API (no Vertex AI billing needed)
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${GOOGLE_API_KEY}`

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          responseModalities: ['IMAGE', 'TEXT'],
          temperature: 1.0,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 8192
        }
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Gemini Flash image error:', response.status, errorText)
      throw new Error(`Gemini API returned ${response.status}: ${errorText.slice(0, 200)}`)
    }

    const data = await response.json()

    // Extract image from response
    let imageBase64: string | null = null
    let mimeType = 'image/png'

    if (data.candidates?.[0]?.content?.parts) {
      for (const part of data.candidates[0].content.parts) {
        if (part.inlineData?.data) {
          imageBase64 = part.inlineData.data
          mimeType = part.inlineData.mimeType || 'image/png'
          break
        }
      }
    }

    if (!imageBase64) {
      throw new Error('Image generation did not return a valid image')
    }

    // Upload to Supabase Storage
    const ext = mimeType === 'image/jpeg' ? 'jpg' : 'png'
    const filePath = `cover-images/${contentId}-${Date.now()}.${ext}`
    const imageBuffer = Buffer.from(imageBase64, 'base64')

    // Ensure the bucket exists (ignore error if already exists)
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

    let coverImageUrl: string

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      // Fall back to data URL stored directly in DB
      coverImageUrl = `data:${mimeType};base64,${imageBase64}`
    } else {
      // Get public URL from storage
      const { data: { publicUrl } } = supabase.storage
        .from('cover-images')
        .getPublicUrl(filePath)
      coverImageUrl = publicUrl
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
