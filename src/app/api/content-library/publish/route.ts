import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isValidVertical } from '@/lib/config/verticals'
import { generateSlug, generateOrgSlug } from '@/lib/utils/slugify'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

const PUBLISHABLE_TYPES = ['thought-leadership', 'press-release']

/**
 * POST - Publish a content item to the media network
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { contentId, vertical, authorName, authorTitle, metaDescription } = body

    if (!contentId || !vertical) {
      return NextResponse.json(
        { success: false, error: 'contentId and vertical are required' },
        { status: 400 }
      )
    }

    if (!isValidVertical(vertical)) {
      return NextResponse.json(
        { success: false, error: `Invalid vertical: ${vertical}` },
        { status: 400 }
      )
    }

    // Fetch the content item
    const { data: content, error: fetchError } = await supabase
      .from('content_library')
      .select('id, title, content_type, organization_id, content_slug, published_at')
      .eq('id', contentId)
      .single()

    if (fetchError || !content) {
      return NextResponse.json(
        { success: false, error: 'Content not found' },
        { status: 404 }
      )
    }

    // Validate content type
    if (!PUBLISHABLE_TYPES.includes(content.content_type)) {
      return NextResponse.json(
        { success: false, error: `Only ${PUBLISHABLE_TYPES.join(' and ')} content can be published` },
        { status: 400 }
      )
    }

    // Generate slug from title
    const slug = content.content_slug || generateSlug(content.title)

    // Ensure org has a slug
    const { data: org } = await supabase
      .from('organizations')
      .select('id, name, slug')
      .eq('id', content.organization_id)
      .single()

    if (org && !org.slug) {
      const orgSlug = generateOrgSlug(org.name)
      await supabase
        .from('organizations')
        .update({ slug: orgSlug })
        .eq('id', org.id)
    }

    // Build canonical URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL
      || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
      || 'https://nivria.ai'
    const canonicalUrl = `${baseUrl}/media/${vertical}/${slug}`

    // Publish: set published_at, clear unpublished_at
    const { error: updateError } = await supabase
      .from('content_library')
      .update({
        published_at: new Date().toISOString(),
        unpublished_at: null,
        content_slug: slug,
        vertical,
        canonical_url: canonicalUrl,
        author_name: authorName || null,
        author_title: authorTitle || null,
        meta_description: metaDescription || null,
      })
      .eq('id', contentId)

    if (updateError) {
      console.error('Publish error:', updateError)
      // Handle unique constraint violation (slug already taken in this vertical)
      if (updateError.code === '23505') {
        return NextResponse.json(
          { success: false, error: 'A published article with this slug already exists in this vertical' },
          { status: 409 }
        )
      }
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      publishedUrl: canonicalUrl,
      slug,
      vertical,
    })
  } catch (error) {
    console.error('Publish error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to publish' },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Unpublish a content item (soft delete via unpublished_at)
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { contentId } = body

    if (!contentId) {
      return NextResponse.json(
        { success: false, error: 'contentId is required' },
        { status: 400 }
      )
    }

    const { error: updateError } = await supabase
      .from('content_library')
      .update({ unpublished_at: new Date().toISOString() })
      .eq('id', contentId)

    if (updateError) {
      console.error('Unpublish error:', updateError)
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Content unpublished successfully',
    })
  } catch (error) {
    console.error('Unpublish error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to unpublish' },
      { status: 500 }
    )
  }
}
